// refundController.js - Refund processing controller
import asyncHandler from "express-async-handler";
import Razorpay from "razorpay";
import Refund from "../models/Refund.js";
import { Order } from "../models/Order.js";
import User from "../models/User.js";
import { ApiError } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Initiate refund for an order
 * @route   POST /api/refunds/initiate/:orderId
 * @access  Private (System/Admin)
 */
export const initiateRefund = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason, reasonDetails, initiatedBy = "system" } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Check if payment was completed
  if (order.paymentStatus !== "completed") {
    throw new ApiError(400, "No payment to refund for this order");
  }

  // Check if refund already exists
  const existingRefund = await Refund.findOne({ 
    order: orderId, 
    status: { $nin: ["failed", "cancelled"] } 
  });

  if (existingRefund) {
    throw new ApiError(400, `Refund already ${existingRefund.status} for this order`);
  }

  // Create refund record
  const refund = await Refund.createFromOrder(order, reason, initiatedBy);

  if (reasonDetails) {
    refund.reasonDetails = reasonDetails;
    await refund.save();
  }

  logger.info(`Refund initiated: Order ${orderId}, Amount ₹${refund.refundAmount}`);

  // Attempt to process refund immediately
  try {
    await processRefundInternal(refund);
  } catch (err) {
    logger.error(`Auto-process refund failed: ${err.message}`);
    // Refund will be retried later
  }

  res.status(201).json({
    success: true,
    message: "Refund initiated",
    refund: {
      _id: refund._id,
      amount: refund.refundAmount,
      status: refund.status,
      reason: refund.reason,
    },
  });
});

/**
 * Internal function to process refund via Razorpay
 */
const processRefundInternal = async (refund) => {
  try {
    refund.status = "processing";
    await refund.save();

    // Get original payment ID
    const razorpayPaymentId = refund.originalPayment?.razorpayPaymentId;

    if (!razorpayPaymentId) {
      // No Razorpay payment ID - add to wallet instead
      logger.warn(`No Razorpay payment ID for refund ${refund._id}, adding to wallet`);
      const transactionId = `wallet_${Date.now()}_${refund._id}`;
      await refund.creditToWallet(transactionId);
      
      // Create notification for client
      await createRefundNotification(refund.client, refund, "wallet");
      return;
    }

    // Attempt Razorpay refund
    const razorpayRefund = await razorpay.payments.refund(razorpayPaymentId, {
      amount: refund.refundAmount * 100, // Convert to paise
      speed: "normal",
      notes: {
        reason: refund.reason,
        orderId: refund.order.toString(),
        refundId: refund._id.toString(),
      },
      receipt: `refund_${refund._id.toString().slice(-12)}`,
    });

    // Update refund record
    refund.razorpayRefundId = razorpayRefund.id;
    refund.razorpayRefundStatus = razorpayRefund.status === "processed" ? "processed" : "pending";
    refund.status = razorpayRefund.status === "processed" ? "completed" : "processing";
    await refund.save();

    logger.info(`Razorpay refund created: ${razorpayRefund.id} for refund ${refund._id}`);

    // Create notification for client
    await createRefundNotification(refund.client, refund, "payment");

  } catch (err) {
    logger.error(`Razorpay refund failed: ${err.message}`, { 
      refundId: refund._id, 
      error: err.error || err 
    });

    // Razorpay refund failed - try wallet fallback
    if (err.statusCode === 400 || err.statusCode === 404) {
      logger.info(`Falling back to wallet for refund ${refund._id}`);
      const transactionId = `wallet_fallback_${Date.now()}_${refund._id}`;
      await refund.creditToWallet(transactionId);
      await createRefundNotification(refund.client, refund, "wallet");
      return;
    }

    // Mark as failed for retry
    await refund.markFailed(
      err.message || "Razorpay refund failed",
      err.error?.code || "UNKNOWN",
      err.error || err
    );
    await refund.incrementRetry();
  }
};

/**
 * Create notification for refund
 */
const createRefundNotification = async (clientId, refund, method) => {
  try {
    const Notification = (await import("../models/Notification.js")).default;
    
    const message = method === "wallet"
      ? `₹${refund.refundAmount} has been added to your wallet`
      : `₹${refund.refundAmount} refund initiated. It will be credited in 5-7 business days.`;

    await Notification.create({
      user: clientId,
      type: "payment",
      title: "Refund Processed",
      message,
      data: {
        refundId: refund._id,
        amount: refund.refundAmount,
        method,
      },
    });
  } catch (err) {
    logger.error(`Failed to create refund notification: ${err.message}`);
  }
};

/**
 * @desc    Get client's refund history
 * @route   GET /api/refunds/my
 * @access  Private (Client)
 */
export const getMyRefunds = asyncHandler(async (req, res) => {
  const clientId = req.user._id;
  const { page = 1, limit = 10, status } = req.query;

  const result = await Refund.getClientRefunds(clientId, { page, limit, status });

  res.json({
    success: true,
    ...result,
  });
});

