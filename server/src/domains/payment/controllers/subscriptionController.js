/**
 * Subscription Controller (PostgreSQL / Prisma version)
 * Handles subscription plans, payments, and user subscriptions
 */

import razorpay from "../services/razorpay.config.js";
import crypto from "crypto";
import prisma from "../../../infrastructure/database/postgres.js";
import { asyncHandler } from "../../../shared/middleware/error-handler.middleware.js";
import notificationService from '../../../domains/notification/services/notificationService.js';
import { withCache, deleteCache, CacheKey, TTL } from "../../../infrastructure/cache/cache.service.js";

// ============ GET ALL PLANS ============
export const getPlans = asyncHandler(async (req, res) => {
  const { feature } = req.query;
  const cacheKey = CacheKey.subscriptionPlans(feature || "all");

  const plans = await withCache(cacheKey, TTL.SUBSCRIPTION_PLANS, async () => {
    const where = { isActive: true };
    if (feature) where.feature = feature;
    return prisma.subscriptionPlan.findMany({
      where,
      orderBy: { sortOrder: "asc" }
    });
  });

  const formattedPlans = plans.map(plan => ({
    ...plan,
    _id: plan.id,
  }));

  res.status(200).json({ success: true, plans: formattedPlans });
});

// ============ GET MY SUBSCRIPTIONS ============
export const getMySubscriptions = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { created_at: "desc" }
  });

  // Map to align with mongoose populate format (_id, plan mapping)
  const formatted = subscriptions.map(sub => ({
    ...sub,
    _id: sub.id,
    user: sub.userId,
    plan: {
      ...sub.plan,
      _id: sub.plan.id
    }
  }));

  res.status(200).json({
    success: true,
    subscriptions: formatted,
  });
});

// ============ CHECK SUBSCRIPTION STATUS ============
export const checkSubscriptionStatus = asyncHandler(async (req, res) => {
  const { feature } = req.params;
  const userId = req.user._id || req.user.id;

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      feature: { in: [feature, "all"] },
      status: { in: ["active", "trial"] },
      endDate: { gte: new Date() }
    },
    include: { plan: true }
  });

  const trialSub = await prisma.subscription.findFirst({
    where: {
      userId,
      feature: { in: [feature, "all"] },
      isTrial: true
    }
  });

  const formattedSub = subscription ? {
    ...subscription,
    _id: subscription.id,
    user: subscription.userId,
    plan: {
      ...subscription.plan,
      _id: subscription.plan.id
    }
  } : null;

  res.status(200).json({
    success: true,
    hasSubscription: !!subscription,
    subscription: formattedSub,
    hasUsedTrial: !!trialSub,
    feature,
  });
});

// ============ START FREE TRIAL ============
export const startTrial = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const userId = req.user._id || req.user.id;

  // Get the plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  });
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Plan not found",
    });
  }

  // Check if trial already used
  const trialSub = await prisma.subscription.findFirst({
    where: {
      userId,
      feature: { in: [plan.feature, "all"] },
      isTrial: true
    }
  });

  if (trialSub) {
    return res.status(400).json({
      success: false,
      message: "You have already used your free trial for this feature",
    });
  }

  // Check if already has active subscription
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      feature: { in: [plan.feature, "all"] },
      status: { in: ["active", "trial"] },
      endDate: { gte: new Date() }
    }
  });

  if (existingSubscription) {
    return res.status(400).json({
      success: false,
      message: "You already have an active subscription for this feature",
    });
  }

  // Start trial
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (plan.trialDays || 3));

  const [subscription] = await prisma.$transaction([
    prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        planName: plan.name,
        planType: plan.duration,
        feature: plan.feature,
        planTier: plan.planTier,
        status: "trial",
        startDate,
        endDate,
        trialEndDate: endDate,
        isTrial: true,
        amount: 0,
        currency: plan.currency,
      }
    }),
    prisma.user.update({
      where: { id: userId },
      data: { is_verified: true }
    })
  ]);

  // Invalidate user profile cache so the new trial subscription status is active immediately
  await deleteCache(CacheKey.userProfile(userId));

  const formattedSub = {
    ...subscription,
    _id: subscription.id,
    user: subscription.userId,
  };

  res.status(201).json({
    success: true,
    message: `${plan.trialDays || 3}-day free trial activated!`,
    subscription: formattedSub,
  });
});

