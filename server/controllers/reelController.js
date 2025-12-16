import { Reel } from "../models/Reel.js";
import { Comment } from "../models/Comment.js";
import { Portfolio } from "../models/Portfolio.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";
import { createNotification } from "./notificationController.js";
import mongoose from "mongoose";

// ============ PUBLISH PORTFOLIO AS REEL ============
export const publishToReel = asyncHandler(async (req, res) => {
    const { portfolioId } = req.params;

    // Check if portfolio exists and belongs to user
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
        throw new ApiError(404, "Portfolio not found");
    }

    if (portfolio.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to publish this portfolio");
    }

    // Check if already published
    const existingReel = await Reel.findOne({ portfolio: portfolioId });
    if (existingReel) {
        throw new ApiError(400, "Portfolio already published as reel");
    }

    // Get the main media (edited clip is the final result)
    const mediaUrl = portfolio.editedClip;
    const isVideo = mediaUrl?.endsWith(".mp4") || mediaUrl?.endsWith(".mov") || mediaUrl?.endsWith(".webm");

    // Create reel
    const reel = await Reel.create({
        portfolio: portfolioId,
        editor: req.user._id,
        title: portfolio.title,
        description: portfolio.description,
        mediaUrl,
        mediaType: isVideo ? "video" : "image",
    });

    const populatedReel = await Reel.findById(reel._id)
        .populate("editor", "name email profilePicture")
        .populate("portfolio");

    logger.info(`Portfolio ${portfolioId} published as reel ${reel._id}`);

    // Trigger Notification
    await createNotification({
        recipient: req.user._id,
        type: "success",
        title: "Reel Published! 🎬",
        message: `Your reel "${reel.title}" is now live.`,
        link: "/reels",
    });

    res.status(201).json({
        success: true,
        message: "Portfolio published to reels!",
        reel: populatedReel,
    });
});

// ============ UNPUBLISH REEL ============
export const unpublishReel = asyncHandler(async (req, res) => {
    const { reelId } = req.params;

    const reel = await Reel.findById(reelId);
    if (!reel) {
        throw new ApiError(404, "Reel not found");
    }

    if (reel.editor.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to unpublish this reel");
    }

    await Reel.findByIdAndDelete(reelId);
    await Comment.deleteMany({ reel: reelId }); // Clean up comments

    logger.info(`Reel ${reelId} unpublished`);

    res.status(200).json({
        success: true,
        message: "Reel unpublished successfully",
    });
});

