/**
 * trendingTracker.js — Regional & Temporal Popularity Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Part of Phase 30B: Advanced Redis Layer.
 * Tracks what's "hot" right now based on:
 *   1. Country (Region)
 *   2. Language
 *   3. Time of Day (4-hour slots)
 *
 * Uses Redis Sorted Sets (ZSET) for O(log N) updates and retrieval.
 * Multi-layer keys allow for granular trending (e.g., "What's hot in Hindi in India right now?").
 * ─────────────────────────────────────────────────────────────────────────────
 */

import redisClient from '../config/redisClient.js';
import logger from './logger.js';

// Key Patterns
const TRENDING_REGION_KEY = 'trending:region:'; // trending:region:IN:English
const TRENDING_TIMESLOT_KEY = 'trending:slot:'; // trending:slot:0-4
const TRENDING_TTL = 3600 * 24 * 7; // 7 days of rolling trending data

/**
 * Get the current 4-hour timeslot (0-5)
 * 0: 00-04, 1: 04-08, 2: 08-12, 3: 12-16, 4: 16-20, 5: 20-24
 */
const getTimeslot = () => {
    const hour = new Date().getHours();
    return Math.floor(hour / 4);
};

/**
 * Track an interaction for trending analysis.
 * Called whenever a reel is viewed, liked, or saved.
 * 
 * @param {string} country   — User's country (e.g., "IN")
 * @param {string} language  — Reel's language (e.g., "Hindi")
 * @param {Array}  tags      — Hashtags on the reel
 * @param {number} weight    — Importance (View: 1, Like: 5, Save: 10)
 */
export const trackTrendingInteraction = async (country, language, tags = [], weight = 1) => {
    if (!tags || tags.length === 0) return;

    const slot = getTimeslot();
    const regionKey = `${TRENDING_REGION_KEY}${country || 'global'}:${language || 'English'}`;
    const slotKey = `${TRENDING_TIMESLOT_KEY}${slot}`;

    const pipeline = redisClient.pipeline();

    tags.forEach(tag => {
        const cleanTag = tag.replace('#', '').toLowerCase();
        
        // Boost in regional set
        pipeline.zincrby(regionKey, weight, cleanTag);
        
        // Boost in temporal set
        pipeline.zincrby(slotKey, weight, cleanTag);
    });

    // Auto-expire to keep trending fresh
    pipeline.expire(regionKey, TRENDING_TTL);
    pipeline.expire(slotKey, TRENDING_TTL);

    try {
        await pipeline.exec();
    } catch (err) {
        logger.error(`[TRENDING] Redis error:`, err);
    }
};

/**
 * Get top trending tags for a specific context.
 * @param {string} country
 * @param {string} language
 * @param {number} limit
 */
export const getTrendingTags = async (country, language, limit = 10) => {
    const regionKey = `${TRENDING_REGION_KEY}${country || 'global'}:${language || 'English'}`;
    const slotKey = `${TRENDING_TIMESLOT_KEY}${getTimeslot()}`;

    try {
        // Intersect Regional and Temporal trends for "hyper-local/now" trending
        // For Phase 1, we'll just return regional as it's more stable
        const tags = await redisClient.zRevRange(regionKey, 0, limit - 1);
        return tags || [];
    } catch (err) {
        return [];
    }
};
