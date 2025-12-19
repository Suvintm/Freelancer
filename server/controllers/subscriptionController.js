/**
 * Subscription Controller
 * Handles subscription plans, payments, and user subscriptions
 */

import Razorpay from "razorpay";
import crypto from "crypto";
import { Subscription } from "../models/Subscription.js";
import { SubscriptionPlan } from "../models/SubscriptionPlan.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============ GET ALL PLANS ============
export const getPlans = asyncHandler(async (req, res) => {
  const { feature } = req.query;

  const query = { isActive: true };
  if (feature) {
    query.feature = feature;
  }

  const plans = await SubscriptionPlan.find(query)
    .sort({ sortOrder: 1 })
    .lean();

  res.status(200).json({
    success: true,
    plans,
  });
});

// ============ GET MY SUBSCRIPTIONS ============
export const getMySubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ user: req.user._id })
    .populate("plan")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    subscriptions,
  });
});

// ============ CHECK SUBSCRIPTION STATUS ============
export const checkSubscriptionStatus = asyncHandler(async (req, res) => {
  const { feature } = req.params;

  const subscription = await Subscription.getActiveSubscription(
    req.user._id,
    feature
  );

  const hasUsedTrial = await Subscription.hasUsedTrial(req.user._id, feature);

  res.status(200).json({
    success: true,
    hasSubscription: !!subscription,
    subscription: subscription || null,
    hasUsedTrial,
    feature,
  });
});

// ============ START FREE TRIAL ============
export const startTrial = asyncHandler(async (req, res) => {
  const { planId } = req.body;

  // Get the plan
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Plan not found",
    });
  }

  // Check if trial already used
  const hasUsedTrial = await Subscription.hasUsedTrial(
    req.user._id,
    plan.feature
  );

  if (hasUsedTrial) {
    return res.status(400).json({
      success: false,
      message: "You have already used your free trial for this feature",
    });
  }

  // Check if already has active subscription
  const existingSubscription = await Subscription.getActiveSubscription(
    req.user._id,
    plan.feature
  );

  if (existingSubscription) {
    return res.status(400).json({
      success: false,
      message: "You already have an active subscription for this feature",
    });
  }

  // Start trial
  const subscription = await Subscription.startTrial(req.user._id, {
    planId: plan._id,
    planName: plan.name,
    planType: plan.duration,
    feature: plan.feature,
    trialDays: plan.trialDays || 3,
  });

  res.status(201).json({
    success: true,
    message: `${plan.trialDays || 3}-day free trial activated!`,
    subscription,
  });
});

// ============ CREATE RAZORPAY ORDER ============
export const createOrder = asyncHandler(async (req, res) => {
  const { planId } = req.body;

  // Get the plan
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Plan not found",
    });
  }

  if (!plan.isActive) {
    return res.status(400).json({
      success: false,
      message: "This plan is no longer available",
    });
  }

  // Create Razorpay order
  const options = {
    amount: plan.price * 100, // Amount in paise
    currency: plan.currency,
    receipt: `sub_${req.user._id}_${Date.now()}`,
    notes: {
      userId: req.user._id.toString(),
      planId: plan._id.toString(),
      feature: plan.feature,
    },
  };

  const order = await razorpay.orders.create(options);

  // Create pending subscription
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.durationDays);

  const subscription = await Subscription.create({
    user: req.user._id,
    plan: plan._id,
    planName: plan.name,
    planType: plan.duration,
    feature: plan.feature,
    status: "payment_pending",
    startDate: new Date(),
    endDate,
    amount: plan.price,
    currency: plan.currency,
    razorpayOrderId: order.id,
  });

  res.status(200).json({
    success: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    subscriptionId: subscription._id,
    keyId: process.env.RAZORPAY_KEY_ID,
    plan: {
      name: plan.name,
      duration: plan.duration,
      features: plan.features,
    },
  });
});

// ============ VERIFY PAYMENT ============
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature, subscriptionId } = req.body;

  // Verify signature
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment signature",
    });
  }

  // Find and update subscription
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: "Subscription not found",
    });
  }

  if (subscription.status !== "payment_pending") {
    return res.status(400).json({
      success: false,
      message: "Subscription is not pending payment",
    });
  }

  // Activate subscription
  subscription.status = "active";
  subscription.razorpayPaymentId = paymentId;
  subscription.razorpaySignature = signature;
  subscription.startDate = new Date();
  
  // Recalculate end date from now
  const plan = await SubscriptionPlan.findById(subscription.plan);
  if (plan) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);
    subscription.endDate = endDate;
    
    // Increment plan subscription count
    await SubscriptionPlan.incrementSubscriptions(plan._id);
  }

  await subscription.save();

  res.status(200).json({
    success: true,
    message: "Subscription activated successfully!",
    subscription,
  });
});

// ============ CANCEL SUBSCRIPTION ============
export const cancelSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subscription = await Subscription.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: "Subscription not found",
    });
  }

  if (subscription.status === "cancelled") {
    return res.status(400).json({
      success: false,
      message: "Subscription is already cancelled",
    });
  }

  subscription.status = "cancelled";
  subscription.cancelledAt = new Date();
  subscription.autoRenew = false;
  await subscription.save();

  res.status(200).json({
    success: true,
    message: "Subscription cancelled. You will retain access until the end date.",
    subscription,
  });
});

// ============ ADMIN: CREATE/UPDATE PLAN ============
export const upsertPlan = asyncHandler(async (req, res) => {
  const { planId, ...planData } = req.body;

  let plan;
  if (planId) {
    plan = await SubscriptionPlan.findByIdAndUpdate(planId, planData, {
      new: true,
      runValidators: true,
    });
  } else {
    plan = await SubscriptionPlan.create(planData);
  }

  res.status(200).json({
    success: true,
    message: planId ? "Plan updated" : "Plan created",
    plan,
  });
});

// ============ ADMIN: GET ALL SUBSCRIPTIONS ============
export const getAllSubscriptions = asyncHandler(async (req, res) => {
  const { status, feature, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (feature) query.feature = feature;

  const subscriptions = await Subscription.find(query)
    .populate("user", "name email profilePicture")
    .populate("plan", "name duration price")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const total = await Subscription.countDocuments(query);

  res.status(200).json({
    success: true,
    subscriptions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
