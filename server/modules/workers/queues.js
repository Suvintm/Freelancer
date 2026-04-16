import "../../config/env.js";
import { Queue } from "bullmq";
import Redis from "ioredis";

// Centralized Redis Connection Helper for BullMQ
const getRedisConnection = () => {
    let redisUrl = process.env.REDIS_URL;
    const redisToken = process.env.REDIS_TOKEN;

    if (!redisUrl) return null;

    if (redisUrl.startsWith("https://") && redisToken) {
        const host = redisUrl.replace("https://", "");
        redisUrl = `rediss://default:${redisToken}@${host}:6379`;
    }

    const conn = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        connectTimeout: 10000,
    });

    // 🛡️ [RESILIENCE] Mute BullMQ primary connection errors
    conn.on("error", (err) => {
        // Only log if it's not a standard connection refusal, or keep it quiet for local dev
        if (err.code !== 'ECONNREFUSED') {
            console.error(`[BullMQ-Redis] Error: ${err.message}`);
        }
    });

    return conn;
};

export const connection = getRedisConnection();

/**
 * YouTube Sync Queue
 * Used to dispatch heavy image/video persistence tasks out of the main thread.
 */
export const youtubeSyncQueue = connection ? new Queue("youtube-sync", {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 }, 
        removeOnComplete: true, 
        removeOnFail: { count: 1000 }, 
    }
}) : null;

/**
 * 📦 Media Processing Queue
 * Handles image/video optimization and metadata extraction.
 */
export const mediaQueue = connection ? new Queue("media-processing", {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 100,
    }
}) : null;

// 🛡️ [RESILIENCE] Prevent Queue errors from crashing the process
if (youtubeSyncQueue) youtubeSyncQueue.on("error", () => {});
if (mediaQueue) mediaQueue.on("error", () => {});
