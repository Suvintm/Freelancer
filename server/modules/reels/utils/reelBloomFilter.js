/**
 * reelBloomFilter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Space-efficient "already seen" tracking using a custom Bloom Filter built
 * on Redis bitfields. No RedisBloom module required.
 *
 * Why Bloom Filter over an array/set?
 *   - Array of 100 reel IDs  = ~2,400 bytes in Redis
 *   - Bloom Filter for 1000  = ~150 bytes in Redis (16x more efficient)
 *   - Lookup: O(k) where k = number of hash functions (we use k=3)
 *   - False positive rate at 1000 items: ~1% (acceptable — worst case = one repeat shown)
 *
 * Structure:
 *   Redis key: `bloom:seen:{userId}`
 *   Value: a bitstring of BLOOM_BITS bits
 *   k=3 independent hash functions → set/check 3 bit positions per item
 *
 * Operations:
 *   markSeen(userId, reelId) — add reelId to user's seen filter
 *   hasSeen(userId, reelId)  — check if reelId was (probably) seen
 *   clearSeen(userId)        — reset (useful after pagination wrap-around)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import redisClient, { redisAvailable } from '../../../config/redisClient.js';
import logger from '../../../utils/logger.js';

// Filter dimensions: 2048 bits = 256 bytes. Supports ~1000 items at ~1% FPR.
const BLOOM_BITS = 2048;
const BLOOM_K    = 3;               // Number of hash functions
const BLOOM_TTL  = 60 * 60 * 6;    // 6 hours — matches a browsing session

/**
 * DJB2 hash function — fast, well-distributed, no dependencies.
 * We seed it with different seeds to create K independent hash functions.
 * @param {string} str
 * @param {number} seed
 * @returns {number} hash value
 */
const hash = (str, seed) => {
    let h = seed ^ 5381;
    for (let i = 0; i < str.length; i++) {
        h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0; // Force unsigned 32-bit
    }
    return h % BLOOM_BITS;
};

/**
 * Generates K bit positions for a given item.
 * Each position comes from a different seed → independent hash functions.
 * @param {string} reelId
 * @returns {number[]} array of K bit positions
 */
const getBitPositions = (reelId) => {
    const seeds = [0x1234abcd, 0xdeadbeef, 0xfeedface]; // 3 seeds for k=3
    return seeds.slice(0, BLOOM_K).map(seed => hash(reelId, seed));
};

/**
 * Add a reelId to the user's Bloom Filter in Redis.
 * Sets K bits in the Redis bitfield.
 * @param {string} userId
 * @param {string} reelId
 */
export const markSeen = async (userId, reelId) => {
    if (!redisAvailable || !redisClient) return;
    const key = `bloom:seen:${userId}`;
    try {
        const positions = getBitPositions(String(reelId));
        // Execute all SETBIT commands in a pipeline for efficiency
        const pipeline = redisClient.pipeline();
        for (const pos of positions) {
            pipeline.setbit(key, pos, 1);
        }
        await pipeline.exec();
        // Refresh TTL on access (sliding window)
        await redisClient.expire(key, BLOOM_TTL);
    } catch (err) {
        logger.warn(`[BloomFilter] markSeen failed for user ${userId}: ${err.message}`);
    }
};

/**
 * Check if a reelId was probably seen by this user.
 * Returns true if ALL K bits are set (probabilistic — can false-positive at ~1%).
 * Returns false if ANY bit is unset (definitive — no false negatives).
 * @param {string} userId
 * @param {string} reelId
 * @returns {Promise<boolean>}
 */
export const hasSeen = async (userId, reelId) => {
    if (!redisAvailable || !redisClient) return false;
    const key = `bloom:seen:${userId}`;
    try {
        const positions = getBitPositions(String(reelId));
        // Check all K bit positions
        const bits = await Promise.all(
            positions.map(pos => redisClient.getbit(key, pos))
        );
        // Only "seen" if ALL K bits are 1
        return bits.every(bit => bit === 1);
    } catch (err) {
        logger.warn(`[BloomFilter] hasSeen failed for user ${userId}: ${err.message}`);
        return false; // Fail open — don't exclude if we can't check
    }
};

/**
 * Reset a user's seen-filter (useful when the feed wraps around / cycles).
 * @param {string} userId
 */
export const clearSeen = async (userId) => {
    if (!redisAvailable || !redisClient) return;
    const key = `bloom:seen:${userId}`;
    try {
        await redisClient.del(key);
        logger.debug(`[BloomFilter] Cleared seen filter for user ${userId}`);
    } catch (err) {
        logger.warn(`[BloomFilter] clearSeen failed for user ${userId}: ${err.message}`);
    }
};






