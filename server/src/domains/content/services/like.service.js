import prisma from '../../../infrastructure/database/postgres.js';
import logger from '../../../infrastructure/monitoring/logger.js';
import redisProxy from '../../../infrastructure/cache/redis.client.js';
import { likeSyncQueue } from '../../../infrastructure/queue/workers/queues.js';

/**
 * Handle a like/unlike via Redis buffer
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

    const setKey = `feed:likes:users:${type}:${id}`;
    const countKey = `feed:likes:count:${type}:${id}`;
    const dirtyKey = `feed:likes:dirty`;
    const itemKey = `${type}:${id}`;

    // Ensure cache is hydrated before modifying
    const countExists = await redisProxy.exists(countKey);
    if (!countExists) {
        await hydrateCache(type, id);
    }

    // Ensure we know the desired action if it's a toggle.
    // If not specified, we check if the user is in the set.
    let isCurrentlyLiked = false;
    if (action === "") {
        const isMember = await redisProxy.sismember(setKey, userId);
        isCurrentlyLiked = !!isMember;
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
        const ttl = Number(process.env.LIKE_CACHE_TTL || 86400);

        // Lua script for atomic operations
        // ARGV[1] = shouldLike (1 or 0), ARGV[2] = userId, ARGV[3] = itemKey, ARGV[4] = timestamp, ARGV[5] = ttl
        const luaScript = `
            local setKey = KEYS[1]
            local countKey = KEYS[2]
            local dirtyKey = KEYS[3]
            local shouldLike = tonumber(ARGV[1])
            local userId = ARGV[2]
            local itemKey = ARGV[3]
            local timestamp = ARGV[4]
            local ttl = tonumber(ARGV[5])
            local modified = 0
            
            if shouldLike == 1 then
                modified = redis.call('SADD', setKey, userId)
                if modified == 1 then
                    redis.call('INCR', countKey)
                end
            else
                modified = redis.call('SREM', setKey, userId)
                if modified == 1 then
                    redis.call('DECR', countKey)
                end
            end
            
            if modified == 1 then
                redis.call('ZADD', dirtyKey, timestamp, itemKey)
                redis.call('EXPIRE', setKey, ttl)
                redis.call('EXPIRE', countKey, ttl)
            end
            
            return redis.call('GET', countKey)
        `;

        const newCountStr = await redisProxy.eval(
            luaScript,
            3, // numkeys
            setKey,
            countKey,
            dirtyKey,
            shouldLike ? 1 : 0,
            userId,
            itemKey,
            Date.now(),
            ttl
        );

        // Check threshold and debounce
        const dirtySize = await redisProxy.zcard(dirtyKey);
        const threshold = Number(process.env.LIKE_SYNC_THRESHOLD || 500);

        if (dirtySize >= threshold) {
            logger.info(`🚨 [LIKE_SYNC] Threshold reached! Dirty Queue Size: ${dirtySize}/${threshold}. Triggering BullMQ sync worker...`);
            if (likeSyncQueue) {
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
 * Hydrates Redis cache from PostgreSQL
 */
export const hydrateCache = async (type, id) => {
    let LikeModel;
    let ContentModel;
    let parentIdField;
    
    if (type === "POST") { LikeModel = prisma.postLike; ContentModel = prisma.post; parentIdField = "postId"; }
    else if (type === "REEL") { LikeModel = prisma.reelLike; ContentModel = prisma.reel; parentIdField = "reelId"; }
    else if (type === "YOUTUBE_POST") { LikeModel = prisma.youtubePostLike; ContentModel = prisma.youtubePost; parentIdField = "youtubePostId"; }
    else if (type === "POLL") { LikeModel = prisma.pollLike; ContentModel = prisma.poll; parentIdField = "pollId"; }
    else return;

    const [likes, content] = await Promise.all([
        LikeModel.findMany({ where: { [parentIdField]: id }, select: { userId: true } }),
        ContentModel.findUnique({ where: { id }, select: { like_count: true } })
    ]);

    const setKey = `feed:likes:users:${type}:${id}`;
    const countKey = `feed:likes:count:${type}:${id}`;
    const userIds = likes.map(l => l.userId);
    const count = content ? content.like_count : 0;
    const ttl = Number(process.env.LIKE_CACHE_TTL || 86400); // Default 24h

    const pipeline = redisProxy.pipeline();
    pipeline.set(countKey, count, "EX", ttl);
    if (userIds.length > 0) {
        pipeline.sadd(setKey, ...userIds);
        pipeline.expire(setKey, ttl);
    }
    await pipeline.exec();
};
