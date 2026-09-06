/**
 * Invoice Gateway Routes (Node.js Gateway Proxy)
 * All invoice history and PDF downloads are routed to Java Payment Microservice (Port 8080)
 */

import express from "express";
import { proxyToPaymentService } from "../../infrastructure/gateway/javaPayment.client.js";
import { publicApiLimiter } from "../../shared/middleware/rate-limiter.middleware.js";

const router = express.Router();

/**
 * GET /api/v1/invoices -> Java Payment Service /api/v1/invoices
 */
router.get("/", publicApiLimiter, (req, res) =>
  proxyToPaymentService(req, res, "get", "/invoices")
);

/**
 * GET /api/v1/invoices/:id -> Java Payment Service /api/v1/invoices/:id
 */
router.get("/:id", publicApiLimiter, (req, res) =>
  proxyToPaymentService(req, res, "get", `/invoices/${req.params.id}`)
);

/**
 * GET /api/v1/invoices/:id/pdf -> Java Payment Service /api/v1/invoices/:id/pdf
 */
router.get("/:id/pdf", publicApiLimiter, (req, res) =>
  proxyToPaymentService(req, res, "get", `/invoices/${req.params.id}/pdf`)
);

export default router;
