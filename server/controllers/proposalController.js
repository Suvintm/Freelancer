/**
 * Proposal Controller - For Open Briefs feature
 * Handles proposal submission, acceptance with Razorpay, and rejection
 */
import mongoose from "mongoose";
import { Brief } from "../models/Brief.js";
import { Proposal } from "../models/Proposal.js";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import User from "../models/User.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import { createNotification } from "./notificationController.js";
import { SiteSettings } from "../models/SiteSettings.js";
import logger from "../utils/logger.js";

// ============ SUBMIT PROPOSAL ============
export const submitProposal = asyncHandler(async (req, res) => {
  const editorId = req.user._id;
  const { briefId, proposedPrice, proposedDeliveryDays, pitch, relevantPortfolio } = req.body;

  // Verify user is an editor
  if (req.user.role !== "editor") {
    throw new ApiError(403, "Only editors can submit proposals");
  }

  // Find brief
  const brief = await Brief.findById(briefId).populate("client", "name");
  if (!brief) {
    throw new ApiError(404, "Brief not found");
  }

  // Check if brief is open
  if (brief.status !== "open") {
    throw new ApiError(400, `Cannot submit proposal to ${brief.status} brief`);
  }

  // Check if deadline passed
  if (brief.applicationDeadline < new Date()) {
    throw new ApiError(400, "Application deadline has passed");
  }

  // Check if editor already submitted a proposal
  const existingProposal = await Proposal.findOne({
    brief: briefId,
    editor: editorId,
    status: { $nin: ["withdrawn"] },
  });
  if (existingProposal) {
    throw new ApiError(400, "You have already submitted a proposal for this brief");
  }

  // Validate proposed price is within budget range (allow negotiation)
  if (proposedPrice < brief.budget.min * 0.5) {
    throw new ApiError(400, `Price too low. Minimum is ₹${Math.floor(brief.budget.min * 0.5)}`);
  }

  // Create proposal
  const proposal = await Proposal.create({
    brief: briefId,
    editor: editorId,
    proposedPrice,
    proposedDeliveryDays,
    pitch,
    relevantPortfolio: relevantPortfolio || [],
    status: "pending",
  });

  const populatedProposal = await Proposal.findById(proposal._id)
    .populate("editor", "name profilePicture")
    .populate("brief", "title briefNumber");

  // Notify client
  await createNotification({
    recipient: brief.client._id,
    type: "success",
    title: "📬 New Proposal Received!",
    message: `${req.user.name} submitted a proposal for "${brief.title}" - ₹${proposedPrice}`,
    data: { briefId, proposalId: proposal._id },
  });

  logger.info(`Proposal submitted: ${proposal._id} for brief: ${brief.briefNumber} by editor: ${editorId}`);

  res.status(201).json({
    success: true,
    message: "Proposal submitted successfully",
    proposal: populatedProposal,
  });
});

// ============ GET PROPOSALS FOR BRIEF (For Clients) ============
export const getProposalsForBrief = asyncHandler(async (req, res) => {
  const { briefId } = req.params;
  const userId = req.user._id;

  // Find brief and verify ownership
  const brief = await Brief.findById(briefId);
  if (!brief) {
    throw new ApiError(404, "Brief not found");
  }

  if (brief.client.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized to view proposals for this brief");
  }

  const proposals = await Proposal.find({
    brief: briefId,
    status: { $nin: ["withdrawn"] },
  })
    .populate("editor", "name profilePicture email rating completedOrders")
    .sort({ isShortlisted: -1, createdAt: -1 });

  // Mark as viewed
  await Proposal.updateMany(
    { brief: briefId, viewedByClient: false },
    { viewedByClient: true, viewedAt: new Date() }
  );

  res.status(200).json({
    success: true,
    proposals,
    briefTitle: brief.title,
    briefStatus: brief.status,
  });
});

