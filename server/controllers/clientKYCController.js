// clientKYCController.js - Client KYC verification controller
import asyncHandler from "express-async-handler";
import ClientKYC from "../models/ClientKYC.js";
import User from "../models/User.js";
import { ApiError } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";

/**
 * @desc    Submit Client KYC
 * @route   POST /api/client-kyc
 * @access  Private (Client only)
 */
export const submitKYC = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Check if user is a client
  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can submit KYC");
  }

  // Check if KYC already exists
  let kyc = await ClientKYC.findOne({ user: userId });

  const {
    fullName,
    phone,
    email,
    bankAccountNumber,
    ifscCode,
    bankName,
    accountHolderName,
    accountType,
    upiId,
    panNumber,
    preferredRefundMethod,
    termsAccepted,
  } = req.body;

  // Validate required fields
  if (!fullName || !phone) {
    throw new ApiError(400, "Full name and phone number are required");
  }

  // Validate terms acceptance
  if (!termsAccepted) {
    throw new ApiError(400, "You must accept the terms and conditions");
  }

  // Validate refund method and corresponding details
  if (preferredRefundMethod === "bank_transfer") {
    if (!bankAccountNumber || !ifscCode || !accountHolderName) {
      throw new ApiError(400, "Bank account details are required for bank transfer refunds");
    }
  } else if (preferredRefundMethod === "upi") {
    if (!upiId) {
      throw new ApiError(400, "UPI ID is required for UPI refunds");
    }
  }

  if (kyc) {
    // Update existing KYC
    kyc.fullName = fullName;
    kyc.phone = phone;
    kyc.email = email || req.user.email;
    kyc.bankAccountNumber = bankAccountNumber;
    kyc.ifscCode = ifscCode;
    kyc.bankName = bankName;
    kyc.accountHolderName = accountHolderName;
    kyc.accountType = accountType || "savings";
    kyc.upiId = upiId;
    kyc.panNumber = panNumber;
    kyc.preferredRefundMethod = preferredRefundMethod || "original_payment";
    kyc.termsAccepted = termsAccepted;
    kyc.termsAcceptedAt = new Date();
    kyc.status = "pending";
    kyc.ipAddress = req.ip;
    kyc.userAgent = req.headers["user-agent"];
    kyc.rejectionReason = null; // Clear any previous rejection
  } else {
    // Create new KYC
    kyc = new ClientKYC({
      user: userId,
      fullName,
      phone,
      email: email || req.user.email,
      bankAccountNumber,
      ifscCode,
      bankName,
      accountHolderName,
      accountType: accountType || "savings",
      upiId,
      panNumber,
      preferredRefundMethod: preferredRefundMethod || "original_payment",
      termsAccepted,
      termsAcceptedAt: new Date(),
      status: "pending",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  await kyc.save();

  // Update user's client KYC status
  await User.findByIdAndUpdate(userId, {
    clientKycStatus: "pending",
  });

  logger.info(`Client KYC submitted: ${userId}`);

  res.status(201).json({
    success: true,
    message: "KYC submitted successfully. Verification usually takes 24-48 hours.",
    kyc: {
      status: kyc.status,
      submittedAt: kyc.submittedAt,
      displayAccountInfo: kyc.displayAccountInfo,
    },
  });
});

/**
 * @desc    Get My KYC Status
 * @route   GET /api/client-kyc/my
 * @access  Private (Client only)
 */
export const getMyKYC = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const kyc = await ClientKYC.findOne({ user: userId });

  if (!kyc) {
    return res.json({
      success: true,
      kycExists: false,
      status: "not_started",
      message: "KYC not yet submitted",
    });
  }

  res.json({
    success: true,
    kycExists: true,
    status: kyc.status,
    kyc: {
      fullName: kyc.fullName,
      phone: kyc.phone,
      email: kyc.email,
      displayAccountInfo: kyc.displayAccountInfo,
      preferredRefundMethod: kyc.preferredRefundMethod,
      status: kyc.status,
      submittedAt: kyc.submittedAt,
      verifiedAt: kyc.verifiedAt,
      rejectionReason: kyc.rejectionReason,
      panNumberMasked: kyc.panNumberMasked,
    },
  });
});

/**
 * @desc    Update KYC Details
 * @route   PUT /api/client-kyc/update
 * @access  Private (Client only)
 */
