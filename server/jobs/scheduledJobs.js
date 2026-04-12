/**
 * Scheduled Jobs - Legacy system mostly replaced by BullMQ
 */

import logger from "../utils/logger.js";

/**
 * Placeholder for legacy scheduled jobs.
 * Most logic has been migrated to modules/workers/
 */
export const startScheduledJobs = () => {
  logger.info("✅ Scheduled jobs system initialized (Legcy marketplace jobs disabled, BullMQ active elsewhere)");
};
