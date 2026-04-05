/**
 * Message Controller - Real-time chat & final delivery (Prisma/PostgreSQL)
 */
import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { v2 as cloudinary } from "cloudinary";
import { getIO } from "../../../socket.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";
import logger from "../../../utils/logger.js";

const mapMessage = (m) => {
  if (!m) return null;
  return { 
    ...m, 
    _id: m.id, 
    order: m.order_id, 
    sender: m.sender_id,
    isDeleted: m.is_deleted,
    isEdited: m.is_edited,
    isStarred: m.is_starred
  };
};

// ============ SEND MESSAGE ============
export const sendMessage = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { content, type, replyTo } = req.body;
  const userId = req.user.id;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, "Order not found");

  const receiverId = order.client_id === userId ? order.editor_id : order.client_id;

  const message = await prisma.message.create({
    data: {
      order_id: orderId,
      sender_id: userId,
      receiver_id: receiverId,
      type: type || "text",
      content: content.trim(),
      reply_to_id: replyTo || null,
      delivered: true,
      delivered_at: new Date(),
    },
    include: { sender: { select: { id: true, name: true, profile_picture: true } } }
  });

  const io = getIO();
  if (io) {
    io.to(`order_${orderId}`).emit("message:new", {
      ...mapMessage(message),
      orderId,
      senderName: req.user.name,
    });
  }

  res.status(201).json({ success: true, message: mapMessage(message) });
});

// ============ GET MESSAGES ============
export const getMessages = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const cursor = req.query.cursor;
  const limit = parseInt(req.query.limit) || 50;

  const messages = await prisma.message.findMany({
    where: { order_id: orderId },
    include: { sender: { select: { id: true, name: true, profile_picture: true } } },
    orderBy: { created_at: "desc" },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
  });

  let nextCursor = null;
  if (messages.length > limit) {
    const nextItem = messages.pop();
    nextCursor = nextItem.id;
  }

  res.status(200).json({
    success: true,
    messages: messages.map(mapMessage),
    nextCursor,
  });
});

// ============ DELETE MESSAGE (SOFT) ============
export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new ApiError(404, "Message not found");
  if (message.sender_id !== userId) throw new ApiError(403, "Not authorized");

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { is_deleted: true, deleted_at: new Date() }
  });

  const io = getIO();
  if (io) io.to(`order_${message.order_id}`).emit("message:deleted", { messageId });

  res.status(200).json({ success: true, message: mapMessage(updated) });
});

// ============ EDIT MESSAGE ============
export const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new ApiError(404, "Message not found");
  if (message.sender_id !== userId) throw new ApiError(403, "Not authorized");

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: content.trim(), is_edited: true, edited_at: new Date() }
  });

  const io = getIO();
  if (io) io.to(`order_${message.order_id}`).emit("message:edited", { messageId, content: updated.content });

  res.status(200).json({ success: true, message: mapMessage(updated) });
});

// ============ TOGGLE STAR MESSAGE ============
export const toggleStarMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;
  
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new ApiError(404, "Message not found");
  
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { is_starred: !message.is_starred }
    });
  
    res.status(200).json({ success: true, message: mapMessage(updated) });
});

// ============ SEARCH MESSAGES ============
export const searchMessages = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { q } = req.query;
  
    const messages = await prisma.message.findMany({
      where: { order_id: orderId, content: { contains: q, mode: 'insensitive' } },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { created_at: 'desc' }
    });
  
    res.status(200).json({ success: true, messages: messages.map(mapMessage) });
});

// ============ GET STARRED MESSAGES ============
export const getStarredMessages = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
  
    const messages = await prisma.message.findMany({
      where: { order_id: orderId, is_starred: true },
      include: { sender: { select: { id: true, name: true, profile_picture: true } } },
      orderBy: { created_at: 'desc' }
    });
  
    res.status(200).json({ success: true, messages: messages.map(mapMessage) });
});

