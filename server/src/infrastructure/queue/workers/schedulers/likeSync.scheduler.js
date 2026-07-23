import logger from "../../../monitoring/logger.js";
import { likeSyncQueue } from "../queues.js";

/**
 * 🔁 LIKE SYNC SCHEDULER
 *
 * Registers a BullMQ REPEATABLE job instead of a Node.js setInterval.
 *
 * Why this matters:
 * - The schedule lives in Redis (BullMQ's `repeat:` keys), not in your process.
 * - Safe to call on every pod/instance at boot — BullMQ dedupes repeatable
 *   jobs by (name + jobId + repeat options), so N pods calling this on
 *   startup still results in exactly ONE scheduled tick, not N.
 * - Retry/backoff config is intentionally NOT passed here — it lives on the
 *   queue's defaultJobOptions in queues.js. Passing it here would silently
 *   override your env-configured LIKE_SYNC_ATTEMPTS / LIKE_SYNC_BACKOFF,
 *   which is the bug that existed before.
 */
export async function startLikeSyncScheduler() {
  if (!likeSyncQueue) {
    logger.warn("[Scheduler] likeSyncQueue unavailable — Redis not connected. Skipping like-sync scheduling.");
    return;
  }

  const intervalMs = Number(process.env.LIKE_SYNC_INTERVAL_MS || 60000);

  await likeSyncQueue.add(
    "sync-likes-to-postgres",
    {},
    {
      repeat: { every: intervalMs },
      jobId: "like-sync-tick", // fixed jobId → prevents duplicate repeatable schedules across pods/restarts
    }
  );

  logger.info(`🔁 [Scheduler] Like sync repeatable job registered — every ${intervalMs}ms.`);
}

/**
 * Call this once at boot (e.g. in your worker/index bootstrap), NOT per-request.
 * Safe to call from every instance — see comment above.
 */