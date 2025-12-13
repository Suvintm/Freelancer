import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema(
  {
    // Platform maintenance
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

    // Platform settings
    platformFee: {
      type: Number,
      default: 10, // 10% platform fee
      min: 0,
      max: 50,
    },

    // Email notifications
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    // Registration settings
    allowNewRegistrations: {
      type: Boolean,
      default: true,
    },

    // Updated by
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
