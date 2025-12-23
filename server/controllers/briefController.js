/**
 * Brief Controller - For Open Briefs feature
 * Handles all brief-related operations
 */
import { Brief } from "../models/Brief.js";
import { Proposal } from "../models/Proposal.js";
import User from "../models/User.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import { createNotification } from "./notificationController.js";
import logger from "../utils/logger.js";

// ============ CREATE BRIEF ============
export const createBrief = asyncHandler(async (req, res) => {
  const clientId = req.user._id;

  // Verify user is a client
  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can create briefs");
  }

  const {
    title,
    description,
    category,
    attachments,
    budget,
    requirements,
    applicationDeadline,
    expectedDeliveryDays,
    visibility,
    isUrgent,
  } = req.body;

  // Validate application deadline is in the future
  const deadline = new Date(applicationDeadline);
  if (deadline <= new Date()) {
    throw new ApiError(400, "Application deadline must be in the future");
  }

  // Create brief
  const brief = await Brief.create({
    client: clientId,
    title,
    description,
    category,
    attachments: attachments || [],
    budget: {
      min: budget.min,
      max: budget.max,
      currency: budget.currency || "INR",
      isNegotiable: budget.isNegotiable !== false,
    },
    requirements: {
      outputFormat: requirements?.outputFormat || "MP4 1080p",
      aspectRatio: requirements?.aspectRatio || "16:9",
      revisionsIncluded: requirements?.revisionsIncluded || 2,
      softwareNeeded: requirements?.softwareNeeded || [],
      skillLevel: requirements?.skillLevel || "any",
      references: requirements?.references || [],
    },
    applicationDeadline: deadline,
    expectedDeliveryDays,
    visibility: visibility || "public",
    isUrgent: isUrgent || false,
    status: "open",
  });

  const populatedBrief = await Brief.findById(brief._id)
    .populate("client", "name profilePicture");

  logger.info(`Brief created: ${brief.briefNumber} by client: ${clientId}`);

  res.status(201).json({
    success: true,
    message: "Brief created successfully",
    brief: populatedBrief,
  });
});

