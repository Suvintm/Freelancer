// Advertisement.js - Commercial advertisement model for Suvix platform
import mongoose from "mongoose";

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
      maxlength: 5000, // For AdDetailsPage rich content
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
      type: String, // Poster frame for videos
    },

    // ========== GALLERY (for AdDetailsPage) ==========
    galleryImages: {
      type: [String], // Max 5 Cloudinary image URLs
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Maximum 5 gallery images allowed",
      },
      default: [],
    },

    // ========== LINKS ==========
    websiteUrl: {
      type: String,
      trim: true,
    },
    instagramUrl: {
      type: String,
      trim: true,
    },
    facebookUrl: {
      type: String,
      trim: true,
    },
    youtubeUrl: {
      type: String,
      trim: true,
    },
    otherUrl: {
      type: String,
      trim: true,
    },
    ctaText: {
      type: String,
      default: "Learn More",
      maxlength: 30,
    },

    // ========== DISPLAY SETTINGS ==========
    isActive: {
      type: Boolean,
      default: false, // Starts as inactive until admin approves
    },
    displayLocations: {
      type: [String],
      enum: ["home_banner", "reels_feed", "explore_page"],
      default: ["home_banner"],
    },
    badge: {
      type: String,
      default: "SPONSOR",
      maxlength: 20,
    },
    // ========== DEFAULT BANNER FLAG ==========
    // When isDefault is true, this banner is shown as a fallback
    // when no live commercial advertisements are active for a location.
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
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    reelViews: { type: Number, default: 0 },
    exploreViews: { type: Number, default: 0 },
    homeBannerViews: { type: Number, default: 0 },

    // ========== META ==========
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminMember",
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
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
