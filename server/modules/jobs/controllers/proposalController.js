/**
 * Proposal Controller - For Open Briefs feature (Prisma/PostgreSQL)
 * Handles proposal submission, acceptance with Razorpay, and rejection
 */
import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";
import { SiteSettings } from "../../system/models/SiteSettings.js";
import logger from "../../../utils/logger.js";

// Helper: Map Prisma Proposal to camelCase
const mapProposal = (p) => {
  if (!p) return null;
  return {
    ...p,
    _id: p.id,
    brief: p.brief ? {
      ...p.brief,
      _id: p.brief.id,
      briefNumber: p.brief.brief_number,
      applicationDeadline: p.brief.application_deadline,
      budget: {
          min: p.brief.budget_min,
          max: p.brief.budget_max,
          currency: p.brief.currency
      }
    } : p.brief_id,
    editor: p.editor ? {
      ...p.editor,
      _id: p.editor.id,
      profilePicture: p.editor.profile_picture,
      completedOrders: p.editor.completed_orders
    } : p.editor_id,
    proposedPrice: Number(p.proposed_price),
    proposedDeliveryDays: p.proposed_delivery_days,
    relevantPortfolio: p.relevant_portfolio,
    isShortlisted: p.is_shortlisted,
    shortlistedAt: p.shortlisted_at,
    agreedPrice: p.agreed_price ? Number(p.agreed_price) : undefined,
    agreedDeliveryDays: p.agreed_delivery_days,
    agreedDeadline: p.agreed_deadline,
    viewedByClient: p.viewed_by_client,
    viewedAt: p.viewed_at,
    acceptedAt: p.accepted_at,
    linkedOrder: p.order_id,
    autoRejected: p.auto_rejected,
    rejectedAt: p.rejected_at,
    rejectionReason: p.rejection_reason,
    withdrawnAt: p.withdrawn_at,
    withdrawalReason: p.withdrawal_reason,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
};

// ============ SUBMIT PROPOSAL ============
export const submitProposal = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { briefId, proposedPrice, proposedDeliveryDays, pitch, relevantPortfolio } = req.body;

  if (req.user.role !== "editor") {
    throw new ApiError(403, "Only editors can submit proposals");
  }

  const brief = await prisma.brief.findUnique({
    where: { id: briefId },
    select: { id: true, title: true, brief_number: true, status: true, application_deadline: true, client_id: true, budget_min: true }
  });

  if (!brief) throw new ApiError(404, "Brief not found");
  if (brief.status !== "open") throw new ApiError(400, `Cannot submit proposal to ${brief.status} brief`);
  if (brief.application_deadline < new Date()) throw new ApiError(400, "Application deadline has passed");

  const existingProposal = await prisma.proposal.findFirst({
    where: {
      brief_id: briefId,
      editor_id: userId,
      status: { not: "withdrawn" }
    }
  });
  if (existingProposal) throw new ApiError(400, "You have already submitted a proposal for this brief");

  if (proposedPrice < Number(brief.budget_min) * 0.5) {
    throw new ApiError(400, `Price too low. Minimum is ₹${Math.floor(Number(brief.budget_min) * 0.5)}`);
  }

  const proposal = await prisma.proposal.create({
    data: {
      brief_id: briefId,
      editor_id: userId,
      proposed_price: Number(proposedPrice),
      proposed_delivery_days: Number(proposedDeliveryDays),
      pitch,
      relevant_portfolio: relevantPortfolio || [],
      status: "pending"
    },
    include: {
        editor: { select: { id: true, name: true, profile_picture: true } },
        brief: { select: { id: true, title: true, brief_number: true } }
    }
  });

  await prisma.brief.update({
    where: { id: briefId },
    data: { proposal_count: { increment: 1 } }
  });

  await createNotification({
    recipient: brief.client_id,
    type: "success",
    title: "📬 New Proposal Received!",
    message: `${req.user.name} submitted a proposal for "${brief.title}" - ₹${proposedPrice}`,
    link: `/briefs/${briefId}/proposals`
  });

  logger.info(`Proposal submitted: ${proposal.id} for brief: ${brief.brief_number} by editor: ${userId}`);

  res.status(201).json({
    success: true,
    message: "Proposal submitted successfully",
    proposal: mapProposal(proposal),
  });
});

