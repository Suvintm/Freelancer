import mongoose from "mongoose";

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
      enum: ["gig", "request"],
      required: true,
    },

    // Reference to gig (if order is from gig)
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
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
      enum: ["pending", "escrow", "released", "refunded"],
      default: "pending",
    },
    stripePaymentIntentId: {
      type: String,
    },
    stripeTransferId: {
      type: String,
    },

    // Order Status
    status: {
      type: String,
      enum: [
        "new",           // Just created, awaiting editor response
        "accepted",      // Editor accepted
        "in_progress",   // Work started
        "submitted",     // Editor submitted final work
        "completed",     // Client confirmed, payment released
        "rejected",      // Editor rejected
        "cancelled",     // Order cancelled
        "disputed",      // Under dispute
      ],
      default: "new",
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
  },
  { timestamps: true }
);

// Calculate platform fee and editor earning before save
orderSchema.pre("save", function (next) {
  if (this.isModified("amount")) {
    this.platformFee = Math.round(this.amount * 0.10); // 10% platform fee
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
