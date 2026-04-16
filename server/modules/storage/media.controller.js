import prisma from "../../config/prisma.js";
import storage from "./storage.service.js";
import { buildS3Key } from "./providers/s3/s3.utils.js";
import { STORAGE_FOLDERS } from "./providers/s3/s3.constants.js";
import { mediaQueue } from "../workers/queues.js";
import logger from "../../utils/logger.js";

/**
 * 🎬 MEDIA CONTROLLER (PRODUCTION READY)
 */

/**
 * 🛰️ STEP 1: Generate Signed URL
 * Called by frontend before upload.
 * Creates a PENDING media record and returns a PUT URL.
 */
export const getUploadUrl = async (req, res) => {
  try {
    const { filename, contentType, type = "IMAGE" } = req.query;
    const userId = req.user.id;

    // 1. Create PENDING record in DB
    const media = await prisma.media.create({
      data: {
        userId,
        type,
        storageKey: "pending", // Will be updated on confirm
        status: "PENDING",
      },
    });

    // 2. Generate unique S3 key for RAW storage
    const rawKey = buildS3Key(filename, STORAGE_FOLDERS.RAW, userId);

    // 3. Generate Signed PUT URL (valid for 5 mins)
    const signedUrl = await storage.getSignedUrl(rawKey, { 
      type: "PUT", 
      expiresIn: 300 
    });

    // 4. Update media with the actual key we expect
    await prisma.media.update({
      where: { id: media.id },
      data: { storageKey: rawKey, mimeType: contentType },
    });

    res.json({
      success: true,
      mediaId: media.id,
      uploadUrl: signedUrl,
      key: rawKey,
    });
  } catch (error) {
    logger.error(`❌ [MEDIA_API] getUploadUrl failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to generate upload URL" });
  }
};

/**
 * 🔔 STEP 2: Confirm Upload
 * Called by frontend after S3 upload is successful.
 * Transitions status to PROCESSING and kicks off background job.
 */
export const confirmUpload = async (req, res) => {
  try {
    const { mediaId } = req.body;
    const userId = req.user.id;

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media || media.userId !== userId) {
      return res.status(404).json({ success: false, message: "Media not found" });
    }

    // Update status to PROCESSING
    await prisma.media.update({
      where: { id: mediaId },
      data: { status: "PROCESSING" },
    });

    // Enqueue background processing job
    await mediaQueue.add("process-media", {
      mediaId,
      userId,
      key: media.storageKey,
      type: media.type,
    });

    res.json({
      success: true,
      message: "Processing started",
      status: "PROCESSING",
    });
  } catch (error) {
    logger.error(`❌ [MEDIA_API] confirmUpload failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to start processing" });
  }
};

export default { getUploadUrl, confirmUpload };
