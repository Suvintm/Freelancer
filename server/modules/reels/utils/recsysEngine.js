import redisClient from "../../../config/redisClient.js";
import logger from "../../../utils/logger.js";

/**
 * recsysEngine.js (Phase 30.2)
 * Production-grade Recommendation Systems for SuviX.
 */

const REEL_CO_VIEWERS_PREFIX = "reels:co_viewers:";

/**
 * jaccardSimilarity
 * Calculates the Jaccard index between two sets.
 * J(A, B) = |A ∩ B| / |A ∪ B|
 */
export const jaccardSimilarity = (intersection, setA_size, setB_size) => {
    if (setA_size === 0 || setB_size === 0) return 0;
    const union = setA_size + setB_size - intersection;
    return intersection / union;
};

/**
 * getCollaborativeAffinities
 * @desc Finds reels that share viewers with the target reel.
 * Returns a list of Reel IDs ranked by Jaccard similarity.
 */
export const getCollaborativeAffinities = async (reelId, limit = 50) => {
    try {
        const targetKey = `${REEL_CO_VIEWERS_PREFIX}${reelId}`;
        const targetViewers = await redisClient.smembers(targetKey);
        
        if (!targetViewers || targetViewers.length === 0) return [];

        const targetSize = targetViewers.length;
        
        // Find all other reels that these viewers have watched
        const relatedReelKeys = new Set();
        for (const userId of targetViewers) {
            const userHistoryKey = `user:history:${userId}`; // We should start tracking this too
            const history = await redisClient.smembers(userHistoryKey);
            if (history) history.forEach(id => relatedReelKeys.add(id));
        }

        const scores = [];
        for (const otherId of relatedReelKeys) {
            if (otherId === reelId) continue;
            
            const otherKey = `${REEL_CO_VIEWERS_PREFIX}${otherId}`;
            const intersection = await redisClient.sinter(targetKey, otherKey);
            const otherSize = await redisClient.scard(otherKey);

            const similarity = jaccardSimilarity(intersection.length, targetSize, otherSize);
            if (similarity > 0.1) { // 10% overlap threshold
                scores.push({ reelId: otherId, score: similarity });
            }
        }

        return scores.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (err) {
        logger.error(`[RecSys] Failed to get affinities: ${err.message}`);
        return [];
    }
};
