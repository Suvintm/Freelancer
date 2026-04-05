// SiteSettings.js - Managed as singleton in PostgreSQL via Prisma
import prisma from "../../../config/prisma.js";
import logger from "../../../utils/logger.js";

// Multi-tier caching
let settingsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds local in-memory cache

/**
 * SiteSettings DAO (PostgreSQL)
 * Provides singleton access to global platform configuration.
 */
export class SiteSettings {
  /**
   * Get or Create Global Settings
   * Mimics Mongoose static method for backward compatibility.
   */
  static async getSettings() {
    const now = Date.now();
    
    if (settingsCache && (now - cacheTimestamp < CACHE_TTL)) {
      return settingsCache;
    }

    try {
      let settings = await prisma.siteSettings.findUnique({
        where: { key: "global" }
      });

      if (!settings) {
        // Initialize if first launch
        settings = await prisma.siteSettings.create({
          data: { key: "global" }
        });
      }

      // Map to frontend-friendly snake_case to camelCase if needed,
      // but here we match the previous Mongoose structure for compatibility.
      const mapped = {
        key: settings.key,
        autoKycEnabled: settings.auto_kyc_enabled,
        showSuvixAds: settings.show_suvix_ads,
        platformFee: Number(settings.platform_fee),
        minPayoutAmount: Number(settings.min_payout_amount),
        maintenanceMode: settings.maintenance_mode,
        maintenanceMessage: settings.maintenance_message,
        maintenanceEndTime: settings.maintenance_end_time,
        refundPolicy: {
            beforeAcceptedPercent: Number(settings.refund_before_accepted_pct),
            afterAcceptedNoWorkPercent: Number(settings.refund_after_no_work_pct),
            workInProgressLowPercent: Number(settings.refund_wip_low_pct),
            workInProgressHighPercent: Number(settings.refund_wip_high_pct),
            afterDeliveryPercent: Number(settings.refund_after_delivery_pct)
        },
        systemBroadcast: {
            message: settings.broadcast_message,
            isActive: settings.broadcast_active,
            type: settings.broadcast_type
        }
      };

      settingsCache = mapped;
      cacheTimestamp = now;
      return mapped;
    } catch (error) {
      logger.error("Error fetching SiteSettings from PostgreSQL:", error);
      return {
        platformFee: 10,
        maintenanceMode: false,
        showSuvixAds: true,
        minPayoutAmount: 1000
      };
    }
  }

  /**
   * Update Site Settings
   */
  static async updateSettings(data) {
    const updated = await prisma.siteSettings.update({
        where: { key: "global" },
        data: {
            auto_kyc_enabled: data.autoKycEnabled,
            show_suvix_ads: data.showSuvixAds,
            platform_fee: data.platformFee,
            min_payout_amount: data.minPayoutAmount,
            maintenance_mode: data.maintenanceMode,
            maintenance_message: data.maintenanceMessage,
            maintenance_end_time: data.maintenanceEndTime,
            broadcast_message: data.systemBroadcast?.message,
            broadcast_active: data.systemBroadcast?.isActive,
            broadcast_type: data.systemBroadcast?.type
        }
    });

    this.clearCache();
    return updated;
  }

  static clearCache() {
    settingsCache = null;
    cacheTimestamp = 0;
  }
}

// Export utility wrapper for convenience
export const getSettings = async () => {
  return await SiteSettings.getSettings();
};

export default SiteSettings;
