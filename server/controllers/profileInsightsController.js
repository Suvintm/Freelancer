/**
 * Profile Insights Controller
 * Provides visitor analytics for subscribed users
 */

import { ProfileVisit } from "../models/ProfileVisit.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import mongoose from "mongoose";

// ============ GET BASIC STATS (Free) ============
export const getBasicStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get basic count only (no visitor details)
  const totalViews = await ProfileVisit.countDocuments({ profileOwner: userId });
  const uniqueVisitors = await ProfileVisit.distinct("visitor", {
    profileOwner: userId,
    visitor: { $ne: null },
  });

  res.status(200).json({
    success: true,
    stats: {
      totalViews,
      uniqueVisitors: uniqueVisitors.length,
    },
    // Indicate this is limited data
    isLimited: true,
    message: "Upgrade to see who viewed your profile",
  });
});

// ============ GET DETAILED VISITOR STATS (Pro) ============
export const getVisitorStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await ProfileVisit.getStats(userId);

  // Get views by day for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyViews = await ProfileVisit.aggregate([
    {
      $match: {
        profileOwner: new mongoose.Types.ObjectId(userId),
        visitedAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$visitedAt" } },
        views: { $sum: 1 },
        uniqueVisitors: { $addToSet: "$visitor" },
      },
    },
    {
      $project: {
        date: "$_id",
        views: 1,
        uniqueVisitors: { $size: "$uniqueVisitors" },
      },
    },
    { $sort: { date: 1 } },
  ]);

  // Get views by source
  const viewsBySource = await ProfileVisit.aggregate([
    {
      $match: { profileOwner: new mongoose.Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: "$source",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Get top visitors (repeat visitors)
  const topVisitors = await ProfileVisit.aggregate([
    {
      $match: {
        profileOwner: new mongoose.Types.ObjectId(userId),
        visitor: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$visitor",
        visitCount: { $sum: 1 },
        lastVisit: { $max: "$visitedAt" },
        visitorName: { $first: "$visitorName" },
        visitorPicture: { $first: "$visitorPicture" },
        visitorRole: { $first: "$visitorRole" },
      },
    },
    { $match: { visitCount: { $gte: 2 } } },
    { $sort: { visitCount: -1 } },
    { $limit: 10 },
  ]);

  res.status(200).json({
    success: true,
    stats: {
      ...stats,
      dailyViews,
      viewsBySource,
      topVisitors,
    },
    isLimited: false,
  });
});

// ============ GET VISITORS LIST (Pro) ============
export const getVisitors = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, role, startDate, endDate } = req.query;

  // Build query
  const query = { profileOwner: userId };

  if (role && role !== "all") {
    query.visitorRole = role;
  }

  if (startDate || endDate) {
    query.visitedAt = {};
    if (startDate) query.visitedAt.$gte = new Date(startDate);
    if (endDate) query.visitedAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const visitors = await ProfileVisit.find(query)
    .sort({ visitedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate("visitor", "name email profilePicture role")
    .lean();

  const total = await ProfileVisit.countDocuments(query);

  res.status(200).json({
    success: true,
    visitors,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ============ EXPORT VISITORS CSV (Pro) ============
export const exportVisitors = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const visitors = await ProfileVisit.find({ profileOwner: userId })
    .sort({ visitedAt: -1 })
    .lean();

  // Generate CSV
  const header = "Name,Role,Visit Date,Source\n";
  const rows = visitors
    .map((v) => {
      const date = new Date(v.visitedAt).toISOString().split("T")[0];
      return `"${v.visitorName}","${v.visitorRole}","${date}","${v.source}"`;
    })
    .join("\n");

  const csv = header + rows;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=profile-visitors-${Date.now()}.csv`
  );
  res.status(200).send(csv);
});

// ============ GET SINGLE VISITOR DETAILS (Pro) ============
export const getVisitorDetails = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { visitorId } = req.params;

  // Get all visits from this visitor
  const visits = await ProfileVisit.find({
    profileOwner: userId,
    visitor: visitorId,
  })
    .sort({ visitedAt: -1 })
    .lean();

  if (visits.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Visitor not found",
    });
  }

  // Get visitor info from most recent visit
  const latestVisit = visits[0];

  res.status(200).json({
    success: true,
    visitor: {
      id: visitorId,
      name: latestVisit.visitorName,
      picture: latestVisit.visitorPicture,
      role: latestVisit.visitorRole,
      totalVisits: visits.length,
      firstVisit: visits[visits.length - 1].visitedAt,
      lastVisit: latestVisit.visitedAt,
      visits: visits.map((v) => ({
        date: v.visitedAt,
        source: v.source,
      })),
    },
  });
});
