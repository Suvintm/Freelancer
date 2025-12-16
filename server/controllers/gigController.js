import { Gig } from "../models/Gig.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import { createNotification } from "./notificationController.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import logger from "../utils/logger.js";

// ============ CREATE GIG ============
export const createGig = asyncHandler(async (req, res) => {
  const { title, description, category, price, deliveryDays, samples } = req.body;

  // Validate required fields
  if (!title || !description || !category || !price || !deliveryDays) {
    throw new ApiError(400, "Please provide all required fields");
  }

  // Handle thumbnail upload if provided
  let thumbnailUrl = "";
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file.buffer, "gig-thumbnails");
    thumbnailUrl = uploadResult.url;
  }

  // Create gig
  const gig = await Gig.create({
    editor: req.user._id,
    title: title.trim(),
    description: description.trim(),
    category,
    price: Number(price),
    deliveryDays: Number(deliveryDays),
    samples: samples ? (Array.isArray(samples) ? samples : JSON.parse(samples)) : [],
    thumbnail: thumbnailUrl,
  });

  // Populate editor info
  const populatedGig = await Gig.findById(gig._id).populate(
    "editor",
    "name profilePicture"
  );

  // Notify editor
  await createNotification({
    recipient: req.user._id,
    type: "success",
    title: "Gig Created",
    message: `Your gig "${gig.title}" is now live!`,
    link: "/my-gigs",
  });

  logger.info(`Gig created: ${gig._id} by editor: ${req.user._id}`);

  res.status(201).json({
    success: true,
    message: "Gig created successfully",
    gig: populatedGig,
  });
});

// ============ GET ALL GIGS (Public) ============
export const getAllGigs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 12, 50);
  const skip = (page - 1) * limit;

  // Build query
  const query = { isActive: true, isApproved: true };

  // Category filter
  if (req.query.category && req.query.category !== "all") {
    query.category = req.query.category;
  }

  // Price range filter
  if (req.query.minPrice) {
    query.price = { ...query.price, $gte: Number(req.query.minPrice) };
  }
  if (req.query.maxPrice) {
    query.price = { ...query.price, $lte: Number(req.query.maxPrice) };
  }

  // Search filter
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    query.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  // Sort options
  let sort = { createdAt: -1 };
  if (req.query.sort === "price_low") sort = { price: 1 };
  if (req.query.sort === "price_high") sort = { price: -1 };
  if (req.query.sort === "popular") sort = { totalOrders: -1 };
  if (req.query.sort === "rating") sort = { rating: -1 };

  const [gigs, total] = await Promise.all([
    Gig.find(query)
      .populate("editor", "name profilePicture")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Gig.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    gigs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// ============ GET SINGLE GIG ============
export const getGig = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id).populate(
    "editor",
    "name profilePicture email"
  );

  if (!gig) {
    throw new ApiError(404, "Gig not found");
  }

  res.status(200).json({
    success: true,
    gig,
  });
});

// ============ GET MY GIGS (Editor) ============
export const getMyGigs = asyncHandler(async (req, res) => {
  const gigs = await Gig.find({ editor: req.user._id })
    .sort({ createdAt: -1 })
    .populate("editor", "name profilePicture");

  res.status(200).json({
    success: true,
    gigs,
  });
});

// ============ UPDATE GIG ============
export const updateGig = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id);

  if (!gig) {
    throw new ApiError(404, "Gig not found");
  }

  if (gig.editor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to update this gig");
  }

  // Handle thumbnail upload if provided
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file.buffer, "gig-thumbnails");
    gig.thumbnail = uploadResult.url;
  }

  // Update allowed fields
  const allowedFields = ["title", "description", "category", "price", "deliveryDays", "samples", "isActive"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      gig[field] = req.body[field];
    }
  });

  await gig.save();

  const populatedGig = await Gig.findById(gig._id).populate(
    "editor",
    "name profilePicture"
  );

  logger.info(`Gig updated: ${gig._id}`);

  res.status(200).json({
    success: true,
    message: "Gig updated successfully",
    gig: populatedGig,
  });
});

// ============ DELETE GIG ============
export const deleteGig = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id);

  if (!gig) {
    throw new ApiError(404, "Gig not found");
  }

  if (gig.editor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to delete this gig");
  }

  await Gig.findByIdAndDelete(req.params.id);

  logger.info(`Gig deleted: ${req.params.id}`);

  res.status(200).json({
    success: true,
    message: "Gig deleted successfully",
  });
});

// ============ TOGGLE GIG STATUS ============
export const toggleGigStatus = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id);

  if (!gig) {
    throw new ApiError(404, "Gig not found");
  }

  if (gig.editor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to modify this gig");
  }

  gig.isActive = !gig.isActive;
  await gig.save();

  const status = gig.isActive ? "activated" : "paused";
  
  await createNotification({
    recipient: req.user._id,
    type: "info",
    title: `Gig ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Your gig "${gig.title}" has been ${status}.`,
    link: "/my-gigs",
  });

  res.status(200).json({
    success: true,
    message: `Gig ${status} successfully`,
    isActive: gig.isActive,
  });
});
