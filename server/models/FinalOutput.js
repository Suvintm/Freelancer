import mongoose from "mongoose";

const FinalOutputSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // === File Information ===
    type: {
      type: String,
      enum: ["video", "photo", "audio"],
      required: true,
    },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true }, // bytes

    // === Video/Photo specific ===
    resolution: {
      width: Number,
      height: Number,
    },
    aspectRatio: String, // "16:9", "4:3", "1:1", etc.
    
    // === Video/Audio specific ===
    duration: Number, // seconds
    codec: String,
    bitrate: Number, // kbps
    frameRate: Number, // fps (video only)

    // === Cloudflare R2 Storage ===
    r2Key: { type: String, required: true }, // Original file key
    thumbnailKey: String, // Thumbnail image key (kept after expiry)
    previewKey: String, // Compressed preview key (optional)

    // === Status Workflow ===
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "downloaded", "expired"],
      default: "pending",
    },

    // === Approval ===
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // === Rejection ===
    rejectedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: String,

    // === Download Expiry (24 hours after approval) ===
    expiresAt: Date, // When download link expires
    isExpired: { type: Boolean, default: false },
    originalDeleted: { type: Boolean, default: false }, // True after R2 cleanup

    // === Download Tracking ===
    downloadCount: { type: Number, default: 0 },
    downloads: [
      {
        downloadedAt: { type: Date, default: Date.now },
        downloadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        ip: String,
        userAgent: String,
      },
    ],

    // === Versioning ===
    version: { type: Number, default: 1 },
    previousVersions: [{ type: mongoose.Schema.Types.ObjectId, ref: "FinalOutput" }],
    isLatest: { type: Boolean, default: true },

    // === Notes ===
    editorNotes: String, // Notes from editor about the output
  },
  { timestamps: true }
);

// === Indexes ===
FinalOutputSchema.index({ order: 1, isLatest: 1 });
FinalOutputSchema.index({ status: 1, expiresAt: 1 }); // For cleanup job
FinalOutputSchema.index({ uploadedBy: 1 });

// === Virtual: Time until expiry ===
FinalOutputSchema.virtual("timeUntilExpiry").get(function () {
  if (!this.expiresAt) return null;
  const remaining = new Date(this.expiresAt) - new Date();
  return Math.max(0, remaining);
});

// === Virtual: Hours until expiry ===
FinalOutputSchema.virtual("hoursUntilExpiry").get(function () {
  if (!this.timeUntilExpiry) return null;
  return Math.ceil(this.timeUntilExpiry / (1000 * 60 * 60));
});

// === Virtual: Format file size ===
FinalOutputSchema.virtual("formattedSize").get(function () {
  const bytes = this.fileSize;
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
  return bytes + " bytes";
});

// === Virtual: Format duration ===
FinalOutputSchema.virtual("formattedDuration").get(function () {
  if (!this.duration) return null;
  const mins = Math.floor(this.duration / 60);
  const secs = Math.floor(this.duration % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
});

// === Pre-save: Set expiry when approved ===
FinalOutputSchema.pre("save", function (next) {
  // When status changes to approved, set 24-hour expiry
  if (this.isModified("status") && this.status === "approved" && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  
  // Check if expired
  if (this.expiresAt && new Date() > new Date(this.expiresAt)) {
    this.isExpired = true;
  }
  
  next();
});

// === Ensure virtuals are included in JSON ===
FinalOutputSchema.set("toJSON", { virtuals: true });
FinalOutputSchema.set("toObject", { virtuals: true });

const FinalOutput = mongoose.model("FinalOutput", FinalOutputSchema);

export default FinalOutput;
