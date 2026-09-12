/**
 * Subscription & Payment Gateway Routes
 * Handles enterprise plan catalog, zero-trust checkout, coupons, and lifecycle transitions
 */

import express from "express";
import protect from "../../shared/middleware/auth.middleware.js";
import {
  getPlans,
  getPublicPricingSummary,
  getSubscriptionDashboard,
  getMySubscriptions,
  checkSubscriptionStatus,
  getEntitlements,
  validateCoupon,
  startTrial,
  createOrder,
  verifyPayment,
  getPaymentStatus,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  quoteUpgrade,
  upgradeSubscription,
  downgradeSubscription,
  upsertPlan,
  getAllSubscriptions,
} from "./controllers/subscriptionController.js";
import { publicApiLimiter, heavyLimiter, interactionLimiter } from "../../shared/middleware/rate-limiter.middleware.js";
import { planCatalogCacheMiddleware, publicPricingSummaryCacheMiddleware } from "./middleware/planCache.js";

const router = express.Router();

// ============ 1. PUBLIC ROUTES (Edge Cached) ============
// Consolidated single-roundtrip dashboard bootstrap
router.get("/dashboard", publicApiLimiter, getSubscriptionDashboard);

// Public Lightweight Pricing Summary for Welcome/Landing Page (Multi-tier: Memory L1 -> Redis L2 -> Single-Flight Java)
router.get("/public/pricing-summary", publicApiLimiter, publicPricingSummaryCacheMiddleware, getPublicPricingSummary);

// Fetch live role-based plans catalog (Multi-tier Cache: LRU Memory -> Redis -> Java Single-Flight)
router.get("/plans", publicApiLimiter, planCatalogCacheMiddleware, getPlans);

// Public coupon validation preview
router.post("/coupon/validate", publicApiLimiter, validateCoupon);
router.post("/coupons/validate", publicApiLimiter, validateCoupon);

// Public payment status recovery check (handles tab-drop & webhook reconciliation)
router.get("/status", publicApiLimiter, getPaymentStatus);

// Public/Guest-safe entitlements lookup
router.get("/entitlements", publicApiLimiter, getEntitlements);

// ============ 2. PROTECTED CHECKOUT & LIFECYCLE ROUTES ============
router.use(protect);

// User's active subscription status & history
router.get("/my", publicApiLimiter, getMySubscriptions);
router.get("/check/:feature", publicApiLimiter, checkSubscriptionStatus);

// Zero-Trust Payment Order Creation (Razorpay / Stripe)
router.post("/create-order", heavyLimiter, createOrder);

// Cryptographic Payment Verification & Activation
router.post("/verify", heavyLimiter, verifyPayment);
router.post("/verify-payment", heavyLimiter, verifyPayment);

// Lifecycle Operations
router.get("/quote-upgrade", publicApiLimiter, quoteUpgrade);
router.post("/upgrade", heavyLimiter, upgradeSubscription);
router.post("/downgrade", interactionLimiter, downgradeSubscription);
router.post("/start-trial", heavyLimiter, startTrial);
router.post("/pause", interactionLimiter, pauseSubscription);
router.post("/resume", interactionLimiter, resumeSubscription);
router.post("/cancel", interactionLimiter, cancelSubscription);
router.post("/cancel/:id", interactionLimiter, cancelSubscription);

export default router;
