import User from "../models/User.js";
import ContentAccessLog from "../models/ContentAccessLog.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// @desc    Accept Content Protection Policy
// @route   POST /api/user/legal/accept-policy
// @access  Private (Editor)
export const acceptContentPolicy = asyncHandler(async (req, res) => {
  const { ipAddress, agreementVersion = "v1.0" } = req.body;
  const userId = req.user._id;

  // Update User
  const user = await User.findByIdAndUpdate(
    userId,
    {
      legalAcceptance: {
        contentPolicyAccepted: true,
        acceptedAt: new Date(),
        agreementVersion,
        ipAddress: ipAddress || req.ip,
      },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "Policy accepted successfully",
    legalAcceptance: user.legalAcceptance,
  });
});

// @desc    Log access to drive link (Audit trail)
// @route   POST /api/user/legal/log-access
// @access  Private (Editor)
export const logContentAccess = asyncHandler(async (req, res) => {
  const { orderId, clientId, ipAddress, userAgent } = req.body;
  const editorId = req.user._id;

  if (!orderId || !clientId) {
      res.status(400);
      throw new Error("Order ID and Client ID are required for logging");
  }

  // Create Log Entry
  await ContentAccessLog.create({
    orderId,
    editorId,
    clientId,
    action: "DRIVE_ACCESS_GRANTED",
    ipAddress: ipAddress || req.ip,
    userAgent: userAgent || req.get("User-Agent"),
    agreementVersion: req.user.legalAcceptance?.agreementVersion || "v1.0",
  });

  res.status(200).json({ success: true, message: "Access logged" });
});
