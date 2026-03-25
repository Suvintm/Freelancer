import { asyncHandler } from "../middleware/errorHandler.js";
import ContentAccessLog from "../../marketplace/models/ContentAccessLog.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

/**
 * @desc    Accept Content Protection Policy
 * @route   POST /api/user/legal/accept-policy
 * @access  Private
 */
export const acceptContentPolicy = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Assuming we might want to track this in User or just respond success
  // For now, we'll log it and return success
  logger.info(`User ${user._id} accepted content protection policy`);

  res.status(200).json({
    success: true,
    message: "Content protection policy accepted",
  });
});

/**
 * @desc    Log access to external content (e.g. Google Drive)
 * @route   POST /api/user/legal/log-access
 * @access  Private
 */
export const logContentAccess = asyncHandler(async (req, res) => {
  const { orderId, editorId, clientId, agreementVersion } = req.body;

  if (!orderId || !editorId || !clientId) {
    res.status(400);
    throw new Error("Missing required logging fields");
  }

  const log = await ContentAccessLog.create({
    orderId,
    editorId,
    clientId,
    agreementVersion: agreementVersion || "v1.0",
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  logger.info(`Content access logged: Order ${orderId} by Client ${clientId}`);

  res.status(201).json({
    success: true,
    logId: log._id,
  });
});

export default {
  acceptContentPolicy,
  logContentAccess,
};
