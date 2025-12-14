/**
 * Scheduled Jobs - Auto-cancel expired orders and other background tasks
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
 * Start the scheduled jobs
 * Runs every hour to check for expired orders
 */
export const startScheduledJobs = () => {
  // Run immediately on startup
  cancelExpiredOrders().then(result => {
    if (result.cancelled > 0) {
      logger.info(`Startup: Cancelled ${result.cancelled} expired orders`);
    }
  });

  // Run every hour
  const HOUR_MS = 60 * 60 * 1000;
  setInterval(async () => {
    try {
      const result = await cancelExpiredOrders();
      if (result.cancelled > 0) {
        logger.info(`Scheduled: Cancelled ${result.cancelled} expired orders`);
      }
    } catch (error) {
      logger.error("Scheduled job error:", error);
    }
  }, HOUR_MS);

  logger.info("✅ Scheduled jobs started (checking expired orders every hour)");
};
