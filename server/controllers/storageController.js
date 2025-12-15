/**
 * Storage Controller
 * Handles storage calculation, status, and purchases
 */

import User from "../models/User.js";
import { Portfolio } from "../models/Portfolio.js";
import { Reel } from "../models/Reel.js";
import { Message } from "../models/Message.js";
import { Order } from "../models/Order.js";
import { StoragePurchase, STORAGE_PLANS, formatBytes } from "../models/StoragePurchase.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Calculate storage used by a user
 * Counts: Portfolio files, Reels, Chat attachments (active orders only)
 */
export const calculateStorageUsed = async (userId) => {
  let totalBytes = 0;

  // 1. Portfolio files - estimate based on count (avg 50MB per video, 2MB per image)
  const portfolios = await Portfolio.find({ user: userId });
  for (const portfolio of portfolios) {
    // Each portfolio video ~25MB average on Cloudinary
    if (portfolio.editedClip) totalBytes += 25 * 1024 * 1024;
    if (portfolio.originalClip) totalBytes += 25 * 1024 * 1024;
    if (portfolio.originalClips?.length > 0) {
      totalBytes += portfolio.originalClips.length * 25 * 1024 * 1024;
    }
  }

  // 2. Reels - estimate ~15MB per reel
  const reelsCount = await Reel.countDocuments({ editor: userId });
  totalBytes += reelsCount * 15 * 1024 * 1024;

  // 3. Chat files from active orders only (pending, in_progress, submitted)
  const activeOrders = await Order.find({
    $or: [{ client: userId }, { editor: userId }],
    status: { $in: ["new", "accepted", "in_progress", "submitted"] },
  }).select("_id");

  const activeOrderIds = activeOrders.map((o) => o._id);

  // Get messages with media from active orders where user is sender
  const messages = await Message.find({
    order: { $in: activeOrderIds },
    sender: userId,
    type: { $in: ["file", "video", "image", "audio"] },
    isDeleted: false,
  });

  for (const msg of messages) {
    // Parse mediaSize if available, otherwise estimate
    if (msg.mediaSize) {
      // mediaSize might be "2.5 MB" format or number
      const sizeStr = String(msg.mediaSize);
      if (sizeStr.includes("MB")) {
        totalBytes += parseFloat(sizeStr) * 1024 * 1024;
      } else if (sizeStr.includes("KB")) {
        totalBytes += parseFloat(sizeStr) * 1024;
      } else if (sizeStr.includes("GB")) {
        totalBytes += parseFloat(sizeStr) * 1024 * 1024 * 1024;
      } else {
        totalBytes += parseInt(sizeStr) || 5 * 1024 * 1024; // Default 5MB
      }
    } else {
      // Estimate by type
      if (msg.type === "video") totalBytes += 30 * 1024 * 1024;
      else if (msg.type === "image") totalBytes += 3 * 1024 * 1024;
      else if (msg.type === "audio") totalBytes += 2 * 1024 * 1024;
      else totalBytes += 5 * 1024 * 1024;
    }
  }

  return Math.round(totalBytes);
};

/**
 * Get storage status for current user
 * GET /api/storage/status
 */
export const getStorageStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Recalculate storage used
  const storageUsed = await calculateStorageUsed(userId);

  // Update user's storage
  user.storageUsed = storageUsed;
  user.storageLastCalculated = new Date();
  await user.save();

  // Get breakdown
  const portfolioCount = await Portfolio.countDocuments({ user: userId });
  const reelsCount = await Reel.countDocuments({ editor: userId });
  
  // Get message files count from active orders
  const activeOrders = await Order.find({
    $or: [{ client: userId }, { editor: userId }],
    status: { $in: ["new", "accepted", "in_progress", "submitted"] },
  }).select("_id");
  
  const messageFilesCount = await Message.countDocuments({
    order: { $in: activeOrders.map((o) => o._id) },
    sender: userId,
    type: { $in: ["file", "video", "image", "audio"] },
    isDeleted: false,
  });

  const usedPercent = Math.round((storageUsed / user.storageLimit) * 100);
  const isLowStorage = usedPercent >= 80;
  const isFull = usedPercent >= 100;

  res.json({
    success: true,
    storage: {
      used: storageUsed,
      limit: user.storageLimit,
      usedFormatted: formatBytes(storageUsed),
      limitFormatted: formatBytes(user.storageLimit),
      usedPercent,
      remainingBytes: Math.max(0, user.storageLimit - storageUsed),
      remainingFormatted: formatBytes(Math.max(0, user.storageLimit - storageUsed)),
      plan: user.storagePlan,
      isLowStorage,
      isFull,
      lastCalculated: user.storageLastCalculated,
    },
    breakdown: {
      portfolios: portfolioCount,
      reels: reelsCount,
      chatFiles: messageFilesCount,
    },
    plans: STORAGE_PLANS,
  });
});

