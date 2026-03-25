/**
 * adPacing.js — Advertisement Frequency Capping & Pacing
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements two key production ad-serving DSA concepts:
 *  1. Frequency Capping: Limits per-user ad repetitions (Sliding Window Counter)
 *  2. Impression Pacing: Ensures even delivery across the day (Token Bucket)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import redisClient from '../../../../config/redisClient.js';
import logger from './logger.js';

// Frequency Cap: Max 2 views per user per ad per 1 hour
const FREQ_LIMIT = 2;
const FREQ_WINDOW = 3600; // 1 hour in seconds

/**
 * Check if an ad should be skipped for a specific user.
 * Blocks "ad fatigue" by limiting repetitions.
 */
export const checkFrequencyCap = async (userId, adId) => {
    if (!userId || !adId) return false;

    const key = `ads:freq:${userId}:${adId}`;
    try {
        const count = await redisClient.get(key);
        if (count && parseInt(count) >= FREQ_LIMIT) {
            return true; // Cap reached, skip this ad
        }
        return false;
    } catch (err) {
        return false;
    }
};

/**
 * Increment the frequency counter for an ad view.
 */
export const incrementFrequency = async (userId, adId) => {
    if (!userId || !adId) return;

    const key = `ads:freq:${userId}:${adId}`;
    try {
        const pipeline = redisClient.pipeline();
        pipeline.incr(key);
        pipeline.expire(key, FREQ_WINDOW);
        await pipeline.exec();
    } catch (err) {
        // Skip frequency increment tracking if Redis is unavailable
    }
};

/**
 * Token Bucket Pacing Check.
 * Each ad gets a "bucket" of tokens that refilled at a constant rate.
 * Prevents budget exhaustion in the first few hours of the day.
 */
export const checkPacing = async (adId) => {
    const key = `ads:pace:${adId}`;
    try {
        const tokens = await redisClient.get(key);
        // If tokens are NULL, it means the bucket hasn't been initialized
        // for this ad (infinite pacing). If it is <= 0, the ad is paced.
        if (tokens !== null && parseInt(tokens) <= 0) {
            return true; // Ad is paced (bucket empty)
        }
        return false;
    } catch (err) {
        return false;
    }
};

/**
 * Update Pacing Bucket after a view.
 */
export const consumePacingToken = async (adId) => {
    const key = `ads:pace:${adId}`;
    try {
        await redisClient.decr(key);
    } catch (err) {
        // Skip pacing token consumption if Redis is unavailable
    }
};

