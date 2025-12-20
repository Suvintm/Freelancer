import express from "express";
import { protectAdmin, requirePermission, logActivity } from "../middleware/adminAuth.js";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import { Order } from "../models/Order.js";
import { Gig } from "../models/Gig.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { SiteSettings } from "../models/SiteSettings.js";
import { StorageSettings } from "../models/StorageSettings.js";
import { StoragePurchase } from "../models/StoragePurchase.js";
import { emitToUser, emitMaintenance } from "../socket.js";
import KYCLog from "../models/KYCLog.js";

const router = express.Router();

// Apply admin protection to all routes
router.use(protectAdmin);

// ============ DASHBOARD STATS ============
router.get("/stats", requirePermission("analytics"), async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // User stats
    const totalUsers = await User.countDocuments();
    const totalEditors = await User.countDocuments({ role: "editor" });
    const totalClients = await User.countDocuments({ role: "client" });
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });
    const newUsersLastMonth = await User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } });

    // Order stats
    const totalOrders = await Order.countDocuments();
    const activeOrders = await Order.countDocuments({ status: { $in: ["new", "accepted", "in_progress", "submitted"] } });
    const completedOrders = await Order.countDocuments({ status: "completed" });
    const disputedOrders = await Order.countDocuments({ status: "disputed" });

    // Revenue stats
    const revenueAggregation = await Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" }, platformFees: { $sum: "$platformFee" } } }
    ]);
    const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;
    const platformFees = revenueAggregation[0]?.platformFees || 0;

    // Monthly revenue
    const monthlyRevenueAggregation = await Order.aggregate([
      { $match: { status: "completed", completedAt: { $gte: startOfMonth } } },
      { $group: { _id: null, revenue: { $sum: "$amount" }, fees: { $sum: "$platformFee" } } }
    ]);
    const monthlyRevenue = monthlyRevenueAggregation[0]?.revenue || 0;
    const monthlyPlatformFees = monthlyRevenueAggregation[0]?.fees || 0;

    // Gig stats
    const totalGigs = await Gig.countDocuments();
    const activeGigs = await Gig.countDocuments({ isActive: true });

    // Message stats (last 24 hours)
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
    const messagesLast24h = await Message.countDocuments({ createdAt: { $gte: last24Hours } });

    // Growth calculations
    const userGrowth = newUsersLastMonth > 0 
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100) 
      : 100;

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          editors: totalEditors,
          clients: totalClients,
          newThisMonth: newUsersThisMonth,
          growth: userGrowth,
        },
        orders: {
          total: totalOrders,
          active: activeOrders,
          completed: completedOrders,
          disputed: disputedOrders,
        },
        revenue: {
          total: totalRevenue,
          platformFees: platformFees,
          monthly: monthlyRevenue,
          monthlyPlatformFees: monthlyPlatformFees,
        },
        gigs: {
          total: totalGigs,
          active: activeGigs,
        },
        activity: {
          messagesLast24h: messagesLast24h,
        },
      },
    });

  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

// ============ ANALYTICS - CHARTS DATA ============
router.get("/analytics/charts", requirePermission("analytics"), async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Revenue over time
    const revenueByDay = await Order.aggregate([
      { $match: { status: "completed", completedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          revenue: { $sum: "$amount" },
          orders: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Users by day
    const usersByDay = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Top editors by revenue
    const topEditors = await Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$editor", totalEarnings: { $sum: "$editorEarning" }, orders: { $sum: 1 } } },
      { $sort: { totalEarnings: -1 } },
      { $limit: 10 },
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
          email: "$editor.email",
          profilePicture: "$editor.profilePicture",
          totalEarnings: 1,
          orders: 1,
        }
      }
    ]);

    res.status(200).json({
      success: true,
      charts: {
        revenueByDay,
        usersByDay,
        ordersByStatus,
        topEditors,
      },
    });

  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
});

// ============ USERS MANAGEMENT ============
router.get("/users", requirePermission("users"), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, sort = "-createdAt" } = req.query;
    
    const query = {};
    if (role && role !== "all") query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Users fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

router.get("/users/:id", requirePermission("users"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get user's orders
    const orders = await Order.find({ $or: [{ client: user._id }, { editor: user._id }] })
      .sort("-createdAt")
      .limit(10);

    res.status(200).json({ success: true, user, orders });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
});

