/**
 * Scheduled Jobs - Auto-cancel expired orders, check overdue orders, and other background tasks
 */

import { Order } from "../models/Order.js";
import { Message } from "../models/Message.js";
import { createNotification } from "../controllers/notificationController.js";
import logger from "../utils/logger.js";

/**
 * Cancel orders that are awaiting payment and have expired (24 hours)
 */
export const cancelExpiredOrders = async () => {
  try {
    const now = new Date();
    
    // Find orders that are awaiting_payment and have expired
    const expiredOrders = await Order.find({
      status: "awaiting_payment",
      paymentExpiresAt: { $lte: now },
    }).populate("client editor", "name");

    if (expiredOrders.length === 0) {
      return { cancelled: 0 };
    }

    logger.info(`Found ${expiredOrders.length} expired orders to cancel`);

    for (const order of expiredOrders) {
      // Update order status
      order.status = "cancelled";
      order.cancelledAt = now;
      order.cancellationReason = "Payment not received within 24 hours";
      await order.save();

      // Create cancellation message
      await Message.create({
        order: order._id,
        sender: order.editor._id,
        type: "system",
        content: `❌ Order cancelled. Payment was not received within 24 hours. "${order.title}" has been cancelled automatically.`,
        systemAction: "order_rejected",
      });

      // Notify both parties
      await createNotification({
        recipient: order.client._id,
        type: "warning",
        title: "Order Cancelled",
        message: `Your request "${order.title}" was cancelled due to payment timeout.`,
        link: "/chats",
      });

      await createNotification({
        recipient: order.editor._id,
        type: "info",
        title: "Order Expired",
        message: `Request "${order.title}" cancelled - client didn't pay within 24 hours.`,
        link: "/chats",
      });

      logger.info(`Cancelled expired order: ${order.orderNumber}`);
    }

    return { cancelled: expiredOrders.length };
  } catch (error) {
    logger.error("Error cancelling expired orders:", error);
    throw error;
  }
};

/**
 * Check and mark overdue orders (deadline has passed)
 */
export const checkOverdueOrders = async () => {
  try {
    const now = new Date();
    
    // Find orders that are past deadline but not yet marked overdue
    const overdueOrders = await Order.find({
      deadline: { $lt: now },
      status: { $in: ["accepted", "in_progress"] },
      isOverdue: false,
      overdueRefunded: false,
    }).populate("client editor", "name email");

    if (overdueOrders.length === 0) {
      return { markedOverdue: 0 };
    }

    logger.info(`Found ${overdueOrders.length} overdue orders`);

    for (const order of overdueOrders) {
      // Mark as overdue and set grace period (24 hours)
      order.isOverdue = true;
      order.overdueAt = now;
      order.graceEndsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      order.chatDisabled = true;
      order.chatDisabledReason = "overdue";
      
      await order.save();

      // Create system message
      await Message.create({
        order: order._id,
        sender: null,
        type: "system",
        content: `⚠️ Order is OVERDUE! The deadline has passed. Chat is disabled. A refund will be processed in 24 hours if work is not submitted.`,
        systemAction: "order_overdue",
      });

      // Notify client
      await createNotification({
        recipient: order.client._id,
        type: "warning",
        title: "⚠️ Order Overdue",
        message: `"${order.title}" has passed its deadline. Refund will be processed in 24 hours.`,
        link: `/chat/${order._id}`,
      });

      // Notify editor
      await createNotification({
        recipient: order.editor._id,
        type: "error",
        title: "⚠️ Order Overdue - Submit Now!",
        message: `"${order.title}" is overdue! Submit your work within 24 hours or client will be refunded.`,
        link: `/chat/${order._id}`,
      });

      logger.warn(`Marked order as overdue: ${order.orderNumber}`);
    }

    return { markedOverdue: overdueOrders.length };
  } catch (error) {
    logger.error("Error checking overdue orders:", error);
    throw error;
  }
};

/**
 * Process refunds for overdue orders after grace period
 */
