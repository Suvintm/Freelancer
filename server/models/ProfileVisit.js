/**
 * ProfileVisit Model
 * Tracks who visited each user's profile
 * Uses TTL index for automatic 30-day data cleanup
 */

import mongoose from "mongoose";

const profileVisitSchema = new mongoose.Schema(
  {
    // Whose profile was visited
    profileOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Who visited (null for guests/anonymous)
    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Cached visitor info for quick display (avoids populate)
    visitorName: {
      type: String,
      default: "Anonymous",
    },
    visitorPicture: {
      type: String,
      default: "",
    },
    visitorRole: {
      type: String,
      enum: ["client", "editor", "guest"],
      default: "guest",
    },

    // When the visit occurred
    visitedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // How they found the profile
    source: {
      type: String,
      enum: ["explore", "search", "direct", "gig", "chat", "order", "other"],
      default: "direct",
    },

    // Additional context
    referrerGig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
profileVisitSchema.index({ profileOwner: 1, visitedAt: -1 });
profileVisitSchema.index({ profileOwner: 1, visitor: 1 });

// TTL Index: Auto-delete documents after 30 days
// MongoDB will automatically remove documents where visitedAt is older than 30 days
profileVisitSchema.index(
  { visitedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 } // 30 days in seconds
);

// Static method to record a visit
profileVisitSchema.statics.recordVisit = async function (data) {
  const { profileOwner, visitor, visitorName, visitorPicture, visitorRole, source, referrerGig } = data;

  // Don't record if viewing own profile
  if (visitor && visitor.toString() === profileOwner.toString()) {
    return null;
  }

  // Check for duplicate visit in last 5 minutes (prevent spam)
  const recentVisit = await this.findOne({
    profileOwner,
    visitor,
    visitedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
  });

  if (recentVisit) {
    return recentVisit; // Don't create duplicate
  }

  // Create new visit record
  return this.create({
    profileOwner,
    visitor,
    visitorName: visitorName || "Anonymous",
    visitorPicture: visitorPicture || "",
    visitorRole: visitorRole || "guest",
    source: source || "direct",
    referrerGig,
  });
};

// Static method to get visitor stats
profileVisitSchema.statics.getStats = async function (profileOwnerId) {
  const stats = await this.aggregate([
    { $match: { profileOwner: new mongoose.Types.ObjectId(profileOwnerId) } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: 1 },
        uniqueVisitors: { $addToSet: "$visitor" },
        clientViews: {
          $sum: { $cond: [{ $eq: ["$visitorRole", "client"] }, 1, 0] },
        },
        editorViews: {
          $sum: { $cond: [{ $eq: ["$visitorRole", "editor"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalViews: 1,
        uniqueVisitors: { $size: "$uniqueVisitors" },
        clientViews: 1,
        editorViews: 1,
      },
    },
  ]);

  return stats[0] || { totalViews: 0, uniqueVisitors: 0, clientViews: 0, editorViews: 0 };
};

// Static method to get recent visitors
profileVisitSchema.statics.getRecentVisitors = async function (profileOwnerId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const visitors = await this.find({ profileOwner: profileOwnerId })
    .sort({ visitedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await this.countDocuments({ profileOwner: profileOwnerId });

  return {
    visitors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const ProfileVisit = mongoose.model("ProfileVisit", profileVisitSchema);
