// kycCheckMiddleware.js - Middleware to verify client KYC before sensitive operations
import User from "../models/User.js";
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

    // Get fresh user data with KYC status
    const user = await User.findById(req.user._id).select("clientKycStatus");

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Check if KYC is verified
    if (user.clientKycStatus !== "verified") {
      return res.status(403).json({
        success: false,
        kycRequired: true,
        kycStatus: user.clientKycStatus,
        message: getKYCMessage(user.clientKycStatus),
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

    const user = await User.findById(req.user._id).select("clientKycStatus walletBalance");
    
    req.kycVerified = user?.clientKycStatus === "verified";
    req.kycStatus = user?.clientKycStatus || "not_started";
    req.walletBalance = user?.walletBalance || 0;

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
