/**
 * 📅 Scheduled Jobs — SuviX Platform
 *
 * This is the single entry point for all cron/scheduled tasks.
 * Called once at server startup from server.js.
 *
 * Why is quota reset here and not in workers/index.js?
 *   Because workers may be disabled (ENABLE_WORKERS=false) to save Redis cost.
 *   But the YouTube quota MUST reset daily regardless of worker status.
 *   So we schedule it here via BullMQ with a cron pattern — it only fires once a day.
 */

import logger from '../../infrastructure/monitoring/logger.js';
import { scheduleQuotaMaintenance } from '../../infrastructure/queue/workers/queues.js';
import { syncLikesToPostgres } from '../../domains/polls/controllers/pollController.js';

export const startScheduledJobs = async () => {
  logger.info("📅 [SCHEDULER] Starting scheduled jobs...");

  // ─── Deferred Likes Cache Sync ────────────────────────────────────────────────
  // Periodically flushes high-frequency likes count from Redis/memory cache to PostgreSQL
  setInterval(() => {
    syncLikesToPostgres();
  }, 60000);
  logger.info("✅ [SCHEDULER] Deferred likes sync background task initialized (60s loop).");

  // ─── YouTube API Quota Reset ──────────────────────────────────────────────────
  // Fires once daily at midnight Pacific Time — which is when YouTube
  // resets its API quota units (00:00 PST = 08:00 UTC).
  // This job calls quotaManager.checkAndReset() via the youtube-sync BullMQ queue.
  try {
    await scheduleQuotaMaintenance();
    logger.info("✅ [SCHEDULER] YouTube quota reset job scheduled (Midnight Pacific Time daily).");
  } catch (err) {
    // Non-fatal — if Redis is unavailable, quota reset won't be scheduled.
    // The quota manager will still function; it just won't auto-reset via cron.
    logger.warn(`⚠️ [SCHEDULER] YouTube quota reset scheduling failed (Redis may be unavailable): ${err.message}`);
  }

  logger.info("✅ [SCHEDULER] All scheduled jobs initialized.");
};