// ============ GET PROPOSALS FOR BRIEF (For Clients) ============
export const getProposalsForBrief = asyncHandler(async (req, res) => {
  const { briefId } = req.params;
  const userId = req.user.id;

  const brief = await prisma.brief.findUnique({ where: { id: briefId } });
  if (!brief) throw new ApiError(404, "Brief not found");

  if (brief.client_id !== userId) {
    throw new ApiError(403, "Not authorized to view proposals for this brief");
  }

  const proposals = await prisma.proposal.findMany({
    where: {
      brief_id: briefId,
      status: { not: "withdrawn" }
    },
    include: {
      editor: { select: { id: true, name: true, profile_picture: true, email: true, rating: true, completed_orders: true } }
    },
    orderBy: [ { is_shortlisted: 'desc' }, { created_at: 'desc' } ]
  });

  await prisma.proposal.updateMany({
    where: { brief_id: briefId, viewed_by_client: false },
    data: { viewed_by_client: true, viewed_at: new Date() }
  });

  res.status(200).json({
    success: true,
    proposals: proposals.map(mapProposal),
    briefTitle: brief.title,
    briefStatus: brief.status,
  });
});

// ============ GET MY PROPOSALS (For Editors) ============
export const getMyProposals = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;

  if (req.user.role !== "editor") throw new ApiError(403, "Only editors can access their proposals");

  const where = { editor_id: userId };
  if (status) where.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany({
      where,
      include: {
        brief: {
          select: { id: true, title: true, brief_number: true, category: true, budget_min: true, budget_max: true, currency: true, status: true, application_deadline: true, client_id: true },
          include: { client: { select: { id: true, name: true, profile_picture: true } } }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.proposal.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    proposals: proposals.map(mapProposal),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ============ SHORTLIST PROPOSAL ============
export const shortlistProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: { brief: { select: { id: true, title: true, client_id: true } } }
  });
  if (!proposal) throw new ApiError(404, "Proposal not found");

  if (proposal.brief.client_id !== userId) {
    throw new ApiError(403, "Not authorized to shortlist this proposal");
  }

  const updatedProposal = await prisma.proposal.update({
    where: { id },
    data: {
      is_shortlisted: !proposal.is_shortlisted,
      shortlisted_at: !proposal.is_shortlisted ? new Date() : null
    }
  });

  if (updatedProposal.is_shortlisted) {
    await createNotification({
      recipient: proposal.editor_id,
      type: "success",
      title: "⭐ You've Been Shortlisted!",
      message: `Your proposal for "${proposal.brief.title}" was shortlisted`,
      link: `/briefs/${proposal.brief_id}/proposal`
    });
  }

  res.status(200).json({
    success: true,
    message: updatedProposal.is_shortlisted ? "Proposal shortlisted" : "Proposal removed from shortlist",
    isShortlisted: updatedProposal.is_shortlisted,
  });
});

// ============ ACCEPT PROPOSAL - STEP 1: Create Razorpay Order ============
export const acceptProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { agreedPrice, agreedDeliveryDays } = req.body;
  const userId = req.user.id;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      editor: { select: { id: true, name: true, profile_picture: true, email: true } },
      brief: true
    }
  });

  if (!proposal) throw new ApiError(404, "Proposal not found");
  const brief = proposal.brief;

  if (brief.client_id !== userId) throw new ApiError(403, "Not authorized to accept this proposal");
  if (brief.status !== "open" && brief.status !== "in_review") {
    throw new ApiError(400, `Cannot accept proposal for ${brief.status} brief`);
  }
  if (proposal.status !== "pending" && proposal.status !== "shortlisted") {
    throw new ApiError(400, `Cannot accept ${proposal.status} proposal`);
  }

  const finalPrice = Number(agreedPrice || proposal.proposed_price);
  if (finalPrice < Number(proposal.proposed_price)) {
    throw new ApiError(400, "Agreed price cannot be less than proposed price");
  }

  const finalDeliveryDays = Number(agreedDeliveryDays || proposal.proposed_delivery_days);
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + finalDeliveryDays);

  const settings = await SiteSettings.getSettings();
  const feePercent = settings.platformFee || 10;
  const platformFee = Math.round(finalPrice * (feePercent / 100));
  const editorEarning = finalPrice - platformFee;

  let razorpayOrder;
  try {
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(finalPrice * 100),
      currency: "INR",
      receipt: `brp_${proposal.id.slice(-12)}`,
      notes: {
        briefId: brief.id,
        proposalId: proposal.id,
        clientId: userId,
        editorId: proposal.editor_id,
      },
    });

    logger.info(`Razorpay order created for brief acceptance: ${razorpayOrder.id}`);
  } catch (error) {
    logger.error("Razorpay order creation failed:", error);
    throw new ApiError(500, "Failed to create payment order. Please try again.");
  }

  await prisma.brief.update({ where: { id: brief.id }, data: { status: "in_review" } });
  
  await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      agreed_price: finalPrice,
      agreed_delivery_days: finalDeliveryDays,
      agreed_deadline: deadline
    }
  });

  res.status(200).json({
    success: true,
    message: "Payment order created. Complete payment to confirm.",
    razorpay: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    },
    proposal: {
      _id: proposal.id,
      proposedPrice: Number(proposal.proposed_price),
      agreedPrice: finalPrice,
      agreedDeliveryDays: finalDeliveryDays,
      deadline,
    },
    brief: { _id: brief.id, title: brief.title },
    editor: { name: proposal.editor.name, profilePicture: proposal.editor.profile_picture },
    fees: { total: finalPrice, platformFeePercentage: feePercent, platformFee, editorEarning },
  });
});

