import prisma from "../../../database/postgres.js";
import logger from "../../../monitoring/logger.js";
import { eventBus } from "../../../../shared/kernel/events.js";

/**
 * Runs periodically to find expired subscriptions.
 * Removes the verified badge from users whose subscriptions have expired.
 */
export function startSubscriptionSyncScheduler() {
  // Run every 24 hours (86400000 ms)
  setInterval(async () => {
    logger.info("🕒 [CRON] Running daily subscription expiration sync...");
    try {
      // 1. Find all users who are currently verified but have an expired active subscription
      const expiredSubs = await prisma.subscription.findMany({
        where: {
          endDate: { lt: new Date() },
          status: { in: ["active", "trial"] }
        },
        select: { id: true, userId: true }
      });

      if (expiredSubs.length > 0) {
        const userIds = [...new Set(expiredSubs.map(sub => sub.userId))];
        const subIds = expiredSubs.map(sub => sub.id);

        await prisma.$transaction([
          // Update the subscriptions to expired
          prisma.subscription.updateMany({
            where: { id: { in: subIds } },
            data: { status: "expired" }
          }),
          // Remove the verified badge for these users
          prisma.user.updateMany({
            where: { 
              id: { in: userIds },
              is_verified: true
            },
            data: { is_verified: false }
          })
        ]);

        logger.info(`✅ [CRON] Successfully expired ${expiredSubs.length} subscriptions and revoked verified badges for ${userIds.length} users.`);
        
        // Emit events so other domains (like notifications) can react if needed
        for (const sub of expiredSubs) {
          eventBus.publish("subscription.expired", { subscriptionId: sub.id, userId: sub.userId });
        }
      } else {
        logger.info("✅ [CRON] No expired subscriptions found this cycle.");
      }
    } catch (error) {
      logger.error(`❌ [CRON] Error running subscription sync: ${error.message}`);
    }
  }, 86400000);

  logger.info("✅ [SCHEDULER] Subscription sync scheduler initialized.");
}
