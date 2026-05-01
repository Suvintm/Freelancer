/**
 * storyProcessor.js — BullMQ Story Processing Worker
 *
 * Key fixes vs previous version:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. CORRECT MEDIA TYPE DETECTION
 *    Previous code had both branches calling processImage.
 *    Now strictly: type === "VIDEO" → processVideo, else → processImage.
 *
 * 2. STORY TABLE UPDATE WITH CDN URLS
 *    Previous code only updated the Media table.
 *    Viewer's feed query reads bg_media_url directly from Story row —
 *    if never populated, the viewer gets null → black screen.
 *    Now: after processing, we update Story.bg_media_url, bg_thumb_url, bg_blurhash.
 *
 * 3. PRODUCTION CACHE CONTROL
 *    Stories expire in 12h. CDN cache-control set to match: max-age=43200.
 *    HLS .ts segments are immutable: max-age=31536000.
 *
 * 4. PROPER CLEANUP
 *    Raw upload key deleted after successful processing (saves storage costs).
 */

import prisma from "../../../config/prisma.js";
import storage from "../../storage/storage.service.js";
import { processImage } from "../../storage/processors/image.processor.js";
import { processVideo } from "../../storage/processors/video.processor.js";
import { emitToUser } from "../../../socket.js";
import { STORAGE_FOLDERS } from "../../storage/providers/s3/s3.constants.js";
import notificationService from "../../notification/services/notificationService.js";
import logger from "../../../utils/logger.js";

// CDN base for building absolute URLs from S3 keys
const CDN_BASE = (process.env.CDN_BASE_URL || "").replace(/\/$/, "");

/** Turn a storage key like "uploads/stories/..." into a full CDN URL */
const toCdnUrl = (key) => key ? `${CDN_BASE}/${key}` : null;

