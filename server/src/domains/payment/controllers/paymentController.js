// paymentController.js - Handle payment history and receipts
import asyncHandler from "express-async-handler";
import prisma from "../../../infrastructure/database/postgres.js";
import { ApiError } from "../../../shared/kernel/errors.js";
;

/**
 * 📋 Get Payment History
 * GET /api/payments/history
 */
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, status, sort = "desc" } = req.query;
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;

  let where = {};
  if (userRole === "client") {
    where.clientId = userId;
  } else if (userRole === "provider") {
    where.editorId = userId;
  }

  if (type) where.type = type;
  if (status) where.status = status;

  const payments = await prisma.payment.findMany({
    where,
    include: {
      client: { select: { id: true, username: true, profile: { select: { profile_picture: true } } } },
      editor: { select: { id: true, username: true, profile: { select: { profile_picture: true } } } }
    },
    orderBy: { created_at: sort === "asc" ? "asc" : "desc" },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit)
  });

  const total = await prisma.payment.count({ where });

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
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;

  let matchCondition = {};
  if (userRole === "client") {
    matchCondition.clientId = userId;
  } else if (userRole === "provider") {
    matchCondition.editorId = userId;
  }

  // Get total and completed stats
  const completedStats = await prisma.payment.aggregate({
    where: { ...matchCondition, status: "completed" },
    _sum: { amount: true, editorEarning: true, platformFee: true },
    _avg: { amount: true },
    _count: { id: true }
  });

  const pendingStats = await prisma.payment.aggregate({
    where: { ...matchCondition, status: "pending" },
    _sum: { amount: true },
    _count: { id: true }
  });

  // For monthly stats, Prisma doesn't have a direct grouping by month, so we'll use a raw query
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyStatsRaw = await prisma.$queryRaw`
    SELECT 
      EXTRACT(YEAR FROM created_at) as year,
      EXTRACT(MONTH FROM created_at) as month,
      SUM(CASE WHEN ${userRole === "provider"} THEN editor_earning ELSE amount END) as amount,
      COUNT(*) as count
    FROM payments
    WHERE status = 'completed'
      AND created_at >= ${sixMonthsAgo}
      ${userRole === "client" ? prisma.$raw`AND client_id = ${userId}::uuid` : prisma.$raw``}
      ${userRole === "provider" ? prisma.$raw`AND editor_id = ${userId}::uuid` : prisma.$raw``}
    GROUP BY year, month
    ORDER BY year ASC, month ASC
  `;

  // Get recent payments
  const recentPayments = await prisma.payment.findMany({
    where: { ...matchCondition, status: "completed" },
    include: {
      client: { select: { id: true, username: true } },
      editor: { select: { id: true, username: true } }
    },
    orderBy: { completedAt: "desc" },
    take: 5
  });

  res.json({
    success: true,
    stats: {
      totalTransactions: completedStats._count.id || 0,
      totalAmount: completedStats._sum.amount || 0,
      totalEarnings: completedStats._sum.editorEarning || 0,
      totalFees: completedStats._sum.platformFee || 0,
      avgAmount: completedStats._avg.amount || 0,
    },
    pending: {
      pendingAmount: pendingStats._sum.amount || 0,
      pendingCount: pendingStats._count.id || 0
    },
    monthlyStats: monthlyStatsRaw,
    recentPayments,
  });
});

/**
 * 🔍 Get Single Payment
 * GET /api/payments/:id
 */
export const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id || req.user.id;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, username: true, email: true, profile: { select: { profile_picture: true } } } },
      editor: { select: { id: true, username: true, email: true, profile: { select: { profile_picture: true } } } }
    }
  });

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  const isClient = payment.clientId === userId;
  const isEditor = payment.editorId === userId;
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
  const userId = req.user._id || req.user.id;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, username: true, email: true } },
      editor: { select: { id: true, username: true, email: true } }
    }
  });

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  const isClient = payment.clientId === userId;
  const isEditor = payment.editorId === userId;
  const isAdmin = req.user.role === "admin";

  if (!isClient && !isEditor && !isAdmin) {
    throw new ApiError(403, "Not authorized to view this receipt");
  }

  // Update download tracking
  await prisma.payment.update({
    where: { id },
    data: { receiptDownloadedAt: new Date() }
  });

  res.json({
    success: true,
    receipt: {
      receiptNumber: payment.receiptNumber,
      transactionId: payment.transactionId,
      date: payment.completedAt || payment.created_at,
      
      client: {
        name: payment.client?.username || "Client",
        email: payment.client?.email,
      },
      editor: {
        name: payment.editor?.username || "Editor",
        email: payment.editor?.email,
      },
      
      order: {
        orderNumber: payment.order,
      },
      
      payment: {
        amount: payment.amount,
        platformFee: payment.platformFee,
        editorEarning: payment.editorEarning,
        type: payment.type,
        status: payment.status,
      },
      
      platform: {
        name: "Suvix",
        website: "suvix.com",
        supportEmail: "support@suvix.com",
      },
    },
  });
});
