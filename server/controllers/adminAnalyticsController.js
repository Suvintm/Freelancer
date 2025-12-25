/**
 * Admin Analytics Controller
 * Provides usage analytics for Cloudinary, MongoDB, and Razorpay
 */

import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import razorpay from "../config/razorpay.js";
import { isRazorpayConfigured } from "../config/razorpay.js";
import { Payment } from "../models/Payment.js";
import { Order } from "../models/Order.js";
import User from "../models/User.js";
import { ApiError } from "../middleware/errorHandler.js";

// ==========================================
// CLOUDINARY ANALYTICS
// ==========================================

/**
 * Get Cloudinary usage analytics
 * GET /api/admin/analytics/cloudinary
 */
export const getCloudinaryAnalytics = asyncHandler(async (req, res) => {
  try {
    // Get Cloudinary usage data via Admin API
    const usage = await cloudinary.api.usage();
    
    // Get recent resources count
    const recentResources = await cloudinary.api.resources({
      max_results: 1,
      type: "upload"
    });

    // Get folders for organization
    let folders = [];
    try {
      const folderResult = await cloudinary.api.root_folders();
      folders = folderResult.folders || [];
    } catch (e) {
      console.log("Could not fetch folders:", e.message);
    }

    // Calculate storage percentages
    const storageUsedBytes = usage.storage?.usage || 0;
    const storageLimitBytes = usage.storage?.quota || 0;
    const bandwidthUsedBytes = usage.bandwidth?.usage || 0;
    const bandwidthLimitBytes = usage.bandwidth?.quota || 0;
    const transformationsUsed = usage.transformations?.usage || 0;
    const transformationsLimit = usage.transformations?.quota || 0;
    const creditsUsed = usage.credits?.usage || 0;
    const creditsLimit = usage.credits?.quota || 25; // Default free tier

    // Format bytes to human readable
    const formatBytes = (bytes) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Calculate cost estimate (based on Cloudinary pricing)
    const estimateCost = () => {
      // Free tier: 25 credits/month
      // After free tier: ~$0.05 per credit (approximate)
      const extraCredits = Math.max(0, creditsUsed - 25);
      return extraCredits * 0.05;
    };

    res.json({
      success: true,
      data: {
        plan: usage.plan || "Free",
        storage: {
          used: storageUsedBytes,
          usedFormatted: formatBytes(storageUsedBytes),
          limit: storageLimitBytes,
          limitFormatted: formatBytes(storageLimitBytes),
          percent: storageLimitBytes > 0 ? Math.round((storageUsedBytes / storageLimitBytes) * 100) : 0
        },
        bandwidth: {
          used: bandwidthUsedBytes,
          usedFormatted: formatBytes(bandwidthUsedBytes),
          limit: bandwidthLimitBytes,
          limitFormatted: formatBytes(bandwidthLimitBytes),
          percent: bandwidthLimitBytes > 0 ? Math.round((bandwidthUsedBytes / bandwidthLimitBytes) * 100) : 0
        },
        transformations: {
          used: transformationsUsed,
          limit: transformationsLimit,
          percent: transformationsLimit > 0 ? Math.round((transformationsUsed / transformationsLimit) * 100) : 0
        },
        credits: {
          used: creditsUsed,
          limit: creditsLimit,
          remaining: Math.max(0, creditsLimit - creditsUsed),
          percent: Math.round((creditsUsed / creditsLimit) * 100)
        },
        resources: {
          total: recentResources.rate_limit_remaining || 0,
          images: usage.resources?.images || 0,
          videos: usage.resources?.videos || 0,
          raw: usage.resources?.raw || 0
        },
        folders: folders.map(f => ({ name: f.name, path: f.path })),
        requests: usage.requests || 0,
        estimatedCost: estimateCost(),
        lastUpdated: usage.last_updated || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Cloudinary analytics error:", error);
    
    // Return mock data if Cloudinary API fails
    res.json({
      success: true,
      data: {
        plan: "Unknown",
        storage: { used: 0, usedFormatted: "0 B", limit: 0, limitFormatted: "0 B", percent: 0 },
        bandwidth: { used: 0, usedFormatted: "0 B", limit: 0, limitFormatted: "0 B", percent: 0 },
        transformations: { used: 0, limit: 0, percent: 0 },
        credits: { used: 0, limit: 25, remaining: 25, percent: 0 },
        resources: { total: 0, images: 0, videos: 0, raw: 0 },
        folders: [],
        requests: 0,
        estimatedCost: 0,
        error: error.message,
        lastUpdated: new Date().toISOString()
      }
    });
  }
});

// ==========================================
// MONGODB ANALYTICS
// ==========================================

/**
 * Get MongoDB usage analytics
 * GET /api/admin/analytics/mongodb
 */
export const getMongoDBAnalytics = asyncHandler(async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new ApiError(500, "Database not connected");
    }

    // Get database stats
    const dbStats = await db.stats();
    
    // Get all collections and their stats
    const collections = await db.listCollections().toArray();
    const collectionStats = [];

    for (const coll of collections) {
      try {
        const stats = await db.collection(coll.name).stats();
        const count = await db.collection(coll.name).countDocuments();
        collectionStats.push({
          name: coll.name,
          count: count,
          size: stats.size || 0,
          sizeFormatted: formatBytes(stats.size || 0),
          avgObjSize: stats.avgObjSize || 0,
          storageSize: stats.storageSize || 0,
          indexes: stats.nindexes || 0,
          indexSize: stats.totalIndexSize || 0
        });
      } catch (e) {
        collectionStats.push({
          name: coll.name,
          count: 0,
          size: 0,
          sizeFormatted: "0 B",
          error: e.message
        });
      }
    }

    // Sort by size descending
    collectionStats.sort((a, b) => (b.size || 0) - (a.size || 0));

    // Get connection pool status
    const serverStatus = await db.admin().serverStatus();
    const connections = serverStatus.connections || { current: 0, available: 0 };

    // Format bytes helper
    function formatBytes(bytes) {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    // MongoDB Atlas free tier limits
    const FREE_TIER_STORAGE = 512 * 1024 * 1024; // 512 MB

    res.json({
      success: true,
      data: {
        database: dbStats.db,
        storage: {
          used: dbStats.dataSize || 0,
          usedFormatted: formatBytes(dbStats.dataSize || 0),
          storageSize: dbStats.storageSize || 0,
          storageSizeFormatted: formatBytes(dbStats.storageSize || 0),
          freeTierLimit: FREE_TIER_STORAGE,
          freeTierLimitFormatted: formatBytes(FREE_TIER_STORAGE),
          percentUsed: Math.round(((dbStats.storageSize || 0) / FREE_TIER_STORAGE) * 100)
        },
        indexes: {
          count: dbStats.indexes || 0,
          size: dbStats.indexSize || 0,
          sizeFormatted: formatBytes(dbStats.indexSize || 0)
        },
        collections: {
          count: collectionStats.length,
          details: collectionStats.slice(0, 20) // Top 20 collections
        },
        documents: {
          total: dbStats.objects || 0,
          avgSize: dbStats.avgObjSize || 0,
          avgSizeFormatted: formatBytes(dbStats.avgObjSize || 0)
        },
        connections: {
          current: connections.current || 0,
          available: connections.available || 0,
          totalCreated: connections.totalCreated || 0
        },
        operations: {
          inserts: serverStatus.opcounters?.insert || 0,
          queries: serverStatus.opcounters?.query || 0,
          updates: serverStatus.opcounters?.update || 0,
          deletes: serverStatus.opcounters?.delete || 0
        },
        uptime: serverStatus.uptime || 0,
        version: serverStatus.version || "Unknown",
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("MongoDB analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get MongoDB analytics",
      error: error.message
    });
  }
});

// ==========================================
// RAZORPAY ANALYTICS
// ==========================================

/**
 * Get Razorpay/Payment analytics
 * GET /api/admin/analytics/razorpay
 */
export const getRazorpayAnalytics = asyncHandler(async (req, res) => {
  try {
    // Check if Razorpay is configured
    const razorpayEnabled = isRazorpayConfigured();

    // Get date ranges
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aggregate payment data from database
    const [
      todayStats,
      weekStats,
      monthStats,
      totalStats,
      recentPayments,
      paymentsByStatus,
      refundStats
    ] = await Promise.all([
      // Today's stats
      Payment.aggregate([
        { $match: { createdAt: { $gte: todayStart }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 }, fees: { $sum: "$platformFee" } } }
      ]),
      // This week's stats
      Payment.aggregate([
        { $match: { createdAt: { $gte: weekStart }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 }, fees: { $sum: "$platformFee" } } }
      ]),
      // This month's stats
      Payment.aggregate([
        { $match: { createdAt: { $gte: monthStart }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 }, fees: { $sum: "$platformFee" } } }
      ]),
      // All-time stats
      Payment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 }, fees: { $sum: "$platformFee" } } }
      ]),
      // Recent payments
      Payment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("client", "name email")
        .populate("editor", "name email")
        .lean(),
      // Payments by status
      Payment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } }
      ]),
      // Refund stats
      Payment.aggregate([
        { $match: { type: "refund" } },
        { $group: { _id: null, count: { $sum: 1 }, totalRefunded: { $sum: "$amount" } } }
      ])
    ]);

    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrend = await Payment.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: "completed" } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Format monthly trend
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedTrend = monthlyTrend.map(m => ({
      month: monthNames[m._id.month - 1],
      year: m._id.year,
      revenue: m.total,
      transactions: m.count
    }));

    // Calculate Razorpay fees (approximately 2% + 18% GST = ~2.36%)
    const estimateRazorpayFees = (amount) => Math.round(amount * 0.0236);

    res.json({
      success: true,
      data: {
        razorpayEnabled,
        revenue: {
          today: todayStats[0]?.total || 0,
          week: weekStats[0]?.total || 0,
          month: monthStats[0]?.total || 0,
          total: totalStats[0]?.total || 0
        },
        transactions: {
          today: todayStats[0]?.count || 0,
          week: weekStats[0]?.count || 0,
          month: monthStats[0]?.count || 0,
          total: totalStats[0]?.count || 0
        },
        platformFees: {
          today: todayStats[0]?.fees || 0,
          week: weekStats[0]?.fees || 0,
          month: monthStats[0]?.fees || 0,
          total: totalStats[0]?.fees || 0
        },
        razorpayFees: {
          estimated: estimateRazorpayFees(totalStats[0]?.total || 0)
        },
        paymentsByStatus: paymentsByStatus.reduce((acc, item) => {
          acc[item._id] = { count: item.count, total: item.total };
          return acc;
        }, {}),
        refunds: {
          count: refundStats[0]?.count || 0,
          totalAmount: refundStats[0]?.totalRefunded || 0
        },
        recentPayments: recentPayments.map(p => ({
          id: p._id,
          amount: p.amount,
          status: p.status,
          type: p.type,
          client: p.client?.name || "Unknown",
          editor: p.editor?.name || "Unknown",
          createdAt: p.createdAt
        })),
        monthlyTrend: formattedTrend,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Razorpay analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment analytics",
      error: error.message
    });
  }
});

