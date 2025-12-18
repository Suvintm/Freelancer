// bannerController.js - Promotional banner management
import { Banner } from "../models/Banner.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

// ============ ADMIN: UPLOAD BANNER MEDIA ============
export const uploadBannerMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const isVideo = req.file.mimetype.startsWith("video/");
  const folder = isVideo ? "banners/videos" : "banners/images";

  const result = await uploadToCloudinary(req.file.buffer, folder);

  res.status(200).json({
    success: true,
    mediaUrl: result.url,
    mediaType: isVideo ? "video" : "image",
    thumbnailUrl: isVideo ? result.url.replace(/\.[^.]+$/, ".jpg") : null,
  });
});

// ============ PUBLIC: GET ACTIVE BANNERS ============
export const getBanners = asyncHandler(async (req, res) => {
  const now = new Date();
  
  const banners = await Banner.find({
    isActive: true,
    $and: [
      {
        $or: [
          { startDate: { $exists: false } },
          { startDate: null },
          { startDate: { $lte: now } },
        ],
      },
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } },
        ],
      },
    ],
  })
    .sort({ order: 1, createdAt: -1 })
    .select("-createdBy -__v");

  res.status(200).json({
    success: true,
    count: banners.length,
    banners,
  });
});

// ============ ADMIN: GET ALL BANNERS ============
export const getAllBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find()
    .sort({ order: 1, createdAt: -1 })
    .populate("createdBy", "name email");

  res.status(200).json({
    success: true,
    count: banners.length,
    banners,
  });
});

// ============ ADMIN: CREATE BANNER ============
export const createBanner = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    mediaType,
    mediaUrl,
    thumbnailUrl,
    link,
    linkText,
    linkTarget,
    isActive,
    startDate,
    endDate,
  } = req.body;

  if (!title || !mediaType || !mediaUrl) {
    throw new ApiError(400, "Title, media type, and media URL are required");
  }

  // Get next order number
  const maxOrder = await Banner.findOne().sort({ order: -1 }).select("order");
  const order = (maxOrder?.order || 0) + 1;

  const banner = await Banner.create({
    title,
    description,
    mediaType,
    mediaUrl,
    thumbnailUrl,
    link,
    linkText,
    linkTarget,
    isActive: isActive !== false,
    order,
    startDate,
    endDate,
    createdBy: req.user?._id || req.admin?._id,
  });

  logger.info(`Banner created: ${banner.title}`);

  res.status(201).json({
    success: true,
    message: "Banner created successfully",
    banner,
  });
});

// ============ ADMIN: UPDATE BANNER ============
export const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const banner = await Banner.findById(id);
  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  const allowedFields = [
    "title",
    "description",
    "mediaType",
    "mediaUrl",
    "thumbnailUrl",
    "link",
    "linkText",
    "linkTarget",
    "isActive",
    "startDate",
    "endDate",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      banner[field] = req.body[field];
    }
  });

  await banner.save();
  logger.info(`Banner updated: ${banner.title}`);

  res.status(200).json({
    success: true,
    message: "Banner updated successfully",
    banner,
  });
});

// ============ ADMIN: DELETE BANNER ============
export const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  logger.info(`Banner deleted: ${banner.title}`);

  res.status(200).json({
    success: true,
    message: "Banner deleted successfully",
  });
});

// ============ ADMIN: REORDER BANNERS ============
export const reorderBanners = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    throw new ApiError(400, "orderedIds must be an array");
  }

  // Update order for each banner
  const updates = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { order: index },
    },
  }));

  await Banner.bulkWrite(updates);
  logger.info(`Banners reordered: ${orderedIds.length} items`);

  res.status(200).json({
    success: true,
    message: "Banners reordered successfully",
  });
});

// ============ PUBLIC: TRACK VIEW ============
export const trackView = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await Banner.findByIdAndUpdate(id, { $inc: { views: 1 } });

  res.status(200).json({ success: true });
});

// ============ PUBLIC: TRACK CLICK ============
export const trackClick = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await Banner.findByIdAndUpdate(id, { $inc: { clicks: 1 } });

  res.status(200).json({ success: true });
});

// ============ ADMIN: GET BANNER ANALYTICS ============
export const getBannerAnalytics = asyncHandler(async (req, res) => {
  const banners = await Banner.find()
    .sort({ views: -1 })
    .select("title mediaType views clicks isActive createdAt");

  const totalViews = banners.reduce((sum, b) => sum + b.views, 0);
  const totalClicks = banners.reduce((sum, b) => sum + b.clicks, 0);
  const avgCTR = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : 0;

  res.status(200).json({
    success: true,
    analytics: {
      totalBanners: banners.length,
      activeBanners: banners.filter((b) => b.isActive).length,
      totalViews,
      totalClicks,
      avgCTR: `${avgCTR}%`,
    },
    banners,
  });
});
