// adminAdRoutes.js - Full advertisement management for admin-server
import express from "express";
import multer from "multer";
import asyncHandler from "express-async-handler";
import { Advertisement } from "../models/Advertisement.js";
import { SiteSettings, getSettings } from "../models/SiteSettings.js";
import { protectAdmin, requirePermission, logActivity } from "../middleware/adminAuth.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Multer config (memory storage → stream to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  },
});

// Protect ALL routes (admin only)
router.use(protectAdmin);

// ── Utility: clean URLs mangled by security sanitizers ───────────────
const repairUrl = (val) => {
  if (!val || typeof val !== "string") return val;
  if (!val.includes("cloudinary") && !val.includes("res_") && !val.includes("_com")) return val;
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
    fixed = fixed.replace(/advertisements_images_+/g, "advertisements/images/")
                 .replace(/advertisements_videos_+/g, "advertisements/videos/")
                 .replace(/advertisements_gallery_+/g, "advertisements/gallery/");
    fixed = fixed.replace(/_+(upload|image|video|v\d+)_+/g, "/$1/");
    fixed = fixed.replace(/_([a-z0-9\-_]+\.(webp|jpg|jpeg|png|mp4|mov|m4v|json))/gi, "/$1");
    fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
  }
  fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1")
               .replace(/_jpeg([/_?#]|$)/gi, ".jpeg$1")
               .replace(/_png([/_?#]|$)/gi, ".png$1")
               .replace(/_mp4([/_?#]|$)/gi, ".mp4$1")
               .replace(/_webp([/_?#]|$)/gi, ".webp$1");
  return fixed;
};

const cleanAd = (ad) => {
  if (!ad) return ad;
  const adObj = ad.toObject ? ad.toObject() : ad;
  ["mediaUrl", "thumbnailUrl", "websiteUrl", "instagramUrl", "facebookUrl", "youtubeUrl", "otherUrl"]
    .forEach(f => { if (adObj[f]) adObj[f] = repairUrl(adObj[f]); });
  if (adObj.galleryImages) adObj.galleryImages = adObj.galleryImages.map(img => repairUrl(img));
  return adObj;
};

// ── GET /api/admin/ads — List all ads (with filters) ─────────────────
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

  logger.info(`[ADS] Admin fetched ${ads.length} ads`);
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

  const stats = await Advertisement.aggregate([
    { $group: { _id: null, totalViews: { $sum: "$views" }, totalClicks: { $sum: "$clicks" } } }
  ]);

  const s = stats[0] || { totalViews: 0, totalClicks: 0 };
  const avgCTR = s.totalViews > 0 ? `${((s.totalClicks / s.totalViews) * 100).toFixed(1)}%` : "0%";

  res.json({
    success: true,
    analytics: {
      totalAds: total,
      activeAds: active,
      pendingAds: pending,
      rejectedAds: rejected,
      totalViews: s.totalViews,
      totalClicks: s.totalClicks,
      avgCTR,
    }
  });
}));

// ── GET /api/admin/ads/settings ──────────────────────────────────────
router.get("/settings", asyncHandler(async (req, res) => {
  const settings = await getSettings();
  res.json({ success: true, settings: { showSuvixAds: settings.showSuvixAds } });
}));

// ── POST /api/admin/ads/toggle-suvix-ads ─────────────────────────────
router.post("/toggle-suvix-ads", requirePermission("marketing"), asyncHandler(async (req, res) => {
  const { showSuvixAds } = req.body;
  const settings = await SiteSettings.findOneAndUpdate(
    { key: "global" },
    { showSuvixAds },
    { upsert: true, new: true }
  );
  SiteSettings.clearCache?.();
  res.json({
    success: true,
    showSuvixAds: settings.showSuvixAds,
    message: `Suvix internal ads ${settings.showSuvixAds ? "enabled" : "disabled"}`,
  });
}));

// ── POST /api/admin/ads/upload — Primary media upload ───────────────
router.post("/upload", requirePermission("marketing"), upload.single("media"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  const isVideo = req.file.mimetype.startsWith("video/");
  const folder = isVideo ? "advertisements/videos" : "advertisements/images";
  const result = await uploadToCloudinary(req.file.buffer, folder);

  res.json({
    success: true,
    mediaUrl: result.url,
    mediaType: isVideo ? "video" : "image",
    thumbnailUrl: isVideo ? result.url.replace(/\.[^.]+$/, ".jpg") : null,
  });
}));

// ── POST /api/admin/ads/upload-gallery — Gallery (up to 5) ──────────
router.post("/upload-gallery", requirePermission("marketing"), upload.array("images", 5), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: "No files uploaded" });

  const results = await Promise.all(
    req.files.map(f => uploadToCloudinary(f.buffer, "advertisements/gallery"))
  );
  res.json({ success: true, galleryImages: results.map(r => r.url) });
}));

// ── GET /api/admin/ads/:id ───────────────────────────────────────────
router.get("/:id", asyncHandler(async (req, res) => {
  const ad = await Advertisement.findById(req.params.id);
  if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });
  res.json({ success: true, ad: cleanAd(ad) });
}));

// ── POST /api/admin/ads — Create ad ─────────────────────────────────
router.post("/", requirePermission("marketing"), logActivity("CREATE_AD"), asyncHandler(async (req, res) => {
  if (!req.body.title || !req.body.mediaUrl || !req.body.advertiserName) {
    return res.status(400).json({ success: false, message: "Advertiser name, title, and media are required" });
  }

  const maxOrder = await Advertisement.findOne().sort({ order: -1 }).select("order");
  const ad = await Advertisement.create({
    ...req.body,
    order: (maxOrder?.order || 0) + 1,
    createdBy: req.admin._id,
  });

  res.status(201).json({ success: true, ad: cleanAd(ad), message: "Advertisement created successfully" });
}));

// ── PATCH /api/admin/ads/:id — Update ad ────────────────────────────
router.patch("/:id", requirePermission("marketing"), logActivity("UPDATE_AD"), asyncHandler(async (req, res) => {
  const ad = await Advertisement.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true, runValidators: true }
  );
  if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });
  res.json({ success: true, ad: cleanAd(ad), message: "Advertisement updated successfully" });
}));

// ── DELETE /api/admin/ads/:id ────────────────────────────────────────
router.delete("/:id", requirePermission("marketing"), logActivity("DELETE_AD"), asyncHandler(async (req, res) => {
  const ad = await Advertisement.findByIdAndDelete(req.params.id);
  if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });
  res.json({ success: true, message: "Advertisement deleted successfully" });
}));

export default router;
