import { Worker } from "bullmq";
import logger from "../../utils/logger.js";
import { connection } from "./queues.js";
import youtubeSyncProcessor from "./processors/youtubeSyncProcessor.js";

const workers = [];

if (connection) {
    logger.info("🚀 [WORKERS] Initializing BullMQ Background Workers...");

    // 1. YouTube Sync Worker
    // Bind the youtube-sync queue to its designated processor
    const syncWorker = new Worker("youtube-sync", youtubeSyncProcessor, {
        connection,
        concurrency: 5, // Process up to 5 YouTube channels simultaneously
    });

    syncWorker.on("completed", (job) => {
        logger.debug(`[BullMQ] Processed Job ${job.id} on queue youtube-sync safely processed.`);
    });

    syncWorker.on("failed", (job, err) => {
        logger.error(`[BullMQ] Job ${job.id} failed: ${err.message}`);
    });

    workers.push(syncWorker);

    logger.info("✅ [WORKERS] Background Workers are active and listening for jobs.");
} else {
    logger.warn("⚠️ [WORKERS] Redis connection missing. Background Workers will NOT start.");
}

/**
 * Graceful shutdown handling for Microservice deployments
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
