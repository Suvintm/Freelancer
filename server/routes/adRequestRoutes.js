// adRequestRoutes.js
// Mount on MAIN server at: app.use("/api/ad-requests", adRequestRoutes)
// All routes require logged-in user (protect middleware)

import express from "express";
import multer from "multer";
import asyncHandler from "express-async-handler";
import { AdRequest } from "../models/AdRequest.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import  protect from "../middleware/authMiddleware.js";
import logger from "../utils/logger.js";

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

// POST /api/ad-requests — logged-in user submits ad request
router.post(
  "/",
  protect,
  upload.single("media"),
  asyncHandler(async (req, res) => {
    const body = req.body;

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

    const adRequest = await AdRequest.create({
      userId:          req.user._id,
      suvixUserId:     req.user._id.toString(),
      advertiserName:  body.advertiserName.trim(),
      advertiserEmail: body.advertiserEmail.trim().toLowerCase(),
      advertiserPhone: body.advertiserPhone?.trim() || "",
      companyName:     body.companyName?.trim() || "",
      adType:          body.adType,
      placement:       body.placement,
      days:            parseInt(body.days),
      requestedPrice:  body.requestedPrice ? parseInt(body.requestedPrice) : undefined,
      title:           body.title.trim(),
      description:     body.description?.trim() || "",
      ctaText:         body.ctaText?.trim() || "Learn More",
      badge:           body.badge?.trim() || "SPONSOR",
      mediaType,
      mediaUrl,
      cloudinaryId,
      websiteUrl:      body.websiteUrl?.trim() || "",
      youtubeUrl:      body.youtubeUrl?.trim() || "",
      instagramUrl:    body.instagramUrl?.trim() || "",
      facebookUrl:     body.facebookUrl?.trim() || "",
      otherUrl:        body.otherUrl?.trim() || "",
      additionalNotes: body.additionalNotes?.trim() || "",
      status:          "pending",
    });

    logger.info(`[AD REQUEST] New: ${adRequest.advertiserEmail} — ${adRequest.adType} — ${adRequest.placement}`);

    res.status(201).json({
      success:   true,
      message:   "Ad request submitted successfully",
      requestId: adRequest._id.toString().slice(-8).toUpperCase(),
      fullId:    adRequest._id,
    });
  })
);

// GET /api/ad-requests/my — logged-in user sees their own requests
router.get(
  "/my",
  protect,
  asyncHandler(async (req, res) => {
    const requests = await AdRequest.find({ userId: req.user._id })
      .select("_id adType placement days status rejectionReason changesRequested requestedPrice title mediaUrl mediaType createdAt reviewedAt advertisementId paymentStatus")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, requests });
  })
);

// GET /api/ad-requests/status/:id — check one specific request
router.get(
  "/status/:id",
  protect,
  asyncHandler(async (req, res) => {
    const request = await AdRequest.findOne({
      _id:    req.params.id,
      userId: req.user._id,
    }).select("_id adType placement days status rejectionReason changesRequested requestedPrice title mediaUrl mediaType createdAt reviewedAt advertisementId paymentStatus");

    if (!request)
      return res.status(404).json({ success: false, message: "Request not found" });

    res.json({ success: true, request });
  })
);

export default router;