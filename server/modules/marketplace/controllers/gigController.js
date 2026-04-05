import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";
import logger from "../../../utils/logger.js";
import { getCache, setCache, delPattern } from "../../../config/redisClient.js";

// Helper to map Prisma gig to camelCase for frontend
const mapGig = (gig) => {
  if (!gig) return null;
  return {
    ...gig,
    _id: gig.id, // Legacy compatibility
    deliveryDays: gig.delivery_days,
    isActive: gig.is_active,
    isApproved: gig.is_approved,
    totalOrders: gig.total_orders,
    avgRating: gig.avg_rating,
    reviewCount: gig.review_count,
    createdAt: gig.created_at,
    updatedAt: gig.updated_at
  };
};

// ============ CREATE GIG ============
export const createGig = asyncHandler(async (req, res) => {
  const { title, description, category, price, deliveryDays, samples } = req.body;
  const userId = req.user.id;

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
  const gig = await prisma.gig.create({
    data: {
      editor_id: userId,
      title: title.trim(),
      description: description.trim(),
      category,
      price: Number(price),
      delivery_days: Number(deliveryDays),
      samples: samples ? (Array.isArray(samples) ? samples : JSON.parse(samples)) : [],
      thumbnail: thumbnailUrl,
    },
    include: {
      editor: {
        select: { id: true, name: true, profile_picture: true }
      }
    }
  });

  // Notify editor
  await createNotification({
    recipient: userId,
    type: "success",
    title: "Gig Created",
    message: `Your gig "${gig.title}" is now live!`,
    link: "/my-gigs",
  });

  logger.info(`Gig created: ${gig.id} by editor: ${userId}`);

  // Invalidate gigs cache
  await delPattern("gigs:*");

  res.status(201).json({
    success: true,
    message: "Gig created successfully",
    gig: mapGig(gig),
  });
});

// ============ GET ALL GIGS (Public) ============
export const getAllGigs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 12, 50);
  const { category, minPrice, maxPrice, search, sort } = req.query;
  
  // ── CACHE CHECK ──────────────────────────────────────────────────
  const cacheKey = `gigs:list:p${page}:l${limit}:c${category || 'all'}:s${search || 'none'}:so${sort || 'newest'}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  const skip = (page - 1) * limit;

  // Build where clause
  const where = { is_active: true, is_approved: true };

  if (category && category !== "all") {
    where.category = category;
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Sort options
  let orderBy = { created_at: 'desc' };
  if (sort === "price_low") orderBy = { price: 'asc' };
  if (sort === "price_high") orderBy = { price: 'desc' };
  if (sort === "popular") orderBy = { total_orders: 'desc' };
  if (sort === "rating") orderBy = { avg_rating: 'desc' };

  const [gigs, total] = await Promise.all([
    prisma.gig.findMany({
      where,
      include: {
        editor: {
          select: { id: true, name: true, profile_picture: true }
        }
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.gig.count({ where }),
  ]);

  const responseData = {
    success: true,
    gigs: gigs.map(mapGig),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };

  await setCache(cacheKey, responseData, 300); // 5 min cache
  res.status(200).json(responseData);
});

// ============ GET SINGLE GIG ============
export const getGig = asyncHandler(async (req, res) => {
  const gig = await prisma.gig.findUnique({
    where: { id: req.params.id },
    include: {
      editor: {
        select: { id: true, name: true, profile_picture: true, email: true }
      }
    }
  });

  if (!gig) {
    throw new ApiError(404, "Gig not found");
  }

  res.status(200).json({
    success: true,
    gig: mapGig(gig),
  });
});

// ============ GET MY GIGS (Editor) ============
export const getMyGigs = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const gigs = await prisma.gig.findMany({
    where: { editor_id: userId },
    orderBy: { created_at: 'desc' },
    include: {
      editor: {
        select: { id: true, name: true, profile_picture: true }
      }
    }
  });

  res.status(200).json({
    success: true,
    gigs: gigs.map(mapGig),
  });
});

// ============ UPDATE GIG ============
export const updateGig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const gig = await prisma.gig.findUnique({ where: { id } });
  if (!gig) throw new ApiError(404, "Gig not found");

  if (gig.editor_id !== userId) {
    throw new ApiError(403, "Not authorized to update this gig");
  }

  let thumbnailUrl = gig.thumbnail;
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file.buffer, "gig-thumbnails");
    thumbnailUrl = uploadResult.url;
  }

  const updateData = {
    thumbnail: thumbnailUrl,
  };

  const allowedFields = ["title", "description", "category", "price", "deliveryDays", "samples", "isActive"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "deliveryDays") updateData.delivery_days = Number(req.body[field]);
      else if (field === "isActive") updateData.is_active = req.body[field];
      else updateData[field] = req.body[field];
    }
  });

  const updatedGig = await prisma.gig.update({
    where: { id },
    data: updateData,
    include: {
      editor: {
        select: { id: true, name: true, profile_picture: true }
      }
    }
  });

  logger.info(`Gig updated: ${id}`);
  await delPattern("gigs:*");

  res.status(200).json({
    success: true,
    message: "Gig updated successfully",
    gig: mapGig(updatedGig),
  });
});

// ============ DELETE GIG ============
export const deleteGig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const gig = await prisma.gig.findUnique({ where: { id } });
  if (!gig) throw new ApiError(404, "Gig not found");

  if (gig.editor_id !== userId) {
    throw new ApiError(403, "Not authorized to delete this gig");
  }

  await prisma.gig.delete({ where: { id } });

  logger.info(`Gig deleted: ${id}`);
  await delPattern("gigs:*");

  res.status(200).json({
    success: true,
    message: "Gig deleted successfully",
  });
});

// ============ TOGGLE GIG STATUS ============
export const toggleGigStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const gig = await prisma.gig.findUnique({ where: { id } });
  if (!gig) throw new ApiError(404, "Gig not found");

  if (gig.editor_id !== userId) {
    throw new ApiError(403, "Not authorized to modify this gig");
  }

  const updatedGig = await prisma.gig.update({
    where: { id },
    data: { is_active: !gig.is_active }
  });

  await delPattern("gigs:*");

  const status = updatedGig.is_active ? "activated" : "paused";
  
  await createNotification({
    recipient: userId,
    type: "info",
    title: `Gig ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Your gig "${gig.title}" has been ${status}.`,
    link: "/my-gigs",
  });

  res.status(200).json({
    success: true,
    message: `Gig ${status} successfully`,
    isActive: updatedGig.is_active,
  });
});

// GET /api/gigs/suggestions
export const getGigSuggestions = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) {
    return res.json({ success: true, suggestions: [] });
  }

  const gigMatches = await prisma.gig.findMany({
    where: {
      is_active: true,
      is_approved: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: { id: true, title: true, category: true },
    take: 10
  });

  const suggestionSet = new Set();
  const suggestions = [];

  gigMatches.forEach(gig => {
    if (gig.title.toLowerCase().includes(query.toLowerCase())) {
        if (!suggestionSet.has(gig.title)) {
            suggestionSet.add(gig.title);
            suggestions.push({ type: "gig", text: gig.title, id: gig.id });
        }
    }
    if (gig.category.toLowerCase().includes(query.toLowerCase())) {
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






