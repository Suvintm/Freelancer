// clientKYCController.js - Hybrid (PostgreSQL User + MongoDB KYC)
import asyncHandler from "express-async-handler";
import ClientKYC from "../models/ClientKYC.js";
import prisma from "../../../config/prisma.js";
import KYCLog from "../models/KYCLog.js";
import { ApiError } from "../../../middleware/errorHandler.js";
import logger from "../../../utils/logger.js";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";

/**
 * Submit Client KYC
 */
export const submitKYC = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (req.user.role !== "client") throw new ApiError(403, "Only clients can submit KYC");

  let kyc = await ClientKYC.findOne({ user: userId });

  const {
    fullName, phone, email, bankAccountNumber, ifscCode, bankName,
    accountHolderName, accountType, upiId, panNumber, preferredRefundMethod,
    termsAccepted, street, city, state, postalCode, country, gstin
  } = req.body;

  // Process Document Uploads
  const newDocuments = [];
  if (req.files) {
    const processUpload = async (files, typeCode) => {
      if (files && files.length > 0) {
        const result = await uploadToCloudinary(files[0].buffer, "kyc-documents");
        return { type: typeCode, url: result.url, uploadedAt: new Date() };
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

  if (!fullName || !phone) throw new ApiError(400, "Full name and phone number are required");
  if (!termsAccepted) throw new ApiError(400, "You must accept the terms");

  if (kyc) {
    // Update existing (MongoDB)
    kyc.fullName = fullName;
    kyc.phone = phone;
    kyc.email = email || req.user.email;
    kyc.bankAccountNumber = bankAccountNumber;
    kyc.ifscCode = ifscCode;
    kyc.bankName = bankName;
    kyc.accountHolderName = accountHolderName;
    kyc.upiId = upiId;
    kyc.panNumber = panNumber;
    kyc.preferredRefundMethod = preferredRefundMethod || "original_payment";
    kyc.address = { street, city, state, postalCode, country: country || "IN" };
    kyc.gstin = gstin;
    kyc.status = "pending";
    kyc.rejectionReason = null;
    
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
    // Create new (MongoDB)
    kyc = new ClientKYC({
      user: userId, fullName, phone, email: email || req.user.email,
      bankAccountNumber, ifscCode, bankName, accountHolderName,
      accountType: accountType || "savings", upiId, panNumber,
      preferredRefundMethod: preferredRefundMethod || "original_payment",
      termsAccepted, address: { street, city, state, postalCode, country: country || "IN" },
      gstin, termsAcceptedAt: new Date(), status: "pending",
      ipAddress: req.ip, userAgent: req.headers["user-agent"],
      documents: newDocuments,
    });
  }

  await kyc.save();

  // Update user's KYC status (PostgreSQL)
  await prisma.user.update({
    where: { id: userId },
    data: { kyc_status: "pending" }
  });

  // Audit Log (MongoDB)
  await KYCLog.create({
    user: userId, userRole: "client",
    performedBy: { userId: userId, role: "user" },
    action: "submitted",
    metadata: { ip: req.ip, userAgent: req.headers["user-agent"] }
  });

  res.status(201).json({
    success: true,
    message: "KYC submitted successfully.",
    kyc: { status: kyc.status, submittedAt: kyc.submittedAt, displayAccountInfo: kyc.displayAccountInfo }
  });
});

/**
 * Get My KYC Status
 */
export const getMyKYC = asyncHandler(async (req, res) => {
  const kyc = await ClientKYC.findOne({ user: req.user.id });
  if (!kyc) {
    return res.json({ success: true, kycExists: false, status: "not_started" });
  }

  res.json({
    success: true,
    kycExists: true,
    status: kyc.status,
    kyc: {
      fullName: kyc.fullName, phone: kyc.phone, email: kyc.email,
      displayAccountInfo: kyc.displayAccountInfo,
      preferredRefundMethod: kyc.preferredRefundMethod,
      status: kyc.status, submittedAt: kyc.submittedAt,
      verifiedAt: kyc.verifiedAt, rejectionReason: kyc.rejectionReason,
      panNumberMasked: kyc.panNumberMasked,
    },
  });
});

/**
 * Update KYC Details
 */
export const updateKYC = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const kyc = await ClientKYC.findOne({ user: userId });
  if (!kyc) throw new ApiError(404, "KYC not found");

  if (kyc.status === "verified") {
    const { preferredRefundMethod } = req.body;
    if (preferredRefundMethod) {
      kyc.preferredRefundMethod = preferredRefundMethod;
      await kyc.save();
      return res.json({ success: true, message: "Refund method updated", kyc: { preferredRefundMethod: kyc.preferredRefundMethod } });
    }
    throw new ApiError(400, "Verified KYC cannot be modified");
  }

  const allowedFields = ["fullName", "phone", "bankAccountNumber", "ifscCode", "bankName", "accountHolderName", "accountType", "upiId", "panNumber", "preferredRefundMethod", "gstin" ];
  allowedFields.forEach(field => { if (req.body[field] !== undefined) kyc[field] = req.body[field]; });

  const addressFields = ["street", "city", "state", "postalCode", "country"];
  if (addressFields.some(f => req.body[f] !== undefined)) {
    if (!kyc.address) kyc.address = {};
    addressFields.forEach(f => { if (req.body[f] !== undefined) kyc.address[f] = req.body[f]; });
  }

  if (kyc.status === "rejected") {
    kyc.status = "pending";
    kyc.rejectionReason = null;
  }

  await kyc.save();

  // Update user status (PostgreSQL)
  await prisma.user.update({
    where: { id: userId },
    data: { kyc_status: kyc.status }
  });

  // Audit Log
  await KYCLog.create({
    user: userId, userRole: "client",
    performedBy: { userId: userId, role: "user" },
    action: kyc.status === "pending" ? "re_submitted" : "details_updated",
    metadata: { ip: req.ip, userAgent: req.headers["user-agent"], newStatus: kyc.status }
  });

  res.json({ success: true, message: "KYC updated", kyc: { status: kyc.status, displayAccountInfo: kyc.displayAccountInfo } });
});

/**
 * Check if client can proceed (KYC verified)
 */
export const canProceed = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { kyc_status: true }
  });
  
  const isVerified = user?.kyc_status === "verified";

  res.json({
    success: true,
    canProceed: isVerified,
    kycStatus: user?.kyc_status,
    message: isVerified ? "KYC verified." : "Please complete KYC verification.",
  });
});

export default { submitKYC, getMyKYC, updateKYC, canProceed };
