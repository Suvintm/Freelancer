/**
 * Profile Insights Routes
 * Provides visitor analytics - some require subscription
 */

import express from "express";
import protect from "../middleware/authMiddleware.js";
import { requireSubscription } from "../middleware/checkSubscription.js";
import {
  getBasicStats,
  getVisitorStats,
  getVisitors,
  exportVisitors,
  getVisitorDetails,
} from "../controllers/profileInsightsController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ============ FREE ROUTES ============
// Basic stats (count only) - available to all
router.get("/stats/basic", getBasicStats);

// ============ PRO ROUTES (Require Subscription) ============
const requireProfileInsights = requireSubscription("profile_insights");

// Detailed visitor statistics
router.get("/stats", requireProfileInsights, getVisitorStats);

// Get visitors list with pagination
router.get("/visitors", requireProfileInsights, getVisitors);

// Export visitors as CSV
router.get("/export", requireProfileInsights, exportVisitors);

// Get single visitor details
router.get("/visitor/:visitorId", requireProfileInsights, getVisitorDetails);

export default router;