router.patch("/users/:id/status", requirePermission("users"), logActivity("USER_STATUS_CHANGE"), async (req, res) => {
  try {
    const { isBanned, banReason } = req.body;
    
    const updateData = {
      isBanned: isBanned,
    };
    
    // If banning, add reason and timestamp
    if (isBanned) {
      updateData.banReason = banReason || "Violation of terms of service";
      updateData.bannedAt = new Date();
      updateData.bannedBy = req.admin._id;
    } else {
      // If unbanning, clear ban fields
      updateData.banReason = null;
      updateData.bannedAt = null;
      updateData.bannedBy = null;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If user was banned, emit real-time event to kick them out immediately
    if (isBanned) {
      emitToUser(req.params.id, "admin:banned", {
        reason: updateData.banReason,
        message: "Your account has been suspended.",
      });
    } else {
      // Emit unbanned event so they can login again
      emitToUser(req.params.id, "admin:unbanned", {
        message: "Your account has been restored. You can now login.",
      });
    }

    res.status(200).json({ 
      success: true, 
      user, 
      message: `User ${isBanned ? "banned" : "unbanned"} successfully` 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user status" });
  }
});

// ============ ORDERS MANAGEMENT ============
router.get("/orders", requirePermission("orders"), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, sort = "-createdAt" } = req.query;
    
    const query = {};
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(query)
      .populate("client", "name email profilePicture")
      .populate("editor", "name email profilePicture")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

router.patch("/orders/:id/status", requirePermission("orders"), logActivity("ORDER_STATUS_CHANGE"), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("client editor", "name email");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order, message: `Order status updated to ${status}` });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update order status" });
  }
});

// ============ GIGS MANAGEMENT ============
router.get("/gigs", requirePermission("gigs"), async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, search, sort = "-createdAt" } = req.query;
    
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const gigs = await Gig.find(query)
      .populate("editor", "name email profilePicture")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Gig.countDocuments(query);

    res.status(200).json({
      success: true,
      gigs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch gigs" });
  }
});

router.patch("/gigs/:id/status", requirePermission("gigs"), logActivity("GIG_STATUS_CHANGE"), async (req, res) => {
  try {
    const { isActive } = req.body;
    const gig = await Gig.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).populate("editor", "name email");

    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found" });
    }

    res.status(200).json({ success: true, gig, message: `Gig ${isActive ? "activated" : "deactivated"}` });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update gig status" });
  }
});

// ============ ACTIVITY LOGS ============
router.get("/activity-logs", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const admins = await Admin.find()
      .select("name email activityLog")
      .sort("-activityLog.timestamp");

    // Flatten and combine all activity logs
    let allLogs = [];
    admins.forEach(admin => {
      admin.activityLog.forEach(log => {
        allLogs.push({
          adminId: admin._id,
          adminName: admin.name,
          adminEmail: admin.email,
          ...log.toObject(),
        });
      });
    });

    // Sort by timestamp descending
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedLogs = allLogs.slice(startIndex, startIndex + parseInt(limit));

    res.status(200).json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allLogs.length,
        pages: Math.ceil(allLogs.length / limit),
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch activity logs" });
  }
});

// ============ ADMIN MANAGEMENT (Superadmin only) ============
router.get("/admins", async (req, res) => {
  try {
    if (req.admin.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Superadmin access required" });
    }

    const admins = await Admin.find().select("-password -currentSessionToken -activityLog");
    res.status(200).json({ success: true, admins });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch admins" });
  }
});

router.post("/admins", async (req, res) => {
  try {
    if (req.admin.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Superadmin access required" });
    }

    const { email, password, name, role = "admin", permissions } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: "Admin with this email already exists" });
    }

    const newAdmin = await Admin.create({
      email,
      password,
      name,
      role,
      permissions,
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });

  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ success: false, message: "Failed to create admin" });
  }
});

// ============ SITE SETTINGS ============

