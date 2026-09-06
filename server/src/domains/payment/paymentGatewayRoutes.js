/**
 * Payment Gateway Routes (Node.js Gateway Proxy)
 * All transactions, escrow, and refunds are routed to Java Payment Microservice (Port 8080)
 */

import express from "express";
import authMiddleware from "../../shared/middleware/auth.middleware.js";
import { proxyToPaymentService } from "../../infrastructure/gateway/javaPayment.client.js";
import { publicApiLimiter, heavyLimiter, interactionLimiter } from "../../shared/middleware/rate-limiter.middleware.js";
import { getPaymentConfig } from "./controllers/paymentGatewayController.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * Razorpay webhook — Forwarded to Java Webhook Controller
 */
router.post("/webhook/razorpay", (req, res) =>
  proxyToPaymentService(req, res, "post", "/webhooks/razorpay")
);

/**
 * Public Callback for Razorpay redirects (Mobile)
 */
router.post("/callback", interactionLimiter, (req, res) =>
  proxyToPaymentService(req, res, "post", "/payments/verify")
);

// ==================== PROTECTED ROUTES ====================
router.use(authMiddleware);

/**
 * GET /api/payment-gateway/config
 */
router.get("/config", publicApiLimiter, getPaymentConfig);

/**
 * POST /api/payment-gateway/create-order -> Java Payment Service
 */
router.post("/create-order", heavyLimiter, (req, res) =>
  proxyToPaymentService(req, res, "post", "/payments/create-order")
);

/**
 * POST /api/payment-gateway/verify -> Java Payment Service
 */
router.post("/verify", heavyLimiter, (req, res) =>
  proxyToPaymentService(req, res, "post", "/payments/verify")
);

/**
 * POST /api/payment-gateway/refund -> Java Payment Service
 */
router.post("/refund", heavyLimiter, (req, res) =>
  proxyToPaymentService(req, res, "post", "/payments/refund")
);

export default router;
