import mongoose from "mongoose";

// server/models/WithdrawalRequest.js

const withdrawalRequestSchema = new mongoose.Schema({
  editor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    index: true 
  },
  
  amount: { 
    type: Number, 
    required: true, 
    min: 100 
  },
  
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed", "cancelled"],
    default: "pending",
    index: true
  },
  
  // Bank details snapshot at time of withdrawal
  bankSnapshot: {
    accountHolderName: String,
    bankName: String,
    ifscCode: String,
    accountNumberMasked: String,  // Only last 4 digits
  },
  
  // Razorpay Payout
  razorpayPayoutId: String,
  razorpayFundAccountId: String,
  razorpayContactId: String,
  
  // Timing
  requestedAt: { 
    type: Date, 
    default: Date.now 
  },
  processedAt: Date,
  completedAt: Date,
  failedAt: Date,
  
  // Error handling
  failureReason: String,
  retryCount: { 
    type: Number, 
    default: 0 
  },
  
  // KYC reference
  kycVerifiedAt: Date,
  verificationMethod: String,
  
}, { timestamps: true });

withdrawalRequestSchema.index({ editor: 1, status: 1 });
withdrawalRequestSchema.index({ status: 1, requestedAt: -1 });

const WithdrawalRequest = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);

export default WithdrawalRequest;
