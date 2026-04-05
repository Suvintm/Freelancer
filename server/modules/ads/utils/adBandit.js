/**
 * adBandit.js — Multi-Armed Bandit (UCB1) Ad Selection
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements the UCB1 algorithm (Upper Confidence Bound) for optimal ad ranking.
 * Balances:
 *  1. Exploitation: Show ads that perform well (high CTR) more often.
 *  2. Exploration: Show ads with few views to learn their true performance.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import redisClient from '../../../config/redisClient.js';
import logger from '../../../utils/logger.js';

// Redis keys for Bandit state per location
const BANDIT_CLICKS_KEY = (loc) => `ads:bandit:clicks:${loc || 'all'}`;
const BANDIT_VIEWS_KEY  = (loc) => `ads:bandit:views:${loc || 'all'}`;

// C = Exploration Constant (1.0 is standard, higher means more exploration)
const C = 1.0;

/**
 * Update the Bandit state after a view or click.
 * Recomputes the UCB1 score for the ad and stores it.
 */
export const updateBanditScore = async (adId, location, type = 'view') => {
    const viewsKey  = BANDIT_VIEWS_KEY(location);
    const clicksKey = BANDIT_CLICKS_KEY(location);

    try {
        if (type === 'view') {
            await redisClient.hIncrBy(viewsKey, adId, 1);
        } else if (type === 'click') {
            await redisClient.hIncrBy(clicksKey, adId, 1);
        }
    } catch (err) {
        logger.error(`[BANDIT] Failed to update stats for ad ${adId}:`, err);
    }
};

/**
 * Calculate UCB1 score for a single ad.
 * Formula: score = mean_CTR + C * sqrt(ln(total_views) / ad_views)
 */
export const calculateUCB1 = (clicks, views, totalViews) => {
    if (!views || views === 0) return 999; // Maximum exploration for new ads

    const ctr = clicks / views;
    const explorationTerm = C * Math.sqrt(Math.log(Math.max(1, totalViews)) / views);
    
    return ctr + explorationTerm;
};

/**
 * Rank a list of ads using the Bandit scores stored in Redis.
 * @param {Array}  ads      — List of ad objects from MongoDB
 * @param {string} location — e.g. "home_banner"
 * @returns {Array} Ranked ads
 */
export const rankAdsWithBandit = async (ads, location) => {
    if (!ads || ads.length <= 1) return ads;

    const viewsKey  = BANDIT_VIEWS_KEY(location);
    const clicksKey = BANDIT_CLICKS_KEY(location);

    try {
        const [allViews, allClicks] = await Promise.all([
            redisClient.hGetAll(viewsKey),
            redisClient.hGetAll(clicksKey)
        ]);

        // Total views across all ads in this location (for the ln(N) term)
        const totalViews = Object.values(allViews).reduce((sum, v) => sum + parseInt(v), 0);

        const adsWithScores = ads.map(ad => {
            const adId = ad.id; // Prisma uses 'id' instead of '_id'
            const v = parseInt(allViews[adId] || 0);
            const c = parseInt(allClicks[adId] || 0);
            
            const score = calculateUCB1(c, v, totalViews);
            return { ad, score };
        });

        // Sort by UCB1 score descending
        return adsWithScores
            .sort((a, b) => b.score - a.score)
            .map(item => item.ad);

    } catch (err) {
        logger.error(`[BANDIT] Error ranking ads for ${location}:`, err);
        return ads; // Fallback to priority sort
    }
};