// Get site settings
router.get("/settings", async (req, res) => {
  try {
    if (req.admin.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Superadmin access required" });
    }

    const settings = await SiteSettings.getSettings();
    res.status(200).json({ success: true, settings });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
});

// Update site settings
router.patch("/settings", logActivity("SETTINGS_UPDATE"), async (req, res) => {
  try {
    if (req.admin.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Superadmin access required" });
    }

    const { 
      maintenanceMode, 
      maintenanceMessage, 
      maintenanceEndTime,
      platformFee,
      emailNotificationsEnabled,
      allowNewRegistrations,
    } = req.body;

    const settings = await SiteSettings.getSettings();

    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (maintenanceMessage) settings.maintenanceMessage = maintenanceMessage;
    if (maintenanceEndTime !== undefined) settings.maintenanceEndTime = maintenanceEndTime;
    if (platformFee !== undefined) settings.platformFee = platformFee;
    if (emailNotificationsEnabled !== undefined) settings.emailNotificationsEnabled = emailNotificationsEnabled;
    if (allowNewRegistrations !== undefined) settings.allowNewRegistrations = allowNewRegistrations;
    
    settings.lastUpdatedBy = req.admin._id;
    await settings.save();

    // Broadcast maintenance mode change to all users in real-time
    if (maintenanceMode !== undefined) {
      emitMaintenance(settings.maintenanceMode, settings.maintenanceMessage);
    }

    res.status(200).json({ 
      success: true, 
      settings,
      message: "Settings updated successfully" 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
});

// Public endpoint to check maintenance status (no auth required)
router.get("/maintenance-status", async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();
    
    res.status(200).json({
      success: true,
      maintenance: {
        isActive: settings.maintenanceMode,
        message: settings.maintenanceMessage,
        endTime: settings.maintenanceEndTime,
      },
    });

  } catch (error) {
    res.status(200).json({
      success: true,
      maintenance: { isActive: false },
    });
  }
});

// ============ CONVERSATIONS / CHAT VIEWER ============

// Get all order conversations
router.get("/conversations", requirePermission("orders"), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    // Filter by order status
    if (status && status !== "all") {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get orders with message counts
    let orders = await Order.find(query)
      .populate("client", "name email profilePicture")
      .populate("editor", "name email profilePicture")
      .populate("gig", "title")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add message counts to each order
    for (let order of orders) {
      const messageCount = await Message.countDocuments({ order: order._id });
      const lastMessage = await Message.findOne({ order: order._id })
        .sort({ createdAt: -1 })
        .select("content type createdAt sender")
        .populate("sender", "name")
        .lean();
      
      order.messageCount = messageCount;
      order.lastMessage = lastMessage;
    }

    // Search filter (after getting data)
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(order => 
        order.client?.name?.toLowerCase().includes(searchLower) ||
        order.editor?.name?.toLowerCase().includes(searchLower) ||
        order.gig?.title?.toLowerCase().includes(searchLower) ||
        order._id.toString().includes(searchLower)
      );
    }

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      conversations: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });

  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
});

// Get full chat history for an order
router.get("/conversations/:orderId", requirePermission("orders"), async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order details
    const order = await Order.findById(orderId)
      .populate("client", "name email profilePicture role")
      .populate("editor", "name email profilePicture role")
      .populate("gig", "title price")
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Get all messages for this order
    const messages = await Message.find({ order: orderId })
      .populate("sender", "name email profilePicture role")
      .sort({ createdAt: 1 })
      .lean();

    // Message statistics
    const stats = {
      totalMessages: messages.length,
      clientMessages: messages.filter(m => m.sender?._id?.toString() === order.client?._id?.toString()).length,
      editorMessages: messages.filter(m => m.sender?._id?.toString() === order.editor?._id?.toString()).length,
      systemMessages: messages.filter(m => m.type === "system").length,
      mediaMessages: messages.filter(m => ["file", "image", "video", "audio"].includes(m.type)).length,
      firstMessageAt: messages[0]?.createdAt,
      lastMessageAt: messages[messages.length - 1]?.createdAt,
    };

    res.status(200).json({
      success: true,
      order,
      messages,
      stats,
    });

  } catch (error) {
    console.error("Get conversation details error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch conversation" });
  }
});

// ============ ADVANCED ANALYTICS ============

