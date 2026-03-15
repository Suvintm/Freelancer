/**
 * Payment Routes — payment history and receipts
 *
 * Reverted from Microservice: Now using native Node.js controllers
 */

import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminAuth.js";

import {
  getPaymentHistory,
  getPaymentStats,
  getPaymentById,
  getReceiptData,
} from "../../server/controllers/paymentController.js";

import { getAllPayments } from "../controllers/adminPaymentController.js";
import { getRazorpayAnalytics as getAdminPaymentAnalytics } from "../controllers/adminAnalyticsController.js";

const router = express.Router();

// Admin routes (Moved above global authMiddleware to avoid path interception)
router.get("/admin/analytics", protectAdmin, getAdminPaymentAnalytics);
router.get("/admin/all",       protectAdmin, getAllPayments);

// User routes (protected)
router.use(authMiddleware);

// Native Node.js endpoints
router.get("/history",       getPaymentHistory);
router.get("/stats",         getPaymentStats);
router.get("/:id/receipt",   getReceiptData);
router.get("/:id",           getPaymentById);

export default router;
