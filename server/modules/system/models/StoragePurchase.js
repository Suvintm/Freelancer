import mongoose from "mongoose";

/**
 * Storage Purchase Model
 * Tracks storage plan purchases by editors
 */
const storagePurchaseSchema = new mongoose.Schema(
  {
    // User who purchased
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Plan details
    planId: {
      type: String,
      required: true,
      enum: ["starter", "pro", "business", "unlimited"],
    },
    planName: {
      type: String,
      required: true,
    },
    
    // Storage amount in bytes
    storageBytes: {
      type: Number,
      required: true,
    },
    
    // Payment details
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    
    // Razorpay details
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    
    // Payment status
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    
    // Timestamps
    purchasedAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
storagePurchaseSchema.index({ user: 1, status: 1 });
storagePurchaseSchema.index({ razorpayOrderId: 1 });
storagePurchaseSchema.index({ razorpayPaymentId: 1 });

export const StoragePurchase = mongoose.model("StoragePurchase", storagePurchaseSchema);

/**
 * Storage Plan Configuration
 * These are the available plans for purchase
 */
export const STORAGE_PLANS = {
  free: {
    id: "free",
    name: "Free Plan",
    storageBytes: 500 * 1024 * 1024, // 500 MB
    price: 0,
    features: [
      "500 MB storage",
      "Portfolio uploads",
      "Chat file sharing",
      "Reel uploads",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter Plan",
    storageBytes: 2 * 1024 * 1024 * 1024, // 2 GB
    price: 99,
    features: [
      "2 GB total storage",
      "All Free features",
      "Priority support",
      "One-time payment",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
    storageBytes: 5 * 1024 * 1024 * 1024, // 5 GB
    price: 199,
    popular: true,
    features: [
      "5 GB total storage",
      "All Starter features",
      "Badge on profile",
      "Best value",
    ],
  },
  business: {
    id: "business",
    name: "Business Plan",
    storageBytes: 15 * 1024 * 1024 * 1024, // 15 GB
    price: 499,
    features: [
      "15 GB total storage",
      "All Pro features",
      "Storage analytics",
      "Perfect for pros",
    ],
  },
  unlimited: {
    id: "unlimited",
    name: "Unlimited Plan",
    storageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    price: 999,
    features: [
      "50 GB total storage",
      "All Business features",
      "Lifetime access",
      "Never worry again",
    ],
  },
};

/**
 * Helper to format bytes to human readable
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