// Revenue Analytics
router.get("/analytics/revenue", requirePermission("analytics"), async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Daily revenue for period
    const dailyRevenue = await Order.aggregate([
      { $match: { status: "completed", completedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          revenue: { $sum: "$amount" },
          platformFees: { $sum: "$platformFee" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Total stats for period
    const periodStats = await Order.aggregate([
      { $match: { status: "completed", completedAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalPlatformFees: { $sum: "$platformFee" },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: "$amount" },
        },
      },
    ]);

    // Compare with previous period
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    
    const prevPeriodStats = await Order.aggregate([
      { $match: { status: "completed", completedAt: { $gte: prevStartDate, $lt: startDate } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const currentRevenue = periodStats[0]?.totalRevenue || 0;
    const previousRevenue = prevPeriodStats[0]?.totalRevenue || 0;
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      analytics: {
        dailyRevenue,
        summary: {
          totalRevenue: periodStats[0]?.totalRevenue || 0,
          totalPlatformFees: periodStats[0]?.totalPlatformFees || 0,
          totalOrders: periodStats[0]?.totalOrders || 0,
          avgOrderValue: Math.round(periodStats[0]?.avgOrderValue || 0),
          revenueGrowth: parseFloat(revenueGrowth),
        },
        period: days,
      },
    });

  } catch (error) {
    console.error("Revenue analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch revenue analytics" });
  }
});

// User Analytics
router.get("/analytics/users", requirePermission("analytics"), async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Daily signups
    const dailySignups = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          editors: { $sum: { $cond: [{ $eq: ["$role", "editor"] }, 1, 0] } },
          clients: { $sum: { $cond: [{ $eq: ["$role", "client"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // User distribution
    const userDistribution = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Active users (users with orders in period)
    const activeUsers = await Order.distinct("client", { createdAt: { $gte: startDate } });
    const activeEditors = await Order.distinct("editor", { createdAt: { $gte: startDate } });

    // Banned users
    const bannedUsers = await User.countDocuments({ isBanned: true });

    // Total counts
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });

    res.status(200).json({
      success: true,
      analytics: {
        dailySignups,
        userDistribution,
        summary: {
          totalUsers,
          newUsers,
          activeClients: activeUsers.length,
          activeEditors: activeEditors.length,
          bannedUsers,
        },
        period: days,
      },
    });

  } catch (error) {
    console.error("User analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user analytics" });
  }
});

// Order Performance Analytics
router.get("/analytics/orders", requirePermission("analytics"), async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Order funnel
    const orderFunnel = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Daily orders
    const dailyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Average completion time (for completed orders)
    const completionTime = await Order.aggregate([
      { $match: { status: "completed", completedAt: { $gte: startDate } } },
      {
        $project: {
          duration: { $subtract: ["$completedAt", "$createdAt"] },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$duration" },
        },
      },
    ]);

    const avgCompletionHours = completionTime[0]?.avgDuration 
      ? Math.round(completionTime[0].avgDuration / (1000 * 60 * 60)) 
      : 0;

    // Completion rate
    const totalOrders = await Order.countDocuments({ createdAt: { $gte: startDate } });
    const completedOrders = await Order.countDocuments({ status: "completed", createdAt: { $gte: startDate } });
    const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      analytics: {
        orderFunnel,
        dailyOrders,
        summary: {
          totalOrders,
          completedOrders,
          completionRate: parseFloat(completionRate),
          avgCompletionHours,
        },
        period: days,
      },
    });

  } catch (error) {
    console.error("Order analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch order analytics" });
  }
});

// Category/Gig Analytics
router.get("/analytics/categories", requirePermission("analytics"), async (req, res) => {
  try {
    // Top gigs by revenue
    const topGigsByRevenue = await Order.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$gig",
          revenue: { $sum: "$amount" },
          orders: { $sum: 1 },
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
          revenue: 1,
          orders: 1,
          price: "$gigDetails.price",
        },
      },
    ]);

    // Top gigs by orders
    const topGigsByOrders = await Order.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$gig",
          orders: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { orders: -1 } },
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
          orders: 1,
          revenue: 1,
        },
      },
    ]);

    // Gig statistics
    const totalGigs = await Gig.countDocuments();
    const activeGigs = await Gig.countDocuments({ isActive: true });
    const pausedGigs = await Gig.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      analytics: {
        topGigsByRevenue,
        topGigsByOrders,
        summary: {
          totalGigs,
          activeGigs,
          pausedGigs,
        },
      },
    });

  } catch (error) {
    console.error("Category analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch category analytics" });
  }
});

