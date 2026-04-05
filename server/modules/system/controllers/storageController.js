/**
 * Storage Controller - Hybrid (PostgreSQL + MongoDB)
 * Handles storage calculation, status, and purchases
 */

import prisma from "../../../config/prisma.js";
import { Portfolio } from "../../profiles/models/Portfolio.js";
import { Reel } from "../../reels/models/Reel.js";
import { Message } from "../../connectivity/models/Message.js";
import { StoragePurchase, formatBytes } from "../models/StoragePurchase.js";
import { StorageSettings } from "../models/StorageSettings.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import razorpay from "../../../config/razorpay.js";
import crypto from "crypto";
import logger from "../../../utils/logger.js";

/**
 * Calculate storage used by a user (Hybrid)
 */
export const calculateStorageUsed = async (userId, includeDetails = false) => {
  let portfolioBytes = 0;
  let reelBytes = 0;
  let chatBytes = 0;
  const portfolioItems = [];
  const reelItems = [];
  const chatItems = [];

  // 1. Portfolio files (MongoDB)
  const portfolios = await Portfolio.find({ user: userId }).lean();
  for (const portfolio of portfolios) {
    let size = Number(portfolio.totalSizeBytes) || 0;
    if (size === 0) {
        size = 10 * 1024 * 1024; // 10MB minimum estimate
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

  // 2. Reels (MongoDB)
  const reels = await Reel.find({ editor: userId }).lean();
  for (const reel of reels) {
    let size = Number(reel.fileSizeBytes) || 15 * 1024 * 1024;
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

  // 3. Chat files from active orders (PostgreSQL -> MongoDB)
  const activeOrders = await prisma.order.findMany({
    where: {
        OR: [{ client_id: userId }, { editor_id: userId }],
        status: { in: ["new", "accepted", "in_progress", "submitted"] },
    },
    select: { id: true }
  });

  const activeOrderIds = activeOrders.map((o) => o.id);

  const messages = await Message.find({
    order: { $in: activeOrderIds },
    sender: userId,
    type: { $in: ["file", "video", "image", "audio"] },
    isDeleted: false,
  }).lean();

  for (const msg of messages) {
    let size = msg.mediaSizeBytes || 0;
    if (size === 0) {
        if (msg.type === "video") size = 30 * 1024 * 1024;
        else if (msg.type === "image") size = 3 * 1024 * 1024;
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

  return {
    totalBytes: portfolioBytes + reelBytes + chatBytes,
    portfolioBytes,
    reelBytes,
    chatBytes,
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
 * Get storage status
 */
export const getStorageStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const includeDetails = req.query.details === "true";
  
  const user = await prisma.user.findUnique({
      where: { id: userId }
  });

  if (!user) throw new ApiError(404, "User not found");

  const storageData = await calculateStorageUsed(userId, includeDetails);

  // Update user's storage in PostgreSQL
  await prisma.user.update({
      where: { id: userId },
      data: {
          storage_used: BigInt(storageData.totalBytes),
          storage_last_calculated: new Date()
      }
  });

  const limit = Number(user.storage_limit);
  const usedPercent = Math.round((storageData.totalBytes / limit) * 100);
  
  const storageSettings = await StorageSettings.getSettings();
  const plansObject = storageSettings.toPlansObject();

  res.json({
    success: true,
    storage: {
      used: storageData.totalBytes,
      limit: limit,
      usedFormatted: formatBytes(storageData.totalBytes),
      limitFormatted: formatBytes(limit),
      usedPercent,
      remainingBytes: Math.max(0, limit - storageData.totalBytes),
      remainingFormatted: formatBytes(Math.max(0, limit - storageData.totalBytes)),
      plan: user.storage_plan,
      isLowStorage: usedPercent >= 80,
      isFull: usedPercent >= 100,
      lastCalculated: new Date(),
    },
    breakdown: {
      ...storageData.counts,
      portfolioBytes: storageData.portfolioBytes,
      reelBytes: storageData.reelBytes,
      chatBytes: storageData.chatBytes,
      portfolioFormatted: formatBytes(storageData.portfolioBytes),
      reelFormatted: formatBytes(storageData.reelBytes),
      chatFormatted: formatBytes(storageData.chatBytes),
    },
    ...(includeDetails && storageData.items && { items: storageData.items }),
    plans: plansObject,
  });
});

/**
 * Create Purchase Order
 */
export const createStoragePurchaseOrder = asyncHandler(async (req, res) => {
  if (!razorpay) throw new ApiError(503, "Payment gateway not configured");

  const { planId } = req.body;
  const userId = req.user.id;

  const storageSettings = await StorageSettings.getSettings();
  const plansObject = storageSettings.toPlansObject();
  
  const plan = plansObject[planId];
  if (!plan || planId === "free") throw new ApiError(400, "Invalid storage plan");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  // Logic for simple plan hierarchy (for validation)
  const planHierarchy = ["free", "starter", "pro", "business", "unlimited"];
  if (planHierarchy.indexOf(planId) <= planHierarchy.indexOf(user.storage_plan || "free")) {
    throw new ApiError(400, "Cannot downgrade or repurchase existing plan");
  }

  const receipt = `strg_${userId.slice(-6)}_${Date.now().toString().slice(-8)}`;
  
  const razorpayOrder = await razorpay.orders.create({
    amount: plan.price * 100,
    currency: "INR",
    receipt,
    notes: { userId, planId, type: "storage_purchase" },
  });

  const purchase = await prisma.storagePurchase.create({
    data: {
      user_id: userId,
      plan_id: planId,
      plan_name: plan.name,
      storage_bytes: BigInt(plan.storageBytes),
      amount: plan.price,
      razorpay_order_id: razorpayOrder.id,
      status: "pending",
    }
  });

  res.json({
    success: true,
    order: { id: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency },
    plan: { id: plan.id, name: plan.name, storage: formatBytes(plan.storageBytes), price: plan.price },
    key: process.env.RAZORPAY_KEY_ID,
    purchaseId: purchase.id,
  });
});

/**
 * Verify Purchase (PostgreSQL)
 */
export const verifyStoragePurchase = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purchaseId } = req.body;
  const userId = req.user.id;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) throw new ApiError(400, "Payment verification failed");

  const purchase = await prisma.storagePurchase.findFirst({
    where: { id: purchaseId, user_id: userId, razorpay_order_id: razorpay_order_id }
  });

  if (!purchase) throw new ApiError(404, "Purchase not found");
  if (purchase.status === "completed") return res.json({ success: true, message: "Already completed" });

  // Atomic Update (Update Purchase + Upgrade User)
  const [updatedPurchase, updatedUser] = await prisma.$transaction([
      prisma.storagePurchase.update({
          where: { id: purchaseId },
          data: {
              razorpay_payment_id,
              razorpay_signature,
              status: "completed",
              purchased_at: new Date()
          }
      }),
      prisma.user.update({
          where: { id: userId },
          data: {
              storage_limit: purchase.storage_bytes,
              storage_plan: purchase.plan_id
          }
      })
  ]);

  res.json({
    success: true,
    message: "Storage upgraded!",
    storage: {
      plan: updatedUser.storage_plan,
      limitFormatted: formatBytes(updatedUser.storage_limit),
    }
  });
});

export const getStoragePurchaseHistory = asyncHandler(async (req, res) => {
  const history = await prisma.storagePurchase.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: "desc" },
      take: 20
  });

  res.json({
    success: true,
    purchases: history.map(p => ({
      id: p.id,
      plan: p.plan_name,
      storage: formatBytes(p.storage_bytes),
      amount: p.amount,
      status: p.status,
      purchasedAt: p.purchased_at,
      createdAt: p.created_at
    }))
  });
});

/**
 * Get available storage plans
 */
export const getStoragePlans = asyncHandler(async (req, res) => {
    try {
        const storageSettings = await StorageSettings.getSettings();
        const plans = storageSettings.toPlansObject();
        res.json({
            success: true,
            plans
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching storage plans" });
    }
});

export const canUpload = async (userId, fileSizeBytes) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, reason: "User not found" };

  const storageData = await calculateStorageUsed(userId);
  const newTotal = storageData.totalBytes + fileSizeBytes;

  if (BigInt(newTotal) > user.storage_limit) {
    return {
      allowed: false,
      reason: "Storage limit exceeded",
      storageUsed: storageData.totalBytes,
      storageLimit: Number(user.storage_limit)
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
  canUpload
};
