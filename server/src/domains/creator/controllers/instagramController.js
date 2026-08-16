import prisma from "../../../infrastructure/database/postgres.js";
import logger from "../../../infrastructure/monitoring/logger.js";
import { ApiError } from "../../../shared/kernel/errors.js";
import { persistInstagramContent } from "../services/instagramSyncService.js";

/**
 * 📸 INSTAGRAM CONTROLLER
 * Handles all Instagram creator account operations, manual sync, and posts retrieval.
 */

/**
 * Trigger a manual inline Instagram sync from the frontend (bypassing BullMQ)
 */
export const manualSyncInstagram = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const igAccounts = await prisma.instagramAccount.findMany({
      where: { userId },
    });

    if (!igAccounts || igAccounts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No Instagram accounts found to sync.",
        data: { processed: 0, total: 0 },
      });
    }

    logger.info(
      `✨ [INSTA-CONTROLLER] Starting manual foreground sync for ${igAccounts.length} account(s) for user ${userId}`
    );

    for (const acc of igAccounts) {
      await persistInstagramContent(userId, acc, "manual_foreground");
    }

    logger.info(
      `✅ [INSTA-CONTROLLER] Manual foreground Instagram sync completed for user ${userId}.`
    );

    res.status(200).json({
      success: true,
      message: "Instagram sync completed successfully",
      data: { processed: igAccounts.length, total: igAccounts.length },
    });
  } catch (error) {
    logger.error(`❌ [INSTA-CONTROLLER] Manual sync failed: ${error.message}`);
    next(error);
  }
};

/**
 * Get all connected Instagram accounts for current user
 */
export const getInstagramAccounts = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const accounts = await prisma.instagramAccount.findMany({
      where: { userId },
      include: {
        posts: {
          orderBy: { timestamp: "desc" },
          take: 15,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    logger.error(`❌ [INSTA-CONTROLLER] Failed to fetch accounts: ${error.message}`);
    next(error);
  }
};

/**
 * Get Instagram posts for a creator
 */
export const getInstagramPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const posts = await prisma.instagramPost.findMany({
      where: { userId: userId || req.user.id },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    logger.error(`❌ [INSTA-CONTROLLER] Failed to fetch posts: ${error.message}`);
    next(error);
  }
};

/**
 * Disconnect an Instagram account
 */
export const deleteInstagramAccount = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;

    const account = await prisma.instagramAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new ApiError(404, "Instagram account not found or unauthorized.");
    }

    await prisma.instagramAccount.delete({
      where: { id: accountId },
    });

    res.status(200).json({
      success: true,
      message: "Instagram account removed successfully",
    });
  } catch (error) {
    logger.error(`❌ [INSTA-CONTROLLER] Failed to delete account: ${error.message}`);
    next(error);
  }
};

export default {
  manualSyncInstagram,
  getInstagramAccounts,
  getInstagramPosts,
  deleteInstagramAccount,
};
