// Payment.js - Track all payment transactions
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // Reference IDs
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
      required: true,
      index: true,
    },
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
    },

    // Payment amounts
    amount: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      required: true,
    },
    editorEarning: {
      type: Number,
      required: true,
    },

    // Payment type
    type: {
      type: String,
      enum: ["escrow_deposit", "escrow_release", "refund", "direct"],
      required: true,
    },

    // Payment status
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },

    // Transaction IDs (for Stripe integration later)
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripePaymentIntentId: String,
    stripeTransferId: String,

    // Order details snapshot (for receipt)
    orderSnapshot: {
      orderNumber: String,
      title: String,
      description: String,
      createdAt: Date,
      completedAt: Date,
      deadline: Date,
    },

    // Timestamps
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    
    // Receipt tracking
    receiptNumber: {
      type: String,
      unique: true,
    },
    receiptDownloadedAt: Date,

    // Notes
    notes: String,
  },
  { timestamps: true }
);

// Generate receipt number before save
paymentSchema.pre("save", function (next) {
  if (!this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(10000 + Math.random() * 90000);
    this.receiptNumber = `RCP-${year}${month}-${random}`;
  }
  next();
});

// Generate unique transaction ID
paymentSchema.pre("save", function (next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.transactionId = `TXN-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Indexes for queries
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ receiptNumber: 1 });

export const Payment = mongoose.model("Payment", paymentSchema);
