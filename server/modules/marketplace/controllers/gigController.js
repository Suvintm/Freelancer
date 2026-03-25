import { Gig } from "../models/Gig.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";
import logger from "../../../utils/logger.js";
import { getCache, setCache, delPattern } from "../../../config/redisClient.js";

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

  // Invalidate gigs cache
  await delPattern("gigs:*");

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
  
  // ── CACHE CHECK ──────────────────────────────────────────────────
  const cacheKey = `gigs:list:p${page}:l${limit}:c${req.query.category || 'all'}:s${req.query.search || 'none'}:so${req.query.sort || 'newest'}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.status(200).json(cachedData);
  }

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

  const responseData = {
    success: true,
    gigs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };

  // Set cache (TTL: 2 minutes)
  await setCache(cacheKey, responseData, 120);

  res.status(200).json(responseData);
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

  // Invalidate gigs cache
  await delPattern("gigs:*");

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

  // Invalidate gigs cache
  await delPattern("gigs:*");

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

  // Invalidate gigs cache
  await delPattern("gigs:*");

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

// GET /api/gigs/suggestions
export const getGigSuggestions = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) {
    return res.json({ success: true, suggestions: [] });
  }

  const searchRegex = new RegExp(query, "i");

  const gigMatches = await Gig.find({
    isActive: true,
    isApproved: true,
    $or: [{ title: searchRegex }, { category: searchRegex }]
  })
  .select("title category")
  .limit(10)
  .lean();

  // Process matches into unique suggestions
  const suggestionSet = new Set();
  const suggestions = [];

  gigMatches.forEach(gig => {
    // Check Title
    if (searchRegex.test(gig.title)) {
        if (!suggestionSet.has(gig.title)) {
            suggestionSet.add(gig.title);
            suggestions.push({ type: "gig", text: gig.title, id: gig._id });
        }
    }
    // Check Category
    if (searchRegex.test(gig.category)) {
        if (!suggestionSet.has(gig.category)) {
            suggestionSet.add(gig.category);
            suggestions.push({ type: "category", text: gig.category });
        }
    }
  });

  res.json({
    success: true,
    suggestions: suggestions.slice(0, 8)
  });
});
