import { Message } from "../models/Message.js";
import { Order } from "../models/Order.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import { createNotification } from "./notificationController.js";
import { getIO } from "../socket.js";
import logger from "../utils/logger.js";

// ============ GET MESSAGES FOR ORDER ============
export const getMessages = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Verify order access
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const isClient = order.client.toString() === req.user._id.toString();
  const isEditor = order.editor.toString() === req.user._id.toString();

  if (!isClient && !isEditor) {
    throw new ApiError(403, "Not authorized to view messages");
  }

  const messages = await Message.find({ order: orderId })
    .populate("sender", "name profilePicture")
    .sort({ createdAt: 1 });

  // Mark messages as seen
  await Message.updateMany(
    {
      order: orderId,
      sender: { $ne: req.user._id },
      seen: false,
    },
    {
      seen: true,
      seenAt: new Date(),
    }
  );

  res.status(200).json({
    success: true,
    messages,
  });
});

// ============ SEND MESSAGE ============
export const sendMessage = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { content, type, mediaUrl, mediaName, mediaSize, allowDownload } = req.body;

  // Verify order access
  const order = await Order.findById(orderId)
    .populate("client", "name")
    .populate("editor", "name");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const isClient = order.client._id.toString() === req.user._id.toString();
  const isEditor = order.editor._id.toString() === req.user._id.toString();

  if (!isClient && !isEditor) {
    throw new ApiError(403, "Not authorized to send messages");
  }

  // Only allow messages in appropriate order states
  if (!["accepted", "in_progress", "submitted"].includes(order.status)) {
    throw new ApiError(400, "Cannot send messages in current order state");
  }

  // Update order status to in_progress if it's accepted
  if (order.status === "accepted") {
    order.status = "in_progress";
    order.startedAt = new Date();
    await order.save();
  }

  // Create message
  const message = await Message.create({
    order: orderId,
    sender: req.user._id,
    type: type || "text",
    content,
    mediaUrl,
    mediaName,
    mediaSize,
    allowDownload: allowDownload || false,
    delivered: true,
    deliveredAt: new Date(),
  });

  const populatedMessage = await Message.findById(message._id).populate(
    "sender",
    "name profilePicture"
  );

  // Emit real-time message via Socket.io
  const io = getIO();
  if (io) {
    console.log(`📤 Socket emit: message:new to room order_${orderId}`);
    io.to(`order_${orderId}`).emit("message:new", {
      ...populatedMessage.toObject(),
      orderId,
      senderName: req.user.name,
    });
  } else {
    console.log("❌ Socket IO not available");
  }

  // Notify recipient
  const recipientId = isClient ? order.editor._id : order.client._id;
  const recipientName = isClient ? order.editor.name : order.client.name;

  await createNotification({
    recipient: recipientId,
    type: "info",
    title: "New Message",
    message: `${req.user.name}: ${content?.substring(0, 50) || "Sent a file"}...`,
    link: `/chat/${orderId}`,
  });

  logger.info(`Message sent in order: ${order.orderNumber}`);

  res.status(201).json({
    success: true,
    message: populatedMessage,
  });
});

// ============ MARK MESSAGE AS SEEN ============
export const markAsSeen = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Only recipient can mark as seen
  if (message.sender.toString() === req.user._id.toString()) {
    throw new ApiError(400, "Cannot mark your own message as seen");
  }

  message.seen = true;
  message.seenAt = new Date();
  await message.save();

  // Emit seen status via Socket.io
  const io = getIO();
  if (io) {
    io.to(`order_${message.order}`).emit("message_seen", {
      messageId: message._id,
      seenAt: message.seenAt,
    });
  }

  res.status(200).json({
    success: true,
    message: "Marked as seen",
  });
});

