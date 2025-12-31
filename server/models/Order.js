import mongoose from "mongoose";
import { SiteSettings } from "./SiteSettings.js";

// Generate unique order number
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${year}-${random}`;
};

const orderSchema = new mongoose.Schema(
  {
    // Unique order identifier
    orderNumber: {
      type: String,
      unique: true,
      default: generateOrderNumber,
    },

    // Order Type
    type: {
      type: String,
      enum: ["gig", "request", "brief"],
      required: true,
    },

    // Reference to gig (if order is from gig)
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
    },

    // Reference to brief (if order is from Open Briefs)
    brief: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brief",
    },

    // Parties involved
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

    // Project Details
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },

    // Payment Details
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [100, "Minimum amount is ₹100"],
    },
    currency: {
      type: String,
      default: "INR",
    },
    platformFeePercentage: {
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    editorEarning: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "escrow", "released", "refunded", "failed"],
      default: "pending",
    },
    
    // Payment Gateway Info
    paymentGateway: {
      type: String,
      enum: ["razorpay", "stripe", "none"],
      default: "none",
    },
    
    // Razorpay Fields
    razorpayOrderId: {
      type: String,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    razorpayPayoutId: {
      type: String,
    },
    
    // Stripe Fields (for future international)
    stripePaymentIntentId: {
      type: String,
    },
    stripeTransferId: {
      type: String,
    },
    
    // Escrow Tracking
    escrowStatus: {
      type: String,
      enum: ["none", "held", "released", "refunded", "disputed"],
      default: "none",
    },
    escrowHeldAt: {
      type: Date,
    },
    escrowReleasedAt: {
      type: Date,
    },
    
    // Payout Tracking
    payoutStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    payoutAmount: {
      type: Number,
      default: 0,
    },
    payoutCompletedAt: {
      type: Date,
    },
    
    // Refund Tracking
    refundId: {
      type: String,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundedAt: {
      type: Date,
    },
    refundReason: {
      type: String,
    },
    
    // Payment expiry for request orders (auto-cancel if not paid)
    paymentExpiresAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: [
        "pending_payment", // Created but awaiting payment
        "new",           // Paid, awaiting editor response (for gig orders)
        "awaiting_payment", // Editor accepted request, awaiting client payment
        "accepted",      // Editor accepted
        "in_progress",   // Work started
        "submitted",     // Editor submitted final work
        "completed",     // Client confirmed, payment released
        "rejected",      // Editor rejected
        "cancelled",     // Order cancelled
        "disputed",      // Under dispute
        "expired",       // Deadline passed without editor acceptance - auto refunded
      ],
      default: "new",
    },

    // Cancellation reason
    cancellationReason: {
      type: String,
    },

    // Dispute info
    disputeReason: {
      type: String,
    },
    disputedAt: {
      type: Date,
    },
    disputeResolvedAt: {
      type: Date,
    },
    disputeResolution: {
      type: String,
      enum: ["released_to_editor", "refunded_to_client", "split"],
    },

    // Timestamps for tracking
    acceptedAt: Date,
    startedAt: Date,
    submittedAt: Date,
    completedAt: Date,
    cancelledAt: Date,

    // Auto-release tracking
    autoReleaseScheduledAt: Date,
    autoReleased: {
      type: Boolean,
      default: false,
    },

    // 🎬 Final Delivery Status
    deliveryStatus: {
      type: String,
      enum: ["none", "pending_review", "changes_requested", "accepted", "completed"],
      default: "none",
    },
    finalDeliveryMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    // ⭐ Rating Status
    isRated: {
      type: Boolean,
      default: false,
    },
    
    // 📊 Suvix Score Tracking
    deliveryTiming: {
      daysEarlyOrLate: {
        type: Number,  // Positive = early, Negative = late
        default: null,
      },
      calculatedAt: {
        type: Date,
        default: null,
      },
    },
    revisionCount: {
      type: Number,
      default: 0,
    },

    // ⏰ Overdue & Deadline Extension System
    isOverdue: {
      type: Boolean,
      default: false,
    },
    overdueAt: {
      type: Date,
    },
    // Grace period: 24 hours after deadline before auto-refund
    graceEndsAt: {
      type: Date,
    },
    overdueRefunded: {
      type: Boolean,
      default: false,
    },
    overdueRefundedAt: {
      type: Date,
    },
    
    // Deadline Extension (max 3 times, 1-7 days each)
    deadlineExtensionCount: {
      type: Number,
      default: 0,
      max: 3,
    },
    deadlineExtensionHistory: [{
      originalDeadline: Date,
      newDeadline: Date,
      extendedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      extendedAt: Date,
      extraDays: Number,
    }],
    
    // Chat disabled when overdue
    chatDisabled: {
      type: Boolean,
      default: false,
    },
    chatDisabledReason: {
      type: String,
      enum: ["none", "overdue", "refunded", "completed", "cancelled"],
      default: "none",
    },
  },
  { timestamps: true }
);

// Calculate platform fee and editor earning before save
orderSchema.pre("save", async function (next) {
  // If platformFeePercentage is not set, fetch it from SiteSettings and initial calculation
  if (!this.platformFeePercentage || this.platformFeePercentage === 0) {
    try {
      const settings = (await import("./SiteSettings.js")).SiteSettings.getSettings();
      const resolvedSettings = await settings;
      this.platformFeePercentage = resolvedSettings.platformFee || 10;
    } catch (error) {
      console.error("Error fetching SiteSettings in Order pre-save:", error);
      this.platformFeePercentage = 10; // Fallback
    }
  }

  // Always recalculate platformFee and editorEarning based on the SNAPSHOTTED percentage
  // if the amount changed or they are not yet calculated
  if (this.isModified("amount") || !this.platformFee || !this.editorEarning) {
    this.platformFee = Math.round(this.amount * (this.platformFeePercentage / 100));
    this.editorEarning = this.amount - this.platformFee;
  }
  
  next();
});

// Indexes for faster queries
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ client: 1, status: 1 });
orderSchema.index({ editor: 1, status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ autoReleaseScheduledAt: 1, status: 1 });

export const Order = mongoose.model("Order", orderSchema);
