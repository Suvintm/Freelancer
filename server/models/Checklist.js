import mongoose from "mongoose";

const checklistItemSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  completedAt: {
    type: Date,
  },
});

const checklistSchema = new mongoose.Schema(
  {
    // Which order this checklist belongs to
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    // Checklist title
    title: {
      type: String,
      default: "Project Checklist",
      trim: true,
      maxlength: 100,
    },

    // Items in the checklist
    items: [checklistItemSchema],

    // Who created it
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Only one checklist per order
checklistSchema.index({ order: 1 }, { unique: true });

export const Checklist = mongoose.model("Checklist", checklistSchema);
