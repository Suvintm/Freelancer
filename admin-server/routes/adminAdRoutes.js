// adminAdRoutes.js - Full advertisement management for admin-server
// KEY CHANGE: Media is uploaded to Cloudinary ONLY when admin clicks "Publish Ad".
// reelConfig is parsed as JSON and saved alongside layoutConfig/buttonStyle.
import express from "express";
import multer from "multer";
import asyncHandler from "express-async-handler";
import { Advertisement } from "../models/Advertisement.js";
import { AdPreview } from "../models/AdPreview.js";
import { SiteSettings, getSettings } from "../models/SiteSettings.js";
import { protectAdmin, requirePermission, logActivity } from "../middleware/adminAuth.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/uploadToCloudinary.js";
import { publish } from "../config/redisClient.js";
import { getIO } from "../socket.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Multer — memory storage, stream to Cloudinary on final submit only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
});

// ── NEW: Cloudinary Media Webhook ────────────────────────────────────
// This route is PUBLIC so Cloudinary can call it.
// It updates the database when background video processing is done.
router.post("/webhook", asyncHandler(async (req, res) => {
  const { notification_type, public_id, secure_url, eager, original_filename } = req.body;

  if (notification_type === "upload") {
    console.log(`📡 [Webhook] Received upload notification for: ${public_id}`);
    
    // Find the ad by its mediaPublicId
    const ad = await Advertisement.findOne({ 
      $or: [{ mediaPublicId: public_id }, { thumbnailPublicId: public_id }] 
    });

    if (ad) {
      if (eager && eager.length > 0) {
        // We found our optimized H.264 version!
        const optimizedUrl = eager[0].secure_url;
        ad.mediaUrl = optimizedUrl;
        ad.mediaStatus = "ready";
        ad.isOptimized = true;
        await ad.save();
        
        console.log(`✅ [Webhook] Ad "${ad.title}" updated with optimized video.`);
        
        // Notify the frontend via Socket.io
        if (io) {
          io.emit("media:status_update", { 
            adId: ad._id, 
            status: "ready", 
            url: optimizedUrl,
            title: ad.title
          });
        }
      }
    }
  }
  res.status(200).json({ received: true });
}));

// Protect all remaining routes
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
  // reelConfig has no URLs — pass through as-is
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

// GET /api/admin/ads/preview-media
router.get("/preview-media", asyncHandler(async (req, res) => {
  const previews = await AdPreview.getPreviews();
  res.json({ success: true, previews });
}));

