/**
 * Subscription Routes
 * Handles subscription plans, trials, and payments
 */

import express from "express";
import protect from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminAuth.js";
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
} from "../controllers/subscriptionController.js";

const router = express.Router();

// ============ PUBLIC ROUTES ============
// Get all available plans
router.get("/plans", getPlans);

// ============ ADMIN ROUTES (must be before protect middleware) ============
router.post("/admin/plan", protectAdmin, upsertPlan);
router.get("/admin/all", protectAdmin, getAllSubscriptions);

// ============ PROTECTED ROUTES (User auth) ============
router.use(protect);

// Get user's subscriptions
router.get("/my", getMySubscriptions);

// Check subscription status for a feature
router.get("/check/:feature", checkSubscriptionStatus);

// Start free trial
router.post("/start-trial", startTrial);

// Create Razorpay order for subscription
router.post("/create-order", createOrder);

// Verify payment and activate subscription
router.post("/verify-payment", verifyPayment);

// Cancel subscription
router.post("/cancel/:id", cancelSubscription);

export default router;

