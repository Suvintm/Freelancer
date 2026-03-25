// Advertisement.js - Production advertisement model for Suvix platform
import mongoose from "mongoose";

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

// Crop data from react-easy-crop (stored as percentages 0–100)
const cropDataSchema = new mongoose.Schema({
  x:      { type: Number, default: 0 },
  y:      { type: Number, default: 0 },
  width:  { type: Number, default: 100 },
  height: { type: Number, default: 100 },
  zoom:   { type: Number, default: 1 },
}, { _id: false });

// Controls how content (text/buttons) is positioned & styled on the banner
const layoutConfigSchema = new mongoose.Schema({
  textPosition:      { type: String, default: "bl" },
  overlayDirection:  { type: String, default: "to-top" },
  overlayOpacity:    { type: Number, default: 75, min: 0, max: 100 },
  overlayColor:      { type: String, default: "#040408" },
  titleSize:         { type: String, default: "md" },
  titleWeight:       { type: String, default: "black" },
  titleColor:        { type: String, default: "#ffffff" },
  descColor:         { type: String, default: "rgba(212,212,216,0.75)" },
  showBadge:         { type: Boolean, default: true },
  showSponsorTag:    { type: Boolean, default: true },
  showDescription:   { type: Boolean, default: true },
  showProgressBar:   { type: Boolean, default: true },
  showDetailsBtn:    { type: Boolean, default: true },
  showMuteBtn:       { type: Boolean, default: true },
  slideDuration:     { type: Number, default: 5000 },
  badgeText:         { type: String, default: "" },
  badgeColor:        { type: String, default: "rgba(255,255,255,0.12)" },
}, { _id: false });

// Primary CTA button style (for banner)
const buttonStyleSchema = new mongoose.Schema({
  variant:           { type: String, default: "filled" },
  bgColor:           { type: String, default: "#ffffff" },
  textColor:         { type: String, default: "#000000" },
  borderColor:       { type: String, default: "#ffffff" },
  radius:            { type: String, default: "md" },
  icon:              { type: String, default: "chevron" },
  iconPosition:      { type: String, default: "right" },
}, { _id: false });

// ─── NEW: Reel feed specific config ──────────────────────────────────────────
// Controls how the ad looks when rendered as a card inside the Reels feed.
// Completely independent from layoutConfig / buttonStyle (which are banner-only).
const reelConfigSchema = new mongoose.Schema({
  // CTA button text in reel card (can differ from banner CTA)
  ctaText:             { type: String, default: "Learn More", maxlength: 30 },
  // Button style: filled | outline | ghost
  btnVariant:          { type: String, default: "ghost" },
  // Button background color (used for filled and ghost)
  btnBgColor:          { type: String, default: "rgba(255,255,255,0.1)" },
  // Button text color
  btnTextColor:        { type: String, default: "#ffffff" },
  // Button border color (used for outline)
  btnBorderColor:      { type: String, default: "#ffffff" },
  // Border radius key: sm | md | lg | full
  btnRadius:           { type: String, default: "md" },
  // Separate short description for reel card (max 120 chars, ~2 lines)
  // If empty, falls back to ad.description then ad.tagline
  reelDescription:     { type: String, default: "", maxlength: 120 },
  // Show/hide description text in reel card
  showDescription:     { type: Boolean, default: true },
  // Show/hide advertiser name badge in reel card
  showAdvertiserBadge: { type: Boolean, default: true },
  // Bottom overlay gradient opacity (0–100)
  overlayOpacity:      { type: Number, default: 80, min: 0, max: 100 },
  // Bottom overlay gradient base color (hex)
  overlayColor:        { type: String, default: "#000000" },
  // CTA button navigation behaviour (independent from banner button)
  btnLinkType: {
    type: String,
    enum: ["ad_details", "external", "internal", "none"],
    default: "ad_details",
  },
  // URL or route used when btnLinkType is external or internal
  btnLink:             { type: String, trim: true, default: "" },
  // Which template ID was last applied (for UI highlighting only)
  templateId:          { type: String, default: "" },
}, { _id: false });

