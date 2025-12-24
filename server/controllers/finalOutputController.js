/**
 * Final Output Controller
 * 
 * Handles editor final output submissions and client downloads
 * with 24-hour expiry and auto-cleanup support
 * 
 * Uses Cloudinary for file storage - FULL QUALITY downloads!
 */

import asyncHandler from "express-async-handler";
import FinalOutput from "../models/FinalOutput.js";
import Order from "../models/Order.js";
import Message from "../models/Message.js";
import { createNotification } from "./notificationController.js";
import {
  generatePublicId,
  getUploadSignature,
  getDownloadUrl,
  getThumbnailUrl,
  getPreviewUrl,
  deleteFromCloudinary,
  getContentType,
  getFileType,
  getFormat,
} from "../utils/cloudinaryStorage.js";

/**
 * @desc    Get Cloudinary upload signature for final output
 * @route   POST /api/final-output/upload-url
 * @access  Private (Editor only)
 */
export const getUploadUrlForOutput = asyncHandler(async (req, res) => {
  const { orderId, filename, contentType, fileSize } = req.body;

  // Validate input
  if (!orderId || !filename) {
    res.status(400);
    throw new Error("Order ID and filename are required");
  }

  // Check order exists and user is the editor
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.editor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the assigned editor can upload final output");
  }

  // Validate order status
  if (!["accepted", "in_progress"].includes(order.status)) {
    res.status(400);
    throw new Error("Order must be in progress to upload final output");
  }

  // Determine file type
  const fileType = getFileType(filename);
  if (!fileType) {
    res.status(400);
    throw new Error("Unsupported file type. Allowed: video, photo, audio");
  }

  // Generate public ID for Cloudinary
  const publicId = generatePublicId(orderId, fileType, filename);
  const format = getFormat(filename);
  
  // Get Cloudinary upload signature for direct browser upload
  const signatureData = getUploadSignature(publicId, fileType);

  res.json({
    success: true,
    ...signatureData,
    fileType,
    format,
    uploadEndpoint: `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/${signatureData.resourceType}/upload`,
  });
});

/**
 * @desc    Create final output record after upload
 * @route   POST /api/final-output/:orderId
 * @access  Private (Editor only)
 */
export const createFinalOutput = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const {
    r2Key,
    filename,
    originalName,
    mimeType,
    fileSize,
    resolution,
    aspectRatio,
    duration,
    codec,
    bitrate,
    frameRate,
    thumbnailKey,
    editorNotes,
  } = req.body;

  // Validate - accept both r2Key (legacy) and storageKey
  const fileKey = req.body.storageKey || req.body.r2Key;
  if (!fileKey || !filename || !fileSize) {
    res.status(400);
    throw new Error("Missing required fields: storageKey, filename, fileSize");
  }

  const order = await Order.findById(orderId).populate("client", "name");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.editor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the assigned editor can submit final output");
  }

  // Mark any previous outputs as not latest
  await FinalOutput.updateMany(
    { order: orderId, isLatest: true },
    { $set: { isLatest: false } }
  );

  // Get version number
  const previousCount = await FinalOutput.countDocuments({ order: orderId });

  // Determine file type
  const type = getFileType(filename);

  // Create final output record
  const finalOutput = await FinalOutput.create({
    order: orderId,
    uploadedBy: req.user._id,
    type,
    filename,
    originalName: originalName || filename,
    mimeType,
    fileSize,
    resolution,
    aspectRatio,
    duration,
    codec,
    bitrate,
    frameRate,
    r2Key: fileKey,
    thumbnailKey,
    editorNotes,
    version: previousCount + 1,
    isLatest: true,
  });

  // Create system message in chat
  await Message.create({
    order: orderId,
    sender: req.user._id,
    type: "final_output",
    content: `📦 Final Output Submitted (v${finalOutput.version})`,
    metadata: {
      finalOutputId: finalOutput._id,
      fileType: type,
      filename: originalName || filename,
      fileSize,
      resolution,
      duration,
    },
  });

  // Update order status to submitted
  order.status = "submitted";
  order.lastDeliveryAt = new Date();
  await order.save();

  // Notify client
  await createNotification({
    user: order.client._id,
    type: "final_output",
    title: "Final Output Ready",
    message: `Your editor has submitted the final output for "${order.title}"`,
    link: `/chat/${orderId}`,
    metadata: { orderId, finalOutputId: finalOutput._id },
  });

  res.status(201).json({
    success: true,
    finalOutput,
    message: "Final output submitted successfully",
  });
});

