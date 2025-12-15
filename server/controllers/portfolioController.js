import { Portfolio } from "../models/Portfolio.js";
import { Reel } from "../models/Reel.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";
import { createNotification } from "./notificationController.js";

// Max file sizes
const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // 100MB for videos
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 10MB for images
const MAX_ORIGINAL_FILES = 5; // Max 5 original clips

// Allowed file types
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Helper to validate file
const validateFile = (file, type) => {
  if (!file) return true;

  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);

  if (!isVideo && !isImage) {
    throw new ApiError(400, `Invalid file type: ${file.mimetype}. Allowed: MP4, MOV, WebM, AVI, JPEG, PNG, WebP, GIF`);
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    throw new ApiError(400, `Video file must be less than 100MB. Got: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new ApiError(400, `Image file must be less than 10MB`);
  }

  return true;
};

// ============ CREATE PORTFOLIO ============
export const createPortfolio = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  let originalClips = [];
  let editedClip = "";

  // Handle multiple original clips
  if (req.files?.originalClip) {
    const files = Array.isArray(req.files.originalClip)
      ? req.files.originalClip
      : [req.files.originalClip];

    if (files.length > MAX_ORIGINAL_FILES) {
      throw new ApiError(400, `Maximum ${MAX_ORIGINAL_FILES} original files allowed`);
    }

    // Upload each file
    for (const file of files) {
      validateFile(file, "video");
      const result = await uploadToCloudinary(file.buffer, "portfolio");
      originalClips.push(result.url);
    }
  }

  // Validate and upload edited clip (single file)
  if (req.files?.editedClip?.[0]) {
    const file = req.files.editedClip[0];
    validateFile(file, "video");
    const result = await uploadToCloudinary(file.buffer, "portfolio");
    editedClip = result.url;
  }

  // Create portfolio
  const portfolio = await Portfolio.create({
    user: req.user._id,
    title: title?.trim().substring(0, 100) || "",
    description: description?.trim().substring(0, 500) || "",
    originalClip: originalClips.length > 0 ? originalClips[0] : "", // First clip for backward compatibility
    originalClips: originalClips, // All clips in array
    editedClip,
  });

  const populatedPortfolio = await Portfolio.findById(portfolio._id).populate(
    "user",
    "name email role profilePicture profileCompleted"
  );

  logger.info(`Portfolio created: ${portfolio._id} by user: ${req.user._id}, originalClips: ${originalClips.length}`);

  // Trigger Notification
  await createNotification({
    recipient: req.user._id,
    type: "success",
    title: "Portfolio Added",
    message: `Your portfolio "${portfolio.title}" has been added successfully.`,
    link: "/editor-profile",
  });

  res.status(201).json({
    success: true,
    message: "Portfolio created successfully.",
    portfolio: populatedPortfolio,
  });
});

// ============ GET ALL PORTFOLIOS (for current user) ============
export const getPortfolios = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const [portfolios, total] = await Promise.all([
    Portfolio.find({ user: req.user._id })
      .populate("user", "name email role profilePicture profileCompleted")
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit),
    Portfolio.countDocuments({ user: req.user._id }),
  ]);

  res.status(200).json({
    success: true,
    portfolios,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// ============ GET SINGLE PORTFOLIO ============
export const getPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findById(req.params.id).populate(
    "user",
    "name email role profilePicture profileCompleted"
  );

  if (!portfolio) {
    throw new ApiError(404, "Portfolio not found");
  }

  res.status(200).json({
    success: true,
    portfolio,
  });
});

// ============ UPDATE PORTFOLIO ============
export const updatePortfolio = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const portfolio = await Portfolio.findById(req.params.id);

  if (!portfolio) {
    throw new ApiError(404, "Portfolio not found");
  }

  if (portfolio.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to update this portfolio");
  }

  if (title !== undefined) {
    portfolio.title = title.trim().substring(0, 100);
  }
  if (description !== undefined) {
    portfolio.description = description.trim().substring(0, 500);
  }

  // Handle multiple original clips update
  if (req.files?.originalClip) {
    const files = Array.isArray(req.files.originalClip)
      ? req.files.originalClip
      : [req.files.originalClip];

    if (files.length > MAX_ORIGINAL_FILES) {
      throw new ApiError(400, `Maximum ${MAX_ORIGINAL_FILES} original files allowed`);
    }

    const originalClips = [];
    for (const file of files) {
      validateFile(file, "video");
      const result = await uploadToCloudinary(file.buffer, "portfolio");
      originalClips.push(result.url);
    }
    portfolio.originalClips = originalClips;
    portfolio.originalClip = originalClips[0] || "";
  }

  if (req.files?.editedClip?.[0]) {
    const file = req.files.editedClip[0];
    validateFile(file, "video");
    const result = await uploadToCloudinary(file.buffer, "portfolio");
    portfolio.editedClip = result.url;
  }

  await portfolio.save();

  const populatedPortfolio = await Portfolio.findById(portfolio._id).populate(
    "user",
    "name email role profilePicture profileCompleted"
  );

  logger.info(`Portfolio updated: ${portfolio._id}`);

  // Trigger Notification
  await createNotification({
    recipient: req.user._id,
    type: "info",
    title: "Portfolio Updated",
    message: `Your portfolio "${portfolio.title}" has been updated.`,
    link: "/editor-profile",
  });

  res.status(200).json({
    success: true,
    message: "Portfolio updated successfully.",
    portfolio: populatedPortfolio,
  });
});

// ============ DELETE PORTFOLIO ============
export const deletePortfolio = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findById(req.params.id);

  if (!portfolio) {
    throw new ApiError(404, "Portfolio not found");
  }

  if (portfolio.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to delete this portfolio");
  }

  // Delete associated reels first
  logger.info(`Deleting associated reels for portfolio: ${req.params.id}`);
  const deleteResult = await Reel.deleteMany({ portfolio: req.params.id });
  logger.info(`Deleted ${deleteResult.deletedCount} reels`);

  await Portfolio.findByIdAndDelete(req.params.id);

  // Recalculate storage after delete
  try {
    const { calculateStorageUsed } = await import("./storageController.js");
    const User = (await import("../models/User.js")).default;
    const storageUsed = await calculateStorageUsed(req.user._id);
    await User.findByIdAndUpdate(req.user._id, { 
      storageUsed,
      storageLastCalculated: new Date()
    });
    logger.info(`Storage recalculated after delete: ${storageUsed} bytes`);
  } catch (err) {
    logger.warn("Failed to recalculate storage after delete:", err.message);
  }

  logger.info(`Portfolio deleted: ${req.params.id}`);

  res.status(200).json({
    success: true,
    message: "Portfolio deleted successfully",
  });
});

// ============ GET PORTFOLIOS BY USER ID (PUBLIC) ============
export const getPortfoliosByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const [portfolios, total] = await Promise.all([
    Portfolio.find({ user: userId })
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit),
    Portfolio.countDocuments({ user: userId }),
  ]);

  res.status(200).json({
    success: true,
    portfolios,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
