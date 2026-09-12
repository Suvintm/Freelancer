/**
 * Subscription Controller (Node.js Gateway Proxy)
 * 
 * All subscription business logic, Zero-Trust checkout calculations,
 * promotional coupons, and entitlement evaluations are executed strictly
 * on the authoritative Java Spring Boot Payment Microservice (Port 8080).
 */

import { proxyToPaymentService } from "../../../infrastructure/gateway/javaPayment.client.js";
import { asyncHandler } from "../../../shared/middleware/error-handler.middleware.js";
import { invalidatePlanCache } from "../middleware/planCache.js";

export const getPlans = asyncHandler(async (req, res) => {
  if (!req.query.currency && req.user) {
    req.query.currency = req.user?.preferred_currency || (req.user?.location_country === 'India' ? 'INR' : 'USD');
  }
  return proxyToPaymentService(req, res, 'get', '/subscriptions/plans');
});

export const getPublicPricingSummary = asyncHandler(async (req, res) => {
  return proxyToPaymentService(req, res, 'get', '/subscriptions/public/pricing-summary');
});

export const getSubscriptionDashboard = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.query.userId;
  if (userId) req.query.userId = userId;
  if (!req.query.currency) {
    req.query.currency = req.user?.preferred_currency || (req.user?.location_country === 'India' ? 'INR' : 'USD');
  }
  return proxyToPaymentService(req, res, 'get', '/subscriptions/dashboard');
});

export const validateCoupon = asyncHandler(async (req, res) => {
  return proxyToPaymentService(req, res, 'post', '/subscriptions/coupon/validate');
});

export const getEntitlements = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.query.userId;
  req.query.userId = userId;
  return proxyToPaymentService(req, res, 'get', '/subscriptions/entitlements');
});

export const getMySubscriptions = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  req.query.userId = userId;
  return proxyToPaymentService(req, res, 'get', '/subscriptions/active');
});

export const checkSubscriptionStatus = asyncHandler(async (req, res) => {
  const feature = req.params.feature;
  req.query.feature = feature;
  req.query.userId = req.user?._id || req.user?.id;
  return proxyToPaymentService(req, res, 'get', '/subscriptions/check-feature');
});

export const createOrder = asyncHandler(async (req, res) => {
  return proxyToPaymentService(req, res, 'post', '/subscriptions/create-order');
});

export const verifyPayment = asyncHandler(async (req, res) => {
  return proxyToPaymentService(req, res, 'post', '/subscriptions/verify');
});

export const startTrial = asyncHandler(async (req, res) => {
  return proxyToPaymentService(req, res, 'post', '/subscriptions/create');
});

export const pauseSubscription = asyncHandler(async (req, res) => {
  return proxyToPaymentService(req, res, 'post', '/subscriptions/pause');
});

export const resumeSubscription = asyncHandler(async (req, res) => {
  return proxyToPaymentService(req, res, 'post', '/subscriptions/resume');
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  return proxyToPaymentService(req, res, 'post', '/subscriptions/cancel');
});

export const quoteUpgrade = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.query.userId;
  if (userId) req.query.userId = userId;
  return proxyToPaymentService(req, res, 'get', '/subscriptions/quote-upgrade');
});

export const upgradeSubscription = asyncHandler(async (req, res) => {
  return proxyToPaymentService(req, res, 'post', '/subscriptions/upgrade');
});

export const downgradeSubscription = asyncHandler(async (req, res) => {
  return proxyToPaymentService(req, res, 'post', '/subscriptions/downgrade');
});

export const getPaymentStatus = asyncHandler(async (req, res) => {
  return proxyToPaymentService(req, res, 'get', '/subscriptions/status');
});

export const upsertPlan = asyncHandler(async (req, res) => {
  await invalidatePlanCache();
  return proxyToPaymentService(req, res, 'post', '/subscriptions/plans');
});

export const getAllSubscriptions = asyncHandler(async (req, res) => {
  return proxyToPaymentService(req, res, 'get', '/subscriptions/plans');
});


