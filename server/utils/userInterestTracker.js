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
const DEFAULT_BOOST = 1.0;
const INTEREST_TTL = 3600 * 24 * 30; // 30 days of data

/**
 * Increment user's interest in tags or editors.
 * @param {string} userId
 * @param {Array}  tags     — Array of hashtags
 * @param {string} editorId — ID of the creator
 * @param {number} weight   — How much to boost (e.g. 1 for view, 5 for like)
 */
export const trackInterest = async (userId, tags = [], editorId = null, weight = 1) => {
    if (!userId || (!tags.length && !editorId)) return;

    const key = `${INTEREST_KEY_PREFIX}${userId}`;
    const pipeline = redisClient.pipeline();

    // Increment tag interests
    tags.forEach(tag => {
        const cleanTag = tag.replace('#', '').toLowerCase();
        pipeline.hincrby(key, `t:${cleanTag}`, weight);
    });

    // Increment creator interest
    if (editorId) {
        pipeline.hincrby(key, `e:${editorId}`, weight);
    }

    // Set TTL to auto-expire cold data
    pipeline.expire(key, INTEREST_TTL);

    try {
        await pipeline.exec();
        // logger.debug(`[INTEREST] Updated for user ${userId}: ${tags.length} tags, editor:${editorId} weight:${weight}`);
    } catch (err) {
        logger.error(`[INTEREST] Redis error for user ${userId}:`, err);
    }
};

/**
 * Get the full interest vector for a user.
 * @returns {Object} { 't:music': 15, 'e:123': 5 }
 */
export const getUserInterests = async (userId) => {
    if (!userId) return {};
    const key = `${INTEREST_KEY_PREFIX}${userId}`;
    try {
        return await redisClient.hGetAll(key) || {};
    } catch (err) {
        return {};
    }
};

/**
 * Calculate the personalization multiplier for a specific reel.
 * Returns 1.25x if the user has strong interest in this reel's tags or creator.
 */
export const getPersonalizationBoost = (reel, userInterests) => {
    if (!userInterests || Object.keys(userInterests).length === 0) return 1.0;

    let totalInterest = 0;
    const editorId = reel.editor?._id || reel.editor;
    const tags = reel.hashtags || [];

    // Check creator affinity
    if (editorId && userInterests[`e:${editorId}`]) {
        totalInterest += parseInt(userInterests[`e:${editorId}`]);
    }

    // Check tag affinity
    tags.forEach(tag => {
        const cleanTag = tag.replace('#', '').toLowerCase();
        if (userInterests[`t:${cleanTag}`]) {
            totalInterest += parseInt(userInterests[`t:${cleanTag}`]);
        }
    });

    // If user has > 10 cumulative interaction points, give a 1.25x boost
    // This allows for a binary "Interested" vs "Default" state in the composite score.
    return totalInterest >= 10 ? 1.25 : 1.0;
};
