import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // Which order this message belongs to
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    // Who sent the message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Message type
    type: {
      type: String,
      enum: ["text", "file", "video", "audio", "image", "system"],
      default: "text",
    },

    // Text content
    content: {
      type: String,
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },

    // Media attachment
    mediaUrl: {
      type: String,
    },
    mediaName: {
      type: String,
    },
    mediaSize: {
      type: String,
    },
    mediaThumbnail: {
      type: String,
    },

    // ⭐ Download Protection - KEY FEATURE
    allowDownload: {
      type: Boolean,
      default: false,
    },
    downloaded: {
      type: Boolean,
      default: false,
    },
    downloadedAt: {
      type: Date,
    },

    // Message status
    delivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
    },

    // Reactions (for future enhancement)
    reactions: {
      type: Map,
      of: Number,
      default: {},
    },

    // For system messages
    systemAction: {
      type: String,
      enum: [
        "order_created",
        "order_accepted",
        "order_rejected",
        "work_submitted",
        "work_completed",
        "payment_released",
        "dispute_raised",
        "deadline_reminder",
      ],
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
messageSchema.index({ order: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ order: 1, seen: 1 });

export const Message = mongoose.model("Message", messageSchema);
