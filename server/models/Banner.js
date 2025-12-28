// Banner.js - Promotional banner/carousel model
import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    // Content
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    
    // Media
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
      type: String, // Poster image for videos
    },
    
    // Link/CTA
    link: {
      type: String, // Optional redirect URL
      trim: true,
    },
    linkText: {
      type: String,
      default: "Learn More",
      maxlength: 30,
    },
    linkTarget: {
      type: String,
      enum: ["_blank", "_self"],
      default: "_blank",
    },
    
    // Display control
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Which page this banner belongs to
    page: {
      type: String,
      enum: ["explore", "gigs", "jobs", "home", "all"],
      default: "all",
    },
    
    order: {
      type: Number,
      default: 0, // Lower = first
    },
    
    // Enhanced features - Badge as custom text
    badge: {
      type: String,
      default: "", // e.g., "🔥 HOT OPPORTUNITIES"
    },
    badgeType: {
      type: String,
      enum: ["none", "new", "hot", "sale", "limited", "featured", "custom"],
      default: "custom",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    gradientFrom: {
      type: String,
      default: "#6366f1", // Indigo
    },
    gradientTo: {
      type: String,
      default: "#8b5cf6", // Purple
    },
    textPosition: {
      type: String,
      enum: ["left", "center", "right"],
      default: "left",
    },
    loopVideo: {
      type: Boolean,
      default: true, // Videos loop by default
    },

    // Advanced styling options
    animationType: {
      type: String,
      enum: ["fade", "slide", "zoom", "flip"],
      default: "fade",
    },
    overlayOpacity: {
      type: Number,
      min: 0,
      max: 100,
      default: 60, // 60% opacity
    },
    buttonStyle: {
      type: String,
      enum: ["solid", "outline", "gradient", "glass"],
      default: "solid",
    },
    titleSize: {
      type: String,
      enum: ["small", "medium", "large", "xlarge"],
      default: "large",
    },
    autoAdvanceDelay: {
      type: Number,
      min: 2000,
      max: 15000,
      default: 6000, // 6 seconds
    },
    showArrows: {
      type: Boolean,
      default: true,
    },
    showDots: {
      type: Boolean,
      default: true,
    },
    showProgressBar: {
      type: Boolean,
      default: true,
    },

    // Advanced Typography
    textColor: {
      type: String,
      default: "#ffffff",
    },
    fontFamily: {
      type: String,
      enum: ["default", "inter", "poppins", "roboto", "montserrat", "playfair"],
      default: "default",
    },
    textShadow: {
      type: String,
      enum: ["none", "light", "medium", "strong"],
      default: "medium",
    },

    // Advanced Visual Effects
    borderRadius: {
      type: String,
      enum: ["none", "small", "medium", "large", "full"],
      default: "large",
    },
    bgBlur: {
      type: Number,
      min: 0,
      max: 20,
      default: 0,
    },
    overlayType: {
      type: String,
      enum: ["gradient", "solid", "none"],
      default: "gradient",
    },
    overlayColor: {
      type: String,
      default: "#000000",
    },

    // CTA Button Advanced
    ctaColor: {
      type: String,
      default: "#ffffff",
    },
    ctaTextColor: {
      type: String,
      default: "#000000",
    },
    ctaSize: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
    ctaRounded: {
      type: String,
      enum: ["none", "small", "medium", "large", "full"],
      default: "medium",
    },

    // Badge & Animation
    showBadgeAnimation: {
      type: Boolean,
      default: true,
    },
    contentAnimation: {
      type: String,
      enum: ["fade", "slide-up", "slide-left", "zoom", "none"],
      default: "slide-up",
    },

    // Layout
    contentPadding: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
    contentWidth: {
      type: String,
      enum: ["narrow", "medium", "wide", "full"],
      default: "medium",
    },
    
    // Scheduling
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    
    // Analytics
    views: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    
    // Meta
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

// Index for efficient querying
bannerSchema.index({ isActive: 1, order: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

// Virtual to check if banner is currently scheduled
bannerSchema.virtual("isScheduled").get(function() {
  const now = new Date();
  const started = !this.startDate || this.startDate <= now;
  const notEnded = !this.endDate || this.endDate >= now;
  return this.isActive && started && notEnded;
});

export const Banner = mongoose.model("Banner", bannerSchema);
