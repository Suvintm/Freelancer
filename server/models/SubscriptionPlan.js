/**
 * SubscriptionPlan Model
 * Defines available subscription plans (managed by admin)
 */

import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    // Plan display name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // URL-friendly identifier
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Which feature this plan unlocks
    feature: {
      type: String,
      required: true,
      enum: ["profile_insights", "priority_listing", "analytics_pro", "all"],
      index: true,
    },

    // Plan duration
    duration: {
      type: String,
      required: true,
      enum: ["monthly", "yearly", "lifetime"],
    },

    // Duration in days (for calculation)
    durationDays: {
      type: Number,
      required: true,
    },

    // Current price
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Original price (for showing discount)
    originalPrice: {
      type: Number,
      default: 0,
    },

    // Currency
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD"],
    },

    // Discount percentage (calculated or manual)
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Free trial days (0 = no trial)
    trialDays: {
      type: Number,
      default: 3,
      min: 0,
    },

    // Features list for display
    features: [{
      type: String,
      trim: true,
    }],

    // Plan description
    description: {
      type: String,
      default: "",
    },

    // Badge text (e.g., "POPULAR", "BEST VALUE")
    badge: {
      type: String,
      default: "",
    },

    // Is this plan currently available
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Display order
    sortOrder: {
      type: Number,
      default: 0,
    },

    // Stats
    totalSubscriptions: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
subscriptionPlanSchema.index({ feature: 1, isActive: 1, sortOrder: 1 });

// Virtual for savings amount
subscriptionPlanSchema.virtual("savingsAmount").get(function () {
  if (this.originalPrice > this.price) {
    return this.originalPrice - this.price;
  }
  return 0;
});

// Static method to get active plans for a feature
subscriptionPlanSchema.statics.getPlansForFeature = async function (feature) {
  return this.find({ feature, isActive: true })
    .sort({ sortOrder: 1 })
    .lean();
};

// Static method to increment subscription count
subscriptionPlanSchema.statics.incrementSubscriptions = async function (planId) {
  return this.findByIdAndUpdate(planId, { $inc: { totalSubscriptions: 1 } });
};

// Ensure virtuals are included in JSON
subscriptionPlanSchema.set("toJSON", { virtuals: true });
subscriptionPlanSchema.set("toObject", { virtuals: true });

export const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
