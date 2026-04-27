import "../../config/env.js";
import { getRedisConnection } from "./connection.js";
import { createQueue } from "./queueFactory.js";
import redisProxy from "../../config/redisClient.js";
import logger from "../../utils/logger.js";

/**
 * 📦 CENTRALIZED QUEUE REGISTRY
 *
 * All queues are defined here. Application code imports queue
 * HELPER FUNCTIONS from this file — not the raw queue objects.
 *
 * Helper functions enforce:
 *  - Job deduplication (via jobId)
 *  - Per-user rate limiting
 *  - Debounce windows (YouTube sync)
 *  - Correct payload structure (IDs and keys only, no buffers)
 */

// ─── PRIORITY MATRIX ──────────────────────────────────────────────────────────
// Lower number = Higher priority in BullMQ
export const PRIORITY = {
  CRITICAL: 1,    // User-triggered, blocking (e.g., payment, profile upload)
  HIGH: 2,        // Time-sensitive media (reel processing)
  MEDIUM: 3,      // Background syncs (YouTube)
  LOW: 5,         // Analytics, batch jobs
  BACKGROUND: 10, // Cleanup, archiving
};

// ─── QUEUE DEFINITIONS ────────────────────────────────────────────────────────

/**
 * YouTube Sync Queue
 * Sync is non-urgent — aggressive cleanup, medium priority
 */
export const youtubeSyncQueue = createQueue("youtube-sync", {
  attempts: 4,
  backoff: { type: "exponential", delay: 5000 }, // 5s → 10s → 20s → 40s
  removeOnComplete: { age: 300, count: 200 },     // Keep 5 min for debugging
  removeOnFail: { age: 86400, count: 50 },        // Keep failures 24h
});

/**
 * Media Processing Queue
 * Media is user-visible — keep some history, higher priority
 */
export const mediaQueue = createQueue("media-processing", {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 }, // 2s → 4s → 8s
  removeOnComplete: { age: 60, count: 500 },     // Delete after 60s
  removeOnFail: { age: 3600, count: 100 },       // Keep failures 1h
});

/**
 * Search Feedback Queue
 * Weekly job — recalibrates search rankings from click-through data.
 * Low priority: runs Sunday night during low traffic.
 */
export const searchFeedbackQueue = createQueue("search-feedback", {
  attempts: 2,
  backoff: { type: "fixed", delay: 60000 },      // Retry after 1 minute if failed
  removeOnComplete: { age: 86400, count: 10 },   // Keep last 10 completions (weekly = ~10 records)
  removeOnFail: { age: 604800, count: 5 },       // Keep failures 1 week for debugging
});

/**
 * Search Analytics Queue
 * Flushes Redis buffered clicks/searches to MongoDB in batches.
 * High frequency: runs every 2-5 minutes to keep analytics fresh.
 */
export const searchAnalyticsQueue = createQueue("search-analytics", {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { age: 3600, count: 100 },   // Keep last hour of flush history
  removeOnFail: { age: 86400, count: 50 },       // Keep failures 24h
});



// ─── HELPER: YOUTUBE SYNC ENQUEUER ────────────────────────────────────────────

const DEBOUNCE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Schedule a YouTube sync with built-in debounce.
 * If the same user triggers a sync multiple times in 15 minutes,
 * only ONE job is created. BullMQ silently ignores duplicates.
 *
 * @param {string} userId
 * @param {object[]} channels
 * @param {string} triggerReason - "manual" | "scheduled"
 */
export async function scheduleYouTubeSync(userId, channels, triggerReason = "manual") {
  if (!youtubeSyncQueue) {
    logger.warn("[Queue] youtubeSyncQueue unavailable — Redis not connected.");
    return null;
  }

  // 🛰️ [PAYLOAD-SLIMMING] Only store IDs in the queue to avoid "Payload Too Large" errors (Max 1KB)
  // The worker will fetch the full metadata from the DB.
  const channelIds = (channels || []).map(ch => (typeof ch === 'string' ? ch : (ch.channelId || ch.channel_id || ch.id))).filter(Boolean);

  // 15-minute time-bucket deduplication for scheduled jobs
  // For manual/verification triggers, we use higher granularity to allow adding multiple accounts
  const windowBucket = Math.floor(Date.now() / DEBOUNCE_WINDOW_MS);
  let jobId = `yt_sync_${userId}_${windowBucket}`;

  if (triggerReason !== "scheduled") {
    const channelTag = channelIds.length === 1 ? channelIds[0] : "multi";
    jobId = `yt_sync_${userId}_${triggerReason}_${channelTag}_${Date.now()}`;
  }

  const job = await youtubeSyncQueue.add(
    "sync-youtube",
    { userId, channelIds, triggerReason, requestedAt: Date.now() },
    {
      jobId,  // Duplicate jobs within the same 15-min window are silently ignored
      priority: triggerReason === "manual" ? PRIORITY.MEDIUM : PRIORITY.LOW,
    }
  );

  logger.info(`📅 [Queue] YouTube Sync scheduled. JobId: ${jobId}`);
  return job;
}

