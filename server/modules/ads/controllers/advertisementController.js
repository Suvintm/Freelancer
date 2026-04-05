// advertisementController.js - Production-grade ad management (Prisma/PostgreSQL)
import prisma from "../../../config/prisma.js";
import { SiteSettings } from "../../system/models/SiteSettings.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import logger from "../../../utils/logger.js";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";
import { getCache, setCache, delPattern } from "../../../config/redisClient.js";
import { rankAdsWithBandit, updateBanditScore } from "../utils/adBandit.js";
import { checkFrequencyCap, incrementFrequency, checkPacing, consumePacingToken } from "../utils/adPacing.js";

// ✅ Robust Utility to repair URLs mangled by security sanitizers
const repairUrl = (val) => {
  if (!val) return val;
  if (Array.isArray(val)) return val.map(v => repairUrl(v));
  if (typeof val !== "string") return val;
  if (val.includes("res.cloudinary.com") && !val.includes("res_cloudinary") && !val.includes("cloudinary_com")) return val;

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

// ✅ Helper to clean up ad object before sending to client (Map Prisma snake_case to camelCase)
const cleanAd = (ad) => {
  if (!ad) return ad;
  
  // Flatten AdRequest into Ad if present
  const req = ad.ad_request || {};
  const obj = {
    id: ad.id,
    _id: ad.id, // Legacy compatibility
    advertiserName: req.advertiser_name || ad.advertiserName,
    companyName: req.company_name,
    title: req.title || ad.title,
    tagline: ad.tagline,
    description: req.description || ad.description,
    longDescription: ad.long_description,
    mediaType: req.media_type || ad.media_type,
    mediaUrl: req.media_url || ad.media_url,
    thumbnailUrl: ad.thumbnail_url,
    websiteUrl: req.website_url,
    instagramUrl: req.instagram_url,
    facebookUrl: req.facebook_url,
    youtubeUrl: req.youtube_url,
    otherUrl: req.other_url,
    ctaText: req.cta_text || ad.ctaText || "Learn More",
    badge: req.badge || "SPONSOR",
    isActive: ad.is_active,
    isDefault: ad.is_default,
    displayLocations: ad.display_locations,
    priority: ad.priority,
    order: ad.order,
    galleryImages: ad.gallery_images || [],
    layoutConfig: ad.layout_config,
    buttonStyle: ad.button_style,
    reelConfig: ad.reel_config,
    views: ad.views,
    clicks: ad.clicks,
    reelViews: ad.reel_views,
    exploreViews: ad.explore_views,
    homeBannerViews: ad.home_banner_views,
    startDate: ad.start_date,
    endDate: ad.end_date,
    createdAt: ad.created_at,
    updatedAt: ad.updated_at
  };

  const urlFields = ["mediaUrl", "thumbnailUrl", "websiteUrl", "instagramUrl", "facebookUrl", "youtubeUrl", "otherUrl"];
  urlFields.forEach(field => {
    if (obj[field]) obj[field] = repairUrl(obj[field]);
  });
  
  if (obj.galleryImages) {
    obj.galleryImages = obj.galleryImages.map(img => repairUrl(img));
  }
  
  return obj;
};

// ============ MEDIA UPLOAD ============
export const uploadAdMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  try {
    const isVideo = req.file.mimetype.startsWith("video/");
    const folder  = isVideo ? "advertisements/videos" : "advertisements/images";

    const options = {};
    if (isVideo) {
      options.eager = [
        { format: 'mp4', video_codec: 'h264', audio_codec: 'aac', width: 1080, crop: 'limit', quality: 'auto' },
      ];
      options.eager_async = false; 
    }

    const result = await uploadToCloudinary(req.file.buffer, folder, options);

    let mediaUrl = result.secure_url || result.url;
    let mediaType = isVideo ? 'video' : 'image';
    let thumbnailUrl = isVideo ? mediaUrl.replace(/\.[^.]+$/, '.jpg') : '';

    if (isVideo && result.eager?.[0]?.secure_url) {
      mediaUrl     = result.eager[0].secure_url;
      thumbnailUrl = result.eager[0].secure_url.replace(/\.mp4$/i, '.jpg');
    }

    res.status(200).json({
      success: true,
      mediaUrl,
      mediaType,
      thumbnailUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Upload failed: " + error.message });
  }
});

export const uploadGalleryImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) throw new ApiError(400, "No files uploaded");

  try {
    const uploadPromises = req.files.map(file => 
      uploadToCloudinary(file.buffer, "advertisements/gallery")
    );
    const results = await Promise.all(uploadPromises);
    const urls = results.map(r => r.secure_url || r.url);

    res.status(200).json({
      success: true,
      urls,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gallery upload failed: " + error.message });
  }
});

