import mongoose from "mongoose";

/**
 * Badge Definitions
 * These are the 10 predefined achievement badges that editors can earn
 */
export const BADGE_DEFINITIONS = {
  RISING_STAR: {
    id: "rising_star",
    name: "Rising Star",
    description: "Complete your first 3 orders successfully",
    icon: "star",
    color: "#F59E0B", // Amber
    category: "orders",
    criteria: {
      type: "orders_completed",
      threshold: 3,
    },
  },
  ORDER_MASTER: {
    id: "order_master",
    name: "Order Master",
    description: "Complete 10 or more orders successfully",
    icon: "trophy",
    color: "#8B5CF6", // Purple
    category: "orders",
    criteria: {
      type: "orders_completed",
      threshold: 10,
    },
  },
  ELITE_EDITOR: {
    id: "elite_editor",
    name: "Elite Editor",
    description: "Complete 25 or more orders and become a top-tier editor",
    icon: "crown",
    color: "#F97316", // Orange
    category: "orders",
    criteria: {
      type: "orders_completed",
      threshold: 25,
    },
  },
  TOP_RATED: {
    id: "top_rated",
    name: "Top Rated",
    description: "Maintain an average rating of 4.5 stars or above (min 5 reviews)",
    icon: "star-badge",
    color: "#EAB308", // Yellow
    category: "quality",
    criteria: {
      type: "avg_rating",
      threshold: 4.5,
      minReviews: 5,
    },
  },
  FAST_DELIVERER: {
    id: "fast_deliverer",
    name: "Fast Deliverer",
    description: "Deliver 5 or more orders before 80% of the deadline (early delivery)",
    icon: "bolt",
    color: "#3B82F6", // Blue
    category: "speed",
    criteria: {
      type: "early_deliveries",
      threshold: 5,
      earlyPercentage: 20, // Delivered within first 80% of time (before last 20%)
    },
  },
  PORTFOLIO_PRO: {
    id: "portfolio_pro",
    name: "Portfolio Pro",
    description: "Upload 10 or more portfolio items to showcase your work",
    icon: "film",
    color: "#EC4899", // Pink
    category: "content",
    criteria: {
      type: "portfolio_count",
      threshold: 10,
    },
  },
  REEL_CREATOR: {
    id: "reel_creator",
    name: "Reel Creator",
    description: "Publish 15 or more reels to engage with the community",
    icon: "play-circle",
    color: "#14B8A6", // Teal
    category: "content",
    criteria: {
      type: "reels_count",
      threshold: 15,
    },
  },
  VERIFIED_PRO: {
    id: "verified_pro",
    name: "Verified Pro",
    description: "Complete KYC verification and maintain 80%+ profile completion",
    icon: "check-badge",
    color: "#10B981", // Green
    category: "trust",
    criteria: {
      type: "verified_profile",
      kycRequired: true,
      minProfileCompletion: 80,
    },
  },
  HIGH_EARNER: {
    id: "high_earner",
    name: "High Earner",
    description: "Earn a total of ₹50,000 or more through completed orders",
    icon: "currency",
    color: "#22C55E", // Green
    category: "earnings",
    criteria: {
      type: "total_earnings",
      threshold: 50000,
    },
  },
  COMMUNITY_STAR: {
    id: "community_star",
    name: "Community Star",
    description: "Have your profile viewed 500 or more times by others",
    icon: "users",
    color: "#6366F1", // Indigo
    category: "popularity",
    criteria: {
      type: "profile_views",
      threshold: 500,
    },
  },
};

/**
 * UserBadge Schema
 * Tracks which badges each user has earned
 */
const userBadgeSchema = new mongoose.Schema(
  {
    // User who earned the badge
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    // Badge ID from BADGE_DEFINITIONS
    badgeId: {
      type: String,
      required: true,
      enum: Object.keys(BADGE_DEFINITIONS).map(key => BADGE_DEFINITIONS[key].id),
    },
    
    // When the badge was earned
    earnedAt: {
      type: Date,
      default: Date.now,
    },
    
    // Snapshot of the value that earned the badge (for records)
    valueSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique badges per user
userBadgeSchema.index({ user: 1, badgeId: 1 }, { unique: true });

// Static method to award a badge
userBadgeSchema.statics.awardBadge = async function (userId, badgeId, valueSnapshot = null) {
  try {
    // Check if already earned
    const existing = await this.findOne({ user: userId, badgeId });
    if (existing) {
      return { success: false, message: "Badge already earned", badge: existing };
    }
    
    // Award the badge
    const badge = await this.create({
      user: userId,
      badgeId,
      earnedAt: new Date(),
      valueSnapshot,
    });
    
    return { success: true, message: "Badge awarded!", badge };
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - already has badge
      return { success: false, message: "Badge already earned" };
    }
    throw error;
  }
};

// Static method to get user's badges
userBadgeSchema.statics.getUserBadges = async function (userId) {
  // Convert to ObjectId if string
  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  
  console.log("📛 getUserBadges querying for:", userObjectId);
  const userBadges = await this.find({ user: userObjectId }).lean();
  console.log("📛 Found userBadges in DB:", userBadges.length);
  
  // Build response with all badges (earned and locked)
  const allBadges = Object.values(BADGE_DEFINITIONS).map(badge => {
    const earnedBadge = userBadges.find(ub => ub.badgeId === badge.id);
    return {
      ...badge,
      earned: !!earnedBadge,
      earnedAt: earnedBadge?.earnedAt || null,
      valueSnapshot: earnedBadge?.valueSnapshot || null,
    };
  });
  
  return allBadges;
};

// Static method to get only earned badges
userBadgeSchema.statics.getEarnedBadges = async function (userId) {
  // Convert to ObjectId if string
  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  
  console.log("📛 getEarnedBadges querying for:", userObjectId);
  const userBadges = await this.find({ user: userObjectId }).lean();
  console.log("📛 Found earned badges in DB:", userBadges.length, userBadges.map(b => b.badgeId));
  
  return userBadges.map(ub => {
    const badgeDef = Object.values(BADGE_DEFINITIONS).find(b => b.id === ub.badgeId);
    return {
      ...badgeDef,
      earned: true,
      earnedAt: ub.earnedAt,
      valueSnapshot: ub.valueSnapshot,
    };
  });
};

export const UserBadge = mongoose.model("UserBadge", userBadgeSchema);
