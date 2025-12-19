// finalDeliveryController.js - Handle secure final video delivery
import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import { Order } from "../models/Order.js";
import {Message} from "../models/Message.js";
import { Payment } from "../models/Payment.js";
import { Rating } from "../models/Rating.js";
import { ApiError } from "../middleware/errorHandler.js";
import { getIO } from "../socket.js";
import { createNotification } from "./notificationController.js";

// Generate a secure download token
const generateDownloadToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate watermark text
const getWatermarkText = (order, editor) => {
  return `SUVIX | #${order.orderNumber} | ${editor.name}`;
};

/**
 * 📤 Upload Final Delivery (Editor Only)
 * POST /api/delivery/:orderId/upload
 */
export const uploadFinalDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const file = req.file;

  if (!file) {
    throw new ApiError(400, "No file uploaded");
  }

  const order = await Order.findById(orderId)
    .populate("client", "name email")
    .populate("editor", "name email");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only editor can upload final delivery
  if (order.editor._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the editor can upload final delivery");
  }

  // Check if order is in valid state
  if (!["accepted", "in_progress", "submitted"].includes(order.status)) {
    throw new ApiError(400, "Order must be in progress to submit final delivery");
  }

  // Determine file type
  const isVideo = file.mimetype.startsWith("video/");
  const isImage = file.mimetype.startsWith("image/");

  if (!isVideo && !isImage) {
    throw new ApiError(400, "Only video and image files are allowed for final delivery");
  }

  // Upload ORIGINAL to Cloudinary (without watermark)
  const resourceType = isVideo ? "video" : "image";
  
  const originalUpload = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: "suvix/final_deliveries/original",
        public_id: `${orderId}_${Date.now()}_original`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(file.buffer);
  });

  // Create WATERMARKED version using Cloudinary transformations
  const watermarkText = getWatermarkText(order, req.user);
  let watermarkedUrl;

  if (isVideo) {
    // Video watermark using text overlay
    watermarkedUrl = cloudinary.url(originalUpload.public_id, {
      resource_type: "video",
      transformation: [
        {
          overlay: {
            font_family: "Arial",
            font_size: 40,
            font_weight: "bold",
            text: watermarkText,
          },
          color: "#FFFFFF",
          opacity: 60,
          gravity: "center",
          y: 0,
        },
        {
          overlay: {
            font_family: "Arial",
            font_size: 40,
            font_weight: "bold",
            text: watermarkText,
          },
          color: "#FFFFFF",
          opacity: 60,
          gravity: "north_west",
          x: 20,
          y: 20,
        },
        {
          overlay: {
            font_family: "Arial",
            font_size: 40,
            font_weight: "bold",
            text: watermarkText,
          },
          color: "#FFFFFF",
          opacity: 60,
          gravity: "south_east",
          x: 20,
          y: 20,
        },
      ],
    });
  } else {
    // Image watermark
    watermarkedUrl = cloudinary.url(originalUpload.public_id, {
      transformation: [
        {
          overlay: {
            font_family: "Arial",
            font_size: 60,
            font_weight: "bold",
            text: watermarkText,
          },
          color: "#FFFFFF",
          opacity: 50,
          gravity: "center",
          angle: -30,
        },
      ],
    });
  }

  // Generate thumbnail
  const thumbnailUrl = isVideo
    ? cloudinary.url(originalUpload.public_id, {
        resource_type: "video",
        transformation: [
          { width: 400, height: 300, crop: "fill" },
          { start_offset: "0" },
        ],
        format: "jpg",
      })
    : cloudinary.url(originalUpload.public_id, {
        transformation: [{ width: 400, height: 300, crop: "fill" }],
      });

  // Generate download token
  const downloadToken = generateDownloadToken();
  const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create message with final delivery
  const message = await Message.create({
    order: orderId,
    sender: req.user._id,
    type: "final_delivery",
    content: "🎬 Final delivery submitted! Please review and accept to download.",
    finalDelivery: {
      originalUrl: originalUpload.secure_url,
      watermarkedUrl: watermarkedUrl,
      thumbnailUrl: thumbnailUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      duration: originalUpload.duration || null,
      downloadToken: downloadToken,
      tokenExpiry: tokenExpiry,
      previewCount: 0,
      maxPreviews: 20,
      status: "pending",
      previewHistory: [],
    },
    delivered: true,
    deliveredAt: new Date(),
  });

  // Update order status
  order.status = "submitted";
  order.submittedAt = new Date();
  order.deliveryStatus = "pending_review";
  order.finalDeliveryMessageId = message._id;
  await order.save();

  const populatedMessage = await Message.findById(message._id).populate(
    "sender",
    "name profilePicture"
  );

  // Emit real-time message
  const io = getIO();
  if (io) {
    io.to(`order_${orderId}`).emit("message:new", {
      ...populatedMessage.toObject(),
      orderId,
      senderName: req.user.name,
    });

    // Emit delivery update
    io.to(`order_${orderId}`).emit("delivery:submitted", {
      orderId,
      messageId: message._id,
    });
  }

  // Notify client
  await createNotification({
    recipient: order.client._id,
    type: "success",
    title: "🎬 Final Video Ready!",
    message: `${req.user.name} has submitted the final delivery for "${order.title}"`,
    link: `/chat/${orderId}`,
  });

  res.status(201).json({
    success: true,
    message: populatedMessage,
  });
});

