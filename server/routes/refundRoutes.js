// refundRoutes.js - Refund API Routes
import express from "express";
import protect from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authMiddleware.js";
import {
  initiateRefund,
  getMyRefunds,
  getOrderRefunds,
  getWalletBalance,
  getAllRefunds,
  retryRefund,
  forceCreditToWallet,
  getRefundStats,
} from "../controllers/refundController.js";

const router = express.Router();

// ==================== CLIENT ENDPOINTS ====================

// Get my refunds
router.get("/my", protect, getMyRefunds);

// Get wallet balance
router.get("/wallet", protect, getWalletBalance);

// Get refunds for specific order
router.get("/order/:orderId", protect, getOrderRefunds);

// ==================== SYSTEM/ADMIN ENDPOINTS ====================

// Initiate refund (system/admin only)
router.post("/initiate/:orderId", protect, authorize("admin"), initiateRefund);

// Get all refunds (admin)
router.get("/admin/all", protect, authorize("admin"), getAllRefunds);

// Get refund statistics (admin)
router.get("/admin/stats", protect, authorize("admin"), getRefundStats);

// Retry failed refund (admin)
router.post("/admin/retry/:refundId", protect, authorize("admin"), retryRefund);

// Force credit to wallet (admin)
router.post("/admin/credit-wallet/:refundId", protect, authorize("admin"), forceCreditToWallet);

export default router;
