import prisma from "../../../config/prisma.js";
import storage from "../../storage/storage.service.js";
import { STORAGE_FOLDERS } from "../../storage/providers/s3/s3.constants.js";
import { resolveMediaForApi } from "../../../utils/mediaResolver.js";
import { purgeUrlsFromCache } from "../../../utils/cloudflare.js";
import notificationService from "../../notification/services/notificationService.js";
import logger from "../../../utils/logger.js";

/** ... ... ... */
const storyCleanupProcessor = async (job) => {
  logger.info(`🧹 [CLEANUP] Starting Story Sweeper Job: ${job.id}`);

  try {
    // 1. Find Expired Stories (Harden with UTC ISO string)
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

    const expiredStories = await prisma.story.findMany({
      where: {
        OR: [
          { expires_at: { lt: now } },
          { created_at: { lt: twoMinutesAgo } } // 🚀 TEST MODE: Force delete anything older than 2 mins
        ]
      },
      include: {
        media: true
      }
    });

    if (expiredStories.length === 0) {
      logger.info(`🧹 [CLEANUP] No expired stories found. (Threshold: ${twoMinutesAgo.toISOString()}). Sweeper idle.`);
      return { purgedCount: 0 };
    }

    logger.info(`🧹 [CLEANUP] Found ${expiredStories.length} stories to purge. (Threshold: ${twoMinutesAgo.toISOString()})`);

    const cdnPurgeList = [];

    let purgedCount = 0;
    for (const story of expiredStories) {
      try {
        const { id, mediaId, userId } = story;
        const { storageKey } = story.media;

        // 1. Collect URLs for CDN purging before anything is deleted
        const resolved = resolveMediaForApi(story.media);
        if (resolved?.urls) {
          Object.values(resolved.urls).filter(Boolean).forEach(url => cdnPurgeList.push(url));
        }

        // 2. Delete PostgreSQL Records FIRST (Instantly hides story from all users)
        await prisma.media.delete({ where: { id: mediaId } });

        // 3. Clear S3/R2 Assets in the background
        const folderPrefix = `${STORAGE_FOLDERS.STORIES}/${userId}/${mediaId}/`;
        await storage.deleteFolder(folderPrefix);

        if (storageKey && !storageKey.includes(mediaId)) {
           await storage.deleteObjects(storageKey);
        }

        // 🚀 4. NOTIFY USER: "Your story has expired"
        await notificationService.notify({
            userId,
            type: "STORY_EXPIRED",
            title: "Story Expired",
            body: "Your story has reached its 2-minute limit and has been safely removed.",
            entityId: id,
            entityType: "STORY"
        });

        purgedCount++;
      } catch (err) {
        logger.error(`   ❌ [CLEANUP-FAIL] Failed to purge story ${story.id}: ${err.message}`);
      }
    }

    // 🚀 [HARDENING] Production-Grade Instant Purge
    if (cdnPurgeList.length > 0) {
      // Chunk the purge list (Cloudflare allows max 30 per request)
      const uniquePurgeList = [...new Set(cdnPurgeList)];
      await purgeUrlsFromCache(uniquePurgeList);
    }

    logger.info(`✨ [CLEANUP-SUCCESS] Successfully purged ${purgedCount} expired stories.`);

    // 4. [HARDENING] Purge Orphaned/Abandoned stories (Older than 24 hours)
    // These are media records that were created for stories but never became active.
    const orphanedMedia = await prisma.media.findMany({
      where: {
        story: null, // No related story record
        storageKey: { startsWith: "uploads/processed/stories/" },
        status: { in: ["PENDING", "FAILED"] },
        created_at: { lt: new Date(Date.now() - 5 * 60 * 1000) } // Reduced to 5 minutes for testing (Production: 24h)
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
