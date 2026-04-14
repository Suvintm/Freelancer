import logger from "../../../utils/logger.js";
import * as youtubeVerificationService from "../services/youtubeVerificationService.js";

/**
 * PRODUCTION-GRADE YOUTUBE CREATOR CONTROLLER
 * Orchestrates verification and channel linking logic.
 */

/**
 * Handle request to start manual verification
 */
export const initiateManualVerification = async (req, res, next) => {
  try {
    const { channelUrl } = req.body;
    const userId = req.user.id;

    logger.info(`🎬 [CONTROLLER] Initiating manual verification for URL: ${channelUrl}`);

    const result = await youtubeVerificationService.initiateVerification(userId, channelUrl);

    res.status(200).json({
      success: true,
      message: "Verification initiated. Please add the code to your bio.",
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
    const { requestId } = req.body;
    const userId = req.user.id;

    logger.info(`🔍 [CONTROLLER] Checking verification status for request: ${requestId}`);

    const result = await youtubeVerificationService.verifyChannel(userId, requestId);

    res.status(200).json({
      success: true,
      message: "Verification check complete.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
