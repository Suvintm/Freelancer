import prisma from "../../../config/prisma.js";
import logger from "../../../utils/logger.js";

/**
 * Storage Purchase DAO (PostgreSQL)
 * Tracks storage plan purchases by editors via Prisma.
 */
export const StoragePurchase = {
    /**
     * Create new purchase (PostgreSQL)
     */
    async create(data) {
        return await prisma.storagePurchase.create({
            data: {
                user_id: data.user,
                plan_id: data.planId,
                plan_name: data.planName,
                storage_bytes: BigInt(data.storageBytes),
                amount: data.amount,
                razorpay_order_id: data.razorpayOrderId,
                status: data.status || "pending"
            }
        });
    },

    /**
     * Find many (PostgreSQL)
     */
    async find(query) {
        return await prisma.storagePurchase.findMany({
            where: {
                user_id: query.user,
                status: query.status
            },
            orderBy: { created_at: "desc" }
        });
    },

    /**
     * Find one (PostgreSQL)
     */
    async findOne(query) {
        return await prisma.storagePurchase.findFirst({
            where: {
                id: query._id, // Map MongoDB _id to PostgreSQL id if needed
                user_id: query.user,
                razorpay_order_id: query.razorpayOrderId
            }
        });
    },

    /**
     * Update (PostgreSQL)
     * For manual updates, we'll use a direct prisma.update in the controller.
     */
};

export default StoragePurchase;

/**
 * Storage Plan Configuration
 */
export const STORAGE_PLANS = {
  free: {
    id: "free",
    name: "Free Plan",
    storageBytes: 500 * 1024 * 1024,
    price: 0,
    features: ["500 MB storage", "Portfolio uploads", "Chat file sharing", "Reel uploads"],
  },
  starter: {
    id: "starter",
    name: "Starter Plan",
    storageBytes: 2 * 1024 * 1024 * 1024,
    price: 99,
    features: ["2 GB total storage", "Priority support", "One-time payment"],
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
    storageBytes: 5 * 1024 * 1024 * 1024,
    price: 199,
    popular: true,
    features: ["5 GB total storage", "Badge on profile", "Best value"],
  },
  business: {
    id: "business",
    name: "Business Plan",
    storageBytes: 15 * 1024 * 1024 * 1024,
    price: 499,
    features: ["15 GB total storage", "Storage analytics", "Perfect for pros"],
  },
  unlimited: {
    id: "unlimited",
    name: "Unlimited Plan",
    storageBytes: 50 * 1024 * 1024 * 1024,
    price: 999,
    features: ["50 GB total storage", "Lifetime access", "Never worry again"],
  },
};

/**
 * Helper to format bytes to human readable
 */
export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const b = Number(bytes);
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
