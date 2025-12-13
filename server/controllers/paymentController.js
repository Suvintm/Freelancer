// paymentController.js - Handle payment history and receipts
import asyncHandler from "express-async-handler";
import { Payment } from "../models/Payment.js";
import { Order } from "../models/Order.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * 📋 Get Payment History
 * GET /api/payments/history
 */
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, status, sort = "-createdAt" } = req.query;
  const userId = req.user._id;
  const userRole = req.user.role;

  // Build query based on user role
  let query = {};
  if (userRole === "client") {
    query.client = userId;
  } else if (userRole === "editor") {
    query.editor = userId;
  }

  // Add filters
  if (type) query.type = type;
  if (status) query.status = status;

  const payments = await Payment.find(query)
    .populate("order", "orderNumber title")
    .populate("client", "name profilePicture")
    .populate("editor", "name profilePicture")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(query);

  res.json({
    success: true,
    payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * 📊 Get Payment Statistics
 * GET /api/payments/stats
 */
export const getPaymentStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let matchCondition = {};
  if (userRole === "client") {
    matchCondition.client = userId;
  } else if (userRole === "editor") {
    matchCondition.editor = userId;
  }

  // Get total and completed stats
  const stats = await Payment.aggregate([
    { $match: { ...matchCondition, status: "completed" } },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        totalEarnings: { $sum: "$editorEarning" },
        totalFees: { $sum: "$platformFee" },
        avgAmount: { $avg: "$amount" },
      },
    },
  ]);

  // Get pending amount
  const pendingStats = await Payment.aggregate([
    { $match: { ...matchCondition, status: "pending" } },
    {
      $group: {
        _id: null,
        pendingAmount: { $sum: "$amount" },
        pendingCount: { $sum: 1 },
      },
    },
  ]);

  // Get monthly stats (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyStats = await Payment.aggregate([
    {
      $match: {
        ...matchCondition,
        status: "completed",
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        amount: { $sum: userRole === "editor" ? "$editorEarning" : "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Get recent payments
  const recentPayments = await Payment.find({
    ...matchCondition,
    status: "completed",
  })
    .populate("order", "orderNumber title")
    .populate("client", "name")
    .populate("editor", "name")
    .sort("-completedAt")
    .limit(5);

  res.json({
    success: true,
    stats: stats[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      totalEarnings: 0,
      totalFees: 0,
      avgAmount: 0,
    },
    pending: pendingStats[0] || { pendingAmount: 0, pendingCount: 0 },
    monthlyStats,
    recentPayments,
  });
});

/**
 * 🔍 Get Single Payment
 * GET /api/payments/:id
 */
export const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const payment = await Payment.findById(id)
    .populate("order", "orderNumber title description deadline createdAt completedAt")
    .populate("client", "name email profilePicture")
    .populate("editor", "name email profilePicture")
    .populate("gig", "title");

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  // Check access
  const isClient = payment.client._id.toString() === userId.toString();
  const isEditor = payment.editor._id.toString() === userId.toString();
  const isAdmin = req.user.role === "admin";

  if (!isClient && !isEditor && !isAdmin) {
    throw new ApiError(403, "Not authorized to view this payment");
  }

  res.json({
    success: true,
    payment,
  });
});

/**
 * 🧾 Generate Receipt Data
 * GET /api/payments/:id/receipt
 */
