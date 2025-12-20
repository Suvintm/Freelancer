import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import User from "../models/User.js";
import ContentAccessLog from "../models/ContentAccessLog.js";
import { Message } from "../models/Message.js";

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
  const { orderId, clientId, ipAddress, userAgent, linkTitle } = req.body;
  const editorId = req.user._id;

  if (!orderId || !clientId) {
      res.status(400);
      throw new Error("Order ID and Client ID are required for logging");
  }

  // Check if this is the first time accessing
  const previousAccess = await ContentAccessLog.findOne({ 
      orderId, 
      editorId 
  });

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

  let newMessage = null;

  // Always create a system message when editor accepts and accesses content
  console.log("🔒 Creating content access message for order:", orderId, "editor:", editorId);
  try {
      const orderObjectId = new mongoose.Types.ObjectId(orderId);
      console.log("📝 Order ObjectId created:", orderObjectId);
      
      newMessage = await Message.create({
          order: orderObjectId,
          sender: editorId,
          type: "system",
          systemAction: "content_accessed",
          content: `${req.user.name} accepted the Content Protection Agreement and accessed: ${linkTitle || "Project Files"}`,
      });
      console.log("✅ System message created successfully! ID:", newMessage._id);
  } catch (msgErr) {
      console.error("❌ Failed to create system message:", msgErr.message);
      console.error("Full error:", msgErr);
  }

  res.status(200).json({ 
      success: true, 
      message: "Access logged",
      newMessage
  });
});