// ============ GET MY PROPOSALS (For Editors) ============
export const getMyProposals = asyncHandler(async (req, res) => {
  const editorId = req.user._id;
  const { status, page = 1, limit = 20 } = req.query;

  if (req.user.role !== "editor") {
    throw new ApiError(403, "Only editors can access their proposals");
  }

  const query = { editor: editorId };
  if (status) {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [proposals, total] = await Promise.all([
    Proposal.find(query)
      .populate({
        path: "brief",
        select: "title briefNumber category budget status applicationDeadline client",
        populate: { path: "client", select: "name profilePicture" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Proposal.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    proposals,
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
  const userId = req.user._id;

  const proposal = await Proposal.findById(id).populate("brief");
  if (!proposal) {
    throw new ApiError(404, "Proposal not found");
  }

  // Verify ownership of brief
  if (proposal.brief.client.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized to shortlist this proposal");
  }

  // Toggle shortlist
  proposal.isShortlisted = !proposal.isShortlisted;
  proposal.shortlistedAt = proposal.isShortlisted ? new Date() : null;
  await proposal.save();

  // Notify editor if shortlisted
  if (proposal.isShortlisted) {
    await createNotification({
      recipient: proposal.editor,
      type: "success",
      title: "⭐ You've Been Shortlisted!",
      message: `Your proposal for "${proposal.brief.title}" was shortlisted`,
      data: { briefId: proposal.brief._id, proposalId: id },
    });
  }

  res.status(200).json({
    success: true,
    message: proposal.isShortlisted ? "Proposal shortlisted" : "Proposal removed from shortlist",
    isShortlisted: proposal.isShortlisted,
  });
});

// ============ ACCEPT PROPOSAL - STEP 1: Create Razorpay Order ============
export const acceptProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { agreedPrice, agreedDeliveryDays } = req.body;
  const userId = req.user._id;

  const proposal = await Proposal.findById(id)
    .populate("editor", "name profilePicture email")
    .populate("brief");

  if (!proposal) {
    throw new ApiError(404, "Proposal not found");
  }

  const brief = proposal.brief;

  // Verify ownership
  if (brief.client.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized to accept this proposal");
  }

  // Check brief status
  if (brief.status !== "open" && brief.status !== "in_review") {
    throw new ApiError(400, `Cannot accept proposal for ${brief.status} brief`);
  }

  // Check proposal status
  if (proposal.status !== "pending" && proposal.status !== "shortlisted") {
    throw new ApiError(400, `Cannot accept ${proposal.status} proposal`);
  }

  // Validate agreed price (must be >= proposed price)
  const finalPrice = agreedPrice || proposal.proposedPrice;
  if (finalPrice < proposal.proposedPrice) {
    throw new ApiError(400, "Agreed price cannot be less than proposed price");
  }

  const finalDeliveryDays = agreedDeliveryDays || proposal.proposedDeliveryDays;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + finalDeliveryDays);

  // Calculate platform fee
  const settings = await SiteSettings.getSettings();
  const feePercent = settings.platformFee || 10;
  const platformFee = Math.round(finalPrice * (feePercent / 100));
  const editorEarning = finalPrice - platformFee;

  // Create Razorpay order
  let razorpayOrder;
  try {
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(finalPrice * 100), // Paise
      currency: "INR",
      receipt: `brp_${proposal._id.toString().slice(-12)}`, // Max 40 chars
      notes: {
        briefId: brief._id.toString(),
        proposalId: proposal._id.toString(),
        clientId: userId.toString(),
        editorId: proposal.editor._id.toString(),
      },
    });

    logger.info(`Razorpay order created for brief acceptance: ${razorpayOrder.id}`);
  } catch (error) {
    logger.error("Razorpay order creation failed:", error);
    throw new ApiError(500, "Failed to create payment order. Please try again.");
  }

  // Update brief status to in_review (will be set to accepted after payment)
  brief.status = "in_review";
  await brief.save();

  // Store pending acceptance data (will be finalized after payment)
  proposal.agreedPrice = finalPrice;
  proposal.agreedDeliveryDays = finalDeliveryDays;
  proposal.agreedDeadline = deadline;
  await proposal.save();

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
      _id: proposal._id,
      proposedPrice: proposal.proposedPrice,
      agreedPrice: finalPrice,
      agreedDeliveryDays: finalDeliveryDays,
      deadline,
    },
    brief: {
      _id: brief._id,
      title: brief.title,
    },
    editor: {
      name: proposal.editor.name,
      profilePicture: proposal.editor.profilePicture,
    },
    fees: {
      total: finalPrice,
      platformFee,
      editorEarning,
    },
  });
});

