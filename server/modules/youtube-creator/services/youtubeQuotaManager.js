import prisma from "../../../config/prisma.js";
import logger from "../../../utils/logger.js";

/**
 * 🔑 YOUTUBE QUOTA MANAGER
 * 
 * This service is the "Central Truth" for all YouTube API credit usage.
 * It uses ATOMIC database operations to ensure consistency without heavy transactions.
 */

const DEFAULT_DAILY_LIMIT = 10000;

class YoutubeQuotaManager {
  /**
   * Initialize the quota record if it doesn't exist.
   */
  async initializeQuota() {
    const existing = await prisma.youTubeQuotaState.findUnique({
      where: { key_name: "primary" }
    });

    if (!existing) {
      const nextReset = this._getNextResetTime();
      await prisma.youTubeQuotaState.create({
        data: {
          key_name: "primary",
          daily_limit: DEFAULT_DAILY_LIMIT,
          used_units: 0,
          remaining_units: DEFAULT_DAILY_LIMIT,
          next_reset_at: nextReset,
        }
      });
      logger.info("✅ [QUOTA] YouTube Quota initialized (10,000 units).");
    }
  }

  /**
   * Consume units from the daily quota.
   * Uses an atomic updateMany with a condition to prevent race conditions and over-spending.
   */
  async consume(units) {
    // 1. Handle Reset if needed (Atomic check)
    await this.checkAndReset();

    // 2. Atomic Consumption
    // We use updateMany because it allow filtering by 'remaining_units' in the where clause,
    // ensuring we only deduct if enough credits exist.
    const result = await prisma.youTubeQuotaState.updateMany({
      where: {
        key_name: "primary",
        remaining_units: { gte: units }
      },
      data: {
        used_units: { increment: units },
        remaining_units: { decrement: units }
      }
    });

    if (result.count === 0) {
      // If count is 0, it means either 'primary' key is missing or 'remaining_units' < units
      const status = await prisma.youTubeQuotaState.findUnique({ where: { key_name: "primary" } });
      const balance = status ? status.remaining_units : 0;
      
      logger.error(`❌ [QUOTA] Exhausted: Tried to use ${units}, but only ${balance} left.`);
      throw new Error(`YouTube API quota exhausted (${balance} units left). Job delayed.`);
    }

    logger.info(`📉 [QUOTA] Consumed ${units} units successfully.`);
    return true;
  }

  /**
   * Atomic reset logic.
   */
  async checkAndReset() {
    const nextResetDate = this._getNextResetTime();
    
    const result = await prisma.youTubeQuotaState.updateMany({
      where: {
        key_name: "primary",
        next_reset_at: { lte: new Date() }
      },
      data: {
        used_units: 0,
        remaining_units: DEFAULT_DAILY_LIMIT,
        last_reset_at: new Date(),
        next_reset_at: nextResetDate,
      }
    });

    if (result.count > 0) {
      logger.info("🔂 [QUOTA] Daily YouTube Quota reset (Atomic).");
    }
  }

  /**
   * For viewing the status.
   */
  async getStatus() {
    return prisma.youTubeQuotaState.findUnique({
      where: { key_name: "primary" }
    });
  }

  /**
   * Calculates the next reset time (Midnight Pacific Time)
   */
  _getNextResetTime() {
    const now = new Date();
    // Convert to Pacific Time string
    const ptString = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    const nextReset = new Date(ptString);
    
    // Set to 00:00:00 of the NEXT day
    nextReset.setDate(nextReset.getDate() + 1);
    nextReset.setHours(0, 0, 0, 0);
    
    return nextReset;
  }
}

export default new YoutubeQuotaManager();
