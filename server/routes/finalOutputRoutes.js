/**
 * Final Output Routes
 * 
 * Endpoints for editor final output submissions and client downloads
 */

import express from "express";
import {
  getUploadUrlForOutput,
  createFinalOutput,
  getFinalOutput,
  approveFinalOutput,
  rejectFinalOutput,
  getDownloadUrlForOutput,
  getLatestOutputForOrder,
  cleanupExpiredOutputs,
} from "../controllers/finalOutputController.js";
import  protect  from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Editor: Get presigned upload URL
router.post("/upload-url", getUploadUrlForOutput);

// Editor: Create final output record after upload
router.post("/:orderId", createFinalOutput);

// Get final output details
router.get("/:id", getFinalOutput);

// Get latest output for an order
router.get("/order/:orderId/latest", getLatestOutputForOrder);

// Client: Approve output
router.post("/:id/approve", approveFinalOutput);

// Client: Reject output
router.post("/:id/reject", rejectFinalOutput);

// Client: Get download URL (after approval)
router.get("/:id/download-url", getDownloadUrlForOutput);

// System: Cleanup expired outputs (should be called by cron/internal only)
router.post("/cleanup", cleanupExpiredOutputs);

export default router;
