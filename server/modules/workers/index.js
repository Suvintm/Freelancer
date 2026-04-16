import { Worker } from "bullmq";
import logger from "../../utils/logger.js";
import { connection } from "./queues.js";
import youtubeSyncProcessor from "./processors/youtubeSyncProcessor.js";
import mediaProcessor from "./processors/mediaProcessor.js";

const workers = [];

if (connection) {
    logger.info("🚀 [WORKERS] Initializing BullMQ Background Workers Hub...");

    // 1. YouTube Sync Worker
    const syncWorker = new Worker("youtube-sync", youtubeSyncProcessor, {
        connection,
        concurrency: 5, 
        drainDelay: 60,
        stalledInterval: 60000,
        lockDuration: 60000,
    });

    // 2. Media Processing Worker
    const mediaWorker = new Worker("media-processing", mediaProcessor, {
      connection,
      concurrency: 2, // Standard image/video processing concurrency
      drainDelay: 10,  // Faster response for user uploads
    });

    // Event Logging
    syncWorker.on("completed", (job) => logger.debug(`[BullMQ] YT Sync Job ${job.id} done.`));
    syncWorker.on("failed", (job, err) => logger.error(`[BullMQ] YT Sync Job ${job.id} failed: ${err.message}`));

    mediaWorker.on("completed", (job) => logger.info(`✅ [BullMQ] Media Job ${job.id} processed successfully.`));
    mediaWorker.on("failed", (job, err) => logger.error(`❌ [BullMQ] Media Job ${job.id} failed: ${err.message}`));

    workers.push(syncWorker, mediaWorker);

    logger.info("✅ [WORKERS] All Background Workers Active (YouTube + Media).");
} else {
    logger.warn("⚠️ [WORKERS] Redis connection missing. Background Workers will NOT start.");
}

/**
 * Graceful shutdown handling
 */
const shutdown = async () => {
    logger.info("🛑 [WORKERS] Shutting down workers gracefully...");
    await Promise.all(workers.map(w => w.close()));
    if (connection) await connection.quit();
    process.exit(0);
};

// If this file is run directly (e.g., `node server/modules/workers/index.js`), attach process listeners
// This allows true microservice separation if deployed separately.
if (process.argv[1].endsWith("workers/index.js")) {
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
}

export default workers;
