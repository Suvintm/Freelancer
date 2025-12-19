/**
 * Subscription Routes
 * Handles subscription plans, trials, and payments
 */

import express from "express";
import protect from "../middleware/authMiddleware.js";
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

// ============ PROTECTED ROUTES ============
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

// ============ ADMIN ROUTES ============
// TODO: Add admin middleware check
router.post("/admin/plan", upsertPlan);
router.get("/admin/all", getAllSubscriptions);

export default router;
