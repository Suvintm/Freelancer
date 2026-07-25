import prisma from '../../../infrastructure/database/postgres.js';
import logger from '../../../infrastructure/monitoring/logger.js';
import redisProxy from '../../../infrastructure/cache/redis.client.js';
import { likeSyncQueue } from '../../../infrastructure/queue/workers/queues.js';

let zcardCheckCounter = 0;

/**
 * Handle a like/unlike via Redis delta buffer
 * @param {string} type - 'POST', 'REEL', 'YOUTUBE_POST', 'POLL'
 * @param {string} id - The content ID
 * @param {string} userId - The user ID
 * @param {string} action - 'like' or 'unlike' (optional, falls back to toggle)
 */
export const toggleLike = async (type, id, userId, action = "") => {
    const validTypes = ["POST", "REEL", "YOUTUBE_POST", "POLL"];
    if (!validTypes.includes(type)) {
      throw new Error(`Unsupported content type: ${type}`);
    }

    const deltaKey = `feed:likes:delta:${type}:${id}`;
    const countKey = `feed:likes:count:${type}:${id}`;
    const dirtyKey = `feed:likes:dirty`;
    const itemKey = `${type}:${id}`;

    // Ensure count cache is hydrated before modifying
    const countExists = await redisProxy.exists(countKey);
    if (!countExists) {
        await hydrateCache(type, id);
    }

    // Ensure we know the desired action if it's a toggle.
    // Check the Redis delta hash first, falling back to PostgreSQL if not present.
    let isCurrentlyLiked = false;
    if (action === "") {
        const deltaVal = await redisProxy.hget(deltaKey, userId);
        if (deltaVal === "1") {
            isCurrentlyLiked = true;
        } else if (deltaVal === "0") {
            isCurrentlyLiked = false;
        } else {
            // Not in active delta buffer, query Postgres
            let LikeModel, parentIdField;
            if (type === "POST") { LikeModel = prisma.postLike; parentIdField = "postId"; }
            else if (type === "REEL") { LikeModel = prisma.reelLike; parentIdField = "reelId"; }
            else if (type === "YOUTUBE_POST") { LikeModel = prisma.youtubePostLike; parentIdField = "youtubePostId"; }
            else if (type === "POLL") { LikeModel = prisma.pollLike; parentIdField = "pollId"; }

            const likedInDb = await LikeModel.findUnique({
                where: {
                    [`${parentIdField}_userId`]: {
                        [parentIdField]: id,
                        userId
                    }
                }
            });
            isCurrentlyLiked = !!likedInDb;
        }
    }

    const shouldLike = action === "like" ? true : (action === "unlike" ? false : !isCurrentlyLiked);

    if (shouldLike) {
        const postRateLimitKey = `rl:like:post:${userId}:${type}:${id}`;
        const globalRateLimitKey = `rl:like:global:${userId}`;
        const rateLimitLua = `
            local postKey = KEYS[1]
            local globalKey = KEYS[2]

            local postCount = redis.call('INCR', postKey)
            if postCount == 1 then
                redis.call('EXPIRE', postKey, 60)
            end

            if postCount > 5 then
                return -1
            end

            local globalCount = redis.call('INCR', globalKey)
            if globalCount == 1 then
                redis.call('EXPIRE', globalKey, 60)
            end

            if globalCount > 30 then
                redis.call('DECR', postKey)
                return -2
            end

            return 1
        `;

        const rlResult = await redisProxy.eval(rateLimitLua, 2, postRateLimitKey, globalRateLimitKey);
        
        if (rlResult === -1) {
            const err = new Error("RATE_LIMIT_POST");
            err.code = "RATE_LIMIT_POST";
            throw err;
        } else if (rlResult === -2) {
            const err = new Error("RATE_LIMIT_GLOBAL");
            err.code = "RATE_LIMIT_GLOBAL";
            throw err;
        }
    }

    try {
        // Lua script for atomic operations using Delta Model (Hash + Counter)
        // ARGV[1] = shouldLike (1 or 0), ARGV[2] = userId, ARGV[3] = itemKey, ARGV[4] = timestamp
        // Expiration is managed upon worker completion (DEL) rather than reset per action.
        const luaScript = `
            local deltaKey = KEYS[1]
            local countKey = KEYS[2]
            local dirtyKey = KEYS[3]
            local shouldLike = tonumber(ARGV[1])
            local userId = ARGV[2]
            local itemKey = ARGV[3]
            local timestamp = ARGV[4]
            
            -- Read current state from delta hash to check for modifications
            local existingDelta = redis.call('HGET', deltaKey, userId)
            local modified = 0
            
            if shouldLike == 1 then
                if not existingDelta or existingDelta == "0" then
                    redis.call('HSET', deltaKey, userId, "1")
                    redis.call('INCR', countKey)
                    modified = 1
                end
            else
                if not existingDelta or existingDelta == "1" then
                    redis.call('HSET', deltaKey, userId, "0")
                    redis.call('DECR', countKey)
                    modified = 1
                end
            end
            
            if modified == 1 then
                redis.call('ZADD', dirtyKey, timestamp, itemKey)
            end
            
            return redis.call('GET', countKey)
        `;

        const newCountStr = await redisProxy.eval(
            luaScript,
            3, // numkeys
            deltaKey,
            countKey,
            dirtyKey,
            shouldLike ? 1 : 0,
            userId,
            itemKey,
            Date.now()
        );

        // Check threshold and debounce (Sampled to avoid calling ZCARD on every single like write)
        zcardCheckCounter++;
        const sampleRate = Number(process.env.LIKE_ZCARD_SAMPLE_RATE || 10);
        if (zcardCheckCounter % sampleRate === 0) {
            const dirtySize = await redisProxy.zcard(dirtyKey);
            const threshold = Number(process.env.LIKE_SYNC_THRESHOLD || 500);

            if (dirtySize >= threshold) {
                logger.info(`🚨 [LIKE_SYNC] Threshold reached! Dirty Queue Size: ${dirtySize}/${threshold}. Triggering BullMQ sync worker...`);
                if (likeSyncQueue && process.env.ENABLE_LIKE_SYNC_WORKER === 'true') {
                    // Trigger worker immediately, but debounce with a fixed jobId
                    await likeSyncQueue.add(
                        "sync-likes-threshold",
                        { triggerReason: "threshold", dirtySize },
                        { jobId: "like-sync" }
                    );
                }
            } else {
                logger.info(`✨ [LIKE_SYNC] Buffered in Redis. Dirty Queue Size: ${dirtySize}/${threshold}. Action: ${shouldLike ? 'LIKE' : 'UNLIKE'}`);
            }
        }

        return { isLiked: shouldLike, count: parseInt(newCountStr || "0", 10) };
    } catch (error) {
        logger.error(`❌ [LIKE_SERVICE] toggleLike failure: ${error.message}`);
        // Fallback to read
        return { isLiked: shouldLike, count: await getLikeCount(type, id) };
    }
};

