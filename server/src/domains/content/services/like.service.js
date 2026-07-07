import redisProxy from '../../../infrastructure/cache/redis.client.js';
import logger from '../../../infrastructure/monitoring/logger.js';

/**
 * Handle a like/unlike toggle optimally using Redis
 * @param {string} type - 'POST', 'REEL', 'YOUTUBE_POST', 'POLL'
 * @param {string} id - The content ID
 * @param {string} userId - The user ID
 */
export const toggleLike = async (type, id, userId) => {
    // We use the proxy which handles fallback/reconnections
    if (!redisProxy) {
        throw new Error("Redis is required for this operation");
    }

    const setKey = `feed:likes:users:${type}:${id}`;
    const countKey = `feed:likes:count:${type}:${id}`;
    const dirtyKey = `feed:likes:dirty`;

    // 1. Check if user already liked
    const isMember = await redisProxy.sismember(setKey, userId);

    let isLikedNow = false;

    if (isMember) {
        // Unlike
        await redisProxy.srem(setKey, userId);
        await redisProxy.decr(countKey);
        isLikedNow = false;
    } else {
        // Like
        await redisProxy.sadd(setKey, userId);
        await redisProxy.incr(countKey);
        isLikedNow = true;
    }

    // 2. Add to dirty set so the worker knows it needs syncing
    const itemKey = `${type}:${id}`;
    await redisProxy.sadd(dirtyKey, itemKey);

    return { isLiked: isLikedNow };
};

/**
 * Helper to fetch the current count from Redis, falling back to DB eventually
 */
export const getLikeCount = async (type, id) => {
    const countKey = `feed:likes:count:${type}:${id}`;
    const val = await redisProxy.get(countKey);
    return val ? parseInt(val, 10) : null;
};
