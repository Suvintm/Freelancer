import mongoose from "mongoose";

const quickReplySchema = new mongoose.Schema(
  {
    // User who created the template
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Template title (short label)
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    // Template content (full message)
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // Category for organization
    category: {
      type: String,
      enum: ["greeting", "status", "delivery", "payment", "revision", "other"],
      default: "other",
    },

    // Shortcut key (optional, e.g. "/thanks")
    shortcut: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Usage count for sorting by popularity
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for fast user lookup
quickReplySchema.index({ user: 1, usageCount: -1 });

export const QuickReply = mongoose.model("QuickReply", quickReplySchema);
