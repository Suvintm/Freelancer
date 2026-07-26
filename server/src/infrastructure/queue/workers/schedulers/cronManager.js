import cron from "node-cron";
import logger from "../../../monitoring/logger.js";
import redisProxy, { subscribe, unsubscribe } from "../../../cache/redis.client.js";
import likeSyncProcessor from "../processors/likeSyncProcessor.js";
import storyCleanupProcessor from "../processors/storyCleanupProcessor.js";
import quotaManager from "../../../../domains/creator/services/youtubeQuotaManager.js";

/**
 * ⏰ CENTRALIZED CRON MANAGER (Zero-Cost Polling)
 *
 * Replaces BullMQ for simple scheduled tasks to eliminate Upstash pay-per-command polling costs.
 * Uses a Redis Distributed Lock (`SET NX`) to guarantee that even if multiple server instances
 * are running, only ONE instance executes the cron job per interval.
 */

let likeSyncTask = null;
let storyCleanupTask = null;
let quotaMaintenanceTask = null;

export const startCronJobs = () => {
  logger.info("⏰ [CRON-MANAGER] Initializing zero-cost background schedulers...");

  // ─── 1. LIKE SYNC (Every 5 Minutes) ─────────────────────────────────────────
  if (process.env.ENABLE_LIKE_SYNC_WORKER === "true") {
    const likeSyncCron = process.env.LIKE_SYNC_CRON || "*/5 * * * *";
    
    likeSyncTask = cron.schedule(likeSyncCron, async () => {
      const lockKey = "lock:like-sync-flush";
      const lockDurationSeconds = 240; // Lock for 4 minutes (must be < cron interval)
      const lockValue = `${process.pid}-${Date.now()}`;
      
      try {
        // Distributed Lock: Set ONLY if it does not exist (NX), expire after 240s (EX)
        const gotLock = await redisProxy.set(lockKey, lockValue, "NX", "EX", lockDurationSeconds);
        
        if (!gotLock) {
          if (process.env.LIKE_SYNC_VERBOSE_LOGS === "true") {
             logger.debug("🔒 [CRON-MANAGER] Like Sync already running on another instance. Skipping.");
          }
          return; // Another instance is already handling this tick
        }

        // We got the lock! Run the flush logic directly.
        await likeSyncProcessor({ id: `cron-flush-${Date.now()}` });
        
      } catch (error) {
        logger.error(`❌ [CRON-MANAGER] Like Sync failed: ${error.message}`);
      } finally {
        // Only delete if we still own the lock (Lua for atomicity)
        const releaseScript = `if redis.call("GET",KEYS[1])==ARGV[1] then return redis.call("DEL",KEYS[1]) else return 0 end`;
        await redisProxy.eval(releaseScript, 1, lockKey, lockValue);
      }
    });

    logger.info(`❤️ [CRON-MANAGER] Like Sync Flusher active (Cron: ${likeSyncCron}).`);
  }

  // ─── 2. STORY CLEANUP (Every 1 Hour) ──────────────────────────────────────
  if (process.env.ENABLE_STORY_CLEANUP_WORKER === "true") {
    storyCleanupTask = cron.schedule("0 * * * *", async () => {
      const lockKey = "lock:story-cleanup";
      const lockValue = `${process.pid}-${Date.now()}`;
      try {
        const gotLock = await redisProxy.set(lockKey, lockValue, "NX", "EX", 1800); // 30 min lock
        if (!gotLock) return;
        
        await storyCleanupProcessor({ id: `cron-cleanup-${Date.now()}` });
      } catch (error) {
        logger.error(`❌ [CRON-MANAGER] Story Cleanup failed: ${error.message}`);
      } finally {
        const releaseScript = `if redis.call("GET",KEYS[1])==ARGV[1] then return redis.call("DEL",KEYS[1]) else return 0 end`;
        await redisProxy.eval(releaseScript, 1, lockKey, lockValue);
      }
    });
    logger.info(`🧹 [CRON-MANAGER] Story Sweeper active (Cron: 0 * * * *).`);
  }

  // ─── 3. YOUTUBE QUOTA MAINTENANCE (Daily at Midnight PT) ──────────────────
  if (process.env.ENABLE_YOUTUBE_WORKER === "true") {
    quotaMaintenanceTask = cron.schedule("0 0 * * *", async () => {
      const lockKey = "lock:youtube-quota-maintenance";
      const lockValue = `${process.pid}-${Date.now()}`;
      try {
        const gotLock = await redisProxy.set(lockKey, lockValue, "NX", "EX", 3600); // 1 hour lock
        if (!gotLock) return;
        
        await quotaManager.checkAndReset();
        logger.info(`⏱️ [CRON-MANAGER] Daily YouTube Quota Reset completed.`);
      } catch (error) {
        logger.error(`❌ [CRON-MANAGER] Quota Maintenance failed: ${error.message}`);
      } finally {
        const releaseScript = `if redis.call("GET",KEYS[1])==ARGV[1] then return redis.call("DEL",KEYS[1]) else return 0 end`;
        await redisProxy.eval(releaseScript, 1, lockKey, lockValue);
      }
    }, {
      timezone: "America/Los_Angeles"
    });
    logger.info(`⏱️ [CRON-MANAGER] Daily YouTube Quota Reset scheduled (Midnight Pacific Time).`);
  }

  // Redis Pub/Sub Subscriber for Instant Threshold Flushes
  setupThresholdSubscriber();
};

const setupThresholdSubscriber = () => {
  if (process.env.ENABLE_LIKE_SYNC_WORKER !== "true") return;

  subscribe("urgent-flush:like-sync", async (message) => {
    logger.info(`🚨 [CRON-MANAGER] Instant Threshold Pub/Sub received! Triggering immediate flush...`);
    
    const lockKey = "lock:like-sync-flush";
    const lockValue = `${process.pid}-${Date.now()}`;
    
    try {
      // Attempt to get the lock just in case it's currently running
      const gotLock = await redisProxy.set(lockKey, lockValue, "NX", "EX", 120);
      
      if (gotLock) {
         await likeSyncProcessor({ id: `threshold-flush-${Date.now()}` });
      } else {
         logger.info(`🔒 [CRON-MANAGER] Threshold flush skipped (already running).`);
      }
    } catch (err) {
      logger.error(`❌ [CRON-MANAGER] Threshold flush failed: ${err.message}`);
    } finally {
      // Only delete if we still own the lock
      const releaseScript = `if redis.call("GET",KEYS[1])==ARGV[1] then return redis.call("DEL",KEYS[1]) else return 0 end`;
      await redisProxy.eval(releaseScript, 1, lockKey, lockValue);
    }
  });
};

export const stopCronJobs = async () => {
  logger.info("🛑 [CRON-MANAGER] Stopping cron jobs...");
  if (likeSyncTask) likeSyncTask.stop();
  if (storyCleanupTask) storyCleanupTask.stop();
  if (quotaMaintenanceTask) quotaMaintenanceTask.stop();
  await unsubscribe("urgent-flush:like-sync");
};