/**
 * 👁️ Get Preview (Client Only)
 * GET /api/delivery/:orderId/preview
 */
export const getPreview = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId)
    .populate("client", "name email")
    .populate("editor", "name email");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only client can preview
  if (order.client._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the client can preview the delivery");
  }

  if (!order.finalDeliveryMessageId) {
    throw new ApiError(404, "No final delivery found");
  }

  const message = await Message.findById(order.finalDeliveryMessageId);

  if (!message || !message.finalDelivery) {
    throw new ApiError(404, "Final delivery not found");
  }

  const delivery = message.finalDelivery;

  // Check preview limit
  if (delivery.previewCount >= delivery.maxPreviews) {
    throw new ApiError(403, "Preview limit reached. Please accept or request changes.");
  }

  // Increment preview count and log
  message.finalDelivery.previewCount += 1;
  message.finalDelivery.previewHistory.push({
    viewedAt: new Date(),
    ipAddress: req.ip || req.connection.remoteAddress,
  });

  if (delivery.status === "pending") {
    message.finalDelivery.status = "previewed";
  }

  await message.save();

  res.json({
    success: true,
    preview: {
      watermarkedUrl: delivery.watermarkedUrl,
      thumbnailUrl: delivery.thumbnailUrl,
      fileName: delivery.fileName,
      fileSize: delivery.fileSize,
      mimeType: delivery.mimeType,
      duration: delivery.duration,
      previewCount: message.finalDelivery.previewCount,
      maxPreviews: delivery.maxPreviews,
      previewsRemaining: delivery.maxPreviews - message.finalDelivery.previewCount,
    },
  });
});

/**
 * 🔄 Request Changes (Client Only)
 * POST /api/delivery/:orderId/changes
 */
