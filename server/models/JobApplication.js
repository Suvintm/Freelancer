/**
 * JobApplication Model - For tracking editor applications to jobs
 */

import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
  {
    // References
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Application Content
    coverMessage: {
      type: String,
      maxLength: 1000,
    },
    portfolioUrl: {
      type: String,
      required: true,
    },
    suvixProfileUrl: {
      type: String,
      required: true,
    },
    expectedRate: {
      type: Number,
      required: true,
    },

    // Status Tracking
    status: {
      type: String,
      enum: [
        "applied",
        "shortlisted",
        "round1",
        "round2",
        "round3",
        "hired",
        "rejected",
        "withdrawn",
      ],
      default: "applied",
    },

    // Timeline
    statusHistory: [{
      status: String,
      changedAt: { type: Date, default: Date.now },
      note: String,
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }],

    // Hire Details
    hiredAt: Date,
    rejectedAt: Date,
    rejectionReason: String,

    // Client Notes
    clientNotes: {
      type: String,
      maxLength: 500,
    },

    // Flags
    isViewed: {
      type: Boolean,
      default: false,
    },
    viewedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
jobApplicationSchema.index({ job: 1, status: 1 });
jobApplicationSchema.index({ applicant: 1, createdAt: -1 });
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true }); // One application per job per user

// Pre-save: Add to status history
jobApplicationSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });
  }
  next();
});

export const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);
