// refundRoutes.js - Refund API Routes
import express from "express";
import protect, { authorize } from "../../../../middleware/authMiddleware.js";
// import { protectAdmin } from "../../../../middleware/adminAuth.js";
import {
  initiateRefund,
  getMyRefunds,
  getOrderRefunds,
  getWalletBalance,
//   getAllRefunds,
//   retryRefund,
//   forceCreditToWallet,
//   getRefundStats,
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
// MOVED TO ADMIN-SERVER

export default router;





