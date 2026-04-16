import prisma from "../../../config/prisma.js";
import storage from "../../storage/storage.service.js";
import { processImage } from "../../storage/processors/image.processor.js";
import { processVideo } from "../../storage/processors/video.processor.js";
import { hashFile, findDuplicate } from "../../storage/processors/dedup.processor.js";
import { validateMediaPayload } from "../jobValidator.js";
import { sampledLogger } from "../sampledLogger.js";
import { emitToUser } from "../../../socket.js";
import logger from "../../../utils/logger.js";

/**
 * 🎬 MEDIA PROCESSOR
 *
 * Core logic for optimizing images and videos.
 * Decoupled from the transport layer (BullMQ) for future-proofing.
 * Switching to Kafka means only modifying index.js — this file stays.
 *
 * Flow:
 *  1. Validate payload (fail fast if bad data)
 *  2. Mark media as PROCESSING in DB
 *  3. Fetch RAW file from S3
 *  4. Run deduplication check (SHA-256 hash)
 *  5. If duplicate → reuse existing data
 *  6. If new → process image or video
 *  7. Update DB with READY status + all metadata
 *  8. On retry → set RETRYING status instead of FAILED
 */
const mediaProcessor = async (job) => {
  const { mediaId, userId, key, type } = job.data;
  const startTime = Date.now();

  logger.info(`🎬 [WORKER] Processing Job ${job.id} for Media: ${mediaId} (${type})`);

  // ── STEP 1: Fail fast on bad payloads ─────────────────────────────────────
  validateMediaPayload(job.data);

  // ── STEP 2: Mark as PROCESSING in DB ──────────────────────────────────────
  await prisma.media.update({
    where: { id: mediaId },
    data: { status: "PROCESSING" },
  });

  try {
    // ── STEP 3: Fetch RAW file from S3 ──────────────────────────────────────
    await job.updateProgress(10);
    emitToUser(userId, "media:progress", { mediaId, progress: 10 });
    logger.info(`📥 [S3-FETCH] Downloading raw binary: ${key}`);
    const rawBuffer = await storage.getObject(key);
    logger.info(`📦 [SIZE] Received ${rawBuffer.length} bytes for Media: ${mediaId}`);
    
    await job.updateProgress(25);
    emitToUser(userId, "media:progress", { mediaId, progress: 25 });

    let results = {};

    // ── STEP 4 & 5: Deduplication Check ─────────────────────────────────────
    logger.info(`🔍 [DEDUP] Calculating SHA-256 hash for integrity check...`);
    const hash = hashFile(rawBuffer);
    const duplicate = await findDuplicate(hash);

    if (duplicate) {
      logger.info(`♻️ [DEDUP-HIT] Found existing media with hash: ${hash}. Linking to: ${duplicate.id}`);
      sampledLogger.success("Media dedup hit", { mediaId, existingId: duplicate.id });
      results = {
        variants: duplicate.variants,
        blurhash: duplicate.blurhash,
        width: duplicate.width,
        height: duplicate.height,
        duration: duplicate.duration,
        size: duplicate.size,
        hash,
      };
      await job.updateProgress(90);
      emitToUser(userId, "media:progress", { mediaId, progress: 90 });
    } else {
      // ── STEP 6: Process fresh content ───────────────────────────────────
      logger.info(`🔥 [PROCESS] Processing fresh ${type} content for Media: ${mediaId}`);
      if (type === "VIDEO") {
        results = await processVideo(rawBuffer, userId, mediaId);
      } else {
        results = await processImage(rawBuffer, userId, mediaId);
      }
      results.hash = hash;
      logger.info(`✅ [PROCESS-DONE] Completed processing for Media: ${mediaId}`);
      await job.updateProgress(90);
      emitToUser(userId, "media:progress", { mediaId, progress: 90 });
    }

    // ── STEP 7: Update DB — READY ─────────────────────────────────────────
    logger.info(`💾 [DB-WRITE] Committing READY status and metadata for: ${mediaId}`);
    await prisma.media.update({
      where: { id: mediaId },
      data: { ...results, status: "READY" },
    });

    await job.updateProgress(100);
    emitToUser(userId, "media:status", { mediaId, status: "READY", type });
    const durationMs = Date.now() - startTime;
    logger.info(`✨ [SUCCESS] Job finished in ${durationMs}ms for Media: ${mediaId}`);
    sampledLogger.success("Media processed", { jobId: job.id, mediaId, type, durationMs });
    return { mediaId, success: true };

  } catch (error) {
    // ── STEP 8: Smart failure handling ───────────────────────────────────────
    logger.error(`❌ [WORKER-FAIL] Processing failed for Media: ${mediaId}. Error: ${error.stack}`);
    
    const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 3) - 1;

    await prisma.media.update({
      where: { id: mediaId },
      data: {
        status: isFinalAttempt ? "FAILED" : "PROCESSING",
      },
    });

    if (isFinalAttempt) {
      emitToUser(userId, "media:status", { mediaId, status: "FAILED", error: error.message });
    }

    sampledLogger.error("Media processing failed", error, {
      jobId: job.id,
      mediaId,
      type,
      attemptsMade: job.attemptsMade,
      isFinalAttempt,
    });

    throw error; // Re-throw → BullMQ triggers retry logic
  }
};

export default mediaProcessor;