// ==========================================
// OVERVIEW ANALYTICS
// ==========================================

/**
 * Get combined overview analytics
 * GET /api/admin/analytics/overview
 */
export const getOverviewAnalytics = asyncHandler(async (req, res) => {
  try {
    // Get quick stats from all services
    const [
      totalUsers,
      totalOrders,
      totalPayments,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Payment.countDocuments({ status: "completed" }),
      Payment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    // Get Cloudinary quick stats
    let cloudinaryData = { storage: 0, bandwidth: 0 };
    try {
      const usage = await cloudinary.api.usage();
      cloudinaryData = {
        storage: usage.storage?.usage || 0,
        bandwidth: usage.bandwidth?.usage || 0,
        credits: usage.credits?.usage || 0
      };
    } catch (e) {
      console.log("Could not fetch Cloudinary stats:", e.message);
    }

    // Get MongoDB quick stats
    let mongoData = { size: 0, collections: 0 };
    try {
      const db = mongoose.connection.db;
      if (db) {
        const stats = await db.stats();
        const collections = await db.listCollections().toArray();
        mongoData = {
          size: stats.storageSize || 0,
          collections: collections.length
        };
      }
    } catch (e) {
      console.log("Could not fetch MongoDB stats:", e.message);
    }

    // Format bytes
    const formatBytes = (bytes) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    res.json({
      success: true,
      data: {
        platform: {
          users: totalUsers,
          orders: totalOrders,
          payments: totalPayments,
          revenue: totalRevenue[0]?.total || 0
        },
        cloudinary: {
          storage: formatBytes(cloudinaryData.storage),
          bandwidth: formatBytes(cloudinaryData.bandwidth),
          credits: cloudinaryData.credits
        },
        mongodb: {
          size: formatBytes(mongoData.size),
          collections: mongoData.collections
        },
        razorpay: {
          enabled: isRazorpayConfigured(),
          totalTransactions: totalPayments
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Overview analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get overview analytics",
      error: error.message
    });
  }
});