export const requestChanges = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { message: changesMessage } = req.body;

  if (!changesMessage || changesMessage.trim().length < 10) {
    throw new ApiError(400, "Please provide detailed feedback (at least 10 characters)");
  }

  const order = await Order.findById(orderId)
    .populate("client", "name email")
    .populate("editor", "name email");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only client can request changes
  if (order.client._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the client can request changes");
  }

  if (!order.finalDeliveryMessageId) {
    throw new ApiError(404, "No final delivery found");
  }

  const deliveryMessage = await Message.findById(order.finalDeliveryMessageId);

  if (!deliveryMessage || !deliveryMessage.finalDelivery) {
    throw new ApiError(404, "Final delivery not found");
  }

  // Update delivery status
  deliveryMessage.finalDelivery.status = "changes_requested";
  deliveryMessage.finalDelivery.changesRequestedAt = new Date();
  deliveryMessage.finalDelivery.changesMessage = changesMessage;
  await deliveryMessage.save();

  // Update order
  order.deliveryStatus = "changes_requested";
  order.status = "in_progress"; // Back to in_progress for revisions
  await order.save();

  // Create auto-message from client
  const autoMessage = await Message.create({
    order: orderId,
    sender: req.user._id,
    type: "text",
    content: `📝 I've reviewed the delivery and would like some changes:\n\n"${changesMessage}"`,
    delivered: true,
    deliveredAt: new Date(),
  });

  const populatedMessage = await Message.findById(autoMessage._id).populate(
    "sender",
    "name profilePicture"
  );

  // Emit real-time message
  const io = getIO();
  if (io) {
    io.to(`order_${orderId}`).emit("message:new", {
      ...populatedMessage.toObject(),
      orderId,
      senderName: req.user.name,
    });

    io.to(`order_${orderId}`).emit("delivery:changes_requested", {
      orderId,
      changesMessage,
    });
  }

  // Notify editor
  await createNotification({
    recipient: order.editor._id,
    type: "warning",
    title: "📝 Changes Requested",
    message: `${req.user.name} has requested changes for "${order.title}"`,
    link: `/chat/${orderId}`,
  });

  res.json({
    success: true,
    message: "Changes requested successfully",
  });
});

/**
 * ✅ Confirm & Download (Client Only)
 * POST /api/delivery/:orderId/confirm
 */
