import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        reel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reel",
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
    },
    { timestamps: true }
);

// Index for fetching comments by reel sorted by time
commentSchema.index({ reel: 1, createdAt: -1 });

export const Comment = mongoose.model("Comment", commentSchema);
