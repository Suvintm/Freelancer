/**
 * Payment Gateway Controller
 * Handles payment creation, verification, and webhook processing
 */

import prisma from "../../../config/prisma.js";
// import { Message } from "../../connectivity/models/Message.js"; // DEPRECATED
// import { Order } from "../../marketplace/models/Order.js"; // DEPRECATED
// import User from "../../user/models/User.js"; // DEPRECATED (Using Prisma)
// import { SiteSettings } from "../../system/models/SiteSettings.js"; // DEPRECATED
import { Payment } from "../models/Payment.js";
import PaymentService, {
  isPaymentSupported,
  getCurrencyInfo,
  calculatePlatformFee,
} from "../../../services/PaymentService.js";
import { RazorpayProvider } from "../../../services/RazorpayProvider.js";
import { getRazorpayKeyId, verifyWebhookSignature, isRazorpayConfigured } from "../../../config/razorpay.js";

/**
 * Placeholder for Order model since it is not yet integrated with Prisma.
 * This prevents ReferenceErrors while maintaining the controller structure.
 */
const OrderShim = {
  findById: async (id) => null,
  findOne: async (query) => null,
  findByIdAndUpdate: async (id, update) => null,
};

const SiteSettingsShim = {
  getSettings: async () => ({
    platformFee: 10,
    minPayoutAmount: 500,
    refundPolicy: {
      beforeAcceptedPercent: 100,
      afterAcceptedNoWorkPercent: 100,
      workInProgressLowPercent: 75,
      workInProgressHighPercent: 50,
      afterDeliveryPercent: 0,
    }
  }),
};

/**
 * Get payment configuration for frontend
 * Returns gateway key and supported status
 */
export const getPaymentConfig = async (req, res) => {
  try {
    const user = req.user;
    const support = await isPaymentSupported(user.country);
    const currencyInfo = getCurrencyInfo(user.country);
    const settings = await SiteSettingsShim.getSettings();

    res.json({
      success: true,
      config: {
        supported: support.supported,
        gateway: support.gateway || null,
        message: support.message || null,
        waitlistEnabled: support.waitlistEnabled || false,
        currency: currencyInfo.currency,
        symbol: currencyInfo.symbol,
        razorpayKeyId: support.supported && support.gateway === "razorpay" 
          ? getRazorpayKeyId() 
          : null,
        platformFeePercent: settings.platformFee,
        minPayoutAmount: settings.minPayoutAmount,
      },
    });
  } catch (error) {
    console.error("❌ Get payment config error:", error);
    res.status(500).json({ success: false, message: "Failed to get payment config" });
  }
};

