// editorAnalyticsRoutes.js - Editor analytics and performance insights
import express from "express";
import protect from "../middleware/authMiddleware.js";
import { Order } from "../models/Order.js";
import { Gig } from "../models/Gig.js";
import User from "../models/User.js";
import { Profile } from "../models/Profile.js";
import { Message } from "../models/Message.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ============ EARNINGS ANALYTICS ============
router.get("/earnings", async (req, res) => {
  try {
    const editorId = req.user._id;
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total earnings from completed orders
    const totalEarningsAgg = await Order.aggregate([
      { $match: { editor: editorId, status: "completed" } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$editorEarnings" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Period earnings
    const periodEarningsAgg = await Order.aggregate([
      { $match: { editor: editorId, status: "completed", completedAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          periodEarnings: { $sum: "$editorEarnings" },
          periodOrders: { $sum: 1 },
        },
      },
    ]);

    // Daily earnings for chart
    const dailyEarnings = await Order.aggregate([
      { $match: { editor: editorId, status: "completed", completedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          earnings: { $sum: "$editorEarnings" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Pending earnings (in progress orders)
    const pendingEarningsAgg = await Order.aggregate([
      { $match: { editor: editorId, status: { $in: ["accepted", "in_progress", "submitted"] } } },
      {
        $group: {
          _id: null,
          pendingEarnings: { $sum: "$editorEarnings" },
          pendingOrders: { $sum: 1 },
        },
      },
    ]);

    // Previous period for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    
    const prevPeriodAgg = await Order.aggregate([
      { $match: { editor: editorId, status: "completed", completedAt: { $gte: prevStartDate, $lt: startDate } } },
      {
        $group: {
          _id: null,
          earnings: { $sum: "$editorEarnings" },
        },
      },
    ]);

    const currentEarnings = periodEarningsAgg[0]?.periodEarnings || 0;
    const previousEarnings = prevPeriodAgg[0]?.earnings || 0;
    const growthPercent = previousEarnings > 0 
      ? (((currentEarnings - previousEarnings) / previousEarnings) * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      analytics: {
        totalEarnings: totalEarningsAgg[0]?.totalEarnings || 0,
        totalOrders: totalEarningsAgg[0]?.totalOrders || 0,
        periodEarnings: currentEarnings,
        periodOrders: periodEarningsAgg[0]?.periodOrders || 0,
        pendingEarnings: pendingEarningsAgg[0]?.pendingEarnings || 0,
        pendingOrders: pendingEarningsAgg[0]?.pendingOrders || 0,
        growthPercent: parseFloat(growthPercent),
        dailyEarnings,
        period: days,
      },
    });

  } catch (error) {
    console.error("Earnings analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch earnings analytics" });
  }
});

// ============ ORDER PERFORMANCE ============
router.get("/orders", async (req, res) => {
  try {
    const editorId = req.user._id;
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Order stats
    const orderStats = await Order.aggregate([
      { $match: { editor: editorId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Total order counts
    const totalOrders = await Order.countDocuments({ editor: editorId });
    const completedOrders = await Order.countDocuments({ editor: editorId, status: "completed" });
    const activeOrders = await Order.countDocuments({ 
      editor: editorId, 
      status: { $in: ["new", "accepted", "in_progress", "submitted"] } 
    });

    // Completion rate
    const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0;

    // Average response time (time from new to accepted)
    const responseTimeAgg = await Order.aggregate([
      { 
        $match: { 
          editor: editorId, 
          status: { $in: ["accepted", "in_progress", "submitted", "completed"] },
          acceptedAt: { $exists: true }
        } 
      },
      {
        $project: {
          responseTime: { $subtract: ["$acceptedAt", "$createdAt"] },
        },
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: "$responseTime" },
        },
      },
    ]);

    const avgResponseHours = responseTimeAgg[0]?.avgResponseTime 
      ? Math.round(responseTimeAgg[0].avgResponseTime / (1000 * 60 * 60)) 
      : 0;

    // Average completion time
    const completionTimeAgg = await Order.aggregate([
      { $match: { editor: editorId, status: "completed", completedAt: { $exists: true } } },
      {
        $project: {
          completionTime: { $subtract: ["$completedAt", "$createdAt"] },
        },
      },
      {
        $group: {
          _id: null,
          avgCompletionTime: { $avg: "$completionTime" },
        },
      },
    ]);

    const avgCompletionHours = completionTimeAgg[0]?.avgCompletionTime 
      ? Math.round(completionTimeAgg[0].avgCompletionTime / (1000 * 60 * 60)) 
      : 0;

    // Daily orders
    const dailyOrders = await Order.aggregate([
      { $match: { editor: editorId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalOrders,
        completedOrders,
        activeOrders,
        completionRate: parseFloat(completionRate),
        avgResponseHours,
        avgCompletionHours,
        orderStats,
        dailyOrders,
        period: days,
      },
    });

  } catch (error) {
    console.error("Order analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch order analytics" });
  }
});

// ============ GIG PERFORMANCE ============
router.get("/gigs", async (req, res) => {
  try {
    const editorId = req.user._id;

    // Get all editor's gigs with order counts
    const gigsPerformance = await Order.aggregate([
      { $match: { editor: editorId, status: "completed" } },
      {
        $group: {
          _id: "$gig",
          orders: { $sum: 1 },
          revenue: { $sum: "$editorEarnings" },
          avgPrice: { $avg: "$amount" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "gigs",
          localField: "_id",
          foreignField: "_id",
          as: "gigDetails",
        },
      },
      { $unwind: "$gigDetails" },
      {
        $project: {
          title: "$gigDetails.title",
          price: "$gigDetails.price",
          isActive: "$gigDetails.isActive",
          orders: 1,
          revenue: 1,
          avgPrice: 1,
        },
      },
    ]);

    // Gig stats
    const totalGigs = await Gig.countDocuments({ editor: editorId });
    const activeGigs = await Gig.countDocuments({ editor: editorId, isActive: true });
    const pausedGigs = await Gig.countDocuments({ editor: editorId, isActive: false });

    res.status(200).json({
      success: true,
      analytics: {
        topGigs: gigsPerformance,
        totalGigs,
        activeGigs,
        pausedGigs,
      },
    });

  } catch (error) {
    console.error("Gig analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch gig analytics" });
  }
});

// ============ PROFILE & RATINGS ============
router.get("/profile", async (req, res) => {
  try {
    const editorId = req.user._id;

    // Get profile
    const profile = await Profile.findOne({ user: editorId });
    
    // Rating stats from orders
    const ratingStats = await Order.aggregate([
      { $match: { editor: editorId, rating: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        },
      },
    ]);

    // Recent reviews
    const recentReviews = await Order.find({ 
      editor: editorId, 
      rating: { $exists: true, $ne: null },
      review: { $exists: true, $ne: "" }
    })
      .populate("client", "name profilePicture")
      .populate("gig", "title")
      .select("rating review completedAt client gig")
      .sort({ completedAt: -1 })
      .limit(5)
      .lean();

    // Profile strength calculation
    const user = await User.findById(editorId);
    let profileStrength = 0;
    if (user?.name) profileStrength += 10;
    if (user?.profilePicture) profileStrength += 15;
    if (profile?.bio && profile.bio.length > 50) profileStrength += 15;
    if (profile?.skills && profile.skills.length >= 3) profileStrength += 15;
    if (profile?.portfolio && profile.portfolio.length >= 1) profileStrength += 15;
    if (profile?.languages && profile.languages.length >= 1) profileStrength += 10;
    if (profile?.experience) profileStrength += 10;
    if (profile?.hourlyRate) profileStrength += 10;

    // Badges calculation
    const badges = [];
    const stats = ratingStats[0];
    
    if (stats?.avgRating >= 4.8) badges.push({ id: "top_rated", label: "Top Rated", icon: "⭐" });
    if (stats?.totalReviews >= 10) badges.push({ id: "trusted", label: "Trusted Seller", icon: "✓" });
    
    const orderStats = await Order.aggregate([
      { $match: { editor: editorId, status: "completed" } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    
    if (orderStats[0]?.count >= 50) badges.push({ id: "veteran", label: "Veteran Editor", icon: "🏆" });
    if (orderStats[0]?.count >= 10) badges.push({ id: "rising_star", label: "Rising Star", icon: "🌟" });

    res.status(200).json({
      success: true,
      analytics: {
        avgRating: stats?.avgRating?.toFixed(1) || 0,
        totalReviews: stats?.totalReviews || 0,
        ratingDistribution: {
          5: stats?.rating5 || 0,
          4: stats?.rating4 || 0,
          3: stats?.rating3 || 0,
          2: stats?.rating2 || 0,
          1: stats?.rating1 || 0,
        },
        recentReviews,
        profileStrength,
        badges,
      },
    });

  } catch (error) {
    console.error("Profile analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch profile analytics" });
  }
});

// ============ QUICK STATS (for dashboard widget) ============
router.get("/quick-stats", async (req, res) => {
  try {
    const editorId = req.user._id;
    
    // This month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Quick stats
    const [monthlyEarnings, activeOrders, pendingOrders, avgRating] = await Promise.all([
      Order.aggregate([
        { $match: { editor: editorId, status: "completed", completedAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$editorEarnings" } } }
      ]),
      Order.countDocuments({ editor: editorId, status: { $in: ["accepted", "in_progress"] } }),
      Order.countDocuments({ editor: editorId, status: "new" }),
      Order.aggregate([
        { $match: { editor: editorId, rating: { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: "$rating" } } }
      ]),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        monthlyEarnings: monthlyEarnings[0]?.total || 0,
        activeOrders,
        pendingOrders,
        avgRating: avgRating[0]?.avg?.toFixed(1) || "N/A",
      },
    });

  } catch (error) {
    console.error("Quick stats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch quick stats" });
  }
});

export default router;
