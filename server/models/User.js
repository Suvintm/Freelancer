import mongoose from "mongoose";
import { encrypt, decrypt } from "../utils/encryption.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: function () {
        // Password not required for OAuth users
        return !this.googleId && !this.facebookId;
      },
      minlength: [8, "Password must be at least 8 characters"],
    },
    role: {
      type: String,
      enum: {
        values: ["editor", "client", "pending"],
        message: "Role must be 'editor', 'client', or 'pending'",
      },
      required: [true, "Role is required"],
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    // Editor verification status (set when KYC is approved)
    isVerified: {
      type: Boolean,
      default: false,
      index: true, // Index for faster explore queries
    },
    profilePicture: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    // OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    // Ban fields (controlled by admin)
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: null,
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // ==================== PAYMENT & LOCATION FIELDS ====================
    
    // Country & Currency
    country: {
      type: String,
      required: true,
      default: "IN",
      uppercase: true,
      minlength: 2,
      maxlength: 2,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    
    // Profile Completion (0-100)
    profileCompletionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    // Payment Gateway Assignment
    paymentGateway: {
      type: String,
      enum: ["razorpay", "stripe", "none"],
      default: "none",
    },
    
    // KYC Status (for editors)
    kycStatus: {
      type: String,
      enum: ["not_started", "pending", "submitted", "verified", "rejected"],
      default: "not_started",
    },
    kycSubmittedAt: {
      type: Date,
      default: null,
    },
    kycVerifiedAt: {
      type: Date,
      default: null,
    },
    kycRejectionReason: {
      type: String,
      default: null,
    },
    kycDocuments: [{
      type: { type: String, enum: ["id_proof", "bank_proof", "other"], required: true },
      url: { type: String, required: true },
      verified: { type: Boolean, default: false },
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    // Razorpay Fields (for India)
    razorpayContactId: {
      type: String,
      default: null,
    },
    razorpayFundAccountId: {
      type: String,
      default: null,
    },
    
    // Stripe Connect Fields (for International - Future)
    stripeAccountId: {
      type: String,
      default: null,
    },
    stripeAccountStatus: {
      type: String,
      enum: ["none", "pending", "onboarding", "active", "restricted"],
      default: "none",
    },

    // ==================== AVAILABILITY STATUS ====================
    availability: {
      status: {
        type: String,
        enum: ["available", "busy", "small_only"],
        default: "available",
      },
      busyUntil: {
        type: Date,
        default: null,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },

    // ==================== LEGAL & COMPLIANCE ====================
    legalAcceptance: {
      contentPolicyAccepted: {
        type: Boolean,
        default: false,
      },
      acceptedAt: {
        type: Date,
      },
      agreementVersion: {
        type: String,
        default: "v1.0",
      },
      ipAddress: {
        type: String,
      },
    },

    // ==================== SAVED ITEMS ====================
    savedEditors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],

    // ==================== CLIENT KYC & WALLET ====================
    
    // Client KYC Status (separate from editor KYC)
    clientKycStatus: {
      type: String,
      enum: ["not_started", "pending", "under_review", "verified", "rejected"],
      default: "not_started",
    },
    clientKycVerifiedAt: {
      type: Date,
      default: null,
    },
    
    // Wallet Balance (for refunds credited to wallet)
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    walletLastUpdated: {
      type: Date,
      default: null,
    },
    
    // Bank Details (for editor payouts)
    bankDetails: {
      accountHolderName: {
        type: String,
        default: null,
      },
      accountNumber: {
        type: String,
        default: null,
        select: false, // Don't include in queries by default
        set: encrypt,
        get: decrypt,
      },
      ifscCode: {
        type: String,
        default: null,
      },
      bankName: {
        type: String,
        default: null,
      },
      panNumber: {
        type: String,
        default: null,
        select: false, // Sensitive - don't include by default
      },
      gstin: {
        type: String,
        default: null,
      },
      address: {
        street: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        postalCode: { type: String, default: null },
        country: { type: String, default: "IN" },
      },
    },
    
    // Payout Settings
    minPayoutAmount: {
      type: Number,
      default: 100, // ₹100 minimum
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    pendingPayout: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    
    // ==================== STORAGE MANAGEMENT ====================
    
    // Total storage limit in bytes (default: 500MB free tier)
    storageLimit: {
      type: Number,
      default: 500 * 1024 * 1024, // 500 MB
    },
    
    // Current storage used in bytes
    storageUsed: {
      type: Number,
      default: 0,
    },
    
    // Current storage plan
    storagePlan: {
      type: String,
      enum: ["free", "starter", "pro", "business", "unlimited"],
      default: "free",
    },
    
    // Last storage calculation timestamp
    storageLastCalculated: {
      type: Date,
      default: null,
    },
    
    // ==================== SUVIX SCORE ====================
    
    // Editor Performance Score (0-100)
    suvixScore: {
      total: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      tier: {
        type: String,
        enum: ["newcomer", "rising", "established", "professional", "expert", "elite"],
        default: "newcomer",
      },
      // Component breakdown (for analytics)
      components: {
        deadline: { type: Number, default: 0 },      // 0-25 points
        ratings: { type: Number, default: 0 },       // 0-25 points
        completion: { type: Number, default: 0 },    // 0-20 points
        response: { type: Number, default: 0 },      // 0-15 points
        revisions: { type: Number, default: 0 },     // 0-10 points
        experience: { type: Number, default: 0 },    // 0-5 points
      },
      // Eligible for display (min 2 orders)
      isEligible: {
        type: Boolean,
        default: false,
      },
      completedOrders: {
        type: Number,
        default: 0,
      },
      lastCalculated: {
        type: Date,
        default: null,
      },
    },

    // ==================== PASSWORD RESET ====================
    passwordResetToken: {
      type: String,
      select: false, // Never include in queries by default
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, profileCompleted: 1 });
userSchema.index({ name: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ country: 1 });
userSchema.index({ kycStatus: 1 });
userSchema.index({ paymentGateway: 1 });
userSchema.index({ "bankDetails.accountNumber": 1 });

export default mongoose.model("User", userSchema);
