import mongoose from "mongoose";

const ReelSaveSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can only save a reel once
ReelSaveSchema.index({ user: 1, reel: 1 }, { unique: true });

export const ReelSave = mongoose.model('ReelSave', ReelSaveSchema);
