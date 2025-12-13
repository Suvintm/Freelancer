// paymentRoutes.js - Routes for payment history and receipts
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminAuth.js";
import {
  getPaymentHistory,
  getPaymentStats,
  getPaymentById,
  getReceiptData,
  getAdminPaymentAnalytics,
  getAllPayments,
} from "../controllers/paymentController.js";

const router = express.Router();

// User routes (protected)
router.use(authMiddleware);

router.get("/history", getPaymentHistory);
router.get("/stats", getPaymentStats);
router.get("/:id", getPaymentById);
router.get("/:id/receipt", getReceiptData);

// Admin routes
router.get("/admin/analytics", protectAdmin, getAdminPaymentAnalytics);
router.get("/admin/all", protectAdmin, getAllPayments);

export default router;
