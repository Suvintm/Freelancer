/**
 * Payment Routes — payment history and receipts
 *
 * MICROSERVICE MIGRATION NOTE:
 * ─────────────────────────────────────────────────────────
 * All routes below are now proxied to the Java Payment Service.
 * Old controller imports are commented out for rollback safety.
 */

import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
// import { protectAdmin } from "../middleware/adminAuth.js";
import { proxyToPaymentService } from "../kafka/paymentProxy.js";

// ── Commented out — migrated to Java Payment Service ─────────────
// import {
//   getPaymentHistory,          // → Java: PaymentHistoryService
//   getPaymentStats,            // → Java: PaymentHistoryService
//   getPaymentById,             // → Java: PaymentRepository.findById()
//   getReceiptData,             // → Java: PaymentHistoryService
//   getAdminPaymentAnalytics,   // → Java: PaymentHistoryService admin
//   getAllPayments,             // → Java: PaymentRepository.findAll()
// } from "../controllers/paymentController.js";

const router = express.Router();

// Admin routes (MOVED TO ADMIN-SERVER)
// router.get("/admin/analytics", protectAdmin, (req, res) => proxyToPaymentService(req, res, "get", "/payments/admin/analytics"));
// router.get("/admin/all",       protectAdmin, (req, res) => proxyToPaymentService(req, res, "get", "/payments/admin/all"));

// User routes (protected)
router.use(authMiddleware);

// 🔀 PROXIED → Java Payment Service
router.get("/history",       (req, res) => proxyToPaymentService(req, res, "get", "/payments/history"));
router.get("/stats",         (req, res) => proxyToPaymentService(req, res, "get", "/payments/stats"));
router.get("/:id/receipt",   (req, res) => proxyToPaymentService(req, res, "get", `/payments/${req.params.id}/receipt`));
router.get("/:id",           (req, res) => proxyToPaymentService(req, res, "get", `/payments/${req.params.id}`));

export default router;
