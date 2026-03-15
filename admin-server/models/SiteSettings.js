// SiteSettings.js - Singleton for global platform settings
import mongoose from "mongoose";

// Simple in-memory cache to avoid DB hits on every request
// In production with multiple instances, this would ideally use Redis, 
// but for a singleton with manual invalidation, this is highly efficient.
let settingsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds cache

const siteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: "global",
    },
    // Global toggle to show/hide Suvix internal ad slots
    showSuvixAds: {
      type: Boolean,
      default: true,
    },
    // Platform Fee percentage (default 10%)
    platformFee: {
      type: Number,
      default: 10,
    },
    // Minimum amount an editor can withdraw
    minPayoutAmount: {
      type: Number,
      default: 1000,
    },
    // Maintenance mode toggle
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: "SuviX is currently undergoing maintenance. We'll be back shortly!",
    },
    maintenanceEndTime: {
      type: Date,
    },
    // Refund policies
    refundPolicy: {
      beforeAcceptedPercent: { type: Number, default: 100 },
      afterAcceptedNoWorkPercent: { type: Number, default: 100 },
      workInProgressLowPercent: { type: Number, default: 75 },
      workInProgressHighPercent: { type: Number, default: 50 },
      afterDeliveryPercent: { type: Number, default: 0 },
    },
    // Global banner/broadcast
    systemBroadcast: {
      message: { type: String, default: "" },
      isActive: { type: Boolean, default: false },
      type: { type: String, enum: ["info", "warning", "success", "error"], default: "info" },
    },
  },
  { timestamps: true }
);

/**
 * Static method to get or create settings with caching
 * This allows calling SiteSettings.getSettings() anywhere in the app.
 */
siteSettingsSchema.statics.getSettings = async function() {
  const now = Date.now();
  
  // Return from cache if still valid
  if (settingsCache && (now - cacheTimestamp < CACHE_TTL)) {
    return settingsCache;
  }

  try {
    let settings = await this.findOne({ key: "global" });
    if (!settings) {
      settings = await this.create({ key: "global" });
    }
    
    // Update cache
    settingsCache = settings;
    cacheTimestamp = now;
    
    return settings;
  } catch (error) {
    console.error("Error fetching SiteSettings:", error);
    // Fallback to defaults to prevent app crash if DB is slow
    return {
      platformFee: 10,
      maintenanceMode: false,
      showSuvixAds: true,
      minPayoutAmount: 1000,
    };
  }
};

/**
 * Static method to invalidate cache when settings are updated
 */
siteSettingsSchema.statics.clearCache = function() {
  settingsCache = null;
  cacheTimestamp = 0;
};

// Invalidate cache on save
siteSettingsSchema.post('save', function() {
  settingsCache = null;
  cacheTimestamp = 0;
});

export const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);

// Export utility wrapper for convenience
export const getSettings = async () => {
  return await SiteSettings.getSettings();
};
