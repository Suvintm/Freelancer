// AdRequest.js - User-submitted ad requests from /advertise/new
import mongoose from "mongoose";

const adRequestSchema = new mongoose.Schema(
  {
    // ── Who submitted ──────────────────────────────────────────────
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null if not logged in
    advertiserName:  { type: String, required: true, trim: true, maxlength: 100 },
    advertiserEmail: { type: String, required: true, trim: true, lowercase: true },
    advertiserPhone: { type: String, trim: true },
    companyName:     { type: String, trim: true, maxlength: 100 },
    suvixUserId:     { type: String, trim: true }, // SuviX platform user ID string

    // ── What they want to promote ──────────────────────────────────
    adType: {
      type: String,
      enum: ["youtube", "instagram", "website", "app", "course", "event", "freelancer", "ecommerce"],
      required: true,
    },

    // ── Campaign settings ──────────────────────────────────────────
    placement: {
      type: String,
      enum: ["home_banner", "reels_feed", "both"],
      required: true,
    },
    days:           { type: Number, required: true, min: 1, max: 365 },
    requestedPrice: { type: Number }, // Price shown to user at time of submission

    // ── Creative ───────────────────────────────────────────────────
    title:       { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 300 },
    ctaText:     { type: String, trim: true, maxlength: 30 },
    badge:       { type: String, trim: true, maxlength: 20, default: "SPONSOR" },
    mediaType:   { type: String, enum: ["image", "video"], default: "image" },
    mediaUrl:    { type: String, trim: true },      // Cloudinary URL after upload
    cloudinaryId: { type: String, trim: true },     // For future deletion

    // ── Links ──────────────────────────────────────────────────────
    websiteUrl:   { type: String, trim: true },
    youtubeUrl:   { type: String, trim: true },
    instagramUrl: { type: String, trim: true },
    facebookUrl:  { type: String, trim: true },
    otherUrl:     { type: String, trim: true },

    // ── Notes ─────────────────────────────────────────────────────
    additionalNotes: { type: String, maxlength: 1000 },

    // ── Status lifecycle ───────────────────────────────────────────
    // pending → under_review → approved | rejected | changes_requested
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "changes_requested"],
      default: "pending",
      index: true,
    },
    rejectionReason:     { type: String, maxlength: 500 },
    changesRequested:    { type: String, maxlength: 1000 },
    adminNotes:          { type: String, maxlength: 1000 },
    reviewedBy:          { type: mongoose.Schema.Types.ObjectId, ref: "AdminMember" },
    reviewedAt:          { type: Date },

    // ── After approval — link to the Advertisement created ─────────
    advertisementId: { type: mongoose.Schema.Types.ObjectId, ref: "Advertisement" },

    // ── Payment (Phase 2 — null until Razorpay integrated) ─────────
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "waived"],
      default: "unpaid",
    },
    paymentAmount:    { type: Number },
    paymentMethod:    { type: String },
    paymentReference: { type: String },
    paidAt:           { type: Date },
  },
  { timestamps: true }
);

// Indexes for admin queries
adRequestSchema.index({ status: 1, createdAt: -1 });
adRequestSchema.index({ advertiserEmail: 1 });
adRequestSchema.index({ adType: 1 });

export const AdRequest = mongoose.model("AdRequest", adRequestSchema);