import mongoose from "mongoose";

// server/models/WalletTransaction.js
// Every single rupee movement tracked here

const walletTransactionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    index: true 
  },
  
  type: {
    type: String,
    enum: [
      "earning",           // Order completed → pending balance
      "clearance",         // 7-day period ended → wallet balance
      "withdrawal",        // Editor withdrew money
      "refund_credit",     // Razorpay refund failed → wallet credit (clients)
      "platform_fee",      // Fee deducted (for audit)
      "bonus",             // Admin-added bonus
      "reversal",          // Chargeback reversal
      "adjustment"         // Admin manual adjustment
    ],
    required: true
  },
  
  amount: { type: Number, required: true },
  
  // For earnings: tracks clearance
  status: {
    type: String,
    enum: [
      "pending_clearance",  // Earned, waiting 7 days
      "cleared",            // Available in wallet
      "withdrawn",          // Paid out
      "reversed",           // Chargeback reversed
      "cancelled"           // Order cancelled before clearance
    ],
    default: "pending_clearance"
  },
  
  clearanceDate: Date,    // When it becomes withdrawable
  clearedAt: Date,        // When it actually cleared
  
  // References
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  withdrawal: { type: mongoose.Schema.Types.ObjectId, ref: "WithdrawalRequest" },
  refund: { type: mongoose.Schema.Types.ObjectId, ref: "Refund" },
  
  // Balance snapshot (for debugging discrepancies)
  balanceBefore: Number,
  balanceAfter: Number,
  
  description: String,    // Human-readable: "Earning for order #ORD-2025-1234"
  
  // Who initiated (system vs admin)
  initiatedBy: { type: String, enum: ["system", "admin", "user"], default: "system" },
  adminNote: String,

  // Chargeback fields (Claude's addition)
  chargebackReversed: { type: Boolean, default: false },
  chargebackReversedAt: Date,
  chargebackReversedBy: String, // "razorpay" or "admin"

}, { timestamps: true });

walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ status: 1, clearanceDate: 1 });
walletTransactionSchema.index({ order: 1 });

const WalletTransaction = mongoose.model("WalletTransaction", walletTransactionSchema);

export default WalletTransaction;
