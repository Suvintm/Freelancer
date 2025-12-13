// clientAnalyticsRoutes.js - Client dashboard analytics
import express from "express";
import protect from "../middleware/authMiddleware.js";
import { Order } from "../models/Order.js";
import User from "../models/User.js";

const router = express.Router();

router.use(protect);

// ============ CLIENT DASHBOARD STATS ============
router.get("/dashboard", async (req, res) => {
  try {
    const clientId = req.user._id;
    
    // This month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Order stats
    const [totalOrders, activeOrders, completedOrders, totalSpent, monthlySpent] = await Promise.all([
      Order.countDocuments({ client: clientId }),
      Order.countDocuments({ client: clientId, status: { $in: ["new", "accepted", "in_progress", "submitted"] } }),
      Order.countDocuments({ client: clientId, status: "completed" }),
      Order.aggregate([
        { $match: { client: clientId, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Order.aggregate([
        { $match: { client: clientId, status: "completed", completedAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
    ]);

    // Daily spending for chart (last 30 days)
    const dailySpending = await Order.aggregate([
      { $match: { client: clientId, status: "completed", completedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          spent: { $sum: "$amount" },
          orders: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Order status distribution
    const statusDistribution = await Order.aggregate([
      { $match: { client: clientId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Favorite editors (most orders with)
    const favoriteEditors = await Order.aggregate([
      { $match: { client: clientId, status: "completed" } },
      { $group: { _id: "$editor", orders: { $sum: 1 }, spent: { $sum: "$amount" } } },
      { $sort: { orders: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "editor"
        }
      },
      { $unwind: "$editor" },
      {
        $project: {
          name: "$editor.name",
          profilePicture: "$editor.profilePicture",
          orders: 1,
          spent: 1
        }
      }
    ]);

    // Recent activity
    const recentOrders = await Order.find({ client: clientId })
      .populate("editor", "name profilePicture")
      .populate("gig", "title")
      .select("status amount createdAt gig editor")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      analytics: {
        totalOrders,
        activeOrders,
        completedOrders,
        totalSpent: totalSpent[0]?.total || 0,
        monthlySpent: monthlySpent[0]?.total || 0,
        dailySpending,
        statusDistribution,
        favoriteEditors,
        recentOrders,
      }
    });

  } catch (error) {
    console.error("Client dashboard error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard" });
  }
});

export default router;
