// ClientKYC.js - Client KYC (Know Your Customer) Model
// Stores client's verification details for refund processing

import mongoose from "mongoose";
import { encrypt, decrypt } from "../utils/encryption.js";

// Mask account number for display (show last 4 digits)
const maskAccountNumber = (accountNumber) => {
  if (!accountNumber || accountNumber.length < 4) return '****';
  return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
};

const clientKYCSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // === Personal Information ===
    fullName: {
      type: String,
      required: [true, "Full legal name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please provide a valid 10-digit Indian phone number"],
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // === Address & Tax Information ===
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, default: "IN" }
    },
    
    gstin: {
        type: String,
        trim: true,
        uppercase: true,
    },

    // === Bank Account Details (Encrypted) ===
    bankAccountNumber: {
      type: String,
      set: encrypt,
      get: decrypt,
    },

    bankAccountNumberMasked: {
      type: String, // Stores masked version for display
    },

    ifscCode: {
      type: String,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Please provide a valid IFSC code"],
    },

    bankName: {
      type: String,
      trim: true,
    },

    accountHolderName: {
      type: String,
      trim: true,
      uppercase: true,
    },

    accountType: {
      type: String,
      enum: ["savings", "current"],
      default: "savings",
    },

    // === UPI Details (Alternative) ===
    upiId: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[\w.-]+@[\w]+$/, "Please provide a valid UPI ID (e.g., name@upi)"],
    },

    // === Identity Verification ===
    panNumber: {
      type: String,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Please provide a valid PAN number"],
    },

    panNumberMasked: {
      type: String, // Stores masked version (XXXXX1234X)
    },

    // === Verification Status ===
    // Documents (ID Proof, Bank Statement, etc.)
    documents: [{
      type: { type: String, enum: ["id_proof", "bank_proof", "other"], required: true },
      url: { type: String, required: true },
      verified: { type: Boolean, default: false },
      uploadedAt: { type: Date, default: Date.now }
    }],

    status: {
      type: String,
      enum: ["not_started", "pending", "under_review", "verified", "rejected"],
      default: "not_started",
      index: true,
    },

    verifiedAt: {
      type: Date,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    // === Preferred Refund Method ===
    preferredRefundMethod: {
      type: String,
      enum: ["original_payment", "bank_transfer", "upi"],
      default: "original_payment",
    },

    // === Audit Trail ===
    submittedAt: {
      type: Date,
    },

    lastUpdatedAt: {
      type: Date,
    },

    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    // === Terms Acceptance ===
    termsAccepted: {
      type: Boolean,
      default: false,
    },

    termsAcceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

// Pre-save middleware to create masked versions
clientKYCSchema.pre("save", function (next) {
  if (this.isModified("bankAccountNumber") && this.bankAccountNumber) {
    // Get the original value before encryption
    const original = this.get("bankAccountNumber");
    this.bankAccountNumberMasked = maskAccountNumber(original);
  }

  if (this.isModified("panNumber") && this.panNumber) {
    this.panNumberMasked = this.panNumber.slice(0, 5) + "****" + this.panNumber.slice(-1);
  }

  if (this.isModified("status")) {
    if (this.status === "pending" && !this.submittedAt) {
      this.submittedAt = new Date();
    }
    if (this.status === "verified") {
      this.verifiedAt = new Date();
    }
  }

  this.lastUpdatedAt = new Date();
  next();
});

// Virtual for display-safe account info
clientKYCSchema.virtual("displayAccountInfo").get(function () {
  if (!this.bankAccountNumberMasked && !this.upiId) return null;
  
  return {
    bankAccount: this.bankAccountNumberMasked,
    ifsc: this.ifscCode,
    bankName: this.bankName,
    holderName: this.accountHolderName,
    upi: this.upiId,
  };
});

// Method to check if KYC is complete
clientKYCSchema.methods.isComplete = function () {
  return this.status === "verified";
};

// Method to check if refund can be processed
clientKYCSchema.methods.canProcessRefund = function () {
  if (!this.isComplete()) return { canProcess: false, reason: "KYC not verified" };
  
  if (this.preferredRefundMethod === "bank_transfer") {
    if (!this.bankAccountNumber || !this.ifscCode) {
      return { canProcess: false, reason: "Bank details incomplete" };
    }
  }
  
  if (this.preferredRefundMethod === "upi") {
    if (!this.upiId) {
      return { canProcess: false, reason: "UPI ID not provided" };
    }
  }
  
  return { canProcess: true };
};

// Static method to get KYC by user ID
clientKYCSchema.statics.getByUserId = async function (userId) {
  return this.findOne({ user: userId });
};

// Static method to get pending KYCs for admin
clientKYCSchema.statics.getPendingVerifications = async function (limit = 50) {
  return this.find({ status: { $in: ["pending", "under_review"] } })
    .populate("user", "name email profilePicture")
    .sort({ submittedAt: 1 })
    .limit(limit);
};

// Indexes for efficient queries
clientKYCSchema.index({ status: 1, submittedAt: 1 });
clientKYCSchema.index({ user: 1, status: 1 });

const ClientKYC = mongoose.model("ClientKYC", clientKYCSchema);

export default ClientKYC;
