import { Order } from "../models/Order.js";
import { Gig } from "../models/Gig.js";
import { Message } from "../models/Message.js";
import User from "../models/User.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import { createNotification } from "./notificationController.js";
import { releasePayment } from "./paymentGatewayController.js";
import logger from "../utils/logger.js";

// ============ CREATE ORDER FROM GIG ============
export const createOrderFromGig = asyncHandler(async (req, res) => {
  const { gigId, description, deadline } = req.body;

  // Get the gig
  const gig = await Gig.findById(gigId).populate("editor", "name");

  if (!gig) {
    throw new ApiError(404, "Gig not found");
  }

  if (!gig.isActive) {
    throw new ApiError(400, "This gig is currently unavailable");
  }

  // Prevent editor from ordering their own gig
  if (gig.editor._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot order your own gig");
  }

  // Create order with pending_payment status
  // Order will only be visible to editor after successful payment
  const order = await Order.create({
    type: "gig",
    gig: gig._id,
    client: req.user._id,
    editor: gig.editor._id,
    title: gig.title,
    description: description || gig.description,
    deadline: new Date(deadline),
    amount: gig.price,
    status: "pending_payment", // Hidden from editor until payment
    paymentStatus: "pending",
  });

  // Note: System message and editor notification will be sent after payment confirmation
  // This happens in paymentGatewayController.verifyPayment()

  const populatedOrder = await Order.findById(order._id)
    .populate("client", "name profilePicture")
    .populate("editor", "name profilePicture")
    .populate("gig", "title price");

  logger.info(`Order created (pending payment): ${order.orderNumber} from gig: ${gig._id}`);

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    order: populatedOrder,
  });
});

// ============ CREATE REQUEST WITH PAYMENT (Step 1: Create Razorpay Order) ============
export const createRequestPaymentOrder = asyncHandler(async (req, res) => {
  const { editorId, title, description, deadline, amount } = req.body;

  console.log("createRequestPaymentOrder called with:", { editorId, title, description, deadline, amount });

  // Validate
  if (!editorId || !title || !description || !deadline || !amount) {
    const missing = [];
    if (!editorId) missing.push("editorId");
    if (!title) missing.push("title");
    if (!description) missing.push("description");
    if (!deadline) missing.push("deadline");
    if (!amount) missing.push("amount");
    throw new ApiError(400, `Missing required fields: ${missing.join(", ")}`);
  }

  if (amount < 100) {
    throw new ApiError(400, "Minimum amount is ₹100");
  }

  // Prevent self-order
  if (editorId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot send request to yourself");
  }

  // Verify editor exists
  const editor = await User.findById(editorId);
  if (!editor || editor.role !== "editor") {
    throw new ApiError(404, "Editor not found");
  }

  // Calculate platform fee (10%)
  const platformFeePercent = 10;
  const platformFee = Math.round(amount * (platformFeePercent / 100));
  const editorEarning = amount - platformFee;

  // Create Razorpay order
  let razorpayOrder;
  try {
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log("Creating Razorpay order with:", {
      amount: amount * 100,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID ? "SET" : "NOT SET",
      keySecret: process.env.RAZORPAY_KEY_SECRET ? "SET" : "NOT SET",
    });

    razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // Paise
      currency: "INR",
      receipt: `req_${Date.now()}`, // Max 40 chars
      notes: {
        clientId: req.user._id.toString(),
        editorId: editorId,
        title: title,
        type: "request",
      },
    });
    
    console.log("Razorpay order created:", razorpayOrder.id);
  } catch (razorpayError) {
    console.error("Razorpay order creation failed:", razorpayError);
    throw new ApiError(500, `Payment gateway error: ${razorpayError.message}`);
  }

  // Create order in pending_payment state
  const order = await Order.create({
    type: "request",
    client: req.user._id,
    editor: editorId,
    title: title.trim(),
    description: description.trim(),
    deadline: new Date(deadline),
    amount: Number(amount),
    platformFee,
    editorEarning,
    status: "pending_payment",
    paymentStatus: "pending",
    razorpayOrderId: razorpayOrder.id,
    paymentGateway: "razorpay",
  });

  logger.info(`Request payment order created: ${order.orderNumber}, Razorpay: ${razorpayOrder.id}`);

  res.status(200).json({
    success: true,
    order: {
      _id: order._id,
      orderNumber: order.orderNumber,
      title: order.title,
      amount: order.amount,
      platformFee,
      editorEarning,
      deadline: order.deadline,
    },
    razorpay: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    },
    editor: {
      name: editor.name,
      profilePicture: editor.profilePicture,
    },
  });
});

