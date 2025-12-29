/**
 * InternalBanner Controller
 * Handles CRUD operations for internal page banners
 */

import { InternalBanner } from "../models/InternalBanner.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

// ============ PUBLIC: GET SECTION BANNERS ============
export const getSectionBanner = asyncHandler(async (req, res) => {
  const { section } = req.params;
  
  if (!["editors", "gigs", "jobs"].includes(section)) {
    throw new ApiError(400, "Invalid section. Must be: editors, gigs, or jobs");
  }
  
  let banner = await InternalBanner.findOne({ section });
  
  // Check if scheduled time has passed
  if (banner?.scheduledAt && new Date() >= banner.scheduledAt) {
    banner.isLive = true;
    banner.scheduledAt = null;
    await banner.save();
  }
  
  // Only return if live, with active slides sorted by order
  if (banner && banner.isLive) {
    const activeSlides = banner.slides
      .filter(s => s.isActive)
      .sort((a, b) => a.order - b.order);
    
    return res.status(200).json({
      success: true,
      banner: {
        section: banner.section,
        slides: activeSlides,
        settings: banner.settings,
      },
    });
  }
  
  // Return empty if not live
  res.status(200).json({
    success: true,
    banner: null,
  });
});

// ============ ADMIN: GET ALL SECTIONS ============
export const getAllSectionBanners = asyncHandler(async (req, res) => {
  const banners = await InternalBanner.find().sort({ section: 1 });
  
  // Ensure all sections exist
  const sections = ["editors", "gigs", "jobs"];
  const result = {};
  
  for (const section of sections) {
    const existing = banners.find(b => b.section === section);
    if (existing) {
      result[section] = existing;
    } else {
      // Create default if doesn't exist
      const newBanner = await InternalBanner.create({ section, slides: [], settings: {} });
      result[section] = newBanner;
    }
  }
  
  res.status(200).json({
    success: true,
    banners: result,
  });
});

// ============ ADMIN: UPDATE SECTION SETTINGS ============
export const updateSectionSettings = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const { settings } = req.body;
  
  let banner = await InternalBanner.findOne({ section });
  
  if (!banner) {
    banner = await InternalBanner.create({ section, slides: [], settings });
  } else {
    banner.settings = { ...banner.settings.toObject(), ...settings };
    await banner.save();
  }
  
  logger.info(`Internal banner settings updated: ${section}`);
  
  res.status(200).json({
    success: true,
    message: "Settings updated",
    banner,
  });
});

// ============ ADMIN: TOGGLE LIVE STATUS ============
export const toggleLiveStatus = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const { isLive, scheduledAt } = req.body;
  
  let banner = await InternalBanner.findOne({ section });
  
  if (!banner) {
    throw new ApiError(404, "Section not found");
  }
  
  if (scheduledAt) {
    banner.scheduledAt = new Date(scheduledAt);
    banner.isLive = false;
  } else {
    banner.isLive = isLive !== undefined ? isLive : !banner.isLive;
    banner.scheduledAt = null;
  }
  
  await banner.save();
  logger.info(`Internal banner ${section} live status: ${banner.isLive}`);
  
  res.status(200).json({
    success: true,
    message: banner.isLive ? "Banner is now live" : banner.scheduledAt ? "Banner scheduled" : "Banner is now offline",
    banner,
  });
});

// ============ ADMIN: ADD SLIDE ============
export const addSlide = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const { mediaType, mediaUrl, thumbnailUrl, badge, title, subtitle, link } = req.body;
  
  if (!title || !mediaUrl) {
    throw new ApiError(400, "Title and media URL are required");
  }
  
  let banner = await InternalBanner.findOne({ section });
  
  if (!banner) {
    banner = await InternalBanner.create({ section, slides: [], settings: {} });
  }
  
  const newSlide = {
    mediaType: mediaType || "image",
    mediaUrl,
    thumbnailUrl,
    badge: badge || "",
    title,
    subtitle: subtitle || "",
    link: link || "",
    order: banner.slides.length,
    isActive: true,
  };
  
  banner.slides.push(newSlide);
  await banner.save();
  
  logger.info(`Slide added to ${section}: ${title}`);
  
  res.status(201).json({
    success: true,
    message: "Slide added",
    slide: banner.slides[banner.slides.length - 1],
  });
});

// ============ ADMIN: UPDATE SLIDE ============
export const updateSlide = asyncHandler(async (req, res) => {
  const { section, slideId } = req.params;
  const updates = req.body;
  
  const banner = await InternalBanner.findOne({ section });
  
  if (!banner) {
    throw new ApiError(404, "Section not found");
  }
  
  const slide = banner.slides.id(slideId);
  
  if (!slide) {
    throw new ApiError(404, "Slide not found");
  }
  
  // Update allowed fields
  const allowedFields = ["mediaType", "mediaUrl", "thumbnailUrl", "badge", "title", "subtitle", "link", "isActive"];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      slide[field] = updates[field];
    }
  });
  
  await banner.save();
  logger.info(`Slide updated in ${section}: ${slideId}`);
  
  res.status(200).json({
    success: true,
    message: "Slide updated",
    slide,
  });
});

// ============ ADMIN: DELETE SLIDE ============
export const deleteSlide = asyncHandler(async (req, res) => {
  const { section, slideId } = req.params;
  
  const banner = await InternalBanner.findOne({ section });
  
  if (!banner) {
    throw new ApiError(404, "Section not found");
  }
  
  const slideIndex = banner.slides.findIndex(s => s._id.toString() === slideId);
  
  if (slideIndex === -1) {
    throw new ApiError(404, "Slide not found");
  }
  
  banner.slides.splice(slideIndex, 1);
  await banner.save();
  
  logger.info(`Slide deleted from ${section}: ${slideId}`);
  
  res.status(200).json({
    success: true,
    message: "Slide deleted",
  });
});

// ============ ADMIN: REORDER SLIDES ============
export const reorderSlides = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const { orderedIds } = req.body;
  
  if (!Array.isArray(orderedIds)) {
    throw new ApiError(400, "orderedIds must be an array");
  }
  
  const banner = await InternalBanner.findOne({ section });
  
  if (!banner) {
    throw new ApiError(404, "Section not found");
  }
  
  // Update order for each slide
  orderedIds.forEach((id, index) => {
    const slide = banner.slides.id(id);
    if (slide) {
      slide.order = index;
    }
  });
  
  await banner.save();
  logger.info(`Slides reordered in ${section}`);
  
  res.status(200).json({
    success: true,
    message: "Slides reordered",
  });
});

// ============ ADMIN: UPLOAD MEDIA ============
export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }
  
  const isVideo = req.file.mimetype.startsWith("video/");
  const folder = isVideo ? "internal-banners/videos" : "internal-banners/images";
  
  const result = await uploadToCloudinary(req.file.buffer, folder);
  
  res.status(200).json({
    success: true,
    mediaUrl: result.url,
    mediaType: isVideo ? "video" : "image",
    thumbnailUrl: isVideo ? result.url.replace(/\.[^.]+$/, ".jpg") : null,
  });
});

// ============ ADMIN: DELETE SECTION ============
export const deleteSection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  
  const banner = await InternalBanner.findOne({ section });
  
  if (!banner) {
    throw new ApiError(404, "Section not found");
  }
  
  banner.slides = [];
  banner.isLive = false;
  await banner.save();
  
  logger.info(`Section cleared: ${section}`);
  
  res.status(200).json({
    success: true,
    message: "Section cleared",
  });
});
