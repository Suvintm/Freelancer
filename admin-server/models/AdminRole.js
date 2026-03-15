import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
    },
    value: {
      type: String,
      required: [true, "Role value is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#1d4ed8",
    },
    permissions: {
      dashboard: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      payments: { type: Boolean, default: false },
      conversations: { type: Boolean, default: false },
      users: { type: Boolean, default: false },
      kyc: { type: Boolean, default: false },
      client_kyc: { type: Boolean, default: false },
      orders: { type: Boolean, default: false },
      gigs: { type: Boolean, default: false },
      advertisements: { type: Boolean, default: false },
      subscriptions: { type: Boolean, default: false },
      activity: { type: Boolean, default: false },
      storage: { type: Boolean, default: false },
      service_analytics: { type: Boolean, default: false },
      settings: { type: Boolean, default: false },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false, // For roles like superadmin that shouldn't be deleted
    },
    memberCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

// Indexes
roleSchema.index({ value: 1 });
roleSchema.index({ isActive: 1 });

export default mongoose.model("AdminRole", roleSchema);