export const processOverdueRefunds = async () => {
  try {
    const now = new Date();
    
    // Find orders where grace period has ended
    const ordersToRefund = await Order.find({
      isOverdue: true,
      graceEndsAt: { $lt: now },
      overdueRefunded: false,
      status: { $in: ["accepted", "in_progress"] },
      escrowStatus: "held",
    }).populate("client editor", "name email");

    if (ordersToRefund.length === 0) {
      return { refunded: 0 };
    }

    logger.info(`Found ${ordersToRefund.length} orders to refund`);

    let refundedCount = 0;

    for (const order of ordersToRefund) {
      try {
        // Process Razorpay refund
        let refundResult = null;
        if (order.razorpayPaymentId) {
          const Razorpay = (await import("razorpay")).default;
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });

          refundResult = await razorpay.payments.refund(order.razorpayPaymentId, {
            amount: order.amount * 100, // Full refund in paise
            speed: "normal",
            notes: {
              reason: "order_overdue",
              orderId: order._id.toString(),
              orderNumber: order.orderNumber,
            },
          });

          order.refundId = refundResult.id;
          logger.info(`Razorpay refund initiated: ${refundResult.id} for ${order.orderNumber}`);
        }

        // Update order status
        order.overdueRefunded = true;
        order.overdueRefundedAt = now;
        order.refundAmount = order.amount;
        order.refundedAt = now;
        order.refundReason = "order_overdue";
        order.paymentStatus = "refunded";
        order.escrowStatus = "refunded";
        order.status = "cancelled";
        order.cancelledAt = now;
        order.cancellationReason = "Order overdue - automatic refund";
        order.chatDisabledReason = "refunded";
        
        await order.save();

        // Create system message
        await Message.create({
          order: order._id,
          sender: null,
          type: "system",
          content: `💸 REFUND PROCESSED: ₹${order.amount} has been refunded to the client due to overdue order. This order is now closed.`,
          systemAction: "order_refunded",
          metadata: {
            refundAmount: order.amount,
            refundId: order.refundId,
            reason: "overdue",
          },
        });

        // Notify client
        await createNotification({
          recipient: order.client._id,
          type: "success",
          title: "💸 Refund Processed",
          message: `₹${order.amount} has been refunded for "${order.title}" (Order Overdue)`,
          link: "/client-orders",
        });

        // Notify editor
        await createNotification({
          recipient: order.editor._id,
          type: "error",
          title: "❌ Order Cancelled - Overdue",
          message: `"${order.title}" was cancelled and refunded due to missed deadline.`,
          link: "/my-orders",
        });

        refundedCount++;
        logger.info(`Overdue refund processed: ${order.orderNumber}, Amount: ₹${order.amount}`);
      } catch (refundError) {
        logger.error(`Refund failed for ${order.orderNumber}: ${refundError.message}`);
      }
    }

    return { refunded: refundedCount };
  } catch (error) {
    logger.error("Error processing overdue refunds:", error);
    throw error;
  }
};

/**
 * Start the scheduled jobs
 * Runs every hour to check for expired orders and overdue orders
 */
export const startScheduledJobs = () => {
  // Run immediately on startup
  cancelExpiredOrders().then(result => {
    if (result.cancelled > 0) {
      logger.info(`Startup: Cancelled ${result.cancelled} expired orders`);
    }
  });

  checkOverdueOrders().then(result => {
    if (result.markedOverdue > 0) {
      logger.info(`Startup: Marked ${result.markedOverdue} orders as overdue`);
    }
  });

  processOverdueRefunds().then(result => {
    if (result.refunded > 0) {
      logger.info(`Startup: Refunded ${result.refunded} overdue orders`);
    }
  });

  // Run every hour
  const HOUR_MS = 60 * 60 * 1000;
  setInterval(async () => {
    try {
      const cancelResult = await cancelExpiredOrders();
      if (cancelResult.cancelled > 0) {
        logger.info(`Scheduled: Cancelled ${cancelResult.cancelled} expired orders`);
      }

      const overdueResult = await checkOverdueOrders();
      if (overdueResult.markedOverdue > 0) {
        logger.info(`Scheduled: Marked ${overdueResult.markedOverdue} orders as overdue`);
      }

      const refundResult = await processOverdueRefunds();
      if (refundResult.refunded > 0) {
        logger.info(`Scheduled: Refunded ${refundResult.refunded} overdue orders`);
      }
    } catch (error) {
      logger.error("Scheduled job error:", error);
    }
  }, HOUR_MS);

  logger.info("✅ Scheduled jobs started (checking expired orders, overdue orders, and refunds every hour)");
};

