/**
 * Payment Gateway Routes
 * Routes for payment processing, verification, and webhooks
 */

import express from "express";
import authMiddleware from "../../shared/middleware/auth.middleware.js";
import { publicApiLimiter, heavyLimiter, interactionLimiter } from "../../shared/middleware/rate-limiter.middleware.js";
import {
  getPaymentConfig,
  handleWebhook,
  verifyPaymentCallback,
  createPaymentOrder,
  verifyPayment,
  processRefund,
} from "./controllers/paymentGatewayController.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * Razorpay webhook — stays in Node.js.
 * Razorpay calls this directly. HMAC verification happens here.
 */
router.post("/webhook/razorpay", handleWebhook);

/**
 * Public Callback for Razorpay redirects (Mobile)
 */
router.post("/callback", interactionLimiter, verifyPaymentCallback);

// ==================== PROTECTED ROUTES ====================
router.use(authMiddleware);

/**
 * GET /api/payment-gateway/config
 */
router.get("/config", publicApiLimiter, getPaymentConfig);

/**
 * POST /api/payment-gateway/create-order
 */
router.post("/create-order", heavyLimiter, createPaymentOrder);

/**
 * POST /api/payment-gateway/verify
 */
router.post("/verify", heavyLimiter, verifyPayment);

/**
 * POST /api/payment-gateway/refund
 */
router.post("/refund", heavyLimiter, processRefund);

export default router;