// PATCH /api/admin/ads/preview-media
router.patch(
  "/preview-media",
  requirePermission("marketing"),
  logActivity("UPDATE_AD_PREVIEW"),
  upload.single("media"),
  asyncHandler(async (req, res) => {
    const { type } = req.body;
    if (!["homeAdBanner", "reelAd"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid preview type. Must be 'homeAdBanner' or 'reelAd'." });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a media file." });
    }
    const previews = await AdPreview.getPreviews();
    const oldMedia = previews[type];
    const isVideo = req.file.mimetype.startsWith("video/");
    const folder = isVideo ? "ad-previews/videos" : "ad-previews/images";
    const result = await uploadToCloudinary(req.file.buffer, folder);
    previews[type] = { url: result.url, publicId: result.public_id, resourceType: isVideo ? "video" : "image" };
    await previews.save();
    if (oldMedia && oldMedia.publicId && oldMedia.publicId !== "sample" && oldMedia.publicId !== "sample_video") {
      deleteFromCloudinary(oldMedia.publicId).catch(err => logger.error(`[CLOUDINARY] Failed to delete old ad preview: ${oldMedia.publicId}`, err));
    }
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
router.post(
  "/",
  requirePermission("marketing"),
  logActivity("CREATE_AD"),
  upload.fields([
    { name: "media",   maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  asyncHandler(async (req, res) => {
    console.log("🚀 [Admin] Starting banner save process...");
    try {
      const body = req.body;

      if (!body.title || !body.advertiserName) {
        console.warn("⚠️  [Admin] Missing required fields: title or advertiserName");
        return res.status(400).json({ success: false, message: "Advertiser name and title are required" });
      }

      // ── Parse JSON sub-objects ──
      const cropData      = parseJSON(body.cropData);
      const layoutConfig  = parseJSON(body.layoutConfig);
      const buttonStyle   = parseJSON(body.buttonStyle);
      const reelConfig    = parseJSON(body.reelConfig); 
      const displayLocations = parseJSON(body.displayLocations, ["banners:home_0"]);

      const maxOrder = await Advertisement.findOne().sort({ order: -1 }).select("order");

      // ── 1. Create the Ad Record IMMEDIATELY (Placeholder Status) ──
      const isVideoUpload = req.files?.media?.[0]?.mimetype?.startsWith("video/");
      
      const ad = await Advertisement.create({
        advertiserName:  body.advertiserName,
        advertiserEmail: body.advertiserEmail,
        advertiserPhone: body.advertiserPhone,
        companyName:     body.companyName,
        title:           body.title,
        tagline:         body.tagline,
        description:     body.description,
        longDescription: body.longDescription,
        mediaType:       body.mediaType || (isVideoUpload ? 'video' : 'image'),
        mediaUrl:        body.mediaUrl || "https://res.cloudinary.com/suvix/video/upload/v1711200000/placeholder_video.mp4", // Placeholder during upload
        thumbnailUrl:    body.thumbnailUrl || "",
        galleryImages:   [], // To be updated in background
        websiteUrl:      body.websiteUrl,
        ctaText:         body.ctaText || "Learn More",
        isActive:        body.isActive === "true" || body.isActive === true,
        isDefault:       body.isDefault === "true" || body.isDefault === true,
        displayLocations,
        adType:          body.adType || "promotional",
        priority:        body.priority || "medium",
        order:           (maxOrder?.order || 0) + 1,
        approvalStatus:  body.approvalStatus || "pending",
        createdBy:       req.admin._id,
        cropData,
        layoutConfig,
        buttonStyle,
        reelConfig,
        mediaStatus:     "uploading", // 👈 STARTING STATUS
        isOptimized:     false,
      });

      // ── 2. Respond to Frontend IMMEDIATELY — No More Spinning! ──
      res.status(201).json({ 
        success: true, 
        ad: cleanAd(ad), 
        message: "Advertisement created! Uploading media in background..." 
      });

      // ── 3. Background Process: Upload files to Cloudinary ──
      // This runs after the response is sent.
      (async () => {
        try {
          const io = getIO();
          console.log(`🎬 [Background] Starting Cloudinary transfer for Ad: ${ad.title}`);
          const files = req.files;
          let finalMediaUrl = ad.mediaUrl;
          let finalMediaPublicId = "";
          let finalGallery = [];

          // Initialize progress
          ad.uploadProgress = 10;
          await ad.save();
          if (io) io.emit("media:progress", { adId: ad._id, status: "uploading", progress: 10 });

          // A. Primary Media
          if (files?.media?.[0]) {
            const file = files.media[0];
            const isVideo = file.mimetype.startsWith('video/');
            const folder  = isVideo ? 'advertisements/videos' : 'advertisements/images';

            const options = {
              notification_url: `${req.protocol}://${req.get('host')}/api/admin/ads/webhook`
            };
            if (isVideo) {
              options.eager = [{ format: 'mp4', video_codec: 'h264', audio_codec: 'aac', width: 1080, crop: 'limit', quality: 'auto' }];
              options.eager_async = true;
            }

            const result = await uploadToCloudinary(
              file.buffer, 
              folder, 
              options, 
              (p) => {
                const percent = typeof p === "function" ? p(ad.uploadProgress || 10) : p;
                ad.uploadProgress = percent;
                if (io) io.emit("media:progress", { adId: ad._id, status: "uploading", progress: percent });
              }
            );
            finalMediaUrl = result.secure_url || result.url;
            finalMediaPublicId = result.public_id;
            
            if (finalMediaUrl) {
              // If it's a video, status becomes 'processing' (Cloudinary is doing eager transcode)
              // If it's an image, status becomes 'ready' immediately
              ad.mediaStatus = isVideo ? "processing" : "ready";
              ad.mediaUrl = finalMediaUrl;
              ad.mediaPublicId = finalMediaPublicId;
              ad.isOptimized = !isVideo;
              ad.thumbnailUrl = isVideo ? finalMediaUrl.replace(/\.[^.]+$/, '.jpg') : ad.thumbnailUrl;
            } else {
              throw new Error("Cloudinary upload did not return a valid URL.");
            }
          }

          // B. Gallery
          if (files?.gallery?.length) {
            const galleryResults = await Promise.all(
              files.gallery.map(f => uploadToCloudinary(f.buffer, "advertisements/gallery"))
            );
            finalGallery = galleryResults.map(r => r.secure_url || r.url);
            ad.galleryImages = finalGallery;
          }

          await ad.save();
          console.log(`✅ [Background] Transfer complete for "${ad.title}". Status: ${ad.mediaStatus}`);

          // C. Notify UI via Socket.io
          if (io) {
            io.emit("media:status_update", { 
              adId: ad._id, 
              status: ad.mediaStatus, 
              url: ad.mediaUrl,
              title: ad.title
            });
          }
        } catch (bgError) {
          console.error(`💥 [Background Error] Failed to upload media for Ad "${ad._id}":`, bgError);
          ad.mediaStatus = "failed";
          await ad.save();
          if (io) io.emit("media:status_update", { adId: ad._id, status: "failed", title: ad.title });
        }
      })();

      await publishAdUpdate();
      logger.info(`[ADS] Created: ${ad.title}`);
      return; // 👈 Logic stops here, background task continues independently
    } catch (error) {
      console.error("💥 [Admin] Error saving advertisement:", error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Server error during banner save: " + error.message });
      }
    }
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
    console.log(`🚀 [Admin] Starting banner update process for ID: ${req.params.id}...`);
    try {
      const ad = await Advertisement.findById(req.params.id);
      if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });

      const body = req.body;

      if (body.reelConfig   !== undefined) ad.reelConfig   = { ...ad.reelConfig?.toObject?.()   || ad.reelConfig   || {}, ...parseJSON(body.reelConfig) };

      // ── Scalar fields ──
      const scalarFields = [
        "advertiserName","advertiserEmail","advertiserPhone","companyName",
        "title","tagline","description","longDescription",
        "websiteUrl","instagramUrl","facebookUrl","youtubeUrl","otherUrl","ctaText",
        "badge","adminNotes","approvalStatus","priority","order",
        "startDate","endDate","adType",
        "buttonLinkType","buttonLink","cardLinkType","cardLink",
      ];
      scalarFields.forEach(f => { if (body[f] !== undefined) ad[f] = body[f]; });

      // ── Boolean fields ──
      if (body.isActive  !== undefined) ad.isActive  = body.isActive  === "true" || body.isActive  === true;
      if (body.isDefault !== undefined) ad.isDefault = body.isDefault === "true" || body.isDefault === true;
      if (body.displayLocations !== undefined) ad.displayLocations = parseJSON(body.displayLocations, ad.displayLocations);
      if (body.tags !== undefined) ad.tags = parseJSON(body.tags, ad.tags);

      // Set initial status if new media is arriving
      const hasNewMedia = !!req.files?.media?.[0];
      if (hasNewMedia) ad.mediaStatus = "uploading";

      await ad.save();

      // ── Respond to Frontend IMMEDIATELY — No More Spinning! ──
      res.json({ 
        success: true, 
        ad: cleanAd(ad), 
        message: hasNewMedia ? "Ad updated! Uploading new media in background..." : "Ad updated successfully" 
      });

      // ── Background Process: Upload new media if provided ──
      if (hasNewMedia || req.files?.gallery?.length) {
        (async () => {
          try {
            const io = getIO();
            console.log(`🎬 [Background-Patch] Starting media sync for Ad: ${ad.title}`);
            const files = req.files;

            // Initialize progress
            ad.uploadProgress = 10;
            await ad.save();
            if (io) io.emit("media:progress", { adId: ad._id, status: "uploading", progress: 10 });

            // A. New Primary Media
            if (files?.media?.[0]) {
              const file = files.media[0];
              const isVideo = file.mimetype.startsWith('video/');
              const folder  = isVideo ? 'advertisements/videos' : 'advertisements/images';

              const options = { notification_url: `${req.protocol}://${req.get('host')}/api/admin/ads/webhook` };
              if (isVideo) {
                options.eager = [{ format: 'mp4', video_codec: 'h264', audio_codec: 'aac', width: 1080, crop: 'limit', quality: 'auto' }];
                options.eager_async = true;
              }

              const result = await uploadToCloudinary(
                file.buffer, 
                folder, 
                options,
                (p) => {
                  const percent = typeof p === "function" ? p(ad.uploadProgress || 10) : p;
                  ad.uploadProgress = percent;
                  if (io) io.emit("media:progress", { adId: ad._id, status: "uploading", progress: percent });
                }
              );
              ad.mediaUrl = result.secure_url || result.url;
              ad.mediaPublicId = result.public_id;
              
              if (ad.mediaUrl) {
                ad.mediaStatus = isVideo ? "processing" : "ready";
                ad.isOptimized = !isVideo;
                ad.thumbnailUrl = isVideo ? ad.mediaUrl.replace(/\.[^.]+$/, '.jpg') : ad.thumbnailUrl;
              } else {
                throw new Error("Cloudinary update did not return a valid URL.");
              }
            }

            // B. New Gallery items
            if (files?.gallery?.length) {
              const galleryResults = await Promise.all(
                files.gallery.map(f => uploadToCloudinary(f.buffer, "advertisements/gallery"))
              );
              const existing = ad.galleryImages || [];
              ad.galleryImages = [...existing, ...galleryResults.map(r => r.secure_url || r.url)].slice(0, 5);
            }

            await ad.save();
            console.log(`✅ [Background-Patch] Media sync complete for "${ad.title}"`);

            if (io) {
              io.emit("media:status_update", { 
                adId: ad._id, 
                status: ad.mediaStatus, 
                url: ad.mediaUrl,
                title: ad.title
              });
            }
          } catch (bgError) {
            console.error(`💥 [Background-Patch Error] Failed:`, bgError);
            ad.mediaStatus = "failed";
            await ad.save();
            if (io) io.emit("media:status_update", { adId: ad._id, status: "failed", title: ad.title });
          }
        })();
      }

      await publishAdUpdate();
      logger.info(`[ADS] Updated: ${ad.title}`);
      return;
    } catch (error) {
      console.error("💥 [Admin] Error updating advertisement:", error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Server error during banner update: " + error.message });
      }
    }
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