// ============ VERIFY ACCEPTANCE PAYMENT - STEP 2: Finalize ============
export const verifyAcceptancePayment = asyncHandler(async (req, res) => {
  const {
    proposalId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;
  const userId = req.user._id;

  // Verify Razorpay signature
  const crypto = await import("crypto");
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto.default
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed. Invalid signature.");
  }

  // Get proposal and brief
  const proposal = await Proposal.findById(proposalId)
    .populate("editor", "name profilePicture email")
    .populate("brief");

  if (!proposal) {
    throw new ApiError(404, "Proposal not found");
  }

  const brief = proposal.brief;

  // Check if already processed (idempotency)
  if (proposal.status === "accepted") {
    const existingOrder = await Order.findById(proposal.linkedOrder);
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order already created",
        order: existingOrder,
      });
    }
  }

  try {
    // 1. Create Order
    const settings = await SiteSettings.getSettings();
    const feePercent = settings.platformFee || 10;
    const platformFee = Math.round(proposal.agreedPrice * (feePercent / 100));
    const editorEarning = proposal.agreedPrice - platformFee;
    const orderDescription = brief.description?.substring(0, 1990) || brief.title;

    const order = await Order.create({
      type: "brief",
      brief: brief._id,
      client: userId,
      editor: proposal.editor._id,
      title: brief.title,
      description: orderDescription,
      deadline: proposal.agreedDeadline,
      amount: proposal.agreedPrice,
      platformFee,
      editorEarning,
      paymentStatus: "escrow",
      paymentGateway: "razorpay",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      escrowStatus: "held",
      escrowHeldAt: new Date(),
      status: "accepted",
      acceptedAt: new Date(),
    });

    const orderId = order._id;

    // 2. Update proposal
    await Proposal.findByIdAndUpdate(proposalId, {
      status: "accepted",
      acceptedAt: new Date(),
      linkedOrder: orderId,
    });

    // 3. Update brief
    await Brief.findByIdAndUpdate(brief._id, {
      status: "accepted",
      acceptedProposal: proposal._id,
      acceptedEditor: proposal.editor._id,
      acceptedAt: new Date(),
      finalPrice: proposal.agreedPrice,
      finalDeadline: proposal.agreedDeadline,
      linkedOrder: orderId,
    });

    // 4. Reject all other proposals (fire and forget)
    Proposal.updateMany(
      { 
        brief: brief._id, 
        _id: { $ne: proposal._id },
        status: { $nin: ["withdrawn", "rejected"] }
      },
      { 
        status: "rejected",
        autoRejected: true,
        rejectedAt: new Date(),
        rejectionReason: "Another proposal was accepted"
      }
    ).exec().catch(err => logger.error("Failed to reject other proposals:", err));

    // 5. Create Payment record
    await Payment.create({
      order: orderId,
      client: userId,
      editor: proposal.editor._id,
      amount: proposal.agreedPrice,
      platformFee,
      editorEarning,
      type: "escrow_deposit",
      status: "completed",
      transactionId: razorpay_payment_id,
      orderSnapshot: {
        orderNumber: order.orderNumber,
        title: brief.title,
        createdAt: new Date(),
        deadline: proposal.agreedDeadline,
      },
      completedAt: new Date(),
    });

    // 6. Send notification to accepted editor
    createNotification({
      recipient: proposal.editor._id,
      type: "success",
      title: "🎉 Congratulations! Your Proposal Was Accepted!",
      message: `${req.user.name} accepted your proposal for "${brief.title}" - ₹${proposal.agreedPrice}. Deadline: ${proposal.agreedDeliveryDays} days.`,
      data: { 
        briefId: brief._id, 
        proposalId: proposal._id,
        orderId: orderId,
        amount: proposal.agreedPrice,
        deadline: proposal.agreedDeadline,
      },
      priority: "high",
    }).catch(err => logger.error("Failed to send notification:", err));

    logger.info(`Brief accepted: ${brief.briefNumber}, Order: ${order.orderNumber}, Editor: ${proposal.editor._id}`);

    // Populate order for response
    const populatedOrder = await Order.findById(orderId)
      .populate("client", "name profilePicture")
      .populate("editor", "name profilePicture");

    res.status(200).json({
      success: true,
      message: "Proposal accepted and order created successfully!",
      order: populatedOrder,
    });

  } catch (error) {
    logger.error("Acceptance failed:", {
      error: error.message,
      proposalId,
      userId,
    });
    throw new ApiError(500, `Failed to complete acceptance: ${error.message}`);
  }
});

