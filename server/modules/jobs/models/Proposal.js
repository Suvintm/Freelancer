/**
 * Proposal Model - For Open Briefs feature
 * Editors submit proposals to client briefs
 */
import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema(
  {
    // Reference to brief
    brief: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brief",
      required: true,
      index: true,
    },

    // Editor who submitted
    editor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ============ PROPOSAL CONTENT ============
    proposedPrice: {
      type: Number,
      required: [true, "Proposed price is required"],
      min: [500, "Minimum price is ₹500"],
    },
    proposedDeliveryDays: {
      type: Number,
      required: [true, "Proposed delivery days is required"],
      min: [1, "Minimum delivery is 1 day"],
      max: [90, "Maximum delivery is 90 days"],
    },
    pitch: {
      type: String,
      required: [true, "Pitch is required"],
      minlength: [100, "Pitch must be at least 100 characters"],
      maxlength: [2000, "Pitch cannot exceed 2000 characters"],
    },

    // Relevant portfolio/work samples
    relevantPortfolio: [{
      type: {
        type: String,
        enum: ["portfolio", "external"],
        default: "portfolio",
      },
      url: String,
      title: String,
      thumbnailUrl: String,
    }],

    // ============ STATUS ============
    status: {
      type: String,
      enum: ["pending", "shortlisted", "accepted", "rejected", "withdrawn"],
      default: "pending",
      index: true,
    },

    // ============ SHORTLIST ============
    isShortlisted: {
      type: Boolean,
      default: false,
    },
    shortlistedAt: Date,

    // ============ CLIENT INTERACTION ============
    viewedByClient: {
      type: Boolean,
      default: false,
    },
    viewedAt: Date,

    // ============ REJECTION INFO ============
    rejectedAt: Date,
    rejectionReason: {
      type: String,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },
    autoRejected: {
      type: Boolean,
      default: false,
    },

    // ============ ACCEPTANCE INFO ============
    acceptedAt: Date,
    
    // Final agreed terms (set by client on acceptance)
    agreedPrice: Number,
    agreedDeliveryDays: Number,
    agreedDeadline: Date,
    
    // Linked order created from this proposal
    linkedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    // ============ WITHDRAWAL ============
    withdrawnAt: Date,
    withdrawalReason: String,
  },
  { timestamps: true }
);

// Prevent duplicate proposals from same editor to same brief
proposalSchema.index({ brief: 1, editor: 1 }, { unique: true });

// Indexes for efficient queries
proposalSchema.index({ status: 1, createdAt: -1 });
proposalSchema.index({ isShortlisted: 1, createdAt: -1 });
proposalSchema.index({ brief: 1, status: 1 });

// Update brief's proposal count on save
proposalSchema.post("save", async function (doc) {
  try {
    const Brief = mongoose.model("Brief");
    const count = await mongoose.model("Proposal").countDocuments({
      brief: doc.brief,
      status: { $nin: ["withdrawn"] },
    });
    await Brief.findByIdAndUpdate(doc.brief, { proposalCount: count });
  } catch (error) {
    console.error("Error updating proposal count:", error);
  }
});

// Also update on remove
proposalSchema.post("deleteOne", { document: true, query: false }, async function (doc) {
  try {
    const Brief = mongoose.model("Brief");
    const count = await mongoose.model("Proposal").countDocuments({
      brief: doc.brief,
      status: { $nin: ["withdrawn"] },
    });
    await Brief.findByIdAndUpdate(doc.brief, { proposalCount: count });
  } catch (error) {
    console.error("Error updating proposal count:", error);
  }
});

export const Proposal = mongoose.model("Proposal", proposalSchema);
