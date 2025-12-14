import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema(
  {
    // ==================== PLATFORM MAINTENANCE ====================
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: "We're currently performing scheduled maintenance. Please check back soon.",
    },
    maintenanceEndTime: {
      type: Date,
      default: null,
    },

    // ==================== PAYMENT GATEWAY SETTINGS ====================
    
    // Razorpay (India)
    razorpayEnabled: {
      type: Boolean,
      default: true,
    },
    
    // Stripe (International - Future)
    stripeEnabled: {
      type: Boolean,
      default: false,
    },

    // ==================== PLATFORM FEE SETTINGS ====================
    
    platformFee: {
      type: Number,
      default: 10, // 10% platform fee
      min: 0,
      max: 50,
    },

    // ==================== PAYOUT SETTINGS ====================
    
    minPayoutAmount: {
      type: Number,
      default: 100, // ₹100 minimum
    },
    
    payoutFrequency: {
      type: String,
      enum: ["immediate", "daily", "weekly", "monthly"],
      default: "immediate",
    },
    
    baseCurrency: {
      type: String,
      default: "INR",
    },

    // ==================== SUPPORTED COUNTRIES ====================
    
    supportedCountries: {
      type: [String],
      default: ["IN"], // Start with India only
    },
    
    internationalEnabled: {
      type: Boolean,
      default: false,
    },
    
    internationalWaitlistEnabled: {
      type: Boolean,
      default: true,
    },

    // ==================== REFUND POLICY ====================
    
    refundPolicy: {
      beforeAcceptedPercent: { type: Number, default: 100 },
      afterAcceptedNoWorkPercent: { type: Number, default: 100 },
      workInProgressLowPercent: { type: Number, default: 75 },
      workInProgressHighPercent: { type: Number, default: 50 },
      afterDeliveryPercent: { type: Number, default: 0 },
    },

    // ==================== PROFILE COMPLETION WEIGHTS ====================
    
    profileCompletionWeights: {
      editor: {
        basicInfo: { type: Number, default: 20 },
        skills: { type: Number, default: 15 },
        portfolio: { type: Number, default: 20 },
        gig: { type: Number, default: 15 },
        kyc: { type: Number, default: 30 },
      },
      client: {
        basicInfo: { type: Number, default: 40 },
        contact: { type: Number, default: 30 },
        country: { type: Number, default: 30 },
      },
    },
    
    minEditorProfileToList: {
      type: Number,
      default: 80,
    },
    minClientProfileToOrder: {
      type: Number,
      default: 70,
    },

    // ==================== OTHER SETTINGS ====================
    
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    allowNewRegistrations: {
      type: Boolean,
      default: true,
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
siteSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);