// ============ REJECT PROPOSAL ============
export const rejectProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  const proposal = await Proposal.findById(id).populate("brief");
  if (!proposal) {
    throw new ApiError(404, "Proposal not found");
  }

  // Verify ownership
  if (proposal.brief.client.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized to reject this proposal");
  }

  if (proposal.status === "rejected" || proposal.status === "accepted") {
    throw new ApiError(400, `Proposal is already ${proposal.status}`);
  }

  proposal.status = "rejected";
  proposal.rejectedAt = new Date();
  proposal.rejectionReason = reason || null;
  await proposal.save();

  // Notify editor
  await createNotification({
    recipient: proposal.editor,
    type: "warning",
    title: "Proposal Not Selected",
    message: `Your proposal for "${proposal.brief.title}" was not selected${reason ? `: ${reason}` : ""}`,
    data: { briefId: proposal.brief._id, proposalId: id },
  });

  logger.info(`Proposal rejected: ${id} for brief: ${proposal.brief.briefNumber}`);

  res.status(200).json({
    success: true,
    message: "Proposal rejected",
  });
});

// ============ WITHDRAW PROPOSAL ============
export const withdrawProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const editorId = req.user._id;

  const proposal = await Proposal.findById(id).populate("brief", "title client");
  if (!proposal) {
    throw new ApiError(404, "Proposal not found");
  }

  // Verify ownership
  if (proposal.editor.toString() !== editorId.toString()) {
    throw new ApiError(403, "Not authorized to withdraw this proposal");
  }

  if (proposal.status === "accepted") {
    throw new ApiError(400, "Cannot withdraw accepted proposal");
  }

  proposal.status = "withdrawn";
  proposal.withdrawnAt = new Date();
  proposal.withdrawalReason = reason || null;
  await proposal.save();

  // Notify client
  await createNotification({
    recipient: proposal.brief.client,
    type: "info",
    title: "Proposal Withdrawn",
    message: `An editor withdrew their proposal for "${proposal.brief.title}"`,
    data: { briefId: proposal.brief._id },
  });

  logger.info(`Proposal withdrawn: ${id} by editor: ${editorId}`);

  res.status(200).json({
    success: true,
    message: "Proposal withdrawn successfully",
  });
});

// ============ GET PROPOSAL STATS (For Editors) ============
export const getProposalStats = asyncHandler(async (req, res) => {
  const editorId = req.user._id;

  if (req.user.role !== "editor") {
    throw new ApiError(403, "Only editors can access proposal stats");
  }

  const [total, pending, shortlisted, accepted, rejected] = await Promise.all([
    Proposal.countDocuments({ editor: editorId, status: { $ne: "withdrawn" } }),
    Proposal.countDocuments({ editor: editorId, status: "pending" }),
    Proposal.countDocuments({ editor: editorId, status: "shortlisted" }),
    Proposal.countDocuments({ editor: editorId, status: "accepted" }),
    Proposal.countDocuments({ editor: editorId, status: "rejected" }),
  ]);

  const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  res.status(200).json({
    success: true,
    stats: {
      total,
      pending,
      shortlisted,
      accepted,
      rejected,
      acceptanceRate,
    },
  });
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
