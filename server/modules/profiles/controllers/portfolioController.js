import { Portfolio } from "../models/Portfolio.js";
import { Reel } from "../../reels/models/Reel.js";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import logger from "../../../utils/logger.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";
import { attachUserMetadata } from "../../../utils/hybridJoin.js";

// Max file sizes
const MAX_VIDEO_SIZE = 150 * 1024 * 1024;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_ORIGINAL_FILES = 5;

// Allowed file types
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const HLS_EAGER_TRANSFORMS = [
  { streaming_profile: "full_hd", format: "m3u8" },
  { width: 360, height: 640, crop: "fill", gravity: "auto", format: "jpg" }
];

const validateFile = (file) => {
  if (!file) return true;
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);

  if (!isVideo && !isImage) {
    throw new ApiError(400, "Invalid file type");
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    throw new ApiError(400, "Video too large (max 150MB)");
  }
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new ApiError(400, "Image too large (max 10MB)");
  }
  return true;
};

// Helper for consistency
const mapPortfolio = (p) => {
  if (!p) return null;
  const data = p.toObject ? p.toObject({ virtuals: true }) : p;
  return {
    ...data,
    id: data._id,
    userId: data.user,
    uploadedAt: data.uploadedAt,
    mediaUrl: data.hlsUrl || data.originalClips?.[0] || data.originalClip || "",
    thumbnail: data.thumbnailUrl,
    userInfo: data.userInfo || null
  };
};

/**
 * Create Portfolio (MongoDB)
 * POST /api/portfolio
 */
export const createPortfolio = asyncHandler(async (req, res) => {
  const { title, description, hashtags, location, taggedUsers, isAIContent } = req.body;
  const userId = req.user.id; // PostgreSQL UUID
  let originalClips = [];
  let editedClip = "";
  let totalSizeBytes = 0;

  if (req.files?.originalClip) {
    const files = Array.isArray(req.files.originalClip) ? req.files.originalClip : [req.files.originalClip];
    if (files.length > MAX_ORIGINAL_FILES) throw new ApiError(400, `Max ${MAX_ORIGINAL_FILES} files`);
    for (const file of files) {
      validateFile(file);
      const result = await uploadToCloudinary(file.buffer, "portfolio");
      originalClips.push(result.url);
      totalSizeBytes += file.size || 0;
    }
  }

  let cloudinaryPublicId = "";
  let hlsUrl = "";
  let thumbnailUrl = "";
  let processingStatus = "pending";

  if (req.files?.editedClip?.[0]) {
    const file = req.files.editedClip[0];
    validateFile(file);
    const result = await uploadToCloudinary(file.buffer, "portfolio", {
      eager: HLS_EAGER_TRANSFORMS,
      eager_async: true
    });
    editedClip = result.url;
    cloudinaryPublicId = result.public_id;
    totalSizeBytes += file.size || 0;
    hlsUrl = editedClip.replace("/upload/", "/upload/sp_full_hd/").replace(/\.[^.]+$/, ".m3u8");
    thumbnailUrl = editedClip.replace("/upload/", "/upload/w_360,h_640,c_fill,g_auto/").replace(/\.[^.]+$/, ".jpg");
    processingStatus = "processing";
  }

  const portfolio = await Portfolio.create({
    user: userId,
    title: title?.trim() || "",
    description: description?.trim() || "",
    originalClips,
    editedClip,
    hlsUrl,
    thumbnailUrl,
    processingStatus,
    cloudinaryPublicId,
    hashtags: Array.isArray(hashtags) ? hashtags : (typeof hashtags === 'string' ? hashtags.split(',') : []),
    location: location || "",
    isAIContent: isAIContent === "true" || isAIContent === true,
    totalSizeBytes
  });

  await createNotification({
    recipient: userId,
    type: "success",
    title: "Portfolio Added",
    message: `Your portfolio "${portfolio.title}" has been added successfully.`,
    link: "/editor-profile",
  });

  res.status(201).json({
    success: true,
    message: "Portfolio created successfully.",
    portfolio: mapPortfolio(portfolio),
  });
});

/**
 * Get All Portfolios (MongoDB)
 * GET /api/portfolio
 */
export const getPortfolios = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const [portfolios, total] = await Promise.all([
    Portfolio.find({ user: userId }).sort({ uploadedAt: -1 }).skip(skip).limit(limit).lean(),
    Portfolio.countDocuments({ user: userId })
  ]);

  const portfoliosWithUser = await attachUserMetadata(portfolios, 'user');

  res.status(200).json({
    success: true,
    portfolios: portfoliosWithUser.map(mapPortfolio),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

/**
 * Get Single Portfolio (MongoDB)
 * GET /api/portfolio/:id
 */
export const getPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findById(req.params.id).lean();
  if (!portfolio) throw new ApiError(404, "Portfolio not found");

  const [portfolioWithUser] = await attachUserMetadata([portfolio], 'user');

  res.status(200).json({
    success: true,
    portfolio: mapPortfolio(portfolioWithUser)
  });
});

/**
 * Update Portfolio (MongoDB)
 * PATCH /api/portfolio/:id
 */
export const updatePortfolio = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.id;
  
  const portfolio = await Portfolio.findOne({ _id: req.params.id, user: userId });
  if (!portfolio) throw new ApiError(404, "Portfolio not found or unauthorized");

  if (title !== undefined) portfolio.title = title.trim();
  if (description !== undefined) portfolio.description = description.trim();
  
  await portfolio.save();

  res.status(200).json({
    success: true,
    message: "Portfolio updated successfully.",
    portfolio: mapPortfolio(portfolio)
  });
});

/**
 * Delete Portfolio (MongoDB)
 * DELETE /api/portfolio/:id
 */
export const deletePortfolio = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const portfolioId = req.params.id;

  const portfolio = await Portfolio.findOne({ _id: portfolioId, user: userId });
  if (!portfolio) throw new ApiError(404, "Portfolio not found or unauthorized");

  // Delete associated reels
  await Reel.deleteMany({ portfolio: portfolioId });
  await Portfolio.deleteOne({ _id: portfolioId });

  logger.info(`Portfolio deleted: ${portfolioId} and its associated reels (MongoDB)`);

  res.status(200).json({
    success: true,
    message: "Portfolio deleted successfully",
  });
});

/**
 * Get Public Portfolios (MongoDB)
 * GET /api/portfolio/public/:userId
 */
export const getPortfoliosByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const [portfolios, total] = await Promise.all([
    Portfolio.find({ user: userId }).sort({ uploadedAt: -1 }).skip(skip).limit(limit).lean(),
    Portfolio.countDocuments({ user: userId })
  ]);

  const portfoliosWithUser = await attachUserMetadata(portfolios, 'user');

  res.status(200).json({
    success: true,
    portfolios: portfoliosWithUser.map(mapPortfolio),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export default { createPortfolio, getPortfolios, getPortfolio, updatePortfolio, deletePortfolio, getPortfoliosByUserId };