/**
 * @desc    Get final output details
 * @route   GET /api/final-output/:id
 * @access  Private (Order parties)
 */
export const getFinalOutput = asyncHandler(async (req, res) => {
  const output = await FinalOutput.findById(req.params.id)
    .populate("uploadedBy", "name profilePicture")
    .populate("order", "client editor title");

  if (!output) {
    res.status(404);
    throw new Error("Final output not found");
  }

  // Check access
  const order = output.order;
  const isClient = order.client.toString() === req.user._id.toString();
  const isEditor = order.editor.toString() === req.user._id.toString();

  if (!isClient && !isEditor) {
    res.status(403);
    throw new Error("Access denied");
  }

  res.json({
    success: true,
    output,
    isClient,
    isEditor,
  });
});

/**
 * @desc    Client approves final output
 * @route   POST /api/final-output/:id/approve
 * @access  Private (Client only)
 */
export const approveFinalOutput = asyncHandler(async (req, res) => {
  const output = await FinalOutput.findById(req.params.id).populate("order");

  if (!output) {
    res.status(404);
    throw new Error("Final output not found");
  }

  const order = output.order;
  if (order.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the client can approve");
  }

  if (output.status !== "pending") {
    res.status(400);
    throw new Error(`Cannot approve output with status: ${output.status}`);
  }

  // Approve and set 24-hour expiry
  output.status = "approved";
  output.approvedAt = new Date();
  output.approvedBy = req.user._id;
  output.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await output.save();

  // Create system message
  await Message.create({
    order: order._id,
    sender: req.user._id,
    type: "system",
    content: `✅ Final output approved! Download available for 24 hours.`,
  });

  // Notify editor
  await createNotification({
    user: order.editor,
    type: "output_approved",
    title: "Output Approved!",
    message: `Client approved your final output for "${order.title}"`,
    link: `/chat/${order._id}`,
  });

  res.json({
    success: true,
    output,
    message: "Output approved. Download available for 24 hours.",
    expiresAt: output.expiresAt,
  });
});

/**
 * @desc    Client rejects final output with reason
 * @route   POST /api/final-output/:id/reject
 * @access  Private (Client only)
 */
export const rejectFinalOutput = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason || reason.trim().length < 10) {
    res.status(400);
    throw new Error("Please provide a detailed rejection reason (min 10 chars)");
  }

  const output = await FinalOutput.findById(req.params.id).populate("order");

  if (!output) {
    res.status(404);
    throw new Error("Final output not found");
  }

  const order = output.order;
  if (order.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the client can reject");
  }

  if (output.status !== "pending") {
    res.status(400);
    throw new Error(`Cannot reject output with status: ${output.status}`);
  }

  // Reject
  output.status = "rejected";
  output.rejectedAt = new Date();
  output.rejectedBy = req.user._id;
  output.rejectionReason = reason;
  await output.save();

  // Update order back to in_progress
  await Order.findByIdAndUpdate(order._id, { status: "in_progress" });

  // Create system message
  await Message.create({
    order: order._id,
    sender: req.user._id,
    type: "system",
    content: `❌ Final output rejected: "${reason}"`,
  });

  // Notify editor
  await createNotification({
    user: order.editor,
    type: "output_rejected",
    title: "Revision Requested",
    message: `Client requested changes: "${reason.substring(0, 50)}..."`,
    link: `/chat/${order._id}`,
  });

  res.json({
    success: true,
    output,
    message: "Output rejected. Editor has been notified.",
  });
});

/**
 * @desc    Get signed download URL for original file
 * @route   GET /api/final-output/:id/download-url
 * @access  Private (Client only, after approval)
 */
