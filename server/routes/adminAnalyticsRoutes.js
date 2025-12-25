/**
 * Admin Analytics Routes
 * Routes for service analytics (Cloudinary, MongoDB, Razorpay)
 */

import express from "express";
import {
  getCloudinaryAnalytics,
  getMongoDBAnalytics,
  getRazorpayAnalytics,
  getOverviewAnalytics
} from "../controllers/adminAnalyticsController.js";
import { protectAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

/**
 * @route   GET /api/admin/analytics/overview
 * @desc    Get combined overview of all services
 * @access  Admin only
 */
router.get("/overview", getOverviewAnalytics);

/**
 * @route   GET /api/admin/analytics/cloudinary
 * @desc    Get Cloudinary usage analytics
 * @access  Admin only
 */
router.get("/cloudinary", getCloudinaryAnalytics);

/**
 * @route   GET /api/admin/analytics/mongodb
 * @desc    Get MongoDB usage analytics
 * @access  Admin only
 */
router.get("/mongodb", getMongoDBAnalytics);

/**
 * @route   GET /api/admin/analytics/razorpay
 * @desc    Get Razorpay payment analytics
 * @access  Admin only
 */
router.get("/razorpay", getRazorpayAnalytics);

export default router;
