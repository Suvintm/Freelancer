// adRequestRoutes.js - Prisma/PostgreSQL migration
import express from "express";
import multer from "multer";
import asyncHandler from "express-async-handler";
import prisma from "../../../config/prisma.js";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";
import protect from "../../../middleware/authMiddleware.js";
import logger from "../../../utils/logger.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  },
});

// Helper to map Prisma adRequest to camelCase for frontend
const mapAdRequest = (req) => {
  if (!req) return null;
  return {
    id: req.id,
    _id: req.id, // Legacy compatibility
    user_id: req.user_id,
    advertiserName: req.advertiser_name,
    advertiserEmail: req.advertiser_email,
    advertiserPhone: req.advertiser_phone,
    companyName: req.company_name,
    adType: req.ad_type,
    placement: req.placement,
    days: req.days,
    requestedPrice: req.requested_price,
    title: req.title,
    description: req.description,
    ctaText: req.cta_text,
    badge: req.badge,
    mediaType: req.media_type,
    mediaUrl: req.media_url,
    status: req.status,
    rejectionReason: req.rejection_reason,
    changesRequested: req.changes_requested,
    reviewedAt: req.reviewed_at,
    advertisementId: req.advertisement_id,
    paymentStatus: req.payment_status,
    createdAt: req.created_at
  };
};

// POST /api/ad-requests — logged-in user submits ad request
router.post(
  "/",
  protect,
  upload.single("media"),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const userId = req.user.id;

    if (!body.advertiserName?.trim())
      return res.status(400).json({ success: false, message: "Advertiser name is required" });
    if (!body.advertiserEmail?.trim())
      return res.status(400).json({ success: false, message: "Email is required" });
    if (!body.title?.trim())
      return res.status(400).json({ success: false, message: "Ad title is required" });
    if (!body.adType)
      return res.status(400).json({ success: false, message: "Ad type is required" });
    if (!body.placement)
      return res.status(400).json({ success: false, message: "Placement is required" });
    if (!body.days)
      return res.status(400).json({ success: false, message: "Campaign duration is required" });
    if (!req.file && !body.existingMediaUrl)
      return res.status(400).json({ success: false, message: "A banner image or video is required" });

    let mediaUrl = body.existingMediaUrl || "";
    let cloudinaryId = "";
    let mediaType = body.mediaType || "image";

    if (req.file) {
      const isVideo = req.file.mimetype.startsWith("video/");
      const folder = isVideo ? "ad-requests/videos" : "ad-requests/images";
      const result = await uploadToCloudinary(req.file.buffer, folder);
      mediaUrl = result.url;
      cloudinaryId = result.public_id || "";
      mediaType = isVideo ? "video" : "image";
    }

    const adRequest = await prisma.adRequest.create({
      data: {
        user_id:          userId,
        suvix_user_id:     userId,
        advertiser_name:  body.advertiserName.trim(),
        advertiser_email: body.advertiserEmail.trim().toLowerCase(),
        advertiser_phone: body.advertiserPhone?.trim() || "",
        company_name:     body.companyName?.trim() || "",
        ad_type:          body.adType,
        placement:       body.placement,
        days:            parseInt(body.days),
        requested_price:  body.requestedPrice ? parseInt(body.requestedPrice) : undefined,
        title:           body.title.trim(),
        description:     body.description?.trim() || "",
        cta_text:         body.ctaText?.trim() || "Learn More",
        badge:           body.badge?.trim() || "SPONSOR",
        media_type:      mediaType,
        media_url:       mediaUrl,
        cloudinary_id:   cloudinaryId,
        website_url:      body.websiteUrl?.trim() || "",
        youtube_url:      body.youtubeUrl?.trim() || "",
        instagram_url:    body.instagram_url?.trim() || "",
        facebook_url:     body.facebook_url?.trim() || "",
        other_url:        body.other_url?.trim() || "",
        additional_notes: body.additionalNotes?.trim() || "",
        status:          "pending",
      }
    });

    logger.info(`[AD REQUEST] New: ${adRequest.advertiser_email} — ${adRequest.ad_type} — ${adRequest.placement}`);

    res.status(201).json({
      success:   true,
      message:   "Ad request submitted successfully",
      requestId: adRequest.id.slice(-8).toUpperCase(),
      fullId:    adRequest.id,
    });
  })
);

// GET /api/ad-requests/my — logged-in user sees their own requests
router.get(
  "/my",
  protect,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const requests = await prisma.adRequest.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20
    });
    res.json({ success: true, requests: requests.map(mapAdRequest) });
  })
);

// GET /api/ad-requests/status/:id — check one specific request
router.get(
  "/status/:id",
  protect,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const request = await prisma.adRequest.findFirst({
      where: {
        id: req.params.id,
        user_id: userId,
      }
    });

    if (!request)
      return res.status(404).json({ success: false, message: "Request not found" });

    res.json({ success: true, request: mapAdRequest(request) });
  })
);

export default router;





