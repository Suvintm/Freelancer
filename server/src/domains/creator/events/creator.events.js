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
            logger.info(`✨ [CREATOR-EVENTS] Found ${channels.length} channels for new user ${userId}, scheduling sync.`);
            await scheduleYouTubeSync(userId, channels, "onboarding");
        }
    } catch (err) {
        logger.error(`❌ [CREATOR-EVENTS] Failed to process user.registered: ${err.message}`);
    }
  });
}
