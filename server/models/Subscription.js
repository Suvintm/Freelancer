/**
 * Subscription Model
 * Tracks user subscriptions to premium features
 */

import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    // User who subscribed
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Which plan they subscribed to
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    // Plan details (cached for historical reference)
    planName: {
      type: String,
      required: true,
    },
    planType: {
      type: String,
      enum: ["monthly", "yearly", "lifetime"],
      required: true,
    },

    // Which feature this unlocks
    feature: {
      type: String,
      required: true,
      enum: ["profile_insights", "priority_listing", "analytics_pro", "all"],
      index: true,
    },

    // Subscription status
    status: {
      type: String,
      enum: ["trial", "active", "expired", "cancelled", "payment_pending"],
      default: "payment_pending",
      index: true,
    },

    // Subscription period
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    // Trial tracking
    isTrial: {
      type: Boolean,
      default: false,
    },
    trialEndDate: {
      type: Date,
      default: null,
    },

    // Payment details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },

    // Razorpay details
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },

    // Auto-renewal
    autoRenew: {
      type: Boolean,
      default: true,
    },

    // Cancellation tracking
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: "",
    },

    // Renewal history
    renewalCount: {
      type: Number,
      default: 0,
    },
    lastRenewalDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
subscriptionSchema.index({ user: 1, feature: 1, status: 1 });
subscriptionSchema.index({ user: 1, endDate: -1 });
subscriptionSchema.index({ status: 1, endDate: 1 }); // For expiry checks

// Virtual to check if subscription is currently active
subscriptionSchema.virtual("isActive").get(function () {
  if (this.status === "cancelled") return false;
  if (this.status === "expired") return false;
  if (this.status === "payment_pending") return false;
  return new Date() <= this.endDate;
});

// Virtual for days remaining
subscriptionSchema.virtual("daysRemaining").get(function () {
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Static method to check if user has active subscription for feature
subscriptionSchema.statics.hasActiveSubscription = async function (userId, feature) {
  const subscription = await this.findOne({
    user: userId,
    feature: { $in: [feature, "all"] },
    status: { $in: ["active", "trial"] },
    endDate: { $gte: new Date() },
  });
  return !!subscription;
};

// Static method to get user's active subscription for feature
subscriptionSchema.statics.getActiveSubscription = async function (userId, feature) {
  return this.findOne({
    user: userId,
    feature: { $in: [feature, "all"] },
    status: { $in: ["active", "trial"] },
    endDate: { $gte: new Date() },
  }).populate("plan");
};

// Static method to check if user has used trial
subscriptionSchema.statics.hasUsedTrial = async function (userId, feature) {
  const trialSub = await this.findOne({
    user: userId,
    feature: { $in: [feature, "all"] },
    isTrial: true,
  });
  return !!trialSub;
};

// Static method to start a trial
subscriptionSchema.statics.startTrial = async function (userId, planData) {
  const { planId, planName, planType, feature, trialDays } = planData;

  // Check if trial already used
  const hasUsed = await this.hasUsedTrial(userId, feature);
  if (hasUsed) {
    throw new Error("Trial already used for this feature");
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + trialDays);

  return this.create({
    user: userId,
    plan: planId,
    planName,
    planType,
    feature,
    status: "trial",
    startDate,
    endDate,
    trialEndDate: endDate,
    isTrial: true,
    amount: 0,
  });
};

// Static method to activate subscription after payment
subscriptionSchema.statics.activateSubscription = async function (subscriptionId, paymentData) {
  const { paymentId, signature } = paymentData;

  return this.findByIdAndUpdate(
    subscriptionId,
    {
      status: "active",
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
    },
    { new: true }
  );
};

// Static method to expire subscriptions (run via cron)
subscriptionSchema.statics.expireSubscriptions = async function () {
  const result = await this.updateMany(
    {
      status: { $in: ["active", "trial"] },
      endDate: { $lt: new Date() },
    },
    {
      status: "expired",
    }
  );
  return result.modifiedCount;
};

// Ensure virtuals are included
subscriptionSchema.set("toJSON", { virtuals: true });
subscriptionSchema.set("toObject", { virtuals: true });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
