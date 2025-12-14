/**
 * Admin Payment Settings Controller
 * Manage platform fees, payout settings, and refund policy
 */

import { SiteSettings } from "../models/SiteSettings.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";

/**
 * Get payment settings for admin dashboard
 */
export const getPaymentSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();

  res.json({
    success: true,
    settings: {
      razorpayEnabled: settings.razorpayEnabled,
      stripeEnabled: settings.stripeEnabled,
      platformFee: settings.platformFee,
      minPayoutAmount: settings.minPayoutAmount,
      payoutFrequency: settings.payoutFrequency,
      baseCurrency: settings.baseCurrency,
      supportedCountries: settings.supportedCountries,
      internationalEnabled: settings.internationalEnabled,
      internationalWaitlistEnabled: settings.internationalWaitlistEnabled,
      refundPolicy: settings.refundPolicy,
    },
  });
});

/**
 * Update payment settings
 */
export const updatePaymentSettings = asyncHandler(async (req, res) => {
  const {
    razorpayEnabled,
    stripeEnabled,
    platformFee,
    minPayoutAmount,
    payoutFrequency,
    internationalEnabled,
    internationalWaitlistEnabled,
    refundPolicy,
  } = req.body;

  const settings = await SiteSettings.getSettings();

  // Validate platform fee (0-50%)
  if (platformFee !== undefined) {
    if (platformFee < 0 || platformFee > 50) {
      throw new ApiError(400, "Platform fee must be between 0% and 50%");
    }
    settings.platformFee = platformFee;
  }

  // Validate min payout amount
  if (minPayoutAmount !== undefined) {
    if (minPayoutAmount < 0) {
      throw new ApiError(400, "Minimum payout amount cannot be negative");
    }
    settings.minPayoutAmount = minPayoutAmount;
  }

  // Update other settings
  if (razorpayEnabled !== undefined) settings.razorpayEnabled = razorpayEnabled;
  if (stripeEnabled !== undefined) settings.stripeEnabled = stripeEnabled;
  if (payoutFrequency !== undefined) settings.payoutFrequency = payoutFrequency;
  if (internationalEnabled !== undefined) settings.internationalEnabled = internationalEnabled;
  if (internationalWaitlistEnabled !== undefined) settings.internationalWaitlistEnabled = internationalWaitlistEnabled;

  // Update refund policy
  if (refundPolicy) {
    settings.refundPolicy = {
      ...settings.refundPolicy,
      ...refundPolicy,
    };
  }

  await settings.save();

  res.json({
    success: true,
    message: "Payment settings updated successfully",
    settings: {
      platformFee: settings.platformFee,
      minPayoutAmount: settings.minPayoutAmount,
      razorpayEnabled: settings.razorpayEnabled,
      stripeEnabled: settings.stripeEnabled,
      refundPolicy: settings.refundPolicy,
    },
  });
});

/**
 * Get payment analytics for admin dashboard
 */
export const getPaymentAnalytics = asyncHandler(async (req, res) => {
  const { Order } = await import("../models/Order.js");
  const { period = "30" } = req.query;
  
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // Aggregate payment stats
  const stats = await Order.aggregate([
    {
      $match: {
        paymentStatus: { $in: ["escrow", "released", "refunded"] },
        createdAt: { $gte: daysAgo },
      },
    },
    {
      $group: {
        _id: "$paymentStatus",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        totalFees: { $sum: "$platformFee" },
      },
    },
  ]);

  // Format for frontend
  const analytics = {
    totalTransactions: 0,
    totalVolume: 0,
    totalFees: 0,
    inEscrow: { count: 0, amount: 0 },
    released: { count: 0, amount: 0 },
    refunded: { count: 0, amount: 0 },
  };

  stats.forEach((stat) => {
    analytics.totalTransactions += stat.count;
    analytics.totalVolume += stat.totalAmount;
    analytics.totalFees += stat.totalFees || 0;

    if (stat._id === "escrow") {
      analytics.inEscrow = { count: stat.count, amount: stat.totalAmount };
    } else if (stat._id === "released") {
      analytics.released = { count: stat.count, amount: stat.totalAmount };
    } else if (stat._id === "refunded") {
      analytics.refunded = { count: stat.count, amount: stat.totalAmount };
    }
  });

  res.json({
    success: true,
    period: `${period} days`,
    analytics,
  });
});

export default {
  getPaymentSettings,
  updatePaymentSettings,
  getPaymentAnalytics,
};
