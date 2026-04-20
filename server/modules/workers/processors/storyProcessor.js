import prisma from "../../../config/prisma.js";
import storage from "../../storage/storage.service.js";
import { processImage } from "../../storage/processors/image.processor.js";
import { processVideo } from "../../storage/processors/video.processor.js";
import { emitToUser } from "../../../socket.js";
import { STORAGE_FOLDERS } from "../../storage/providers/s3/s3.constants.js";
import notificationService from "../../notification/services/notificationService.js";
import logger from "../../../utils/logger.js";

/**
 * 🎬 STORY MEDIA PROCESSOR
 * 
 * Specifically optimized for Stories (9:16 format).
 * Reuses core processors but targets the 'stories' folder.
 */
const storyProcessor = async (job) => {
  const { mediaId, userId, key, type } = job.data;
  const startTime = Date.now();

  logger.info(`🎬 [STORY-WORKER] Processing Job ${job.id} for Media: ${mediaId} (${type})`);
  
  // 🔥 [IDEMPOTENCY] Senior Audit: Prevent duplicate/redundant processing
  const existingMedia = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { status: true }
  });

  if (!existingMedia) {
    logger.warn(`⚠️ [STORY-WORKER] Media record missing: ${mediaId}. Abandoning.`);
    return { mediaId, success: false, reason: "RECORD_MISSING" };
  }

  if (existingMedia.status === "READY") {
    logger.info(`✅ [STORY-WORKER] Media already READY: ${mediaId}. Skipping.`);
    return { mediaId, success: true, reason: "ALREADY_READY" };
  }

  // 1. Mark as PROCESSING
  await prisma.media.update({
    where: { id: mediaId },
    data: { status: "PROCESSING" },
  });

  emitToUser(userId, "story:status", { mediaId, status: "PROCESSING" });

  try {
    // 2. Fetch raw file from S3/R2
    logger.info(`📥 [FETCH] Downloading raw binary: ${key}`);
    const rawBuffer = await storage.getObject(key);

    emitToUser(userId, "story:progress", { mediaId, progress: 30 }); // 30% after download

    let results = {};

    // 3. Process to 'stories' folder with CDN-Optimized TTL (⚡ TEST MODE: 60 Seconds)
    const processingOptions = {
        cacheControl: "public, max-age=60, must-revalidate"
    };

    emitToUser(userId, "story:progress", { mediaId, progress: 60 }); 
    
    if (type === "VIDEO") {
      results = await processVideo(rawBuffer, userId, mediaId, STORAGE_FOLDERS.STORIES, processingOptions);
    } else {
      results = await processImage(rawBuffer, userId, mediaId, STORAGE_FOLDERS.STORIES, processingOptions);
    }
    emitToUser(userId, "story:progress", { mediaId, progress: 90 }); // 90% after processing

    // 4. Update DB
    await prisma.media.update({
      where: { id: mediaId },
      data: { ...results, status: "READY" },
    });

    // 5. Cleanup: Delete the Raw Source File (Save Storage Costs)
    logger.info(`🧹 [CLEANUP] Deleting raw source file: ${key}`);
    await storage.deleteObjects(key);

    // 6. Notify user via Socket (Real-time progress)
    emitToUser(userId, "story:progress", { mediaId, progress: 100 });
    emitToUser(userId, "story:status", { mediaId, status: "READY" });

    // 🚀 7. NOTIFY USER: "Your story is live!"
    await notificationService.notify({
        userId,
        type: "STORY_READY",
        title: "Story Live! 🎉",
        body: "Your story has been processed and is now live! Tap to view.",
        entityId: mediaId,
        entityType: "STORY"
    }).catch(e => logger.error(`[NOTIFICATION] Failed to send story success push: ${e.message}`));

    const durationMs = Date.now() - startTime;
    logger.info(`✨ [STORY-SUCCESS] Job finished in ${durationMs}ms for Media: ${mediaId}`);
    
    return { mediaId, success: true };

  } catch (error) {
    logger.error(`❌ [STORY-WORKER-FAIL] Failed for Media: ${mediaId}. Error: ${error.stack}`);
    
    await prisma.media.update({
      where: { id: mediaId },
      data: { status: "FAILED" },
    });

    emitToUser(userId, "story:status", { mediaId, status: "FAILED", error: error.message });
    throw error;
  }
};

export default storyProcessor;
