import { Reel } from "../models/Reel.js";
import { Comment } from "../models/Comment.js";
import { Portfolio } from "../../profiles/models/Portfolio.js";
import { ReelInteraction } from "../models/ReelInteraction.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import logger from "../../../utils/logger.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";
import mongoose from "mongoose";
import { getCache, setCache, delPattern } from "../../../config/redisClient.js";
import redisClient, { redisAvailable } from "../../../config/redisClient.js";
import { weightedReservoirSample, compositeScore, enforceCreatorDiversity } from "../utils/reelScorer.js";
import { markSeen, hasSeen, clearSeen } from "../utils/reelBloomFilter.js";
import { trackInterest, getUserInterests } from "../../../utils/userInterestTracker.js";
import trieInstance from "../utils/reelSearchTrie.js";

// Scoreboard Redis key — persistent global sorted set of reel scores
const SCORE_BOARD_KEY = "reels:score:board";
const SCORE_BOARD_TTL = 60 * 60 * 24; // 24 hours

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

    // Restrict Editors to publish only if profile is 100% complete
    if (req.user.role === 'editor' && !req.user.profileCompleted) {
        throw new ApiError(400, "Please complete your profile (100%) before publishing to Reels");
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
        hashtags: portfolio.hashtags || [],
        location: portfolio.location || "",
        taggedUsers: portfolio.taggedUsers || [],
        isAIContent: portfolio.isAIContent || false,
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

    // Invalidate reels feed cache
    await delPattern("reels:feed:*");

    // — Index in Search TRIE (O(L) performance) —
    trieInstance.insert(reel.title, { id: reel._id, type: 'title', display: reel.title });
    if (reel.hashtags) {
        reel.hashtags.forEach(tag => {
            const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
            trieInstance.insert(cleanTag, { id: reel._id, type: 'hashtag', display: cleanTag });
        });
    }
    if (req.user.name) {
        trieInstance.insert(req.user.name, { id: reel._id, type: 'user', display: req.user.name });
    }

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

    // Invalidate reels feed cache
    await delPattern("reels:feed:*");

    res.status(200).json({
        success: true,
        message: "Reel unpublished successfully",
    });
});

