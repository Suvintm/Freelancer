import prisma from "../../../infrastructure/database/postgres.js";
import logger from "../../../infrastructure/monitoring/logger.js";
import { resolveMediaForApi, resolveAvatarUrl } from "../../../infrastructure/storage/media-resolver.js";
import { purgeMediaFiles } from "../../../infrastructure/storage/purge.utils.js";
import { withCache, hashQuery } from "../../../infrastructure/cache/cache.service.js";
import { toggleLike, getLikeCount } from "../services/like.service.js";

/**
 * 📝 CONTENT CONTROLLER (SOCIAL MODULE)
 *
 * Functions are organized by content type:
 *  - createPost         → Image Posts    (posts table)
 *  - createReel         → Video Reels    (reels table)
 *  - createYoutubePost  → YouTube Shares (youtube_posts table)
 *  - createPoll         → Polls          (polls table)
 *  - deletePost         → Delete image post + S3 purge
 *  - deleteReel         → Delete reel + S3 purge
 *  - getFeed            → Merged feed from all 4 content tables
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper: link media records to a content entity inside a transaction
// ─────────────────────────────────────────────────────────────────────────────
async function linkMedia(tx, mediaIds, userId, linkField, entityId) {
  if (!mediaIds || mediaIds.length === 0) return;
  await tx.media.updateMany({
    where: { id: { in: mediaIds }, userId },
    data: { [linkField]: entityId },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// USER (ALL ROLES) — Image Post Upload
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Create a new Image Post
 * @route   POST /api/social/posts
 */
