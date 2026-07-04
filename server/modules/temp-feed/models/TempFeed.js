import mongoose from "mongoose";

const tempFeedSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["reel", "post", "yt_video", "thumbnail_vote"],
      required: true,
    },
    user: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: "",
    },
    comment: {
      type: String,
      default: "",
    },
    likes: {
      type: Number,
      default: () => Math.floor(Math.random() * 500) + 50,
    },
    commentsCount: {
      type: Number,
      default: () => Math.floor(Math.random() * 50) + 5,
    },
    // Reels & YT Video fields (Uploaded manually as video files)
    videoUrl: {
      type: String,
      default: "",
    },
    videoPublicId: {
      type: String,
      default: "",
    },
    // Post fields (Supports multiple images for swipe)
    images: {
      type: [String],
      default: [],
    },
    imagesPublicIds: {
      type: [String],
      default: [],
    },
    // Dimensions
    mediaWidth: {
      type: Number,
    },
    mediaHeight: {
      type: Number,
    },
    // Vote counts for each thumbnail option (index-aligned with images)
    votes: {
      type: [Number],
      default: [],
    },
    // New metadata fields for production-level UI
    tags: {
      type: [String],
      default: [],
    },
    likedByAvatars: {
      type: [String],
      default: [],
    },
    ytChannelName: {
      type: String,
      default: "",
    },
    ytSubscribeLink: {
      type: String,
      default: "",
    },
    watchOnYtLink: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes
tempFeedSchema.index({ createdAt: -1 });

export const TempFeed = mongoose.model("TempFeed", tempFeedSchema);
