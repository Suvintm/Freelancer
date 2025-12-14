/**
 * Payment Gateway Routes
 * Routes for payment processing, verification, and webhooks
 */

import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminAuth.js";
import {
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  processRefund,
} from "../controllers/paymentGatewayController.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * Razorpay webhook endpoint
 * Must be before auth middleware as webhooks don't have user auth
 * Uses raw body for signature verification
 */
router.post("/webhook/razorpay", express.raw({ type: "application/json" }), handleWebhook);

// ==================== PROTECTED ROUTES ====================

// Apply auth middleware to all routes below
router.use(authMiddleware);

/**
 * GET /api/payment-gateway/config
 * Get payment configuration for frontend
 */
router.get("/config", getPaymentConfig);

/**
 * POST /api/payment-gateway/create-order
 * Create a Razorpay order for payment
 */
router.post("/create-order", createPaymentOrder);

/**
 * POST /api/payment-gateway/verify
 * Verify payment after Razorpay checkout
 */
router.post("/verify", verifyPayment);

/**
 * POST /api/payment-gateway/refund
 * Process refund for an order (Admin only for manual refunds)
 */
router.post("/refund", protectAdmin, processRefund);

export default router;

