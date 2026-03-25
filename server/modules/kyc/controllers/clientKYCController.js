// clientKYCController.js - Client KYC verification controller
import asyncHandler from "express-async-handler";
import ClientKYC from "../models/ClientKYC.js";
import User from "../../user/models/User.js";
import KYCLog from "../models/KYCLog.js";
import { ApiError } from "../../../../middleware/errorHandler.js";
import logger from "../../../../utils/logger.js";
import { uploadToCloudinary } from "../../../../utils/uploadToCloudinary.js";

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
    // Address Fields
    street, city, state, postalCode, country,
    gstin
  } = req.body;

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
    kyc.panNumber = panNumber;
    kyc.preferredRefundMethod = preferredRefundMethod || "original_payment";
    
    // Update Address & GSTIN
    kyc.address = { 
      street, city, state, postalCode, 
      country: country || "IN" 
    };
    kyc.gstin = gstin;
    kyc.termsAccepted = termsAccepted;
    kyc.termsAcceptedAt = new Date();
    kyc.status = "pending";
    kyc.ipAddress = req.ip;
    kyc.userAgent = req.headers["user-agent"];
    kyc.rejectionReason = null; // Clear any previous rejection
    
    // Update documents if provided
    if (newDocuments.length > 0) {
       const currentDocs = kyc.documents || [];
       newDocuments.forEach(newDoc => {
          const idx = currentDocs.findIndex(d => d.type === newDoc.type);
          if (idx > -1) currentDocs[idx] = newDoc;
          else currentDocs.push(newDoc);
       });
       kyc.documents = currentDocs;
    }
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
      // Address & GSTIN
      address: { 
        street, city, state, postalCode, 
        country: country || "IN" 
      },
      gstin,
      termsAcceptedAt: new Date(),
      status: "pending",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      documents: newDocuments,
    });
  }

  await kyc.save();

  // Update user's client KYC status
  await User.findByIdAndUpdate(userId, {
    kycStatus: "pending",
  });

  logger.info(`Client KYC submitted: ${userId}`);
  
  // Audit Log
  await KYCLog.create({
    user: userId,
    userRole: "client",
    performedBy: { userId: userId, role: "user" },
    action: "submitted",
    metadata: { ip: req.ip, userAgent: req.headers["user-agent"] }
  });

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
    "panNumber", "preferredRefundMethod", "gstin"
  ];

  // Handle address update separately or flatten allowed fields
  const addressFields = ["street", "city", "state", "postalCode", "country"];
  if (addressFields.some(f => req.body[f] !== undefined)) {
    if (!kyc.address) kyc.address = {};
    addressFields.forEach(f => {
      if (req.body[f] !== undefined) kyc.address[f] = req.body[f];
    });
  }

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
    kycStatus: kyc.status,
  });

  // Audit Log
  await KYCLog.create({
    user: userId,
    userRole: "client",
    performedBy: { userId: userId, role: "user" },
    action: kyc.status === "pending" ? "re_submitted" : "details_updated",
    metadata: { ip: req.ip, userAgent: req.headers["user-agent"], newStatus: kyc.status }
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
  const user = await User.findById(userId).select("kycStatus name");
  
  const isVerified = user.kycStatus === "verified";

  res.json({
    success: true,
    canProceed: isVerified,
    kycStatus: user.kycStatus,
    message: isVerified 
      ? "KYC verified. You can proceed." 
      : "Please complete KYC verification to continue.",
  });
});

// ADMIN ENDPOINTS MOVED TO ADMIN-SERVER


