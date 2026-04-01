import { Queue } from "bullmq";
import Redis from "ioredis";
import logger from "../utils/logger.js";

// Helper to get Redis connection for BullMQ
const getRedisConnection = () => {
    let redisUrl = process.env.REDIS_URL;
    const redisToken = process.env.REDIS_TOKEN;

    if (!redisUrl) {
        logger.warn("[Queues] REDIS_URL not set — BullMQ functionality disabled.");
        return null;
    }

    if (redisUrl.startsWith("https://") && redisToken) {
        const host = redisUrl.replace("https://", "");
        redisUrl = `rediss://default:${redisToken}@${host}:6379`;
    }

    return new Redis(redisUrl, {
        maxRetriesPerRequest: null, // Required by BullMQ
        connectTimeout: 10000,
    });
};

const connection = getRedisConnection();

/**
 * videoProcessingQueue
 * Used for async HLS transcoding failsafes and media cleanup.
 */
export const videoProcessingQueue = connection ? new Queue("video-processing", {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 }, // Retry after 5s, 10s, 20s...
        removeOnComplete: true,
        removeOnFail: 100, // Keep last 100 failures for debugging
    }
}) : null;

/**
 * analyticsQueue
 * Used for non-blocking high-volume event processing (Views, Skips, etc.)
 */
export const analyticsQueue = connection ? new Queue("analytics", {
    connection,
    defaultJobOptions: {
        attempts: 1, // Analytical data is fire-and-forget
        removeOnComplete: true,
        removeOnFail: 50,
    }
}) : null;

if (connection) {
    logger.info("[Queues] BullMQ initialized ✅");
}
