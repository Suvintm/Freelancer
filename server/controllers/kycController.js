/**
 * KYC Controller
 * Handles Editor KYC submission and status
 */

import User from "../models/User.js";
import { RazorpayProvider } from "../services/RazorpayProvider.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";

/**
 * Get KYC Status
 * GET /api/profile/kyc-status
 */
export const getKYCStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+bankDetails.accountNumber');
  
  res.json({
    success: true,
    kycStatus: user.kycStatus,
    kycSubmittedAt: user.kycSubmittedAt,
    kycVerifiedAt: user.kycVerifiedAt,
    kycRejectionReason: user.kycRejectionReason,
    bankDetails: user.bankDetails ? {
      accountHolderName: user.bankDetails.accountHolderName,
      bankName: user.bankDetails.bankName,
      ifscCode: user.bankDetails.ifscCode,
      accountNumber: user.bankDetails.accountNumber 
        ? '••••••' + user.bankDetails.accountNumber.slice(-4) 
        : null,
    } : null,
  });
});

/**
 * Submit KYC Details
 * POST /api/profile/submit-kyc
 */
export const submitKYC = asyncHandler(async (req, res) => {
  const { accountHolderName, accountNumber, ifscCode, panNumber, bankName } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (!accountHolderName || !accountNumber || !ifscCode || !panNumber) {
    throw new ApiError(400, "All fields are required");
  }

  // Validate IFSC format
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(ifscCode.toUpperCase())) {
    throw new ApiError(400, "Invalid IFSC code format");
  }

  // Validate PAN format
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  if (!panRegex.test(panNumber.toUpperCase())) {
    throw new ApiError(400, "Invalid PAN number format");
  }

  // Validate account number
  if (!/^\d{9,18}$/.test(accountNumber)) {
    throw new ApiError(400, "Invalid account number (9-18 digits required)");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Only allow editors to submit KYC
  if (user.role !== "editor") {
    throw new ApiError(403, "Only editors can submit KYC");
  }

  // Check if already verified
  if (user.kycStatus === "verified") {
    throw new ApiError(400, "KYC already verified");
  }

  try {
    // Create Razorpay contact if not exists
    let contactId = user.razorpayContactId;
    if (!contactId) {
      const provider = new RazorpayProvider();
      const contactResult = await provider.createContact({
        name: accountHolderName,
        email: user.email,
        phone: user.phone,
        _id: user._id,
      });
      contactId = contactResult.contactId;
    }

    // Create fund account (link bank)
    const provider = new RazorpayProvider();
    const fundAccountResult = await provider.createFundAccount(contactId, {
      accountHolderName,
      accountNumber,
      ifscCode,
    });

    // Update user with KYC details
    user.razorpayContactId = contactId;
    user.razorpayFundAccountId = fundAccountResult.fundAccountId;
    user.bankDetails = {
      accountHolderName,
      accountNumber, // Will be encrypted by model if configured
      ifscCode: ifscCode.toUpperCase(),
      bankName,
      panNumber: panNumber.toUpperCase(),
    };
    user.kycStatus = "verified"; // Auto-verified via Razorpay
    user.kycSubmittedAt = new Date();
    user.kycVerifiedAt = new Date();

    // Recalculate profile completion
    user.profileCompletionPercent = calculateProfileCompletion(user);

    await user.save();

    res.json({
      success: true,
      message: "KYC submitted and verified successfully",
      kycStatus: user.kycStatus,
      profileCompletion: user.profileCompletionPercent,
    });

  } catch (error) {
    // If Razorpay fails, still save as submitted for manual verification
    console.error("Razorpay KYC error:", error);

    user.bankDetails = {
      accountHolderName,
      accountNumber,
      ifscCode: ifscCode.toUpperCase(),
      bankName,
      panNumber: panNumber.toUpperCase(),
    };
    user.kycStatus = "submitted"; // Pending manual verification
    user.kycSubmittedAt = new Date();
    user.profileCompletionPercent = calculateProfileCompletion(user);

    await user.save();

    res.json({
      success: true,
      message: "KYC submitted for verification",
      kycStatus: user.kycStatus,
      profileCompletion: user.profileCompletionPercent,
    });
  }
});

/**
 * Calculate profile completion percentage
 */
function calculateProfileCompletion(user) {
  let completion = 0;
  const weights = {
    basicInfo: 20,
    skills: 15,
    portfolio: 20,
    gig: 15,
    kyc: 30,
  };

  // Basic info (name, bio, profile picture)
  if (user.name && user.profilePicture) {
    completion += weights.basicInfo * 0.6;
  }
  if (user.bio) {
    completion += weights.basicInfo * 0.4;
  }

  // Skills
  if (user.skills && user.skills.length >= 3) {
    completion += weights.skills;
  } else if (user.skills && user.skills.length > 0) {
    completion += weights.skills * 0.5;
  }

  // KYC
  if (user.kycStatus === "verified") {
    completion += weights.kyc;
  } else if (user.kycStatus === "submitted") {
    completion += weights.kyc * 0.5;
  }

  return Math.round(completion);
}

export default {
  getKYCStatus,
  submitKYC,
};
