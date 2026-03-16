import WithdrawalRequest from "../models/WithdrawalRequest.js";
import WalletTransaction from "../models/WalletTransaction.js";
import User from "../models/User.js";
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

  // If search is provided, look for editor name or email
  if (search) {
    const editors = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    }).select("_id");
    
    query.editor = { $in: editors.map(e => e._id) };
  }

  const withdrawals = await WithdrawalRequest.find(query)
    .populate("editor", "name email profilePicture walletBalance kycStatus")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await WithdrawalRequest.countDocuments(query);

  res.json({
    success: true,
    withdrawals,
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
  const withdrawal = await WithdrawalRequest.findById(req.params.id)
    .populate("editor", "name email profilePicture walletBalance bankDetails kycStatus");

  if (!withdrawal) {
    throw new ApiError(404, "Withdrawal request not found");
  }

  // Also fetch related transactions for audit trail
  const transaction = await WalletTransaction.findOne({ withdrawal: withdrawal._id });

  res.json({
    success: true,
    withdrawal,
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
    
    // IF FAILED: Credit money back to editor's wallet
    const editor = await User.findById(withdrawal.editor);
    if (editor) {
      editor.walletBalance += withdrawal.amount;
      await editor.save();

      // Create a reversal/failed transaction log
      await WalletTransaction.create({
        user: editor._id,
        type: "adjustment",
        amount: withdrawal.amount,
        status: "cleared",
        withdrawal: withdrawal._id,
        balanceBefore: editor.walletBalance - withdrawal.amount,
        balanceAfter: editor.walletBalance,
        description: `Wallet credit: Withdrawal #${withdrawal._id.toString().slice(-6)} failed/rejected.`,
        initiatedBy: "admin",
        adminNote: adminNote || failureReason
      });
    }
  } else if (status === "completed") {
    withdrawal.completedAt = new Date();
    withdrawal.processedAt = withdrawal.processedAt || new Date();
    
    // Update WalletTransaction status if it exists
    await WalletTransaction.findOneAndUpdate(
      { withdrawal: withdrawal._id },
      { status: "cleared", clearedAt: new Date() }
    );

    // Increment editor's totalWithdrawn
    await User.findByIdAndUpdate(withdrawal.editor, {
      $inc: { totalWithdrawn: withdrawal.amount }
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
