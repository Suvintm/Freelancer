import { eventBus } from "../../../shared/kernel/events.js";
import { scheduleYouTubeSync } from "../../../infrastructure/queue/workers/queues.js";
import prisma from "../../../infrastructure/database/postgres.js";
import logger from "../../../infrastructure/monitoring/logger.js";

export function bootstrapCreatorEvents() {
  eventBus.subscribe('user.registered', async (payload) => {
    try {
        const { userId } = payload;
        
        // Find channels seeded by auth registration
        const ytModel = prisma.youtubeProfile || prisma.youTubeProfile || prisma.youtubeProfiles;
        if (!ytModel) {
            logger.warn(`⚠️ [CREATOR-EVENTS] YouTubeProfile model not found in Prisma client, skipping sync.`);
            return;
        }

        const channels = await ytModel.findMany({
            where: { userId }
        });
        
        if (channels.length > 0) {
            // Check if we are running in foreground/manual sync mode
            if (process.env.YT_SYNC_MODE === 'foreground' || process.env.YT_SYNC_MODE === 'manual') {
                logger.info(`✨ [CREATOR-EVENTS] Found ${channels.length} channels for new user ${userId}, but skipping BullMQ because YT_SYNC_MODE=${process.env.YT_SYNC_MODE}. Sync will be triggered manually by the frontend.`);
            } else {
                logger.info(`✨ [CREATOR-EVENTS] Found ${channels.length} channels for new user ${userId}, scheduling sync in BullMQ.`);
                await scheduleYouTubeSync(userId, channels, "onboarding");
            }
        }
    } catch (err) {
        logger.error(`❌ [CREATOR-EVENTS] Failed to process user.registered: ${err.message}`);
    }
  });
}