// ============ GET REELS FEED (DSA-Optimized: Wilson Score + Reservoir Sampling + Bloom Filter) ============
export const getReelsFeed = asyncHandler(async (req, res) => {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const targetReelId = req.query.id;
    const userId = req.user?._id?.toString() || null;

    // Legacy exclude-IDs support (kept for frontend backward-compat)
    let excludeIds = req.query.exclude ? req.query.exclude.split(",").filter(id => id) : [];

    console.log(`[FEED] Fetching - page:${page} limit:${limit} user:${userId || 'anon'} target:${targetReelId || 'none'}`);

    // ── STEP 1: Simple cache for anonymous / page-1 requests ──────────────────
    // We still cache page-1 anonymous feeds as a hot path.
    const anonCacheKey = `reels:feed:v4:p${page}:l${limit}`;
    if (!userId && !targetReelId) {
        const cached = await getCache(anonCacheKey);
        if (cached) return res.status(200).json(cached);
    }

    const excludeObjectIds = excludeIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));

    // ── STEP 2: Try Redis Sorted Set as candidate pool (O(log N) lookup) ──────
    // If the scoreboard has enough candidates, skip the heavy DB aggregation.
    let candidateReels = [];
    const boardSize = redisAvailable ? await redisClient.zCard(SCORE_BOARD_KEY) : 0;

    if (boardSize >= limit * 3) {
        // Pull top 100 candidates from the sorted set (fast, O(log N + 100))
        const topIds = await redisClient.zRevRange(SCORE_BOARD_KEY, 0, 99);
        if (topIds.length > 0) {
            const validIds = topIds
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));

            // Fetch lightweight projection from DB (IDs already known, so it's a point lookup)
            candidateReels = await Reel.find(
                { _id: { $in: validIds }, isPublished: true },
                { _id: 1, likesCount: 1, viewsCount: 1, commentsCount: 1, createdAt: 1,
                  mediaUrl: 1, mediaType: 1, title: 1, description: 1, editor: 1, portfolio: 1, likes: 1,
                  avgCompletionRate: 1, completionSampleCount: 1, skipCount: 1, reWatchCount: 1, hashtags: 1 }
            ).lean();

            logger.debug(`[FEED] Scoreboard hit: ${candidateReels.length} candidates from Redis`);
        }
    }

    // ── STEP 3: Fall back to DB aggregation if scoreboard is cold ──────────────
    if (candidateReels.length < limit) {
        logger.debug('[FEED] Scoreboard cold or small — falling back to DB aggregation');
        const dbMatch = {
            isPublished: true,
            ...(excludeObjectIds.length > 0 && { _id: { $nin: excludeObjectIds } }),
        };
        // Lightweight projection — no lookup joins yet, just the data needed to score
        candidateReels = await Reel.find(dbMatch, {
            _id: 1, likesCount: 1, viewsCount: 1, commentsCount: 1, createdAt: 1,
            mediaUrl: 1, mediaType: 1, title: 1, description: 1, editor: 1, portfolio: 1, likes: 1,
            avgCompletionRate: 1, completionSampleCount: 1, skipCount: 1, reWatchCount: 1, hashtags: 1
        }).limit(200).lean();
    }

    // ── STEP 4: Bloom Filter — filter out already-seen reels ──────────────────
    // O(k) per reel — k=3 Redis GETBIT calls per item
    let filteredCandidates = candidateReels;
    if (userId) {
        const seenChecks = await Promise.all(
            candidateReels.map(r => hasSeen(userId, r._id.toString()))
        );
        filteredCandidates = candidateReels.filter((_, i) => !seenChecks[i]);

        // If bloom filter removed too many, reset it (feed wrap-around)
        if (filteredCandidates.length < limit && candidateReels.length >= limit) {
            logger.debug(`[FEED] Bloom filter wrapped — clearing seen history for user ${userId}`);
            await clearSeen(userId);
            filteredCandidates = candidateReels;
        }
    }

    // ── STEP 1.5: Fetch Social Graph for personalization ──────────────────────
    // Get the Set of editor IDs the user follows. Cached 10 mins per user.
    // Used to give a 1.5× boost to reels from followed creators.
    let followedIds = null;
    if (userId) {
        const socialCacheKey = `user:following:${userId}`;
        let followedSet = await getCache(socialCacheKey);
        if (!followedSet) {
            // Pull from User model (following array)
            const userDoc = await mongoose.model('User').findById(userId, { following: 1 }).lean();
            followedSet = userDoc?.following?.map(id => id.toString()) || [];
            await setCache(socialCacheKey, followedSet, 600); // Cache 10 min
        }
        followedIds = new Set(followedSet);
        logger.debug(`[FEED] Social graph: user ${userId} follows ${followedIds.size} editors`);
    }

    // ── STEP 1.7: Fetch User Interest Vector for ranking ──────────────────────
    let userInterests = null;
    if (userId) {
        userInterests = await getUserInterests(userId);
        logger.debug(`[FEED] Personalization: user ${userId} has ${Object.keys(userInterests).length} affinity signals`);
    }

    // ── STEP 5: Weighted Reservoir Sampling — diversity-aware selection ────────
    // A-Chao algorithm: O(N log K) time, O(K) space
    // Pass followedIds for social graph boost AND userInterests for personalization boost
    const sampledReels = weightedReservoirSample(filteredCandidates, limit * 2, (r) => compositeScore(r, followedIds, userInterests));

    // ── STEP 5b: Creator Diversity — max 2 reels from same editor per batch ────
    // Instagram rule: you shouldn't see 3+ reels from the same creator in one scroll
    const diverseReels = enforceCreatorDiversity(sampledReels, 2).slice(0, limit);

    // ── STEP 6: If target reel requested, prepend it ───────────────────────────
    let finalReels = diverseReels;
    if (targetReelId && !targetReelId.startsWith("ad_")) {
        try {
            if (!finalReels.some(r => r._id.toString() === targetReelId)) {
                const targetReel = await Reel.findById(targetReelId)
                    .populate("editor", "name email profilePicture role")
                    .populate("portfolio")
                    .lean();
                if (targetReel) finalReels = [targetReel, ...finalReels.slice(0, limit - 1)];
            }
        } catch { /* ignore */ }
    }

    // ── STEP 7: Full population (editor + portfolio) via targeted lookups ──────
    const reelIds = finalReels.map(r => r._id);
    const populatedReels = await Reel.aggregate([
        { $match: { _id: { $in: reelIds } } },
        {
            $addFields: {
                editorId: {
                    $cond: {
                        if: { $eq: [{ $type: "$editor" }, "string"] },
                        then: { $toObjectId: "$editor" },
                        else: { $cond: { if: { $eq: [{ $type: "$editor" }, "objectId"] }, then: "$editor", else: { $ifNull: ["$editor._id", "$editor"] } } }
                    }
                }
            }
        },
        { $lookup: { from: "users", localField: "editorId", foreignField: "_id", as: "editorInfo" } },
        { $unwind: { path: "$editorInfo", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "portfolios", localField: "portfolio", foreignField: "_id", as: "portfolioInfo" } },
        { $unwind: { path: "$portfolioInfo", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1, title: 1, description: 1, mediaUrl: 1, mediaType: 1,
                likesCount: 1, viewsCount: 1, commentsCount: 1, createdAt: 1, likes: 1,
                editor: {
                    _id: { $ifNull: ["$editorInfo._id", "$editorId"] },
                    name: { $ifNull: ["$editorInfo.name", "Unknown Editor"] },
                    profilePicture: { $ifNull: ["$editorInfo.profilePicture", null] },
                    role: { $ifNull: ["$editorInfo.role", "editor"] }
                },
                portfolio: "$portfolioInfo",
            }
        }
    ]);

    // Preserve reservoir sample order (aggregate doesn't preserve input order)
    const reelMap = new Map(populatedReels.map(r => [r._id.toString(), r]));
    const orderedReels = reelIds.map(id => reelMap.get(id.toString())).filter(Boolean);

    const total = await Reel.countDocuments({ isPublished: true });
    const responseData = {
        success: true,
        reels: orderedReels,
        pagination: { page, limit, total, hasMore: total > 0 },
    };

    // Cache anonymous page-1 feeds (high traffic, low personalization)
    if (!userId && !targetReelId && orderedReels.length > 0) {
        await setCache(anonCacheKey, responseData, 60); // 60s TTL for anon feeds
    }

    logger.info(`[FEED] Returning ${orderedReels.length} reels. Candidates: ${candidateReels.length}. BoardSize: ${boardSize}`);
    res.status(200).json(responseData);
});

