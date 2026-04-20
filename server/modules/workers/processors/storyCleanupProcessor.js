import prisma from "../../../config/prisma.js";
import storage from "../../storage/storage.service.js";
import { STORAGE_FOLDERS } from "../../storage/providers/s3/s3.constants.js";
import logger from "../../../utils/logger.js";

/**
 * 🧹 STORY CLEANUP PROCESSOR
 * 
 * Automatically purges expired stories and their associated media assets.
 * Runs on a repeatable schedule (e.g., hourly).
 */
const storyCleanupProcessor = async (job) => {
  logger.info(`🧹 [CLEANUP] Starting Story Sweeper Job: ${job.id}`);

  try {
    // 1. Find Expired Stories
    const expiredStories = await prisma.story.findMany({
      where: {
        expires_at: {
          lt: new Date()
        }
      },
      include: {
        media: true
      }
    });

    if (expiredStories.length === 0) {
      logger.info("🧹 [CLEANUP] No expired stories found. Sweeper idle.");
      return { purgedCount: 0 };
    }

    logger.info(`🧹 [CLEANUP] Found ${expiredStories.length} expired stories. Initiating secure purge...`);

    let purgedCount = 0;

    for (const story of expiredStories) {
      try {
        const { mediaId, userId } = story;
        const { storageKey } = story.media;

        // 2. Clear S3/R2 Assets Recursively
        // We delete the entire folder prefix: uploads/stories/{userId}/{mediaId}/
        const folderPrefix = `${STORAGE_FOLDERS.STORIES}/${userId}/${mediaId}/`;
        
        logger.info(`   🗑️ [CLEANUP] Recursive purge for media: ${mediaId}`);
        await storage.deleteFolder(folderPrefix);

        // Also ensure the raw upload is gone if it wasn't already deleted by the processor
        if (storageKey && !storageKey.includes(mediaId)) {
           await storage.deleteObjects(storageKey);
        }

        // 3. Delete PostgreSQL Records
        // Due to CASCADE settings, deleting Media will delete Story and StoryViews
        await prisma.media.delete({
          where: { id: mediaId }
        });

        purgedCount++;
      } catch (err) {
        logger.error(`   ❌ [CLEANUP-FAIL] Failed to purge story ${story.id}: ${err.message}`);
      }
    }

    logger.info(`✨ [CLEANUP-SUCCESS] Successfully purged ${purgedCount} expired stories.`);

    // 4. [HARDENING] Purge Orphaned/Abandoned stories (Older than 24 hours)
    // These are stories that stuck in PENDING or FAILED and never became active.
    const orphanedMedia = await prisma.media.findMany({
      where: {
        type: "STORY",
        status: { in: ["PENDING", "FAILED"] },
        created_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    if (orphanedMedia.length > 0) {
      logger.info(`🧹 [CLEANUP] Found ${orphanedMedia.length} orphaned stories. Sweeping...`);
      for (const media of orphanedMedia) {
        await storage.deleteFolder(`${STORAGE_FOLDERS.STORIES}/${media.userId}/${media.id}/`);
        if (media.storageKey) await storage.deleteObjects(media.storageKey);
        await prisma.media.delete({ where: { id: media.id } });
      }
      logger.info(`✨ [CLEANUP] Orphaned sweep complete.`);
    }

    return { purgedCount, orphanedPurged: orphanedMedia.length };

  } catch (error) {
    logger.error(`❌ [CLEANUP-FATAL] Story Sweeper failed: ${error.stack}`);
    throw error;
  }
};

export default storyCleanupProcessor;
