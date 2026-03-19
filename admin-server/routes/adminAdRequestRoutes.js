// adminAdRequestRoutes.js
// Mount on admin-server at: app.use("/api/admin/ad-requests", adminAdRequestRouter)

import express from "express";
import asyncHandler from "express-async-handler";
import { AdRequest } from "../models/AdRequest.js";
import { Advertisement } from "../models/Advertisement.js";
import { protectAdmin, requirePermission, logActivity } from "../middleware/adminAuth.js";
import { publish } from "../config/redisClient.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Protect all routes
router.use(protectAdmin);

// ── GET /api/admin/ad-requests — List all requests with filters ───────────
router.get("/", asyncHandler(async (req, res) => {
  const { status, adType, page = 1, limit = 30, search } = req.query;
  const query = {};

  if (status && status !== "all") query.status = status;
  if (adType) query.adType = adType;
  if (search) {
    query.$or = [
      { advertiserName:  { $regex: search, $options: "i" } },
      { advertiserEmail: { $regex: search, $options: "i" } },
      { title:           { $regex: search, $options: "i" } },
    ];
  }

  const [requests, total, pendingCount] = await Promise.all([
    AdRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    AdRequest.countDocuments(query),
    AdRequest.countDocuments({ status: "pending" }),
  ]);

  res.json({
    success: true,
    requests,
    pendingCount,
    pagination: {
      page:  parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// ── GET /api/admin/ad-requests/:id — Single request detail ───────────────
router.get("/:id", asyncHandler(async (req, res) => {
  const request = await AdRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ success: false, message: "Request not found" });
  res.json({ success: true, request });
}));

// ── PATCH /api/admin/ad-requests/:id/review — Mark as under review ────────
router.patch("/:id/review", requirePermission("marketing"), asyncHandler(async (req, res) => {
  const request = await AdRequest.findByIdAndUpdate(
    req.params.id,
    { status: "under_review", reviewedBy: req.admin._id },
    { new: true }
  );
  if (!request) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, request, message: "Marked as under review" });
}));

// ── PATCH /api/admin/ad-requests/:id/approve ─────────────────────────────
// Approves request AND auto-creates an Advertisement document
router.patch(
  "/:id/approve",
  requirePermission("marketing"),
  logActivity("APPROVE_AD_REQUEST"),
  asyncHandler(async (req, res) => {
    const request = await AdRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Not found" });

    if (request.status === "approved") {
      return res.status(400).json({ success: false, message: "Request is already approved" });
    }

    // Map placement → displayLocations
    let displayLocations = ["home_banner"];
    if (request.placement === "reels_feed") displayLocations = ["reels_feed"];
    if (request.placement === "both")       displayLocations = ["home_banner", "reels_feed"];

    // Campaign dates
    const startDate = new Date();
    const endDate   = new Date();
    endDate.setDate(endDate.getDate() + request.days);

    // Get next order number
    const maxOrder = await Advertisement.findOne().sort({ order: -1 }).select("order");

    // Auto-create Advertisement from request data
    const ad = await Advertisement.create({
      advertiserName:   request.advertiserName,
      advertiserEmail:  request.advertiserEmail,
      advertiserPhone:  request.advertiserPhone  || "",
      companyName:      request.companyName      || "",
      title:            request.title,
      description:      request.description      || "",
      mediaType:        request.mediaType,
      mediaUrl:         request.mediaUrl,
      ctaText:          request.ctaText          || "Learn More",
      badge:            request.badge            || "SPONSOR",
      websiteUrl:       request.websiteUrl       || "",
      youtubeUrl:       request.youtubeUrl       || "",
      instagramUrl:     request.instagramUrl     || "",
      facebookUrl:      request.facebookUrl      || "",
      otherUrl:         request.otherUrl         || "",
      isActive:         true,
      approvalStatus:   "approved",
      displayLocations,
      startDate,
      endDate,
      priority:         "medium",
      order:            (maxOrder?.order || 0) + 1,
      layoutConfig:     {},
      buttonStyle:      {},
      cropData:         {},
      createdBy:        req.admin._id,
    });

    // Update request status and link to created ad
    await AdRequest.findByIdAndUpdate(req.params.id, {
      status:          "approved",
      reviewedBy:      req.admin._id,
      reviewedAt:      new Date(),
      advertisementId: ad._id,
      adminNotes:      req.body.adminNotes || "",
    });

    // Trigger real-time banner refresh on all frontends
    await publish("admin:events", { type: "ads:updated" });

    // TODO Phase 2: Email advertiser "Your ad is now live!"

    logger.info(`[AD REQUEST] Approved: "${request.title}" → Ad ${ad._id}`);

    res.json({
      success:         true,
      message:         "Request approved and advertisement created successfully",
      advertisementId: ad._id,
      note:            "You can now edit the layout, button style, and crop in Ad Manager",
    });
  })
);

// ── PATCH /api/admin/ad-requests/:id/reject ───────────────────────────────
router.patch(
  "/:id/reject",
  requirePermission("marketing"),
  logActivity("REJECT_AD_REQUEST"),
  asyncHandler(async (req, res) => {
    const { reason, adminNotes } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const request = await AdRequest.findByIdAndUpdate(
      req.params.id,
      {
        status:          "rejected",
        rejectionReason: reason.trim(),
        reviewedBy:      req.admin._id,
        reviewedAt:      new Date(),
        adminNotes:      adminNotes || "",
      },
      { new: true }
    );

    if (!request) return res.status(404).json({ success: false, message: "Not found" });

    // TODO Phase 2: Email advertiser with rejection reason + refund info

    logger.info(`[AD REQUEST] Rejected: "${request.title}" — ${reason}`);
    res.json({ success: true, message: "Request rejected", request });
  })
);

// ── PATCH /api/admin/ad-requests/:id/request-changes ─────────────────────
router.patch(
  "/:id/request-changes",
  requirePermission("marketing"),
  asyncHandler(async (req, res) => {
    const { changes } = req.body;

    if (!changes?.trim()) {
      return res.status(400).json({ success: false, message: "Please specify what changes are needed" });
    }

    const request = await AdRequest.findByIdAndUpdate(
      req.params.id,
      {
        status:           "changes_requested",
        changesRequested: changes.trim(),
        reviewedBy:       req.admin._id,
        reviewedAt:       new Date(),
      },
      { new: true }
    );

    if (!request) return res.status(404).json({ success: false, message: "Not found" });

    // TODO Phase 2: Email advertiser with specific changes needed

    res.json({ success: true, message: "Changes requested successfully", request });
  })
);

export default router;