export const confirmDownload = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { confirmText, token } = req.body;

  // Verify confirmation text
  if (confirmText !== "CONFIRM") {
    throw new ApiError(400, "Please type 'CONFIRM' to proceed with download");
  }

  const order = await Order.findById(orderId)
    .populate("client", "name email")
    .populate("editor", "name email stripeAccountId");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only client can confirm
  if (order.client._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the client can confirm the download");
  }

  if (!order.finalDeliveryMessageId) {
    throw new ApiError(404, "No final delivery found");
  }

  const deliveryMessage = await Message.findById(order.finalDeliveryMessageId);

  if (!deliveryMessage || !deliveryMessage.finalDelivery) {
    throw new ApiError(404, "Final delivery not found");
  }

  const delivery = deliveryMessage.finalDelivery;

  // Verify token
  if (delivery.downloadToken !== token) {
    throw new ApiError(403, "Invalid download token");
  }

  // Check token expiry
  if (new Date() > new Date(delivery.tokenExpiry)) {
    throw new ApiError(403, "Download token has expired. Please contact support.");
  }

  // ⭐ MANDATORY RATING CHECK - Client must rate before downloading
  const existingRating = await Rating.findOne({ order: orderId });
  if (!existingRating) {
    throw new ApiError(400, "Please rate the editor before downloading. Your feedback helps improve our platform!");
  }

  // Update delivery status
  deliveryMessage.finalDelivery.status = "downloaded";
  deliveryMessage.finalDelivery.acceptedAt = new Date();
  deliveryMessage.finalDelivery.downloadedAt = new Date();
  await deliveryMessage.save();

  // Update order status to completed
  order.status = "completed";
  order.completedAt = new Date();
  order.deliveryStatus = "completed";
  order.paymentStatus = "released"; // Release payment from escrow
  await order.save();

  // 💰 Create Payment record for tracking
  const payment = await Payment.create({
    order: orderId,
    client: order.client._id,
    editor: order.editor._id,
    gig: order.gig,
    amount: order.amount,
    platformFee: order.platformFee,
    editorEarning: order.editorEarning,
    type: "escrow_release",
    status: "completed",
    completedAt: new Date(),
    orderSnapshot: {
      orderNumber: order.orderNumber,
      title: order.title,
      description: order.requirements,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      deadline: order.deadline,
    },
  });

  // Emit real-time updates
  const io = getIO();
  if (io) {
    // 🆕 Notify about delivery acceptance (for editor real-time update)
    io.to(`order_${orderId}`).emit("delivery:accepted", {
      orderId,
      messageId: deliveryMessage._id,
      status: "downloaded",
      acceptedAt: deliveryMessage.finalDelivery.acceptedAt,
      clientName: order.client.name,
    });

    io.to(`order_${orderId}`).emit("delivery:completed", {
      orderId,
      completedAt: order.completedAt,
    });

    io.to(`order_${orderId}`).emit("order:completed", {
      orderId,
      paymentReleased: true,
      status: "completed",
    });

    // Emit payment completed event for analytics refresh
    io.to(`order_${orderId}`).emit("payment:completed", {
      paymentId: payment._id,
      orderId,
      amount: payment.amount,
      editorEarning: payment.editorEarning,
    });

    // 🆕 Emit message update for the final delivery card status change
    io.to(`order_${orderId}`).emit("message:updated", {
      messageId: deliveryMessage._id,
      orderId,
      updates: {
        "finalDelivery.status": "downloaded",
        "finalDelivery.acceptedAt": deliveryMessage.finalDelivery.acceptedAt,
        "finalDelivery.downloadedAt": deliveryMessage.finalDelivery.downloadedAt,
      },
    });
  }

  // Notify editor about payment release
  await createNotification({
    recipient: order.editor._id,
    type: "success",
    title: "💰 Payment Released!",
    message: `₹${order.editorEarning} has been released for "${order.title}"`,
    link: `/payments`,
  });

  // Create system message for completion
  await Message.create({
    order: orderId,
    sender: req.user._id,
    type: "system",
    content: `✅ Order completed! Payment of ₹${order.editorEarning} has been released to the editor.`,
    delivered: true,
    deliveredAt: new Date(),
  });

  // 🆕 Generate high-quality download URL with fl_attachment flag
  // This forces the browser to download the file instead of displaying it
  // and ensures no quality loss during download
  let downloadUrl = delivery.originalUrl;
  
  // Add fl_attachment to Cloudinary URL for proper file download
  if (downloadUrl.includes("cloudinary.com")) {
    // Insert fl_attachment transformation
    if (downloadUrl.includes("/upload/")) {
      downloadUrl = downloadUrl.replace("/upload/", "/upload/fl_attachment/");
    }
  }

  res.json({
    success: true,
    downloadUrl: downloadUrl, // High-quality download URL with attachment flag
    originalUrl: delivery.originalUrl, // Fallback URL
    fileName: delivery.fileName, // Original filename for download
    message: "Download successful. Payment has been released to the editor.",
    order: {
      status: order.status,
      completedAt: order.completedAt,
      paymentReleased: true,
      editorEarning: order.editorEarning,
    },
  });
});

/**
 * 📊 Get Delivery Status
 * GET /api/delivery/:orderId/status
 */
export const getDeliveryStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Check if user is part of this order
  const isClient = order.client.toString() === req.user._id.toString();
  const isEditor = order.editor.toString() === req.user._id.toString();

  if (!isClient && !isEditor) {
    throw new ApiError(403, "Not authorized to view this order");
  }

  let deliveryInfo = null;

  if (order.finalDeliveryMessageId) {
    const message = await Message.findById(order.finalDeliveryMessageId);
    if (message && message.finalDelivery) {
      deliveryInfo = {
        status: message.finalDelivery.status,
        previewCount: message.finalDelivery.previewCount,
        maxPreviews: message.finalDelivery.maxPreviews,
        fileName: message.finalDelivery.fileName,
        submittedAt: message.createdAt,
        downloadToken: isClient ? message.finalDelivery.downloadToken : undefined,
      };
    }
  }

  res.json({
    success: true,
    orderStatus: order.status,
    deliveryStatus: order.deliveryStatus,
    delivery: deliveryInfo,
  });
});