// ============ PUBLIC: GET ACTIVE ADS ============
export const getActiveAds = asyncHandler(async (req, res) => {
  const now = new Date();
  const { location } = req.query; 

  const cacheKey = `ads:${location || 'all'}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  // Handle multiple locations separated by commas (e.g. banners:home_0,banners:home_1)
  const locations = location ? location.split(',').map(l => l.trim()) : null;

  const where = {
    is_active: true,
    OR: [
      { start_date: { equals: null } },
      { start_date: { lte: now } }
    ],
    AND: [
      {
        OR: [
          { end_date: { equals: null } },
          { end_date: { gte: now } }
        ]
      }
    ]
  };

  // Approval status is on AdRequest
  const include = { ad_request: true };

  let ads = await prisma.advertisement.findMany({
    where: {
      ...where,
      ad_request: {
        status: "approved"
      },
      ...(locations && locations.length > 0 ? {
        display_locations: { hasSome: locations }
      } : {})
    },
    orderBy: [
      { priority: 'desc' },
      { order: 'asc' },
      { created_at: 'desc' }
    ],
    include
  });

  // Check showSuvixAds from SiteSettings (PostgreSQL singleton)
  if (locations && locations.includes("home_banner")) {
    const settings = await SiteSettings.getSettings();
    if (settings && !settings.showSuvixAds && ads.length === 0) {
      const payload = { success: true, count: 0, ads: [] };
      await setCache(cacheKey, payload, 300);
      return res.status(200).json(payload);
    }
  }

  // FALLBACK: Defaults
  if (ads.length === 0) {
    ads = await prisma.advertisement.findMany({
      where: {
        is_default: true,
        ...(locations && locations.length > 0 ? { display_locations: { hasSome: locations } } : {})
      },
      orderBy: [
        { order: 'asc' },
        { created_at: 'desc' }
      ],
      include
    });
  }

  const rankedAds = await rankAdsWithBandit(ads, location);

  // Apply Frequency Cap & Pacing
  const userId = req.user?.id;
  let filteredAds = rankedAds;

  if (userId) {
    const checks = await Promise.all(rankedAds.map(ad => checkFrequencyCap(userId, ad.id)));
    filteredAds = rankedAds.filter((_, i) => !checks[i]);
    if (filteredAds.length === 0 && rankedAds.length > 0) filteredAds = rankedAds.slice(0, 5);
  }

  const pacingChecks = await Promise.all(filteredAds.map(ad => checkPacing(ad.id)));
  const finalAds = filteredAds.filter((_, i) => !pacingChecks[i]);

  const cleanedAds = finalAds.map(ad => cleanAd(ad));
  const payload = { 
    success: true, 
    count: finalAds.length, 
    ads: cleanedAds, 
    hasDefaults: finalAds.some(a => a.is_default),
    isPersonalized: !!userId
  };

  await setCache(cacheKey, payload, 300);
  res.status(200).json(payload);
});

// ============ PUBLIC: GET SINGLE AD ============
export const getAdById = asyncHandler(async (req, res) => {
  const ad = await prisma.advertisement.findUnique({
    where: { id: req.params.id },
    include: { ad_request: true }
  });
  if (!ad) throw new ApiError(404, "Advertisement not found");

  res.status(200).json({ success: true, ad: cleanAd(ad) });
});

// ============ PUBLIC: TRACK VIEW ============
export const trackAdView = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { location } = req.body;

  const data = { views: { increment: 1 } };
  if (location === "reels_feed") data.reel_views = { increment: 1 };
  else if (location === "explore_page") data.explore_views = { increment: 1 };
  else if (location === "home_banner") data.home_banner_views = { increment: 1 };

  await prisma.advertisement.update({
    where: { id },
    data
  });

  updateBanditScore(id, location, 'view').catch(() => {});
  consumePacingToken(id).catch(() => {});
  if (req.user?.id) {
    incrementFrequency(req.user.id, id).catch(() => {});
  }

  res.status(200).json({ success: true });
});

// ============ PUBLIC: TRACK CLICK ============
export const trackAdClick = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.advertisement.update({
    where: { id },
    data: { clicks: { increment: 1 } }
  });
  
  updateBanditScore(id, req.query.location || 'all', 'click').catch(() => {});
  res.status(200).json({ success: true });
});

// ============ ADMIN: GET ALL ADS ============
export const getAllAds = asyncHandler(async (req, res) => {
  const { status, location, priority } = req.query;
  const where = {};

  if (status && status !== "all") {
    if (status === "active") where.is_active = true;
    else if (status === "inactive") where.is_active = false;
    else if (["pending", "approved", "rejected"].includes(status)) {
      where.ad_request = { status };
    }
  }
  if (location) where.display_locations = { has: location };
  if (priority) where.priority = priority;

  const ads = await prisma.advertisement.findMany({
    where,
    orderBy: [ { order: 'asc' }, { created_at: 'desc' } ],
    include: { ad_request: { include: { user: { select: { name: true, email: true } } } } }
  });

  const cleanedAds = ads.map(ad => cleanAd({ ...ad, createdBy: ad.ad_request?.user }));
  res.status(200).json({ success: true, count: ads.length, ads: cleanedAds });
});

// ============ ADMIN: CREATE AD ============
export const createAd = asyncHandler(async (req, res) => {
  // This typically converts an AdRequest to an Advertisement
  const { requestId, ...displayProps } = req.body;

  const request = await prisma.adRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new ApiError(404, "Ad Request not found");

  const maxOrder = await prisma.advertisement.aggregate({ _max: { order: true } });
  const order = (maxOrder._max.order || 0) + 1;

  const ad = await prisma.advertisement.create({
    data: {
      ad_request_id: requestId,
      tagline: displayProps.tagline,
      long_description: displayProps.longDescription,
      media_type: displayProps.mediaType || request.media_type,
      media_url: repairUrl(displayProps.mediaUrl || request.media_url),
      thumbnail_url: repairUrl(displayProps.thumbnailUrl),
      gallery_images: repairUrl(displayProps.galleryImages || []),
      layout_config: displayProps.layoutConfig || {},
      button_style: displayProps.buttonStyle || {},
      reel_config: displayProps.reelConfig || {},
      is_active: displayProps.isActive || false,
      display_locations: displayProps.displayLocations || ["banners:home_0"],
      is_default: displayProps.isDefault || false,
      priority: displayProps.priority || "medium",
      start_date: displayProps.startDate ? new Date(displayProps.startDate) : new Date(),
      end_date: displayProps.endDate ? new Date(displayProps.endDate) : null,
      order,
    },
    include: { ad_request: true }
  });

  await delPattern('ads:*');
  res.status(201).json({ success: true, message: "Advertisement created", ad: cleanAd(ad) });
});

// ============ ADMIN: UPDATE AD ============
export const updateAd = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {};
  
  const fields = [
    "tagline", "longDescription", "mediaType", "mediaUrl", "thumbnailUrl", 
    "galleryImages", "layoutConfig", "buttonStyle", "reelConfig",
    "isActive", "displayLocations", "isDefault", "priority", "order",
    "startDate", "endDate"
  ];

  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      let val = req.body[f];
      if (typeof val === 'string' && (f.endsWith('Url') || f === 'galleryImages')) val = repairUrl(val);
      
      const pgField = f.replace(/([A-Z])/g, "_$1").toLowerCase();
      updateData[pgField] = val;
    }
  });

  const ad = await prisma.advertisement.update({
    where: { id },
    data: updateData,
    include: { ad_request: true }
  });

  await delPattern('ads:*');
  res.status(200).json({ success: true, message: "Advertisement updated", ad: cleanAd(ad) });
});

// ============ ADMIN: DELETE AD ============
export const deleteAd = asyncHandler(async (req, res) => {
  await prisma.advertisement.delete({ where: { id: req.params.id } });
  await delPattern('ads:*');
  res.status(200).json({ success: true, message: "Advertisement deleted" });
});

// ============ ADMIN: REORDER ADS ============
export const reorderAds = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body;
  
  await prisma.$transaction(
    orderedIds.map((id, index) => 
      prisma.advertisement.update({
        where: { id },
        data: { order: index }
      })
    )
  );

  res.status(200).json({ success: true, message: "Ads reordered" });
});

// ============ ADMIN: GET ANALYTICS ============
export const getAdAnalytics = asyncHandler(async (req, res) => {
  const ads = await prisma.advertisement.findMany({
    include: { ad_request: true },
    orderBy: { views: 'desc' }
  });

  const totalViews = ads.reduce((s, a) => s + (a.views || 0), 0);
  const totalClicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);
  const avgCTR = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : 0;

  res.status(200).json({
    success: true,
    analytics: {
      totalAds: ads.length,
      activeAds: ads.filter(a => a.is_active).length,
      totalViews,
      totalClicks,
      avgCTR: `${avgCTR}%`,
    },
    ads: ads.map(a => cleanAd(a)),
  });
});

export const toggleSuvixAds = asyncHandler(async (req, res) => {
  const { showSuvixAds } = req.body;
  await SiteSettings.updateSettings({ showSuvixAds });

  res.status(200).json({ success: true, showSuvixAds, message: `Suvix ads ${showSuvixAds ? "enabled" : "disabled"}` });
  await delPattern('ads:*');
  await delPattern('settings:*');
});

export const getSiteSettingsPublic = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  res.status(200).json({
    success: true,
    settings: {
      showSuvixAds: settings?.showSuvixAds ?? true
    }
  });
});






