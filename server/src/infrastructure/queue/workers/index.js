import { Worker } from "bullmq";
import logger from "../../monitoring/logger.js";
import { sampledLogger } from "./sampledLogger.js";
import { getRedisConnection } from "./connection.js";
import youtubeSyncProcessor from "./processors/youtubeSyncProcessor.js";
import mediaProcessor from "./processors/mediaProcessor.js";
import storyProcessor from "./processors/storyProcessor.js";
import storyCleanupProcessor from "./processors/storyCleanupProcessor.js";
import likeSyncProcessor from "./processors/likeSyncProcessor.js";
import commentProcessor from "./processors/commentProcessor.js";
import { storyCleanupQueue, likeSyncQueue } from "./queues.js";

/**
 * 🏗️ BACKGROUND WORKER HUB
 *
 * This is the single entry point for all background workers.
 * To run workers as a separate service (Render Background Worker):
 *
 *   startCommand: node server/modules/workers/index.js
 *
 * ─── COST OPTIMIZATION CONFIG ─────────────────────────────────────
 *
 * drainDelay: Time (ms) to wait before polling Redis when queue is EMPTY.
 *   - Default BullMQ = 5ms  → ~17,280,000 Redis polls/day (EXPENSIVE 💀)
 *   - Our YouTube Sync      → 60,000ms  → ~1,440 polls/day ✅
 *   - Our Media Processing  → 30,000ms  → ~2,880 polls/day ✅
 *
 * stalledInterval: How often to check for frozen/stalled jobs.
 *   - Don't need to check every second — check every 5-10 minutes.
 */

const connection = getRedisConnection();
const workers = [];

