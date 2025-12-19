import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    // Order this rating is for
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true, // One rating per order
      index: true,
    },

    // Client who gave the rating
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Editor who received the rating
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Rating Scores (1-5 stars)
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    quality: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    deliverySpeed: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Optional written review
    review: {
      type: String,
      maxlength: [1000, "Review cannot exceed 1000 characters"],
      default: "",
    },

    // Status
    status: {
      type: String,
      enum: ["published", "hidden", "flagged"],
      default: "published",
    },

    // Editor's response to the review
    editorResponse: {
      type: String,
      maxlength: [500, "Response cannot exceed 500 characters"],
      default: "",
    },
    editorRespondedAt: {
      type: Date,
      default: null,
    },

    // For moderation
    reportedAt: {
      type: Date,
      default: null,
    },
    reportReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
ratingSchema.index({ reviewee: 1, createdAt: -1 }); // Get editor's ratings
ratingSchema.index({ reviewer: 1, createdAt: -1 }); // Get client's given ratings
ratingSchema.index({ order: 1 }); // Check if order has rating

// Static method to calculate editor's average ratings
ratingSchema.statics.calculateEditorStats = async function (editorId) {
  const stats = await this.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(editorId), status: "published" } },
    {
      $group: {
        _id: "$reviewee",
        totalReviews: { $sum: 1 },
        avgOverall: { $avg: "$overall" },
        avgQuality: { $avg: "$quality" },
        avgCommunication: { $avg: "$communication" },
        avgSpeed: { $avg: "$deliverySpeed" },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      qualityAvg: 0,
      communicationAvg: 0,
      speedAvg: 0,
    };
  }

  const s = stats[0];
  return {
    totalReviews: s.totalReviews,
    averageRating: Math.round(s.avgOverall * 10) / 10,
    qualityAvg: Math.round(s.avgQuality * 10) / 10,
    communicationAvg: Math.round(s.avgCommunication * 10) / 10,
    speedAvg: Math.round(s.avgSpeed * 10) / 10,
  };
};

export const Rating = mongoose.model("Rating", ratingSchema);
