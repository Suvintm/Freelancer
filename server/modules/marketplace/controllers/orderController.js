/**
 * Order Controller - Handles order lifecycle (Prisma/PostgreSQL)
 */
import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";
import { recalculateEditorScore } from "../../user/controllers/suvixScoreController.js";
import logger from "../../../utils/logger.js";

const mapOrder = (o) => {
  if (!o) return null;
  return { 
    ...o, 
    _id: o.id, 
    client: o.client_id, 
    editor: o.editor_id, 
    gig: o.gig_id,
    orderNumber: o.order_number,
    platformFee: o.platform_fee,
    editorEarning: o.editor_earning,
    paymentStatus: o.payment_status,
    escrowStatus: o.escrow_status,
  };
};

// ============ CREATE ORDER FROM GIG ============
export const createOrderFromGig = asyncHandler(async (req, res) => {
  const { gigId, description, deadline } = req.body;
  const userId = req.user.id;

  const gig = await prisma.gig.findUnique({ where: { id: gigId } });
  if (!gig) throw new ApiError(404, "Gig not found");
  if (!gig.is_active) throw new ApiError(400, "Gig inactive");
  if (gig.editor_id === userId) throw new ApiError(400, "Cannot order your own gig");

  const settings = await prisma.siteSettings.findFirst();
  const platformFeePercentage = Number(settings?.platform_fee || 10);

  const orderNumber = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      order_number: orderNumber,
      type: "gig",
      gig_id: gigId,
      client_id: userId,
      editor_id: gig.editor_id,
      title: gig.title,
      description: description || gig.description,
      deadline: new Date(deadline),
      amount: gig.price,
      platform_fee_percentage: platformFeePercentage,
      status: "pending_payment",
      payment_status: "pending",
    },
    include: { client: { select: { name: true } }, editor: { select: { name: true } } }
  });

  res.status(201).json({ success: true, order: mapOrder(order) });
});

// ============ CREATE REQUEST WITH PAYMENT ============
export const createRequestPaymentOrder = asyncHandler(async (req, res) => {
  const { editorId, title, description, deadline, amount } = req.body;
  const userId = req.user.id;

  if (amount < 100) throw new ApiError(400, "Min ₹100");
  if (editorId === userId) throw new ApiError(400, "Self-order not allowed");

  const editor = await prisma.user.findUnique({ where: { id: editorId } });
  if (!editor || editor.role !== "editor") throw new ApiError(404, "Editor not found");

  const settings = await prisma.siteSettings.findFirst();
  const platformFeePercent = Number(settings?.platform_fee || 10);
  const platformFee = Math.round(amount * (platformFeePercent / 100));
  const editorEarning = amount - platformFee;

  const Razorpay = (await import("razorpay")).default;
  const razorpay = new Razorpay({ 
      key_id: process.env.RAZORPAY_KEY_ID, 
      key_secret: process.env.RAZORPAY_KEY_SECRET 
  });

  const razorpayOrder = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `req_${Date.now()}`,
    notes: { clientId: userId, editorId: editorId, title, type: "request" }
  });

  const orderNumber = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      order_number: orderNumber,
      type: "request",
      client_id: userId,
      editor_id: editorId,
      title: title.trim(),
      description: description.trim(),
      deadline: new Date(deadline),
      amount: Number(amount),
      platform_fee_percentage: platformFeePercent,
      platform_fee: platformFee,
      editor_earning: editorEarning,
      status: "pending_payment",
      payment_status: "pending",
      razorpay_order_id: razorpayOrder.id,
      payment_gateway: "razorpay"
    }
  });

  res.status(200).json({
    success: true,
    order: mapOrder(order),
    razorpay: { 
        orderId: razorpayOrder.id, 
        amount: razorpayOrder.amount, 
        currency: razorpayOrder.currency, 
        key: process.env.RAZORPAY_KEY_ID 
    },
    editor: { name: editor.name, profile_picture: editor.profile_picture }
  });
});

// ============ VERIFY REQUEST PAYMENT ============
export const verifyRequestPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user.id;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { client: true, editor: true }
  });

  if (!order) throw new ApiError(404, "Order not found");

  const crypto = await import("crypto");
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");

  if (expectedSignature === razorpay_signature) {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
          status: "new", 
          payment_status: "escrow", 
          razorpay_payment_id, 
          razorpay_signature 
      }
    });

    await createNotification({
      recipient: order.editor_id,
      type: "success",
      title: "New Project Request!",
      message: `${order.client.name} sent a new request: "${order.title}"`,
      link: `/chat/${orderId}`
    });

    res.status(200).json({ success: true, order: mapOrder(updatedOrder) });
  } else {
    throw new ApiError(400, "Invalid signature");
  }
});

// ============ VERIFY REQUEST PAYMENT CALLBACK ============
export const verifyRequestPaymentCallback = asyncHandler(async (req, res) => {
    // This is typically for webhooks, implement as needed
    res.status(200).json({ success: true });
});

