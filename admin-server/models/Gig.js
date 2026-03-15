import mongoose from "mongoose";

const gigSchema = new mongoose.Schema(
  {
    // Editor who created this gig
    editor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Basic Info
    title: {
      type: String,
      required: [true, "Gig title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Wedding",
        "Birthday",
        "Corporate",
        "Music Video",
        "Short Film",
        "Social Media",
        "Commercial",
        "Documentary",
        "YouTube",
        "Other",
      ],
    },

    // Pricing & Delivery
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [100, "Minimum price is ₹100"],
    },
    deliveryDays: {
      type: Number,
      required: [true, "Delivery time is required"],
      min: [1, "Minimum delivery is 1 day"],
      max: [90, "Maximum delivery is 90 days"],
    },

    // Media
    thumbnail: {
      type: String,
      default: "",
    },
    samples: [
      {
        type: String,
      },
    ],

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: true, // For admin moderation if needed
    },

    // Stats
    totalOrders: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
gigSchema.index({ category: 1, isActive: 1 });
gigSchema.index({ price: 1 });
gigSchema.index({ createdAt: -1 });
gigSchema.index({ editor: 1, isActive: 1 });

export const Gig = mongoose.model("Gig", gigSchema);
