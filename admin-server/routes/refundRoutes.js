// refundRoutes.js - Refund API Routes
import express from "express";
import protect from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminAuth.js";
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
router.post("/initiate/:orderId", protectAdmin, initiateRefund);

// Get all refunds (admin)
router.get("/admin/all", protectAdmin, getAllRefunds);

// Get refund statistics (admin)
router.get("/admin/stats", protectAdmin, getRefundStats);

// Retry failed refund (admin)
router.post("/admin/retry/:refundId", protectAdmin, retryRefund);

// Force credit to wallet (admin)
router.post("/admin/credit-wallet/:refundId", protectAdmin, forceCreditToWallet);

export default router;