/**
 * @desc    Get refund details for an order
 * @route   GET /api/refunds/order/:orderId
 * @access  Private (Client/Admin)
 */
export const getOrderRefunds = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const refunds = await Refund.find({ order: orderId })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    refunds,
  });
});

/**
 * @desc    Get client's wallet balance
 * @route   GET /api/refunds/wallet
 * @access  Private (Client)
 */
export const getWalletBalance = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("walletBalance walletLastUpdated");

  res.json({
    success: true,
    wallet: {
      balance: user.walletBalance || 0,
      lastUpdated: user.walletLastUpdated,
    },
  });
});

// ==================== ADMIN ENDPOINTS ====================

/**
 * @desc    Get all refunds (Admin)
 * @route   GET /api/refunds/admin/all
 * @access  Private (Admin)
 */
export const getAllRefunds = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, reason } = req.query;

  const query = {};
  if (status) query.status = status;
  if (reason) query.reason = reason;

  const [refunds, total] = await Promise.all([
    Refund.find(query)
      .populate("client", "name email")
      .populate("order", "orderNumber title")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(),
    Refund.countDocuments(query),
  ]);

  res.json({
    success: true,
    refunds,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Retry failed refund (Admin)
 * @route   POST /api/refunds/admin/retry/:refundId
 * @access  Private (Admin)
 */
export const retryRefund = asyncHandler(async (req, res) => {
  const { refundId } = req.params;

  const refund = await Refund.findById(refundId);

  if (!refund) {
    throw new ApiError(404, "Refund not found");
  }

  if (!refund.canRetry()) {
    throw new ApiError(400, `Refund cannot be retried. Status: ${refund.status}, Retries: ${refund.retryCount}/${refund.maxRetries}`);
  }

  // Reset for retry
  refund.status = "initiated";
  await refund.save();

  // Process again
  await processRefundInternal(refund);

  res.json({
    success: true,
    message: "Refund retry initiated",
    refund: {
      _id: refund._id,
      status: refund.status,
      retryCount: refund.retryCount,
    },
  });
});

/**
 * @desc    Force credit to wallet (Admin)
 * @route   POST /api/refunds/admin/credit-wallet/:refundId
 * @access  Private (Admin)
 */
export const forceCreditToWallet = asyncHandler(async (req, res) => {
  const { refundId } = req.params;

  const refund = await Refund.findById(refundId);

  if (!refund) {
    throw new ApiError(404, "Refund not found");
  }

  if (refund.status === "completed" || refund.status === "added_to_wallet") {
    throw new ApiError(400, "Refund already processed");
  }

  const transactionId = `admin_wallet_${Date.now()}_${refund._id}`;
  await refund.creditToWallet(transactionId);

  await createRefundNotification(refund.client, refund, "wallet");

  logger.info(`Admin force credited wallet for refund ${refundId}`);

  res.json({
    success: true,
    message: "Amount credited to client wallet",
    refund: {
      _id: refund._id,
      status: refund.status,
      walletCredited: refund.walletCredited,
    },
  });
});

/**
 * @desc    Get refund statistics (Admin)
 * @route   GET /api/refunds/admin/stats
 * @access  Private (Admin)
 */
export const getRefundStats = asyncHandler(async (req, res) => {
  const stats = await Refund.getStats(30);

  const formattedStats = {
    total: { count: 0, amount: 0 },
    initiated: { count: 0, amount: 0 },
    processing: { count: 0, amount: 0 },
    completed: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
    added_to_wallet: { count: 0, amount: 0 },
  };

  stats.forEach(s => {
    formattedStats[s._id] = {
      count: s.count,
      amount: s.totalAmount,
    };
    formattedStats.total.count += s.count;
    formattedStats.total.amount += s.totalAmount;
  });

  res.json({
    success: true,
    stats: formattedStats,
  });
});

/**
 * Auto-refund function (called from other controllers)
 */
export const autoRefundOrder = async (orderId, reason = "order_rejected") => {
  try {
    const order = await Order.findById(orderId);
    
    if (!order || order.paymentStatus !== "completed") {
      logger.warn(`Cannot auto-refund order ${orderId}: No completed payment`);
      return null;
    }

    // Check if refund already exists
    const existingRefund = await Refund.findOne({ 
      order: orderId, 
      status: { $nin: ["failed", "cancelled"] } 
    });

    if (existingRefund) {
      logger.warn(`Refund already exists for order ${orderId}`);
      return existingRefund;
    }

    const refund = await Refund.createFromOrder(order, reason, "system");
    
    // Process in background
    setImmediate(async () => {
      try {
        await processRefundInternal(refund);
      } catch (err) {
        logger.error(`Background refund processing failed: ${err.message}`);
      }
    });

    return refund;
  } catch (err) {
    logger.error(`Auto-refund failed for order ${orderId}: ${err.message}`);
    throw err;
  }
};
