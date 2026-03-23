import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
    {
        portfolio: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Portfolio",
            required: true,
        },
        editor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500,
        },
        mediaUrl: {
            type: String,
            required: true,
        },
        mediaType: {
            type: String,
            enum: ["video", "image"],
            default: "video",
        },
        // Store user IDs who liked
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        // Cached counts for performance
        likesCount: {
            type: Number,
            default: 0,
        },
        viewsCount: {
            type: Number,
            default: 0,
        },
        commentsCount: {
            type: Number,
            default: 0,
        },
        // Unique viewers (user IDs or session fingerprints)
        uniqueViewers: [{
            type: String, // Can be userId or sessionId for anonymous
        }],
        // Total watch time in seconds for analytics
        watchTimeSeconds: {
            type: Number,
            default: 0,
        },
        // Store file size in bytes for storage calculation
        fileSizeBytes: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        hashtags: [{
            type: String,
            trim: true
        }],
        location: {
            type: String,
            trim: true
        },
        taggedUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        isAIContent: {
            type: Boolean,
            default: false
        },

        // ── Recommendation Engine Signals ────────────────────────────────────
        // Instagram-style: watch completion is the single strongest ranking signal.
        // We track a running Bayesian average of completion rate across all viewers.

        /** Rolling average watch completion (0.0–1.0). Updated via trackWatchTime. */
        avgCompletionRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 1,
        },
        /** How many completion samples have been averaged in (for Bayesian update). */
        completionSampleCount: {
            type: Number,
            default: 0,
        },
        /** Times users skipped this reel very quickly (< 2 seconds). Negative signal. */
        skipCount: {
            type: Number,
            default: 0,
        },
        /** Number of loop-backs / re-watches detected. Strong positive signal. */
        reWatchCount: {
            type: Number,
            default: 0,
        },
        /** Pre-computed composite recommendation score (cached, updated on interaction). */
        recommendationScore: {
            type: Number,
            default: 0,
            index: true,
        },
    },
    { timestamps: true }
);

// Indexes for faster queries
reelSchema.index({ createdAt: -1 });
reelSchema.index({ viewsCount: -1 });
reelSchema.index({ likesCount: -1 });
reelSchema.index({ portfolio: 1, editor: 1 });
reelSchema.index({ recommendationScore: -1, createdAt: -1 }); // Social graph feed
reelSchema.index({ editor: 1, isPublished: 1, createdAt: -1 }); // Per-editor feed

// Virtual for checking if user liked
reelSchema.methods.isLikedBy = function (userId) {
    return this.likes.includes(userId);
};

// Update likes count
reelSchema.methods.updateLikesCount = async function () {
    this.likesCount = this.likes.length;
    await this.save();
};

export const Reel = mongoose.model("Reel", reelSchema);
