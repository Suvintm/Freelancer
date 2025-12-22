import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Profile } from "../models/Profile.js";
import { Portfolio } from "../models/Portfolio.js";
import { Reel } from "../models/Reel.js";
import User from "../models/User.js";
import { UserBadge, BADGE_DEFINITIONS } from "../models/Badge.js";
import logger from "../utils/logger.js";

/**
 * Badge Service
 * Evaluates and awards badges based on real database metrics
 */
class BadgeService {
  /**
   * Check and award all eligible badges for a user
   * @param {String} userId - User ID to evaluate
   * @returns {Object} Results of badge evaluation
   */
  async evaluateAllBadges(userId) {
    const results = {
      newBadges: [],
      existingBadges: [],
      errors: [],
    };

    try {
      console.log("🏆 evaluateAllBadges started for userId:", userId);
      
      // Get user data
      const user = await User.findById(userId);
      if (!user || user.role !== "editor") {
        console.log("🏆 User not found or not an editor:", user?.role);
        return { error: "User not found or not an editor" };
      }
      
      console.log("🏆 User found:", user.name, "- Evaluating", Object.values(BADGE_DEFINITIONS).length, "badges");

      // Evaluate each badge
      for (const badgeDef of Object.values(BADGE_DEFINITIONS)) {
        try {
          const { earned, value } = await this.checkBadgeCriteria(userId, badgeDef);
          
          console.log(`🏆 Badge ${badgeDef.id}: earned=${earned}`, value);
          
          if (earned) {
            const result = await UserBadge.awardBadge(userId, badgeDef.id, value);
            console.log(`🏆 Award result for ${badgeDef.id}:`, result.success, result.message);
            
            if (result.success) {
              results.newBadges.push({ ...badgeDef, value });
            } else {
              results.existingBadges.push(badgeDef.id);
            }
          }
        } catch (badgeError) {
          console.log(`🏆 Error for ${badgeDef.id}:`, badgeError.message);
          results.errors.push({ badge: badgeDef.id, error: badgeError.message });
        }
      }

      console.log(`🏆 Evaluation complete: ${results.newBadges.length} new, ${results.existingBadges.length} existing`);
      logger.info(`Badge evaluation for ${userId}: ${results.newBadges.length} new badges`);
      return results;
    } catch (error) {
      logger.error(`Badge evaluation error for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a specific badge criteria is met
   * @param {String} userId - User ID
   * @param {Object} badgeDef - Badge definition
   * @returns {Object} { earned: boolean, value: any }
   */
  async checkBadgeCriteria(userId, badgeDef) {
    const { criteria } = badgeDef;

    switch (criteria.type) {
      case "orders_completed":
        return this.checkOrdersCompleted(userId, criteria.threshold);
      
      case "avg_rating":
        return this.checkAvgRating(userId, criteria.threshold, criteria.minReviews);
      
      case "early_deliveries":
        return this.checkEarlyDeliveries(userId, criteria.threshold, criteria.earlyPercentage);
      
      case "portfolio_count":
        return this.checkPortfolioCount(userId, criteria.threshold);
      
      case "reels_count":
        return this.checkReelsCount(userId, criteria.threshold);
      
      case "verified_profile":
        return this.checkVerifiedProfile(userId, criteria.minProfileCompletion);
      
      case "total_earnings":
        return this.checkTotalEarnings(userId, criteria.threshold);
      
      case "profile_views":
        return this.checkProfileViews(userId, criteria.threshold);
      
      default:
        return { earned: false, value: null };
    }
  }

  /**
   * Helper to convert string to ObjectId
   */
  toObjectId(id) {
    return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  }

  /**
   * Check orders completed count
   */
  async checkOrdersCompleted(userId, threshold) {
    const count = await Order.countDocuments({
      editor: this.toObjectId(userId),
      status: "completed",
    });
    
    return {
      earned: count >= threshold,
      value: { ordersCompleted: count, threshold },
    };
  }

  /**
   * Check average rating
   */
  async checkAvgRating(userId, ratingThreshold, minReviews) {
    const profile = await Profile.findOne({ user: userId });
    
    if (!profile || !profile.ratingStats) {
      return { earned: false, value: null };
    }

    const { averageRating, totalReviews } = profile.ratingStats;
    
    return {
      earned: averageRating >= ratingThreshold && totalReviews >= minReviews,
      value: { averageRating, totalReviews, threshold: ratingThreshold },
    };
  }

  /**
   * Check early deliveries (delivered within first 80% of time)
   * An order is "early" if it was completed/submitted before 80% of the deadline time elapsed
   */
  async checkEarlyDeliveries(userId, threshold, earlyPercentage) {
    // Get all completed orders with timing info
    const orders = await Order.find({
      editor: this.toObjectId(userId),
      status: "completed",
      submittedAt: { $exists: true },
      createdAt: { $exists: true },
      deadline: { $exists: true },
    }).select("createdAt submittedAt deadline");

    let earlyCount = 0;

    for (const order of orders) {
      const orderStart = new Date(order.createdAt);
      const deadline = new Date(order.deadline);
      const submittedAt = new Date(order.submittedAt);

      // Calculate total allowed time
      const totalTime = deadline.getTime() - orderStart.getTime();
      
      // Calculate time used
      const timeUsed = submittedAt.getTime() - orderStart.getTime();
      
      // Calculate percentage of time used
      const percentageUsed = (timeUsed / totalTime) * 100;
      
      // If delivered within first (100 - earlyPercentage)% of time, it's early
      // e.g., earlyPercentage=20 means delivered before 80% of deadline
      if (percentageUsed <= (100 - earlyPercentage)) {
        earlyCount++;
      }
    }

    return {
      earned: earlyCount >= threshold,
      value: { earlyDeliveries: earlyCount, threshold },
    };
  }

  /**
   * Check portfolio count
   */
  async checkPortfolioCount(userId, threshold) {
    const count = await Portfolio.countDocuments({
      user: this.toObjectId(userId),
    });

    return {
      earned: count >= threshold,
      value: { portfolioCount: count, threshold },
    };
  }

  /**
   * Check published reels count
   */
  async checkReelsCount(userId, threshold) {
    const count = await Reel.countDocuments({
      editor: this.toObjectId(userId),
      status: "published",
    });

    return {
      earned: count >= threshold,
      value: { reelsCount: count, threshold },
    };
  }

  /**
   * Check verified profile (KYC + profile completion)
   */
  async checkVerifiedProfile(userId, minProfileCompletion) {
    const user = await User.findById(userId);
    
    if (!user) {
      return { earned: false, value: null };
    }

    const isKycVerified = user.kycStatus === "verified";
    const profileCompletion = user.profileCompletionPercent || 0;
    
    return {
      earned: isKycVerified && profileCompletion >= minProfileCompletion,
      value: { kycVerified: isKycVerified, profileCompletion },
    };
  }

  /**
   * Check total earnings
   */
  async checkTotalEarnings(userId, threshold) {
    const result = await Order.aggregate([
      {
        $match: {
          editor: this.toObjectId(userId),
          status: "completed",
          paymentStatus: "released",
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$editorEarning" },
        },
      },
    ]);

    const totalEarnings = result[0]?.totalEarnings || 0;

    return {
      earned: totalEarnings >= threshold,
      value: { totalEarnings, threshold },
    };
  }

  /**
   * Check profile views
   */
  async checkProfileViews(userId, threshold) {
    const profile = await Profile.findOne({ user: userId });
    const profileViews = profile?.profileViews || 0;

    return {
      earned: profileViews >= threshold,
      value: { profileViews, threshold },
    };
  }

  /**
   * Get badge progress for a user (how close they are to each badge)
   */
  async getBadgeProgress(userId) {
    const progress = [];

    for (const badgeDef of Object.values(BADGE_DEFINITIONS)) {
      const { earned, value } = await this.checkBadgeCriteria(userId, badgeDef);
      
      let current = 0;
      let target = 0;
      let percentage = 0;

      // Calculate progress based on badge type
      switch (badgeDef.criteria.type) {
        case "orders_completed":
          current = value?.ordersCompleted || 0;
          target = badgeDef.criteria.threshold;
          break;
        case "avg_rating":
          current = value?.totalReviews || 0;
          target = badgeDef.criteria.minReviews;
          break;
        case "early_deliveries":
          current = value?.earlyDeliveries || 0;
          target = badgeDef.criteria.threshold;
          break;
        case "portfolio_count":
          current = value?.portfolioCount || 0;
          target = badgeDef.criteria.threshold;
          break;
        case "reels_count":
          current = value?.reelsCount || 0;
          target = badgeDef.criteria.threshold;
          break;
        case "total_earnings":
          current = value?.totalEarnings || 0;
          target = badgeDef.criteria.threshold;
          break;
        case "profile_views":
          current = value?.profileViews || 0;
          target = badgeDef.criteria.threshold;
          break;
        case "verified_profile":
          current = value?.profileCompletion || 0;
          target = badgeDef.criteria.minProfileCompletion;
          break;
      }

      percentage = Math.min(Math.round((current / target) * 100), 100);

      progress.push({
        ...badgeDef,
        earned,
        current,
        target,
        percentage,
      });
    }

    return progress;
  }
}

export const badgeService = new BadgeService();
export default badgeService;