// ============ GET SINGLE REEL ============
export const getReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id)
        .populate("editor", "name email profilePicture role")
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
        reel.likes = reel.likes.filter((id) => id.toString() !== userId.toString());
    } else {
        reel.likes.push(userId);
    }

    reel.likesCount = reel.likes.length;
    await reel.save();

    // ── DSA: Sorted Set Scoreboard update (O(log N)) ─────────────────────────
    // Instead of nuking the entire feed cache, we update only this reel's score
    // in the Redis Sorted Set. The next feed request will get fresh scores
    // without any DB round trip for ranking.
    const updatedScore = compositeScore(reel);
    redisClient.zAdd(SCORE_BOARD_KEY, updatedScore, reel._id.toString()).catch(() => {});
    redisClient.expire(SCORE_BOARD_KEY, SCORE_BOARD_TTL).catch(() => {});

    res.status(200).json({
        success: true,
        liked: !isLiked,
        likesCount: reel.likesCount,
    });

    // Send Notification for Like (Non-blocking)
    if (!isLiked && reel.editor.toString() !== userId.toString()) {
        createNotification({
            recipient: reel.editor,
            type: "reel_like",
            sender: userId,
            title: "New Like! ❤️",
            message: `${req.user.name} liked your reel "${reel.title}"`,
            link: `/reels?id=${reel._id}`,
            metaData: {
                reelId: reel._id,
                thumbnail: reel.mediaUrl,
                mediaType: reel.mediaType,
                type: "reel_like"
            }
        }).catch(err => console.error("Reel like notification failed:", err));
    }
});

