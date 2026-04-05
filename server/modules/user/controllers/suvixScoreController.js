/**
 * Suvix Score Controller - Editor Performance Score System (Prisma/PostgreSQL)
 */
import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";

// Score tier thresholds
export const TIERS = [
  { name: "elite", min: 90, max: 100, label: "Elite Editor", color: "#FFD700" },
  { name: "expert", min: 80, max: 89, label: "Expert", color: "#9B59B6" },
  { name: "professional", min: 70, max: 79, label: "Professional", color: "#3498DB" },
  { name: "established", min: 60, max: 69, label: "Established", color: "#27AE60" },
  { name: "rising", min: 50, max: 59, label: "Rising Star", color: "#1ABC9C" },
  { name: "newcomer", min: 0, max: 49, label: "Newcomer", color: "#95A5A6" },
];

const MIN_ORDERS_FOR_ELIGIBILITY = 2;

const getTierFromScore = (score) => {
  for (const tier of TIERS) {
    if (score >= tier.min && score <= tier.max) return tier.name;
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
    // In Prisma, we might have stored this in delivery_calculated_at or similar
    // For now, let's use the logic from dates if timing data is missing
    let days = order.delivery_days_early_or_late;
    
    if (days === null || days === undefined) {
      if (order.submitted_at && order.deadline) {
        const submitted = new Date(order.submitted_at);
        const deadline = new Date(order.deadline);
        days = Math.ceil((deadline.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        continue;
      }
    }

    validOrders++;
    if (days >= 2) totalPoints += 25;
    else if (days >= 1) totalPoints += 22;
    else if (days >= 0) totalPoints += 20;
    else if (days >= -1) totalPoints += 10;
    else if (days >= -2) totalPoints += 5;
    else totalPoints += 0;
  }

  return validOrders > 0 ? Math.round(totalPoints / validOrders) : 15;
};

/**
 * Calculate ratings score (0-25 points)
 */
const calculateRatingsScore = async (editorId) => {
  const stats = await prisma.rating.aggregate({
    where: { editor_id: editorId },
    _avg: { rating: true }
  });
  const avgRating = Number(stats._avg.rating) || 0;

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
  const counts = await prisma.order.groupBy({
    by: ['status'],
    where: { editor_id: editorId, status: { in: ['completed', 'cancelled', 'rejected'] } },
    _count: { id: true }
  });

  let completed = 0;
  let total = 0;

  counts.forEach(c => {
    if (c.status === 'completed') completed = c._count.id;
    total += c._count.id;
  });

  if (total === 0) return 15;
  const rate = (completed / total) * 100;

  if (rate >= 95) return 20;
  if (rate >= 90) return 16;
  if (rate >= 80) return 12;
  if (rate >= 70) return 8;
  return 4;
};

/**
 * Calculate response time score (0-15 points)
 */
const calculateResponseScore = async (editorId) => {
  const recentOrders = await prisma.order.findMany({
    where: {
      editor_id: editorId,
      status: { in: ["completed", "in_progress", "submitted"] },
      accepted_at: { not: null },
      created_at: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    },
    take: 20
  });

  if (recentOrders.length === 0) return 10;

  let totalResponseTime = 0;
  let validResponses = 0;

  for (const order of recentOrders) {
    if (order.accepted_at && order.created_at) {
      const responseMs = new Date(order.accepted_at).getTime() - new Date(order.created_at).getTime();
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
  if (orders.length === 0) return 7;
  const totalRevisions = orders.reduce((sum, order) => sum + (order.revision_count || 0), 0);
  const avgRevisions = totalRevisions / orders.length;

  if (avgRevisions <= 1) return 10;
  if (avgRevisions <= 2) return 8;
  if (avgRevisions <= 3) return 5;
  return 2;
};

const calculateExperienceScore = (orderCount) => {
  if (orderCount >= 50) return 5;
  if (orderCount >= 25) return 4;
  if (orderCount >= 10) return 3;
  if (orderCount >= 5) return 2;
  return 1;
};

/**
 * 📊 Main Score Calculation
 */
export const calculateSuvixScore = async (editorId) => {
  const completedOrders = await prisma.order.findMany({
    where: { editor_id: editorId, status: "completed" }
  });

  const orderCount = completedOrders.length;
  const isEligible = orderCount >= MIN_ORDERS_FOR_ELIGIBILITY;

  const deadline = calculateDeadlineScore(completedOrders);
  const ratings = await calculateRatingsScore(editorId);
  const completion = await calculateCompletionScore(editorId);
  const response = await calculateResponseScore(editorId);
  const revisions = calculateRevisionScore(completedOrders);
  const experience = calculateExperienceScore(orderCount);

  const total = Math.min(Math.round(deadline + ratings + completion + response + revisions + experience), 100);
  const tier = getTierFromScore(total);

  return {
    total,
    tier,
    isEligible,
    completedOrders: orderCount,
    components: { deadline, ratings, completion, response, revisions, experience },
    lastCalculated: new Date(),
  };
};

/**
 * 🔄 Recalculate and save score
 */
export const recalculateEditorScore = async (editorId) => {
  const scoreData = await calculateSuvixScore(editorId);
  await prisma.user.update({
    where: { id: editorId },
    data: { suvix_score: scoreData }
  });
  return scoreData;
};

/**
 * 📊 Get Editor's Suvix Score
 */
export const getEditorScore = asyncHandler(async (req, res) => {
  const { editorId } = req.params;
  const user = await prisma.user.findUnique({
    where: { id: editorId },
    select: { id: true, name: true, profile_picture: true, suvix_score: true }
  });

  if (!user) throw new ApiError(404, "Editor not found");

  let score = user.suvix_score;
  const needsRecalc = !score?.lastCalculated || (new Date() - new Date(score.lastCalculated)) > 24 * 60 * 60 * 1000;

  if (needsRecalc) {
    score = await recalculateEditorScore(editorId);
  }

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
 * 📈 Get Editor's Score Breakdown
 */
export const getMyScoreBreakdown = asyncHandler(async (req, res) => {
  const editorId = req.user.id;
  const score = await recalculateEditorScore(editorId);
  const tierInfo = TIERS.find(t => t.name === score.tier) || TIERS[5];

  const [ratingStats, totalOrders, completionData] = await Promise.all([
    prisma.rating.aggregate({ where: { editor_id: editorId }, _avg: { rating: true } }),
    prisma.order.count({ where: { editor_id: editorId } }),
    (async () => {
      const completed = await prisma.order.count({ where: { editor_id: editorId, status: "completed" } });
      const total = await prisma.order.count({ where: { editor_id: editorId, status: { in: ["completed", "cancelled", "rejected"] } } });
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
        deadline: { score: score.components.deadline, maxScore: 25, label: "Deadline Performance", icon: "🎯" },
        ratings: { score: score.components.ratings, maxScore: 25, label: "Client Ratings", icon: "⭐", avgRating: Number(ratingStats._avg.rating) || 0 },
        completion: { score: score.components.completion, maxScore: 20, label: "Completion Rate", icon: "✅", rate: completionData },
        response: { score: score.components.response, maxScore: 15, label: "Response Time", icon: "⚡" },
        revisions: { score: score.components.revisions, maxScore: 10, label: "Revision Efficiency", icon: "🔄" },
        experience: { score: score.components.experience, maxScore: 5, label: "Experience", icon: "🏆", totalOrders: score.completedOrders },
    },
    tiers: TIERS
  });
});






