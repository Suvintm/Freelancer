// suvixScoreController.js - Editor Performance Score System
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { Order } from "../models/Order.js";
import { Rating } from "../models/Rating.js";
import { Message } from "../models/Message.js";
import { ApiError } from "../middleware/errorHandler.js";

// Score tier thresholds
const TIERS = [
  { name: "elite", min: 90, max: 100, label: "Elite Editor", color: "#FFD700" },
  { name: "expert", min: 80, max: 89, label: "Expert", color: "#9B59B6" },
  { name: "professional", min: 70, max: 79, label: "Professional", color: "#3498DB" },
  { name: "established", min: 60, max: 69, label: "Established", color: "#27AE60" },
  { name: "rising", min: 50, max: 59, label: "Rising Star", color: "#1ABC9C" },
  { name: "newcomer", min: 0, max: 49, label: "Newcomer", color: "#95A5A6" },
];

// Minimum orders required for eligibility
const MIN_ORDERS_FOR_ELIGIBILITY = 2;

/**
 * Get tier from score
 */
const getTierFromScore = (score) => {
  for (const tier of TIERS) {
    if (score >= tier.min && score <= tier.max) {
      return tier.name;
    }
  }
  return "newcomer";
};

/**
 * Calculate deadline performance score (0-25 points)
 */
const calculateDeadlineScore = (orders) => {
  if (orders.length === 0) return 0;

  let totalPoints = 0;
  let validOrders = 0;

  for (const order of orders) {
    const daysEarly = order.deliveryTiming?.daysEarlyOrLate;
    
    // If no timing data, calculate from dates
    let days = daysEarly;
    if (days === null || days === undefined) {
      if (order.submittedAt && order.deadline) {
        const submitted = new Date(order.submittedAt);
        const deadline = new Date(order.deadline);
        days = Math.ceil((deadline - submitted) / (1000 * 60 * 60 * 24));
      } else {
        continue; // Skip orders without timing data
      }
    }

    validOrders++;

    if (days >= 2) totalPoints += 25;          // 2+ days early
    else if (days >= 1) totalPoints += 22;     // 1 day early
    else if (days >= 0) totalPoints += 20;     // On time
    else if (days >= -1) totalPoints += 10;    // 1 day late
    else if (days >= -2) totalPoints += 5;     // 2 days late
    else totalPoints += 0;                      // Very late
  }

  return validOrders > 0 ? Math.round(totalPoints / validOrders) : 15;
};

/**
 * Calculate ratings score (0-25 points)
 */
const calculateRatingsScore = async (editorId) => {
  const stats = await Rating.calculateEditorStats(editorId);
  const avgRating = stats.averageRating || 0;

  if (avgRating >= 4.8) return 25;
  if (avgRating >= 4.5) return 22;
  if (avgRating >= 4.0) return 18;
  if (avgRating >= 3.5) return 12;
  if (avgRating >= 3.0) return 8;
  return 5;
};

/**
 * Calculate completion rate score (0-20 points)
 */
const calculateCompletionScore = async (editorId) => {
  const [completed, cancelled, rejected] = await Promise.all([
    Order.countDocuments({ editor: editorId, status: "completed" }),
    Order.countDocuments({ editor: editorId, status: "cancelled" }),
    Order.countDocuments({ editor: editorId, status: "rejected" }),
  ]);

  const total = completed + cancelled + rejected;
  if (total === 0) return 15; // Default for new editors

  const rate = (completed / total) * 100;

  if (rate >= 95) return 20;
  if (rate >= 90) return 16;
  if (rate >= 80) return 12;
  if (rate >= 70) return 8;
  return 4;
};

/**
 * Calculate response time score (0-15 points)
 * Based on average time to first response in conversations
 */
