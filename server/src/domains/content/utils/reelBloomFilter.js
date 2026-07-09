import { redis } from '../../../infrastructure/cache/redis.client.js';

export async function markSeen(userId, reelId) {
    if (!redis) return;
    const key = `user:seen_reels:${userId}`;
    await redis.sadd(key, reelId);
    await redis.expire(key, 60 * 60 * 24 * 7); // 7 days
}
