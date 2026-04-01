import { Reel } from "../models/Reel.js";
import { Comment } from "../models/Comment.js";
import { Portfolio } from "../../profiles/models/Portfolio.js";
import { ReelInteraction } from "../models/ReelInteraction.js";
import { ReelSave } from "../models/ReelSave.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import logger from "../../../utils/logger.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";
import mongoose from "mongoose";
import { getCache, setCache, delPattern } from "../../../config/redisClient.js";
import redisClient, { redisAvailable } from "../../../config/redisClient.js";
import { weightedReservoirSample, compositeScore, enforceCreatorDiversity, calculateFreshnessBoost, wilsonScore } from "../utils/reelScorer.js";
import { markSeen, hasSeen, clearSeen } from "../utils/reelBloomFilter.js";
import { trackInterest, getUserInterests, getPersonalizationBoost } from "../../../utils/userInterestTracker.js";
import { trackTrendingInteraction } from "../../../utils/trendingTracker.js";
import trieInstance from "../utils/reelSearchTrie.js";
import { purgeReelsFeedCache } from "../../../utils/cloudflareService.js";
import { videoProcessingQueue, analyticsQueue } from "../../../config/queues.js";
import { getCollaborativeAffinities } from "../utils/recsysEngine.js";

// Scoreboard Redis key — persistent global sorted set of reel scores
const SCORE_BOARD_KEY = "reels:score:board";
const SCORE_BOARD_TTL = 60 * 60 * 24; // 24 hours

// Collaborative Filtering keys
const REEL_CO_VIEWERS_PREFIX = "reels:co_viewers:";
const REEL_CO_VIEWERS_TTL = 60 * 60 * 24 * 30; // 30 days

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
        hlsUrl: portfolio.hlsUrl || "",
        thumbnailUrl: portfolio.thumbnailUrl || "",
        duration: portfolio.duration || 0,
        processingStatus: portfolio.processingStatus || "pending",
        cloudinaryPublicId: portfolio.cloudinaryPublicId || "",
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
    purgeReelsFeedCache().catch(() => {}); // Cloudflare Edge Purge

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
    purgeReelsFeedCache().catch(() => {}); // Cloudflare Edge Purge

    res.status(200).json({
        success: true,
        message: "Reel unpublished successfully",
    });
});