// ============ MARK FILE AS DOWNLOADED ============
export const markAsDownloaded = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId).populate("order");

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (!message.mediaUrl) {
    throw new ApiError(400, "This message has no media");
  }

  if (!message.allowDownload) {
    throw new ApiError(403, "Download not allowed for this file");
  }

  // Only recipient can download
  if (message.sender.toString() === req.user._id.toString()) {
    throw new ApiError(400, "Cannot download your own file");
  }

  message.downloaded = true;
  message.downloadedAt = new Date();
  await message.save();

  // Check if this is the final delivery and auto-complete order
  const order = await Order.findById(message.order._id);
  
  if (order.status === "submitted" && message.allowDownload) {
    // Auto-complete order
    order.status = "completed";
    order.completedAt = new Date();
    order.paymentStatus = "released";
    await order.save();

    // Create system message
    await Message.create({
      order: order._id,
      sender: req.user._id,
      type: "system",
      content: "Final delivery downloaded. Order completed. Payment released.",
      systemAction: "work_completed",
    });

    // Notify editor
    await createNotification({
      recipient: order.editor,
      type: "success",
      title: "Payment Released",
      message: `₹${order.editorEarning} released for "${order.title}"`,
      link: `/chat/${order._id}`,
    });

    logger.info(`Order auto-completed via download: ${order.orderNumber}`);
  }

  res.status(200).json({
    success: true,
    message: "Download recorded",
    orderCompleted: order.status === "completed",
  });
});

// ============ GET UNREAD COUNT ============
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get all orders where user is participant
  const orders = await Order.find({
    $or: [{ client: userId }, { editor: userId }],
    status: { $in: ["accepted", "in_progress", "submitted"] },
  });

  const orderIds = orders.map((o) => o._id);

  // Count unread messages
  const unreadCount = await Message.countDocuments({
    order: { $in: orderIds },
    sender: { $ne: userId },
    seen: false,
  });

  res.status(200).json({
    success: true,
    unreadCount,
  });
});

// ============ UPLOAD FILE ============
export const uploadFile = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!req.file) {
    throw new ApiError(400, "No file provided");
  }

  // Verify order access
  const order = await Order.findById(orderId)
    .populate("client", "name")
    .populate("editor", "name");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const isClient = order.client._id.toString() === req.user._id.toString();
  const isEditor = order.editor._id.toString() === req.user._id.toString();

  if (!isClient && !isEditor) {
    throw new ApiError(403, "Not authorized to upload files");
  }

  // Only allow uploads in appropriate order states
  if (!["accepted", "in_progress", "submitted"].includes(order.status)) {
    throw new ApiError(400, "Cannot upload files in current order state");
  }

  // Upload to Cloudinary
  const cloudinary = (await import("cloudinary")).v2;
  
  // Determine resource type
  const mimeType = req.file.mimetype;
  let resourceType = "auto";
  if (mimeType.startsWith("video/")) resourceType = "video";
  else if (mimeType.startsWith("image/")) resourceType = "image";
  else resourceType = "raw";

  // Convert buffer to base64
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  const dataURI = `data:${mimeType};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    resource_type: resourceType,
    folder: `suvix/chats/${orderId}`,
    use_filename: true,
    unique_filename: true,
  });

  // Create message with file
  const message = await Message.create({
    order: orderId,
    sender: req.user._id,
    type: "file",
    content: `Sent a file: ${req.file.originalname}`,
    mediaUrl: result.secure_url,
    mediaName: req.file.originalname,
    mediaSize: req.file.size,
    allowDownload: true,
    delivered: true,
    deliveredAt: new Date(),
  });

  const populatedMessage = await Message.findById(message._id).populate(
    "sender",
    "name profilePicture"
  );

  // Emit real-time message via Socket.io
  const io = getIO();
  if (io) {
    console.log(`📤 Socket emit: message:new (file) to room order_${orderId}`);
    io.to(`order_${orderId}`).emit("message:new", {
      ...populatedMessage.toObject(),
      orderId,
      senderName: req.user.name,
    });
  }

  // Notify recipient
  const recipientId = isClient ? order.editor._id : order.client._id;

  await createNotification({
    recipient: recipientId,
    type: "info",
    title: "New File",
    message: `${req.user.name} sent a file: ${req.file.originalname}`,
    link: `/chat/${orderId}`,
  });

  logger.info(`File uploaded in order: ${order.orderNumber}`);

  res.status(201).json({
    success: true,
    message: populatedMessage,
  });
});