/**
 * Create payment order
 * Called when client initiates payment for an order
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const user = req.user;

    // Check if Razorpay is configured
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Payment gateway is currently not configured. Please contact support or try again later.",
        code: "GATEWAY_NOT_CONFIGURED",
      });
    }

    // Check payment support
    const support = await isPaymentSupported(user.country);
    if (!support.supported) {
      return res.status(400).json({
        success: false,
        message: support.message || "Payments not available in your region",
      });
    }

    // Get the order
    const order = await OrderShim.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Verify client owns this order
    if (order.client.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Check if already paid
    if (order.paymentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Order payment status is already: ${order.paymentStatus}`,
      });
    }

    // Calculate fees
    const feeInfo = await calculatePlatformFee(order.amount);

    // Create Razorpay order
    const provider = new RazorpayProvider();
    const razorpayOrder = await provider.createOrder({
      amount: order.amount,
      currency: order.currency || "INR",
      orderId: order._id.toString(),
      notes: {
        orderNumber: order.orderNumber,
        clientId: user._id.toString(),
        editorId: order.editor.toString(),
      },
    });

    // Update order with Razorpay details
    order.razorpayOrderId = razorpayOrder.orderId;
    order.paymentGateway = "razorpay";
    order.paymentStatus = "processing";
    order.platformFee = feeInfo.platformFee;
    order.editorEarning = feeInfo.editorAmount;
    await order.save();

    res.json({
      success: true,
      order: {
        id: razorpayOrder.orderId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      keyId: getRazorpayKeyId(),
      prefill: {
        name: user.name,
        email: user.email,
      },
      feeBreakdown: feeInfo,
    });
  } catch (error) {
    console.error("❌ Create payment order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify payment after Razorpay checkout
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Find order by Razorpay order ID
    const order = await OrderShim.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Verify payment with provider
    const provider = new RazorpayProvider();
    const verification = await provider.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!verification.success) {
      order.paymentStatus = "failed";
      await order.save();
      return res.status(400).json({
        success: false,
        message: verification.error || "Payment verification failed",
      });
    }

    // Update order with payment success
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentStatus = "escrow";
    order.escrowStatus = "held";
    order.escrowHeldAt = new Date();
    order.paidAt = new Date();
    
    // For awaiting_payment orders (request orders), set to accepted
    // For pending_payment orders (gig orders), set to new
    if (order.status === "awaiting_payment") {
      order.status = "accepted"; // Request order - already accepted by editor, now proceed
    } else {
      order.status = "new"; // Gig order - now visible to editor
    }
    await order.save();

    /*
    // Create Payment record for escrow deposit
    await Payment.create({
      order: order._id,
      client: order.client,
      editor: order.editor,
      amount: order.amount,
      platformFee: order.platformFee,
      editorEarning: order.editorEarning,
      type: "escrow_deposit",
      status: "completed",
      transactionId: razorpay_payment_id,
      orderSnapshot: {
        orderNumber: order.orderNumber,
        title: order.title,
        description: order.description,
        createdAt: order.createdAt,
        deadline: order.deadline,
      },
      completedAt: new Date(),
      notes: `Razorpay Payment ID: ${razorpay_payment_id}`,
    });
    */

    // Get order details for notification
    const populatedOrder = { client: { name: "Client" }, editor: { name: "Editor" }, gig: { title: "Gig" } };
    /*
    const populatedOrder = await Order.findById(order._id)
      .populate("client", "name")
      .populate("editor", "name")
      .populate("gig", "title");
    */

    /*
    // Create system message now that payment is confirmed
    const { Message } = await import("../../connectivity/models/Message.js");
    ...
    */

    // Notify editor now that payment is confirmed
    const { createNotification } = await import("../../connectivity/controllers/notificationController.js");
    await createNotification({
      recipient: order.editor,
      type: "success",
      title: "💰 Payment Received!",
      message: `${populatedOrder.client?.name || "A client"} paid ₹${order.amount} for "${order.title}". Start working!`,
      link: `/chat/${order._id}`,
      metaData: {
        orderId: order._id,
        senderId: order.client,
        type: "new_order"
      }
    });

    /*
    // Increment gig orders count now that it's paid (only for gig orders)
    if (order.gig) {
      const { Gig } = await import("../../marketplace/models/Gig.js");
      await Gig.findByIdAndUpdate(order.gig, { $inc: { totalOrders: 1 } });
    }
    */

    // Emit Socket.IO event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.to(order.editor.toString()).emit("order:payment_received", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.amount,
        title: order.title,
      });
      io.to(order.client.toString()).emit("order:payment_confirmed", {
        orderId: order._id,
        orderNumber: order.orderNumber,
      });
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        title: order.title,
        amount: order.amount,
        editorName: populatedOrder.client?.name,
        paymentStatus: order.paymentStatus,
        escrowStatus: order.escrowStatus,
      },
    });
  } catch (error) {
    console.error("❌ Verify payment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify payment callback (For Mobile/Redirect)
 */
export const verifyPaymentCallback = async (req, res) => {
  try {
    const { orderId } = req.query;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Find order
    const order = await OrderShim.findById(orderId);
    /*
    const order = await Order.findById(orderId)
      ...
    */

    if (!order) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-failed?error=order_not_found`);
    }

    // If already processed, just redirect to my orders
    if (["new", "accepted", "in_progress"].includes(order.status)) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/my-orders?status=new&payment=success`);
    }

    // Verify payment with provider
    const provider = new RazorpayProvider();
    const verification = await provider.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!verification.success) {
      order.paymentStatus = "failed";
      await order.save();
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-failed?error=verification_failed`);
    }

    // Update order with payment success
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentStatus = "escrow";
    order.escrowStatus = "held";
    order.escrowHeldAt = new Date();
    order.paidAt = new Date();
    
    if (order.status === "awaiting_payment") {
      order.status = "accepted";
    } else {
      order.status = "new";
    }
    await order.save();

    // Create Payment record
    await Payment.create({
      order: order._id,
      client: order.client._id,
      editor: order.editor._id,
      amount: order.amount,
      platformFee: order.platformFee,
      editorEarning: order.editorEarning,
      type: "escrow_deposit",
      status: "completed",
      transactionId: razorpay_payment_id,
      orderSnapshot: {
        orderNumber: order.orderNumber,
        title: order.title,
        description: order.description,
        createdAt: order.createdAt,
        deadline: order.deadline,
      },
      completedAt: new Date(),
      notes: `Razorpay Payment ID: ${razorpay_payment_id} (Mobile Callback)`,
    });

    // Create system message
    const MessageClass = (await import("../../connectivity/models/Message.js")).Message || (await import("../../connectivity/models/Message.js")).default;
    if (order.type === "request") {
      await MessageClass.create({
        order: order._id,
        sender: order.client._id,
        type: "system",
        content: `✅ Payment of ₹${order.amount} confirmed via Mobile Redirect! Chat is now enabled.`,
        systemAction: "payment_confirmed",
      });
    } else {
      await MessageClass.create({
        order: order._id,
        sender: order.client._id,
        type: "system",
        content: `Payment of ₹${order.amount} confirmed via Mobile Redirect. Order created for "${order.title}"`,
        systemAction: "payment_confirmed",
      });
    }

    // Notify editor
    const { createNotification } = await import("../../connectivity/controllers/notificationController.js");
    await createNotification({
      recipient: order.editor._id,
      type: "success",
      title: "💰 Payment Received!",
      message: `${order.client?.name || "A client"} paid ₹${order.amount} for "${order.title}". Start working!`,
      link: `/chat/${order._id}`,
      metaData: {
        orderId: order._id,
        senderId: order.client._id,
        type: "new_order"
      }
    });

    // Increment gig orders count
    if (order.gig) {
      const { Gig: GigModel } = await import("../../marketplace/models/Gig.js");
      await GigModel.findByIdAndUpdate(order.gig, { $inc: { totalOrders: 1 } });
    }

    // Redirect to my orders
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/my-orders?status=new&payment=success`);
  } catch (error) {
    console.error("❌ Callback verify error:", error);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-failed?error=internal_error`);
  }
};

/**
 * Razorpay Webhook Handler
 * Handles async payment events from Razorpay
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    
    // Verify webhook signature
    if (!verifyWebhookSignature(req.body, signature)) {
      console.error("❌ Invalid webhook signature");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`📩 Razorpay webhook: ${event}`);

    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(payload.payment.entity);
        break;
      case "payment.failed":
        await handlePaymentFailed(payload.payment.entity);
        break;
      case "refund.created":
        await handleRefundCreated(payload.refund.entity);
        break;
      case "payout.processed":
        await handlePayoutProcessed(payload.payout.entity);
        break;
      case "payout.failed":
        await handlePayoutFailed(payload.payout.entity);
        break;
      default:
        console.log(`🔔 Unhandled webhook event: ${event}`);
    }

    res.json({ success: true, received: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Webhook handlers
async function handlePaymentCaptured(payment) {
  const order = await OrderShim.findOne({ razorpayOrderId: payment.order_id });
  /*
  const order = await Order.findOne({ razorpayOrderId: payment.order_id })
    .populate("client", "name email")
    .populate("editor", "name email");
  */
    
  if (!order) return;

  // If already processed, don't duplicate logic
  const wasAlreadyProcessed = ["new", "accepted", "in_progress"].includes(order.status);

  order.razorpayPaymentId = payment.id;
  order.paymentStatus = "escrow";
  order.escrowStatus = "held";
  order.escrowHeldAt = new Date();
  order.paidAt = order.paidAt || new Date();

  // Update status if it's currently in a pending state
  if (!wasAlreadyProcessed) {
    if (order.status === "awaiting_payment") {
      order.status = "accepted";
    } else if (order.status === "pending_payment") {
      order.status = "new";
    }
  }

  await order.save();

  // Create Payment record if it doesn't exist
  const existingPayment = await Payment.findOne({ transactionId: payment.id });
  if (!existingPayment) {
    await Payment.create({
      order: order._id,
      client: order.client._id,
      editor: order.editor._id,
      amount: order.amount,
      platformFee: order.platformFee,
      editorEarning: order.editorEarning,
      type: "escrow_deposit",
      status: "completed",
      transactionId: payment.id,
      orderSnapshot: {
        orderNumber: order.orderNumber,
        title: order.title,
        description: order.description,
        createdAt: order.createdAt,
        deadline: order.deadline,
      },
      completedAt: new Date(),
      notes: "Created via Webhook (payment.captured)",
    });
  }

  // If we just transitioned the status, send notifications and messages
  if (!wasAlreadyProcessed) {
    // Create system message
    const { Message } = await import("../../connectivity/models/Message.js");
    if (order.type === "request") {
      await Message.create({
        order: order._id,
        sender: order.client._id,
        type: "system",
        content: `✅ Payment of ₹${order.amount} confirmed via Webhook! Chat is now enabled. ${order.editor?.name || "Editor"}, you can start working.`,
        systemAction: "payment_confirmed",
      });
    } else {
      await Message.create({
        order: order._id,
        sender: order.client._id,
        type: "system",
        content: `Payment of ₹${order.amount} confirmed via Webhook. Order created for "${order.title}"`,
        systemAction: "payment_confirmed",
      });
    }

    // Notify editor
    const { createNotification } = await import("../../connectivity/controllers/notificationController.js");
    await createNotification({
      recipient: order.editor._id,
      type: "success",
      title: "💰 Payment Received!",
      message: `${order.client?.name || "A client"} paid ₹${order.amount} for "${order.title}" (Verified via Webhook).`,
      link: `/chat/${order._id}`,
      metaData: {
        orderId: order._id,
        senderId: order.client._id,
        type: "new_order"
      }
    });

    // Increment gig orders count
    if (order.gig) {
      const { Gig } = await import("../../marketplace/models/Gig.js");
      await Gig.findByIdAndUpdate(order.gig, { $inc: { totalOrders: 1 } });
    }
  }
}

async function handlePaymentFailed(payment) {
  const order = await OrderShim.findOne({ razorpayOrderId: payment.order_id });
  if (!order) return;

  // order.paymentStatus = "failed";
  // await order.save();
}

async function handleRefundCreated(refund) {
  const order = await OrderShim.findOne({ razorpayPaymentId: refund.payment_id });
  if (!order) return;

  // order.refundId = refund.id;
  // order.refundAmount = refund.amount / 100;
  // order.refundedAt = new Date();
  // order.paymentStatus = "refunded";
  // order.escrowStatus = "refunded";
  // await order.save();

  // Create Payment record for refund
  /*
  await Payment.create({
    order: order._id,
    client: order.client,
    editor: order.editor,
    amount: refund.amount / 100,
    platformFee: 0,
    editorEarning: 0,
    type: "refund",
    status: "completed",
    transactionId: refund.id,
    orderSnapshot: {
      orderNumber: order.orderNumber,
      title: order.title,
    },
    completedAt: new Date(),
    notes: `Refund for payment: ${refund.payment_id}`,
  });
  */
}

async function handlePayoutProcessed(payout) {
  const referenceId = payout.reference_id;
  const editorId = referenceId?.split("_")[1];
  
  /*
  // Update editor earnings
  if (editorId) {
    await User.findByIdAndUpdate(editorId, {
      $inc: { totalWithdrawn: payout.amount / 100 },
    });
  }
  */
}

async function handlePayoutFailed(payout) {
  console.error("❌ Payout failed:", payout);
  // Notify admin about failed payout
}

/**
 * Release payment to editor (called on order completion)
 */
export const releasePayment = async (orderId) => {
  try {
    const order = await OrderShim.findById(orderId);
    if (!order) throw new Error("Order not found");

    const editor = order.editor;
    
    // Check if editor has linked bank account
    if (editor && !editor.razorpayFundAccountId) {
      // Hold release until KYC complete
      console.warn(`⚠️  Editor ${editor._id} needs KYC for payout`);
      
      // Update editor pending payout
      await prisma.user.update({
        where: { id: editor._id },
        data: { pendingPayout: { increment: order.editorEarning } }
      });
      
      return { success: true, status: "pending_kyc" };
    }

    return { success: true, status: "released", message: "Legacy release logic disabled" };
  } catch (error) {
    console.error("❌ Release payment error:", error);
    throw error;
  }
};

/**
 * Process refund for an order
 * Called when order is cancelled or disputed
 */
export const processRefund = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    
    const order = await OrderShim.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only allow refund for orders with payment
    if (!order.razorpayPaymentId) {
      return res.status(400).json({ 
        success: false, 
        message: "No payment to refund" 
      });
    }

    // Check if already refunded
    if (order.paymentStatus === "refunded") {
      return res.status(400).json({ 
        success: false, 
        message: "Order already refunded" 
      });
    }

    // Determine refund amount based on order stage
    const settings = await SiteSettingsShim.getSettings();
    const policy = settings.refundPolicy || {};
    
    let refundPercent = 100;
    let stage = "default";

    switch (order.status) {
      case "new":
      case "pending":
        refundPercent = policy.beforeAcceptedPercent || 100;
        stage = "before_accepted";
        break;
      case "accepted":
        refundPercent = policy.afterAcceptedNoWorkPercent || 100;
        stage = "accepted_no_work";
        break;
      case "in_progress":
        refundPercent = policy.workInProgressLowPercent || 75;
        stage = "work_in_progress";
        break;
      case "submitted":
        refundPercent = policy.workInProgressHighPercent || 50;
        stage = "submitted";
        break;
      case "completed":
        refundPercent = policy.afterDeliveryPercent || 0;
        stage = "completed";
        break;
      default:
        refundPercent = 0;
    }

    const refundAmount = Math.round(order.amount * (refundPercent / 100));

    if (refundAmount === 0) {
      return res.status(400).json({
        success: false,
        message: "No refund available for completed orders",
      });
    }

    // Process refund via Razorpay
    const provider = new RazorpayProvider();
    const refund = await provider.processRefund(order.razorpayPaymentId, refundAmount);

    // Update order
    order.refundId = refund.refundId;
    order.refundAmount = refundAmount;
    order.refundedAt = new Date();
    order.refundReason = reason || "Customer request";
    order.paymentStatus = "refunded";
    order.escrowStatus = "refunded";
    order.status = "cancelled";
    order.cancelledAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: `Refund of ₹${refundAmount} processed`,
      refund: {
        id: refund.refundId,
        amount: refundAmount,
        originalAmount: order.amount,
        percentRefunded: refundPercent,
        stage,
      },
    });
  } catch (error) {
    console.error("❌ Process refund error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  releasePayment,
  processRefund,
};






