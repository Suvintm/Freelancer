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
  const { content, type, mediaUrl, mediaName, mediaSize, allowDownload, replyTo } = req.body;

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

  // Build replyPreview if replying to a message
  let replyPreview = null;
  if (replyTo) {
    const originalMessage = await Message.findById(replyTo).populate("sender", "name");
    if (originalMessage) {
      replyPreview = {
        messageId: originalMessage._id.toString(),
        senderName: originalMessage.sender?.name || "User",
        content: originalMessage.content || (originalMessage.type !== "text" ? `Sent a ${originalMessage.type}` : ""),
        type: originalMessage.type,
        mediaUrl: originalMessage.mediaUrl || null,
        mediaThumbnail: originalMessage.mediaThumbnail || originalMessage.mediaUrl || null,
      };
    }
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
    replyTo: replyTo || null,
    replyPreview,
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

  // 🔕 Notification removed - using unread count badge instead to save storage
  // Real-time socket event already notifies the recipient

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

  // Create message with file - determine correct type
  let messageType = "file";
  if (mimeType.startsWith("image/")) messageType = "image";
  else if (mimeType.startsWith("video/")) messageType = "video";
  else if (mimeType.startsWith("audio/")) messageType = "audio";

  const message = await Message.create({
    order: orderId,
    sender: req.user._id,
    type: messageType,
    content: messageType === "file" ? `Sent a file: ${req.file.originalname}` : "",
    mediaUrl: result.secure_url,
    mediaName: req.file.originalname,
    mediaSize: req.file.size,
    mediaThumbnail: result.secure_url, // For videos, Cloudinary auto-generates thumbnail
    allowDownload: req.body.allowDownload === "true" || req.body.allowDownload === true,
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

  // 🔕 Notification removed - using unread count badge instead to save storage
  // Real-time socket event already notifies the recipient

  logger.info(`File uploaded in order: ${order.orderNumber}`);

  res.status(201).json({
    success: true,
    message: populatedMessage,
  });
});

// ============ DELETE MESSAGE (SOFT) ============
export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId).populate("order");

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Check if user is the sender
  if (message.sender.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  // 🔒 Block deletion for completed/cancelled/disputed orders
  const protectedStatuses = ["completed", "cancelled", "disputed"];
  if (protectedStatuses.includes(message.order.status)) {
    throw new ApiError(403, "Cannot delete messages from completed or closed orders. Chat history is preserved for record.");
  }

  // Soft delete
  message.isDeleted = true;
  message.deletedAt = new Date();
  message.deletedBy = req.user._id;
  await message.save();

  // Emit real-time delete event
  const io = getIO();
  if (io) {
    io.to(`order_${message.order._id}`).emit("message:deleted", {
      messageId: message._id,
      orderId: message.order._id,
      deletedBy: req.user._id,
    });
  }

  res.status(200).json({
    success: true,
    message: "Message deleted",
  });
});

// ============ EDIT MESSAGE ============
export const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;

  const message = await Message.findById(messageId).populate("order");

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Check if user is the sender
  if (message.sender.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only edit your own messages");
  }

  // Check if within 15 minutes
  const fifteenMinutes = 5 * 60 * 1000;
  if (Date.now() - message.createdAt > fifteenMinutes) {
    throw new ApiError(400, "Cannot edit message after 5 minutes");
  }

  // Only text messages can be edited
  if (message.type !== "text") {
    throw new ApiError(400, "Only text messages can be edited");
  }

  // Store original if first edit
  if (!message.originalContent) {
    message.originalContent = message.content;
  }

  message.content = content.trim();
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  // Emit real-time edit event
  const io = getIO();
  if (io) {
    io.to(`order_${message.order._id}`).emit("message:edited", {
      messageId: message._id,
      orderId: message.order._id,
      content: message.content,
      isEdited: true,
      editedAt: message.editedAt,
    });
  }

  res.status(200).json({
    success: true,
    message: "Message edited",
    data: { content: message.content, isEdited: true },
  });
});