// ============ KYC MANAGEMENT ============

// Get KYC statistics (MUST be before :userId route)
router.get("/kyc/stats/summary", requirePermission("users"), async (req, res) => {
  try {
    const pending = await User.countDocuments({ role: "editor", kycStatus: "submitted" });
    const verified = await User.countDocuments({ role: "editor", kycStatus: "verified" });
    const rejected = await User.countDocuments({ role: "editor", kycStatus: "rejected" });
    const notSubmitted = await User.countDocuments({ role: "editor", kycStatus: { $in: ["not_submitted", null] } });
    
    res.status(200).json({
      success: true,
      stats: {
        pending,
        verified,
        rejected,
        notSubmitted,
        total: pending + verified + rejected + notSubmitted,
      },
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch KYC stats" });
  }
});

// Get all pending KYC submissions (MUST be before :userId route)
router.get("/kyc/pending", requirePermission("users"), async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "submitted" } = req.query;
    
    const query = {
      role: "editor",
      kycStatus: { $in: status === "all" ? ["submitted", "pending", "verified", "rejected"] : [status] }
    };
    
    const users = await User.find(query)
      .select("name email profilePicture kycStatus kycSubmittedAt kycVerifiedAt bankDetails.accountHolderName bankDetails.bankName bankDetails.ifscCode")
      .sort("-kycSubmittedAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    const pendingCount = await User.countDocuments({ role: "editor", kycStatus: "submitted" });
    
    res.status(200).json({
      success: true,
      users,
      pendingCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error("KYC fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch KYC submissions" });
  }
});

// Get KYC details for a specific user
router.get("/kyc/:userId", requirePermission("users"), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password +bankDetails.accountNumber +bankDetails.panNumber");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Get additional profile data
    const { Profile } = await import("../models/Profile.js");
    const profile = await Profile.findOne({ user: user._id }).lean();

    // Fetch Audit Logs
    const logs = await KYCLog.find({ user: user._id, userRole: "editor" })
      .sort({ createdAt: -1 })
      .populate("performedBy.adminId", "name email")
      .lean();
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        role: user.role,
        kycStatus: user.kycStatus,
        kycSubmittedAt: user.kycSubmittedAt,
        kycVerifiedAt: user.kycVerifiedAt,
        kycRejectionReason: user.kycRejectionReason,
        bankDetails: user.bankDetails ? {
          accountHolderName: user.bankDetails.accountHolderName,
          bankName: user.bankDetails.bankName,
          ifscCode: user.bankDetails.ifscCode,
          accountNumber: user.bankDetails.accountNumber 
            ? "XXXX" + user.bankDetails.accountNumber.slice(-4) 
            : null,
          panNumber: user.bankDetails.panNumber
            ? user.bankDetails.panNumber.slice(0,2) + "XXXX" + user.bankDetails.panNumber.slice(-2)
            : null,
        } : null,
        createdAt: user.createdAt,
      },
      profile: profile ? {
        about: profile.about,
        skills: profile.skills,
        location: profile.location,
      } : null,
      logs,
    });
    
  } catch (error) {
    console.error("KYC details error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch KYC details" });
  }
});

