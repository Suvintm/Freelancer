import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * @desc    Get user's wallet balance and stats
 * @route   GET /api/wallet/balance
 * @access  Private (Editor)
 */
export const getWalletBalance = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("walletBalance pendingBalance lifetimeEarnings totalWithdrawn");
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json({
    success: true,
    wallet: {
      available: user.walletBalance || 0,          // Can withdraw now
      pending: user.pendingBalance || 0,           // In clearance (7 days)
      lifetime: user.lifetimeEarnings || 0,        // All time earned
      withdrawn: user.totalWithdrawn || 0,         // All time withdrawn
      total: (user.walletBalance || 0) + (user.pendingBalance || 0), // Total held by platform
    }
  });
});

/**
 * @desc    Get user's wallet transaction history
 * @route   GET /api/wallet/transactions
 * @access  Private (Editor)
 */
export const getWalletTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, status } = req.query;
  
  const query = { user: req.user._id };
  if (type) query.type = type;
  if (status) query.status = status;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const transactions = await WalletTransaction.find(query)
    .populate("order", "orderNumber title amount")
    .populate("withdrawal", "amount status requestedAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
  const total = await WalletTransaction.countDocuments(query);

  res.json({ 
    success: true, 
    transactions,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get transactions pending clearance
 * @route   GET /api/wallet/pending
 * @access  Private (Editor)
 */
export const getPendingClearance = asyncHandler(async (req, res) => {
  const transactions = await WalletTransaction.find({
    user: req.user._id,
    status: "pending_clearance"
  })
  .populate("order", "orderNumber title")
  .sort({ clearanceDate: 1 });

  res.json({
    success: true,
    count: transactions.length,
    transactions
  });
});