// ============ UPLOAD VOICE MESSAGE ============
export const uploadVoice = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { duration } = req.body;
  const userId = req.user.id;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, "Order not found");

  const receiverId = order.client_id === userId ? order.editor_id : order.client_id;

  const b64 = Buffer.from(req.file.buffer).toString("base64");
  const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  const result = await cloudinary.uploader.upload(dataURI, { resource_type: "video", folder: "suvix/chats/voice" });

  const message = await prisma.message.create({
    data: {
      order_id: orderId,
      sender_id: userId,
      receiver_id: receiverId,
      type: "audio",
      content: "Voice message",
      media_url: result.secure_url,
      audio_duration: Number(duration),
      delivered: true,
      delivered_at: new Date(),
    },
    include: { sender: { select: { id: true, name: true, profile_picture: true } } }
  });

  const io = getIO();
  if (io) {
    io.to(`order_${orderId}`).emit("message:new", {
      ...mapMessage(message),
      orderId,
      senderName: req.user.name,
    });
  }

  res.status(201).json({ success: true, message: mapMessage(message) });
});

// ============ SEND DRIVE LINK ============
export const sendDriveLink = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const { url, title, description, provider, fileCount, totalSize } = req.body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, "Order not found");

  const receiverId = order.client_id === userId ? order.editor_id : order.client_id;

  const message = await prisma.message.create({
    data: {
      order_id: orderId,
      sender_id: userId,
      receiver_id: receiverId,
      type: "drive_link",
      content: description || "Shared raw footage files",
      external_link: { provider, url, title, description, fileCount, totalSize },
      delivered: true,
      delivered_at: new Date(),
    },
    include: { sender: { select: { id: true, name: true, profile_picture: true } } }
  });

  const io = getIO();
  if (io) {
    io.to(`order_${orderId}`).emit("message:new", {
      ...mapMessage(message),
      orderId,
      senderName: req.user.name,
    });
  }

  res.status(201).json({ success: true, message: mapMessage(message) });
});

// ============ STUBS FOR MISSING MESSAGE EXPORTS ============

export const markAsSeen = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    await prisma.message.updateMany({
        where: { 
            order_id: orderId, 
            receiver_id: userId, 
            is_read: false 
        },
        data: { 
            is_read: true, 
            read_at: new Date() 
        }
    });

    const io = getIO();
    if (io) {
        io.to(`order_${orderId}`).emit("message:seen", { orderId, userId });
    }

    res.status(200).json({ success: true, message: "Messages marked as seen" });
});

export const markAsDownloaded = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new ApiError(404, "Message not found");

    const updatedDownloadedBy = [...new Set([...message.downloaded_by, userId])];

    const updated = await prisma.message.update({
        where: { id: messageId },
        data: { downloaded_by: updatedDownloadedBy }
    });

    res.status(200).json({ success: true, message: mapMessage(updated) });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const count = await prisma.message.count({
        where: { 
            receiver_id: userId, 
            is_read: false,
            is_deleted: false
        }
    });

    res.status(200).json({ success: true, count });
});

export const getUnreadCountsPerOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const unreadMessages = await prisma.message.groupBy({
        by: ['order_id'],
        where: { 
            receiver_id: userId, 
            is_read: false,
            is_deleted: false
        },
        _count: { id: true }
    });

    const counts = unreadMessages.reduce((acc, curr) => {
        acc[curr.order_id] = curr._count.id;
        return acc;
    }, {});

    res.status(200).json({ success: true, counts });
});

export const uploadFile = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!req.file) throw new ApiError(400, "No file uploaded");

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ApiError(404, "Order not found");

    const receiverId = order.client_id === userId ? order.editor_id : order.client_id;

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const result = await cloudinary.uploader.upload(dataURI, { 
        resource_type: "auto", 
        folder: "suvix/chats/files" 
    });

    const message = await prisma.message.create({
        data: {
            order_id: orderId,
            sender_id: userId,
            receiver_id: receiverId,
            type: "file",
            content: req.file.originalname,
            media_url: result.secure_url,
            media_filename: req.file.originalname,
            media_size: req.file.size,
            media_mimetype: req.file.mimetype,
            delivered: true,
            delivered_at: new Date(),
        },
        include: { sender: { select: { id: true, name: true, profile_picture: true } } }
    });

    const io = getIO();
    if (io) {
        io.to(`order_${orderId}`).emit("message:new", {
            ...mapMessage(message),
            orderId,
            senderName: req.user.name,
        });
    }

    res.status(201).json({ success: true, message: mapMessage(message) });
});