// ─── Main Schema ──────────────────────────────────────────────────────────────

const advertisementSchema = new mongoose.Schema(
  {
    // ========== ADVERTISER INFO ==========
    advertiserName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    advertiserEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    advertiserPhone: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    // ========== AD CONTENT ==========
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    longDescription: {
      type: String,
      maxlength: 5000,
    },

    // ========== PRIMARY MEDIA ==========
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },

    // ========== CROP & LAYOUT (banner) ==========
    cropData: {
      type: cropDataSchema,
      default: () => ({}),
    },
    layoutConfig: {
      type: layoutConfigSchema,
      default: () => ({}),
    },
    buttonStyle: {
      type: buttonStyleSchema,
      default: () => ({}),
    },

    // ========== REEL FEED CONFIG (new) ==========
    // Only used when displayLocations includes "reels_feed"
    reelConfig: {
      type: reelConfigSchema,
      default: () => ({}),
    },

    // ========== GALLERY ==========
    galleryImages: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Maximum 5 gallery images allowed",
      },
      default: [],
    },

    // ========== NAVIGATION ==========
    buttonLinkType: {
      type: String,
      enum: ["ad_details", "external", "internal", "none"],
      default: "ad_details",
    },
    buttonLink: { type: String, trim: true },
    cardLinkType: {
      type: String,
      enum: ["ad_details", "none", "external", "internal"],
      default: "none",
    },
    cardLink: { type: String, trim: true },

    websiteUrl:   { type: String, trim: true },
    instagramUrl: { type: String, trim: true },
    facebookUrl:  { type: String, trim: true },
    youtubeUrl:   { type: String, trim: true },
    otherUrl:     { type: String, trim: true },
    ctaText: {
      type: String,
      default: "Learn More",
      maxlength: 30,
    },

    // ========== CLASSIFICATION ==========
    adType: {
      type: String,
      enum: ["promotional", "internal"],
      default: "promotional",
    },
    tags: {
      type: [String],
      default: [],
    },

    // ========== DISPLAY SETTINGS ==========
    isActive: {
      type: Boolean,
      default: false,
    },
    displayLocations: {
      type: [String],
      enum: [
        "banners:home_0", "banners:home_1", "banners:home_2",
        "banners:editors", "banners:gigs", "banners:jobs", "banners:explore",
        "reels_feed",
      ],
      default: ["banners:home_0"],
    },
    badge: {
      type: String,
      default: "SPONSOR",
      maxlength: 20,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ========== SCHEDULING ==========
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },

    // ========== PRIORITY & ORDER ==========
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    order: {
      type: Number,
      default: 0,
    },

    // ========== APPROVAL WORKFLOW ==========
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      maxlength: 500,
    },

    // ========== ANALYTICS ==========
    views:           { type: Number, default: 0 },
    clicks:          { type: Number, default: 0 },
    reelViews:       { type: Number, default: 0 },
    exploreViews:    { type: Number, default: 0 },
    homeBannerViews: { type: Number, default: 0 },

    // ========== META ==========
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminMember",
    },
  },
  { timestamps: true }
);

// Indexes
advertisementSchema.index({ isActive: 1, approvalStatus: 1, order: 1 });
advertisementSchema.index({ displayLocations: 1 });
advertisementSchema.index({ startDate: 1, endDate: 1 });

// Virtual: is this ad currently live?
advertisementSchema.virtual("isLive").get(function () {
  const now = new Date();
  const started = !this.startDate || this.startDate <= now;
  const notEnded = !this.endDate || this.endDate >= now;
  return this.isActive && this.approvalStatus === "approved" && started && notEnded;
});

export const Advertisement = mongoose.model("Advertisement", advertisementSchema);