import asyncHandler from "express-async-handler";
import { Rating } from "../models/Rating.js";
import { Order } from "../models/Order.js";
import { Profile } from "../models/Profile.js";
import { ApiError } from "../middleware/errorHandler.js";
import { createNotification } from "./notificationController.js";

/**
 * ⭐ Submit Rating (Client Only)
 * POST /api/ratings/:orderId
 */
export const submitRating = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { overall, quality, communication, deliverySpeed, review } = req.body;

  // Validate ratings
  if (!overall || !quality || !communication || !deliverySpeed) {
    throw new ApiError(400, "All rating criteria are required");
  }

  const validateRating = (val, name) => {
    if (val < 1 || val > 5) {
      throw new ApiError(400, `${name} must be between 1 and 5`);
    }
  };

  validateRating(overall, "Overall rating");
  validateRating(quality, "Quality rating");
  validateRating(communication, "Communication rating");
  validateRating(deliverySpeed, "Delivery speed rating");

  // Get order
  const order = await Order.findById(orderId)
    .populate("client", "name")
    .populate("editor", "name");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only client can rate
  if (order.client._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the client can rate this order");
  }

  // Order must be completed or submitted
  if (!["submitted", "completed"].includes(order.status)) {
    throw new ApiError(400, "Order must be submitted or completed to rate");
  }

  // Check if already rated
  const existingRating = await Rating.findOne({ order: orderId });
  if (existingRating) {
    throw new ApiError(400, "You have already rated this order");
  }

  // Create rating
  const rating = await Rating.create({
    order: orderId,
    reviewer: req.user._id,
    reviewee: order.editor._id,
    overall,
    quality,
    communication,
    deliverySpeed,
    review: review || "",
  });

  // Mark order as rated
  order.isRated = true;
  await order.save();

  // Update editor's profile stats
  const stats = await Rating.calculateEditorStats(order.editor._id);
  await Profile.findOneAndUpdate(
    { user: order.editor._id },
    {
      $set: {
        "ratingStats.averageRating": stats.averageRating,
        "ratingStats.totalReviews": stats.totalReviews,
        "ratingStats.qualityAvg": stats.qualityAvg,
        "ratingStats.communicationAvg": stats.communicationAvg,
        "ratingStats.speedAvg": stats.speedAvg,
      },
    },
    { upsert: false }
  );

  // Notify editor
  await createNotification({
    recipient: order.editor._id,
    type: "success",
    title: "⭐ New Review Received!",
    message: `${req.user.name} gave you ${overall} stars for "${order.title}"`,
    link: `/profile`,
  });

  res.status(201).json({
    success: true,
    message: "Rating submitted successfully",
    rating,
  });
});

/**
 * 📋 Get Editor Ratings
 * GET /api/ratings/editor/:editorId
 */
export const getEditorRatings = asyncHandler(async (req, res) => {
  const { editorId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const ratings = await Rating.find({
    reviewee: editorId,
    status: "published",
  })
    .populate("reviewer", "name profilePicture")
    .populate("order", "title")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Rating.countDocuments({
    reviewee: editorId,
    status: "published",
  });

  const stats = await Rating.calculateEditorStats(editorId);

  res.json({
    success: true,
    stats,
    ratings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * ✍️ Editor Respond to Rating
 * POST /api/ratings/:ratingId/respond
 */
export const respondToRating = asyncHandler(async (req, res) => {
  const { ratingId } = req.params;
  const { response } = req.body;

  if (!response || response.trim().length < 10) {
    throw new ApiError(400, "Response must be at least 10 characters");
  }

  const rating = await Rating.findById(ratingId);

  if (!rating) {
    throw new ApiError(404, "Rating not found");
  }

  // Only the reviewee (editor) can respond
  if (rating.reviewee.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the editor can respond to this review");
  }

  // Can only respond once
  if (rating.editorResponse) {
    throw new ApiError(400, "You have already responded to this review");
  }

  rating.editorResponse = response.trim();
  rating.editorRespondedAt = new Date();
  await rating.save();

  res.json({
    success: true,
    message: "Response added successfully",
    rating,
  });
});

/**
 * ✅ Check if order is rated
 * GET /api/ratings/check/:orderId
 */
export const checkOrderRating = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const rating = await Rating.findOne({ order: orderId });

  res.json({
    success: true,
    isRated: !!rating,
    rating: rating || null,
  });
});

/**
 * 📊 Get Editor Stats Summary
 * GET /api/ratings/stats/:editorId
 */
export const getEditorStats = asyncHandler(async (req, res) => {
  const { editorId } = req.params;

  const stats = await Rating.calculateEditorStats(editorId);

  res.json({
    success: true,
    stats,
  });
});
