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
import { StorageSettings } from "../models/StorageSettings.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay only if keys are configured
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Calculate storage used by a user
 * Returns detailed breakdown by category with file lists
 */
export const calculateStorageUsed = async (userId, includeDetails = false) => {
  let portfolioBytes = 0;
  let reelBytes = 0;
  let chatBytes = 0;
  const portfolioItems = [];
  const reelItems = [];
  const chatItems = [];

  // 1. Portfolio files - use totalSizeBytes if stored, else estimate
  const portfolios = await Portfolio.find({ user: userId }).select("title editedClip originalClip originalClips totalSizeBytes thumbnailUrl createdAt");
  for (const portfolio of portfolios) {
    let size = 0;
    if (portfolio.totalSizeBytes && portfolio.totalSizeBytes > 0) {
      size = portfolio.totalSizeBytes;
    } else {
      // Estimate based on clip URLs - check for non-empty strings
      if (portfolio.editedClip && portfolio.editedClip.length > 5) {
        size += 25 * 1024 * 1024; // 25MB estimate per edited clip
      }
      if (portfolio.originalClip && portfolio.originalClip.length > 5) {
        size += 25 * 1024 * 1024; // 25MB estimate per original clip
      }
      if (portfolio.originalClips && portfolio.originalClips.length > 0) {
        // Count valid URLs in array
        const validClips = portfolio.originalClips.filter(c => c && c.length > 5);
        size += validClips.length * 25 * 1024 * 1024;
      }
      // If still 0, set a minimum estimate for any portfolio entry
      if (size === 0) {
        size = 10 * 1024 * 1024; // 10MB minimum estimate
      }
    }
    portfolioBytes += size;
    
    if (includeDetails) {
      portfolioItems.push({
        id: portfolio._id,
        title: portfolio.title || "Untitled",
        size,
        thumbnail: portfolio.thumbnailUrl,
        createdAt: portfolio.createdAt,
      });
    }
  }

  // 2. Reels - use fileSizeBytes if stored, else estimate ~15MB per reel
  const reels = await Reel.find({ editor: userId }).select("title mediaUrl fileSizeBytes createdAt");
  for (const reel of reels) {
    let size = 0;
    if (reel.fileSizeBytes && reel.fileSizeBytes > 0) {
      size = reel.fileSizeBytes;
    } else {
      size = 15 * 1024 * 1024;
    }
    reelBytes += size;
    
    if (includeDetails) {
      reelItems.push({
        id: reel._id,
        title: reel.title || "Untitled Reel",
        size,
        mediaUrl: reel.mediaUrl,
        createdAt: reel.createdAt,
      });
    }
  }

  // 3. Chat files from active orders only
  const activeOrders = await Order.find({
    $or: [{ client: userId }, { editor: userId }],
    status: { $in: ["new", "accepted", "in_progress", "submitted"] },
  }).select("_id");

  const activeOrderIds = activeOrders.map((o) => o._id);

  const messages = await Message.find({
    order: { $in: activeOrderIds },
    sender: userId,
    type: { $in: ["file", "video", "image", "audio"] },
    isDeleted: false,
  }).select("mediaName mediaSize mediaSizeBytes type mediaUrl createdAt");

  for (const msg of messages) {
    let size = 0;
    if (msg.mediaSizeBytes && msg.mediaSizeBytes > 0) {
      size = msg.mediaSizeBytes;
    } else if (msg.mediaSize) {
      const sizeStr = String(msg.mediaSize);
      if (sizeStr.includes("MB")) size = parseFloat(sizeStr) * 1024 * 1024;
      else if (sizeStr.includes("KB")) size = parseFloat(sizeStr) * 1024;
      else if (sizeStr.includes("GB")) size = parseFloat(sizeStr) * 1024 * 1024 * 1024;
      else size = parseInt(sizeStr) || 5 * 1024 * 1024;
    } else {
      if (msg.type === "video") size = 30 * 1024 * 1024;
      else if (msg.type === "image") size = 3 * 1024 * 1024;
      else if (msg.type === "audio") size = 2 * 1024 * 1024;
      else size = 5 * 1024 * 1024;
    }
    chatBytes += size;
    
    if (includeDetails) {
      chatItems.push({
        id: msg._id,
        name: msg.mediaName || "File",
        type: msg.type,
        size,
        mediaUrl: msg.mediaUrl,
        createdAt: msg.createdAt,
      });
    }
  }

  const totalBytes = portfolioBytes + reelBytes + chatBytes;
  
  return {
    totalBytes: Math.round(totalBytes),
    portfolioBytes: Math.round(portfolioBytes),
    reelBytes: Math.round(reelBytes),
    chatBytes: Math.round(chatBytes),
    counts: {
      portfolios: portfolios.length,
      reels: reels.length,
      chatFiles: messages.length,
    },
    ...(includeDetails && {
      items: {
        portfolios: portfolioItems.sort((a, b) => b.size - a.size),
        reels: reelItems.sort((a, b) => b.size - a.size),
        chatFiles: chatItems.sort((a, b) => b.size - a.size),
      },
    }),
  };
};