// ============ GET REELS FEED (Instagram-Style Algorithm) ============
export const getReelsFeed = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    let excludeIds = req.query.exclude ? req.query.exclude.split(",").filter(id => id) : [];

    console.log(`[FEED] Fetching reels - page: ${page}, limit: ${limit}, excluding: ${excludeIds.length} reels`);

    // Convert exclude IDs to ObjectIds
    const excludeObjectIds = excludeIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));

    // Build aggregation pipeline for weighted random
    const pipeline = [
        // Match published reels, exclude already seen (if any)
        {
            $match: {
                isPublished: true,
                ...(excludeObjectIds.length > 0 && { _id: { $nin: excludeObjectIds } }),
            },
        },
        // Add weight based on freshness, engagement, and randomness
        {
            $addFields: {
                // Freshness score (higher for newer reels - exponential decay)
                freshnessScore: {
                    $divide: [
                        1,
                        {
                            $add: [
                                1,
                                {
                                    $divide: [
                                        { $subtract: [new Date(), "$createdAt"] },
                                        86400000, // milliseconds in a day
                                    ],
                                },
                            ],
                        },
                    ],
                },
                // Engagement score (weighted: comments > likes > views)
                engagementScore: {
                    $add: [
                        { $multiply: [{ $ifNull: ["$likesCount", 0] }, 5] },
                        { $multiply: [{ $ifNull: ["$commentsCount", 0] }, 10] },
                        { $multiply: [{ $ifNull: ["$viewsCount", 0] }, 1] },
                    ],
                },
            },
        },
        // Calculate total weight with strong random factor for variety
        {
            $addFields: {
                weight: {
                    $add: [
                        { $multiply: ["$freshnessScore", 40] },
                        { $multiply: ["$engagementScore", 0.1] },
                        { $multiply: [{ $rand: {} }, 50] }, // Strong random factor for variety
                    ],
                },
            },
        },
        // Sort by weight (randomized)
        { $sort: { weight: -1 } },
        // Limit
        { $limit: limit },
        // Lookup editor info
        {
            $lookup: {
                from: "users",
                localField: "editor",
                foreignField: "_id",
                as: "editorInfo",
            },
        },
        { $unwind: { path: "$editorInfo", preserveNullAndEmptyArrays: true } },
        // Lookup portfolio
        {
            $lookup: {
                from: "portfolios",
                localField: "portfolio",
                foreignField: "_id",
                as: "portfolioInfo",
            },
        },
        { $unwind: { path: "$portfolioInfo", preserveNullAndEmptyArrays: true } },
        // Project final shape
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                mediaUrl: 1,
                mediaType: 1,
                likesCount: 1,
                viewsCount: 1,
                commentsCount: 1,
                likes: 1,
                createdAt: 1,
                editor: {
                    _id: "$editorInfo._id",
                    name: "$editorInfo.name",
                    profilePicture: "$editorInfo.profilePicture",
                },
                portfolio: "$portfolioInfo",
            },
        },
    ];

    let reels = await Reel.aggregate(pipeline);
    
    // If no reels found with exclusions, fetch without exclusions (infinite loop)
    if (reels.length === 0 && excludeObjectIds.length > 0) {
        console.log('[FEED] No new reels found, fetching random without exclusions...');
        pipeline[0].$match = { isPublished: true }; // Remove exclusion
        reels = await Reel.aggregate(pipeline);
    }

    const total = await Reel.countDocuments({ isPublished: true });

    console.log(`[FEED] Returning ${reels.length} reels. Total in DB: ${total}`);

    res.status(200).json({
        success: true,
        reels,
        pagination: {
            page,
            limit,
            total,
            // Always hasMore = true for infinite scroll (unless 0 reels exist)
            hasMore: total > 0,
        },
    });
});

// ============ GET SINGLE REEL ============
export const getReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id)
        .populate("editor", "name email profilePicture")
        .populate("portfolio");

    if (!reel) {
        throw new ApiError(404, "Reel not found");
    }

    res.status(200).json({
        success: true,
        reel,
    });
});

// ============ LIKE/UNLIKE REEL (Toggle) ============
export const toggleLike = asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
        throw new ApiError(404, "Reel not found");
    }

    const userId = req.user._id;
    const isLiked = reel.likes.includes(userId);

    if (isLiked) {
        // Unlike
        reel.likes = reel.likes.filter((id) => id.toString() !== userId.toString());
    } else {
        // Like
        reel.likes.push(userId);
    }

    reel.likesCount = reel.likes.length;
    await reel.save();

    res.status(200).json({
        success: true,
        liked: !isLiked,
        likesCount: reel.likesCount,
    });
});

// ============ INCREMENT VIEW COUNT ============
export const incrementView = asyncHandler(async (req, res) => {
    const reelId = req.params.id;
    
    console.log(`[VIEW] Attempting to increment view for reel: ${reelId}`);
    
    // Simply increment view count - no complex tracking to ensure it works
    const reel = await Reel.findByIdAndUpdate(
        reelId,
        { $inc: { viewsCount: 1 } },
        { new: true }
    );

    if (!reel) {
        console.log(`[VIEW] Reel not found: ${reelId}`);
        return res.status(404).json({ success: false, message: "Reel not found" });
    }

    console.log(`[VIEW] Successfully incremented. New viewsCount: ${reel.viewsCount}`);

    res.status(200).json({
        success: true,
        viewsCount: reel.viewsCount,
    });
});

