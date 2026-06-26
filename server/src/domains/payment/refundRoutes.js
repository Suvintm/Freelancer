// refundRoutes.js - Refund API Routes
import express from "express";
import protect, { authorize } from "../../shared/middleware/auth.middleware.js";
// import { protectAdmin } from "../../shared/middleware/admin-auth.middleware.js";
import {
  initiateRefund,
  getMyRefunds,
  getOrderRefunds,
  getWalletBalance,
//   getAllRefunds,
//   retryRefund,
//   forceCreditToWallet,
//   getRefundStats,
} from "./controllers/refundController.js";

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






