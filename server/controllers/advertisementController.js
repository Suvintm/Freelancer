// advertisementController.js - Production-grade ad management
import { Advertisement } from "../models/Advertisement.js";
import { SiteSettings, getSettings } from "../models/SiteSettings.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

// ✅ Robust Utility to repair URLs mangled by security sanitizers
// Handles both dot mangling (res_cloudinary_com) and slash mangling (.com_cloudname)
const repairUrl = (val) => {
  if (!val) return val;
  if (Array.isArray(val)) return val.map(v => repairUrl(v));
  if (typeof val !== "string") return val;

  // Most mangled URLs will contain cloudinary or res_
  if (val.includes("cloudinary") || val.includes("res_") || val.includes("_com")) {
    const original = val;
    let fixed = val;

    // 1. Restore Protocol and double slashes
    fixed = fixed.replace(/^(https?):?\/*_+/gi, "$1://");

    // 2. Restore Domain Dots
    fixed = fixed.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com")
                 .replace(/res_cloudinary_com/g, "res.cloudinary.com")
                 .replace(/cloudinary_com/g, "cloudinary.com");

    // 3. Fix the "Slash Mangler" in path
    if (fixed.includes("res.cloudinary.com")) {
      // Restore domain slash
      fixed = fixed.replace(/res\.cloudinary\.com_+/g, "res.cloudinary.com/");
      
      // Fix common path keywords
      fixed = fixed.replace(/image_upload_+/g, "image/upload/")
                   .replace(/video_upload_+/g, "video/upload/")
                   .replace(/raw_upload_+/g, "raw/upload/");
      
      // Fix version slash (matches /v123_ or _v123_ or v123_)
      fixed = fixed.replace(/([\/_]?v\d+)_+/g, "$1/"); 
      
      // Fix slash between cloud_name and resource_type (e.g. /cloudname_image/)
      // Matches cloudname followed by underscore followed by resource type
      fixed = fixed.replace(/(res\.cloudinary\.com\/[^\/_]+)_+(image|video|raw|authenticated)_*/g, "$1/$2/");
      
      // Fix portfolio/images folder mangling
      fixed = fixed.replace(/portfolio_([a-z0-9]+)_+/gi, "portfolio/$1/");
      
      // Fix folder slashes
      fixed = fixed.replace(/advertisements_images_+/g, "advertisements/images/")
                   .replace(/advertisements_videos_+/g, "advertisements/videos/")
                   .replace(/advertisements_gallery_+/g, "advertisements/gallery/");
                   
      // Catch-all: Ensure any remaining underscores before keywords like 'upload' are slashes
      fixed = fixed.replace(/_+(upload|image|video|v\d+)_+/g, "/$1/");

      // Restore slashes before the final filename if still underscores
      fixed = fixed.replace(/_([a-z0-9\-_]+\.(webp|jpg|jpeg|png|mp4|mov|m4v|json))/gi, "/$1");
      
      // Flatten any double slashes created by replacement (except protocol)
      fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
    }

    // 4. Restore Extension Dots
    fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1")
                 .replace(/_jpeg([/_?#]|$)/gi, ".jpeg$1")
                 .replace(/_png([/_?#]|$)/gi, ".png$1")
                 .replace(/_mp4([/_?#]|$)/gi, ".mp4$1")
                 .replace(/_webp([/_?#]|$)/gi, ".webp$1")
                 .replace(/_json([/_?#]|$)/gi, ".json$1");

    // Final check for end-of-string extensions
    fixed = fixed.replace(/_jpg$/i, ".jpg")
                 .replace(/_jpeg$/i, ".jpeg")
                 .replace(/_png$/i, ".png")
                 .replace(/_mp4$/i, ".mp4")
                 .replace(/_webp$/i, ".webp");

    if (original !== fixed) {
      console.log(`[REPAIR URL] Fixed: ${original} -> ${fixed}`);
    }
    
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
    query.displayLocations = { $in: [location] };
  }

  let ads = await Advertisement.find(query)
    .sort({ priority: -1, order: 1, createdAt: -1 })
    .select("-adminNotes -advertiserEmail -advertiserPhone -createdBy -__v");

  // Check site settings for home_banner location
  if (location === "home_banner") {
    const settings = await getSettings();
    if (!settings.showSuvixAds && ads.length === 0) {
      return res.status(200).json({ success: true, count: 0, ads: [] });
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

  const cleanedAds = ads.map(ad => cleanAd(ad));
  res.status(200).json({ success: true, count: ads.length, ads: cleanedAds, hasDefaults: ads.some(a => a.isDefault) });
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
  const settings = await getSettings();
  res.status(200).json({
    success: true,
    showSuvixAds: settings.showSuvixAds,
  });
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
  res.status(200).json({ success: true });
});

// ============ PUBLIC: TRACK CLICK ============
export const trackAdClick = asyncHandler(async (req, res) => {
  await Advertisement.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
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
  res.status(200).json({ success: true, message: "Advertisement updated", ad: cleanAd(ad) });
});

// ============ ADMIN: DELETE AD ============
export const deleteAd = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findByIdAndDelete(req.params.id);
  if (!ad) throw new ApiError(404, "Advertisement not found");

  logger.info(`Advertisement deleted: ${ad.title}`);
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
});

// ============ ADMIN: GET SITE SETTINGS ============
export const getSiteSettingsAdmin = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  res.status(200).json({ success: true, settings });
});
