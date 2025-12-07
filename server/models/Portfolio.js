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
    // Support both single originalClip (legacy) and multiple originalClips
    originalClip: {
      type: String,
      default: "",
    },
    // Array of original clips for multiple uploads
    originalClips: [{
      type: String,
    }],
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

// Virtual to get all original clips (combines legacy single and new array)
portfolioSchema.virtual("allOriginalClips").get(function () {
  const clips = [];
  if (this.originalClip) clips.push(this.originalClip);
  if (this.originalClips && this.originalClips.length > 0) {
    clips.push(...this.originalClips);
  }
  return clips;
});

// Ensure virtuals are included in JSON
portfolioSchema.set("toJSON", { virtuals: true });
portfolioSchema.set("toObject", { virtuals: true });

export const Portfolio = mongoose.model("Portfolio", portfolioSchema);