// Approve/Reject KYC
router.post("/kyc/:userId/verify", requirePermission("users"), logActivity("KYC_VERIFICATION"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'
    
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    if (user.kycStatus === "verified" && action === "approve") {
      return res.status(400).json({ success: false, message: "KYC already verified" });
    }
    
    if (action === "approve") {
      user.kycStatus = "verified";
      user.kycVerifiedAt = new Date();
      user.kycRejectionReason = null;
      user.isVerified = true; // Mark editor as verified
      user.profileCompleted = true; // Mark profile as complete so editor appears in explore
    } else {
      user.kycStatus = "rejected";
      user.kycRejectionReason = rejectionReason || "Documents could not be verified";
      user.kycVerifiedAt = null;
    }
    
    // Recalculate profile completion
    let completion = 0;
    if (user.name && user.profilePicture) completion += 12;
    if (user.bio) completion += 8;
    if (user.skills?.length >= 3) completion += 15;
    else if (user.skills?.length > 0) completion += 8;
    if (user.kycStatus === "verified") completion += 30;
    else if (user.kycStatus === "submitted") completion += 15;
    user.profileCompletionPercent = Math.min(completion, 100);
    
    await user.save();

    // Audit Log
    await KYCLog.create({
      user: userId,
      userRole: "editor",
      performedBy: { adminId: req.admin._id, role: "admin" },
      action: action === "approve" ? "verified" : "rejected",
      reason: rejectionReason,
      metadata: { 
        previousStatus: user.kycStatus, 
        newStatus: action === "approve" ? "verified" : "rejected" 
      }
    });
    
    // Send notification to user
    try {
      const { Notification } = await import("../models/Notification.js");
      await Notification.create({
        recipient: user._id,
        type: action === "approve" ? "success" : "warning",
        title: action === "approve" ? "KYC Verified! 🎉" : "KYC Rejected",
        message: action === "approve" 
          ? "Your KYC has been verified. You can now receive payouts!"
          : `Your KYC was rejected: ${user.kycRejectionReason}`,
        link: "/kyc-details",
      });
      
      // Emit real-time notification
      emitToUser(userId, "notification:new", {
        type: action === "approve" ? "success" : "warning",
        title: action === "approve" ? "KYC Verified!" : "KYC Rejected",
        message: action === "approve" 
          ? "Your KYC has been verified successfully!"
          : user.kycRejectionReason,
      });
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }
    
    res.status(200).json({
      success: true,
      message: action === "approve" ? "KYC approved successfully" : "KYC rejected",
      user: {
        _id: user._id,
        name: user.name,
        kycStatus: user.kycStatus,
      },
    });
    
  } catch (error) {
    console.error("KYC verification error:", error);
    res.status(500).json({ success: false, message: "Failed to verify KYC" });
  }
});

// ============ STORAGE SETTINGS MANAGEMENT ============

/**
 * Get current storage settings
 * GET /admin/storage-settings
 */