const calculateResponseScore = async (editorId) => {
  // Get recent orders where editor responded
  const recentOrders = await Order.find({
    editor: editorId,
    status: { $in: ["completed", "in_progress", "submitted"] },
    acceptedAt: { $exists: true },
    createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
  }).limit(20);

  if (recentOrders.length === 0) return 10; // Default for new editors

  let totalResponseTime = 0;
  let validResponses = 0;

  for (const order of recentOrders) {
    if (order.acceptedAt && order.createdAt) {
      const responseMs = new Date(order.acceptedAt) - new Date(order.createdAt);
      const responseHours = responseMs / (1000 * 60 * 60);
      totalResponseTime += responseHours;
      validResponses++;
    }
  }

  if (validResponses === 0) return 10;

  const avgHours = totalResponseTime / validResponses;

  if (avgHours <= 1) return 15;
  if (avgHours <= 4) return 12;
  if (avgHours <= 12) return 10;
  if (avgHours <= 24) return 6;
  return 3;
};

/**
 * Calculate revision efficiency score (0-10 points)
 */
const calculateRevisionScore = (orders) => {
  if (orders.length === 0) return 7; // Default

  const totalRevisions = orders.reduce((sum, order) => sum + (order.revisionCount || 0), 0);
  const avgRevisions = totalRevisions / orders.length;

  if (avgRevisions <= 1) return 10;
  if (avgRevisions <= 2) return 8;
  if (avgRevisions <= 3) return 5;
  return 2;
};

/**
 * Calculate experience bonus (0-5 points)
 */
const calculateExperienceScore = (orderCount) => {
  if (orderCount >= 50) return 5;
  if (orderCount >= 25) return 4;
  if (orderCount >= 10) return 3;
  if (orderCount >= 5) return 2;
  return 1;
};

/**
 * 📊 Main Score Calculation Function
 */
export const calculateSuvixScore = async (editorId) => {
  // Get completed orders
  const completedOrders = await Order.find({
    editor: editorId,
    status: "completed",
  }).lean();

  const orderCount = completedOrders.length;
  const isEligible = orderCount >= MIN_ORDERS_FOR_ELIGIBILITY;

  // Calculate each component
  const deadline = calculateDeadlineScore(completedOrders);
  const ratings = await calculateRatingsScore(editorId);
  const completion = await calculateCompletionScore(editorId);
  const response = await calculateResponseScore(editorId);
  const revisions = calculateRevisionScore(completedOrders);
  const experience = calculateExperienceScore(orderCount);

  // Sum total (max 100)
  const total = Math.min(
    Math.round(deadline + ratings + completion + response + revisions + experience),
    100
  );

  // Determine tier
  const tier = getTierFromScore(total);

  return {
    total,
    tier,
    isEligible,
    completedOrders: orderCount,
    components: {
      deadline,
      ratings,
      completion,
      response,
      revisions,
      experience,
    },
    lastCalculated: new Date(),
  };
};

/**
 * 🔄 Recalculate and save score for an editor
 */
export const recalculateEditorScore = async (editorId) => {
  const scoreData = await calculateSuvixScore(editorId);

  await User.findByIdAndUpdate(editorId, {
    suvixScore: scoreData,
  });

  return scoreData;
};

/**
 * 📊 Get Editor's Suvix Score (Public)
 * GET /api/suvix-score/:editorId
 */
export const getEditorScore = asyncHandler(async (req, res) => {
  const { editorId } = req.params;

  const user = await User.findById(editorId).select("name profilePicture suvixScore").lean();

  if (!user) {
    throw new ApiError(404, "Editor not found");
  }

  // Recalculate if never calculated or older than 24 hours
  let score = user.suvixScore;
  const needsRecalc = !score?.lastCalculated || 
    (new Date() - new Date(score.lastCalculated)) > 24 * 60 * 60 * 1000;

  if (needsRecalc) {
    score = await recalculateEditorScore(editorId);
  }

  // Get tier info
  const tierInfo = TIERS.find(t => t.name === score.tier) || TIERS[5];

  res.json({
    success: true,
    score: {
      total: score.total,
      tier: score.tier,
      tierLabel: tierInfo.label,
      tierColor: tierInfo.color,
      isEligible: score.isEligible,
      completedOrders: score.completedOrders,
    },
    tiers: TIERS,
  });
});

