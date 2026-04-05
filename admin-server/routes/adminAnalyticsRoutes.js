/**
 * Admin Analytics Routes
 * Routes for service analytics (Cloudinary, MongoDB, Razorpay)
 */

import express from "express";
import {
  getCloudinaryAnalytics,
  getMongoDBAnalytics,
  getRazorpayAnalytics,
  getOverviewAnalytics,
  getOrderStats,
  getRevenueChart,
  getServiceHealth
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

/**
 * @route   GET /api/admin/analytics/order-stats
 * @desc    Get order statistics and trends
 * @access  Admin only
 */
router.get("/order-stats", getOrderStats);

/**
 * @route   GET /api/admin/analytics/revenue-chart
 * @desc    Get revenue chart data
 * @access  Admin only
 */
router.get("/revenue-chart", getRevenueChart);

/**
 * @route   GET /api/admin/analytics/service-health
 * @desc    Get real-time service health checks (PG, Mongo, etc)
 * @access  Admin only
 */
router.get("/service-health", getServiceHealth);

export default router;
