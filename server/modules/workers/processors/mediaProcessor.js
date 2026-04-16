import prisma from "../../../config/prisma.js";
import storage from "../../storage/storage.service.js";
import { processImage } from "../../storage/processors/image.processor.js";
import { processVideo } from "../../storage/processors/video.processor.js";
import { hashFile, findDuplicate } from "../../storage/processors/dedup.processor.js";
import { validateMediaPayload } from "../jobValidator.js";
import { sampledLogger } from "../sampledLogger.js";
import { emitToUser } from "../../../socket.js";

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
    logger.info(`📥 [S3] Downloading raw binary: ${key}`);
    const rawBuffer = await storage.getObject(key);
    await job.updateProgress(25);
    emitToUser(userId, "media:progress", { mediaId, progress: 25 });

    let results = {};

    // ── STEP 4 & 5: Deduplication Check ─────────────────────────────────────
    logger.info(`🔍 [DEDUP] Calculating SHA-256 hash for integrity check...`);
    const hash = hashFile(rawBuffer);
    const duplicate = await findDuplicate(hash);

    if (duplicate) {
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
      if (type === "VIDEO") {
        results = await processVideo(rawBuffer, userId, mediaId);
      } else {
        results = await processImage(rawBuffer, userId, mediaId);
      }
      results.hash = hash;
      await job.updateProgress(90);
      emitToUser(userId, "media:progress", { mediaId, progress: 90 });
    }

    // ── STEP 7: Update DB — READY ─────────────────────────────────────────
    logger.info(`💾 [DB] Finalizing media record for: ${mediaId}`);
    await prisma.media.update({
      where: { id: mediaId },
      data: { ...results, status: "READY" },
    });

    await job.updateProgress(100);
    emitToUser(userId, "media:status", { mediaId, status: "READY", type });
    const durationMs = Date.now() - startTime;
    sampledLogger.success("Media processed", { jobId: job.id, mediaId, type, durationMs });
    return { mediaId, success: true };

  } catch (error) {
    // ── STEP 8: Smart failure handling ───────────────────────────────────────
    // On a retry attempt → set RETRYING so the user knows it's not permanently broken
    // On the FINAL attempt → FAILED
    const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 3) - 1;

    await prisma.media.update({
      where: { id: mediaId },
      data: {
        status: isFinalAttempt ? "FAILED" : "PROCESSING",
        // Note: RETRYING is not a Prisma enum value yet.
        // If you want to show RETRYING: add it to schema.prisma MediaStatus enum.
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
