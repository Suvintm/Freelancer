import logger from "../../../utils/logger.js";
import { persistYouTubeContent } from "../../youtube-creator/services/youtubeSyncService.js";

/**
 * YouTube Sync Processor
 * 
 * Consumes jobs from the `youtube-sync` queue.
 * This worker takes the heavy lifting of mapping YouTube data, downloading thumbnails, 
 * uploading them to Cloudinary, and saving to Prisma, completely out of the main thread.
 */
export default async function youtubeSyncProcessor(job) {
    const { userId, channels } = job.data;
    
    logger.info(`⚙️ [WORKER] Processing YouTube Sync job ${job.id} for user ${userId} with ${channels?.length || 0} channels`);

    if (!userId || !channels || !Array.isArray(channels) || channels.length === 0) {
        logger.warn(`⚠️ [WORKER] Ignored empty or invalid YouTube Sync job ${job.id}`);
        return; // Complete without error since there's nothing to process
    }

    let processedCount = 0;

    for (const channel of channels) {
        try {
            // Re-use the battle-tested service logic, but now it runs safely in the background
            await persistYouTubeContent(userId, channel);
            processedCount++;
        } catch (error) {
            logger.error(`❌ [WORKER] Failed to persist channel ${channel.channelId || 'unknown'} in job ${job.id}: ${error.message}`);
            // We throw here so BullMQ knows this specific job failed and will trigger its retry logic
            throw new Error(`Channel sync failed: ${error.message}`);
        }
    }

    logger.info(`✅ [WORKER] Completed YouTube Sync job ${job.id}. Processed ${processedCount}/${channels.length} channels.`);
}
