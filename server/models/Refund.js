// Refund.js - Refund Transaction Model
// Tracks all refund operations for orders

import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    // === Core References ===
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    editor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // === Payment Reference ===
    originalPayment: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      amount: Number,
      paidAt: Date,
    },

    // === Refund Details ===
    refundAmount: {
      type: Number,
      required: true,
      min: [1, "Refund amount must be at least ₹1"],
    },

    currency: {
      type: String,
      default: "INR",
    },

    // === Razorpay Refund ===
    razorpayRefundId: {
      type: String,
      sparse: true,
      index: true,
    },

    razorpayRefundStatus: {
      type: String,
      enum: ["pending", "processed", "failed"],
    },

    // === Refund Status ===
    status: {
      type: String,
      enum: [
        "initiated",       // Refund created
        "processing",      // Being processed by payment gateway
        "completed",       // Successfully refunded
        "failed",          // Failed, needs retry
        "cancelled",       // Cancelled by admin
        "added_to_wallet", // Added to client wallet instead
      ],
      default: "initiated",
      index: true,
    },

    // === Refund Reason ===
    reason: {
      type: String,
      enum: [
        "order_rejected",       // Editor rejected the order
        "order_cancelled",      // Order was cancelled
        "editor_no_response",   // Editor didn't respond in time
        "client_request",       // Client requested cancellation
        "dispute_resolved",     // Dispute resolved in client's favor
        "payment_failed",       // Original payment issues
        "duplicate_payment",    // Double payment detected
        "admin_initiated",      // Admin initiated refund
        "other",
      ],
      required: true,
    },

    reasonDetails: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // === Refund Method ===
    refundMethod: {
      type: String,
      enum: ["original_payment", "bank_transfer", "upi", "wallet"],
      default: "original_payment",
    },

    // Bank details (if bank_transfer) - copied from KYC at time of refund
    bankDetails: {
      accountNumber: String, // Masked
      ifscCode: String,
      bankName: String,
      holderName: String,
    },

    upiId: String, // If UPI refund

    // === Wallet Credit ===
    walletCredited: {
      type: Boolean,
      default: false,
    },

    walletTransactionId: String,

    // === Processing Info ===
    initiatedBy: {
      type: String,
      enum: ["system", "admin", "client", "editor"],
      default: "system",
    },

    initiatedByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    processedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    // === Retry Handling ===
    retryCount: {
      type: Number,
      default: 0,
    },

    maxRetries: {
      type: Number,
      default: 3,
    },

    lastRetryAt: {
      type: Date,
    },

    nextRetryAt: {
      type: Date,
    },

    // === Error Handling ===
    failureReason: {
      type: String,
    },

    errorCode: {
      type: String,
    },

    errorDetails: {
      type: mongoose.Schema.Types.Mixed,
    },

    // === Admin Notes ===
    adminNotes: {
      type: String,
      trim: true,
    },

    // === Notification Tracking ===
    notificationsSent: {
      initiated: { type: Boolean, default: false },
      completed: { type: Boolean, default: false },
      failed: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// === Indexes ===
refundSchema.index({ status: 1, createdAt: -1 });
refundSchema.index({ client: 1, status: 1 });
refundSchema.index({ order: 1 });
refundSchema.index({ razorpayRefundId: 1 }, { sparse: true });

// === Pre-save middleware ===
refundSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "processing" && !this.processedAt) {
      this.processedAt = new Date();
    }
    if (this.status === "completed" && !this.completedAt) {
      this.completedAt = new Date();
    }
  }
  next();
});

// === Instance Methods ===

// Check if refund can be retried
refundSchema.methods.canRetry = function () {
  return (
    this.status === "failed" &&
    this.retryCount < this.maxRetries
  );
};

// Increment retry count
refundSchema.methods.incrementRetry = function () {
  this.retryCount += 1;
  this.lastRetryAt = new Date();
  // Exponential backoff: 1 min, 5 min, 30 min
  const delayMinutes = Math.pow(5, this.retryCount);
  this.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
  return this.save();
};

// Mark as completed
refundSchema.methods.markCompleted = function (razorpayRefundId) {
  this.status = "completed";
  this.razorpayRefundId = razorpayRefundId || this.razorpayRefundId;
  this.razorpayRefundStatus = "processed";
  this.completedAt = new Date();
  return this.save();
};

// Mark as failed
refundSchema.methods.markFailed = function (reason, errorCode, errorDetails) {
  this.status = "failed";
  this.failureReason = reason;
  this.errorCode = errorCode;
  this.errorDetails = errorDetails;
  return this.save();
};

// Add to wallet instead
refundSchema.methods.creditToWallet = async function (transactionId) {
  const User = mongoose.model("User");
  
  await User.findByIdAndUpdate(this.client, {
    $inc: { walletBalance: this.refundAmount },
  });

  this.status = "added_to_wallet";
  this.walletCredited = true;
  this.walletTransactionId = transactionId;
  this.completedAt = new Date();
  return this.save();
};

// === Static Methods ===

// Get refunds for a client
refundSchema.statics.getClientRefunds = async function (clientId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  
  const query = { client: clientId };
  if (status) query.status = status;

  const [refunds, total] = await Promise.all([
    this.find(query)
      .populate("order", "orderNumber title")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    this.countDocuments(query),
  ]);

  return { refunds, total, pages: Math.ceil(total / limit) };
};

// Get refunds needing retry
refundSchema.statics.getPendingRetries = async function () {
  return this.find({
    status: "failed",
    retryCount: { $lt: 3 },
    nextRetryAt: { $lte: new Date() },
  })
    .populate("client", "name email")
    .populate("order", "orderNumber")
    .limit(50);
};

// Get refund stats for admin
refundSchema.statics.getStats = async function (dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);

  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$refundAmount" },
      },
    },
  ]);
};

// Create refund from order
refundSchema.statics.createFromOrder = async function (order, reason, initiatedBy = "system") {
  const refund = new this({
    order: order._id,
    client: order.client,
    editor: order.editor,
    originalPayment: {
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      amount: order.totalAmount,
      paidAt: order.paidAt,
    },
    refundAmount: order.totalAmount,
    reason,
    initiatedBy,
    refundMethod: "original_payment", // Default to original payment method
  });

  return refund.save();
};

const Refund = mongoose.model("Refund", refundSchema);

export default Refund;