router.get("/storage-settings", requirePermission("settings"), async (req, res) => {
  try {
    const settings = await StorageSettings.getSettings();
    
    res.json({
      success: true,
      settings: {
        freeStorageMB: settings.freeStorageMB,
        maxStorageMB: settings.maxStorageMB,
        plans: settings.plans,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching storage settings:", error);
    res.status(500).json({ success: false, message: "Failed to fetch storage settings" });
  }
});

/**
 * Update storage settings
 * PUT /admin/storage-settings
 */
router.put("/storage-settings", requirePermission("settings"), logActivity("Updated storage settings"), async (req, res) => {
  try {
    const { freeStorageMB, maxStorageMB, plans } = req.body;
    
    const settings = await StorageSettings.getSettings();
    
    // Update free storage limit
    if (freeStorageMB !== undefined) {
      if (freeStorageMB < 100 || freeStorageMB > 10240) {
        return res.status(400).json({ 
          success: false, 
          message: "Free storage must be between 100 MB and 10 GB" 
        });
      }
      settings.freeStorageMB = freeStorageMB;
    }
    
    // Update max storage limit
    if (maxStorageMB !== undefined) {
      if (maxStorageMB < 1024 || maxStorageMB > 102400) {
        return res.status(400).json({ 
          success: false, 
          message: "Max storage must be between 1 GB and 100 GB" 
        });
      }
      settings.maxStorageMB = maxStorageMB;
    }
    
    // Update plans if provided
    if (plans && Array.isArray(plans)) {
      // Validate plans
      for (const plan of plans) {
        if (!plan.id || !plan.name || !plan.storageMB || plan.price === undefined) {
          return res.status(400).json({
            success: false,
            message: "Each plan must have id, name, storageMB, and price"
          });
        }
        if (plan.storageMB < 100) {
          return res.status(400).json({
            success: false,
            message: `Plan ${plan.name} must have at least 100 MB storage`
          });
        }
      }
      settings.plans = plans;
    }
    
    settings.updatedBy = req.admin._id;
    await settings.save();
    
    // Update all free-tier users' storage limits if freeStorageMB changed
    if (freeStorageMB !== undefined) {
      const newLimitBytes = freeStorageMB * 1024 * 1024;
      const updateResult = await User.updateMany(
        { storagePlan: "free" },
        { $set: { storageLimit: newLimitBytes } }
      );
      console.log(`[STORAGE] Updated ${updateResult.modifiedCount} free-tier users' storage limit to ${freeStorageMB}MB`);
    }
    
    res.json({
      success: true,
      message: "Storage settings updated successfully",
      settings: {
        freeStorageMB: settings.freeStorageMB,
        maxStorageMB: settings.maxStorageMB,
        plans: settings.plans,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating storage settings:", error);
    res.status(500).json({ success: false, message: "Failed to update storage settings" });
  }
});

/**
 * Add a new storage plan
 * POST /admin/storage-settings/plans
 */
router.post("/storage-settings/plans", requirePermission("settings"), logActivity("Added storage plan"), async (req, res) => {
  try {
    const { id, name, storageMB, price, features, popular } = req.body;
    
    if (!id || !name || !storageMB || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Plan must have id, name, storageMB, and price"
      });
    }
    
    const settings = await StorageSettings.getSettings();
    
    // Check if plan ID already exists
    if (settings.plans.some(p => p.id === id)) {
      return res.status(400).json({
        success: false,
        message: "A plan with this ID already exists"
      });
    }
    
    settings.plans.push({
      id,
      name,
      storageMB,
      price,
      features: features || [],
      popular: popular || false,
      active: true,
    });
    
    settings.updatedBy = req.admin._id;
    await settings.save();
    
    res.json({
      success: true,
      message: "Storage plan added successfully",
      plans: settings.plans,
    });
  } catch (error) {
    console.error("Error adding storage plan:", error);
    res.status(500).json({ success: false, message: "Failed to add storage plan" });
  }
});

/**
 * Delete a storage plan
 * DELETE /admin/storage-settings/plans/:planId
 */
router.delete("/storage-settings/plans/:planId", requirePermission("settings"), logActivity("Deleted storage plan"), async (req, res) => {
  try {
    const { planId } = req.params;
    
    const settings = await StorageSettings.getSettings();
    
    const planIndex = settings.plans.findIndex(p => p.id === planId);
    if (planIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }
    
    settings.plans.splice(planIndex, 1);
    settings.updatedBy = req.admin._id;
    await settings.save();
    
    res.json({
      success: true,
      message: "Storage plan deleted successfully",
      plans: settings.plans,
    });
  } catch (error) {
    console.error("Error deleting storage plan:", error);
    res.status(500).json({ success: false, message: "Failed to delete storage plan" });
  }
});

/**
 * Get all storage purchases with user details
 * GET /admin/storage-purchases
 */
router.get("/storage-purchases", requirePermission("analytics"), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Get total count
    const total = await StoragePurchase.countDocuments(filter);
    
    // Fetch purchases with user info
    let purchases = await StoragePurchase.find(filter)
      .populate('user', 'name email profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // If search query, filter by user name/email
    if (search) {
      const searchLower = search.toLowerCase();
      purchases = purchases.filter(p => 
        p.user?.name?.toLowerCase().includes(searchLower) ||
        p.user?.email?.toLowerCase().includes(searchLower) ||
        p.planName?.toLowerCase().includes(searchLower)
      );
    }
    
    // Format for frontend
    const formattedPurchases = purchases.map(p => ({
      _id: p._id,
      user: p.user ? {
        _id: p.user._id,
        name: p.user.name,
        email: p.user.email,
        profilePic: p.user.profilePic,
      } : null,
      planId: p.planId,
      planName: p.planName,
      storageMB: Math.round(p.storageBytes / (1024 * 1024)),
      amount: p.amount,
      currency: p.currency || 'INR',
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId,
      status: p.status,
      purchasedAt: p.purchasedAt,
      createdAt: p.createdAt,
    }));
    
    // Get summary stats
    const completedPurchases = await StoragePurchase.find({ status: 'completed' });
    const totalRevenue = completedPurchases.reduce((sum, p) => sum + p.amount, 0);
    const pendingCount = await StoragePurchase.countDocuments({ status: 'pending' });
    
    res.json({
      success: true,
      purchases: formattedPurchases,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      stats: {
        totalRevenue,
        totalCompleted: completedPurchases.length,
        totalPending: pendingCount,
      },
    });
  } catch (error) {
    console.error("Error fetching storage purchases:", error);
    res.status(500).json({ success: false, message: "Failed to fetch storage purchases" });
  }
});

export default router;


