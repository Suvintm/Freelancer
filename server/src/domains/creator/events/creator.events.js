import { eventBus } from "../../../shared/kernel/events.js";
import { scheduleYouTubeSync, scheduleInstagramSync } from "../../../infrastructure/queue/workers/queues.js";
import prisma from "../../../infrastructure/database/postgres.js";
import logger from "../../../infrastructure/monitoring/logger.js";

export function bootstrapCreatorEvents() {
  eventBus.subscribe("user.registered", async (payload) => {
    try {
      const { userId } = payload;

      // 1. Check for seeded YouTube Channels
      const channels = await prisma.youTubeChannel.findMany({
        where: { userId },
      });

      if (channels.length > 0) {
        if (process.env.YT_SYNC_MODE === "foreground" || process.env.YT_SYNC_MODE === "manual") {
          logger.info(
            `✨ [CREATOR-EVENTS] Found ${channels.length} YouTube channel(s) for new user ${userId}, running foreground/manual mode.`
          );
        } else {
          logger.info(
            `✨ [CREATOR-EVENTS] Found ${channels.length} YouTube channel(s) for new user ${userId}, scheduling sync in BullMQ.`
          );
          await scheduleYouTubeSync(userId, channels, "onboarding");
        }
      }

      // 2. Check for seeded Instagram Accounts
      const igAccounts = await prisma.instagramAccount.findMany({
        where: { userId },
      });

      if (igAccounts.length > 0) {
        logger.info(
          `✨ [CREATOR-EVENTS] Found ${igAccounts.length} Instagram account(s) for new user ${userId}, dispatching sync.`
        );
        await scheduleInstagramSync(userId, igAccounts, "onboarding");
      }
    } catch (err) {
      logger.error(`❌ [CREATOR-EVENTS] Failed to process user.registered: ${err.message}`);
    }
  });
}