// ============ CREATE RAZORPAY ORDER ============
export const createOrder = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const userId = req.user._id || req.user.id;

  // Get the plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  });
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
    amount: Math.round(plan.price * 100), // Ensure integer
    currency: plan.currency,
    receipt: `sub_${userId.toString().slice(-10)}_${Date.now()}`,
    notes: {
      userId: userId.toString(),
      planId: plan.id.toString(),
      feature: plan.feature,
    },
  };

  try {
    const order = await razorpay.orders.create(options);

    // Create pending subscription
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        planName: plan.name,
        planType: plan.duration,
        feature: plan.feature,
        planTier: plan.planTier,
        status: "payment_pending",
        startDate: new Date(),
        endDate,
        amount: plan.price,
        currency: plan.currency,
        razorpayOrderId: order.id,
      }
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: {
        name: plan.name,
        duration: plan.duration,
        features: plan.features,
      },
    });
  } catch (error) {
    // Handle Razorpay specific errors
    if (error.error && error.error.description) {
      return res.status(400).json({
        success: false,
        message: `Payment Error: ${error.error.description}`,
      });
    }

    // Default error
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to initiate subscription",
    });
  }
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
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId }
  });
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

  // Recalculate end date from now
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: subscription.planId }
  });

  const endDate = new Date();
  if (plan) {
    endDate.setDate(endDate.getDate() + plan.durationDays);
  }

  // Activate subscription and increment plan subscription count in a transaction
  const [updatedSub] = await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "active",
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        startDate: new Date(),
        endDate,
      }
    }),
    prisma.user.update({
      where: { id: subscription.userId },
      data: { is_verified: true }
    }),
    ...(plan ? [
      prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: { totalSubscriptions: { increment: 1 } }
      })
    ] : [])
  ]);

  // Invalidate user profile cache so new subscription details are reflected immediately
  await deleteCache(CacheKey.userProfile(subscription.userId));

  // Send notification
  await notificationService.notify({
    userId: subscription.userId,
    type: "SYSTEM",
    title: "Subscription Activated",
    body: `You have successfully upgraded to the ${subscription.planName} plan! Enjoy ${subscription.planType} of premium features.`,
    metadata: { link: "/subscription/plans" },
  });

  const formattedSub = {
    ...updatedSub,
    _id: updatedSub.id,
    user: updatedSub.userId,
  };

  res.status(200).json({
    success: true,
    message: "Subscription activated successfully!",
    subscription: formattedSub,
  });
});

// ============ CANCEL SUBSCRIPTION ============
export const cancelSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id || req.user.id;

  const subscription = await prisma.subscription.findFirst({
    where: {
      id,
      userId
    }
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

  const [updatedSubscription] = await prisma.$transaction([
    prisma.subscription.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        autoRenew: false
      }
    }),
    prisma.user.update({
      where: { id: userId },
      data: { is_verified: false }
    })
  ]);

  // Invalidate user profile cache so new subscription details are reflected immediately
  await deleteCache(CacheKey.userProfile(subscription.userId));

  const formattedSub = {
    ...updatedSubscription,
    _id: updatedSubscription.id,
    user: updatedSubscription.userId,
  };

  res.status(200).json({
    success: true,
    message: "Subscription cancelled. You will retain access until the end date.",
    subscription: formattedSub,
  });
});

// ============ ADMIN: CREATE/UPDATE PLAN ============
export const upsertPlan = async (req, res) => {
  try {
    const { planId, ...planData } = req.body;

    console.log("upsertPlan called with:", { planId, planData });

    let plan;
    if (planId) {
      plan = await prisma.subscriptionPlan.update({
        where: { id: planId },
        data: planData
      });
    } else {
      plan = await prisma.subscriptionPlan.create({
        data: planData
      });
    }

    console.log("Plan saved:", plan);

    // Invalidate plans cache
    await deleteCache([
      CacheKey.subscriptionPlans("all"),
      CacheKey.subscriptionPlans(plan.feature || "all"),
    ]);

    res.status(200).json({
      success: true,
      message: planId ? "Plan updated" : "Plan created",
      plan,
    });
  } catch (error) {
    console.error("upsertPlan error:", error);
    
    // Handle Prisma duplicate key error (P2002)
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "A plan with this slug already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to save plan",
    });
  }
};

// ============ ADMIN: GET ALL SUBSCRIPTIONS ============
export const getAllSubscriptions = asyncHandler(async (req, res) => {
  const { status, feature, page = 1, limit = 20 } = req.query;

  const where = {};
  if (status) where.status = status;
  if (feature) where.feature = feature;

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              profile_picture: true
            }
          }
        }
      },
      plan: {
        select: {
          name: true,
          duration: true,
          price: true
        }
      }
    },
    orderBy: { created_at: "desc" },
    skip: (page - 1) * limit,
    take: parseInt(limit)
  });

  const total = await prisma.subscription.count({ where });

  // Map to align nested postgres objects with legacy mongoose formats
  const formatted = subscriptions.map(sub => {
    const formattedUser = sub.user ? {
      _id: sub.user.id,
      id: sub.user.id,
      email: sub.user.email,
      name: sub.user.profile?.name || "",
      profilePicture: sub.user.profile?.profile_picture || null
    } : null;

    return {
      ...sub,
      _id: sub.id,
      user: formattedUser,
      plan: sub.plan ? {
        ...sub.plan,
        _id: sub.planId
      } : null
    };
  });

  res.status(200).json({
    success: true,
    subscriptions: formatted,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