// ============ GET REELS FEED (DSA-Optimized: Wilson Score + Reservoir Sampling + Bloom Filter) ============
export const getReelsFeed = asyncHandler(async (req, res) => {
    // ── STEP 1: Discovery Engine Core (Phase 30.2) ──
    const { page = 1, limit = 10, exclude = "", sessionSeed = "" } = req.query;
    const targetReelId = req.query.id;
    const userId = req.user?._id?.toString() || null;

    // DETERMINISTIC RANDOMIZATION: Derived from User + Session
    const uniqueSeed = (userId || "anon") + (sessionSeed || "global");

    // VARIETY BOOST: random offset to vary the candidate pool
    let randomSkip = 0;
    if (sessionSeed) {
        // Simple PRNG for deterministic skip based on sessionSeed
        const hashedSeed = sessionSeed.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
        randomSkip = Math.abs(hashedSeed % 5); // Skip up to 5 items
    }

    const excludeIds = exclude ? exclude.split(",").filter(id => id.length === 24) : [];
    const excludeObjectIds = excludeIds.map(id => new mongoose.Types.ObjectId(id));

    // ── STEP 1: Cache (Skip for personalized or seeded requests) ──────────────
    const anonCacheKey = `reels:feed:v4:p${page}:l${limit}`;
    if (!userId && !targetReelId && !sessionSeed) {
        const cached = await getCache(anonCacheKey);
        if (cached) return res.status(200).json(cached);
    }

    // ── STEP 2: Candidate Selection ──────────────────────────────────────────
    const dbMatch = {
        isPublished: true,
        ...(excludeObjectIds.length > 0 && { _id: { $nin: excludeObjectIds } }),
    };

    let candidateReels = await Reel.find(dbMatch)
        .populate("editor", "name profilePicture bio followingCount followersCount")
        .sort({ createdAt: -1 })
        .skip(randomSkip)
        .limit(100)
        .lean();

    if (!candidateReels.length && excludeObjectIds.length > 0) {
        // Fallback if exclusion cleared the pool
        candidateReels = await Reel.find({ isPublished: true }).limit(100).lean();
    }

    // ── STEP 3: Bloom Filter / Seen Filter (Discovery Enforcement) ──────────────
    let filteredCandidates = candidateReels;
    
    if (userId && userId !== "anon") {
        const filters = await Promise.all(
            candidateReels.map(r => hasSeen(userId, r._id.toString()))
        );
        // Filter out reels already marked in the Bloom Filter
        filteredCandidates = candidateReels.filter((_, i) => !filters[i]);
        
        // Safety: If the filter wipes out everything, return the original candidates
        // but shuffle them differently (fallback mode)
        if (filteredCandidates.length === 0 && candidateReels.length > 0) {
            filteredCandidates = candidateReels.slice(0, limitNum * 2);
        }
    }
    
    // ── STEP 4: Personalization Signals ──────────────────────────────────────
    let followedIds = null;
    if (userId && userId !== "anon" && mongoose.Types.ObjectId.isValid(userId)) {
        const socialCacheKey = `user:following:${userId}`;
        let followedSet = await getCache(socialCacheKey);
        if (!followedSet) {
            const userDoc = await mongoose.model('User').findById(userId, { following: 1 }).lean();
            followedSet = userDoc?.following?.map(id => id.toString()) || [];
            await setCache(socialCacheKey, followedSet, 600);
        }
        followedIds = new Set(followedSet);
    }

    let userInterests = null;
    if (userId && userId !== "anon" && mongoose.Types.ObjectId.isValid(userId)) {
        userInterests = await getUserInterests(userId);
    }

    // ── STEP 5: Scoring & Final Shuffle ──────────────────────────────────────
    const limitNum = parseInt(limit) || 10;
    const sampledReels = weightedReservoirSample(filteredCandidates, limitNum * 3, (r) => {
        // Core score based on engagement
        let score = (r.likesCount || 0) * 1.5 + (r.viewsCount || 0) * 0.5 + 1;
        
        // FRESHNESS BOOST: Give new reels a massive multiplier (up to 20x)
        const freshnessBoost = calculateFreshnessBoost(r);
        score *= freshnessBoost;
        
        if (followedIds && followedIds.has(r.editor?.toString() || r.editor?._id?.toString())) {
            score *= 1.5;
        }
        if (userInterests && r.hashtags) {
            r.hashtags.forEach(tag => {
                if (userInterests[tag]) score *= (1 + userInterests[tag] * 0.5);
            });
        }
        return score;
    }, followedIds, uniqueSeed);

    // ── STEP 7: Full population via targeted lookups ──────────────────────────
    const finalReels = sampledReels.slice(0, limitNum);
    const reelIds = finalReels.map(r => r._id);
    
    // Safety check for userId to avoid BSON error in aggregation
    const validUserIdForAggregation = (userId && mongoose.Types.ObjectId.isValid(userId)) 
        ? new mongoose.Types.ObjectId(userId) 
        : new mongoose.Types.ObjectId(); // Fallback to random ID for non-matching $in check

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
            $addFields: {
                isLiked: {
                    $cond: {
                        if: { $in: [validUserIdForAggregation, "$likes"] },
                        then: true,
                        else: false
                    }
                },
                latestLikerIds: { $slice: ["$likes", -3] }
            }
        },
        { $lookup: { from: "users", localField: "latestLikerIds", foreignField: "_id", as: "latestLikeUsers" } },
        {
            $project: {
                _id: 1, title: 1, description: 1, mediaUrl: 1, mediaType: 1,
                hlsUrl: 1, thumbnailUrl: 1, duration: 1, processingStatus: 1,
                likesCount: 1, viewsCount: 1, commentsCount: 1, createdAt: 1,
                isLiked: 1,
                latestLikers: {
                    $map: {
                        input: "$latestLikeUsers",
                        as: "u",
                        in: {
                            _id: "$$u._id",
                            name: "$$u.name",
                            profilePicture: "$$u.profilePicture"
                        }
                    }
                },
                editor: {
                    _id: { $ifNull: ["$editorInfo._id", "$editorId"] },
                    name: { $ifNull: ["$editorInfo.name", "Unknown Editor"] },
                    profilePicture: { $ifNull: ["$editorInfo.profilePicture", null] },
                    role: { $ifNull: ["$editorInfo.role", "editor"] }
                },
                portfolio: { _id: "$portfolioInfo._id" }, // Slim down portfolio info
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

    // ── STEP 8: Caching Headers (Instagram-Scale Strategy) ────────────────────
    if (orderedReels.length > 0) {
        const latestReel = orderedReels[0].createdAt;
        if (latestReel) {
            res.setHeader('Last-Modified', new Date(latestReel).toUTCString());
        }

        if (!userId) {
            // Anonymous feed: Cache on Cloudflare Edge for 60s, serve stale for 30s
            // This offloads ~90% of traffic from your Render server
            res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
            await setCache(anonCacheKey, responseData, 60); // Redis Level
        } else {
            // Personalized feed: Private cache only (browser only, NO Cloudflare)
            // Still allows the browser to check if the feed updated without re-downloading
            res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
        }
    }

    logger.info(`[FEED] Returning ${populatedReels.length} reels. Candidates: ${candidateReels.length}`);
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

    if (reel) {
        res.setHeader('Last-Modified', new Date(reel.createdAt).toUTCString());
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600'); 
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
        reel.likesCount = Math.max(0, reel.likesCount - 1);
    } else {
        reel.likes.push(userId);
        reel.likesCount += 1;
    }

    await reel.save();

    // Track trending (Weight: 5 for like)
    if (!isLiked) {
        trackTrendingInteraction(req.user.country, reel.language, reel.hashtags, 5).catch(() => {});
    }

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

// ============ SAVE/UNSAVE REEL (Toggle) — Phase 30A ============
export const toggleSave = asyncHandler(async (req, res) => {
    const { id: reelId } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) {
        throw new ApiError(404, "Reel not found");
    }

    const existingSave = await ReelSave.findOne({ user: userId, reel: reelId });

    if (existingSave) {
        // Unsave
        await ReelSave.findByIdAndDelete(existingSave._id);
        await Reel.findByIdAndUpdate(reelId, { $inc: { savesCount: -1 } });
    } else {
        // Save
        await ReelSave.create({ user: userId, reel: reelId });
        await Reel.findByIdAndUpdate(reelId, { $inc: { savesCount: 1 } });
    }

    // Refresh reel to get updated count for response
    const updatedReel = await Reel.findById(reelId, { savesCount: 1 }).lean();

    res.status(200).json({
        success: true,
        saved: !existingSave,
        savesCount: updatedReel.savesCount
    });

    // Track trending (Weight: 10 for save)
    if (!existingSave) {
        trackTrendingInteraction(req.user.country, reel.language, reel.hashtags, 10).catch(() => {});
    }
});

// ============ INCREMENT VIEW COUNT (Optimized) ============
export const incrementView = asyncHandler(async (req, res) => {
    const reelId = req.params.id;
    const userId = req.user?._id?.toString() || null;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const viewKey = `view:${reelId}:${ip}`;

    // 1. IP-based Deduplication (15m window)
    if (redisAvailable) {
        const hasViewed = await getCache(viewKey);
        if (hasViewed) {
            return res.status(200).json({ success: true, message: "View already counted recently", deduplicated: true });
        }
        await setCache(viewKey, "1", 60 * 15);
    }
    
    const reel = await Reel.findByIdAndUpdate(
        reelId,
        { $inc: { viewsCount: 1 } },
        { new: true }
    );

    if (!reel) {
        throw new ApiError(404, "Reel not found");
    }

    // ── BullMQ: Async Analytics & Scoring (Phase 30.2) ─────────────────────────
    // Offload heavy updates from the request/response cycle
    if (analyticsQueue) {
        analyticsQueue.add("view", { reelId, userId, ip, country: req.user?.country }).catch(() => {});
    }

    if (videoProcessingQueue) {
        videoProcessingQueue.add("REFRESH_SCORE", { reelId, action: "REFRESH_SCORE" }, { delay: 5000 }).catch(() => {});
    }

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

    const userIdReq = req.user?._id?.toString() || null;

    const [reels, total] = await Promise.all([
        Reel.aggregate([
            { $match: { editor: new mongoose.Types.ObjectId(userId), isPublished: true } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $addFields: {
                    isLiked: {
                        $cond: {
                            if: { $and: [{ $ne: [userIdReq, null] }, { $in: [new mongoose.Types.ObjectId(userIdReq || new mongoose.Types.ObjectId()), "$likes"] }] },
                            then: true,
                            else: false
                        }
                    },
                    latestLikerIds: { $slice: ["$likes", -3] }
                }
            },
            { $lookup: { from: "users", localField: "editor", foreignField: "_id", as: "editorInfo" } },
            { $unwind: "$editorInfo" },
            { $lookup: { from: "users", localField: "latestLikerIds", foreignField: "_id", as: "latestLikeUsers" } },
            {
                $project: {
                    _id: 1, title: 1, description: 1, mediaUrl: 1, mediaType: 1,
                    likesCount: 1, viewsCount: 1, commentsCount: 1, createdAt: 1,
                    isLiked: 1,
                    latestLikers: {
                        $map: {
                            input: "$latestLikeUsers",
                            as: "u",
                            in: {
                                _id: "$$u._id",
                                name: "$$u.name",
                                profilePicture: "$$u.profilePicture"
                            }
                        }
                    },
                    editor: {
                        _id: "$editorInfo._id",
                        name: "$editorInfo.name",
                        profilePicture: "$editorInfo.profilePicture",
                        role: "$editorInfo.role"
                    }
                }
            }
        ]),
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

    // Determine Interaction Depth
    let interactionDepth = 'impression';
    if (completion >= 1.0) interactionDepth = 'completed';
    else if (completion >= 0.8 || seconds >= 10) interactionDepth = 'full';
    else if (completion >= 0.3 || seconds >= 3) interactionDepth = 'soft';

    // Update ReelInteraction record for per-user tracking
    const existingInteraction = await ReelInteraction.findOne({ user: userId, reel: reelId });
    const isRewatch = !!existingInteraction;

    await ReelInteraction.findOneAndUpdate(
        { user: userId, reel: reelId },
        {
            $set: { 
                watchPercent: completion * 100, 
                watched: true, 
                interactionDepth,
                updatedAt: new Date() 
            },
            $inc: { watchTimeSeconds: seconds },
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

export const trackSkip = asyncHandler(async (req, res) => {
    const { id: reelId } = req.params;
    const userId = req.user?._id?.toString() || null;
    const { skipTime } = req.body; // Phase 30A: Track exactly when they skipped

    const reel = await Reel.findByIdAndUpdate(
        reelId,
        { $inc: { skipCount: 1 } },
        { new: true }
    );

    if (!reel) return res.status(404).json({ success: false, message: "Reel not found" });

    // Update interaction record with skip data
    if (userId) {
        await ReelInteraction.findOneAndUpdate(
            { user: userId, reel: reelId },
            { 
                $set: { 
                    skipped: true, 
                    skipTime: skipTime || 0,
                    updatedAt: new Date() 
                } 
            },
            { upsert: true }
        );
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
            else if (type === 'view') {
                // — Phase 4 Strategy: Flight-Batching Views —
                await Reel.findByIdAndUpdate(reelId, { $inc: { viewsCount: 1 } });
                if (userId) {
                    await ReelInteraction.findOneAndUpdate(
                        { user: userId, reel: reelId },
                        { $set: { viewed: true }, $setOnInsert: { createdAt: new Date() } },
                        { upsert: true }
                    );
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






/**
 * getSuggestedDiscovery (Phase 30.1)
 * @desc Returns "Suggested for You" creators and reels
 * @route GET /api/reels/suggestions/discovery
 */
export const getSuggestedDiscovery = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { limit = 5 } = req.query;

    // 1. Get user affinity
    const interests = userId ? await getUserInterests(userId) : {};
    
    // 2. SOCIAL: Who are you NOT following but have affinity with?
    let userDoc = null;
    let followingSet = new Set();
    if (userId) {
        userDoc = await mongoose.model('User').findById(userId, { following: 1 }).lean();
        followingSet = new Set(userDoc?.following?.map(id => id.toString()) || []);
    }
    
    // 3. COLLABORATIVE FILTERING (RecSys 2.0)
    let collaborativeIds = [];
    if (userId) {
        // Fetch last watched reel and its affinities
        const lastWatched = await redisClient.smembers(`user:history:${userId}`);
        if (lastWatched && lastWatched.length > 0) {
            const affinities = await getCollaborativeAffinities(lastWatched[lastWatched.length - 1], 20);
            collaborativeIds = affinities.map(a => new mongoose.Types.ObjectId(a.reelId));
        }
    }

    // 4. RETRIEVAL: High-performing reels from candidates the user hasn't seen
    const now = new Date();
    const candidateQuery = {
        isPublished: true,
        $or: [
            { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } }, // 1. Fresh content
            { _id: { $in: collaborativeIds } } // 2. Collaborative matches
        ]
    };
    
    const candidates = await Reel.find(candidateQuery)
    .sort({ viewsCount: -1 })
    .limit(100)
    .lean();

    // 4. RANKING: Use wilsonScore + Interest Match
    const scoredReels = candidates.map(r => ({
        ...r,
        hlsUrl: r.hlsUrl || null,
        processingStatus: r.processingStatus || 'complete',
        score: (wilsonScore(r.likesCount || 0, r.viewsCount || 0) * 0.7) + 
               (getPersonalizationBoost(r, interests) * 0.3)
    }))
    .sort((a, b) => b.score - a.score);

    // Filter out followed creators
    const suggestedReels = scoredReels
        .filter(r => !followingSet.has(r.editor?.toString()))
        .slice(0, limit);

    // 5. CREATOR SUGGESTIONS: Extract editors from high-score reels
    const editorIds = [...new Set(scoredReels.map(r => r.editor?.toString()))]
        .filter(id => id && !followingSet.has(id))
        .slice(0, 8);

    const editors = await mongoose.model('User').find({
        _id: { $in: editorIds },
        role: "editor"
    })
    .select("name profilePicture bio suvixScore")
    .lean();

    res.status(200).json({
        success: true,
        data: {
            suggestedCreators: editors,
            suggestedReels: suggestedReels.slice(0, 3) // Top 3 reels to highlight
        }
    });
});