if (connection) {
  logger.info("🚀 [WORKERS] Initializing BullMQ Background Workers Hub...");

  // ─── 1. YOUTUBE SYNC WORKER ─────────────────────────────────────────────────
  let syncWorker = null;
  if (process.env.ENABLE_YOUTUBE_WORKER === "true") {
    syncWorker = new Worker("youtube-sync", youtubeSyncProcessor, {
      connection,
      concurrency: 2,           // YouTube API has rate limits — keep it low
      drainDelay: 60000,        // ✅ 60s idle wait (saves ~82,000 Redis cmds/day vs default)
      stalledInterval: 600000,  // ✅ Check stalled jobs every 10 minutes
      lockDuration: 60000,      // Job must complete within 60s or considered stalled
      maxStalledCount: 2,       // Stalls 2x → mark as FAILED, stop retrying
    });
  }

  // ─── 2. MEDIA PROCESSING WORKER ─────────────────────────────────────────────
  let mediaWorker = null;
  if (process.env.ENABLE_MEDIA_WORKER === "true") {
    mediaWorker = new Worker("media-processing", mediaProcessor, {
      connection,
      concurrency: 3,           // 3 uploads processed in parallel
      drainDelay: 30000,        // ✅ 30s idle wait (saves ~83,000 Redis cmds/day vs default)
      stalledInterval: 300000,  // ✅ Check stalled jobs every 5 minutes
      lockDuration: 120000,     // Video processing can take up to 2 min
      maxStalledCount: 2,
    });
  }

  // ─── 3. STORY PROCESSING WORKER ─────────────────────────────────────────────
  let storyWorker = null;
  if (process.env.ENABLE_STORY_WORKER === "true") {
    storyWorker = new Worker("story-processing", storyProcessor, {
      connection,
      concurrency: 2,           // Stories are lighter but urgent
      drainDelay: 15000,        // 15s wait (faster response for stories)
      stalledInterval: 60000,   // Check every minute
      lockDuration: 60000,      // Stories should process within 60s
      maxStalledCount: 2,
    });
  }

  // ─── 4. STORY CLEANUP WORKER (MAINTENANCE) ──────────────────────────────────
  let cleanupWorker = null;
  if (process.env.ENABLE_STORY_CLEANUP_WORKER === "true") {
    cleanupWorker = new Worker("story-cleanup", storyCleanupProcessor, {
      connection,
      concurrency: 1,
      drainDelay: 300000,
    });
  }


  

  // ─── 7. LIKE SYNC WORKER ────────────────────────────────────────────────────
  // CONCURRENCY WARNING: This is intentionally set to 1. The current design processes 
  // a single shared `feed:likes:dirty` queue. Increasing this without sharding the queue 
  // will cause race conditions and duplicate writes.
  let likeSyncWorker = null;
  if (process.env.ENABLE_LIKE_SYNC_WORKER === "true") {
    likeSyncWorker = new Worker("like-sync", likeSyncProcessor, {
      connection,
      concurrency: Number(process.env.LIKE_SYNC_CONCURRENCY || 1),
      drainDelay: 30000,   // Wait 30s before checking queue again when empty
      // Lock duration must comfortably exceed worst-case processing time:
      // LIKE_BATCH_SIZE items ÷ LIKE_SYNC_DB_CONCURRENCY parallel workers × avg tx time.
      // At batch=500, concurrency=10, ~150ms/tx → ~7.5s realistic, but give headroom
      // for slow DB moments so BullMQ doesn't falsely mark a healthy job as stalled.
      lockDuration: Number(process.env.LIKE_SYNC_LOCK_DURATION_MS || 120000),
      stalledInterval: 300000, // Check for stalled like-sync jobs every 5 min (matches its own cadence)
      maxStalledCount: 2,
    });
  }

  // ─── 8. COMMENT PROCESSING WORKER ───────────────────────────────────────────
  let commentWorker = null;
  if (process.env.ENABLE_COMMENT_WORKER === "true") {
    commentWorker = new Worker("comment-processing", commentProcessor, {
      connection,
      concurrency: 2,
      drainDelay: 30000,
      lockDuration: 30000,
    });
  }

  // ─── EVENT HANDLERS ─────────────────────────────────────────────────────────
  // SUCCESS: sampled at 5% — prevents log flooding
  if (syncWorker) {
    syncWorker.on("completed", (job) =>
      sampledLogger.success("[Workers] YT Sync job done", { jobId: job.id })
    );
    syncWorker.on("failed", (job, err) =>
      sampledLogger.error("[Workers] YT Sync job failed", err, {
        jobId: job?.id,
        attempt: job?.attemptsMade,
      })
    );
    syncWorker.on("stalled", (jobId) =>
      sampledLogger.warn("[Workers] YT Sync job stalled — will retry", { jobId })
    );
    syncWorker.on("error", (err) => {
      if (err.code !== "ECONNREFUSED") {
        sampledLogger.error("[Workers] YT Sync worker error", err);
      }
    });
  }

  if (mediaWorker) {
    mediaWorker.on("completed", (job) =>
      sampledLogger.success("[Workers] Media job done", { jobId: job.id })
    );
    mediaWorker.on("failed", (job, err) =>
      sampledLogger.error("[Workers] Media job failed", err, {
        jobId: job?.id,
        attempt: job?.attemptsMade,
      })
    );
    mediaWorker.on("stalled", (jobId) =>
      sampledLogger.warn("[Workers] Media job stalled — will retry", { jobId })
    );
    mediaWorker.on("error", (err) => {
      if (err.code !== "ECONNREFUSED") {
        sampledLogger.error("[Workers] Media worker error", err);
      }
    });
  }

  if (storyWorker) {
    storyWorker.on("completed", (job) =>
      sampledLogger.success("[Workers] Story job done", { jobId: job.id })
    );
    storyWorker.on("failed", (job, err) =>
      sampledLogger.error("[Workers] Story job failed", err, {
        jobId: job?.id,
        attempt: job?.attemptsMade,
      })
    );
  }

  if (cleanupWorker) {
    cleanupWorker.on("failed", (job, err) => 
      logger.error(`🧹 [CLEANUP] Worker failed job ${job?.id}:`, err)
    );
  }
  
  if (likeSyncWorker) {
    likeSyncWorker.on("failed", (job, err) => {
      sampledLogger.error(`❌ [Workers] Like Sync job failed. Moving to Retry Mode. Attempt: ${job?.attemptsMade}`, err, {
        jobId: job?.id,
      });
      if (process.env.LIKE_SYNC_VERBOSE_LOGS === 'true') {
        logger.debug(`[TRACE:LIKE-WORKER] Job ${job?.id} failed. Reason: ${err.message}. Data: ${JSON.stringify(job?.data)}`);
      }
    });

    likeSyncWorker.on("stalled", (jobId) => {
      logger.warn(`⚠️ [Workers] Like Sync job stalled — Worker was unresponsive. Job ${jobId} reclaimed by BullMQ.`);
      if (process.env.LIKE_SYNC_VERBOSE_LOGS === 'true') {
        logger.debug(`[TRACE:LIKE-WORKER] Job ${jobId} stalled. This usually means the Postgres transaction took longer than LIKE_SYNC_LOCK_DURATION_MS.`);
      }
    });
  }

  if (commentWorker) {
    commentWorker.on("completed", (job) =>
      sampledLogger.success("[Workers] Comment job done", { jobId: job.id })
    );
    commentWorker.on("failed", (job, err) =>
      sampledLogger.error("[Workers] Comment job failed", err, {
        jobId: job?.id,
        attempt: job?.attemptsMade,
      })
    );
  }

  if (syncWorker) workers.push(syncWorker);
  if (mediaWorker) workers.push(mediaWorker);
  if (storyWorker) workers.push(storyWorker);
  if (cleanupWorker) workers.push(cleanupWorker);
  if (commentWorker) workers.push(commentWorker);
  if (likeSyncWorker) workers.push(likeSyncWorker);

  // ─── ⏰ SCHEDULED JOBS ─────────────────────────────────────────────────────
  // 🧹 [STORY SWEEPER] Run cleanup every 1 hour
  storyCleanupQueue.add("cleanup-stories", {}, {
    repeat: { pattern: "0 * * * *" }
  }).then(() => logger.info("🧹 [SCHEDULED] Story Sweeper active (Every 1 Hour)."))
    .catch((err) => logger.warn(`[SCHEDULED] Failed to schedule Story Sweeper: ${err.message}`));


  // ❤️ [LIKE SYNC] Flush Redis like states to PostgreSQL every 5 minutes (configurable)
  // ❤️ [LIKE SYNC] Flush Redis like states to PostgreSQL — cron-based, single source of truth.
  if (process.env.ENABLE_LIKE_SYNC_WORKER === "true") {
    const likeSyncCron = process.env.LIKE_SYNC_CRON || "*/5 * * * *";
    likeSyncQueue.add("flush-likes", {}, {
      jobId: "like-sync-flush",
      repeat: { pattern: likeSyncCron }
    }).then(() => logger.info(`❤️ [SCHEDULED] Like Sync Flusher active (Cron: ${likeSyncCron}).`))
      .catch((err) => logger.warn(`[SCHEDULED] Failed to schedule Like Sync: ${err.message}`));
  }
  // ─── DASHBOARD SUMMARY ──────────────────────────────────────────────────────
  const getStatus = (worker) => worker ? "🟢 ACTIVE" : "🔴 DISABLED";
  logger.info("=========================================================");
  logger.info("🚀 [WORKERS] INDIVIDUAL STATUS DASHBOARD:");
  logger.info(`   ${getStatus(syncWorker).padEnd(12)} | YouTube Sync `);
  logger.info(`   ${getStatus(mediaWorker).padEnd(12)} | Media Processing `);
  logger.info(`   ${getStatus(storyWorker).padEnd(12)} | Story Processing `);
  logger.info(`   ${getStatus(cleanupWorker).padEnd(12)} | Story Cleanup `);
  logger.info(`   ${getStatus(likeSyncWorker).padEnd(12)} | Like Sync `);
  logger.info(`   ${getStatus(commentWorker).padEnd(12)} | Comment Processing `);
  logger.info("=========================================================");

} else {
  logger.warn("⚠️ [WORKERS] Redis connection missing. Background Workers will NOT start.");
}

// ─── GRACEFUL SHUTDOWN ────────────────────────────────────────────────────────
// Workers finish their CURRENT job before stopping. No job is lost.
const shutdown = async (signal) => {
  logger.info(`🛑 [WORKERS] Received ${signal}. Graceful shutdown...`);
  await Promise.all(workers.map((w) => w.close()));
  if (connection) await connection.quit();
  logger.info("🏁 [WORKERS] All workers closed cleanly.");
  process.exit(0);
};

// Attach shutdown listeners when run as a standalone process
// (e.g., as a separate Render Background Worker service)
if (process.argv[1]?.endsWith("workers/index.js")) {
  process.on("SIGTERM", () => shutdown("SIGTERM")); // Render sends this on deploy
  process.on("SIGINT", () => shutdown("SIGINT"));   // Ctrl+C in dev
}

export default workers;
