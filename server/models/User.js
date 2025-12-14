import mongoose from "mongoose";

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
  },
  {
    timestamps: true,
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
