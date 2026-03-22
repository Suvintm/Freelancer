import mongoose from "mongoose";
import { encrypt, decrypt } from "../utils/encryption.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId; // Password required only if not signed up via Google
      },
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "client", "editor", "pending"],
      default: "editor",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    country: {
      type: String,
      default: "IN",
    },
    currency: {
      type: String,
      default: "INR",
    },
    paymentGateway: {
      type: String,
      default: "razorpay",
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // Status & Moderation
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
    },
    bannedAt: {
      type: Date,
    },

    // Security
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Social & Connections
    savedEditors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followSettings: {
      manualApproval: {
        type: Boolean,
        default: false,
      },
    },

    // Editor-specific Fields
    availability: {
      status: {
        type: String,
        enum: ["available", "busy", "away", "small_only", ""],
        default: "available",
      },
      busyUntil: {
        type: Date,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },

    // Wallet & Earnings
    walletBalance: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    pendingBalance: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    lifetimeEarnings: { 
      type: Number, 
      default: 0 
    },
    totalWithdrawn: { 
      type: Number, 
      default: 0 
    },

    // Push Notifications
    fcmTokens: [
      {
        type: String,
      },
    ],

    // KYC & Banking Details
    kycStatus: {
      type: String,
      enum: ["not_started", "submitted", "pending", "verified", "rejected"],
      default: "not_started",
    },
    kycSubmittedAt: Date,
    kycVerifiedAt: Date,
    kycRejectionReason: String,
    kycDocuments: [
      {
        type: { type: String }, // e.g., 'id_proof', 'bank_proof'
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    bankDetails: {
      accountHolderName: String,
      accountNumber: {
        type: String,
        set: encrypt,
        get: decrypt,
        select: false,
      },
      ifscCode: String,
      bankName: String,
      panNumber: {
        type: String,
        set: encrypt,
        get: decrypt,
      },
      gstin: String,
      address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: { type: String, default: "IN" },
      },
    },
    kycTier: { type: Number, enum: [0, 1, 2, 3], default: 0 },
    verificationMethod: {
      type: String,
      enum: ["not_verified", "manual", "automatic", "semi_automatic"],
      default: "not_verified"
    },
    autoVerificationResult: {
      panCheck: {
        status: String,       // "passed", "failed", "api_error", "skipped"
        confidence: Number,   // 0-100 name match score
        apiRef: String,       // Surepass request ID for audit
        checkedAt: Date,
        nameAtNSDL: String    // NSDL name — shown to admin for comparison
      },
      bankCheck: {
        status: String,
        accountExists: Boolean,
        nameMatch: Number,
        pennyDropRef: String,
        nameAtBank: String,   // Bank's registered name — for admin comparison
        checkedAt: Date
      },
      overallScore: { type: Number, min: 0, max: 100 },
      recommendation: {
        type: String,
        enum: ["auto_approve", "manual_review", "auto_reject", "pending"]
      },
      processedAt: Date
    },
    riskLevel: { type: String, enum: ["low", "medium", "high", "critical"], default: "low" },
    riskFlags: [String],
    consentTimestamp: Date,
    consentText: String,
    consentIpAddress: String,
    dataRetentionExpiry: Date,
    kycProcessingStartedAt: Date,
    kycAutoCheckCompletedAt: Date,

    razorpayContactId: String,
    razorpayFundAccountId: String,

    // Performance & Scoring
    isVerified: {
      type: Boolean,
      default: false,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    profileCompletionPercent: {
      type: Number,
      default: 0,
    },
    suvixScore: {
      total: { type: Number, default: 0 },
      tier: { type: String, default: "newcomer" },
      isEligible: { type: Boolean, default: false },
      completedOrders: { type: Number, default: 0 },
      components: {
        deadline: { type: Number, default: 0 },
        ratings: { type: Number, default: 0 },
        completion: { type: Number, default: 0 },
        response: { type: Number, default: 0 },
        revisions: { type: Number, default: 0 },
        experience: { type: Number, default: 0 },
      },
      lastCalculated: Date,
    },

    // AI Workspace Profiling (For Editors)
    aiProfile: {
      aiKeywords: [String],
      aiDescription: { type: String, default: "" },
      videoStyles: [String], // e.g., ['cinematic', 'minimalist', 'vfx', 'vlog', 'corporate']
      softwareProficiency: {
        type: Map,
        of: Number, // 1-5 scale (e.g., {'Premiere Pro': 5, 'After Effects': 3})
      },
      lastAiUpdate: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Essential indexes (not already covered by unique/sparse constraints)
userSchema.index({ "suvixScore.total": -1 });

export default mongoose.models.User || mongoose.model("User", userSchema);
