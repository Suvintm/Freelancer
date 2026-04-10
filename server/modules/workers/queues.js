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

    return new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        connectTimeout: 10000,
    });
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
        backoff: { type: "exponential", delay: 5000 }, // Wait 5s, 10s, 20s if Cloudinary fails
        removeOnComplete: true, // Cost efficiency: delete job data immediately on success
        removeOnFail: { count: 1000 }, // Keep max 1000 failed jobs for debugging
    }
}) : null;

// Add more queues here as needed in the future (e.g., emailQueue, analyticsQueue)
