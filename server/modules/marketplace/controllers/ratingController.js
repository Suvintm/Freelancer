/**
 * Rating Controller - Handles client reviews and editor ratings (Prisma/PostgreSQL)
 */
import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";

const calculateEditorStats = async (editorId) => {
  const stats = await prisma.rating.aggregate({
    where: { reviewee_id: editorId, status: "published" },
    _avg: {
      overall: true,
      quality: true,
      communication: true,
      delivery_speed: true
    },
    _count: { id: true }
  });

  return {
    averageRating: Number(stats._avg.overall) || 0,
    totalReviews: stats._count.id,
    qualityAvg: Number(stats._avg.quality) || 0,
    communicationAvg: Number(stats._avg.communication) || 0,
    speedAvg: Number(stats._avg.delivery_speed) || 0
  };
};

// ============ SUBMIT RATING ============
export const submitRating = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { overall, quality, communication, deliverySpeed, review } = req.body;
  const userId = req.user.id;

  if (!overall || !quality || !communication || !deliverySpeed) {
    throw new ApiError(400, "All rating criteria are required");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, client_id: true, editor_id: true, status: true, title: true }
  });

  if (!order) throw new ApiError(404, "Order not found");
  if (order.client_id !== userId) throw new ApiError(403, "Only the client can rate");
  if (!["submitted", "completed"].includes(order.status)) {
    throw new ApiError(400, "Order must be submitted or completed to rate");
  }

  const existingRating = await prisma.rating.findUnique({ where: { order_id: orderId } });
  if (existingRating) throw new ApiError(400, "Already rated");

  const rating = await prisma.$transaction(async (tx) => {
    const newRating = await tx.rating.create({
      data: {
        order_id: orderId,
        reviewer_id: userId,
        reviewee_id: order.editor_id,
        overall: parseInt(overall),
        quality: parseInt(quality),
        communication: parseInt(communication),
        delivery_speed: parseInt(deliverySpeed),
        review: review || "",
        status: "published"
      }
    });

    await tx.order.update({
      where: { id: orderId },
      data: { is_rated: true }
    });

    return newRating;
  });

  // Update profile stats (Async)
  const stats = await calculateEditorStats(order.editor_id);
  await prisma.userProfile.update({
    where: { user_id: order.editor_id },
    data: { rating_stats: stats }
  });

  await createNotification({
    recipient: order.editor_id,
    type: "success",
    title: "⭐ New Review Received!",
    message: `${req.user.name} gave you ${overall} stars for "${order.title}"`,
    link: `/profile`
  });

  res.status(201).json({ success: true, message: "Rating submitted", rating });
});

// ============ GET EDITOR RATINGS ============
export const getEditorRatings = asyncHandler(async (req, res) => {
  const { editorId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [ratings, total, stats] = await Promise.all([
    prisma.rating.findMany({
      where: { reviewee_id: editorId, status: "published" },
      include: { 
        reviewer: { select: { id: true, name: true, profile_picture: true } },
        order: { select: { title: true } }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    }),
    prisma.rating.count({ where: { reviewee_id: editorId, status: "published" } }),
    calculateEditorStats(editorId)
  ]);

  res.json({
    success: true,
    stats,
    ratings: ratings.map(r => ({
        ...r,
        _id: r.id,
        order: r.order_id,
        reviewer: r.reviewer_id,
        reviewee: r.reviewee_id,
        editorResponse: r.editor_response,
        editorRespondedAt: r.editor_responded_at
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

// ============ EDITOR RESPOND TO RATING ============
export const respondToRating = asyncHandler(async (req, res) => {
  const { ratingId } = req.params;
  const { response } = req.body;
  const userId = req.user.id;

  if (!response || response.trim().length < 10) {
    throw new ApiError(400, "Response too short");
  }

  const rating = await prisma.rating.findUnique({ where: { id: ratingId } });
  if (!rating) throw new ApiError(404, "Rating not found");
  if (rating.reviewee_id !== userId) throw new ApiError(403, "Not authorized");
  if (rating.editor_response) throw new ApiError(400, "Already responded");

  const updatedRating = await prisma.rating.update({
    where: { id: ratingId },
    data: { editor_response: response.trim(), editor_responded_at: new Date() }
  });

  res.json({ success: true, message: "Response added", rating: updatedRating });
});

// ============ CHECK ORDER RATING ============
export const checkOrderRating = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const rating = await prisma.rating.findUnique({ where: { order_id: orderId } });
  res.json({ success: true, isRated: !!rating, rating });
});

// ============ GET EDITOR STATS SUMMARY ============
export const getEditorStats = asyncHandler(async (req, res) => {
  const { editorId } = req.params;
  const stats = await calculateEditorStats(editorId);
  res.json({ success: true, stats });
});


