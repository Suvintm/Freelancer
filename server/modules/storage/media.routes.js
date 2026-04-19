import express from "express";
import { authenticate } from "../../middleware/authMiddleware.js";
import { getUploadUrl, confirmUpload } from "./media.controller.js";
import prisma from "../../config/prisma.js";
import { addMediaJob, mediaQueue } from "../workers/queues.js";
import logger from "../../utils/logger.js";

/**
 * 🎬 MEDIA ROUTES (PRODUCTION READY)
 */

const router = express.Router();

/**
 * @route   GET /api/media/signed-url
 * @desc    Generate an S3 pre-signed PUT URL for direct upload
 * @access  Private
 */
router.get("/signed-url", authenticate, getUploadUrl);

/**
 * @route   POST /api/media/confirm
 * @desc    Confirm upload is complete and start background processing
 * @access  Private
 */
router.post("/confirm", authenticate, confirmUpload);

/**
 * @route   GET /api/media/:id/status
 * @desc    Check current processing status for a media entity
 * @access  Private (Owner Only)
 */
router.get("/:id/status", authenticate, async (req, res) => {
  try {
    const media = await prisma.media.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true, userId: true, type: true }
    });

    if (!media) return res.status(404).json({ success: false, message: "Media not found" });
    if (media.userId !== req.user.id) return res.status(403).json({ success: false, message: "Unauthorized" });

    res.json({ success: true, status: media.status, type: media.type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/media/recovery/reset
 * @desc    Emergency Reset for failed/stuck media jobs
 */
router.post("/recovery/reset", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Find all eligible media
    const stuckMedia = await prisma.media.findMany({
      where: {
        userId,
        status: { in: ['FAILED', 'PROCESSING', 'PENDING'] }
      }
    });

    if (stuckMedia.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    // 2. Force reset in DB and Re-enqueue in BullMQ
    for (const media of stuckMedia) {
      // 🛡️ Remove old job if it exists to bypass BullMQ deduplication
      try {
        const oldJob = await mediaQueue.getJob(`media_${media.id}`);
        if (oldJob) await oldJob.remove();
      } catch (e) { /* ignore */ }

      // Reset to PROCESSING in DB
      await prisma.media.update({
        where: { id: media.id },
        data: { status: 'PROCESSING' }
      });

      // Send to worker
      await addMediaJob(media.id, media.storageKey, userId, media.type);
      logger.info(`♻️ [RECOVERY] Re-enqueued media: ${media.id}`);
    }

    res.json({ success: true, count: stuckMedia.length });
  } catch (error) {
    logger.error(`❌ [RECOVERY] Failed to reset media: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
