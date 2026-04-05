/**
 * Brief Controller - For Open Briefs feature (Prisma/PostgreSQL)
 * Handles all brief-related operations
 */
import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";
import logger from "../../../utils/logger.js";

// Generate unique brief number
const generateBriefNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BRF-${year}-${random}`;
};

// Helper: Map Prisma Brief to camelCase for frontend
const mapBrief = (b) => {
  if (!b) return null;
  return {
    ...b,
    _id: b.id,
    briefNumber: b.brief_number,
    clientId: b.client_id,
    client: b.client ? {
      ...b.client,
      _id: b.client.id,
      profilePicture: b.client.profile_picture
    } : undefined,
    budget: {
      min: Number(b.budget_min),
      max: Number(b.budget_max),
      currency: b.currency,
      isNegotiable: b.budget_negotiable,
    },
    requirements: {
      outputFormat: b.output_format,
      aspectRatio: b.aspect_ratio,
      revisionsIncluded: b.revisions_included,
      softwareNeeded: b.software_needed,
      skillLevel: b.skill_level,
      references: b.references,
    },
    applicationDeadline: b.application_deadline,
    expectedDeliveryDays: b.expected_delivery_days,
    isUrgent: b.is_urgent,
    isBoosted: b.is_boosted,
    proposalCount: b.proposal_count,
    acceptedProposal: b.accepted_proposal_id,
    acceptedEditor: b.editor ? {
      ...b.editor,
      _id: b.editor.id,
      profilePicture: b.editor.profile_picture
    } : b.accepted_editor_id,
    acceptedAt: b.accepted_at,
    finalPrice: b.final_price,
    finalDeadline: b.final_deadline,
    linkedOrder: b.order_id,
    cancelledAt: b.cancelled_at,
    cancellationReason: b.cancellation_reason,
    expiredAt: b.expired_at,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    attachments: b.attachments?.map(a => ({
      ...a,
      _id: a.id,
      publicId: a.public_id
    })),
    editHistory: b.edit_history?.map(h => ({
      ...h,
      _id: h.id,
      editedAt: h.edited_at,
      editedBy: h.edited_by
    }))
  };
};

// ============ CREATE BRIEF ============
export const createBrief = asyncHandler(async (req, res) => {
  const clientId = req.user.id;

  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can create briefs");
  }

  const {
    title, description, category, attachments, budget,
    requirements, applicationDeadline, expectedDeliveryDays,
    visibility, isUrgent,
  } = req.body;

  const deadline = new Date(applicationDeadline);
  if (deadline <= new Date()) {
    throw new ApiError(400, "Application deadline must be in the future");
  }

  // Create brief in PostgreSQL
  const brief = await prisma.brief.create({
    data: {
      brief_number: generateBriefNumber(),
      client_id: clientId,
      title: title.trim(),
      description: description.trim(),
      category: category,
      budget_min: Number(budget.min),
      budget_max: Number(budget.max),
      currency: budget.currency || "INR",
      budget_negotiable: budget.isNegotiable !== false,
      output_format: requirements?.outputFormat || "MP4 1080p",
      aspect_ratio: requirements?.aspectRatio || "16:9",
      revisions_included: requirements?.revisionsIncluded || 2,
      software_needed: requirements?.softwareNeeded || [],
      skill_level: requirements?.skillLevel || "any",
      references: requirements?.references || [],
      application_deadline: deadline,
      expected_delivery_days: Number(expectedDeliveryDays),
      visibility: visibility || "public",
      is_urgent: isUrgent || false,
      status: "open",
      attachments: {
        create: (attachments || []).map(a => ({
          url: a.url,
          type: a.type || "raw",
          name: a.name,
          size: a.size,
          public_id: a.publicId
        }))
      }
    },
    include: {
      client: { select: { id: true, name: true, profile_picture: true } },
      attachments: true
    }
  });

  logger.info(`Brief created: ${brief.brief_number} by client: ${clientId}`);

  res.status(201).json({
    success: true,
    message: "Brief created successfully",
    brief: mapBrief(brief),
  });
});

// ============ GET OPEN BRIEFS (For Editors) ============
export const getOpenBriefs = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, category, minBudget, maxBudget,
    skillLevel, sort = "-createdAt", search,
  } = req.query;

  const now = new Date();
  const where = {
    status: "open",
    visibility: "public",
    application_deadline: { gt: now },
  };

  if (category) where.category = category;
  if (minBudget) where.budget_min = { gte: Number(minBudget) };
  if (maxBudget) where.budget_max = { lte: Number(maxBudget) };
  if (skillLevel && skillLevel !== "any") {
    where.skill_level = { in: [skillLevel, "any"] };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  let orderBy = { created_at: 'desc' };
  switch (sort) {
    case "budget_high": orderBy = { budget_max: 'desc' }; break;
    case "budget_low":  orderBy = { budget_min: 'asc' }; break;
    case "deadline":    orderBy = { application_deadline: 'asc' }; break;
    case "popular":     orderBy = { proposal_count: 'desc' }; break;
    default:            orderBy = [ { is_urgent: 'desc' }, { is_boosted: 'desc' }, { created_at: 'desc' } ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [briefs, total] = await Promise.all([
    prisma.brief.findMany({
      where,
      include: { client: { select: { id: true, name: true, profile_picture: true } } },
      orderBy,
      skip,
      take: Number(limit)
    }),
    prisma.brief.count({ where }),
  ]);

  let appliedBriefIds = [];
  if (req.user && req.user.role === "editor") {
    const proposals = await prisma.proposal.findMany({
      where: {
        editor_id: req.user.id,
        status: { not: "withdrawn" }
      },
      select: { brief_id: true }
    });
    appliedBriefIds = proposals.map(p => p.brief_id);
  }

  const briefsWithApplyStatus = briefs.map(b => ({
    ...mapBrief(b),
    hasApplied: appliedBriefIds.includes(b.id),
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
  const clientId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;

  if (req.user.role !== "client") {
    throw new ApiError(403, "Only clients can access their briefs");
  }

  const where = { client_id: clientId };
  if (status) where.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [briefs, total] = await Promise.all([
    prisma.brief.findMany({
      where,
      include: { editor: { select: { id: true, name: true, profile_picture: true } } },
      orderBy: { created_at: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.brief.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    briefs: briefs.map(mapBrief),
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
  const userId = req.user.id;

  const brief = await prisma.brief.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, profile_picture: true, email: true } },
      editor: { select: { id: true, name: true, profile_picture: true } },
      attachments: true,
      edit_history: true
      // Note: Linked order depends on how it's defined in schema.prisma, omitting complex join for now if not defined
    }
  });

  if (!brief) {
    throw new ApiError(404, "Brief not found");
  }

  const isOwner = brief.client_id === userId;
  if (!isOwner && req.user.role === "editor") {
    await prisma.brief.update({
      where: { id },
      data: { views: { increment: 1 } }
    });
  }

  let userProposal = null;
  if (req.user.role === "editor") {
    userProposal = await prisma.proposal.findFirst({
      where: {
        brief_id: id,
        editor_id: userId,
        status: { not: "withdrawn" }
      }
    });
  }

  res.status(200).json({
    success: true,
    brief: mapBrief(brief),
    isOwner,
    userProposal,
  });
});

// ============ UPDATE BRIEF ============
export const updateBrief = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const brief = await prisma.brief.findUnique({ where: { id } });
  if (!brief) throw new ApiError(404, "Brief not found");

  if (brief.client_id !== userId) {
    throw new ApiError(403, "Not authorized to update this brief");
  }

  if (["accepted", "completed", "expired", "cancelled"].includes(brief.status)) {
    throw new ApiError(400, `Cannot edit brief in ${brief.status} status`);
  }

  const { title, description, requirements, applicationDeadline, isUrgent } = req.body;

  if ((brief.proposal_count || 0) > 0 && req.body.budget) {
    throw new ApiError(400, "Cannot change budget after receiving proposals. Cancel and create a new brief.");
  }

  const updates = {};
  const history = [];

  if (title && title !== brief.title) {
    history.push({ field: "title", old_value: brief.title, new_value: title, edited_by: userId });
    updates.title = title;
  }
  if (description && description !== brief.description) {
    history.push({ field: "description", old_value: brief.description, new_value: description, edited_by: userId });
    updates.description = description;
  }

  if (requirements) {
    if (requirements.outputFormat) updates.output_format = requirements.outputFormat;
    if (requirements.aspectRatio) updates.aspect_ratio = requirements.aspectRatio;
    if (requirements.revisionsIncluded) updates.revisions_included = requirements.revisionsIncluded;
    if (requirements.softwareNeeded) updates.software_needed = requirements.softwareNeeded;
    if (requirements.skillLevel) updates.skill_level = requirements.skillLevel;
    if (requirements.references) updates.references = requirements.references;
  }

  if (applicationDeadline) {
    const newDeadline = new Date(applicationDeadline);
    if (newDeadline <= new Date()) throw new ApiError(400, "Application deadline must be in the future");
    updates.application_deadline = newDeadline;
  }

  if (isUrgent !== undefined) updates.is_urgent = isUrgent;

  const updatedBrief = await prisma.brief.update({
    where: { id },
    data: {
      ...updates,
      edit_history: {
        create: history.map(h => ({
          field: h.field,
          old_value: String(h.old_value),
          new_value: String(h.new_value),
          edited_by: h.edited_by
        }))
      }
    },
    include: { client: { select: { id: true, name: true, profile_picture: true } } }
  });

  if (history.length > 0 && (brief.proposal_count || 0) > 0) {
    const proposals = await prisma.proposal.findMany({ 
      where: { brief_id: id, status: { notIn: ["withdrawn", "rejected"] } } 
    });
    for (const proposal of proposals) {
      await createNotification({
        recipient: proposal.editor_id,
        type: "info",
        title: "Brief Updated",
        message: `"${brief.title}" has been updated by the client`,
        link: `/briefs/${id}`
      });
    }
  }

  res.status(200).json({
    success: true,
    message: "Brief updated successfully",
    brief: mapBrief(updatedBrief),
  });
});

// ============ CANCEL BRIEF ============
export const cancelBrief = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const brief = await prisma.brief.findUnique({ where: { id } });
  if (!brief) throw new ApiError(404, "Brief not found");

  if (brief.client_id !== userId) {
    throw new ApiError(403, "Not authorized to cancel this brief");
  }

  if (["accepted", "completed"].includes(brief.status)) {
    throw new ApiError(400, `Cannot cancel brief in ${brief.status} status`);
  }

  await prisma.brief.update({
    where: { id },
    data: {
      status: "cancelled",
      cancelled_at: new Date(),
      cancellation_reason: reason || "Cancelled by client"
    }
  });

  const proposals = await prisma.proposal.findMany({ 
    where: { brief_id: id, status: { not: "withdrawn" } } 
  });
  
  await prisma.proposal.updateMany({
    where: { brief_id: id, status: { not: "withdrawn" } },
    data: {
      status: "rejected",
      rejected_at: new Date(),
      rejection_reason: "Brief was cancelled by client"
    }
  });

  for (const proposal of proposals) {
    await createNotification({
      recipient: proposal.editor_id,
      type: "warning",
      title: "Brief Cancelled",
      message: `"${brief.title}" has been cancelled by the client`,
      link: `/briefs/${id}`
    });
  }

  res.status(200).json({ success: true, message: "Brief cancelled successfully" });
});

// ============ GET BRIEF STATS ============
export const getBriefStats = asyncHandler(async (req, res) => {
  const clientId = req.user.id;

  const stats = await prisma.brief.groupBy({
    by: ['status'],
    where: { client_id: clientId },
    _count: true
  });

  const counts = { total: 0, open: 0, accepted: 0, completed: 0, expired: 0 };
  stats.forEach(s => {
    counts[s.status] = s._count;
    counts.total += s._count;
  });

  const totalProposals = await prisma.proposal.count({
    where: {
      brief: { client_id: clientId },
      status: { not: "withdrawn" }
    }
  });

  res.status(200).json({
    success: true,
    stats: { ...counts, totalProposals }
  });
});

// ============ EXTEND DEADLINE ============
export const extendDeadline = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newDeadline } = req.body;
  const userId = req.user.id;

  const brief = await prisma.brief.findUnique({ where: { id } });
  if (!brief) throw new ApiError(404, "Brief not found");

  if (brief.client_id !== userId) {
    throw new ApiError(403, "Not authorized to extend this brief");
  }

  const deadlineDate = new Date(newDeadline);
  if (deadlineDate <= new Date()) {
    throw new ApiError(400, "New deadline must be in the future");
  }

  if (deadlineDate <= brief.application_deadline) {
    throw new ApiError(400, "New deadline must be after the current deadline");
  }

  const updatedBrief = await prisma.brief.update({
    where: { id },
    data: {
      application_deadline: deadlineDate,
      status: "open", // Re-open if it was expired
      edit_history: {
        create: {
          field: "application_deadline",
          old_value: String(brief.application_deadline),
          new_value: String(deadlineDate),
          edited_by: userId
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    message: "Deadline extended successfully",
    brief: mapBrief(updatedBrief)
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






