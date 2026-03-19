// adminAdRoutes.js - Full advertisement management for admin-server
// KEY CHANGE: Media is uploaded to Cloudinary ONLY when admin clicks "Publish Ad".
// Previously the upload fired the moment a file was picked — now the frontend
// holds the file in state, the admin configures everything, then one POST/PATCH
// sends the file + all config together.
import express from "express";
import multer from "multer";
import asyncHandler from "express-async-handler";
import { Advertisement } from "../models/Advertisement.js";
import { AdPreview } from "../models/AdPreview.js";
import { SiteSettings, getSettings } from "../models/SiteSettings.js";
import { protectAdmin, requirePermission, logActivity } from "../middleware/adminAuth.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/uploadToCloudinary.js";
import { publish } from "../config/redisClient.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Multer — memory storage, stream to Cloudinary on final submit only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  },
});

// Protect all routes
router.use(protectAdmin);

// ── URL repair ───────────────────────────────────────────────────────
const repairUrl = (val) => {
  if (!val || typeof val !== "string") return val;
  if (val.includes("res.cloudinary.com") && !val.includes("res_cloudinary") && !val.includes("cloudinary_com")) return val;
  if (val.includes("cloudinary") || val.includes("res_") || val.includes("_com")) {
    let fixed = val;
    fixed = fixed.replace(/^(https?):?\/*_+/gi, "$1://");
    fixed = fixed.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com").replace(/res_cloudinary_com/g, "res.cloudinary.com").replace(/cloudinary_com/g, "cloudinary.com");
    if (fixed.includes("res.cloudinary.com")) {
      fixed = fixed.replace(/res\.cloudinary\.com_+/g, "res.cloudinary.com/");
      fixed = fixed.replace(/image_upload_+/g, "image/upload/").replace(/video_upload_+/g, "video/upload/").replace(/raw_upload_+/g, "raw/upload/");
      fixed = fixed.replace(/([/_]?v\d+)_+/g, "$1/");
      fixed = fixed.replace(/(res\.cloudinary\.com\/[^/_]+)_+(image|video|raw|authenticated)_*/g, "$1/$2/");
      fixed = fixed.replace(/advertisements_images_+/g, "advertisements/images/").replace(/advertisements_videos_+/g, "advertisements/videos/").replace(/advertisements_gallery_+/g, "advertisements/gallery/");
      fixed = fixed.replace(/_+(upload|image|video|v\d+)_+/g, "/$1/");
      fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
    }
    fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1").replace(/_png([/_?#]|$)/gi, ".png$1").replace(/_mp4([/_?#]|$)/gi, ".mp4$1").replace(/_webp([/_?#]|$)/gi, ".webp$1");
    return fixed;
  }
  return val;
};

const cleanAd = (ad) => {
  if (!ad) return ad;
  const adObj = ad.toObject ? ad.toObject() : ad;
  ["mediaUrl", "thumbnailUrl", "websiteUrl", "instagramUrl", "facebookUrl", "youtubeUrl", "otherUrl"].forEach(f => {
    if (adObj[f]) adObj[f] = repairUrl(adObj[f]);
  });
  if (adObj.galleryImages?.length) adObj.galleryImages = adObj.galleryImages.map(img => repairUrl(img));
  else adObj.galleryImages = adObj.galleryImages || [];
  return adObj;
};

const publishAdUpdate = async () => {
  await publish("admin:events", { type: "ads:updated" });
};

