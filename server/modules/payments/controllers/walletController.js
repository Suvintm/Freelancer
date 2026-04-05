import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";

/**
 * @desc    Get user's wallet balance and stats (PostgreSQL)
 * @route   GET /api/wallet/balance
 * @access  Private (Editor)
 */
export const getWalletBalance = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Try to find the wallet, create if it doesn't exist
  let wallet = await prisma.userWallet.findUnique({
    where: { user_id: userId }
  });

  if (!wallet) {
    wallet = await prisma.userWallet.create({
      data: { user_id: userId }
    });
  }

  const walletBalance = Number(wallet.wallet_balance || 0);
  const pendingBalance = Number(wallet.pending_balance || 0);

  res.json({
    success: true,
    wallet: {
      available: walletBalance,          // Can withdraw now
      pending: pendingBalance,           // In clearance (7 days)
      lifetime: Number(wallet.lifetime_earnings || 0),        // All time earned
      withdrawn: Number(wallet.total_withdrawn || 0),         // All time withdrawn
      total: walletBalance + pendingBalance,                  // Total held by platform
    }
  });
});

/**
 * @desc    Get user's wallet transaction history (PostgreSQL)
 * @route   GET /api/wallet/transactions
 * @access  Private (Editor)
 */
export const getWalletTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, status } = req.query;
  const userId = req.user.id;
  
  const where = { user_id: userId };
  if (type) where.type = type;
  if (status) where.status = status;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const transactions = await prisma.walletTransaction.findMany({
    where,
    include: {
      order: { select: { order_number: true, title: true, amount: true } },
      withdrawal: { select: { amount: true, status: true, requested_at: true } }
    },
    orderBy: { created_at: 'desc' },
    skip,
    take: parseInt(limit)
  });
    
  const total = await prisma.walletTransaction.count({ where });

  // Map to frontend expected names
  const mappedTransactions = transactions.map(tx => ({
     ...tx,
     order: tx.order ? {
         orderNumber: tx.order.order_number,
         title: tx.order.title,
         amount: Number(tx.order.amount)
     } : null,
     withdrawal: tx.withdrawal ? {
         amount: Number(tx.withdrawal.amount),
         status: tx.withdrawal.status,
         requestedAt: tx.withdrawal.requested_at
     } : null
  }));

  res.json({ 
    success: true, 
    transactions: mappedTransactions,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get transactions pending clearance (PostgreSQL)
 * @route   GET /api/wallet/pending
 * @access  Private (Editor)
 */
export const getPendingClearance = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const transactions = await prisma.walletTransaction.findMany({
    where: {
      user_id: userId,
      status: "pending_clearance"
    },
    include: {
      order: { select: { order_number: true, title: true } }
    },
    orderBy: { clearance_date: 'asc' }
  });

  res.json({
    success: true,
    count: transactions.length,
    transactions: transactions.map(tx => ({
      ...tx,
      clearanceDate: tx.clearance_date,
      order: tx.order ? {
          orderNumber: tx.order.order_number,
          title: tx.order.title
      } : null
    }))
  });
});






