import { Worker } from "bullmq";
import Redis from "ioredis";
import logger from "../utils/logger.js";
import { Reel } from "../modules/reels/models/Reel.js";
import { Portfolio } from "../modules/profiles/models/Portfolio.js";
import { compositeScore } from "../modules/reels/utils/reelScorer.js";
import { markSeen } from "../modules/reels/utils/reelBloomFilter.js";
import { trackTrendingInteraction } from "../utils/trendingTracker.js";
import redisClient from "../config/redisClient.js";

// Collaborative Filtering keys (Duplicate from reelController for worker context)
const REEL_CO_VIEWERS_PREFIX = "reels:co_viewers:";
const REEL_CO_VIEWERS_TTL = 60 * 60 * 24 * 30; // 30 days

// Helper to get Redis connection for BullMQ
const getRedisConnection = () => {
    let redisUrl = process.env.REDIS_URL;
    const redisToken = process.env.REDIS_TOKEN;

    if (!redisUrl) return null;

    if (redisUrl.startsWith("https://") && redisToken) {
        const host = redisUrl.replace("https://", "");
        redisUrl = `rediss://default:${redisToken}@${host}:6379`;
    }

    return new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        connectTimeout: 10000,
    });
};

const connection = getRedisConnection();

/**
 * Video Processing Worker
 * Handles failsafe transcode checks and metadata updates.
 */
export const videoWorker = connection ? new Worker("video-processing", async (job) => {
    const { reelId, portfolioId, action } = job.data;
    logger.info(`[VideoWorker] Job ${job.id} started for ${action}`);

    if (action === "REFRESH_SCORE") {
        const reel = await Reel.findById(reelId);
        if (reel) {
            const newScore = compositeScore(reel);
            await Reel.findByIdAndUpdate(reelId, { recommendationScore: newScore });
            logger.info(`[VideoWorker] Reel ${reelId} score refreshed: ${newScore}`);
        }
    }

    // Future: Add Cloudinary status polling here if webhook fails
}, { connection }) : null;

/**
 * Analytics Worker
 * Handles background event processing (Views, Skips, Interest Tracking)
 */
export const analyticsWorker = connection ? new Worker("analytics", async (job) => {
    const { type, reelId, userId, ip, country } = job.data;
    
    if (job.name === "view") {
        // 1. Mark as seen in Bloom Filter (O(k))
        if (userId) {
            markSeen(userId, reelId).catch(() => {});
            
            // 2. Track trending interaction (O(1))
            const reel = await Reel.findById(reelId, { language: 1, hashtags: 1 }).lean();
            if (reel) {
                trackTrendingInteraction(country, reel.language, reel.hashtags, 1).catch(() => {});
                
                // 3. Collaborative filtering: track co-viewers (O(1))
                const coViewKey = `${REEL_CO_VIEWERS_PREFIX}${reelId}`;
                redisClient.sAdd(coViewKey, userId).catch(() => {});
                redisClient.expire(coViewKey, REEL_CO_VIEWERS_TTL).catch(() => {});

                // 4. User interest-set: What has this user watched? (O(1))
                const historyKey = `user:history:${userId}`;
                redisClient.sAdd(historyKey, reelId).catch(() => {});
                redisClient.expire(historyKey, REEL_CO_VIEWERS_TTL).catch(() => {});
            }
        }
        
        logger.debug(`[AnalyticsWorker] Processed view for reel ${reelId}`);
    }
}, { connection, concurrency: 5 }) : null;

if (connection) {
    logger.info("[Workers] BullMQ workers initialized ✅");
}
