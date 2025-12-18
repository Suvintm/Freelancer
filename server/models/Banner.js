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
    order: {
      type: Number,
      default: 0, // Lower = first
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
