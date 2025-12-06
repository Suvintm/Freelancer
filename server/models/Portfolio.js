import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    originalClip: {
      type: String,
      default: "",
    },
    editedClip: {
      type: String,
      default: "",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
portfolioSchema.index({ user: 1, uploadedAt: -1 });

export const Portfolio = mongoose.model("Portfolio", portfolioSchema);