// ── Helper: parse JSON fields safely (they come as form-data strings) ─
const parseJSON = (val, fallback = {}) => {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

// ── GET /api/admin/ads ── List all ads ───────────────────────────────
router.get("/", asyncHandler(async (req, res) => {
  const { status, location, priority, page = 1, limit = 50, search } = req.query;
  const query = {};
  if (status && status !== "all") {
    if (status === "active") query.isActive = true;
    else if (status === "inactive") query.isActive = false;
    else if (["pending", "approved", "rejected"].includes(status)) query.approvalStatus = status;
  }
  if (location) query.displayLocations = { $in: [location] };
  if (priority) query.priority = priority;
  if (search) query.title = { $regex: search, $options: "i" };

  const ads = await Advertisement.find(query)
    .sort({ order: 1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate("createdBy", "name email");

  const total = await Advertisement.countDocuments(query);
  res.json({ success: true, count: ads.length, ads: ads.map(cleanAd), pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
}));

// ── GET /api/admin/ads/analytics ─────────────────────────────────────
router.get("/analytics", asyncHandler(async (req, res) => {
  const [total, active, pending, rejected] = await Promise.all([
    Advertisement.countDocuments({}),
    Advertisement.countDocuments({ isActive: true, approvalStatus: "approved" }),
    Advertisement.countDocuments({ approvalStatus: "pending" }),
    Advertisement.countDocuments({ approvalStatus: "rejected" }),
  ]);
  const stats = await Advertisement.aggregate([{ $group: { _id: null, totalViews: { $sum: "$views" }, totalClicks: { $sum: "$clicks" } } }]);
  const s = stats[0] || { totalViews: 0, totalClicks: 0 };
  const avgCTR = s.totalViews > 0 ? `${((s.totalClicks / s.totalViews) * 100).toFixed(1)}%` : "0%";
  res.json({ success: true, analytics: { totalAds: total, activeAds: active, pendingAds: pending, rejectedAds: rejected, totalViews: s.totalViews, totalClicks: s.totalClicks, avgCTR } });
}));

// ── GET /api/admin/ads/settings ──────────────────────────────────────
router.get("/settings", asyncHandler(async (req, res) => {
  const settings = await getSettings();
  res.json({ success: true, settings: { showSuvixAds: settings.showSuvixAds } });
}));

// ── POST /api/admin/ads/toggle-suvix-ads ─────────────────────────────
router.post("/toggle-suvix-ads", requirePermission("marketing"), asyncHandler(async (req, res) => {
  const { showSuvixAds } = req.body;
  const settings = await SiteSettings.findOneAndUpdate({ key: "global" }, { showSuvixAds }, { upsert: true, new: true });
  SiteSettings.clearCache?.();
  await publishAdUpdate();
  res.json({ success: true, showSuvixAds: settings.showSuvixAds, message: `Suvix internal ads ${settings.showSuvixAds ? "enabled" : "disabled"}` });
}));

// ── AD PREVIEW MANAGEMENT ───────────────────────────────────────────

// GET /api/admin/ads/preview-media — Get current demo previews
router.get("/preview-media", asyncHandler(async (req, res) => {
  const previews = await AdPreview.getPreviews();
  res.json({ success: true, previews });
}));

// PATCH /api/admin/ads/preview-media — Update demo preview
router.patch(
  "/preview-media",
  requirePermission("marketing"),
  logActivity("UPDATE_AD_PREVIEW"),
  upload.single("media"),
  asyncHandler(async (req, res) => {
    const { type } = req.body; // 'homeAdBanner' or 'reelAd'
    if (!["homeAdBanner", "reelAd"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid preview type. Must be 'homeAdBanner' or 'reelAd'." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a media file." });
    }

    const previews = await AdPreview.getPreviews();
    const oldMedia = previews[type];

    // Upload new media
    const isVideo = req.file.mimetype.startsWith("video/");
    const folder = isVideo ? "ad-previews/videos" : "ad-previews/images";
    const result = await uploadToCloudinary(req.file.buffer, folder);

    // Update DB
    previews[type] = {
      url: result.url,
      publicId: result.public_id,
      resourceType: isVideo ? "video" : "image"
    };

    await previews.save();

    // Delete old media from Cloudinary (don't await to avoid delaying response, but handle errors)
    if (oldMedia && oldMedia.publicId && oldMedia.publicId !== "sample" && oldMedia.publicId !== "sample_video") {
      deleteFromCloudinary(oldMedia.publicId).catch(err => logger.error(`[CLOUDINARY] Failed to delete old ad preview: ${oldMedia.publicId}`, err));
    }

    // Notify frontend via Redis
    await publish("admin:events", { type: "ad-previews:updated" });

    res.json({ success: true, previews, message: `${type} updated successfully` });
  })
);

// ── GET /api/admin/ads/:id ───────────────────────────────────────────
router.get("/:id", asyncHandler(async (req, res) => {
  const ad = await Advertisement.findById(req.params.id);
  if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });
  res.json({ success: true, ad: cleanAd(ad) });
}));

// ── POST /api/admin/ads — Create ad (with optional media upload) ─────
// Media upload NOW fires here — not on file pick.
// The frontend sends multipart/form-data with:
//   - media (file, optional if editing with existing URL)
//   - gallery (files[], optional)
//   - all other fields as form fields or JSON strings
router.post(
  "/",
  requirePermission("marketing"),
  logActivity("CREATE_AD"),
  upload.fields([
    { name: "media",   maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  asyncHandler(async (req, res) => {
    const body = req.body;

    if (!body.title || !body.advertiserName) {
      return res.status(400).json({ success: false, message: "Advertiser name and title are required" });
    }

    // ── Upload media to Cloudinary now ──
    let mediaUrl = body.mediaUrl || "";
    let mediaType = body.mediaType || "image";
    let thumbnailUrl = body.thumbnailUrl || "";

    if (req.files?.media?.[0]) {
      const file = req.files.media[0];
      const isVideo = file.mimetype.startsWith("video/");
      const folder = isVideo ? "advertisements/videos" : "advertisements/images";
      const result = await uploadToCloudinary(file.buffer, folder);
      mediaUrl = result.url;
      mediaType = isVideo ? "video" : "image";
      thumbnailUrl = isVideo ? result.url.replace(/\.[^.]+$/, ".jpg") : "";
    }

    if (!mediaUrl) {
      return res.status(400).json({ success: false, message: "A media file is required" });
    }

    // ── Upload gallery images ──
    let galleryImages = parseJSON(body.galleryImages, []);
    if (req.files?.gallery?.length) {
      const galleryResults = await Promise.all(
        req.files.gallery.map(f => uploadToCloudinary(f.buffer, "advertisements/gallery"))
      );
      galleryImages = [...galleryImages, ...galleryResults.map(r => r.url)].slice(0, 5);
    }

    // ── Parse JSON sub-objects ──
    const cropData    = parseJSON(body.cropData);
    const layoutConfig = parseJSON(body.layoutConfig);
    const buttonStyle  = parseJSON(body.buttonStyle);
    const displayLocations = parseJSON(body.displayLocations, ["home_banner"]);

    const maxOrder = await Advertisement.findOne().sort({ order: -1 }).select("order");

    const ad = await Advertisement.create({
      advertiserName:  body.advertiserName,
      advertiserEmail: body.advertiserEmail,
      advertiserPhone: body.advertiserPhone,
      companyName:     body.companyName,
      title:           body.title,
      tagline:         body.tagline,
      description:     body.description,
      longDescription: body.longDescription,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      galleryImages,
      websiteUrl:   body.websiteUrl,
      instagramUrl: body.instagramUrl,
      facebookUrl:  body.facebookUrl,
      youtubeUrl:   body.youtubeUrl,
      otherUrl:     body.otherUrl,
      ctaText:      body.ctaText || "Learn More",
      isActive:     body.isActive === "true" || body.isActive === true,
      isDefault:    body.isDefault === "true" || body.isDefault === true,
      displayLocations,
      badge:          body.badge || "SPONSOR",
      startDate:      body.startDate,
      endDate:        body.endDate,
      priority:       body.priority || "medium",
      order:          (maxOrder?.order || 0) + 1,
      adminNotes:     body.adminNotes,
      approvalStatus: body.approvalStatus || "pending",
      createdBy:      req.admin._id,
      cropData,
      layoutConfig,
      buttonStyle,
    });

    await publishAdUpdate();
    logger.info(`[ADS] Created: ${ad.title} by ${ad.advertiserName}`);
    res.status(201).json({ success: true, ad: cleanAd(ad), message: "Advertisement created successfully" });
  })
);

// ── PATCH /api/admin/ads/:id — Update ad ─────────────────────────────
router.patch(
  "/:id",
  requirePermission("marketing"),
  logActivity("UPDATE_AD"),
  upload.fields([
    { name: "media",   maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  asyncHandler(async (req, res) => {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });

    const body = req.body;

    // ── Re-upload media only if a new file was sent ──
    if (req.files?.media?.[0]) {
      const file = req.files.media[0];
      const isVideo = file.mimetype.startsWith("video/");
      const folder = isVideo ? "advertisements/videos" : "advertisements/images";
      const result = await uploadToCloudinary(file.buffer, folder);
      ad.mediaUrl = result.url;
      ad.mediaType = isVideo ? "video" : "image";
      ad.thumbnailUrl = isVideo ? result.url.replace(/\.[^.]+$/, ".jpg") : "";
    }

    // ── Append gallery images if new ones sent ──
    if (req.files?.gallery?.length) {
      const galleryResults = await Promise.all(
        req.files.gallery.map(f => uploadToCloudinary(f.buffer, "advertisements/gallery"))
      );
      const existing = ad.galleryImages || [];
      ad.galleryImages = [...existing, ...galleryResults.map(r => r.url)].slice(0, 5);
    } else if (body.galleryImages !== undefined) {
      ad.galleryImages = parseJSON(body.galleryImages, ad.galleryImages);
    }

    // ── Scalar fields ──
    const scalarFields = [
      "advertiserName","advertiserEmail","advertiserPhone","companyName",
      "title","tagline","description","longDescription",
      "websiteUrl","instagramUrl","facebookUrl","youtubeUrl","otherUrl","ctaText",
      "badge","adminNotes","approvalStatus","priority","order",
      "startDate","endDate",
    ];
    scalarFields.forEach(f => { if (body[f] !== undefined) ad[f] = body[f]; });

    // ── Boolean fields ──
    if (body.isActive  !== undefined) ad.isActive  = body.isActive  === "true" || body.isActive  === true;
    if (body.isDefault !== undefined) ad.isDefault = body.isDefault === "true" || body.isDefault === true;
    if (body.displayLocations !== undefined) ad.displayLocations = parseJSON(body.displayLocations, ad.displayLocations);

    // ── JSON sub-objects — deep merge so partial updates work ──
    if (body.cropData    !== undefined) ad.cropData    = { ...ad.cropData?.toObject?.() || ad.cropData    || {}, ...parseJSON(body.cropData) };
    if (body.layoutConfig !== undefined) ad.layoutConfig = { ...ad.layoutConfig?.toObject?.() || ad.layoutConfig || {}, ...parseJSON(body.layoutConfig) };
    if (body.buttonStyle  !== undefined) ad.buttonStyle  = { ...ad.buttonStyle?.toObject?.() || ad.buttonStyle  || {}, ...parseJSON(body.buttonStyle) };

    await ad.save();
    await publishAdUpdate();
    logger.info(`[ADS] Updated: ${ad.title}`);
    res.json({ success: true, ad: cleanAd(ad), message: "Advertisement updated successfully" });
  })
);

// ── DELETE /api/admin/ads/:id ────────────────────────────────────────
router.delete("/:id", requirePermission("marketing"), logActivity("DELETE_AD"), asyncHandler(async (req, res) => {
  const ad = await Advertisement.findByIdAndDelete(req.params.id);
  if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });
  await publishAdUpdate();
  res.json({ success: true, message: "Advertisement deleted successfully" });
}));

// ── POST /api/admin/ads/reorder ──────────────────────────────────────
router.post("/reorder", requirePermission("marketing"), asyncHandler(async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) return res.status(400).json({ success: false, message: "orderedIds must be an array" });
  const updates = orderedIds.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { order: index } } }));
  await Advertisement.bulkWrite(updates);
  await publishAdUpdate();
  res.json({ success: true, message: "Ads reordered" });
}));


export default router;