// ============ INCREMENT VIEW COUNT ============
export const incrementView = asyncHandler(async (req, res) => {
    const reelId = req.params.id;
    const userId = req.user?._id?.toString() || null;
    
    const reel = await Reel.findByIdAndUpdate(
        reelId,
        { $inc: { viewsCount: 1 } },
        { new: true }
    );

    if (!reel) {
        return res.status(404).json({ success: false, message: "Reel not found" });
    }

    // ── DSA: Bloom Filter — Mark this reel as seen for this user ─────────────
    // O(k) — k=3 Redis SETBIT calls. Prevents this reel from showing again
    // in the personalized feed until the user has cycled through all reels.
    if (userId) {
        markSeen(userId, reelId).catch(() => {});
    }

    // ── DSA: Sorted Set Scoreboard update (O(log N)) ─────────────────────────
    // Update the reel's position in the global score board without cache invalidation.
    const updatedScore = compositeScore(reel);
    redisClient.zAdd(SCORE_BOARD_KEY, updatedScore, reelId).catch(() => {});
    redisClient.expire(SCORE_BOARD_KEY, SCORE_BOARD_TTL).catch(() => {});

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
    const parentComment = req.query.parentComment; // Get the raw query param
    const parentCommentQuery = (parentComment && parentComment !== "null") 
        ? new mongoose.Types.ObjectId(parentComment) 
        : null;

    const query = { 
        reel: req.params.id,
        parentComment: parentCommentQuery 
    };

    const [comments, total] = await Promise.all([
        Comment.aggregate([
            { $match: { reel: new mongoose.Types.ObjectId(req.params.id), parentComment: parentCommentQuery } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "parentComment",
                    as: "replies",
                },
            },
            {
                $addFields: {
                    repliesCount: { $size: "$replies" },
                    isLiked: {
                        $cond: {
                            if: { $and: [
                                { $literal: !!req.user }, 
                                { $in: [new mongoose.Types.ObjectId(req.user?._id || new mongoose.Types.ObjectId()), { $ifNull: ["$likes", []] }] }
                            ] },
                            then: true,
                            else: false,
                        },
                    },
                },
            },
            {
                $project: {
                    replies: 0,
                    "user.password": 0,
                    "user.email": 0,
                },
            },
        ]),
        Comment.countDocuments(query),
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
    const { text, parentCommentId } = req.body;

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

    let parentComment = null;
    if (parentCommentId) {
        const parent = await Comment.findById(parentCommentId);
        if (!parent) throw new ApiError(404, "Parent comment not found");
        
        // If the parent is itself a reply, point to its parent (flattening)
        parentComment = parent.parentComment || parent._id;
    }

    const comment = await Comment.create({
        reel: req.params.id,
        user: req.user._id,
        text: text.trim(),
        parentComment,
    });

    // Update comments count for the reel
    reel.commentsCount = await Comment.countDocuments({ reel: req.params.id });
    await reel.save();

    // Invalidate cache
    await delPattern("reels:feed:*");

    const populatedComment = await Comment.findById(comment._id).populate(
        "user",
        "name profilePicture"
    );

    res.status(201).json({
        success: true,
        comment: {
            ...populatedComment._doc,
            repliesCount: 0,
            isLiked: false,
        },
        commentsCount: reel.commentsCount,
    });

    // Send Notification for Comment (Non-blocking)
    if (reel.editor.toString() !== req.user._id.toString()) {
        createNotification({
            recipient: reel.editor,
            type: "reel_comment",
            sender: req.user._id,
            title: "New Comment! 💬",
            message: `${req.user.name} commented on your reel: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
            link: `/reels?id=${reel._id}&openComments=true`,
            metaData: {
                reelId: reel._id,
                thumbnail: reel.mediaUrl,
                mediaType: reel.mediaType,
                openComments: true,
                type: "reel_comment"
            }
        }).catch(err => console.error("Reel comment notification failed:", err));
    }
});

// ============ TOGGLE COMMENT LIKE ============
export const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const userId = req.user._id;
    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
        comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
    } else {
        comment.likes.push(userId);
    }

    comment.likesCount = comment.likes.length;
    await comment.save();

    res.status(200).json({
        success: true,
        liked: !isLiked,
        likesCount: comment.likesCount,
    });
});

// ============ GET REELS BY EDITOR ============
export const getReelsByEditor = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [reels, total] = await Promise.all([
        Reel.find({ editor: userId, isPublished: true }, {
            _id: 1, title: 1, description: 1, mediaUrl: 1, mediaType: 1,
            likesCount: 1, viewsCount: 1, commentsCount: 1, createdAt: 1,
            editor: 1, portfolio: 1
        })
            .populate("editor", "name profilePicture role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
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
        .select("title description mediaUrl mediaType viewsCount likesCount commentsCount watchTimeSeconds uniqueViewers avgCompletionRate completionSampleCount skipCount reWatchCount recommendationScore hashtags createdAt isPublished")
        .lean();
    
    // Calculate aggregate stats
    const totalViews = reels.reduce((sum, r) => sum + (r.viewsCount || 0), 0);
    const totalLikes = reels.reduce((sum, r) => sum + (r.likesCount || 0), 0);
    const totalComments = reels.reduce((sum, r) => sum + (r.commentsCount || 0), 0);
    const totalWatchTime = reels.reduce((sum, r) => sum + (r.watchTimeSeconds || 0), 0);
    const uniqueReach = new Set(reels.flatMap(r => r.uniqueViewers || [])).size;
    
    const avgCompletion = reels.length > 0
        ? (reels.reduce((sum, r) => sum + (r.avgCompletionRate || 0), 0) / reels.length).toFixed(2)
        : 0;

    // Calculate engagement rate (likes + comments) / views * 100
    const engagementRate = totalViews > 0 
        ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(2) 
        : 0;
    
    // Summary payload
    const summary = {
        totalReels: reels.length,
        totalViews,
        totalLikes,
        totalComments,
        totalWatchTime,
        uniqueReach,
        avgCompletion: parseFloat(avgCompletion),
        engagementRate: parseFloat(engagementRate)
    };

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

// ============ GET UNIQUE TAGS FROM REELS ============
export const getReelTags = asyncHandler(async (req, res) => {
    // Get unique titles/descriptions and split into words
    const reels = await Reel.find({ isPublished: true }).select("title description");
    
    const words = new Set();
    reels.forEach(r => {
        // Extract words from title
        if (r.title) {
            r.title.split(/\s+/).forEach(word => {
                const clean = word.replace(/[^\w#]/g, '').toLowerCase();
                if (clean.length > 2) words.add(clean.startsWith('#') ? clean : `#${clean}`);
            });
        }
        // Extract words from description
        if (r.description) {
            r.description.split(/\s+/).forEach(word => {
                const clean = word.replace(/[^\w#]/g, '').toLowerCase();
                if (clean.length > 1) words.add(clean.startsWith('#') ? clean : `#${clean}`);
            });
        }
    });

    // Limit to top 20 interesting tags
    const tags = Array.from(words).slice(0, 20);

    res.status(200).json({
        success: true,
        tags
    });
});

// ============ TRACK WATCH TIME — Bayesian Completion Averaging ============
// This is the most important signal. We update a rolling Bayesian average of
// how much of this reel users actually watch (0.0-1.0). Also tracks re-watches.
export const trackWatchTime = asyncHandler(async (req, res) => {
    const { id: reelId } = req.params;
    const { seconds, watchPercent } = req.body;
    const userId = req.user._id;

    if (!seconds || seconds <= 0) {
        return res.status(400).json({ success: false, message: "Invalid watch time" });
    }

    const completion = Math.max(0, Math.min(1, (watchPercent || 0) / 100));

    // Update ReelInteraction record for per-user tracking
    const existingInteraction = await ReelInteraction.findOne({ user: userId, reel: reelId });
    const isRewatch = !!existingInteraction;

    await ReelInteraction.findOneAndUpdate(
        { user: userId, reel: reelId },
        {
            $set:  { watchPercent: completion * 100, watched: true, updatedAt: new Date() },
            $inc:  { watchTimeSeconds: seconds },
        },
        { upsert: true, new: true }
    );

    // -- Bayesian Running Average Update for avgCompletionRate --
    // Formula: new_avg = (old_avg * n + new_sample) / (n + 1)
    // Using MongoDB $inc on sampleCount and computing server-side average:
    const reel = await Reel.findById(reelId);
    if (reel) {
        const oldAvg = reel.avgCompletionRate || 0;
        const oldN   = reel.completionSampleCount || 0;
        const newN   = oldN + 1;
        const newAvg = ((oldAvg * oldN) + completion) / newN;

        const updateFields = {
            avgCompletionRate:      newAvg,
            completionSampleCount:  newN,
            $inc: {
                watchTimeSeconds: seconds,
                reWatchCount: isRewatch ? 1 : 0,
            },
        };

        await Reel.findByIdAndUpdate(reelId, {
            avgCompletionRate:     newAvg,
            completionSampleCount: newN,
            $inc: {
                watchTimeSeconds: seconds,
                reWatchCount: isRewatch ? 1 : 0,
            },
        });

        // Track Interest (weight depends on completion %)
        if (req.user) {
            const interestWeight = completion >= 0.8 ? 2 : (completion >= 0.3 ? 1 : 0);
            if (interestWeight > 0) {
                trackInterest(req.user._id, reel.hashtags, reel.editor, interestWeight);
            }
        }

        // Recompute and cache recommendation score in DB + Redis Sorted Set
        const updatedReel = { ...reel.toObject(), avgCompletionRate: newAvg, completionSampleCount: newN };
        const newScore = compositeScore(updatedReel);
        await Reel.findByIdAndUpdate(reelId, { recommendationScore: newScore });
        redisClient.zAdd(SCORE_BOARD_KEY, newScore, reelId.toString()).catch(() => {});
        redisClient.expire(SCORE_BOARD_KEY, SCORE_BOARD_TTL).catch(() => {});

        logger.debug(`[WATCH] Reel ${reelId}: completion=${(completion*100).toFixed(0)}%, newAvg=${(newAvg*100).toFixed(1)}%, score=${newScore.toFixed(3)}`);
    }

    res.status(200).json({ success: true });
});

// ============ TRACK SKIP — Negative Signal ============
// Called when a user scrolls past a reel in < 2 seconds (strong "not interested" signal)
// Used by Instagram and TikTok as a heavy negative ranking factor.
export const trackSkip = asyncHandler(async (req, res) => {
    const { id: reelId } = req.params;
    const userId = req.user?._id?.toString() || null;

    const reel = await Reel.findByIdAndUpdate(
        reelId,
        { $inc: { skipCount: 1 } },
        { new: true }
    );

    if (!reel) return res.status(404).json({ success: false, message: "Reel not found" });

    // Also mark as seen in Bloom Filter (skipped = definitely seen)
    if (userId) {
        markSeen(userId, reelId).catch(() => {});
    }

    // Recompute score with updated skip count (penalizes ranking)
    const newScore = compositeScore(reel);
    await Reel.findByIdAndUpdate(reelId, { recommendationScore: newScore });
    redisClient.zAdd(SCORE_BOARD_KEY, newScore, reelId.toString()).catch(() => {});

    res.status(200).json({ success: true });
});

// ============ BATCH ANALYTICS — Product-Grade Network Efficiency ============
// This handles multiple watch-time and skip events in a single hit.
// Reduces server hits by ~90% for active scrollers.
export const batchAnalytics = asyncHandler(async (req, res) => {
    const { events } = req.body; // Array of { reelId, seconds, watchPercent, type }
    if (!Array.isArray(events)) return res.status(400).json({ success: false });

    const userId = req.user?._id;

    // Process all events in parallel for maximum speed
    await Promise.all(events.map(async (event) => {
        try {
            const { reelId, seconds, watchPercent, type } = event;
            if (!reelId) return;

            // 1. Mark as seen in Bloom Filter for ALL interaction types
            if (userId) markSeen(userId, reelId).catch(() => {});

            if (type === 'skip') {
                const reel = await Reel.findByIdAndUpdate(reelId, { $inc: { skipCount: 1 } }, { new: true });
                if (reel) {
                    const newScore = compositeScore(reel);
                    await Reel.findByIdAndUpdate(reelId, { recommendationScore: newScore });
                    redisClient.zAdd(SCORE_BOARD_KEY, newScore, reelId).catch(() => {});
                }
            } 
            else if (type === 'watch' && seconds > 0) {
                const completion = Math.max(0, Math.min(1, (watchPercent || 0) / 100));
                
                // Update per-user interaction record
                await ReelInteraction.findOneAndUpdate(
                    { user: userId, reel: reelId },
                    { $set: { watchPercent: completion * 100, watched: true, updatedAt: new Date() }, $inc: { watchTimeSeconds: seconds } },
                    { upsert: true }
                );

                const reel = await Reel.findById(reelId);
                if (reel) {
                    const oldAvg = reel.avgCompletionRate || 0;
                    const oldN   = reel.completionSampleCount || 0;
                    const newN   = oldN + 1;
                    const newAvg = ((oldAvg * oldN) + completion) / newN;
                    
                    const isRewatch = seconds > (reel.duration || 10); // Simple heuristic if we don't have duration here

                    const updateFields = {
                        avgCompletionRate: newAvg,
                        completionSampleCount: newN,
                        $inc: { watchTimeSeconds: seconds, reWatchCount: isRewatch ? 1 : 0 }
                    };

                    const updatedReel = await Reel.findByIdAndUpdate(reelId, updateFields, { new: true });
                    
                    // Personalization: Update interest vector
                    const interestWeight = completion >= 0.8 ? 2 : (completion >= 0.3 ? 1 : 0);
                    if (interestWeight > 0 && userId) {
                        trackInterest(userId, reel.hashtags, reel.editor, interestWeight).catch(() => {});
                    }

                    // Recompute recommendation score
                    const newScore = compositeScore(updatedReel);
                    await Reel.findByIdAndUpdate(reelId, { recommendationScore: newScore });
                    redisClient.zAdd(SCORE_BOARD_KEY, newScore, reelId).catch(() => {});
                }
            }
        } catch (err) {
            console.error("Batch processing error for event:", event, err);
        }
    }));

    res.status(200).json({ success: true, processed: events.length });
});

// ============ SEARCH AUTOCOMPLETE (TRIE O(L)) ============
export const getSearchSuggestions = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 1) return res.status(200).json({ success: true, suggestions: [] });

    const suggestions = trieInstance.suggest(q, 10);
    res.status(200).json({ success: true, suggestions });
});

