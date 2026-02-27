// SiteSettings.js - Singleton for global platform settings
import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: "global",
    },
    // Global toggle to show/hide Suvix internal ad slots (Level 0 in banner slider)
    showSuvixAds: {
      type: Boolean,
      default: true,
    },
    // Can be extended later for more site-wide settings
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);

// Helper to get or create the single settings document
export const getSettings = async () => {
  let settings = await SiteSettings.findOne({ key: "global" });
  if (!settings) {
    settings = await SiteSettings.create({ key: "global" });
  }
  return settings;
};