export const updateKYC = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const kyc = await ClientKYC.findOne({ user: userId });

  if (!kyc) {
    throw new ApiError(404, "KYC not found. Please submit KYC first.");
  }

  // Don't allow updates if verified (only refund method can be changed)
  if (kyc.status === "verified") {
    const { preferredRefundMethod } = req.body;
    
    if (preferredRefundMethod) {
      kyc.preferredRefundMethod = preferredRefundMethod;
      await kyc.save();
      
      return res.json({
        success: true,
        message: "Refund method updated",
        kyc: {
          preferredRefundMethod: kyc.preferredRefundMethod,
        },
      });
    }
    
    throw new ApiError(400, "Verified KYC cannot be modified. Contact support for changes.");
  }

  // Update fields
  const allowedFields = [
    "fullName", "phone", "bankAccountNumber", "ifscCode", 
    "bankName", "accountHolderName", "accountType", "upiId",
    "panNumber", "preferredRefundMethod"
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      kyc[field] = req.body[field];
    }
  });

  // Reset to pending if previously rejected
  if (kyc.status === "rejected") {
    kyc.status = "pending";
    kyc.rejectionReason = null;
  }

  await kyc.save();

  // Update user status
  await User.findByIdAndUpdate(userId, {
    clientKycStatus: kyc.status,
  });

  res.json({
    success: true,
    message: "KYC updated successfully",
    kyc: {
      status: kyc.status,
      displayAccountInfo: kyc.displayAccountInfo,
    },
  });
});

/**
 * @desc    Check if client can proceed (KYC verified)
 * @route   GET /api/client-kyc/can-proceed
 * @access  Private (Client only)
 */
export const canProceed = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get user's KYC status
  const user = await User.findById(userId).select("clientKycStatus name");
  
  const isVerified = user.clientKycStatus === "verified";

  res.json({
    success: true,
    canProceed: isVerified,
    kycStatus: user.clientKycStatus,
    message: isVerified 
      ? "KYC verified. You can proceed." 
      : "Please complete KYC verification to continue.",
  });
});

// ==================== ADMIN ENDPOINTS ====================

/**
 * @desc    Get Pending KYC Verifications (Admin)
 * @route   GET /api/client-kyc/admin/pending
 * @access  Private (Admin only)
 */
export const getPendingKYC = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const query = {};
  if (status) {
    query.status = status;
  } else {
    query.status = { $in: ["pending", "under_review"] };
  }

  const [kycList, total] = await Promise.all([
    ClientKYC.find(query)
      .populate("user", "name email profilePicture")
      .sort({ submittedAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(),
    ClientKYC.countDocuments(query),
  ]);

  res.json({
    success: true,
    kycList,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get KYC Details (Admin)
 * @route   GET /api/client-kyc/admin/:kycId
 * @access  Private (Admin only)
 */
export const getKYCDetails = asyncHandler(async (req, res) => {
  const { kycId } = req.params;

  const kyc = await ClientKYC.findById(kycId)
    .populate("user", "name email profilePicture createdAt")
    .populate("verifiedBy", "name email");

  if (!kyc) {
    throw new ApiError(404, "KYC not found");
  }

  res.json({
    success: true,
    kyc,
  });
});

/**
 * @desc    Verify/Reject KYC (Admin)
 * @route   POST /api/client-kyc/admin/verify/:kycId
 * @access  Private (Admin only)
 */
export const verifyKYC = asyncHandler(async (req, res) => {
  const { kycId } = req.params;
  const { action, rejectionReason } = req.body;
  const adminId = req.admin._id;

  if (!["approve", "reject"].includes(action)) {
    throw new ApiError(400, "Action must be 'approve' or 'reject'");
  }

  const kyc = await ClientKYC.findById(kycId);

  if (!kyc) {
    throw new ApiError(404, "KYC not found");
  }

  if (kyc.status === "verified") {
    throw new ApiError(400, "KYC is already verified");
  }

  if (action === "approve") {
    kyc.status = "verified";
    kyc.verifiedBy = adminId;
    kyc.verifiedAt = new Date();
    kyc.rejectionReason = null;

    // Update user's KYC status
    await User.findByIdAndUpdate(kyc.user, {
      clientKycStatus: "verified",
      clientKycVerifiedAt: new Date(),
    });

    logger.info(`Client KYC approved: ${kyc.user} by admin ${adminId}`);
  } else {
    if (!rejectionReason) {
      throw new ApiError(400, "Rejection reason is required");
    }

    kyc.status = "rejected";
    kyc.rejectionReason = rejectionReason;

    // Update user's KYC status
    await User.findByIdAndUpdate(kyc.user, {
      clientKycStatus: "rejected",
    });

    logger.info(`Client KYC rejected: ${kyc.user} by admin ${adminId}`);
  }

  await kyc.save();

  res.json({
    success: true,
    message: action === "approve" 
      ? "KYC verified successfully" 
      : "KYC rejected",
    kyc: {
      status: kyc.status,
      verifiedAt: kyc.verifiedAt,
      rejectionReason: kyc.rejectionReason,
    },
  });
});

/**
 * @desc    Get KYC Statistics (Admin)
 * @route   GET /api/client-kyc/admin/stats
 * @access  Private (Admin only)
 */
export const getKYCStats = asyncHandler(async (req, res) => {
  const stats = await ClientKYC.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const formattedStats = {
    total: 0,
    not_started: 0,
    pending: 0,
    under_review: 0,
    verified: 0,
    rejected: 0,
  };

  stats.forEach(s => {
    formattedStats[s._id] = s.count;
    formattedStats.total += s.count;
  });

  res.json({
    success: true,
    stats: formattedStats,
  });
});
