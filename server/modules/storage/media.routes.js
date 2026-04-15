import express from "express";
import { authenticate } from "../../middleware/authMiddleware.js";
import { getUploadUrl, confirmUpload } from "./media.controller.js";

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

export default router;