// ============ VERIFY REQUEST PAYMENT (Step 2: Confirm Payment) ============
export const verifyRequestPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Find order
  const order = await Order.findById(orderId)
    .populate("editor", "name profilePicture")
    .populate("client", "name profilePicture");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== "pending_payment") {
    throw new ApiError(400, "Order is not in pending payment state");
  }

  if (order.client._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  // Verify Razorpay signature
  const crypto = await import("crypto");
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  // Update order status
  order.status = "new";
  order.paymentStatus = "escrow";
  order.escrowStatus = "held";
  order.escrowHeldAt = new Date();
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  await order.save();

  // Create system message
  await Message.create({
    order: order._id,
    sender: req.user._id,
    type: "system",
    content: `💰 New paid project request: "${order.title}" (₹${order.amount})`,
    systemAction: "order_created",
  });

  // Notify editor
  await createNotification({
    recipient: order.editor._id,
    type: "success",
    title: "💰 New Paid Request!",
    message: `${req.user.name} sent you a paid request - "${order.title}" for ₹${order.amount}`,
    link: "/chats",
  });

  logger.info(`Request payment verified: ${order.orderNumber}`);

  res.status(200).json({
    success: true,
    message: "Payment verified! Request sent to editor.",
    order: {
      _id: order._id,
      orderNumber: order.orderNumber,
      title: order.title,
      amount: order.amount,
      deadline: order.deadline,
      editorName: order.editor.name,
      editorPicture: order.editor.profilePicture,
    },
  });
});

// ============ GET MY ORDERS ============
export const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;

  let query = {};
  if (role === "editor") {
    query.editor = userId;
    // Editors should not see orders that haven't been paid yet
    query.status = { $ne: "pending_payment" };
  } else {
    query.client = userId;
  }

  // Status filter
  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  const orders = await Order.find(query)
    .populate("client", "name profilePicture")
    .populate("editor", "name profilePicture")
    .populate("gig", "title thumbnail")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    orders,
  });
});

// ============ GET SINGLE ORDER ============
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("client", "name profilePicture email")
    .populate("editor", "name profilePicture email")
    .populate("gig", "title description price");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only client or editor can view
  const isClient = order.client._id.toString() === req.user._id.toString();
  const isEditor = order.editor._id.toString() === req.user._id.toString();

  if (!isClient && !isEditor) {
    throw new ApiError(403, "Not authorized to view this order");
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// ============ ACCEPT ORDER (Editor) ============
export const acceptOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.editor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  // Allow accepting orders that are new OR pending_payment (for request orders)
  if (!["new", "pending_payment"].includes(order.status)) {
    throw new ApiError(400, `Order cannot be accepted in current state (${order.status})`);
  }

  // For REQUEST orders that haven't been paid yet, set to awaiting_payment
  if (order.type === "request" && order.paymentStatus === "pending") {
    order.status = "awaiting_payment";
    order.acceptedAt = new Date();
    // Set payment expiry to 1 day from now
    order.paymentExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await order.save();

    // Create payment request message
    await Message.create({
      order: order._id,
      sender: req.user._id,
      type: "payment_request",
      content: `I've accepted your project request! Please pay ₹${order.amount} to start working on "${order.title}". Payment must be made within 24 hours to confirm the order.`,
      systemAction: "payment_required",
    });

    // Notify client to pay
    await createNotification({
      recipient: order.client,
      type: "info",
      title: "💳 Payment Required",
      message: `${req.user.name} accepted your request! Pay ₹${order.amount} to start the project.`,
      link: `/chat/${order._id}`,
    });

    logger.info(`Request accepted, awaiting payment: ${order.orderNumber}`);

    return res.status(200).json({
      success: true,
      message: "Request accepted. Awaiting payment from client.",
      order,
      requiresPayment: true,
    });
  }

  // For GIG orders (already paid), proceed normally
  order.status = "accepted";
  order.acceptedAt = new Date();
  await order.save();

  // Create system message
  await Message.create({
    order: order._id,
    sender: req.user._id,
    type: "system",
    content: "Order accepted by editor. You can now start chatting!",
    systemAction: "order_accepted",
  });

  // Notify client
  await createNotification({
    recipient: order.client,
    type: "success",
    title: "Order Accepted",
    message: `${req.user.name} accepted your order "${order.title}"`,
    link: `/chat/${order._id}`,
  });

  logger.info(`Order accepted: ${order.orderNumber}`);

  res.status(200).json({
    success: true,
    message: "Order accepted",
    order,
  });
});

// ============ REJECT ORDER (Editor) ============
export const rejectOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.editor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  if (order.status !== "new") {
    throw new ApiError(400, "Order cannot be rejected in current state");
  }

  order.status = "rejected";
  await order.save();

  // Create system message
  await Message.create({
    order: order._id,
    sender: req.user._id,
    type: "system",
    content: "Order declined by editor",
    systemAction: "order_rejected",
  });

  // Auto-refund if payment was completed
  if (order.paymentStatus === "completed") {
    try {
      const { autoRefundOrder } = await import("./refundController.js");
      await autoRefundOrder(order._id, "order_rejected");
      logger.info(`Auto-refund initiated for rejected order: ${order.orderNumber}`);
    } catch (refundErr) {
      logger.error(`Auto-refund failed for order ${order.orderNumber}: ${refundErr.message}`);
      // Don't fail the rejection if refund fails - it will be retried
    }
  }

  // Notify client
  await createNotification({
    recipient: order.client,
    type: "warning",
    title: "Order Declined",
    message: `${req.user.name} declined your order "${order.title}"${order.paymentStatus === "completed" ? ". Your payment will be refunded." : ""}`,
    link: "/chats",
  });

  logger.info(`Order rejected: ${order.orderNumber}`);

  res.status(200).json({
    success: true,
    message: "Order rejected",
    order,
    refundInitiated: order.paymentStatus === "completed",
  });
});


