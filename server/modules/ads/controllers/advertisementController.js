// advertisementController.js - Production-grade ad management
import { Advertisement } from "../models/Advertisement.js";
import { SiteSettings, getSettings } from "../../system/models/SiteSettings.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import logger from "../../../utils/logger.js";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";
import { getCache, setCache, delPattern } from "../../../config/redisClient.js";
import { rankAdsWithBandit, updateBanditScore } from "../utils/adBandit.js";
import { checkFrequencyCap, incrementFrequency, checkPacing, consumePacingToken } from "../utils/adPacing.js";

// ✅ Robust Utility to repair URLs mangled by security sanitizers
// Handles both dot mangling (res_cloudinary_com) and slash mangling (.com_cloudname)
const repairUrl = (val) => {
  if (!val) return val;
  if (Array.isArray(val)) return val.map(v => repairUrl(v));
  if (typeof val !== "string") return val;

  // If it is already a clean Cloudinary URL, don't repair it
  if (val.includes("res.cloudinary.com") && !val.includes("res_cloudinary") && !val.includes("cloudinary_com")) {
    return val;
  }

  // Only repair if it looks mangled
  if (val.includes("cloudinary") || val.includes("res_") || val.includes("_com")) {
    let fixed = val;
    fixed = fixed.replace(/^(https?):?\/*_+/gi, "$1://");
    fixed = fixed.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com")
                 .replace(/res_cloudinary_com/g, "res.cloudinary.com")
                 .replace(/cloudinary_com/g, "cloudinary.com");
    if (fixed.includes("res.cloudinary.com")) {
      fixed = fixed.replace(/res\.cloudinary\.com_+/g, "res.cloudinary.com/");
      fixed = fixed.replace(/image_upload_+/g, "image/upload/")
                   .replace(/video_upload_+/g, "video/upload/")
                   .replace(/raw_upload_+/g, "raw/upload/");
      fixed = fixed.replace(/([/_]?v\d+)_+/g, "$1/"); 
      fixed = fixed.replace(/(res\.cloudinary\.com\/[^/_]+)_+(image|video|raw|authenticated)_*/g, "$1/$2/");
      fixed = fixed.replace(/portfolio_([a-z0-9]+)_+/gi, "portfolio/$1/");
      fixed = fixed.replace(/advertisements_images_+/g, "advertisements/images/")
                   .replace(/advertisements_videos_+/g, "advertisements/videos/")
                   .replace(/advertisements_gallery_+/g, "advertisements/gallery/");
      
      // Safe replacement of underscores with slashes for known path keywords
      fixed = fixed.replace(/_+(upload|image|video|v\d+)_+/g, "/$1/");
      
      fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
    }
    fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1")
                 .replace(/_jpeg([/_?#]|$)/gi, ".jpeg$1")
                 .replace(/_png([/_?#]|$)/gi, ".png$1")
                 .replace(/_mp4([/_?#]|$)/gi, ".mp4$1")
                 .replace(/_webp([/_?#]|$)/gi, ".webp$1")
                 .replace(/_json([/_?#]|$)/gi, ".json$1");
    return fixed;
  }
  return val;
};

// ✅ Helper to clean up ad object before sending to client
const cleanAd = (ad) => {
  if (!ad) return ad;
  const adObj = ad.toObject ? ad.toObject() : ad;
  
  const urlFields = ["mediaUrl", "thumbnailUrl", "websiteUrl", "instagramUrl", "facebookUrl", "youtubeUrl", "otherUrl"];
  urlFields.forEach(field => {
    if (adObj[field]) adObj[field] = repairUrl(adObj[field]);
  });
  
  if (adObj.galleryImages) {
    adObj.galleryImages = adObj.galleryImages.map(img => repairUrl(img));
  }
  
  return adObj;
};

// ============ MEDIA UPLOAD ============
export const uploadAdMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  const isVideo = req.file.mimetype.startsWith("video/");
  const folder = isVideo ? "advertisements/videos" : "advertisements/images";

  const result = await uploadToCloudinary(req.file.buffer, folder);

  res.status(200).json({
    success: true,
    mediaUrl: result.url,
    mediaType: isVideo ? "video" : "image",
    thumbnailUrl: isVideo ? result.url.replace(/\.[^.]+$/, ".jpg") : null,
  });
});

// ============ GALLERY UPLOAD (up to 5 images) ============
export const uploadGalleryImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) throw new ApiError(400, "No files uploaded");
  if (req.files.length > 5) throw new ApiError(400, "Maximum 5 gallery images allowed");

  const uploadPromises = req.files.map((file) =>
    uploadToCloudinary(file.buffer, "advertisements/gallery")
  );
  const results = await Promise.all(uploadPromises);
  const urls = results.map((r) => r.url);

  res.status(200).json({ success: true, galleryImages: urls });
});

// ============ PUBLIC: GET ACTIVE ADS BY LOCATION ============
export const getActiveAds = asyncHandler(async (req, res) => {
  const now = new Date();
  const { location } = req.query; // "home_banner" | "reels_feed" | "explore_page"

  // ── Redis cache check (TTL: 10 min) ──────────────────────────────────
  const cacheKey = `ads:${location || 'all'}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  const query = {
    isActive: true,
    approvalStatus: "approved",
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
  };

  if (location) {
    const locations = location.split(",");
    query.displayLocations = { $in: locations };
  }

  let ads = await Advertisement.find(query)
    .sort({ priority: -1, order: 1, createdAt: -1 })
    .select("-adminNotes -advertiserEmail -advertiserPhone -createdBy -__v");

  // Check site settings for home_banner location
  if (location === "home_banner") {
    const settings = await getSettings();
    if (!settings.showSuvixAds && ads.length === 0) {
      const payload = { success: true, count: 0, ads: [] };
      await setCache(cacheKey, payload, 300);
      return res.status(200).json(payload);
    }
  }

  // ── FALLBACK: If no live ads found, return default banners ──────────
  if (ads.length === 0) {
    const defaultQuery = { isDefault: true };
    if (location) defaultQuery.displayLocations = { $in: [location] };
    ads = await Advertisement.find(defaultQuery)
      .sort({ order: 1, createdAt: -1 })
      .select("-adminNotes -advertiserEmail -advertiserPhone -createdBy -__v");
  }

  // ── STEP 2: Rank Ads with Bandit (UCB1) ─────────────────────────────────
  const rankedAds = await rankAdsWithBandit(ads, location);

  // ── STEP 3: Apply Frequency Cap & Pacing (Personalized Filter) ──────────
  // Per-user frequency capping (O(1) Redis check)
  const userId = req.user?._id?.toString();
  let filteredAds = rankedAds;

  if (userId) {
    const checks = await Promise.all(rankedAds.map(ad => checkFrequencyCap(userId, ad._id.toString())));
    filteredAds = rankedAds.filter((_, i) => !checks[i]);
    
    // If cap removes too many, fall back to ranked list (safety)
    if (filteredAds.length === 0 && rankedAds.length > 0) {
        filteredAds = rankedAds.slice(0, 5);
    }
  }

  // Final Pacing Check
  const pacingChecks = await Promise.all(filteredAds.map(ad => checkPacing(ad._id.toString())));
  const finalAds = filteredAds.filter((_, i) => !pacingChecks[i]);

  const cleanedAds = finalAds.map(ad => cleanAd(ad));
  const payload = { 
    success: true, 
    count: finalAds.length, 
    ads: cleanedAds, 
    hasDefaults: finalAds.some(a => a.isDefault),
    isPersonalized: !!userId
  };

  // Cache for 10 minutes (Slightly shorter for dynamic bandit)
  await setCache(cacheKey, payload, 300);

  res.status(200).json(payload);
});

// ============ PUBLIC: GET SINGLE AD ============
export const getAdById = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findById(req.params.id).select(
    "-adminNotes -advertiserEmail -advertiserPhone -createdBy -__v"
  );
  if (!ad) throw new ApiError(404, "Advertisement not found");

  res.status(200).json({ success: true, ad: cleanAd(ad) });
});

// ============ PUBLIC: GET SITE SETTINGS ============
export const getSiteSettingsPublic = asyncHandler(async (req, res) => {
  const cached = await getCache('settings:showSuvixAds');
  if (cached) return res.status(200).json(cached);

  const settings = await getSettings();
  const payload = { success: true, showSuvixAds: settings.showSuvixAds };
  await setCache('settings:showSuvixAds', payload, 300); // 5 min TTL
  res.status(200).json(payload);
});

// ============ PUBLIC: TRACK VIEW ============
export const trackAdView = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { location } = req.body;

  const update = { $inc: { views: 1 } };
  if (location === "reels_feed") update.$inc.reelViews = 1;
  else if (location === "explore_page") update.$inc.exploreViews = 1;
  else if (location === "home_banner") update.$inc.homeBannerViews = 1;

  await Advertisement.findByIdAndUpdate(id, update);

  // ── DSA: Update Bandit & Pacing State ─────────────
  updateBanditScore(id, location, 'view').catch(() => {});
  consumePacingToken(id).catch(() => {});
  if (req.user?._id) {
    incrementFrequency(req.user._id.toString(), id).catch(() => {});
  }

  res.status(200).json({ success: true });
});

// ============ PUBLIC: TRACK CLICK ============
export const trackAdClick = asyncHandler(async (req, res) => {
  await Advertisement.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
  
  // ── DSA: Update Bandit Score (Positive signal) ────
  updateBanditScore(req.params.id, req.query.location || 'all', 'click').catch(() => {});

  res.status(200).json({ success: true });
});

// ============ ADMIN: GET ALL ADS ============
export const getAllAds = asyncHandler(async (req, res) => {
  const { status, location, priority } = req.query;
  const query = {};

  if (status && status !== "all") {
    if (status === "active") query.isActive = true;
    else if (status === "inactive") query.isActive = false;
    else if (["pending", "approved", "rejected"].includes(status)) {
      query.approvalStatus = status;
    }
  }
  if (location) query.displayLocations = { $in: [location] };
  if (priority) query.priority = priority;

  const ads = await Advertisement.find(query)
    .sort({ order: 1, createdAt: -1 })
    .populate("createdBy", "name email");

  logger.info(`[ADS] Admin fetched ${ads.length} ads. Status: ${status || 'all'}`);
  const cleanedAds = ads.map(ad => cleanAd(ad));
  res.status(200).json({ success: true, count: ads.length, ads: cleanedAds });
});

// ============ ADMIN: CREATE AD ============
export const createAd = asyncHandler(async (req, res) => {
  const {
    advertiserName, advertiserEmail, advertiserPhone, companyName,
    title, tagline, description, longDescription,
    mediaType, mediaUrl, thumbnailUrl, galleryImages,
    websiteUrl, instagramUrl, facebookUrl, youtubeUrl, otherUrl, ctaText,
    isActive, displayLocations, badge, isDefault,
    startDate, endDate, priority, adminNotes, approvalStatus,
  } = req.body;

  if (!title || !mediaType || !mediaUrl || !advertiserName) {
    throw new ApiError(400, "Title, advertiser name, and media are required");
  }

  const maxOrder = await Advertisement.findOne().sort({ order: -1 }).select("order");
  const order = (maxOrder?.order || 0) + 1;

  const ad = await Advertisement.create({
    advertiserName, advertiserEmail, advertiserPhone, companyName,
    title, tagline, description, longDescription,
    mediaType, mediaUrl, thumbnailUrl,
    galleryImages: galleryImages || [],
    websiteUrl, instagramUrl, facebookUrl, youtubeUrl, otherUrl,
    ctaText: ctaText || "Learn More",
    isActive: isActive || false,
    isDefault: isDefault || false,
    displayLocations: displayLocations || ["home_banner"],
    badge: badge || "SPONSOR",
    startDate, endDate,
    priority: priority || "medium",
    order,
    adminNotes,
    approvalStatus: approvalStatus || "pending",
    createdBy: req.admin?._id,
  });

  // Restore dots and slashes in URLs after creation (just in case)
  ad.mediaUrl = repairUrl(ad.mediaUrl);
  ad.thumbnailUrl = repairUrl(ad.thumbnailUrl);
  ad.galleryImages = repairUrl(ad.galleryImages);
  ad.websiteUrl = repairUrl(ad.websiteUrl);
  ad.instagramUrl = repairUrl(ad.instagramUrl);
  ad.facebookUrl = repairUrl(ad.facebookUrl);
  ad.youtubeUrl = repairUrl(ad.youtubeUrl);
  ad.otherUrl = repairUrl(ad.otherUrl);
  await ad.save();

  logger.info(`Advertisement created: ${ad.title} by ${ad.advertiserName}`);
  await delPattern('ads:*'); // Invalidate all ad caches
  res.status(201).json({ success: true, message: "Advertisement created", ad: cleanAd(ad) });
});

// ============ ADMIN: UPDATE AD ============
export const updateAd = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findById(req.params.id);
  if (!ad) throw new ApiError(404, "Advertisement not found");

  const allowedFields = [
    "advertiserName", "advertiserEmail", "advertiserPhone", "companyName",
    "title", "tagline", "description", "longDescription",
    "mediaType", "mediaUrl", "thumbnailUrl", "galleryImages",
    "websiteUrl", "instagramUrl", "facebookUrl", "youtubeUrl", "otherUrl", "ctaText",
    "isActive", "isDefault", "displayLocations", "badge",
    "startDate", "endDate", "priority", "order",
    "adminNotes", "approvalStatus",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      let val = req.body[field];
      // Restore dots and slashes for URL fields
      if (["mediaUrl", "thumbnailUrl", "galleryImages", "websiteUrl", "instagramUrl", "facebookUrl", "youtubeUrl", "otherUrl"].includes(field)) {
        val = repairUrl(val);
      }
      ad[field] = val;
    }
  });

  await ad.save();
  logger.info(`Advertisement updated: ${ad.title}`);
  await delPattern('ads:*'); // Invalidate all ad caches
  res.status(200).json({ success: true, message: "Advertisement updated", ad: cleanAd(ad) });
});

// ============ ADMIN: DELETE AD ============
export const deleteAd = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findByIdAndDelete(req.params.id);
  if (!ad) throw new ApiError(404, "Advertisement not found");

  logger.info(`Advertisement deleted: ${ad.title}`);
  await delPattern('ads:*'); // Invalidate all ad caches
  res.status(200).json({ success: true, message: "Advertisement deleted" });
});

// ============ ADMIN: REORDER ADS ============
export const reorderAds = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) throw new ApiError(400, "orderedIds must be an array");

  const updates = orderedIds.map((id, index) => ({
    updateOne: { filter: { _id: id }, update: { order: index } },
  }));

  await Advertisement.bulkWrite(updates);
  res.status(200).json({ success: true, message: "Ads reordered" });
});

// ============ ADMIN: GET ANALYTICS ============
export const getAdAnalytics = asyncHandler(async (req, res) => {
  const ads = await Advertisement.find()
    .sort({ views: -1 })
    .select("title advertiserName mediaType views clicks reelViews exploreViews homeBannerViews isActive approvalStatus createdAt displayLocations");

  const totalViews = ads.reduce((s, a) => s + a.views, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const avgCTR = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : 0;

  res.status(200).json({
    success: true,
    analytics: {
      totalAds: ads.length,
      activeAds: ads.filter((a) => a.isActive && a.approvalStatus === "approved").length,
      pendingAds: ads.filter((a) => a.approvalStatus === "pending").length,
      totalViews,
      totalClicks,
      avgCTR: `${avgCTR}%`,
    },
    ads,
  });
});

// ============ ADMIN: TOGGLE GLOBAL SUVIX ADS ============
export const toggleSuvixAds = asyncHandler(async (req, res) => {
  const { showSuvixAds } = req.body;
  const settings = await getSettings();
  settings.showSuvixAds = showSuvixAds;
  await settings.save();

  res.status(200).json({
    success: true,
    showSuvixAds: settings.showSuvixAds,
    message: `Suvix ads ${showSuvixAds ? "enabled" : "disabled"}`,
  });
  await delPattern('ads:*');         // Invalidate ad list cache
  await delPattern('settings:*');    // Invalidate settings cache
});

// ============ ADMIN: GET SITE SETTINGS ============
export const getSiteSettingsAdmin = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  res.status(200).json({ success: true, settings });
});






