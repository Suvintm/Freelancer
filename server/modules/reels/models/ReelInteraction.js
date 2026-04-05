import mongoose from "mongoose";

const reelInteractionSchema = new mongoose.Schema({
    user: { 
      type: String, // References PostgreSQL User (UUID)
      required: true, 
      index: true 
    },
    reel: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Reel", 
      required: true,
      index: true
    },
  
  // Engagement Signals (Phase 30A Polished)
  watched: { type: Boolean, default: false },
  watchPercent: { type: Number, default: 0 },         // 0–100% of video watched
  liked: { type: Boolean, default: false },
  commented: { type: Boolean, default: false },
  shared: { type: Boolean, default: false },
  skipped: { type: Boolean, default: false },         // Scrolled past quickly
  skipTime: { type: Number, default: 0 },             // Second at which they skipped
  
  // High-Fidelity Signal
  interactionDepth: { 
    type: String, 
    enum: ['impression', 'soft', 'full', 'completed'],
    default: 'impression'
  },
  
  // Actual watch time in seconds
  watchTimeSeconds: { type: Number, default: 0 },
  
  // Last updated timestamp
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: false });

// Compound index for fast lookup of a specific user-reel interaction
reelInteractionSchema.index({ user: 1, reel: 1 }, { unique: true });

export const ReelInteraction = mongoose.model("ReelInteraction", reelInteractionSchema);
