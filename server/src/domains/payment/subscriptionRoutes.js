/**
 * Subscription Routes
 * Handles subscription plans, trials, and payments
 */

import express from "express";
import protect from "../../shared/middleware/auth.middleware.js";
// import { protectAdmin } from "../../shared/middleware/admin-auth.middleware.js";
import {
  getPlans,
  getMySubscriptions,
  checkSubscriptionStatus,
  startTrial,
  createOrder,
  verifyPayment,
  cancelSubscription,
  upsertPlan,
  getAllSubscriptions,
} from "./controllers/subscriptionController.js";
import { createSubscriptionOrderValidator, verifySubscriptionPaymentValidator } from "../../shared/middleware/validators.middleware.js";
import { publicApiLimiter, heavyLimiter, interactionLimiter } from "../../shared/middleware/rate-limiter.middleware.js";

const router = express.Router();

// ============ PUBLIC ROUTES ============
// Get all available plans
router.get("/plans", publicApiLimiter, getPlans);

// ============ ADMIN ROUTES (MOVED TO ADMIN-SERVER) ============
// router.post("/admin/plan", protectAdmin, upsertPlan);
// router.get("/admin/all", protectAdmin, getAllSubscriptions);

// ============ PROTECTED ROUTES (User auth) ============
router.use(protect);

// Get user's subscriptions
router.get("/my", publicApiLimiter, getMySubscriptions);

// Check subscription status for a feature
router.get("/check/:feature", publicApiLimiter, checkSubscriptionStatus);

// Start free trial
router.post("/start-trial", heavyLimiter, startTrial);

// Create Razorpay order for subscription
router.post("/create-order", heavyLimiter, createSubscriptionOrderValidator, createOrder);

// Verify payment and activate subscription
router.post("/verify-payment", heavyLimiter, verifySubscriptionPaymentValidator, verifyPayment);

// Cancel subscription
router.post("/cancel/:id", interactionLimiter, cancelSubscription);

export default router;







