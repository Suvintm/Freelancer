import WithdrawalRequest from "../models/WithdrawalRequest.js";
import WalletTransaction from "../models/WalletTransaction.js";
import prisma from "../config/prisma.js";
import { attachUserMetadata } from "../utils/hybridJoin.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";

/**
 * Get all withdrawal requests with filtering and pagination
 * GET /api/admin/withdrawals
 */
export const getAllWithdrawals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search, sort = "-createdAt" } = req.query;

  let query = {};
  if (status && status !== "all") {
    query.status = status;
  }

  // If search is provided, look for editor name or email in PostgreSQL (Prisma)
  if (search) {
    const editors = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } }
        ]
      },
      select: { id: true }
    });
    
    query.editor = { $in: editors.map(e => e.id) };
  }

  // Fetch from MongoDB
  const withdrawals = await WithdrawalRequest.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean(); // Lean for easier merging

  // Enrich with user metadata from PostgreSQL
  const enrichedWithdrawals = await attachUserMetadata(withdrawals, "editor", "editor");

  const total = await WithdrawalRequest.countDocuments(query);

  res.json({
    success: true,
    withdrawals: enrichedWithdrawals,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get withdrawal request details
 * GET /api/admin/withdrawals/:id
 */
export const getWithdrawalById = asyncHandler(async (req, res) => {
  const withdrawal = await WithdrawalRequest.findById(req.params.id).lean();

  if (!withdrawal) {
    throw new ApiError(404, "Withdrawal request not found");
  }

  // Manually join with Prisma User (editor)
  const editor = await prisma.user.findUnique({
    where: { id: withdrawal.editor },
    select: {
      id: true,
      name: true,
      email: true,
      profile_picture: true,
      kyc_status: true,
      wallet: true,
      bank_details: true
    }
  });

  // Attach editor info manually (normalized for frontend)
  const normalizedEditor = editor ? {
    _id: editor.id,
    name: editor.name,
    email: editor.email,
    profilePicture: editor.profile_picture,
    kycStatus: editor.kyc_status,
    walletBalance: editor.wallet?.wallet_balance || 0,
    bankDetails: editor.bank_details ? {
      bankName: editor.bank_details.bank_name,
      accountHolderName: editor.bank_details.account_holder_name,
      ifscCode: editor.bank_details.ifsc_code,
      accountNumber: editor.bank_details.account_number_masked
    } : null
  } : null;

  const enrichedWithdrawal = {
    ...withdrawal,
    editor: normalizedEditor
  };

  // Also fetch related transactions for audit trail (MongoDB)
  const transaction = await WalletTransaction.findOne({ withdrawal: withdrawal._id });

  res.json({
    success: true,
    withdrawal: enrichedWithdrawal,
    transaction
  });
});

/**
 * Update withdrawal status (Manual Override)
 * PATCH /api/admin/withdrawals/:id/status
 */
export const updateWithdrawalStatus = asyncHandler(async (req, res) => {
  const { status, failureReason, adminNote } = req.body;
  const withdrawal = await WithdrawalRequest.findById(req.params.id);

  if (!withdrawal) {
    throw new ApiError(404, "Withdrawal request not found");
  }

  if (["completed", "failed", "cancelled"].includes(withdrawal.status)) {
    throw new ApiError(400, `Cannot update status of a ${withdrawal.status} withdrawal`);
  }

  const prevStatus = withdrawal.status;
  withdrawal.status = status;
  
  if (status === "failed") {
    withdrawal.failureReason = failureReason || "Rejected by admin";
    withdrawal.failedAt = new Date();
    
    // IF FAILED: Credit money back to editor's wallet in PostgreSQL
    const walletUpdate = await prisma.userWallet.update({
      where: { user_id: withdrawal.editor },
      data: {
        wallet_balance: { increment: withdrawal.amount }
      }
    });

    if (walletUpdate) {
      // Create a reversal/failed transaction log in MongoDB
      await WalletTransaction.create({
        user: withdrawal.editor,
        type: "adjustment",
        amount: withdrawal.amount,
        status: "cleared",
        withdrawal: withdrawal._id,
        balanceBefore: Number(walletUpdate.wallet_balance) - withdrawal.amount,
        balanceAfter: Number(walletUpdate.wallet_balance),
        description: `Wallet credit: Withdrawal #${withdrawal._id.toString().slice(-6)} failed/rejected.`,
        initiatedBy: "admin",
        adminNote: adminNote || failureReason
      });
    }
  } else if (status === "completed") {
    withdrawal.completedAt = new Date();
    withdrawal.processedAt = withdrawal.processedAt || new Date();
    
    // Update WalletTransaction status if it exists in MongoDB
    await WalletTransaction.findOneAndUpdate(
      { withdrawal: withdrawal._id },
      { status: "cleared", clearedAt: new Date() }
    );

    // Increment editor's totalWithdrawn in PostgreSQL
    await prisma.userWallet.update({
      where: { user_id: withdrawal.editor },
      data: {
        total_withdrawn: { increment: withdrawal.amount }
      }
    });
  }

  await withdrawal.save();

  res.json({
    success: true,
    message: `Withdrawal status updated from ${prevStatus} to ${status}`,
    withdrawal
  });
});

/**
 * Get withdrawal statistics for dashboard
 * GET /api/admin/withdrawals/stats
 */
export const getWithdrawalStats = asyncHandler(async (req, res) => {
  const stats = await WithdrawalRequest.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" }
      }
    }
  ]);

  const formattedStats = {
    pending: { count: 0, amount: 0 },
    processing: { count: 0, amount: 0 },
    completed: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 }
  };

  stats.forEach(s => {
    if (formattedStats[s._id]) {
      formattedStats[s._id] = { count: s.count, amount: s.totalAmount };
    }
  });

  res.json({
    success: true,
    stats: formattedStats
  });
});

export default {
  getAllWithdrawals,
  getWithdrawalById,
  updateWithdrawalStatus,
  getWithdrawalStats
};
