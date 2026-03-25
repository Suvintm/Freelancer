import asyncHandler from "express-async-handler";
import User from "../../user/models/User.js";
import WithdrawalRequest from "../models/WithdrawalRequest.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { ApiError } from "../../../middleware/errorHandler.js";
import mongoose from "mongoose";

/**
 * @desc    Request a withdrawal
 * @route   POST /api/withdrawals/request
 * @access  Private (Editor)
 */
export const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const userId = req.user._id;

  if (!amount || amount < 100) {
    throw new ApiError(400, "Minimum withdrawal amount is ₹100");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId)
      .select('+bankDetails.accountNumber')
      .session(session);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // 1. Check KYC Status
    if (user.kycStatus !== "verified") {
      throw new ApiError(403, "KYC must be verified before withdrawal. Please complete your profile KYC.");
    }

    // 2. Check Available Balance
    if (user.walletBalance < amount) {
      throw new ApiError(400, "Insufficient wallet balance");
    }

    // 3. Deduction (Atomic)
    const balanceBefore = user.walletBalance;
    user.walletBalance -= amount;
    user.totalWithdrawn += amount;
    await user.save({ session });

    // 4. Create Withdrawal Request (Pending Admin/Razorpay)
    const withdrawal = await WithdrawalRequest.create([{
      editor: userId,
      amount,
      status: "pending",
      bankSnapshot: {
        accountHolderName: user.bankDetails?.accountHolderName,
        bankName: user.bankDetails?.bankName,
        ifscCode: user.bankDetails?.ifscCode,
        accountNumberMasked: user.bankDetails?.accountNumber 
          ? `XXXX${user.bankDetails.accountNumber.toString().slice(-4)}` 
          : "NOT_SET",
      },
      kycVerifiedAt: user.kycVerifiedAt,
      verificationMethod: user.verificationMethod,
    }], { session });

    // 5. Create Wallet Transaction log
    await WalletTransaction.create([{
      user: userId,
      type: "withdrawal",
      amount: -amount, // Negative for withdrawal
      status: "withdrawn",
      withdrawal: withdrawal[0]._id,
      balanceBefore,
      balanceAfter: user.walletBalance,
      description: `Withdrawal request for ₹${amount}`,
      initiatedBy: "user",
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      withdrawal: withdrawal[0]
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

/**
 * @desc    Get user's withdrawal requests
 * @route   GET /api/withdrawals/my
 * @access  Private (Editor)
 */
export const getMyWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await WithdrawalRequest.find({ editor: req.user._id })
    .sort({ createdAt: -1 });

  res.json({ success: true, withdrawals });
});

/**
 * @desc    Get withdrawal details
 * @route   GET /api/withdrawals/:id
 * @access  Private (Editor/Admin)
 */
export const getWithdrawalDetails = asyncHandler(async (req, res) => {
  const withdrawal = await WithdrawalRequest.findById(req.params.id)
    .populate("editor", "name email");

  if (!withdrawal) {
    throw new ApiError(404, "Withdrawal request not found");
  }

  // Only the editor who requested or an admin can view
  if (req.user.role !== "admin" && withdrawal.editor._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  res.json({ success: true, withdrawal });
});
