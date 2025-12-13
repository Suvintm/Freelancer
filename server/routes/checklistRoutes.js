import express from "express";
import { Checklist } from "../models/Checklist.js";
import { Order } from "../models/Order.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getIO } from "../socket.js";

const router = express.Router();

router.use(authMiddleware);

// Get or create checklist for order
router.get("/:orderId", asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  // Verify order access
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  
  const isAuthorized = 
    order.client.toString() === req.user._id.toString() ||
    order.editor.toString() === req.user._id.toString();
  
  if (!isAuthorized) throw new ApiError(403, "Not authorized");
  
  let checklist = await Checklist.findOne({ order: orderId });
  
  // Create if doesn't exist
  if (!checklist) {
    checklist = await Checklist.create({
      order: orderId,
      createdBy: req.user._id,
      items: [],
    });
  }
  
  res.json({ success: true, checklist });
}));

// Add item to checklist
router.post("/:orderId/item", asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { text } = req.body;
  
  if (!text?.trim()) throw new ApiError(400, "Item text is required");
  
  let checklist = await Checklist.findOne({ order: orderId });
  
  if (!checklist) {
    checklist = await Checklist.create({
      order: orderId,
      createdBy: req.user._id,
      items: [],
    });
  }
  
  checklist.items.push({ text: text.trim() });
  await checklist.save();
  
  // Emit real-time update
  const io = getIO();
  if (io) {
    io.to(`order_${orderId}`).emit("checklist:updated", {
      orderId,
      checklist: checklist.items,
    });
  }
  
  res.status(201).json({ success: true, checklist });
}));

// Toggle item completion
router.patch("/:orderId/item/:itemId", asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  
  const checklist = await Checklist.findOne({ order: orderId });
  if (!checklist) throw new ApiError(404, "Checklist not found");
  
  const item = checklist.items.id(itemId);
  if (!item) throw new ApiError(404, "Item not found");
  
  item.completed = !item.completed;
  item.completedBy = item.completed ? req.user._id : null;
  item.completedAt = item.completed ? new Date() : null;
  
  await checklist.save();
  
  // Emit real-time update
  const io = getIO();
  if (io) {
    io.to(`order_${orderId}`).emit("checklist:updated", {
      orderId,
      checklist: checklist.items,
    });
  }
  
  res.json({ success: true, checklist });
}));

// Delete item
router.delete("/:orderId/item/:itemId", asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  
  const checklist = await Checklist.findOne({ order: orderId });
  if (!checklist) throw new ApiError(404, "Checklist not found");
  
  checklist.items.pull({ _id: itemId });
  await checklist.save();
  
  // Emit real-time update
  const io = getIO();
  if (io) {
    io.to(`order_${orderId}`).emit("checklist:updated", {
      orderId,
      checklist: checklist.items,
    });
  }
  
  res.json({ success: true, checklist });
}));

// Update item text
router.put("/:orderId/item/:itemId", asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { text } = req.body;
  
  if (!text?.trim()) throw new ApiError(400, "Item text is required");
  
  const checklist = await Checklist.findOne({ order: orderId });
  if (!checklist) throw new ApiError(404, "Checklist not found");
  
  const item = checklist.items.id(itemId);
  if (!item) throw new ApiError(404, "Item not found");
  
  item.text = text.trim();
  await checklist.save();
  
  // Emit real-time update
  const io = getIO();
  if (io) {
    io.to(`order_${orderId}`).emit("checklist:updated", {
      orderId,
      checklist: checklist.items,
    });
  }
  
  res.json({ success: true, checklist });
}));

export default router;
