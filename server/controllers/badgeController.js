import { UserBadge, BADGE_DEFINITIONS } from "../models/Badge.js";
import badgeService from "../services/badgeService.js";
import logger from "../utils/logger.js";

/**
 * @desc    Get all badges with user's earned status
 * @route   GET /api/badges
 * @access  Private (Editor)
 */
export const getAllBadges = async (req, res) => {
  try {
    const userId = req.user._id;
    const badges = await UserBadge.getUserBadges(userId);

    res.status(200).json({
      success: true,
      badges,
    });
  } catch (error) {
    logger.error("Get all badges error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch badges",
      error: error.message,
    });
  }
};

/**
 * @desc    Get badges for a specific user (public)
 * @route   GET /api/badges/user/:userId
 * @access  Public
 */
export const getUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log("📛 getUserBadges called for userId:", userId);
    
    // Get only earned badges for public view
    const earnedBadges = await UserBadge.getEarnedBadges(userId);
    
    console.log("📛 Earned badges found:", earnedBadges.length, earnedBadges.map(b => b.name));

    res.status(200).json({
      success: true,
      badges: earnedBadges,
    });
  } catch (error) {
    logger.error("Get user badges error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user badges",
      error: error.message,
    });
  }
};

/**
 * @desc    Get badge progress for current user
 * @route   GET /api/badges/progress
 * @access  Private (Editor)
 */
export const getBadgeProgress = async (req, res) => {
  try {
    console.log("🎯 getBadgeProgress route HIT! User:", req.user?._id, req.user?.role);
    
    const userId = req.user._id;
    
    // First, evaluate and save any new earned badges to DB
    console.log("🎯 Calling evaluateAllBadges...");
    await badgeService.evaluateAllBadges(userId);
    
    // Then get the progress with earned status
    console.log("🎯 Calling getBadgeProgress...");
    const progress = await badgeService.getBadgeProgress(userId);

    res.status(200).json({
      success: true,
      progress,
    });
  } catch (error) {
    console.log("🎯 getBadgeProgress ERROR:", error.message);
    logger.error("Get badge progress error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch badge progress",
      error: error.message,
    });
  }
};

/**
 * @desc    Check and award badges for current user
 * @route   POST /api/badges/evaluate
 * @access  Private (Editor)
 */
export const evaluateBadges = async (req, res) => {
  try {
    const userId = req.user._id;
    const results = await badgeService.evaluateAllBadges(userId);

    res.status(200).json({
      success: true,
      message: results.newBadges.length > 0 
        ? `Congratulations! You earned ${results.newBadges.length} new badge(s)!`
        : "No new badges earned yet. Keep up the great work!",
      results,
    });
  } catch (error) {
    logger.error("Evaluate badges error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to evaluate badges",
      error: error.message,
    });
  }
};

/**
 * @desc    Get badge definitions (for reference)
 * @route   GET /api/badges/definitions
 * @access  Public
 */
export const getBadgeDefinitions = async (req, res) => {
  try {
    const definitions = Object.values(BADGE_DEFINITIONS);
    
    res.status(200).json({
      success: true,
      badges: definitions,
    });
  } catch (error) {
    logger.error("Get badge definitions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch badge definitions",
      error: error.message,
    });
  }
};
