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
import authMiddleware from "../middleware/authMiddleware.js";
// import { protectAdmin } from "../middleware/adminAuth.js";
import { proxyToPaymentService } from "../kafka/paymentProxy.js";

// ── Kept in Node (no Java needed for these) ──────────────────────
import {
  getPaymentConfig,
  handleWebhook,
} from "../controllers/paymentGatewayController.js";

// ── Commented out — migrated to Java Payment Service ─────────────
// import {
//   createPaymentOrder,   // → Java: PaymentController.createOrder()
//   verifyPayment,        // → Java: PaymentController.verifyPayment()
//   processRefund,        // → Java: RefundService.processRefund()
// } from "../controllers/paymentGatewayController.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * Razorpay webhook — stays in Node.js.
 * Razorpay calls this directly. HMAC verification happens here.
 */
router.post("/webhook/razorpay", express.raw({ type: "application/json" }), handleWebhook);

// ==================== PROTECTED ROUTES ====================
router.use(authMiddleware);

/**
 * GET /api/payment-gateway/config
 * Returns Razorpay key for frontend — stays in Node.js (just env var).
 */
router.get("/config", getPaymentConfig);

/**
 * POST /api/payment-gateway/create-order
 * 🔀 PROXIED → Java Payment Service
 * Creates Razorpay order and returns orderId for frontend popup.
 */
router.post("/create-order", (req, res) =>
  proxyToPaymentService(req, res, "post", "/payments/create-order")
);

/**
 * POST /api/payment-gateway/verify
 * 🔀 PROXIED → Java Payment Service
 * Verifies HMAC, saves Payment record, publishes Kafka event.
 */
router.post("/verify", (req, res) =>
  proxyToPaymentService(req, res, "post", "/payments/verify")
);

/**
 * POST /api/payment-gateway/refund
 * MOVED TO ADMIN-SERVER
 */
// router.post("/refund", protectAdmin, (req, res) =>
//   proxyToPaymentService(req, res, "post", "/payments/refund")
// );

export default router;
