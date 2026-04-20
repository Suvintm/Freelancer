import { Worker } from "bullmq";
import logger from "../../utils/logger.js";
import { sampledLogger } from "./sampledLogger.js";
import { getRedisConnection } from "./connection.js";
import youtubeSyncProcessor from "./processors/youtubeSyncProcessor.js";
import mediaProcessor from "./processors/mediaProcessor.js";
import storyProcessor from "./processors/storyProcessor.js";
import storyCleanupProcessor from "./processors/storyCleanupProcessor.js";
import { storyCleanupQueue } from "./queues.js";

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
  const syncWorker = new Worker("youtube-sync", youtubeSyncProcessor, {
    connection,
    concurrency: 2,           // YouTube API has rate limits — keep it low
    drainDelay: 60000,        // ✅ 60s idle wait (saves ~82,000 Redis cmds/day vs default)
    stalledInterval: 600000,  // ✅ Check stalled jobs every 10 minutes
    lockDuration: 60000,      // Job must complete within 60s or considered stalled
    maxStalledCount: 2,       // Stalls 2x → mark as FAILED, stop retrying
  });

  // ─── 2. MEDIA PROCESSING WORKER ─────────────────────────────────────────────
  const mediaWorker = new Worker("media-processing", mediaProcessor, {
    connection,
    concurrency: 3,           // 3 uploads processed in parallel
    drainDelay: 30000,        // ✅ 30s idle wait (saves ~83,000 Redis cmds/day vs default)
    stalledInterval: 300000,  // ✅ Check stalled jobs every 5 minutes
    lockDuration: 120000,     // Video processing can take up to 2 min
    maxStalledCount: 2,
  });

  // ─── 3. STORY PROCESSING WORKER ─────────────────────────────────────────────
  const storyWorker = new Worker("story-processing", storyProcessor, {
    connection,
    concurrency: 2,           // Stories are lighter but urgent
    drainDelay: 15000,        // 15s wait (faster response for stories)
    stalledInterval: 60000,   // Check every minute
    lockDuration: 60000,      // Stories should process within 60s
    maxStalledCount: 2,
  });

  // ─── 4. STORY CLEANUP WORKER (MAINTENANCE) ──────────────────────────────────
  const cleanupWorker = new Worker("story-cleanup", storyCleanupProcessor, {
    connection,
    concurrency: 1, // Maintenance tasks are low concurrency
    drainDelay: 300000, // 5 minute check (very low cost)
  });

  // ─── EVENT HANDLERS ─────────────────────────────────────────────────────────
  // SUCCESS: sampled at 5% — prevents log flooding
  syncWorker.on("completed", (job) =>
    sampledLogger.success("[Workers] YT Sync job done", { jobId: job.id })
  );
  mediaWorker.on("completed", (job) =>
    sampledLogger.success("[Workers] Media job done", { jobId: job.id })
  );
  storyWorker.on("completed", (job) =>
    sampledLogger.success("[Workers] Story job done", { jobId: job.id })
  );

  // FAILURES: always log — never sample errors
  syncWorker.on("failed", (job, err) =>
    sampledLogger.error("[Workers] YT Sync job failed", err, {
      jobId: job?.id,
      attempt: job?.attemptsMade,
    })
  );
  mediaWorker.on("failed", (job, err) =>
    sampledLogger.error("[Workers] Media job failed", err, {
      jobId: job?.id,
      attempt: job?.attemptsMade,
    })
  );
  storyWorker.on("failed", (job, err) =>
    sampledLogger.error("[Workers] Story job failed", err, {
      jobId: job?.id,
      attempt: job?.attemptsMade,
    })
  );

  // STALLED: always warn
  syncWorker.on("stalled", (jobId) =>
    sampledLogger.warn("[Workers] YT Sync job stalled — will retry", { jobId })
  );
  mediaWorker.on("stalled", (jobId) =>
    sampledLogger.warn("[Workers] Media job stalled — will retry", { jobId })
  );

  // WORKER-LEVEL ERRORS (connection drops, etc.)
  syncWorker.on("error", (err) => {
    if (err.code !== "ECONNREFUSED") {
      sampledLogger.error("[Workers] YT Sync worker error", err);
    }
  });
  mediaWorker.on("error", (err) => {
    if (err.code !== "ECONNREFUSED") {
      sampledLogger.error("[Workers] Media worker error", err);
    }
  });

  cleanupWorker.on("failed", (job, err) => 
    logger.error(`🧹 [CLEANUP] Worker failed job ${job?.id}:`, err)
  );

  workers.push(syncWorker, mediaWorker, storyWorker, cleanupWorker);

  // ─── ⏰ SCHEDULED JOBS ─────────────────────────────────────────────────────
  // 🧹 [STORY SWEEPER] Run cleanup every hour
  storyCleanupQueue.add("cleanup-stories", {}, {
    repeat: { pattern: "0 * * * *" } // Top of every hour
  }).then(() => logger.info("🧹 [SCHEDULED] Story Sweeper active (Hourly)."));

  logger.info("✅ [WORKERS] All Background Workers Active (YouTube Sync + Media Processing).");
  logger.info(`   📊 YT Sync:  drainDelay=60s | concurrency=2 | stall-check=10m`);
  logger.info(`   📊 Media:    drainDelay=30s | concurrency=3 | stall-check=5m`);

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