// ============ GET OPEN BRIEFS (For Editors) ============
export const getOpenBriefs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    minBudget,
    maxBudget,
    skillLevel,
    sort = "-createdAt",
    search,
  } = req.query;

  // Build query
  const query = {
    status: "open",
    visibility: "public",
    applicationDeadline: { $gt: new Date() },
  };

  // Filters
  if (category) {
    query.category = category;
  }
  if (minBudget) {
    query["budget.min"] = { $gte: Number(minBudget) };
  }
  if (maxBudget) {
    query["budget.max"] = { $lte: Number(maxBudget) };
  }
  if (skillLevel && skillLevel !== "any") {
    query["requirements.skillLevel"] = { $in: [skillLevel, "any"] };
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Sort options
  let sortOption = {};
  switch (sort) {
    case "budget_high":
      sortOption = { "budget.max": -1 };
      break;
    case "budget_low":
      sortOption = { "budget.min": 1 };
      break;
    case "deadline":
      sortOption = { applicationDeadline: 1 };
      break;
    case "popular":
      sortOption = { proposalCount: -1 };
      break;
    default:
      sortOption = { isUrgent: -1, isBoosted: -1, createdAt: -1 };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [briefs, total] = await Promise.all([
    Brief.find(query)
      .populate("client", "name profilePicture")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit)),
    Brief.countDocuments(query),
  ]);

  // If editor is logged in, check which briefs they've already applied to
  let appliedBriefIds = [];
  if (req.user && req.user.role === "editor") {
    const proposals = await Proposal.find({
      editor: req.user._id,
      status: { $nin: ["withdrawn"] },
    }).select("brief");
    appliedBriefIds = proposals.map(p => p.brief.toString());
  }

  // Add hasApplied flag
  const briefsWithApplyStatus = briefs.map(brief => ({
    ...brief.toObject(),
    hasApplied: appliedBriefIds.includes(brief._id.toString()),
  }));

  res.status(200).json({
    success: true,
    briefs: briefsWithApplyStatus,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ============ GET MY BRIEFS (For Clients) ============
export const getMyBriefs = asyncHandler(async (req, res) => {
  const clientId = req.user._id;
  const { status, page = 1, limit = 20 } = req.query;

  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can access their briefs");
  }

  const query = { client: clientId };
  if (status) {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [briefs, total] = await Promise.all([
    Brief.find(query)
      .populate("acceptedEditor", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Brief.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    briefs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ============ GET BRIEF BY ID ============
export const getBriefById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const brief = await Brief.findById(id)
    .populate("client", "name profilePicture email")
    .populate("acceptedEditor", "name profilePicture")
    .populate("linkedOrder", "orderNumber status");

  if (!brief) {
    throw new ApiError(404, "Brief not found");
  }

  // Increment view count (only for editors viewing public briefs)
  const isOwner = brief.client._id.toString() === userId.toString();
  if (!isOwner && req.user.role === "editor") {
    await Brief.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }

  // Check if current user has applied (for editors)
  let userProposal = null;
  if (req.user.role === "editor") {
    userProposal = await Proposal.findOne({
      brief: id,
      editor: userId,
      status: { $nin: ["withdrawn"] },
    });
  }

  res.status(200).json({
    success: true,
    brief,
    isOwner,
    userProposal,
  });
});

// ============ UPDATE BRIEF ============
export const updateBrief = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const brief = await Brief.findById(id);
  if (!brief) {
    throw new ApiError(404, "Brief not found");
  }

  // Check ownership
  if (brief.client.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized to update this brief");
  }

  // Check if brief can be edited
  if (["accepted", "completed", "expired", "cancelled"].includes(brief.status)) {
    throw new ApiError(400, `Cannot edit brief in ${brief.status} status`);
  }

  const { title, description, requirements, applicationDeadline, isUrgent } = req.body;

  // If proposals exist, restrict budget changes
  const hasProposals = brief.proposalCount > 0;
  if (hasProposals && req.body.budget) {
    throw new ApiError(400, "Cannot change budget after receiving proposals. Cancel and create a new brief.");
  }

  // Track changes for audit
  const changes = [];
  if (title && title !== brief.title) {
    changes.push({ field: "title", oldValue: brief.title, newValue: title, editedBy: userId });
  }
  if (description && description !== brief.description) {
    changes.push({ field: "description", oldValue: brief.description, newValue: description, editedBy: userId });
  }

  // Apply updates
  const updates = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (requirements) updates.requirements = { ...brief.requirements, ...requirements };
  if (applicationDeadline) {
    const newDeadline = new Date(applicationDeadline);
    if (newDeadline <= new Date()) {
      throw new ApiError(400, "Application deadline must be in the future");
    }
    updates.applicationDeadline = newDeadline;
  }
  if (isUrgent !== undefined) updates.isUrgent = isUrgent;

  // Add to edit history
  if (changes.length > 0) {
    updates.$push = { editHistory: { $each: changes } };
  }

  const updatedBrief = await Brief.findByIdAndUpdate(id, updates, { new: true })
    .populate("client", "name profilePicture");

  // Notify editors who have applied about the update
  if (changes.length > 0 && brief.proposalCount > 0) {
    const proposals = await Proposal.find({ brief: id, status: { $nin: ["withdrawn", "rejected"] } });
    for (const proposal of proposals) {
      await createNotification({
        recipient: proposal.editor,
        type: "info",
        title: "Brief Updated",
        message: `"${brief.title}" has been updated by the client`,
        data: { briefId: id },
      });
    }
  }

  logger.info(`Brief updated: ${brief.briefNumber} by client: ${userId}`);

  res.status(200).json({
    success: true,
    message: "Brief updated successfully",
    brief: updatedBrief,
  });
});

// ============ CANCEL BRIEF ============
export const cancelBrief = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  const brief = await Brief.findById(id);
  if (!brief) {
    throw new ApiError(404, "Brief not found");
  }

  // Check ownership
  if (brief.client.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized to cancel this brief");
  }

  // Cannot cancel accepted/completed briefs
  if (["accepted", "completed"].includes(brief.status)) {
    throw new ApiError(400, `Cannot cancel brief in ${brief.status} status`);
  }

  // Update brief
  brief.status = "cancelled";
  brief.cancelledAt = new Date();
  brief.cancellationReason = reason || "Cancelled by client";
  await brief.save();

  // Notify all editors with pending proposals
  const proposals = await Proposal.find({ brief: id, status: { $nin: ["withdrawn"] } });
  for (const proposal of proposals) {
    proposal.status = "rejected";
    proposal.autoRejected = true;
    proposal.rejectedAt = new Date();
    proposal.rejectionReason = "Brief was cancelled by client";
    await proposal.save();

    await createNotification({
      recipient: proposal.editor,
      type: "warning",
      title: "Brief Cancelled",
      message: `"${brief.title}" has been cancelled by the client`,
      data: { briefId: id },
    });
  }

  logger.info(`Brief cancelled: ${brief.briefNumber} by client: ${userId}`);

  res.status(200).json({
    success: true,
    message: "Brief cancelled successfully",
  });
});

// ============ EXTEND DEADLINE ============
export const extendDeadline = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newDeadline, reason } = req.body;
  const userId = req.user._id;

  const brief = await Brief.findById(id);
  if (!brief) {
    throw new ApiError(404, "Brief not found");
  }

  if (brief.client.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized to extend this brief");
  }

  if (!["open", "expired"].includes(brief.status)) {
    throw new ApiError(400, "Can only extend open or expired briefs");
  }

  const deadline = new Date(newDeadline);
  if (deadline <= new Date()) {
    throw new ApiError(400, "New deadline must be in the future");
  }

  // Track change
  brief.editHistory.push({
    field: "applicationDeadline",
    oldValue: brief.applicationDeadline,
    newValue: deadline,
    editedBy: userId,
    reason: reason || "Deadline extended",
  });

  brief.applicationDeadline = deadline;
  if (brief.status === "expired") {
    brief.status = "open";
    brief.expiredAt = null;
  }
  await brief.save();

  logger.info(`Brief deadline extended: ${brief.briefNumber}`);

  res.status(200).json({
    success: true,
    message: "Deadline extended successfully",
    brief,
  });
});

// ============ GET BRIEF STATS (For Client Dashboard) ============
export const getBriefStats = asyncHandler(async (req, res) => {
  const clientId = req.user._id;

  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can access brief stats");
  }

  const [total, open, accepted, completed, expired] = await Promise.all([
    Brief.countDocuments({ client: clientId }),
    Brief.countDocuments({ client: clientId, status: "open" }),
    Brief.countDocuments({ client: clientId, status: "accepted" }),
    Brief.countDocuments({ client: clientId, status: "completed" }),
    Brief.countDocuments({ client: clientId, status: "expired" }),
  ]);

  // Get total proposals received
  const clientBriefs = await Brief.find({ client: clientId }).select("_id");
  const briefIds = clientBriefs.map(b => b._id);
  const totalProposals = await Proposal.countDocuments({
    brief: { $in: briefIds },
    status: { $nin: ["withdrawn"] },
  });

  res.status(200).json({
    success: true,
    stats: {
      total,
      open,
      accepted,
      completed,
      expired,
      totalProposals,
    },
  });
});

export default {
  createBrief,
  getOpenBriefs,
  getMyBriefs,
  getBriefById,
  updateBrief,
  cancelBrief,
  extendDeadline,
  getBriefStats,
};
