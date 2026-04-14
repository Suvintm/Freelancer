import logger from "../../../utils/logger.js";
import * as youtubeVerificationService from "../services/youtubeVerificationService.js";
import { ApiError } from "../../../middleware/errorHandler.js";
import prisma from "../../../config/prisma.js";

/**
 * PRODUCTION-GRADE YOUTUBE CREATOR CONTROLLER
 * Orchestrates verification and channel linking logic.
 */

/**
 * Fetch all subcategories for YouTube Creators (yt_influencer)
 */
export const getYoutubeSubCategories = async (req, res, next) => {
  try {
    const subCategories = await prisma.roleSubCategory.findMany({
      where: {
        category: {
          slug: "yt_influencer",
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: subCategories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle request to start manual verification
 */
export const initiateManualVerification = async (req, res, next) => {
  try {
    const { channelInput, subCategoryId, language } = req.body;
    const userId = req.user.id;

    if (!channelInput) {
      throw new ApiError(400, "Channel handle or URL is required.");
    }

    logger.info(`🎬 [CONTROLLER] Initiating manual verification for channel: ${channelInput}`);

    const result = await youtubeVerificationService.initiateVerification(userId, channelInput, {
      subCategoryId,
      language
    });

    res.status(200).json({
      success: true,
      message: "Verification initiated. Please add the code to your channel description.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle request to check verification status
 */
export const checkManualVerification = async (req, res, next) => {
  try {
    const { channelInput, token } = req.body;
    const userId = req.user.id;

    if (!channelInput || !token) {
      throw new ApiError(400, "Channel handle/ID and the verification token are required.");
    }

    logger.info(`🔍 [CONTROLLER] Checking verification for channel: ${channelInput}`);

    const result = await youtubeVerificationService.verifyChannel(userId, channelInput, { token });

    res.status(200).json({
      success: true,
      message: "Channel successfully verified and linked!",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle token regeneration request
 */
export const regenerateManualVerification = async (req, res, next) => {
  try {
    const { channelInput } = req.body;
    const userId = req.user.id;

    if (!channelInput) {
      throw new ApiError(400, "Channel handle/ID is required to regenerate a token.");
    }

    logger.info(`🔄 [CONTROLLER] Regenerating token for channel: ${channelInput}`);

    const result = await youtubeVerificationService.initiateVerification(userId, channelInput);

    res.status(200).json({
      success: true,
      message: "New verification token generated.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