// ============ GET MY ORDERS ============
export const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  const orders = await prisma.order.findMany({
    where: {
      AND: [
        role === "editor" ? { editor_id: userId, status: { not: "pending_payment" } } : { client_id: userId },
        req.query.status && req.query.status !== "all" ? { status: req.query.status } : {},
      ]
    },
    include: {
      client: { select: { id: true, name: true, profile_picture: true } },
      editor: { select: { id: true, name: true, profile_picture: true } }
    },
    orderBy: { updated_at: 'desc' }
  });

  res.status(200).json({ 
      success: true, 
      orders: orders.map(o => mapOrder(o)) 
  });
});

// ============ GET ORDER ============
export const getOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            client: { select: { id: true, name: true, profile_picture: true } },
            editor: { select: { id: true, name: true, profile_picture: true } },
            gig: true
        }
    });

    if (!order) throw new ApiError(404, "Order not found");
    if (order.client_id !== userId && order.editor_id !== userId && req.user.role !== "admin") {
        throw new ApiError(403, "Not authorized");
    }

    res.status(200).json({ success: true, order: mapOrder(order) });
});

// ============ ACCEPT ORDER ============
export const acceptOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.editor_id !== userId) throw new ApiError(403, "Not authorized");
  if (order.status !== "new") throw new ApiError(400, "Cannot accept in current state");

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status: "accepted", accepted_at: new Date() }
  });

  await createNotification({ 
      recipient: order.client_id, 
      type: "success", 
      title: "Order Accepted!", 
      message: `Editor accepted "${order.title}"`, 
      link: `/chat/${id}` 
  });

  res.status(200).json({ success: true, order: mapOrder(updatedOrder) });
});

// ============ REJECT ORDER ============
export const rejectOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.editor_id !== userId) throw new ApiError(403, "Not authorized");

  await prisma.order.update({
    where: { id },
    data: { status: "rejected" }
  });

  await createNotification({ 
      recipient: order.client_id, 
      type: "warning", 
      title: "Order Rejected", 
      message: `Editor declined "${order.title}"`, 
      link: "/chats" 
  });

  res.status(200).json({ success: true, message: "Order rejected" });
});

// ============ SUBMIT WORK ============
export const submitWork = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, files } = req.body;
    
    const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: "submitted", updated_at: new Date() }
    });

    res.status(200).json({ success: true, order: mapOrder(updatedOrder) });
});

// ============ COMPLETE ORDER ============
export const completeOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: "completed", updated_at: new Date() }
    });

    res.status(200).json({ success: true, order: mapOrder(updatedOrder) });
});

// ============ RAISE DISPUTE ============
export const raiseDispute = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: "disputed", disputed_at: new Date() }
    });

    res.status(200).json({ success: true, order: mapOrder(updatedOrder) });
});

// ============ EXTEND DEADLINE ============
export const extendDeadline = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { days } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    const newDeadline = new Date(order.deadline);
    newDeadline.setDate(newDeadline.getDate() + parseInt(days));

    const updatedOrder = await prisma.order.update({
        where: { id },
        data: { deadline: newDeadline }
    });

    res.status(200).json({ success: true, order: mapOrder(updatedOrder) });
});

// ============ GET ORDER STATS ============
export const getOrderStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    const matchField = role === "editor" ? "editor_id" : "client_id";

    const stats = await prisma.order.groupBy({
        by: ['status'],
        where: { [matchField]: userId },
        _count: { id: true }
    });

    const formatted = { total: 0 };
    stats.forEach(s => {
        formatted[s.status] = s._count.id;
        formatted.total += s._count.id;
    });

    if (role === "editor") {
        const earnings = await prisma.order.aggregate({
            where: { editor_id: userId, status: "completed" },
            _sum: { editor_earning: true }
        });
        formatted.totalEarnings = Number(earnings._sum.editor_earning || 0);
    }

    res.status(200).json({ success: true, stats: formatted });
});

// ============ STUBS FOR MISSING EXPORTS ============
export const checkOverdueOrders = asyncHandler(async (req, res) => {
    res.json({ success: true, message: "Overdue check completed (stub)" });
});

export const processOverdueRefunds = asyncHandler(async (req, res) => {
    res.json({ success: true, message: "Overdue refunds processed (stub)" });
});

export const getDeadlineStatus = asyncHandler(async (req, res) => {
    res.json({ success: true, status: "on_time" });
});

export const getNewOrdersCount = asyncHandler(async (req, res) => {
    const count = await prisma.order.count({
        where: { editor_id: req.user.id, status: "new" }
    });
    res.json({ success: true, count });
});

export const togglePinOrder = asyncHandler(async (req, res) => {
    res.json({ success: true, message: "Order pinned/unpinned" });
});