// ============ TOGGLE STAR MESSAGE ============
export const toggleStarMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const userId = req.user._id;
  const isStarred = message.starredBy.includes(userId);

  if (isStarred) {
    // Unstar
    message.starredBy = message.starredBy.filter(
      (id) => id.toString() !== userId.toString()
    );
  } else {
    // Star
    message.starredBy.push(userId);
  }

  message.isStarred = message.starredBy.length > 0;
  await message.save();

  res.status(200).json({
    success: true,
    starred: !isStarred,
    message: isStarred ? "Message unstarred" : "Message starred",
  });
});

// ============ GET STARRED MESSAGES ============
export const getStarredMessages = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const starredMessages = await Message.find({
    order: orderId,
    starredBy: req.user._id,
    isDeleted: false,
  })
    .populate("sender", "name profilePicture")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    messages: starredMessages,
  });
});

// ============ SEARCH MESSAGES ============
export const searchMessages = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters");
  }

  const messages = await Message.find({
    order: orderId,
    isDeleted: false,
    $or: [
      { content: { $regex: q, $options: "i" } },
      { mediaName: { $regex: q, $options: "i" } },
    ],
  })
    .populate("sender", "name profilePicture")
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({
    success: true,
    messages,
    count: messages.length,
  });
});

// ============ UPLOAD VOICE MESSAGE ============
export const uploadVoice = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!req.file) {
    throw new ApiError(400, "No audio file provided");
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
    throw new ApiError(403, "Not authorized to send messages");
  }

  // Upload to Cloudinary
  const cloudinary = (await import("cloudinary")).v2;
  
  const mimeType = req.file.mimetype;
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  const dataURI = `data:${mimeType};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    resource_type: "video", // audio uses video resource type
    folder: `suvix/chats/${orderId}/voice`,
    use_filename: true,
    unique_filename: true,
  });

  // Get duration from request body or default
  const duration = parseFloat(req.body.duration) || 0;

  // Create message
  const message = await Message.create({
    order: orderId,
    sender: req.user._id,
    type: "audio",
    content: "Voice message",
    mediaUrl: result.secure_url,
    mediaName: req.file.originalname || "voice_message.webm",
    audioDuration: duration,
    delivered: true,
    deliveredAt: new Date(),
  });

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
  }

  // 🔕 Notification removed - using unread count badge instead to save storage
  // Real-time socket event already notifies the recipient

  res.status(201).json({
    success: true,
    message: populatedMessage,
  });
});

// Send Drive Link (Client Only)
export const sendDriveLink = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { url, title, description, provider, fileCount, totalSize } = req.body;

  if (!url) {
    throw new ApiError(400, "URL is required");
  }

  // Validate URL format
  const urlPattern = /^https?:\/\/.+/i;
  if (!urlPattern.test(url)) {
    throw new ApiError(400, "Invalid URL format");
  }

  const order = await Order.findById(orderId)
    .populate("client", "name profilePicture")
    .populate("editor", "name profilePicture");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only clients can share drive links
  const isClient = order.client._id.toString() === req.user._id.toString();
  if (!isClient) {
    throw new ApiError(403, "Only clients can share raw footage links");
  }

  // Detect provider from URL
  let detectedProvider = provider || "other";
  if (!provider) {
    if (url.includes("drive.google.com")) detectedProvider = "google_drive";
    else if (url.includes("dropbox.com")) detectedProvider = "dropbox";
    else if (url.includes("onedrive")) detectedProvider = "onedrive";
    else if (url.includes("wetransfer.com")) detectedProvider = "wetransfer";
    else if (url.includes("mega.nz")) detectedProvider = "mega";
  }

  const message = await Message.create({
    order: orderId,
    sender: req.user._id,
    type: "drive_link",
    content: description || "Shared raw footage files",
    externalLink: {
      provider: detectedProvider,
      url,
      title: title || "Raw Footage Package",
      description: description || "",
      fileCount: fileCount || null,
      totalSize: totalSize || null,
    },
    delivered: true,
    deliveredAt: new Date(),
  });

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
  }

  // Notify editor
  await createNotification({
    recipient: order.editor._id,
    type: "info",
    title: "📁 Raw Footage Shared",
    message: `${req.user.name} shared raw footage files`,
    link: `/chat/${orderId}`,
  });

  res.status(201).json({
    success: true,
    message: populatedMessage,
  });
});