/**
 * Initialize the Search TRIE on server startup.
 * Fetches all published reels once and builds the in-memory prefix tree.
 * O(N * L) startup cost, but results in O(L) search for the entire server uptime.
 */
export const initSearchTrie = async () => {
    try {
        const reels = await Reel.find({ isPublished: true }).populate("editor", "name").lean();
        trieInstance.clear();
        
        let count = 0;
        reels.forEach(reel => {
            // Index Title
            trieInstance.insert(reel.title, { id: reel._id, type: 'title', display: reel.title });
            
            // Index Hashtags
            if (reel.hashtags) {
                reel.hashtags.forEach(tag => {
                    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
                    trieInstance.insert(cleanTag, { id: reel._id, type: 'hashtag', display: cleanTag });
                });
            }

            // Index User (Editor)
            if (reel.editor?.name) {
                trieInstance.insert(reel.editor.name, { id: reel._id, type: 'user', display: reel.editor.name });
            }
            count++;
        });

        logger.info(`[SearchTRIE] Initialized with ${count} reels. Autocomplete is ready ✅`);
    } catch (err) {
        if (logger && logger.error) {
            logger.error("[SearchTRIE] Failed to initialize:", err.message);
        } else {
            console.error("[SearchTRIE] Failed to initialize:", err.message);
        }
    }
};