/**
 * Schedule a daily maintenance job for the YouTube Quota Manager.
 * Resets the quota at exactly Midnight Pacific Time (00:00:00).
 */
export async function scheduleQuotaMaintenance() {
  if (!youtubeSyncQueue) return;

  // Add a repeatable job
  await youtubeSyncQueue.add(
    "quota-maintenance",
    { type: "DAILY_RESET" },
    {
      repeat: {
        pattern: "0 0 * * *", // Every day at Midnight
        tz: "America/Los_Angeles"
      },
      priority: PRIORITY.HIGH, // Quota reset is important
      removeOnComplete: true,
      removeOnFail: true,
    }
  );

  logger.info("⏱️ [Queue] Daily YouTube Quota Reset scheduled (Midnight Pacific Time).");
}

// ─── HELPER: MEDIA JOB ENQUEUER ───────────────────────────────────────────────

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_PER_WINDOW = 15; // Increased slightly for power users

/**
 * Add a media processing job with deduplication and per-user rate limiting.
 * Rate limit: max 15 uploads per 60 seconds per user.
 * 
 * 🛡️ [RESILIENCE] Uses the redisProxy to prevent "Connection is closed" crashes.
 */
export async function addMediaJob(mediaId, s3Key, userId, type = "IMAGE", priority = PRIORITY.HIGH) {
  if (!mediaQueue) {
    logger.warn("[Queue] mediaQueue unavailable — Redis not connected.");
    return null;
  }

  // ── Per-user rate limit enforcement (Fail-Safe) ────────────────────────────
  try {
    const rateLimitKey = `rate:media:${userId}`;
    const current = await redisProxy.incr(rateLimitKey);
    
    if (current === 1) {
      await redisProxy.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
    }
    
    if (current > RATE_LIMIT_MAX_PER_WINDOW) {
      throw new Error(`Rate limit exceeded: max ${RATE_LIMIT_MAX_PER_WINDOW} uploads per minute. Please wait.`);
    }
  } catch (err) {
    // If it's a rate limit error, rethrow it so the controller can send 429
    if (err.message.includes("Rate limit exceeded")) throw err;
    // Otherwise, it's a Redis connection error — LOG it but DO NOT block the upload
    logger.error(`⚠️ [Redis-Proxy] Rate limiter bypass due to connectivity: ${err.message}`);
  }

  // ── Enqueue with deduplication via jobId ───────────────────────────────────
  const job = await mediaQueue.add(
    "process-media",
    {
      mediaId,
      key: s3Key,
      userId,
      type,
      requestedAt: Date.now(),
    },
    {
      jobId: `media_${mediaId}`,
      priority,
    }
  );

  return job;
}

/**
 * Story Processing Queue
 * Stories are high-priority, user-visible content.
 */
export const storyQueue = createQueue("story-processing", {
  attempts: 1, // 🛑 Fail Fast for stories (Senior Audit recommendation)
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 60, count: 500 },
  removeOnFail: { age: 3600, count: 100 },
});

/**
 * Story Cleanup Queue
 * Handles deletion of expired stories.
 */
export const storyCleanupQueue = createQueue("story-cleanup", {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 60, count: 500 },
  removeOnFail: { age: 3600, count: 100 },
});

/**
 * Add a story processing job.
 * Enqueues the background optimization for a newly uploaded story.
 */
export async function addStoryJob(mediaId, storageKey, userId, type = "IMAGE") {
  if (!storyQueue) {
    logger.warn("[Queue] storyQueue unavailable — Redis not connected.");
    return null;
  }

  const job = await storyQueue.add(
    "process-story",
    {
      mediaId,
      key: storageKey,
      userId,
      type,
      requestedAt: Date.now(),
    },
    {
      jobId: `story_${mediaId}`,
      priority: PRIORITY.HIGH,
    }
  );

  return job;
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
export const connection = getRedisConnection();
