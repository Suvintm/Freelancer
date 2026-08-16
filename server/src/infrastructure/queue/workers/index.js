import { Worker } from "bullmq";
import logger from "../../monitoring/logger.js";
import { sampledLogger } from "./sampledLogger.js";
import { getRedisConnection } from "./connection.js";
import youtubeSyncProcessor from "./processors/youtubeSyncProcessor.js";
import instagramSyncProcessor from "./processors/instagramSyncProcessor.js";
import mediaProcessor from "./processors/mediaProcessor.js";
import storyProcessor from "./processors/storyProcessor.js";
import likeSyncProcessor from "./processors/likeSyncProcessor.js";
import commentProcessor from "./processors/commentProcessor.js";
import { startCronJobs, stopCronJobs } from "./schedulers/cronManager.js";

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

  // ─── 1.5 INSTAGRAM SYNC WORKER ──────────────────────────────────────────────
  let instaWorker = null;
  if (process.env.ENABLE_INSTAGRAM_WORKER !== "false") {
    instaWorker = new Worker("instagram-sync", instagramSyncProcessor, {
      connection,
      concurrency: 2,
      drainDelay: 60000,
      stalledInterval: 600000,
      lockDuration: 60000,
      maxStalledCount: 2,
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



  

  // ─── 7. LIKE SYNC WORKER (REMOVED) ──────────────────────────────────────────
  // Like Sync is now handled by cronManager.js to avoid Upstash polling costs.

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

  if (instaWorker) {
    instaWorker.on("completed", (job) =>
      sampledLogger.success("[Workers] Instagram Sync job done", { jobId: job.id })
    );
    instaWorker.on("failed", (job, err) =>
      sampledLogger.error("[Workers] Instagram Sync job failed", err, {
        jobId: job?.id,
        attempt: job?.attemptsMade,
      })
    );
    instaWorker.on("stalled", (jobId) =>
      sampledLogger.warn("[Workers] Instagram Sync job stalled — will retry", { jobId })
    );
    instaWorker.on("error", (err) => {
      if (err.code !== "ECONNREFUSED") {
        sampledLogger.error("[Workers] Instagram Sync worker error", err);
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
  if (instaWorker) workers.push(instaWorker);
  if (mediaWorker) workers.push(mediaWorker);
  if (storyWorker) workers.push(storyWorker);
  if (commentWorker) workers.push(commentWorker);

  // ─── ⏰ SCHEDULED JOBS (Node-Cron) ──────────────────────────────────────────
  startCronJobs();

  // ─── DASHBOARD SUMMARY ──────────────────────────────────────────────────────
  const getStatus = (worker) => worker ? "🟢 ACTIVE" : "🔴 DISABLED";
  logger.info("=========================================================");
  logger.info("🚀 [WORKERS] INDIVIDUAL STATUS DASHBOARD:");
  logger.info(`   ${getStatus(syncWorker).padEnd(12)} | YouTube Sync `);
  logger.info(`   ${getStatus(instaWorker).padEnd(12)} | Instagram Sync `);
  logger.info(`   ${getStatus(mediaWorker).padEnd(12)} | Media Processing `);
  logger.info(`   ${getStatus(storyWorker).padEnd(12)} | Story Processing `);
  logger.info(`   ${getStatus(null).padEnd(12)} | Story Cleanup (Moved to Cron) `);
  logger.info(`   ${getStatus(null).padEnd(12)} | Like Sync (Moved to Cron) `);
  logger.info(`   ${getStatus(commentWorker).padEnd(12)} | Comment Processing `);
  logger.info("=========================================================");

} else {
  logger.warn("⚠️ [WORKERS] Redis connection missing. Background Workers will NOT start.");
}

// ─── GRACEFUL SHUTDOWN ────────────────────────────────────────────────────────
// Workers finish their CURRENT job before stopping. No job is lost.
const shutdown = async (signal) => {
  logger.info(`🛑 [WORKERS] Received ${signal}. Graceful shutdown...`);
  await stopCronJobs();
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
