/**
 * 🏗️ LEGACY WORKER JOBS — worker.jobs.js
 *
 * STATUS: ⚠️ PARTIAL MIGRATION NEEDED
 *
 * These workers (videoWorker + analyticsWorker) were built for:
 *   - videoWorker:     Refresh recommendation scores for video reels
 *   - analyticsWorker: Track reel views, update Bloom filter, update co-viewer graph
 *                      (used for collaborative filtering in feed ranking)
 *
 * The 4 imports below (Reel, Portfolio, compositeScore, reelBloomFilter) came
 * from the OLD `server/modules/` folder structure which no longer exists.
 * They need to be migrated to the new `src/domains/content/` structure.
 *
 * ─── MIGRATION TODO ────────────────────────────────────────────────────────────
 * 1. Create `src/domains/content/models/Reel.js`  (or confirm it's now Post/Video in Prisma)
 * 2. Create `src/domains/content/utils/reelScorer.js`       (compositeScore function)
 * 3. Create `src/domains/content/utils/reelBloomFilter.js`  (markSeen function)
 * 4. Then update the imports below to use relative paths from src/
 * ───────────────────────────────────────────────────────────────────────────────
 *
 * Until migration is complete, these workers are safely disabled (return null).
 * They will NOT start and will NOT crash the server.
 */

import logger from '../../infrastructure/monitoring/logger.js';
import { trackTrendingInteraction } from '../../domains/discover/services/trending.service.js';
import redisClient from '../../infrastructure/cache/redis.client.js';
import { Worker } from "bullmq";
import Redis from "ioredis";

// ⚠️ MIGRATION PENDING — These models/utils don't exist in the new domain structure yet.
// Remove these null placeholders and import from the correct new paths once migrated.
const Reel = null;            // TODO: import from src/domains/content/models/Reel.js
const compositeScore = null;  // TODO: import from src/domains/content/utils/reelScorer.js
const markSeen = null;        // TODO: import from src/domains/content/utils/reelBloomFilter.js

// Collaborative Filtering keys
const REEL_CO_VIEWERS_PREFIX = "reels:co_viewers:";
const REEL_CO_VIEWERS_TTL = 60 * 60 * 24 * 7; // 7 days

// Helper to get Redis connection for BullMQ
const getRedisConnection = () => {
    let redisUrl = process.env.REDIS_URL;
    const redisToken = process.env.REDIS_TOKEN;
    if (!redisUrl) return null;
    if (redisUrl.startsWith("https://") && redisToken) {
        const host = redisUrl.replace("https://", "");
        redisUrl = `rediss://default:${redisToken}@${host}:6379`;
    }
    return new Redis(redisUrl, { maxRetriesPerRequest: null, connectTimeout: 10000 });
};

const connection = getRedisConnection();

/**
 * Video Processing Worker
 * Handles failsafe transcode checks and recommendation score refreshes.
 * ⚠️ DISABLED until Reel model is migrated to src/domains/content/
 */
export const videoWorker = (connection && Reel && compositeScore) ? new Worker("video-processing", async (job) => {
    const { reelId, action } = job.data;
    logger.info(`[VideoWorker] Job ${job.id} started for action: ${action}`);

    if (action === "REFRESH_SCORE") {
        const reel = await Reel.findById(reelId);
        if (reel) {
            const newScore = compositeScore(reel);
            await Reel.findByIdAndUpdate(reelId, { recommendationScore: newScore });
            logger.info(`[VideoWorker] Reel ${reelId} score refreshed to: ${newScore}`);
        }
    }
}, { connection }) : null;

/**
 * Analytics Worker
 * Tracks views, updates Bloom filter (dedup), and co-viewer graph (collaborative filtering).
 * ⚠️ DISABLED until Reel model + markSeen are migrated to src/domains/content/
 */
export const analyticsWorker = (connection && Reel && markSeen) ? new Worker("analytics", async (job) => {
    const { reelId, userId, country } = job.data;

    if (job.name === "view") {
        // 1. Mark as seen in Bloom Filter (prevents re-showing same reel)
        if (userId) {
            markSeen(userId, reelId).catch(() => {});

            // 2. Track trending (zero-cost Redis ZADD)
            const reel = await Reel.findById(reelId, { language: 1, hashtags: 1 }).lean();
            if (reel) {
                trackTrendingInteraction(country, reel.language, reel.hashtags, 1).catch(() => {});

                // 3. Batched (pipelined) Redis operations for cost efficiency
                const pipeline = redisClient.pipeline();
                const coViewKey = `${REEL_CO_VIEWERS_PREFIX}${reelId}`;
                const historyKey = `user:history:${userId}`;
                pipeline.sadd(coViewKey, userId);
                pipeline.expire(coViewKey, REEL_CO_VIEWERS_TTL);
                pipeline.sadd(historyKey, reelId);
                pipeline.expire(historyKey, REEL_CO_VIEWERS_TTL);
                pipeline.exec().catch(err => logger.error(`[Worker-Redis] Pipeline failed: ${err.message}`));
            }
        }
        logger.debug(`[AnalyticsWorker] Processed view for reel ${reelId}`);
    }
}, { connection, concurrency: 5 }) : null;

if (connection) {
    if (videoWorker && analyticsWorker) {
        logger.info("[Workers] Legacy video + analytics workers initialized ✅");
    } else {
        logger.warn("[Workers] Legacy videoWorker/analyticsWorker are DISABLED — Reel model migration pending.");
        logger.warn("   See src/platform/scheduler/worker.jobs.js for migration instructions.");
    }
}