/**
 * Helper to fetch the current count from DB (used for cache hydration or fallbacks)
 */
export const getLikeCount = async (type, id) => {
    let ContentModel;
    if (type === "POST") ContentModel = prisma.post;
    else if (type === "REEL") ContentModel = prisma.reel;
    else if (type === "YOUTUBE_POST") ContentModel = prisma.youtubePost;
    else if (type === "POLL") ContentModel = prisma.poll;
    else return 0;
    
    const current = await ContentModel.findUnique({ where: { id }, select: { like_count: true } });
    return current ? current.like_count : 0;
};

/**
 * Hydrates ONLY the count cache from PostgreSQL (no users list!)
 */
export const hydrateCache = async (type, id) => {
    let ContentModel;
    if (type === "POST") ContentModel = prisma.post;
    else if (type === "REEL") ContentModel = prisma.reel;
    else if (type === "YOUTUBE_POST") ContentModel = prisma.youtubePost;
    else if (type === "POLL") ContentModel = prisma.poll;
    else return;

    const content = await ContentModel.findUnique({ where: { id }, select: { like_count: true } });
    const countKey = `feed:likes:count:${type}:${id}`;
    const count = content ? content.like_count : 0;
    const ttl = Number(process.env.LIKE_CACHE_TTL || 86400); // Default 24h

    await redisProxy.set(countKey, count, "EX", ttl);
};
