/**
 * Brief Routes - For Open Briefs feature
 */
import express from "express";
import protect from "../middleware/authMiddleware.js";
import { generalLimiter } from "../middleware/rateLimiter.js";
import {
  createBrief,
  getOpenBriefs,
  getMyBriefs,
  getBriefById,
  updateBrief,
  cancelBrief,
  extendDeadline,
  getBriefStats,
} from "../controllers/briefController.js";

const router = express.Router();

// Apply rate limiting
router.use(generalLimiter);

// ============ CLIENT ROUTES ============
// Create new brief (clients only)
router.post("/", protect, createBrief);

// Get client's own briefs
router.get("/my", protect, getMyBriefs);

// Get brief stats for client dashboard
router.get("/stats", protect, getBriefStats);

// Update brief
router.patch("/:id", protect, updateBrief);

// Cancel brief
router.delete("/:id", protect, cancelBrief);

// Extend deadline
router.post("/:id/extend", protect, extendDeadline);

// ============ EDITOR ROUTES ============
// Get all open briefs (editors browse)
router.get("/", protect, getOpenBriefs);

// Get single brief by ID
router.get("/:id", protect, getBriefById);

export default router;
