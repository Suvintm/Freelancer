import mongoose from "mongoose";

const kycLogSchema = new mongoose.Schema({
  // The user (Client or Editor) undergoing KYC
  user: {
    type: String,
    required: true,
    index: true
  },
  
  // Role of the user at the time (to separate Client vs Editor flows)
  userRole: {
    type: String,
    enum: ["client", "editor"],
    required: true
  },

  // Who performed the action?
  performedBy: {
    userId: { type: String }, // If user submitted/edited
    adminId: { type: String }, // If admin verified/rejected
    role: { type: String, enum: ["user", "admin", "system"], default: "user" }
  },

  action: {
    type: String,
    enum: ["submitted", "verified", "rejected", "re_submitted", "auto_verified", "details_updated"],
    required: true
  },

  // Description or Reason (e.g., "Bank details mismatch")
  reason: {
    type: String,
    trim: true
  },
  
  // Snapshot or Metadata
  metadata: {
    ip: String,
    userAgent: String,
    previousStatus: String,
    newStatus: String,
    changes: mongoose.Schema.Types.Mixed // Optional: Store changed fields
  }
}, { 
  timestamps: true 
});

// Index for getting timeline
kycLogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("KYCLog", kycLogSchema);
