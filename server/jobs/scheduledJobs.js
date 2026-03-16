/**
 * Scheduled Jobs - Auto-cancel expired orders, check overdue orders, and other background tasks
 */

import { Order } from "../models/Order.js";
import { Message } from "../models/Message.js";
import FinalOutput from "../models/FinalOutput.js";
import { createNotification } from "../controllers/notificationController.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { deleteFromCloudinary } from "../utils/cloudinaryStorage.js";
import logger from "../utils/logger.js";
import mongoose from "mongoose";

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

    // Dynamically import the auto-refund function from refundController
    const { autoRefundOrder } = await import("../controllers/refundController.js");

    let refundedCount = 0;

    for (const order of ordersToRefund) {
      try {
        // Route through the Refund model for proper audit trail & retry logic
        const refund = await autoRefundOrder(order._id, "order_overdue");

        // Update order status regardless of refund outcome
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
        
        if (refund) {
          order.refundId = refund.razorpayRefundId || refund._id?.toString();
        }
        
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
        logger.info(`Overdue refund processed via Refund model: ${order.orderNumber}, Amount: ₹${order.amount}`);
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
 * Cleanup expired final outputs - delete original files from R2 but keep thumbnails
 * This saves storage costs by removing large files after the 24-hour download window
 */
export const cleanupExpiredFinalOutputs = async () => {
  try {
    const now = new Date();

    // Find expired but not yet cleaned up outputs
    const expiredOutputs = await FinalOutput.find({
      expiresAt: { $lt: now },
      isExpired: false,
      originalDeleted: false,
      status: { $in: ["approved", "downloaded"] },
    });

    if (expiredOutputs.length === 0) {
      return { cleaned: 0 };
    }

    logger.info(`Found ${expiredOutputs.length} expired final outputs to clean up`);

    let cleanedCount = 0;
    const errors = [];

    for (const output of expiredOutputs) {
      try {
        // Determine resource type for Cloudinary
        const resourceType = output.type === "photo" ? "image" : "video";
        
        // Delete original file from Cloudinary (large file)
        if (output.r2Key) {
          const deleted = await deleteFromCloudinary(output.r2Key, resourceType);
          if (deleted) {
            logger.info(`Deleted original file: ${output.r2Key}`);
          }
        }

        // Delete preview if exists (medium file)
        if (output.previewKey) {
          await deleteFromCloudinary(output.previewKey, resourceType);
        }

        // Keep thumbnail for records (small file - not deleted)
        // thumbnailKey is preserved

        // Mark as cleaned
        output.isExpired = true;
        output.originalDeleted = true;
        output.status = "expired";
        await output.save();

        cleanedCount++;
      } catch (error) {
        errors.push({ id: output._id, error: error.message });
        logger.error(`Failed to cleanup output ${output._id}: ${error.message}`);
      }
    }

    return { cleaned: cleanedCount, total: expiredOutputs.length, errors: errors.length > 0 ? errors : undefined };
  } catch (error) {
    logger.error("Error cleaning up expired final outputs:", error);
    return { cleaned: 0, error: error.message };
  }
};

/**
 * Process wallet clearance - Move funds from pendingBalance to walletBalance after 7 days
 */
export const processWalletClearance = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const now = new Date();
    
    // Find transactions ready for clearance
    const pendingTransactions = await WalletTransaction.find({
      status: "pending_clearance",
      clearanceDate: { $lte: now },
    }).session(session);

    if (pendingTransactions.length === 0) {
      await session.commitTransaction();
      session.endSession();
      return { cleared: 0 };
    }

    logger.info(`Found ${pendingTransactions.length} wallet transactions ready for clearance`);

    let clearedCount = 0;

    for (const txn of pendingTransactions) {
      const user = await User.findById(txn.user).session(session);
      if (!user) {
        logger.error(`User ${txn.user} not found for wallet clearance txn ${txn._id}`);
        continue;
      }

      const amount = txn.amount;
      const balanceBefore = user.walletBalance || 0;

      // Atomic Balance Update
      user.pendingBalance = Math.max(0, (user.pendingBalance || 0) - amount);
      user.walletBalance = (user.walletBalance || 0) + amount;
      await user.save({ session });

      // Update Transaction status
      txn.status = "cleared";
      txn.clearedAt = now;
      txn.balanceBefore = balanceBefore;
      txn.balanceAfter = user.walletBalance;
      await txn.save({ session });

      clearedCount++;
      logger.info(`Cleared ₹${amount} for user ${user._id} (Txn: ${txn._id})`);
    }

    await session.commitTransaction();
    session.endSession();
    
    return { cleared: clearedCount };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    logger.error("Error processing wallet clearance:", error);
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

  // Cleanup expired final outputs on startup
  cleanupExpiredFinalOutputs().then(result => {
    if (result.cleaned > 0) {
      logger.info(`Startup: Cleaned up ${result.cleaned} expired final outputs`);
    }
  });
  
  processWalletClearance().then(result => {
    if (result.cleared > 0) {
      logger.info(`Startup: Cleared ${result.cleared} wallet transactions`);
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

      // Cleanup expired final outputs (delete original files from R2)
      const cleanupResult = await cleanupExpiredFinalOutputs();
      if (cleanupResult.cleaned > 0) {
        logger.info(`Scheduled: Cleaned up ${cleanupResult.cleaned} expired final outputs from R2`);
      }

      const clearanceResult = await processWalletClearance();
      if (clearanceResult.cleared > 0) {
        logger.info(`Scheduled: Cleared ${clearanceResult.cleared} wallet transactions`);
      }
    } catch (error) {
      logger.error("Scheduled job error:", error);
    }
  }, HOUR_MS);

  logger.info("✅ Scheduled jobs started (checking expired orders, overdue orders, refunds, and final output cleanup every hour)");
};

