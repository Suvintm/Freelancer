// Advertisement.js - Production advertisement model for Suvix platform
import mongoose from "mongoose";

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

// Crop data from react-easy-crop (stored as percentages 0–100)
const cropDataSchema = new mongoose.Schema({
  x:      { type: Number, default: 0 },   // left offset %
  y:      { type: Number, default: 0 },   // top offset %
  width:  { type: Number, default: 100 }, // crop width %
  height: { type: Number, default: 100 }, // crop height %
  zoom:   { type: Number, default: 1 },   // zoom factor
}, { _id: false });

// Controls how content (text/buttons) is positioned & styled on the banner
const layoutConfigSchema = new mongoose.Schema({
  // Text position: 9-point grid  tl | tc | tr | ml | mc | mr | bl | bc | br
  textPosition:      { type: String, default: "bl" },
  // Overlay gradient direction: to-top | to-bottom | to-left | to-right | radial | none
  overlayDirection:  { type: String, default: "to-top" },
  // Overlay opacity: 0–100
  overlayOpacity:    { type: Number, default: 75, min: 0, max: 100 },
  // Overlay color (hex)
  overlayColor:      { type: String, default: "#040408" },
  // Title font size: sm | md | lg | xl
  titleSize:         { type: String, default: "md" },
  // Title font weight: bold | black | extrabold
  titleWeight:       { type: String, default: "black" },
  // Title color
  titleColor:        { type: String, default: "#ffffff" },
  // Description color
  descColor:         { type: String, default: "rgba(212,212,216,0.75)" },
  // Show/hide individual pieces
  showBadge:         { type: Boolean, default: true },
  showSponsorTag:    { type: Boolean, default: true },
  showDescription:   { type: Boolean, default: true },
  showProgressBar:   { type: Boolean, default: true },
  showDetailsBtn:    { type: Boolean, default: true },
  showMuteBtn:       { type: Boolean, default: true },
  // Slide duration in ms (3000–15000)
  slideDuration:     { type: Number, default: 5000 },
  // Badge text override (defaults to ad.badge)
  badgeText:         { type: String, default: "" },
  // Badge background color
  badgeColor:        { type: String, default: "rgba(255,255,255,0.12)" },
}, { _id: false });

// Primary CTA button style
const buttonStyleSchema = new mongoose.Schema({
  // filled | outline | ghost
  variant:           { type: String, default: "filled" },
  // Background color (for filled)
  bgColor:           { type: String, default: "#ffffff" },
  // Text color
  textColor:         { type: String, default: "#000000" },
  // Border color (for outline)
  borderColor:       { type: String, default: "#ffffff" },
  // Border radius size: sm | md | lg | full
  radius:            { type: String, default: "md" },
  // Icon: none | arrow | globe | instagram | chevron
  icon:              { type: String, default: "chevron" },
  // Icon position: left | right
  iconPosition:      { type: String, default: "right" },
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

    // ========== CROP & LAYOUT ==========
    // Stores the admin's crop selection (percentages, not pixels — device-independent)
    cropData: {
      type: cropDataSchema,
      default: () => ({}),
    },
    // Controls appearance of the banner overlay and text
    layoutConfig: {
      type: layoutConfigSchema,
      default: () => ({}),
    },
    // Primary CTA button style
    buttonStyle: {
      type: buttonStyleSchema,
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

    // ========== LINKS ==========
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
      enum: ["banners:home_0", "banners:home_1", "banners:home_2", "banners:editors", "banners:gigs", "banners:jobs", "banners:explore", "reels_feed"],
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