// ─────────────────────────────────────────────────────────────────────────────
// Main processor
// ─────────────────────────────────────────────────────────────────────────────
const storyProcessor = async (job) => {
  const { mediaId, userId, key, type } = job.data;
  const startTime = Date.now();

  logger.info(`🎬 [STORY-WORKER] Job ${job.id} | Media: ${mediaId} | Type: ${type}`);

  // ── Idempotency: don't reprocess already-ready media ─────────────────────
  const existingMedia = await prisma.media.findUnique({
    where:  { id: mediaId },
    select: { status: true },
  });

  if (!existingMedia) {
    logger.warn(`⚠️ [STORY-WORKER] Media ${mediaId} not found. Abandoning.`);
    return { mediaId, success: false, reason: "RECORD_MISSING" };
  }
  if (existingMedia.status === "READY") {
    logger.info(`✅ [STORY-WORKER] Media ${mediaId} already READY. Skipping.`);
    return { mediaId, success: true, reason: "ALREADY_READY" };
  }

  // ── Mark as PROCESSING ────────────────────────────────────────────────────
  await prisma.media.update({
    where: { id: mediaId },
    data:  { status: "PROCESSING" },
  });
  emitToUser(userId, "story:status",   { mediaId, status: "PROCESSING" });
  emitToUser(userId, "story:progress", { mediaId, progress: 10 });

  try {
    // ── 1. Download raw file from S3/R2 ──────────────────────────────────────
    logger.info(`📥 [STORY-WORKER] Downloading raw file: ${key}`);
    const rawBuffer = await storage.getObject(key);
    logger.info(`📦 [STORY-WORKER] Downloaded ${rawBuffer.length} bytes`);
    emitToUser(userId, "story:progress", { mediaId, progress: 30 });

    // ── 2. Process media ──────────────────────────────────────────────────────
    // Production cache-control: match story expiry (12h).
    // HLS .ts segments get immutable headers (set inside video.processor.js).
    const processingOptions = {
      // 🚀 Production Strategy: 12h Browser Cache, 24h CDN Edge Cache, 1h Stale revalidation
      cacheControl: "public, max-age=43200, s-maxage=86400, stale-while-revalidate=3600",
    };

    let results = {};

    // CRITICAL: strictly check type — do NOT process video as image or vice versa.
    if (type === "VIDEO") {
      logger.info(`🎥 [STORY-WORKER] Running VIDEO pipeline for ${mediaId}`);
      results = await processVideo(
        rawBuffer, userId, mediaId,
        STORAGE_FOLDERS.STORIES, processingOptions
      );
    } else if (type === "IMAGE") {
      logger.info(`🖼️ [STORY-WORKER] Running IMAGE pipeline for ${mediaId}`);
      results = await processImage(
        rawBuffer, userId, mediaId,
        STORAGE_FOLDERS.STORIES, processingOptions
      );
    } else {
      throw new Error(`Unknown media type: "${type}". Expected "VIDEO" or "IMAGE".`);
    }

    emitToUser(userId, "story:progress", { mediaId, progress: 80 });

    // ── 3. Update Media table ─────────────────────────────────────────────────
    await prisma.media.update({
      where: { id: mediaId },
      data:  { ...results, status: "READY" },
    });

    // ── 4. Update Story table with processed CDN URLs ─────────────────────────
    // The feed query reads bg_media_url directly from Story.
    // If this isn't updated, the viewer sees null → black screen.
    const story = await prisma.story.findFirst({
      where:  { mediaId },
      select: { id: true },
    });

    if (story) {
      const variants = results.variants ?? {};

      // Primary playback URL: Optimized MP4 (best compatibility), then HLS
      const primaryKey = type === "VIDEO"
        ? (variants.video || variants.hls || null)
        : (variants.full  || variants.feed  || null);

      await prisma.story.update({
        where: { id: story.id },
        data: {
          bg_media_url: toCdnUrl(primaryKey),
          bg_thumb_url: toCdnUrl(variants.thumb || variants.thumbnail || null),
          bg_blurhash:  results.blurhash ?? null,
        },
      });

      const isCdn = !!CDN_BASE;
      console.log(`✨ [STORY-SUCCESS] Story ${story.id} Updated!`);
      console.log(`   🔗 Delivery: ${isCdn ? '🚀 CDN (cdn.suvix.in)' : '📦 Direct S3'}`);
      console.log(`   📂 Primary Variant: ${primaryKey}`);
    } else {
      logger.warn(`⚠️ [STORY-WORKER] No Story row found for mediaId ${mediaId}`);
    }

    // ── 5. Delete raw upload (cost saving) ───────────────────────────────────
    logger.info(`🧹 [STORY-WORKER] Deleting raw upload: ${key}`);
    await storage.deleteObjects(key);

    // ── 6. Notify client ──────────────────────────────────────────────────────
    emitToUser(userId, "story:progress", { mediaId, progress: 100 });
    emitToUser(userId, "story:status",   { mediaId, status: "READY" });

    // Push notification
    await notificationService.notify({
      userId,
      type:       "STORY_READY",
      title:      "Story Live! 🎉",
      body:       "Your story has been processed and is now live.",
      entityId:   mediaId,
      entityType: "STORY",
    }).catch(e => logger.error(`[NOTIFICATION] Story ready push failed: ${e.message}`));

    const durationMs = Date.now() - startTime;
    logger.info(`✨ [STORY-SUCCESS] Job ${job.id} done in ${durationMs}ms for Media: ${mediaId}`);

    return { mediaId, success: true };

  } catch (error) {
    logger.error(`❌ [STORY-WORKER-FAIL] Media: ${mediaId}. Error: ${error.stack}`);

    await prisma.media.update({
      where: { id: mediaId },
      data:  { status: "FAILED" },
    });

    emitToUser(userId, "story:status", {
      mediaId,
      status: "FAILED",
      error:  error.message,
    });

    // Notify user of failure
    await notificationService.notify({
      userId,
      type:       "MEDIA_FAILED",
      title:      "Story Upload Failed ❌",
      body:       "Something went wrong processing your story. Please try again.",
      entityId:   mediaId,
      entityType: "STORY",
    }).catch(() => {});

    throw error; // Re-throw so BullMQ marks the job as failed
  }
};

export default storyProcessor;