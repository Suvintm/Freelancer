/**
 * InternalBanner Model
 * Controls hero banners for Explore Editors, Gigs, and Jobs pages
 * Separate from sponsor/promo Banner model
 */

import mongoose from "mongoose";

// Slide schema for carousel items
const slideSchema = new mongoose.Schema({
  mediaType: {
    type: String,
    enum: ["image", "video"],
    default: "image",
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: String,
  badge: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  link: String,
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { _id: true });

// Settings schema for banner styling
const settingsSchema = new mongoose.Schema({
  // Carousel settings
  autoAdvanceDelay: {
    type: Number,
    min: 2000,
    max: 15000,
    default: 4000,
  },
  animationType: {
    type: String,
    enum: ["fade", "slide", "zoom"],
    default: "fade",
  },
  showDots: {
    type: Boolean,
    default: true,
  },
  showArrows: {
    type: Boolean,
    default: false,
  },
  
  // Overlay settings
  overlayType: {
    type: String,
    enum: ["gradient", "solid", "none"],
    default: "gradient",
  },
  overlayOpacity: {
    type: Number,
    min: 0,
    max: 100,
    default: 70,
  },
  gradientFrom: {
    type: String,
    default: "#000000",
  },
  gradientTo: {
    type: String,
    default: "#000000",
  },
  gradientDirection: {
    type: String,
    enum: ["to-right", "to-left", "to-bottom", "to-top", "to-br", "to-bl"],
    default: "to-right",
  },
  
  // Typography
  textColor: {
    type: String,
    default: "#ffffff",
  },
  fontFamily: {
    type: String,
    enum: ["Inter", "Poppins", "Roboto", "Manrope", "Plus Jakarta Sans"],
    default: "Plus Jakarta Sans",
  },
  titleSize: {
    type: String,
    enum: ["sm", "md", "lg", "xl", "2xl"],
    default: "xl",
  },
  subtitleSize: {
    type: String,
    enum: ["xs", "sm", "md", "lg"],
    default: "xs",
  },
  textShadow: {
    type: Boolean,
    default: true,
  },
  textPosition: {
    type: String,
    enum: ["left", "center", "right"],
    default: "left",
  },
  
  // Badge styling
  showBadge: {
    type: Boolean,
    default: true,
  },
  badgeBgColor: {
    type: String,
    default: "#8b5cf6", // violet
  },
  badgeTextColor: {
    type: String,
    default: "#ffffff",
  },
  
  // Dimensions
  bannerHeight: {
    type: Number,
    min: 120,
    max: 400,
    default: 180,
  },
  borderRadius: {
    type: String,
    enum: ["none", "sm", "md", "lg", "xl", "2xl"],
    default: "2xl",
  },
}, { _id: false });

// Main InternalBanner schema
const internalBannerSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      enum: ["editors", "gigs", "jobs"],
      required: true,
      unique: true,
    },
    slides: [slideSchema],
    settings: {
      type: settingsSchema,
      default: () => ({}),
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
internalBannerSchema.index({ section: 1, isLive: 1 });

// Virtual to check if scheduled time has passed
internalBannerSchema.virtual("shouldBeLive").get(function() {
  if (this.isLive) return true;
  if (this.scheduledAt && new Date() >= this.scheduledAt) return true;
  return false;
});

// Pre-save to auto-publish scheduled banners
internalBannerSchema.pre("save", function(next) {
  if (this.scheduledAt && new Date() >= this.scheduledAt && !this.isLive) {
    this.isLive = true;
    this.scheduledAt = null;
  }
  next();
});

export const InternalBanner = mongoose.model("InternalBanner", internalBannerSchema);
