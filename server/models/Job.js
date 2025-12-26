/**
 * Job Model - For job postings in the hiring portal
 */

import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    // Job poster (client/brand)
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Basic Info
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    description: {
      type: String,
      required: true,
      maxLength: 5000,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "youtube",
        "instagram-reels",
        "shorts",
        "wedding",
        "corporate",
        "music-video",
        "podcast",
        "documentary",
        "ads",
        "social-media",
        "other",
      ],
    },

    // Requirements
    skillsRequired: [{
      type: String,
      enum: [
        "premiere-pro",
        "after-effects",
        "davinci-resolve",
        "final-cut",
        "capcut",
        "motion-graphics",
        "color-grading",
        "sound-design",
        "vfx",
        "3d-animation",
        "thumbnail-design",
      ],
    }],
    experienceLevel: {
      type: String,
      enum: ["fresher", "1-3-years", "3-5-years", "5-plus-years"],
      default: "fresher",
    },

    // Work Details
    workType: {
      type: String,
      enum: ["remote", "onsite", "hybrid"],
      default: "remote",
    },
    location: {
      city: String,
      state: String,
      country: { type: String, default: "India" },
    },

    // Budget
    budget: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      currency: { type: String, default: "INR" },
      type: { type: String, enum: ["fixed", "monthly", "per-video"], default: "fixed" },
    },

    // Hiring Process
    hiringRounds: {
      type: Number,
      min: 1,
      max: 3,
      default: 1,
    },
    roundNames: {
      type: [String],
      default: ["Direct Hire"],
    },

    // Deadlines
    applicationDeadline: {
      type: Date,
      required: true,
    },
    expectedStartDate: Date,

    // Status & Stats
    status: {
      type: String,
      enum: ["draft", "active", "paused", "closed", "filled"],
      default: "draft",
    },
    applicantCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    maxApplicants: {
      type: Number,
      default: 100,
    },

    // Flags
    isUrgent: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ postedBy: 1, status: 1 });
jobSchema.index({ "location.city": 1, status: 1 });
jobSchema.index({ skillsRequired: 1 });

// Virtual for checking if deadline passed
jobSchema.virtual("isExpired").get(function () {
  return new Date() > this.applicationDeadline;
});

// Pre-save: Auto-close if deadline passed
jobSchema.pre("save", function (next) {
  if (this.status === "active" && new Date() > this.applicationDeadline) {
    this.status = "closed";
  }
  next();
});

export const Job = mongoose.model("Job", jobSchema);
