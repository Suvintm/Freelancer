/**
 * Payment Gateway Routes
 * Routes for payment processing, verification, and webhooks
 *
 * MICROSERVICE MIGRATION NOTE:
 * ─────────────────────────────────────────────────────────
 * createPaymentOrder, verifyPayment, processRefund have been
 * migrated to the Java Payment Service (payment-service/).
 * Node.js now acts as an authenticated proxy for these routes.
 *
 * Kept in Node.js:
 *   ✅ getPaymentConfig  — just returns env vars, no logic
 *   ✅ handleWebhook     — Razorpay calls this directly (HMAC in Node is fine)
 *
 * Proxied to Java:
 *   🔀 createPaymentOrder → POST /api/v1/payments/create-order
 *   🔀 verifyPayment      → POST /api/v1/payments/verify
 *   🔀 processRefund      → POST /api/v1/payments/refund
 */

import express from "express";
import authMiddleware from "../../../middleware/authMiddleware.js";
// import { protectAdmin } from "../../../middleware/adminAuth.js";
import { proxyToPaymentService } from "../../../kafka/paymentProxy.js";

// ── RESTORED: Native Node (Java is not ready due to Kafka) ──────────────
import {
  getPaymentConfig,
  handleWebhook,
  verifyPaymentCallback,
  createPaymentOrder,
  verifyPayment,
  processRefund,
} from "../controllers/paymentGatewayController.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * Razorpay webhook — stays in Node.js.
 * Razorpay calls this directly. HMAC verification happens here.
 */
router.post("/webhook/razorpay", express.raw({ type: "application/json" }), handleWebhook);

/**
 * Public Callback for Razorpay redirects (Mobile)
 */
router.post("/callback", verifyPaymentCallback);

// ==================== PROTECTED ROUTES ====================
router.use(authMiddleware);

/**
 * GET /api/payment-gateway/config
 */
router.get("/config", getPaymentConfig);

/**
 * POST /api/payment-gateway/create-order
 * Uses native Node.js Razorpay logic
 */
router.post("/create-order", createPaymentOrder);

/**
 * POST /api/payment-gateway/verify
 * Uses native Node.js Razorpay logic
 */
router.post("/verify", verifyPayment);

/**
 * POST /api/payment-gateway/refund
 */
router.post("/refund", processRefund);

/**
 * POST /api/payment-gateway/refund
 * MOVED TO ADMIN-SERVER
 */
// router.post("/refund", protectAdmin, (req, res) =>
//   proxyToPaymentService(req, res, "post", "/payments/refund")
// );

export default router;


