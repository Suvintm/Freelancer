import express from "express";
import { protectAdmin, requirePermission, logActivity } from "../middleware/adminAuth.js";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import { Order } from "../models/Order.js";
import { Gig } from "../models/Gig.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { SiteSettings } from "../models/SiteSettings.js";
import { emitToUser, emitMaintenance } from "../socket.js";

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

export default router;
