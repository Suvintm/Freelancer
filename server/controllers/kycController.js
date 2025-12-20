/**
 * KYC Controller
 * Handles Editor KYC submission and status
 */

import User from "../models/User.js";
import KYCLog from "../models/KYCLog.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
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
      address: user.bankDetails.address,
      gstin: user.bankDetails.gstin,
    } : null,
  });
});

/**
 * Submit KYC Details
 * POST /api/profile/submit-kyc
 */
export const submitKYC = asyncHandler(async (req, res) => {
  const { 
    accountHolderName, accountNumber, ifscCode, panNumber, bankName,
    street, city, state, postalCode, country, gstin 
  } = req.body;

  // STRICT DEBUG: Return body if street is missing
  if (!street) {
      return res.status(400).json({ 
          success: false, 
          message: "DEBUG: Street is missing", 
          debugBody: req.body,
          debugFiles: req.files ? Object.keys(req.files) : "No files"
      });
  }

  console.log("KYC SUBMISSION RECEIVED:", {
      body: req.body,
      files: req.files
  });

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

  // Process Document Uploads
  const newDocuments = [];
  if (req.files) {
    const processUpload = async (files, typeCode) => {
      if (files && files.length > 0) {
        const file = files[0];
        const result = await uploadToCloudinary(file.buffer, "kyc-documents");
        return {
          type: typeCode,
          url: result.url,
          uploadedAt: new Date()
        };
      }
      return null;
    };

    if (req.files['id_proof']) {
      const doc = await processUpload(req.files['id_proof'], 'id_proof');
      if (doc) newDocuments.push(doc);
    }
    if (req.files['bank_proof']) {
      const doc = await processUpload(req.files['bank_proof'], 'bank_proof');
      if (doc) newDocuments.push(doc);
    }
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
      gstin,
      address: { street, city, state, postalCode, country: country || "IN" }
    };
    if (newDocuments.length > 0) user.kycDocuments = newDocuments;
    user.kycStatus = "verified"; // Auto-verified via Razorpay
    user.isVerified = true; // Mark as verified for explore page
    user.kycSubmittedAt = new Date();
    user.kycVerifiedAt = new Date();

    // Recalculate profile completion
    user.profileCompletionPercent = calculateProfileCompletion(user);

    await user.save();
    
    // Audit Log (Auto verified)
    await KYCLog.create({
      user: userId,
      userRole: "editor",
      performedBy: { userId: userId, role: "system" },
      action: "auto_verified",
      reason: "Razorpay automated verification",
      metadata: { ip: req.ip, userAgent: req.headers["user-agent"] }
    });

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
      gstin,
      address: { street, city, state, postalCode, country: country || "IN" }
    };
    if (newDocuments.length > 0) user.kycDocuments = newDocuments;
    user.kycStatus = "submitted"; // Pending manual verification
    user.kycSubmittedAt = new Date();
    user.profileCompletionPercent = calculateProfileCompletion(user);

    await user.save();
    
    // Audit Log (Manual Submission)
    await KYCLog.create({
      user: userId,
      userRole: "editor",
      performedBy: { userId: userId, role: "user" },
      action: "submitted",
      metadata: { ip: req.ip, userAgent: req.headers["user-agent"], razorpayError: error.message }
    });

    return res.status(200).json({
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

/**
 * Lookup IFSC Code (Proxy to avoid CORS)
 * GET /api/profile/lookup-ifsc/:ifsc
 */
export const lookupIFSC = asyncHandler(async (req, res) => {
  const { ifsc } = req.params;
  
  if (!ifsc || ifsc.length !== 11) {
    throw new ApiError(400, "Invalid IFSC code");
  }
  
  try {
    const response = await fetch(`https://ifsc.razorpay.com/${ifsc.toUpperCase()}`);
    
    if (!response.ok) {
      throw new ApiError(404, "IFSC code not found");
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      bank: data.BANK,
      branch: data.BRANCH,
      city: data.CITY,
      state: data.STATE,
      address: data.ADDRESS,
    });
  } catch (error) {
    if (error.statusCode === 404) throw error;
    throw new ApiError(404, "Could not verify IFSC code");
  }
});

/**
 * Admin: Verify KYC (Manual verification)
 * POST /api/profile/verify-kyc/:userId
 */
export const verifyKYC = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { approve, rejectionReason } = req.body;
  
  // Check if requester is admin (Handled by protectAdmin middleware)
  /* if (req.user.role !== 'admin') {
    throw new ApiError(403, "Only admins can verify KYC");
  } */
  
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  if (approve) {
    user.kycStatus = "verified";
    user.kycVerifiedAt = new Date();
    user.kycRejectionReason = null;
  } else {
    user.kycStatus = "rejected";
    user.kycRejectionReason = rejectionReason || "Documents could not be verified";
  }
  
  user.profileCompletionPercent = calculateProfileCompletion(user);
  await user.save();

  // Audit Log
  await KYCLog.create({
    user: userId,
    userRole: "editor",
    performedBy: { adminId: req.admin._id, role: "admin" },
    action: approve ? "verified" : "rejected",
    reason: rejectionReason,
  });
  
  res.json({
    success: true,
    message: approve ? "KYC verified successfully" : "KYC rejected",
    kycStatus: user.kycStatus,
  });
});

export default {
  getKYCStatus,
  submitKYC,
  lookupIFSC,
  verifyKYC,
};