/**
 * Get storage status for current user
 * GET /api/storage/status
 * Query: ?details=true for per-file breakdown
 */
export const getStorageStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const includeDetails = req.query.details === "true";
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Recalculate storage used with detailed breakdown
  const storageData = await calculateStorageUsed(userId, includeDetails);

  // Update user's storage
  user.storageUsed = storageData.totalBytes;
  user.storageLastCalculated = new Date();
  await user.save();

  const usedPercent = Math.round((storageData.totalBytes / user.storageLimit) * 100);
  const isLowStorage = usedPercent >= 80;
  const isFull = usedPercent >= 100;

  // Fetch plans from DB settings
  const storageSettings = await StorageSettings.getSettings();
  const plansObject = storageSettings.toPlansObject();

  res.json({
    success: true,
    storage: {
      used: storageData.totalBytes,
      limit: user.storageLimit,
      usedFormatted: formatBytes(storageData.totalBytes),
      limitFormatted: formatBytes(user.storageLimit),
      usedPercent,
      remainingBytes: Math.max(0, user.storageLimit - storageData.totalBytes),
      remainingFormatted: formatBytes(Math.max(0, user.storageLimit - storageData.totalBytes)),
      plan: user.storagePlan,
      isLowStorage,
      isFull,
      lastCalculated: user.storageLastCalculated,
    },
    breakdown: {
      portfolios: storageData.counts.portfolios,
      reels: storageData.counts.reels,
      chatFiles: storageData.counts.chatFiles,
      // Add size breakdown
      portfolioBytes: storageData.portfolioBytes,
      reelBytes: storageData.reelBytes,
      chatBytes: storageData.chatBytes,
      portfolioFormatted: formatBytes(storageData.portfolioBytes),
      reelFormatted: formatBytes(storageData.reelBytes),
      chatFormatted: formatBytes(storageData.chatBytes),
    },
    // Include detailed file items if requested
    ...(includeDetails && storageData.items && { items: storageData.items }),
    plans: plansObject,
  });
});

/**
 * Get storage plans
 * GET /api/storage/plans
 */
export const getStoragePlans = asyncHandler(async (req, res) => {
  // Fetch plans from DB settings
  const storageSettings = await StorageSettings.getSettings();
  const plansObject = storageSettings.toPlansObject();
  
  res.json({
    success: true,
    plans: Object.values(plansObject).filter((p) => p.id !== "free"),
    currentPlan: req.user?.storagePlan || "free",
  });
});

/**
 * Create Razorpay order for storage purchase
 * POST /api/storage/purchase
 */
export const createStoragePurchaseOrder = asyncHandler(async (req, res) => {
  // Check if Razorpay is configured
  if (!razorpay) {
    throw new ApiError(503, "Payment service is not configured. Please contact support.");
  }

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