export const getReceiptData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const payment = await Payment.findById(id)
    .populate("order", "orderNumber title description deadline createdAt completedAt")
    .populate("client", "name email")
    .populate("editor", "name email");

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  // Check access
  const isClient = payment.client._id.toString() === userId.toString();
  const isEditor = payment.editor._id.toString() === userId.toString();
  const isAdmin = req.user.role === "admin";

  if (!isClient && !isEditor && !isAdmin) {
    throw new ApiError(403, "Not authorized to view this receipt");
  }

  // Update download tracking
  payment.receiptDownloadedAt = new Date();
  await payment.save();

  // Calculate additional info
  const order = payment.order || payment.orderSnapshot;
  const createdDate = new Date(order.createdAt || payment.orderSnapshot?.createdAt);
  const completedDate = new Date(order.completedAt || payment.orderSnapshot?.completedAt || payment.completedAt);
  const deadline = new Date(order.deadline || payment.orderSnapshot?.deadline);
  
  const totalDays = Math.ceil((completedDate - createdDate) / (1000 * 60 * 60 * 24));
  const daysBeforeDeadline = Math.ceil((deadline - completedDate) / (1000 * 60 * 60 * 24));

  res.json({
    success: true,
    receipt: {
      receiptNumber: payment.receiptNumber,
      transactionId: payment.transactionId,
      date: payment.completedAt || payment.createdAt,
      
      // Parties
      client: {
        name: payment.client?.name || "Client",
        email: payment.client?.email,
      },
      editor: {
        name: payment.editor?.name || "Editor",
        email: payment.editor?.email,
      },
      
      // Order details
      order: {
        orderNumber: order?.orderNumber || payment.orderSnapshot?.orderNumber,
        title: order?.title || payment.orderSnapshot?.title,
        description: order?.description || payment.orderSnapshot?.description,
        createdAt: createdDate,
        completedAt: completedDate,
        deadline: deadline,
        totalDays,
        daysBeforeDeadline,
        onTime: daysBeforeDeadline >= 0,
      },
      
      // Payment details
      payment: {
        amount: payment.amount,
        platformFee: payment.platformFee,
        editorEarning: payment.editorEarning,
        type: payment.type,
        status: payment.status,
      },
      
      // Platform info
      platform: {
        name: "Suvix",
        website: "suvix.com",
        supportEmail: "support@suvix.com",
      },
    },
  });
});

/**
 * 📈 Admin: Get All Payment Analytics
 * GET /api/payments/admin/analytics
 */
export const getAdminPaymentAnalytics = asyncHandler(async (req, res) => {
  // Total revenue
  const revenueStats = await Payment.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
        platformRevenue: { $sum: "$platformFee" },
        editorPayouts: { $sum: "$editorEarning" },
        totalTransactions: { $sum: 1 },
      },
    },
  ]);

  // Monthly revenue (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyRevenue = await Payment.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        revenue: { $sum: "$amount" },
        platformFee: { $sum: "$platformFee" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Top earning editors
  const topEditors = await Payment.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: "$editor",
        totalEarnings: { $sum: "$editorEarning" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalEarnings: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "editor",
      },
    },
    { $unwind: "$editor" },
    {
      $project: {
        name: "$editor.name",
        profilePicture: "$editor.profilePicture",
        totalEarnings: 1,
        orderCount: 1,
      },
    },
  ]);

  // Top spending clients
  const topClients = await Payment.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: "$client",
        totalSpent: { $sum: "$amount" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "client",
      },
    },
    { $unwind: "$client" },
    {
      $project: {
        name: "$client.name",
        profilePicture: "$client.profilePicture",
        totalSpent: 1,
        orderCount: 1,
      },
    },
  ]);

  // Recent payments
  const recentPayments = await Payment.find({ status: "completed" })
    .populate("order", "orderNumber title")
    .populate("client", "name")
    .populate("editor", "name")
    .sort("-completedAt")
    .limit(10);

  res.json({
    success: true,
    revenue: revenueStats[0] || {
      totalRevenue: 0,
      platformRevenue: 0,
      editorPayouts: 0,
      totalTransactions: 0,
    },
    monthlyRevenue,
    topEditors,
    topClients,
    recentPayments,
  });
});

/**
 * 📋 Admin: Get All Payments
 * GET /api/payments/admin/all
 */
export const getAllPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status, type, sort = "-createdAt" } = req.query;

  let query = {};
  if (status) query.status = status;
  if (type) query.type = type;

  const payments = await Payment.find(query)
    .populate("order", "orderNumber title")
    .populate("client", "name email")
    .populate("editor", "name email")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(query);

  res.json({
    success: true,
    payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