export const getDownloadUrlForOutput = asyncHandler(async (req, res) => {
  const output = await FinalOutput.findById(req.params.id).populate("order");

  if (!output) {
    res.status(404);
    throw new Error("Final output not found");
  }

  const order = output.order;
  if (order.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the client can download");
  }

  // Check status
  if (output.status === "pending") {
    res.status(400);
    throw new Error("Please approve the output first");
  }

  if (output.status === "rejected") {
    res.status(400);
    throw new Error("This output was rejected");
  }

  if (output.isExpired || output.originalDeleted) {
    res.status(410);
    throw new Error("Download link has expired. The original file has been removed.");
  }

  // Check expiry
  if (output.expiresAt && new Date() > new Date(output.expiresAt)) {
    output.isExpired = true;
    await output.save();
    res.status(410);
    throw new Error("Download link has expired (24-hour limit).");
  }

  // Generate Cloudinary signed download URL (FULL QUALITY - no compression!)
  const remainingMs = new Date(output.expiresAt) - new Date();
  const expiresInSec = Math.min(Math.floor(remainingMs / 1000), 3600); // Max 1 hour in seconds
  
  // Get resource type for Cloudinary
  const resourceType = output.type === "photo" ? "image" : "video";
  const format = output.mimeType?.split("/")[1] || "mp4";
  
  // Generate download URL - forces download, keeps original quality
  const downloadUrl = getDownloadUrl(output.r2Key, resourceType, format, expiresInSec);

  // Track download
  output.downloadCount += 1;
  output.downloads.push({
    downloadedAt: new Date(),
    downloadedBy: req.user._id,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  if (output.status === "approved") {
    output.status = "downloaded";
  }
  await output.save();

  res.json({
    success: true,
    downloadUrl,
    expiresIn: expiresInSec,
    hoursRemaining: output.hoursUntilExpiry,
    filename: output.originalName || output.filename,
  });
});

/**
 * @desc    Get latest final output for an order
 * @route   GET /api/final-output/order/:orderId/latest
 * @access  Private (Order parties)
 */
export const getLatestOutputForOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isParty =
    order.client.toString() === req.user._id.toString() ||
    order.editor.toString() === req.user._id.toString();

  if (!isParty) {
    res.status(403);
    throw new Error("Access denied");
  }

  const output = await FinalOutput.findOne({
    order: req.params.orderId,
    isLatest: true,
  }).populate("uploadedBy", "name profilePicture");

  res.json({
    success: true,
    output,
    hasOutput: !!output,
  });
});

/**
 * @desc    Cleanup expired outputs (delete original files from Cloudinary)
 * @route   POST /api/final-output/cleanup (internal/cron)
 * @access  Private (System only)
 */
export const cleanupExpiredOutputs = asyncHandler(async (req, res) => {
  const now = new Date();

  // Find expired but not yet cleaned up outputs
  const expiredOutputs = await FinalOutput.find({
    expiresAt: { $lt: now },
    isExpired: false,
    originalDeleted: false,
    status: { $in: ["approved", "downloaded"] },
  });

  let cleaned = 0;
  const errors = [];

  for (const output of expiredOutputs) {
    try {
      // Determine resource type for Cloudinary
      const resourceType = output.type === "photo" ? "image" : "video";
      
      // Delete original file from Cloudinary
      if (output.r2Key) {
        await deleteFromCloudinary(output.r2Key, resourceType);
      }

      // Delete preview if exists
      if (output.previewKey) {
        await deleteFromCloudinary(output.previewKey, resourceType);
      }

      // Keep thumbnail for records - NOT deleted
      // (thumbnailKey is preserved for order history)

      // Mark as cleaned
      output.isExpired = true;
      output.originalDeleted = true;
      output.status = "expired";
      await output.save();

      cleaned++;
    } catch (error) {
      errors.push({ id: output._id, error: error.message });
    }
  }

  const result = {
    success: true,
    cleaned,
    total: expiredOutputs.length,
    errors: errors.length > 0 ? errors : undefined,
  };

  // If called via HTTP, respond
  if (res) {
    res.json(result);
  }

  return result;
});

export default {
  getUploadUrlForOutput,
  createFinalOutput,
  getFinalOutput,
  approveFinalOutput,
  rejectFinalOutput,
  getDownloadUrlForOutput,
  getLatestOutputForOrder,
  cleanupExpiredOutputs,
};
