/**
 * Final Delivery Controller - Handles secure work submission and delivery (Prisma/PostgreSQL)
 */
import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import { getIO } from "../../../socket.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";
import { recalculateEditorScore } from "../../user/controllers/suvixScoreController.js";
import logger from "../../../utils/logger.js";

const generateDownloadToken = () => crypto.randomBytes(32).toString("hex");

const getWatermarkText = (order, editorName) => {
  return `SUVIX | #${order.order_number} | ${editorName}`;
};

const mapMessage = (m) => {
  if (!m) return null;
  return { ...m, _id: m.id, order: m.order_id, sender: m.sender_id };
};

// ============ UPLOAD FINAL DELIVERY ============
export const uploadFinalDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const file = req.file;
  const userId = req.user.id;

  if (!file) throw new ApiError(400, "No file uploaded");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { client: { select: { id: true, name: true, email: true } }, editor: { select: { id: true, name: true, email: true } } }
  });

  if (!order) throw new ApiError(404, "Order not found");
  if (order.editor_id !== userId) throw new ApiError(403, "Only the editor can upload");
  if (!["accepted", "in_progress", "submitted"].includes(order.status)) {
    throw new ApiError(400, "Invalid order status for delivery");
  }

  const isVideo = file.mimetype.startsWith("video/");
  const isImage = file.mimetype.startsWith("image/");
  if (!isVideo && !isImage) throw new ApiError(400, "Invalid file type");

  // Original upload
  const b64 = Buffer.from(file.buffer).toString("base64");
  const dataURI = `data:${file.mimetype};base64,${b64}`;
  const originalUpload = await cloudinary.uploader.upload(dataURI, {
    resource_type: isVideo ? "video" : "image",
    folder: "suvix/final_deliveries/original",
  });

  const watermarkText = getWatermarkText(order, req.user.name);
  let watermarkedUrl = originalUpload.secure_url;

  if (isVideo) {
    watermarkedUrl = cloudinary.url(originalUpload.public_id, {
      resource_type: "video",
      transformation: [
        { overlay: { font_family: "Arial", font_size: 40, font_weight: "bold", text: watermarkText }, color: "#FFFFFF", opacity: 60, gravity: "center" }
      ]
    });
  } else {
    watermarkedUrl = cloudinary.url(originalUpload.public_id, {
      transformation: [
        { overlay: { font_family: "Arial", font_size: 60, font_weight: "bold", text: watermarkText }, color: "#FFFFFF", opacity: 50, gravity: "center", angle: 45 }
      ]
    });
  }

  const downloadToken = generateDownloadToken();

  const finalDeliveryData = {
    originalUrl: originalUpload.secure_url,
    watermarkedUrl,
    thumbnailUrl: isVideo ? originalUpload.secure_url.replace(/\.[^/.]+$/, ".jpg") : originalUpload.secure_url,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    duration: originalUpload.duration || null,
    downloadToken,
    tokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "pending"
  };

  const [message, updatedOrder] = await prisma.$transaction([
    prisma.message.create({
      data: {
        order_id: orderId,
        sender_id: userId,
        type: "final_delivery",
        content: `Editor has submitted the final work: ${file.originalname}`,
        final_delivery: finalDeliveryData,
        delivered: true,
        delivered_at: new Date(),
        system_action: "work_submitted"
      },
      include: { sender: { select: { id: true, name: true, profile_picture: true } } }
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "submitted", submitted_at: new Date(), delivery_status: "pending" }
    })
  ]);

  const io = getIO();
  if (io) {
    io.to(`order_${orderId}`).emit("order_updated", { orderId, status: "submitted", deliveryMessageId: message.id });
    io.to(`order_${orderId}`).emit("message_new", { ...message, _id: message.id, order: message.order_id });
  }

  await createNotification({
    recipient: order.client_id,
    sender: userId,
    type: "info",
    title: "📦 Final Delivery Submitted",
    message: `Editor has submitted the work for "${order.title}"`,
    link: `/chat/${orderId}`
  });

  res.status(201).json({ success: true, message: "Final delivery uploaded successfully" });
});

// ============ ACCEPT DELIVERY ============
export const acceptDelivery = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) throw new ApiError(404, "Order not found");
    if (order.client_id !== userId) throw new ApiError(403, "Not authorized");
    if (order.status !== "submitted") throw new ApiError(400, "No submission to accept");

    await prisma.$transaction(async (tx) => {
        await tx.order.update({
            where: { id: orderId },
            data: { status: "completed", completed_at: new Date(), payment_status: "released" }
        });

        // Release payment locally (WalletTransaction)
        await tx.walletTransaction.create({
            data: {
                user_id: order.editor_id,
                amount: order.editor_earning,
                type: "credit",
                status: "completed",
                reference_id: order.id,
                reference_type: "order_payout",
                description: `Payout for order #${order.order_number}`
            }
        });

        await tx.message.create({
            data: {
                order_id: orderId,
                sender_id: userId,
                type: "system",
                content: "Client has accepted the final delivery. Order completed and payment released.",
                system_action: "work_completed"
            }
        });
    });

    await createNotification({
        recipient: order.editor_id,
        type: "success",
        title: "Order Completed",
        message: `Client accepted "${order.title}". Payment of ₹${order.editor_earning} released.`,
        link: `/chat/${orderId}`
    });

    // Fire-and-forget score recalculation
    recalculateEditorScore(order.editor_id).catch(err => logger.error("Score recalc error:", err));

    res.status(200).json({ success: true, message: "Delivery accepted and payment released" });
});

// ============ REQUEST CHANGES ============
export const requestChanges = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.client_id !== userId) throw new ApiError(403, "Not authorized");

    await prisma.$transaction([
        prisma.order.update({
            where: { id: orderId },
            data: { status: "in_progress", revision_count: { increment: 1 } }
        }),
        prisma.message.create({
            data: {
                order_id: orderId,
                sender_id: userId,
                type: "text",
                content: `Revision requested: ${message}`,
                system_action: "work_submitted" // Actually revision
            }
        })
    ]);

    await createNotification({
        recipient: order.editor_id,
        type: "warning",
        title: "Revision Requested",
        message: `Client requested changes for "${order.title}"`,
        link: `/chat/${orderId}`
    });

    res.status(200).json({ success: true, message: "Revision requested" });
});

// ============ GET PREVIEW ============
export const getPreview = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
  
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { client: { select: { id: true } } }
    });
  
    if (!order) throw new ApiError(404, "Order not found");
    if (order.client_id !== userId) throw new ApiError(403, "Not authorized");
  
    const message = await prisma.message.findFirst({
        where: { order_id: orderId, type: "final_delivery" },
        orderBy: { created_at: 'desc' }
    });
  
    if (!message || !message.final_delivery) throw new ApiError(404, "No delivery found");
  
    res.json({
      success: true,
      preview: message.final_delivery
    });
});

// ============ GET DELIVERY STATUS ============
export const getDeliveryStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
  
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ApiError(404, "Order not found");
  
    if (order.client_id !== userId && order.editor_id !== userId) {
      throw new ApiError(403, "Not authorized");
    }
  
    const message = await prisma.message.findFirst({
        where: { order_id: orderId, type: "final_delivery" },
        orderBy: { created_at: 'desc' }
    });
  
    res.json({
      success: true,
      orderStatus: order.status,
      deliveryStatus: order.delivery_status,
      delivery: message ? message.final_delivery : null
    });
});

// ============ CONFIRM DOWNLOAD ============
export const confirmDownload = asyncHandler(async (req, res) => {
    res.json({ success: true, message: "Download confirmed (stub)" });
});
