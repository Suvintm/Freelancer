/**
 * Brief Model - For Open Briefs feature
 * Clients post editing projects, editors submit proposals
 */
import mongoose from "mongoose";

// Generate unique brief number
const generateBriefNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BRF-${year}-${random}`;
};

const briefSchema = new mongoose.Schema(
  {
    // Unique identifier
    briefNumber: {
      type: String,
      unique: true,
      default: generateBriefNumber,
    },

    // Client who posted
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ============ BASIC INFO ============
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["video", "image", "thumbnail", "motion-graphics", "reel", "short", "other"],
    },

    // ============ ATTACHMENTS ============
    attachments: [{
      url: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["raw", "reference", "style-guide", "document"],
        default: "raw",
      },
      name: String,
      size: Number,
      publicId: String, // Cloudinary public ID
    }],

    // ============ BUDGET ============
    budget: {
      min: {
        type: Number,
        required: [true, "Minimum budget is required"],
        min: [500, "Minimum budget must be at least ₹500"],
      },
      max: {
        type: Number,
        required: [true, "Maximum budget is required"],
      },
      currency: {
        type: String,
        default: "INR",
      },
      isNegotiable: {
        type: Boolean,
        default: true,
      },
    },

    // ============ REQUIREMENTS ============
    requirements: {
      outputFormat: {
        type: String,
        default: "MP4 1080p",
      },
      aspectRatio: {
        type: String,
        default: "16:9",
      },
      revisionsIncluded: {
        type: Number,
        default: 2,
        min: 0,
        max: 10,
      },
      softwareNeeded: [{
        type: String,
      }],
      skillLevel: {
        type: String,
        enum: ["beginner", "intermediate", "expert", "any"],
        default: "any",
      },
      references: [{
        type: String, // URLs
      }],
    },

    // ============ TIMELINE ============
    applicationDeadline: {
      type: Date,
      required: [true, "Application deadline is required"],
    },
    expectedDeliveryDays: {
      type: Number,
      required: [true, "Expected delivery days is required"],
      min: [1, "Delivery must be at least 1 day"],
      max: [90, "Delivery cannot exceed 90 days"],
    },

    // ============ STATUS ============
    status: {
      type: String,
      enum: ["open", "in_review", "accepted", "completed", "expired", "cancelled"],
      default: "open",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "invite_only"],
      default: "public",
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    isBoosted: {
      type: Boolean,
      default: false,
    },

    // ============ STATS ============
    views: {
      type: Number,
      default: 0,
    },
    proposalCount: {
      type: Number,
      default: 0,
    },

    // ============ ACCEPTANCE INFO ============
    acceptedProposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
    },
    acceptedEditor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acceptedAt: Date,
    
    // Final agreed terms (locked after acceptance)
    finalPrice: {
      type: Number,
    },
    finalDeadline: {
      type: Date,
    },
    
    // Linked order created from this brief
    linkedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    // ============ EDIT HISTORY (Audit Trail) ============
    editHistory: [{
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      editedAt: {
        type: Date,
        default: Date.now,
      },
      editedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
    }],

    // ============ CANCELLATION ============
    cancelledAt: Date,
    cancellationReason: String,
    
    // ============ EXPIRY ============
    expiredAt: Date,
  },
  { timestamps: true }
);

// Validate max >= min for budget
briefSchema.pre("save", function (next) {
  if (this.budget.max < this.budget.min) {
    next(new Error("Maximum budget must be greater than or equal to minimum budget"));
  }
  next();
});

// Auto-expire briefs past deadline
briefSchema.pre("save", function (next) {
  if (this.status === "open" && this.applicationDeadline < new Date()) {
    this.status = "expired";
    this.expiredAt = new Date();
  }
  next();
});

// Indexes for efficient queries
briefSchema.index({ status: 1, applicationDeadline: -1 });
briefSchema.index({ category: 1, status: 1 });
briefSchema.index({ "budget.min": 1, "budget.max": 1 });
briefSchema.index({ createdAt: -1 });
briefSchema.index({ isUrgent: -1, isBoosted: -1, createdAt: -1 });

export const Brief = mongoose.model("Brief", briefSchema);