// ============ GET COMMENTS ============
export const getComments = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
        Comment.find({ reel: req.params.id })
            .populate("user", "name profilePicture")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Comment.countDocuments({ reel: req.params.id }),
    ]);

    res.status(200).json({
        success: true,
        comments,
        pagination: {
            page,
            limit,
            total,
            hasMore: page * limit < total,
        },
    });
});

// ============ ADD COMMENT ============
export const addComment = asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
        throw new ApiError(400, "Comment text is required");
    }

    if (text.length > 500) {
        throw new ApiError(400, "Comment cannot exceed 500 characters");
    }

    const reel = await Reel.findById(req.params.id);
    if (!reel) {
        throw new ApiError(404, "Reel not found");
    }

    const comment = await Comment.create({
        reel: req.params.id,
        user: req.user._id,
        text: text.trim(),
    });

    // Update comments count
    reel.commentsCount = await Comment.countDocuments({ reel: req.params.id });
    await reel.save();

    const populatedComment = await Comment.findById(comment._id).populate(
        "user",
        "name profilePicture"
    );

    res.status(201).json({
        success: true,
        comment: populatedComment,
        commentsCount: reel.commentsCount,
    });
});

// ============ GET REELS BY EDITOR ============
export const getReelsByEditor = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [reels, total] = await Promise.all([
        Reel.find({ editor: userId, isPublished: true })
            .populate("editor", "name profilePicture")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Reel.countDocuments({ editor: userId, isPublished: true }),
    ]);

    res.status(200).json({
        success: true,
        reels,
        pagination: {
            page,
            limit,
            total,
            hasMore: page * limit < total,
        },
    });
});

// ============ CHECK IF PORTFOLIO IS PUBLISHED ============
export const checkPublished = asyncHandler(async (req, res) => {
    const { portfolioId } = req.params;

    const reel = await Reel.findOne({ portfolio: portfolioId });

    res.status(200).json({
        success: true,
        isPublished: !!reel,
        reelId: reel?._id || null,
    });
});

// ============ GET MY REELS ANALYTICS (For Editor Dashboard) ============
export const getMyReelsAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    // Get all reels by this editor with full stats
    const reels = await Reel.find({ editor: userId })
        .populate("portfolio", "title")
        .sort({ createdAt: -1 })
        .select("title description mediaUrl mediaType viewsCount likesCount commentsCount watchTimeSeconds uniqueViewers createdAt isPublished");
    
    // Calculate aggregate stats
    const totalViews = reels.reduce((sum, r) => sum + (r.viewsCount || 0), 0);
    const totalLikes = reels.reduce((sum, r) => sum + (r.likesCount || 0), 0);
    const totalComments = reels.reduce((sum, r) => sum + (r.commentsCount || 0), 0);
    const totalWatchTime = reels.reduce((sum, r) => sum + (r.watchTimeSeconds || 0), 0);
    const uniqueReach = new Set(reels.flatMap(r => r.uniqueViewers || [])).size;
    
    // Calculate engagement rate (likes + comments) / views * 100
    const engagementRate = totalViews > 0 
        ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(2) 
        : 0;
    
    // Format reels for response (remove uniqueViewers array for privacy)
    const formattedReels = reels.map(r => ({
        _id: r._id,
        title: r.title,
        description: r.description,
        mediaUrl: r.mediaUrl,
        mediaType: r.mediaType,
        viewsCount: r.viewsCount || 0,
        likesCount: r.likesCount || 0,
        commentsCount: r.commentsCount || 0,
        watchTimeMinutes: Math.round((r.watchTimeSeconds || 0) / 60),
        uniqueViewers: r.uniqueViewers?.length || 0,
        createdAt: r.createdAt,
        isPublished: r.isPublished,
    }));
    
    res.status(200).json({
        success: true,
        analytics: {
            totalReels: reels.length,
            totalViews,
            totalLikes,
            totalComments,
            totalWatchTimeMinutes: Math.round(totalWatchTime / 60),
            uniqueReach,
            engagementRate: parseFloat(engagementRate),
        },
        reels: formattedReels,
    });
});