// ============ VERIFY ACCEPTANCE PAYMENT - STEP 2: Finalize ============
export const verifyAcceptancePayment = asyncHandler(async (req, res) => {
  const { proposalId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user.id;

  const crypto = await import("crypto");
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto.default
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) throw new ApiError(400, "Payment verification failed. Invalid signature.");

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { editor: { select: { id: true, name: true, email: true } }, brief: true }
  });

  if (!proposal) throw new ApiError(404, "Proposal not found");
  const brief = proposal.brief;

  if (proposal.status === "accepted") {
    const existingOrder = await prisma.order.findFirst({ where: { id: proposal.order_id } });
    if (existingOrder) return res.status(200).json({ success: true, message: "Order already created", order: existingOrder });
  }

  try {
    const settings = await SiteSettings.getSettings();
    const feePercent = settings.platformFee || 10;
    const finalPrice = Number(proposal.agreed_price);
    const platformFee = Math.round(finalPrice * (feePercent / 100));
    const editorEarning = finalPrice - platformFee;
    const orderDescription = brief.description?.substring(0, 1990) || brief.title;

    // Start Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const order = await tx.order.create({
        data: {
          type: "brief",
          brief_id: brief.id,
          client_id: userId,
          editor_id: proposal.editor_id,
          title: brief.title,
          description: orderDescription,
          deadline: proposal.agreed_deadline,
          amount: finalPrice,
          platform_fee_percentage: feePercent,
          platform_fee: platformFee,
          editor_earning: editorEarning,
          payment_status: "escrow",
          payment_gateway: "razorpay",
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          escrow_status: "held",
          escrow_held_at: new Date(),
          status: "accepted",
          accepted_at: new Date()
        }
      });

      // 2. Update Proposal
      await tx.proposal.update({
        where: { id: proposalId },
        data: { status: "accepted", accepted_at: new Date(), order_id: order.id }
      });

      // 3. Update Brief
      await tx.brief.update({
        where: { id: brief.id },
        data: {
          status: "accepted",
          accepted_proposal_id: proposalId,
          accepted_editor_id: proposal.editor_id,
          accepted_at: new Date(),
          final_price: finalPrice,
          final_deadline: proposal.agreed_deadline,
          linked_order_id: order.id
        }
      });

      // 4. Create Payment Record
      await tx.payment.create({
        data: {
          order_id: order.id,
          client_id: userId,
          editor_id: proposal.editor_id,
          amount: finalPrice,
          platform_fee: platformFee,
          editor_earning: editorEarning,
          type: "escrow_deposit",
          status: "completed",
          transaction_id: razorpay_payment_id,
          order_snapshot: {
            orderNumber: order.order_number,
            title: brief.title,
            createdAt: new Date(),
            deadline: proposal.agreed_deadline,
          },
          completed_at: new Date()
        }
      });

      return order;
    });

    // Fire and forget rejection of others
    tx.proposal.updateMany({
        where: {
            brief_id: brief.id,
            id: { not: proposalId },
            status: { notIn: ["withdrawn", "rejected"] }
        },
        data: {
            status: "rejected",
            auto_rejected: true,
            rejected_at: new Date(),
            rejection_reason: "Another proposal was accepted"
        }
    }).catch(e => logger.error("Rejection error:", e));

    await createNotification({
      recipient: proposal.editor_id,
      type: "success",
      title: "🎉 Congratulations! Your Proposal Was Accepted!",
      message: `${req.user.name} accepted your proposal for "${brief.title}" - ₹${finalPrice}.`,
      link: `/orders/${result.id}`
    });

    logger.info(`Brief accepted: ${brief.brief_number}, Order: ${result.order_number}`);

    const populatedOrder = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
          client: { select: { id: true, name: true, profile_picture: true } },
          editor: { select: { id: true, name: true, profile_picture: true } }
      }
    });

    res.status(200).json({ success: true, message: "Proposal accepted and order created!", order: populatedOrder });
  } catch (error) {
    logger.error("Acceptance failed:", error);
    throw new ApiError(500, `Failed to complete acceptance: ${error.message}`);
  }
});