/**
 * Get storage plans
 * GET /api/storage/plans
 */
export const getStoragePlans = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    plans: Object.values(STORAGE_PLANS).filter((p) => p.id !== "free"),
    currentPlan: req.user?.storagePlan || "free",
  });
});

/**
 * Create Razorpay order for storage purchase
 * POST /api/storage/purchase
 */
export const createStoragePurchaseOrder = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const userId = req.user._id;

  // Validate plan
  const plan = STORAGE_PLANS[planId];
  if (!plan || planId === "free") {
    throw new ApiError(400, "Invalid storage plan");
  }

  // Check if user already has this plan or higher
  const user = await User.findById(userId);
  const currentPlanOrder = ["free", "starter", "pro", "business", "unlimited"];
  const currentIndex = currentPlanOrder.indexOf(user.storagePlan);
  const newIndex = currentPlanOrder.indexOf(planId);

  if (newIndex <= currentIndex) {
    throw new ApiError(400, "You already have this plan or a higher plan");
  }

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: plan.price * 100, // Amount in paise
    currency: "INR",
    receipt: `storage_${userId}_${Date.now()}`,
    notes: {
      userId: userId.toString(),
      planId,
      type: "storage_purchase",
    },
  });

  // Save pending purchase
  const purchase = await StoragePurchase.create({
    user: userId,
    planId,
    planName: plan.name,
    storageBytes: plan.storageBytes,
    amount: plan.price,
    razorpayOrderId: razorpayOrder.id,
    status: "pending",
  });

  res.json({
    success: true,
    order: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    },
    plan: {
      id: plan.id,
      name: plan.name,
      storage: formatBytes(plan.storageBytes),
      price: plan.price,
    },
    key: process.env.RAZORPAY_KEY_ID,
    purchaseId: purchase._id,
  });
});

/**
 * Verify storage purchase payment
 * POST /api/storage/verify
 */
export const verifyStoragePurchase = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purchaseId } = req.body;
  const userId = req.user._id;

  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed");
  }

  // Find purchase
  const purchase = await StoragePurchase.findOne({
    _id: purchaseId,
    user: userId,
    razorpayOrderId: razorpay_order_id,
  });

  if (!purchase) {
    throw new ApiError(404, "Purchase not found");
  }

  if (purchase.status === "completed") {
    return res.json({
      success: true,
      message: "Purchase already completed",
    });
  }

  // Update purchase
  purchase.razorpayPaymentId = razorpay_payment_id;
  purchase.razorpaySignature = razorpay_signature;
  purchase.status = "completed";
  purchase.purchasedAt = new Date();
  await purchase.save();

  // Update user's storage limit
  const plan = STORAGE_PLANS[purchase.planId];
  const user = await User.findById(userId);
  
  user.storageLimit = plan.storageBytes;
  user.storagePlan = purchase.planId;
  await user.save();

  res.json({
    success: true,
    message: "Storage upgraded successfully!",
    storage: {
      plan: purchase.planId,
      limitFormatted: formatBytes(plan.storageBytes),
    },
  });
});

/**
 * Get purchase history
 * GET /api/storage/history
 */
export const getStoragePurchaseHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const purchases = await StoragePurchase.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    success: true,
    purchases: purchases.map((p) => ({
      id: p._id,
      plan: p.planName,
      storage: formatBytes(p.storageBytes),
      amount: p.amount,
      status: p.status,
      purchasedAt: p.purchasedAt,
      createdAt: p.createdAt,
    })),
  });
});

/**
 * Check if user can upload (storage check middleware helper)
 */
export const canUpload = async (userId, fileSizeBytes) => {
  const user = await User.findById(userId);
  if (!user) return { allowed: false, reason: "User not found" };

  const storageUsed = await calculateStorageUsed(userId);
  const newTotal = storageUsed + fileSizeBytes;

  if (newTotal > user.storageLimit) {
    return {
      allowed: false,
      reason: "Storage limit exceeded",
      storageUsed,
      storageLimit: user.storageLimit,
      required: fileSizeBytes,
      overflow: newTotal - user.storageLimit,
    };
  }

  return { allowed: true };
};

export default {
  getStorageStatus,
  getStoragePlans,
  createStoragePurchaseOrder,
  verifyStoragePurchase,
  getStoragePurchaseHistory,
  calculateStorageUsed,
  canUpload,
};