export const createPost = async (req, res) => {
  try {
    const { caption, mediaIds, visibility = "PUBLIC" } = req.body;
    const userId = req.user.id;

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({ success: false, message: "At least one image is required for a post" });
    }

    const post = await prisma.$transaction(async (tx) => {
      const newPost = await tx.post.create({
        data: { userId, caption, visibility },
      });
      await linkMedia(tx, mediaIds, userId, "postId", newPost.id);
      return newPost;
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    logger.error(`❌ [CONTENT_CTRL] createPost failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to create post" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER (ALL ROLES) — Short-form Video Reel Upload
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Create a new Reel (short-form video)
 * @route   POST /api/social/reels
 */
export const createReel = async (req, res) => {
  try {
    const { caption, mediaIds, visibility = "PUBLIC" } = req.body;
    const userId = req.user.id;

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length !== 1) {
      return res.status(400).json({ success: false, message: "Exactly one video is required for a reel" });
    }

    const reel = await prisma.$transaction(async (tx) => {
      const newReel = await tx.reel.create({
        data: { userId, caption, visibility },
      });
      await linkMedia(tx, mediaIds, userId, "reelId", newReel.id);
      return newReel;
    });

    res.status(201).json({ success: true, data: reel });
  } catch (error) {
    logger.error(`❌ [CONTENT_CTRL] createReel failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to create reel" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// YOUTUBE CREATOR — YouTube Link Share Upload
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Create a new YouTube Post (link share with thumbnail)
 * @route   POST /api/social/posts/youtube
 */
export const createYoutubePost = async (req, res) => {
  try {
    const { caption, mediaIds, youtube_link, youtube_channel_id, visibility = "PUBLIC" } = req.body;
    const userId = req.user.id;

    if (!youtube_link || !youtube_channel_id) {
      return res.status(400).json({ success: false, message: "YouTube link and channel ID are required" });
    }

    const youtubePost = await prisma.$transaction(async (tx) => {
      const newYtPost = await tx.youtubePost.create({
        data: { userId, caption, youtube_link, youtube_channel_id, visibility },
      });
      // mediaIds here is the thumbnail (optional)
      if (mediaIds && mediaIds.length > 0) {
        await linkMedia(tx, mediaIds, userId, "youtubePostId", newYtPost.id);
      }
      return newYtPost;
    });

    res.status(201).json({ success: true, data: youtubePost });
  } catch (error) {
    logger.error(`❌ [CONTENT_CTRL] createYoutubePost failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to create YouTube post" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER (ALL ROLES) — Poll Upload
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Create a new standalone Poll
 * @route   POST /api/social/polls
 */
export const createPoll = async (req, res) => {
  try {
    const {
      question,
      caption,
      type = "MULTIPLE_CHOICE",
      layout = "STANDARD",
      show_response_count = true,
      visibility = "PUBLIC",
      options = [], // [{ text, order_index, mediaId? }]
    } = req.body;
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({ success: false, message: "Poll question is required" });
    }
    if (!options || options.length < 2) {
      return res.status(400).json({ success: false, message: "At least 2 poll options are required" });
    }

    const poll = await prisma.$transaction(async (tx) => {
      const newPoll = await tx.poll.create({
        data: {
          userId,
          question,
          caption,
          type,
          layout,
          show_response_count,
          visibility,
          options: {
            create: options.map((opt) => ({
              text: opt.text,
              order_index: opt.order_index,
              ...(opt.mediaId && { mediaId: opt.mediaId }),
            })),
          },
        },
        include: { options: true },
      });
      return newPoll;
    });

    res.status(201).json({ success: true, data: poll });
  } catch (error) {
    logger.error(`❌ [CONTENT_CTRL] createPoll failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to create poll" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Delete an Image Post and its media from S3
 * @route   DELETE /api/social/posts/:postId
 */
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { media: true },
    });

    if (!post || post.userId !== userId) {
      return res.status(404).json({ success: false, message: "Post not found or unauthorized" });
    }

    await Promise.all(post.media.map((m) => purgeMediaFiles(m)));
    await prisma.post.delete({ where: { id: postId } });

    res.json({ success: true, message: "Post and associated media permanently deleted." });
  } catch (error) {
    logger.error(`❌ [CONTENT_CTRL] deletePost failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to delete post" });
  }
};

/**
 * @desc    Delete a Reel and its video from S3
 * @route   DELETE /api/social/reels/:reelId
 */
export const deleteReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const userId = req.user.id;

    const reel = await prisma.reel.findUnique({
      where: { id: reelId },
      include: { media: true },
    });

    if (!reel || reel.userId !== userId) {
      return res.status(404).json({ success: false, message: "Reel not found or unauthorized" });
    }

    await Promise.all(reel.media.map((m) => purgeMediaFiles(m)));
    await prisma.reel.delete({ where: { id: reelId } });

    res.json({ success: true, message: "Reel and associated media permanently deleted." });
  } catch (error) {
    logger.error(`❌ [CONTENT_CTRL] deleteReel failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to delete reel" });
  }
};


import redisProxy from "../../../infrastructure/cache/redis.client.js";

const populateIsLiked = async (items, userId) => {
  if (!userId || !items || items.length === 0) return items;

  // 1. Pipeline check for cache existence AND membership
  const pipeline = redisProxy.pipeline();
  
  items.forEach(item => {
    // Determine type for Redis key
    let type = item.contentType;
    if (!type) {
      if (item.youtube_link) type = "YOUTUBE_POST";
      else if (item.question) type = "POLL";
      else if (item.media && item.media.some(m => m.type === "VIDEO")) type = "REEL";
      else type = "POST";
    }
    // Temporarily store resolved type for DB fallback
    item._resolvedType = type;
    
    // If the count key exists, the cache is warm. SISMEMBER is then 100% accurate.
    pipeline.exists(`feed:likes:count:${type}:${item.id}`);
    pipeline.sismember(`feed:likes:users:${type}:${item.id}`, userId);
  });

  const results = await pipeline.exec();

  const coldItems = { POST: [], REEL: [], YOUTUBE_POST: [], POLL: [] };

  // 2. Process Redis results
  items.forEach((item, index) => {
    const existsResult = results[index * 2][1];
    const sismemberResult = results[index * 2 + 1][1];

    if (existsResult === 1) {
      // Cache is warm
      item.isLiked = (sismemberResult === 1);
    } else {
      // Cache is cold (expired). We must ask Postgres.
      item.isLiked = false; // Default until DB check
      coldItems[item._resolvedType].push(item.id);
    }
  });

  // 3. Fallback to DB ONLY for items that were missing from Redis
  const dbQueries = [];
  
  if (coldItems.POST.length > 0) {
    dbQueries.push(prisma.postLike.findMany({ where: { userId, postId: { in: coldItems.POST } }, select: { postId: true } }).then(res => res.map(r => r.postId)));
  }
  if (coldItems.REEL.length > 0) {
    dbQueries.push(prisma.reelLike.findMany({ where: { userId, reelId: { in: coldItems.REEL } }, select: { reelId: true } }).then(res => res.map(r => r.reelId)));
  }
  if (coldItems.YOUTUBE_POST.length > 0) {
    dbQueries.push(prisma.youtubePostLike.findMany({ where: { userId, youtubePostId: { in: coldItems.YOUTUBE_POST } }, select: { youtubePostId: true } }).then(res => res.map(r => r.youtubePostId)));
  }
  if (coldItems.POLL.length > 0) {
    dbQueries.push(prisma.pollLike.findMany({ where: { userId, pollId: { in: coldItems.POLL } }, select: { pollId: true } }).then(res => res.map(r => r.pollId)));
  }

  if (dbQueries.length > 0) {
    const dbResults = await Promise.all(dbQueries);
    const likedInDbSet = new Set(dbResults.flat()); // Merge all found IDs
    
    items.forEach(item => {
      // If it was a cold item, update its status from the DB result
      if (coldItems[item._resolvedType].includes(item.id)) {
        item.isLiked = likedInDbSet.has(item.id);
      }
    });
  }

  // Cleanup temporary property
  items.forEach(item => delete item._resolvedType);

  return items;
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED FEED (Polymorphic merge)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Get unified social feed (all 4 content types, merged by created_at)
 * @route   GET /api/social/feed
 */
const MEDIA_SELECT = {
  where: { status: { in: ["READY", "PROCESSING"] } },
  select: { id: true, type: true, storageKey: true, variants: true, blurhash: true, width: true, height: true, duration: true, storage_provider: true },
};

const USER_SELECT = {
  select: {
    id: true,
    username: true,
    role: true,
    is_verified: true,
    profile: { select: { name: true, profile_picture: true } },
  },
};

export const getFeed = async (req, res) => {
  try {
    const { cursor, limit = 10 } = req.query;
    const take = parseInt(limit, 10);
    const cacheKey = `cache:feed:public:${hashQuery({ cursor, limit })}`;
    const TTL_SECONDS = 30;

    const feedData = await withCache(cacheKey, TTL_SECONDS, async () => {
      const dateFilter = cursor ? { created_at: { lt: new Date(cursor) } } : {};

      // Query all 4 content tables in parallel
      const [posts, reels, youtubePosts, polls] = await Promise.all([
        prisma.post.findMany({
          where: { visibility: "PUBLIC", is_ready: true, ...dateFilter },
          include: { user: USER_SELECT, media: MEDIA_SELECT },
          orderBy: { created_at: "desc" },
          take,
        }),
        prisma.reel.findMany({
          where: { visibility: "PUBLIC", is_ready: true, ...dateFilter },
          include: { user: USER_SELECT, media: MEDIA_SELECT },
          orderBy: { created_at: "desc" },
          take,
        }),
        prisma.youtubePost.findMany({
          where: { visibility: "PUBLIC", is_ready: true, ...dateFilter },
          include: {
            user: USER_SELECT,
            media: MEDIA_SELECT,
            youtube_channel: {
              select: { id: true, channel_id: true, channel_name: true, thumbnail_url: true, custom_url: true },
            },
          },
          orderBy: { created_at: "desc" },
          take,
        }),
        prisma.poll.findMany({
          where: { visibility: "PUBLIC", ...dateFilter },
          include: {
            user: USER_SELECT,
            options: { orderBy: { order_index: "asc" } },
          },
          orderBy: { created_at: "desc" },
          take,
        }),
      ]);

      // Tag each item with its contentType discriminator and resolve avatar URLs
      const tagged = [
        ...posts.map((p) => {
          if (p.user?.profile?.profile_picture) p.user.profile.profile_picture = resolveAvatarUrl(p.user.id, p.user.profile.profile_picture);
          return { ...p, contentType: "POST", media: p.media.map(resolveMediaForApi) };
        }),
        ...reels.map((r) => {
          if (r.user?.profile?.profile_picture) r.user.profile.profile_picture = resolveAvatarUrl(r.user.id, r.user.profile.profile_picture);
          return { ...r, contentType: "REEL", media: r.media.map(resolveMediaForApi) };
        }),
        ...youtubePosts.map((y) => {
          if (y.user?.profile?.profile_picture) y.user.profile.profile_picture = resolveAvatarUrl(y.user.id, y.user.profile.profile_picture);
          if (y.youtube_channel?.thumbnail_url) y.youtube_channel.thumbnail_url = resolveAvatarUrl(y.youtube_channel.id, y.youtube_channel.thumbnail_url);
          return { ...y, contentType: "YOUTUBE_POST", media: y.media.map(resolveMediaForApi) };
        }),
        ...polls.map((p) => {
          if (p.user?.profile?.profile_picture) p.user.profile.profile_picture = resolveAvatarUrl(p.user.id, p.user.profile.profile_picture);
          return { ...p, contentType: "POLL" };
        }),
      ];

      // Merge and sort all items by created_at DESC, take top N
      const merged = tagged
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, take);

      const nextCursor = merged.length === take ? new Date(merged[merged.length - 1].created_at).toISOString() : null;

      return { data: merged, nextCursor };
    });

    const dataWithLikes = await populateIsLiked(feedData.data, req.user?.id);

    res.json({ success: true, data: dataWithLikes, nextCursor: feedData.nextCursor });
  } catch (error) {
    logger.error(`❌ [CONTENT_CTRL] getFeed failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch feed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SPECIFIC FEEDS (Posts, Reels, YouTube)
// ─────────────────────────────────────────────────────────────────────────────

export const getPostsFeed = async (req, res) => {
  try {
    const { cursor, limit = 10 } = req.query;
    const take = parseInt(limit, 10);
    const cacheKey = `cache:feed:posts:public:${hashQuery({ cursor, limit })}`;
    const TTL_SECONDS = 30;

    const feedData = await withCache(cacheKey, TTL_SECONDS, async () => {
      const dateFilter = cursor ? { created_at: { lt: new Date(cursor) } } : {};
      const posts = await prisma.post.findMany({
        where: { visibility: "PUBLIC", ...dateFilter },
        include: { user: USER_SELECT, media: MEDIA_SELECT },
        orderBy: { created_at: "desc" },
        take,
      });

      const tagged = posts.map((p) => {
        if (p.user?.profile?.profile_picture) p.user.profile.profile_picture = resolveAvatarUrl(p.user.id, p.user.profile.profile_picture);
        return { ...p, contentType: "POST", media: p.media.map(resolveMediaForApi) };
      });

      const nextCursor = tagged.length === take ? new Date(tagged[tagged.length - 1].created_at).toISOString() : null;
      return { data: tagged, nextCursor };
    });

    const dataWithLikes = await populateIsLiked(feedData.data, req.user?.id);

    res.json({ success: true, data: dataWithLikes, nextCursor: feedData.nextCursor });
  } catch (error) {
    logger.error(`❌ [CONTENT_CTRL] getPostsFeed failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch posts feed" });
  }
};

export const getReelsFeed = async (req, res) => {
  try {
    const { cursor, limit = 10 } = req.query;
    const take = parseInt(limit, 10);
    const cacheKey = `cache:feed:reels:public:${hashQuery({ cursor, limit })}`;
    const TTL_SECONDS = 30;

    const feedData = await withCache(cacheKey, TTL_SECONDS, async () => {
      const dateFilter = cursor ? { created_at: { lt: new Date(cursor) } } : {};
      const reels = await prisma.reel.findMany({
        where: { visibility: "PUBLIC", ...dateFilter },
        include: { user: USER_SELECT, media: MEDIA_SELECT },
        orderBy: { created_at: "desc" },
        take,
      });

      const tagged = reels.map((r) => {
        if (r.user?.profile?.profile_picture) r.user.profile.profile_picture = resolveAvatarUrl(r.user.id, r.user.profile.profile_picture);
        return { ...r, contentType: "REEL", media: r.media.map(resolveMediaForApi) };
      });

      const nextCursor = tagged.length === take ? new Date(tagged[tagged.length - 1].created_at).toISOString() : null;
      return { data: tagged, nextCursor };
    });

    const dataWithLikes = await populateIsLiked(feedData.data, req.user?.id);

    res.json({ success: true, data: dataWithLikes, nextCursor: feedData.nextCursor });
  } catch (error) {
    logger.error(`❌ [CONTENT_CTRL] getReelsFeed failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch reels feed" });
  }
};

export const getYoutubeFeed = async (req, res) => {
  try {
    const { cursor, limit = 10 } = req.query;
    const take = parseInt(limit, 10);
    const cacheKey = `cache:feed:youtube:public:${hashQuery({ cursor, limit })}`;
    const TTL_SECONDS = 30;

    const feedData = await withCache(cacheKey, TTL_SECONDS, async () => {
      const dateFilter = cursor ? { created_at: { lt: new Date(cursor) } } : {};
      const youtubePosts = await prisma.youtubePost.findMany({
        where: { visibility: "PUBLIC", ...dateFilter },
        include: {
          user: USER_SELECT,
          media: MEDIA_SELECT,
          youtube_channel: {
            select: { id: true, channel_id: true, channel_name: true, thumbnail_url: true, custom_url: true },
          },
        },
        orderBy: { created_at: "desc" },
        take,
      });

      const tagged = youtubePosts.map((y) => {
        if (y.user?.profile?.profile_picture) y.user.profile.profile_picture = resolveAvatarUrl(y.user.id, y.user.profile.profile_picture);
        if (y.youtube_channel?.thumbnail_url) y.youtube_channel.thumbnail_url = resolveAvatarUrl(y.youtube_channel.id, y.youtube_channel.thumbnail_url);
        return { ...y, contentType: "YOUTUBE_POST", media: y.media.map(resolveMediaForApi) };
      });

      const nextCursor = tagged.length === take ? new Date(tagged[tagged.length - 1].created_at).toISOString() : null;
      return { data: tagged, nextCursor };
    });

    const dataWithLikes = await populateIsLiked(feedData.data, req.user?.id);

    res.json({ success: true, data: dataWithLikes, nextCursor: feedData.nextCursor });
  } catch (error) {
    logger.error(`❌ [CONTENT_CTRL] getYoutubeFeed failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch youtube feed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LIKE HANDLER (REDIS-BACKED)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Toggle like for any content type
 * @route   POST /api/social/:type/:id/like
 */
export const toggleLikeController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { action } = req.body; // Explicitly 'like' or 'unlike'
    
    // Determine content type from URL path
    const url = req.originalUrl;
    let type = "POST";
    if (url.includes("/reels/")) type = "REEL";
    else if (url.includes("/posts/youtube/")) type = "YOUTUBE_POST";
    else if (url.includes("/polls/")) type = "POLL";

    const result = await toggleLike(type, id, userId, action);
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error(`❌ [CONTENT_CTRL] toggleLike failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to toggle like" });
  }
};

export default { createPost, createReel, createYoutubePost, createPoll, deletePost, deleteReel, getFeed, getPostsFeed, getReelsFeed, getYoutubeFeed, toggleLikeController };