// ============ REJECT PROPOSAL ============
export const rejectProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: { brief: { select: { id: true, title: true, client_id: true, brief_number: true } } }
  });
  if (!proposal) throw new ApiError(404, "Proposal not found");

  if (proposal.brief.client_id !== userId) throw new ApiError(403, "Not authorized to reject this proposal");
  if (proposal.status === "rejected" || proposal.status === "accepted") throw new ApiError(400, `Proposal is already ${proposal.status}`);

  await prisma.proposal.update({
    where: { id },
    data: { status: "rejected", rejected_at: new Date(), rejection_reason: reason || null }
  });

  await createNotification({
    recipient: proposal.editor_id,
    type: "warning",
    title: "Proposal Not Selected",
    message: `Your proposal for "${proposal.brief.title}" was not selected${reason ? `: ${reason}` : ""}`,
    link: `/briefs/${proposal.brief_id}/proposal`
  });

  logger.info(`Proposal rejected: ${id} for brief: ${proposal.brief.brief_number}`);
  res.status(200).json({ success: true, message: "Proposal rejected" });
});

// ============ WITHDRAW PROPOSAL ============
export const withdrawProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: { brief: { select: { id: true, title: true, client_id: true } } }
  });
  if (!proposal) throw new ApiError(404, "Proposal not found");

  if (proposal.editor_id !== userId) throw new ApiError(403, "Not authorized to withdraw this proposal");
  if (proposal.status === "accepted") throw new ApiError(400, "Cannot withdraw accepted proposal");

  await prisma.proposal.update({
    where: { id },
    data: { status: "withdrawn", withdrawn_at: new Date(), withdrawal_reason: reason || null }
  });

  await createNotification({
    recipient: proposal.brief.client_id,
    type: "info",
    title: "Proposal Withdrawn",
    message: `An editor withdrew their proposal for "${proposal.brief.title}"`,
    link: `/briefs/${proposal.brief_id}/proposals`
  });

  logger.info(`Proposal withdrawn: ${id} by editor: ${userId}`);
  res.status(200).json({ success: true, message: "Proposal withdrawn successfully" });
});

// ============ GET PROPOSAL STATS ============
export const getProposalStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (req.user.role !== "editor") throw new ApiError(403, "Only editors can access proposal stats");

  const stats = await prisma.proposal.groupBy({
    by: ['status'],
    where: { editor_id: userId, status: { not: "withdrawn" } },
    _count: true
  });

  const counts = { total: 0, pending: 0, shortlisted: 0, accepted: 0, rejected: 0 };
  stats.forEach(s => {
    if (counts[s.status] !== undefined) counts[s.status] = s._count;
    counts.total += s._count;
  });

  const acceptanceRate = counts.total > 0 ? Math.round((counts.accepted / counts.total) * 100) : 0;

  res.status(200).json({ success: true, stats: { ...counts, acceptanceRate } });
});

export default {
  submitProposal,
  getProposalsForBrief,
  getMyProposals,
  shortlistProposal,
  acceptProposal,
  verifyAcceptancePayment,
  rejectProposal,
  withdrawProposal,
  getProposalStats,
};






