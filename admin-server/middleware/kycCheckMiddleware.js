// kycCheckMiddleware.js - Middleware to verify client KYC before sensitive operations
import prisma from "../config/prisma.js";
import { ApiError } from "./errorHandler.js";

/**
 * Middleware to check if client has verified KYC
 * Use this before order creation, payment, and request submission
 */
export const requireClientKYC = async (req, res, next) => {
  try {
    // Skip for non-clients (editors don't need client KYC)
    if (req.user.role !== "client") {
      return next();
    }

    // Get fresh user data with KYC status from PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: req.user.id || req.user._id },
      select: {
        kyc_status: true,
        role: true
      }
    });

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Map Prisma kyc_status to expected clientKycStatus
    const kycStatus = user.kyc_status;

    // Check if KYC is verified
    if (kycStatus !== "verified") {
      return res.status(403).json({
        success: false,
        kycRequired: true,
        kycStatus: kycStatus,
        message: getKYCMessage(kycStatus),
        redirectTo: "/client-kyc",
      });
    }

    next();
  } catch (err) {
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * Soft check - doesn't block, just adds kycVerified flag to request
 */
export const checkClientKYC = async (req, res, next) => {
  try {
    if (req.user.role !== "client") {
      req.kycVerified = true;
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id || req.user._id },
      include: {
        wallet: true
      }
    });
    
    req.kycVerified = user?.kyc_status === "verified";
    req.kycStatus = user?.kyc_status || "not_started";
    req.walletBalance = user?.wallet?.wallet_balance || 0;

    next();
  } catch (err) {
    req.kycVerified = false;
    next();
  }
};

/**
 * Get user-friendly KYC message based on status
 */
const getKYCMessage = (status) => {
  switch (status) {
    case "not_started":
      return "Please complete KYC verification to proceed with orders. This helps us process refunds securely.";
    case "pending":
      return "Your KYC verification is pending review. You'll be notified once approved.";
    case "under_review":
      return "Your KYC is under review. This usually takes 24-48 hours.";
    case "rejected":
      return "Your KYC was rejected. Please update your details and resubmit.";
    default:
      return "KYC verification required to proceed.";
  }
};

export default requireClientKYC;
