/**
 * Payment Gateway Controller
 * Handles payment creation, verification, and webhook processing
 */

import { Order } from "../models/Order.js";
import User from "../models/User.js";
import { SiteSettings } from "../models/SiteSettings.js";
import PaymentService, {
  isPaymentSupported,
  getCurrencyInfo,
  calculatePlatformFee,
} from "../services/PaymentService.js";
import { RazorpayProvider } from "../services/RazorpayProvider.js";
import { getRazorpayKeyId, verifyWebhookSignature, isRazorpayConfigured } from "../config/razorpay.js";

/**
 * Get payment configuration for frontend
 * Returns gateway key and supported status
 */
export const getPaymentConfig = async (req, res) => {
  try {
    const user = req.user;
    const support = await isPaymentSupported(user.country);
    const currencyInfo = getCurrencyInfo(user.country);
    const settings = await SiteSettings.getSettings();

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
    const order = await Order.findById(orderId);
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
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
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

    // Get order details for notification
    const populatedOrder = await Order.findById(order._id)
      .populate("client", "name")
      .populate("editor", "name")
      .populate("gig", "title");

    // Create system message now that payment is confirmed
    const { Message } = await import("../models/Message.js");
    
    // Different message based on order type
    if (order.type === "request") {
      // Request order - payment after editor acceptance
      await Message.create({
        order: order._id,
        sender: order.client,
        type: "system",
        content: `✅ Payment of ₹${order.amount} confirmed! Chat is now enabled. ${populatedOrder.editor?.name || "Editor"}, you can start working on the project. Deadline: ${new Date(order.deadline).toLocaleDateString()}.`,
        systemAction: "payment_confirmed",
      });
    } else {
      // Gig order - standard flow
      await Message.create({
        order: order._id,
        sender: order.client,
        type: "system",
        content: `Payment of ₹${order.amount} confirmed. Order created for "${order.title}"`,
        systemAction: "payment_confirmed",
      });
    }

    // Notify editor now that payment is confirmed
    const { createNotification } = await import("./notificationController.js");
    await createNotification({
      recipient: order.editor,
      type: "success",
      title: "💰 Payment Received!",
      message: `${populatedOrder.client?.name || "A client"} paid ₹${order.amount} for "${order.title}". Start working!`,
      link: `/chat/${order._id}`,
    });

    // Increment gig orders count now that it's paid (only for gig orders)
    if (order.gig) {
      const { Gig } = await import("../models/Gig.js");
      await Gig.findByIdAndUpdate(order.gig, { $inc: { totalOrders: 1 } });
    }

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
  const order = await Order.findOne({ razorpayOrderId: payment.order_id });
  if (!order) return;

  order.razorpayPaymentId = payment.id;
  order.paymentStatus = "escrow";
  order.escrowStatus = "held";
  order.escrowHeldAt = new Date();
  await order.save();
}

async function handlePaymentFailed(payment) {
  const order = await Order.findOne({ razorpayOrderId: payment.order_id });
  if (!order) return;

  order.paymentStatus = "failed";
  await order.save();
}

async function handleRefundCreated(refund) {
  const order = await Order.findOne({ razorpayPaymentId: refund.payment_id });
  if (!order) return;

  order.refundId = refund.id;
  order.refundAmount = refund.amount / 100;
  order.refundedAt = new Date();
  order.paymentStatus = "refunded";
  order.escrowStatus = "refunded";
  await order.save();
}

async function handlePayoutProcessed(payout) {
  const referenceId = payout.reference_id;
  const editorId = referenceId?.split("_")[1];
  
  // Update editor earnings
  if (editorId) {
    await User.findByIdAndUpdate(editorId, {
      $inc: { totalWithdrawn: payout.amount / 100 },
    });
  }
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
    const order = await Order.findById(orderId).populate("editor");
    if (!order) throw new Error("Order not found");

    if (order.escrowStatus !== "held") {
      throw new Error("Payment not in escrow");
    }

    const editor = order.editor;
    
    // Check if editor has linked bank account
    if (!editor.razorpayFundAccountId) {
      // Hold release until KYC complete
      console.warn(`⚠️  Editor ${editor._id} needs KYC for payout`);
      
      // Update editor pending payout
      await User.findByIdAndUpdate(editor._id, {
        $inc: { pendingPayout: order.editorEarning },
      });
      
      order.payoutStatus = "pending";
      await order.save();
      
      return { success: true, status: "pending_kyc" };
    }

    // Create payout
    const provider = new RazorpayProvider();
    const payout = await provider.createPayout(editor, order.editorEarning);

    // Update order
    order.razorpayPayoutId = payout.payoutId;
    order.payoutStatus = "processing";
    order.payoutAmount = order.editorEarning;
    order.escrowStatus = "released";
    order.escrowReleasedAt = new Date();
    order.paymentStatus = "released";
    await order.save();

    // Update editor earnings
    await User.findByIdAndUpdate(editor._id, {
      $inc: { 
        totalEarnings: order.editorEarning,
      },
    });

    return { success: true, status: "released", payoutId: payout.payoutId };
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
    
    const order = await Order.findById(orderId).populate(["client", "editor"]);
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
    const settings = await SiteSettings.getSettings();
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
