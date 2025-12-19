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
      enum: ["text", "file", "video", "audio", "image", "system", "drive_link", "final_delivery", "payment_request"],
      default: "text",
    },

    // Text content
    content: {
      type: String,
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },

    // Reply to another message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    replyPreview: {
      messageId: String,
      senderName: String,
      content: String,
      type: { type: String, enum: ["text", "file", "image", "video", "audio", "drive_link", "final_delivery"] },
      mediaUrl: String,
      mediaThumbnail: String,
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

    // External link (Google Drive, Dropbox, etc.)
    externalLink: {
      provider: {
        type: String,
        enum: ["google_drive", "dropbox", "onedrive", "wetransfer", "mega", "other"],
      },
      url: String,
      title: String,
      description: String,
      fileCount: Number,
      totalSize: String,
    },

    // 🎬 Final Delivery (Editor's completed work)
    finalDelivery: {
      // File URLs
      originalUrl: String,        // Clean file without watermark (for download after acceptance)
      watermarkedUrl: String,     // Watermarked preview version
      thumbnailUrl: String,       // Preview thumbnail
      
      // File info
      fileName: String,
      fileSize: Number,           // In bytes
      mimeType: String,
      duration: Number,           // Video duration in seconds
      
      // Security
      downloadToken: String,      // One-time download token
      tokenExpiry: Date,
      
      // Preview tracking
      previewCount: { type: Number, default: 0 },
      maxPreviews: { type: Number, default: 20 },
      
      // Status
      status: {
        type: String,
        enum: ["pending", "previewed", "accepted", "changes_requested", "downloaded"],
        default: "pending",
      },
      
      // Activity log
      previewHistory: [{
        viewedAt: Date,
        ipAddress: String,
      }],
      changesRequestedAt: Date,
      changesMessage: String,
      acceptedAt: Date,
      downloadedAt: Date,
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
        "payment_confirmed",  // New: when payment is verified
        "payment_required",   // When editor accepts request, client needs to pay
        "dispute_raised",
        "deadline_reminder",
      ],
    },

    // Soft delete fields
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ✏️ Edit message fields
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    originalContent: {
      type: String,
    },

    // ⭐ Star message fields
    isStarred: {
      type: Boolean,
      default: false,
    },
    starredBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],

    // 🎙️ Voice message fields
    audioDuration: {
      type: Number, // in seconds
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
messageSchema.index({ order: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ order: 1, seen: 1 });
messageSchema.index({ content: "text" }); // Text search index

export const Message = mongoose.model("Message", messageSchema);
