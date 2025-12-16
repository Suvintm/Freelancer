import mongoose from "mongoose";

/**
 * Storage Settings Model
 * Admin-configurable storage limits and plans
 * Uses singleton pattern - only one document in collection
 */
const storagePlanSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    storageMB: { type: Number, required: true },
    price: { type: Number, required: true },
    features: [{ type: String }],
    popular: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
});

const storageSettingsSchema = new mongoose.Schema(
    {
        // Free storage limit for new editors (in MB)
        freeStorageMB: {
            type: Number,
            default: 500, // 500 MB default
            min: 100,
            max: 10240, // Max 10 GB free
        },
        
        // Maximum storage any editor can have (in MB)
        maxStorageMB: {
            type: Number,
            default: 51200, // 50 GB default
            min: 1024,
            max: 102400, // Max 100 GB
        },
        
        // Configurable storage plans
        plans: {
            type: [storagePlanSchema],
            default: [
                {
                    id: "starter",
                    name: "Starter Plan",
                    storageMB: 2048, // 2 GB
                    price: 99,
                    features: ["2 GB total storage", "All Free features", "Priority support", "One-time payment"],
                    popular: false,
                    active: true,
                },
                {
                    id: "pro",
                    name: "Pro Plan",
                    storageMB: 5120, // 5 GB
                    price: 199,
                    features: ["5 GB total storage", "All Starter features", "Badge on profile", "Best value"],
                    popular: true,
                    active: true,
                },
                {
                    id: "business",
                    name: "Business Plan",
                    storageMB: 15360, // 15 GB
                    price: 499,
                    features: ["15 GB total storage", "All Pro features", "Storage analytics", "Perfect for pros"],
                    popular: false,
                    active: true,
                },
                {
                    id: "unlimited",
                    name: "Unlimited Plan",
                    storageMB: 51200, // 50 GB
                    price: 999,
                    features: ["50 GB total storage", "All Business features", "Lifetime access", "Never worry again"],
                    popular: false,
                    active: true,
                },
            ],
        },
        
        // Last updated by admin
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },
    },
    { timestamps: true }
);

// Static method to get settings (singleton pattern)
storageSettingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

// Instance method to convert to plans object format (for backward compatibility)
storageSettingsSchema.methods.toPlansObject = function() {
    const plansObj = {
        free: {
            id: "free",
            name: "Free Plan",
            storageBytes: this.freeStorageMB * 1024 * 1024,
            price: 0,
            features: [
                `${this.freeStorageMB} MB storage`,
                "Portfolio uploads",
                "Chat file sharing",
                "Reel uploads",
            ],
        },
    };
    
    // Add configured plans
    this.plans.filter(p => p.active).forEach(plan => {
        plansObj[plan.id] = {
            id: plan.id,
            name: plan.name,
            storageBytes: plan.storageMB * 1024 * 1024,
            price: plan.price,
            features: plan.features,
            popular: plan.popular,
        };
    });
    
    return plansObj;
};

export const StorageSettings = mongoose.model("StorageSettings", storageSettingsSchema);
