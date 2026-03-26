/**
 * userInterestTracker.js — Real-time User Affinity Management
 * ─────────────────────────────────────────────────────────────────────────────
 * Part of Phase 3: Personalization.
 * Tracks user interaction with specific hashtags (categories) and creators.
 * These "interests" are stored in a Redis Hash for O(1) lookup during feed 
 * generation, allowing the scorer to apply a 1.25x personalization boost.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import redisClient from '../config/redisClient.js';
import logger from './logger.js';

const INTEREST_KEY_PREFIX = 'user:interests:';
const INTEREST_TTL = 3600 * 24 * 30; // 30 days
const MAX_INTERESTS_PER_USER = 50; // Pruning threshold for memory efficiency

/**
 * Lua Script: Atomically update interest and prune if > 50 fields.
 * This prevents Redis memory fragmentation and "ghost affinity" from 3-year-old trends.
 */
const TRACK_INTEREST_LUA = `
local key = KEYS[1]
local field = ARGV[1]
local weight = tonumber(ARGV[2])
local max_fields = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

-- 1. Increment the specific interest
redis.call('HINCRBY', key, field, weight)

-- 2. Check if we need to prune
local fields = redis.call('HKEYS', key)
if #fields > max_fields then
    -- Simple Pruning: Get all values, sort by score, and keep top X
    local all_data = redis.call('HGETALL', key)
    local items = {}
    for i = 1, #all_data, 2 do
        table.insert(items, {field = all_data[i], score = tonumber(all_data[i+1])})
    end
    
    table.sort(items, function(a, b) return a.score > b.score end)
    
    -- Delete everything except top max_fields
    redis.call('DEL', key)
    for i = 1, math.min(#items, max_fields) do
        redis.call('HSET', key, items[i].field, items[i].score)
    end
end

redis.call('EXPIRE', key, ttl)
return 1
`;

/**
 * Increment user's interest in tags or editors with atomic pruning.
 */
export const trackInterest = async (userId, tags = [], editorId = null, weight = 1) => {
    if (!userId || (!tags.length && !editorId)) return;

    const key = `${INTEREST_KEY_PREFIX}${userId}`;
    
    try {
        // We process tags and editor sequentially but in a promise block
        const tasks = [];

        // Track tags
        tags.forEach(tag => {
            const cleanTag = tag.replace('#', '').toLowerCase();
            tasks.push(redisClient.eval(TRACK_INTEREST_LUA, {
                keys: [key],
                arguments: [`t:${cleanTag}`, weight.toString(), MAX_INTERESTS_PER_USER.toString(), INTEREST_TTL.toString()]
            }));
        });

        // Track creator
        if (editorId) {
            tasks.push(redisClient.eval(TRACK_INTEREST_LUA, {
                keys: [key],
                arguments: [`e:${editorId.toString()}`, weight.toString(), MAX_INTERESTS_PER_USER.toString(), INTEREST_TTL.toString()]
            }));
        }

        await Promise.all(tasks);
    } catch (err) {
        logger.error(`[INTEREST] Redis Lua error for user ${userId}:`, err);
    }
};

/**
 * Get the full interest vector for a user.
 */
export const getUserInterests = async (userId) => {
    if (!userId) return {};
    const key = `${INTEREST_KEY_PREFIX}${userId}`;
    try {
        const data = await redisClient.hGetAll(key);
        return data || {};
    } catch (err) {
        return {};
    }
};

/**
 * Calculate the personalization multiplier for a specific reel.
 * Score is cumulative across tags and creator affinity.
 */
export const getPersonalizationBoost = (reel, userInterests) => {
    if (!userInterests || Object.keys(userInterests).length === 0) return 1.0;

    let totalPoints = 0;
    const editorId = reel.editor?._id?.toString() || reel.editor?.toString() || 'unknown';
    const tags = reel.hashtags || [];

    // Creator affinity (Heavy weight)
    if (userInterests[`e:${editorId}`]) {
        totalPoints += parseInt(userInterests[`e:${editorId}`]);
    }

    // Tag affinity
    tags.forEach(tag => {
        const cleanTag = tag.replace('#', '').toLowerCase();
        if (userInterests[`t:${cleanTag}`]) {
            totalPoints += parseInt(userInterests[`t:${cleanTag}`]);
        }
    });

    // Tiered Boost Model:
    // 1-9 points:   1.05x (New/Mild interest)
    // 10-49 points: 1.25x (Solid interest)
    // 50+ points:   1.50x (Super fans/Power categories)
    if (totalPoints >= 50) return 1.50;
    if (totalPoints >= 10) return 1.25;
    if (totalPoints >= 1)  return 1.05;
    
    return 1.0;
};