// ============ SUBMIT WORK (Editor) ============
export const submitWork = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.editor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  if (!["accepted", "in_progress"].includes(order.status)) {
    throw new ApiError(400, "Order is not in a submittable state");
  }

  order.status = "submitted";
  order.submittedAt = new Date();
  
  // Schedule auto-release after 4 days
  const autoReleaseDate = new Date();
  autoReleaseDate.setDate(autoReleaseDate.getDate() + 4);
  order.autoReleaseScheduledAt = autoReleaseDate;
  
  await order.save();

  // Create system message
  await Message.create({
    order: order._id,
    sender: req.user._id,
    type: "system",
    content: "Work submitted for review",
    systemAction: "work_submitted",
  });

  // Notify client
  await createNotification({
    recipient: order.client,
    type: "success",
    title: "Work Submitted",
    message: `${req.user.name} submitted work for "${order.title}". Please review and approve.`,
    link: `/chat/${order._id}`,
  });

  logger.info(`Work submitted: ${order.orderNumber}`);

  res.status(200).json({
    success: true,
    message: "Work submitted successfully",
    order,
  });
});

// ============ COMPLETE ORDER (Auto or Client Confirm) ============
export const completeOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("editor");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only client can manually complete
  if (order.client.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  if (order.status !== "submitted") {
    throw new ApiError(400, "Order is not submitted yet");
  }

  // Update order status
  order.status = "completed";
  order.completedAt = new Date();
  
  // Try to release payment via Razorpay
  let payoutResult = { status: "pending" };
  try {
    if (order.escrowStatus === "held" && order.razorpayPaymentId) {
      payoutResult = await releasePayment(order._id);
      logger.info(`Payout initiated: ${order.orderNumber}, status: ${payoutResult.status}`);
    } else {
      // Mark as released even if no payment was held (for testing)
      order.paymentStatus = "released";
      order.escrowStatus = "released";
      order.escrowReleasedAt = new Date();
      
      // Update editor earnings
      await User.findByIdAndUpdate(order.editor._id, {
        $inc: { totalEarnings: order.editorEarning },
      });
    }
  } catch (payoutError) {
    logger.error(`Payout failed for ${order.orderNumber}: ${payoutError.message}`);
    // Continue with order completion, payout can be retried
  }
  
  await order.save();

  // Create system message
  await Message.create({
    order: order._id,
    sender: req.user._id,
    type: "system",
    content: "Order completed. Payment released to editor.",
    systemAction: "work_completed",
  });

  // Notify editor
  await createNotification({
    recipient: order.editor._id,
    type: "success",
    title: "🎉 Payment Released!",
    message: `₹${order.editorEarning} has been released for "${order.title}"`,
    link: `/chat/${order._id}`,
  });

  logger.info(`Order completed: ${order.orderNumber}, Payment: ₹${order.editorEarning}`);

  res.status(200).json({
    success: true,
    message: "Order completed, payment released",
    order,
    payoutStatus: payoutResult.status,
  });
});

// ============ RAISE DISPUTE ============
export const raiseDispute = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const isClient = order.client.toString() === req.user._id.toString();
  const isEditor = order.editor.toString() === req.user._id.toString();

  if (!isClient && !isEditor) {
    throw new ApiError(403, "Not authorized");
  }

  if (!["submitted", "in_progress"].includes(order.status)) {
    throw new ApiError(400, "Cannot raise dispute in current state");
  }

  order.status = "disputed";
  order.disputeReason = reason;
  order.disputedAt = new Date();
  await order.save();

  // Notify both parties
  const notifyUsers = [order.client, order.editor];
  for (const userId of notifyUsers) {
    await createNotification({
      recipient: userId,
      type: "warning",
      title: "Dispute Raised",
      message: `A dispute has been raised for "${order.title}". Admin will review.`,
      link: `/chat/${order._id}`,
    });
  }

  logger.info(`Dispute raised: ${order.orderNumber}, Reason: ${reason}`);

  res.status(200).json({
    success: true,
    message: "Dispute raised. Admin will review within 24-48 hours.",
    order,
  });
});

// ============ GET ORDER STATS (For Dashboard) ============
export const getOrderStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;

  const matchField = role === "editor" ? "editor" : "client";

  const stats = await Order.aggregate([
    { $match: { [matchField]: userId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  // Format stats
  const formattedStats = {
    new: 0,
    accepted: 0,
    in_progress: 0,
    submitted: 0,
    completed: 0,
    rejected: 0,
    disputed: 0,
    totalEarnings: 0,
  };

  stats.forEach((s) => {
    formattedStats[s._id] = s.count;
    if (s._id === "completed" && role === "editor") {
      formattedStats.totalEarnings = s.totalAmount * 0.9; // After platform fee
    }
  });

  res.status(200).json({
    success: true,
    stats: formattedStats,
  });
});
