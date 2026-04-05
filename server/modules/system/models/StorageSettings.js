import prisma from "../../../config/prisma.js";
import logger from "../../../utils/logger.js";

/**
 * Storage Settings DAO (PostgreSQL)
 * Logic refactored from Mongoose to Prisma singleton pattern.
 */
export class StorageSettings {
    /**
     * Get Settings (Singleton)
     */
    static async getSettings() {
        try {
            let settings = await prisma.storageSettings.findFirst();
            if (!settings) {
                settings = await prisma.storageSettings.create({
                    data: {
                        free_storage_mb: 500,
                        max_storage_mb: 51200
                    }
                });
            }
            return this.attachMethods(settings);
        } catch (error) {
            logger.error("Error fetching StorageSettings:", error);
            return this.attachMethods({ free_storage_mb: 500, max_storage_mb: 51200, plans_json: [] });
        }
    }

    /**
     * Attach helper methods to match old Mongoose instance behavior
     */
    static attachMethods(settings) {
        return {
            ...settings,
            toPlansObject: () => {
                const plansObj = {
                    free: {
                        id: "free",
                        name: "Free Plan",
                        storageBytes: Number(settings.free_storage_mb) * 1024 * 1024,
                        price: 0,
                        features: [
                            `${settings.free_storage_mb} MB storage`,
                            "Portfolio uploads",
                            "Chat file sharing",
                            "Reel uploads",
                        ],
                    },
                };
                
                // Add default plans if plans_json is empty or missing
                const plans = settings.plans_json || [
                    { id: "starter", name: "Starter Plan", storageMB: 2048, price: 99, features: ["2 GB storage", "Priority support"], active: true },
                    { id: "pro", name: "Pro Plan", storageMB: 5120, price: 199, features: ["5 GB storage", "Best value"], active: true, popular: true },
                    { id: "business", name: "Business Plan", storageMB: 15360, price: 499, features: ["15 GB storage"], active: true },
                    { id: "unlimited", name: "Unlimited Plan", storageMB: 51200, price: 999, features: ["50 GB storage"], active: true }
                ];

                plans.filter(p => p.active).forEach(plan => {
                    plansObj[plan.id] = {
                        id: plan.id,
                        name: plan.name,
                        storageBytes: Number(plan.storageMB) * 1024 * 1024,
                        price: plan.price,
                        features: plan.features,
                        popular: plan.popular,
                    };
                });
                
                return plansObj;
            }
        };
    }
}

export default StorageSettings;