/**
 * 📈 Get Editor's Score Breakdown (Editor's own analytics)
 * GET /api/suvix-score/my/breakdown
 */
export const getMyScoreBreakdown = asyncHandler(async (req, res) => {
  const editorId = req.user._id;

  // Force recalculate for fresh data
  const score = await recalculateEditorScore(editorId);
  const tierInfo = TIERS.find(t => t.name === score.tier) || TIERS[5];

  // Get additional stats
  const [avgRating, totalOrders, completionRate] = await Promise.all([
    Rating.calculateEditorStats(editorId),
    Order.countDocuments({ editor: editorId }),
    (async () => {
      const completed = await Order.countDocuments({ editor: editorId, status: "completed" });
      const total = await Order.countDocuments({ 
        editor: editorId, 
        status: { $in: ["completed", "cancelled", "rejected"] } 
      });
      return total > 0 ? Math.round((completed / total) * 100) : 100;
    })(),
  ]);

  res.json({
    success: true,
    score: {
      total: score.total,
      tier: score.tier,
      tierLabel: tierInfo.label,
      tierColor: tierInfo.color,
      isEligible: score.isEligible,
      completedOrders: score.completedOrders,
      lastCalculated: score.lastCalculated,
    },
    components: {
      deadline: {
        score: score.components.deadline,
        maxScore: 25,
        label: "Deadline Performance",
        description: "How often you deliver on or before deadline",
        icon: "🎯",
      },
      ratings: {
        score: score.components.ratings,
        maxScore: 25,
        label: "Client Ratings",
        description: "Average rating from your clients",
        icon: "⭐",
        avgRating: avgRating.averageRating,
      },
      completion: {
        score: score.components.completion,
        maxScore: 20,
        label: "Completion Rate",
        description: "Percentage of orders you complete",
        icon: "✅",
        rate: completionRate,
      },
      response: {
        score: score.components.response,
        maxScore: 15,
        label: "Response Time",
        description: "How quickly you respond to requests",
        icon: "⚡",
      },
      revisions: {
        score: score.components.revisions,
        maxScore: 10,
        label: "Revision Efficiency",
        description: "Fewer revisions = better first delivery",
        icon: "🔄",
      },
      experience: {
        score: score.components.experience,
        maxScore: 5,
        label: "Experience",
        description: "Total completed orders",
        icon: "🏆",
        totalOrders: score.completedOrders,
      },
    },
    tiers: TIERS,
    tips: generateScoreTips(score.components),
  });
});

/**
 * Generate improvement tips based on score components
 */
const generateScoreTips = (components) => {
  const tips = [];

  if (components.deadline < 20) {
    tips.push({
      icon: "🎯",
      title: "Improve Deadline Performance",
      message: "Try to submit work 1-2 days before the deadline for bonus points!",
    });
  }

  if (components.ratings < 20) {
    tips.push({
      icon: "⭐",
      title: "Boost Your Ratings",
      message: "Focus on communication and quality to get 5-star reviews.",
    });
  }

  if (components.response < 12) {
    tips.push({
      icon: "⚡",
      title: "Respond Faster",
      message: "Accept or respond to project requests within 4 hours for best results.",
    });
  }

  if (components.revisions < 7) {
    tips.push({
      icon: "🔄",
      title: "Reduce Revisions",
      message: "Carefully review requirements before delivering to minimize revisions.",
    });
  }

  if (tips.length === 0) {
    tips.push({
      icon: "🌟",
      title: "Great Work!",
      message: "Keep up the excellent performance to maintain your high score!",
    });
  }

  return tips;
};

/**
 * 🔄 Admin: Force recalculate all scores
 * POST /api/suvix-score/admin/recalculate-all
 */
export const recalculateAllScores = asyncHandler(async (req, res) => {
  const editors = await User.find({ role: "editor" }).select("_id");
  
  let updated = 0;
  for (const editor of editors) {
    await recalculateEditorScore(editor._id);
    updated++;
  }

  res.json({
    success: true,
    message: `Recalculated scores for ${updated} editors`,
    count: updated,
  });
});

export { TIERS };
