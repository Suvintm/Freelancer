/**
 * Payment Service - Abstract Payment Gateway Layer
 * 
 * This service provides a unified interface for payment operations,
 * abstracting the underlying payment gateway (Razorpay or Stripe).
 * This allows easy addition of new payment gateways without changing business logic.
 */

import { SiteSettings } from "../models/SiteSettings.js";
import { RazorpayProvider } from "./RazorpayProvider.js";
// import { StripeProvider } from "./StripeProvider.js"; // Future

/**
 * Currency configuration based on country
 */
const COUNTRY_CURRENCY_MAP = {
  IN: { currency: "INR", symbol: "₹", gateway: "razorpay" },
  US: { currency: "USD", symbol: "$", gateway: "stripe" },
  GB: { currency: "GBP", symbol: "£", gateway: "stripe" },
  CA: { currency: "CAD", symbol: "C$", gateway: "stripe" },
  AU: { currency: "AUD", symbol: "A$", gateway: "stripe" },
  EU: { currency: "EUR", symbol: "€", gateway: "stripe" },
  // Add more countries as needed
};

/**
 * Get gateway provider based on user's country
 */
const getProvider = async (country) => {
  const settings = await SiteSettings.getSettings();
  const countryConfig = COUNTRY_CURRENCY_MAP[country] || COUNTRY_CURRENCY_MAP["IN"];
  
  if (countryConfig.gateway === "razorpay" && settings.razorpayEnabled) {
    return new RazorpayProvider();
  }
  
  // Future: Stripe for international
  // if (countryConfig.gateway === "stripe" && settings.stripeEnabled) {
  //   return new StripeProvider();
  // }
  
  // Default to Razorpay for India
  if (country === "IN" && settings.razorpayEnabled) {
    return new RazorpayProvider();
  }
  
  return null;
};

/**
 * Check if payment is supported for a country
 */
export const isPaymentSupported = async (country) => {
  const settings = await SiteSettings.getSettings();
  
  // Currently only India is supported
  if (country === "IN" && settings.razorpayEnabled) {
    return { supported: true, gateway: "razorpay" };
  }
  
  // Future international support
  if (settings.internationalEnabled && settings.stripeEnabled) {
    return { supported: true, gateway: "stripe" };
  }
  
  return { 
    supported: false, 
    message: "Payments are currently available for India only. International payments coming soon!",
    waitlistEnabled: settings.internationalWaitlistEnabled
  };
};

/**
 * Get currency info for a country
 */
export const getCurrencyInfo = (country) => {
  return COUNTRY_CURRENCY_MAP[country] || { currency: "INR", symbol: "₹", gateway: "razorpay" };
};

/**
 * Convert amount between currencies
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  
  const settings = await SiteSettings.getSettings();
  const rates = settings.exchangeRates || {};
  
  // Convert to INR first (base currency), then to target
  let inrAmount = amount;
  if (fromCurrency !== "INR" && rates[fromCurrency]) {
    inrAmount = amount * rates[fromCurrency];
  }
  
  if (toCurrency === "INR") return inrAmount;
  
  if (rates[toCurrency]) {
    return inrAmount / rates[toCurrency];
  }
  
  return inrAmount; // Default to INR if rate not found
};

/**
 * Create a payment order
 */
export const createPaymentOrder = async (orderData, user) => {
  const provider = await getProvider(user.country);
  
  if (!provider) {
    throw new Error("Payment gateway not available for your region");
  }
  
  return await provider.createOrder(orderData);
};

/**
 * Verify payment after completion
 */
export const verifyPayment = async (paymentData, user) => {
  const provider = await getProvider(user.country);
  
  if (!provider) {
    throw new Error("Payment gateway not available for your region");
  }
  
  return await provider.verifyPayment(paymentData);
};

/**
 * Process refund
 */
export const processRefund = async (paymentId, amount, user) => {
  const provider = await getProvider(user.country);
  
  if (!provider) {
    throw new Error("Payment gateway not available for your region");
  }
  
  return await provider.processRefund(paymentId, amount);
};

/**
 * Create payout to editor
 */
export const createPayout = async (editor, amount) => {
  const provider = await getProvider(editor.country);
  
  if (!provider) {
    throw new Error("Payout gateway not available for editor's region");
  }
  
  return await provider.createPayout(editor, amount);
};

/**
 * Get platform fee for an amount
 */
export const calculatePlatformFee = async (amount) => {
  const settings = await SiteSettings.getSettings();
  const feePercent = settings.platformFee || 10;
  
  const platformFee = Math.round(amount * (feePercent / 100));
  const editorAmount = amount - platformFee;
  
  return {
    totalAmount: amount,
    platformFee,
    platformFeePercent: feePercent,
    editorAmount,
  };
};

/**
 * Get refund amount based on order stage
 */
export const calculateRefundAmount = async (order) => {
  const settings = await SiteSettings.getSettings();
  const policy = settings.refundPolicy || {};
  
  let refundPercent = 0;
  let stage = "unknown";
  
  if (order.status === "pending" || !order.acceptedByEditor) {
    refundPercent = policy.beforeAcceptedPercent || 100;
    stage = "before_accepted";
  } else if (order.status === "accepted" && order.progressPercent === 0) {
    refundPercent = policy.afterAcceptedNoWorkPercent || 100;
    stage = "accepted_no_work";
  } else if (order.progressPercent < 50) {
    refundPercent = policy.workInProgressLowPercent || 75;
    stage = "work_in_progress_low";
  } else if (order.progressPercent >= 50 && order.status !== "completed") {
    refundPercent = policy.workInProgressHighPercent || 50;
    stage = "work_in_progress_high";
  } else {
    refundPercent = policy.afterDeliveryPercent || 0;
    stage = "after_delivery";
  }
  
  const refundAmount = Math.round(order.amount * (refundPercent / 100));
  
  return {
    originalAmount: order.amount,
    refundPercent,
    refundAmount,
    stage,
  };
};

export default {
  isPaymentSupported,
  getCurrencyInfo,
  convertCurrency,
  createPaymentOrder,
  verifyPayment,
  processRefund,
  createPayout,
  calculatePlatformFee,
  calculateRefundAmount,
};
