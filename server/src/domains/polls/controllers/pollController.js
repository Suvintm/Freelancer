import prisma from "../../../infrastructure/database/postgres.js";
import logger from "../../../infrastructure/monitoring/logger.js";
import { redis, redisAvailable } from "../../../infrastructure/cache/redis.client.js";
import { smartResolveMediaUrl } from "../../../shared/utils/media-resolver.js";

// Local cache fallback when Redis is offline
const memoryLikes = new Map(); // postId -> Set of userIds
const memoryDirty = new Set(); // Set of dirty postIds

/**
 * 📝 POLL CONTROLLER (SOCIAL MODULE)
 * Handles creating polls and receiving poll responses.
 */

export const createPoll = async (req, res) => {
  try {
    const { question, type = "MULTIPLE_CHOICE", layout = "STANDARD", options = [], show_response_count = true, visibility = "PUBLIC" } = req.body;
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required for a poll." });
    }

    if (type === "MULTIPLE_CHOICE" && options.length < 2) {
      return res.status(400).json({ success: false, message: "Multiple choice polls require at least 2 options." });
    }

    // Atomic Transaction: Create Post (for feed) and Poll
    const poll = await prisma.$transaction(async (tx) => {
      // 1. Create the base Post
      const post = await tx.post.create({
        data: {
          userId,
          type: "POLL",
          visibility,
        },
      });

      // 2. Create the Poll
      const newPoll = await tx.poll.create({
        data: {
          postId: post.id,
          question,
          type,
          layout,
          show_response_count,
        },
      });

      // 3. Create Options if multiple choice
      if (type === "MULTIPLE_CHOICE") {
        const optionsData = options.map((opt, index) => ({
          pollId: newPoll.id,
          text: opt.text,
          image_url: opt.image_url || null,
          order_index: index,
        }));
        await tx.pollOption.createMany({
          data: optionsData,
        });
      }

      return await tx.poll.findUnique({
        where: { id: newPoll.id },
        include: { options: true }
      });
    });

    res.status(201).json({
      success: true,
      data: poll,
    });
  } catch (error) {
    logger.error(`❌ [POLL_CONTROLLER] createPoll failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to create poll" });
  }
};

export const respondToPoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionId, textResponse } = req.body;
    const userId = req.user.id;

    const poll = await prisma.poll.findUnique({ 
      where: { id },
      include: { options: true } 
    });

    if (!poll) {
      return res.status(404).json({ success: false, message: "Poll not found" });
    }

    // Check for existing response
    const existing = await prisma.pollResponse.findUnique({
      where: {
        pollId_userId: {
          pollId: id,
          userId,
        }
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "You have already responded to this poll" });
    }

    if (poll.type === "MULTIPLE_CHOICE" && !optionId) {
      return res.status(400).json({ success: false, message: "Option selection is required for multiple choice polls" });
    }

    if (poll.type === "OPEN_ENDED" && !textResponse?.trim()) {
      return res.status(400).json({ success: false, message: "Text response is required for open-ended polls" });
    }

    const response = await prisma.pollResponse.create({
      data: {
        pollId: id,
        userId,
        optionId: poll.type === "MULTIPLE_CHOICE" ? optionId : null,
        text_response: poll.type === "OPEN_ENDED" ? textResponse : null,
      }
    });

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    logger.error(`❌ [POLL_CONTROLLER] respondToPoll failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to submit response" });
  }
};

export const getPollPosts = async (req, res) => {
  try {
    const userId = req.user?.id;
    const posts = await prisma.post.findMany({
      where: { type: "POLL", visibility: "PUBLIC" },
      orderBy: { created_at: 'desc' },
      include: {
        user: { include: { profile: true } },
        poll: { 
          include: { 
            options: { 
              orderBy: { order_index: 'asc' },
              include: { _count: { select: { responses: true } } }
            },
            _count: { select: { responses: true } },
            ...(userId ? { responses: { where: { userId } } } : {})
          } 
        }
      },
      take: 25
    });
    
    // Merge cached values and override DB ones
    const postsWithLikes = await Promise.all(posts.map(async (post) => {
      let isLiked = false;
      let likesCount = post.like_count || 0;

      if (redisAvailable) {
        const cachedCount = await redis.hget(`post:likes:count`, post.id);
        if (cachedCount !== null) {
          likesCount = parseInt(cachedCount, 10);
        }
        if (userId) {
          const isMember = await redis.sismember(`post:likes:users:${post.id}`, userId);
          isLiked = !!isMember;
        }
      } else {
        if (memoryLikes.has(post.id)) {
          likesCount = memoryLikes.get(post.id).size;
          isLiked = userId ? memoryLikes.get(post.id).has(userId) : false;
        } else {
          if (userId) {
            const likedInDb = await prisma.postLike.findUnique({
              where: { postId_userId: { postId: post.id, userId } }
            });
            isLiked = !!likedInDb;
          }
        }
      }

      return {
        ...post,
        user: {
          ...post.user,
          profile: post.user.profile ? {
            ...post.user.profile,
            profile_picture: smartResolveMediaUrl(post.user.profile.profile_picture)
          } : null
        },
        like_count: likesCount,
        isLiked,
        poll: post.poll ? {
          ...post.poll,
          options: post.poll.options?.map(opt => ({
            ...opt,
            image_url: smartResolveMediaUrl(opt.image_url)
          }))
        } : null
      };
    }));

    res.status(200).json({ success: true, data: postsWithLikes });
  } catch (error) {
    logger.error(`❌ [POLL_CONTROLLER] getPollPosts failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch polls" });
  }
};

export const getMyPolls = async (req, res) => {
  try {
    const userId = req.user.id;
    const posts = await prisma.post.findMany({
      where: { type: "POLL", userId },
      orderBy: { created_at: 'desc' },
      include: {
        poll: { 
          include: { 
            _count: { select: { responses: true } }
          } 
        }
      }
    });

    const postsWithLikes = await Promise.all(posts.map(async (post) => {
      let isLiked = false;
      let likesCount = post.like_count || 0;

      if (redisAvailable) {
        const cachedCount = await redis.hget(`post:likes:count`, post.id);
        if (cachedCount !== null) {
          likesCount = parseInt(cachedCount, 10);
        }
        const isMember = await redis.sismember(`post:likes:users:${post.id}`, userId);
        isLiked = !!isMember;
      } else {
        if (memoryLikes.has(post.id)) {
          likesCount = memoryLikes.get(post.id).size;
          isLiked = memoryLikes.get(post.id).has(userId);
        } else {
          const likedInDb = await prisma.postLike.findUnique({
            where: { postId_userId: { postId: post.id, userId } }
          });
          isLiked = !!likedInDb;
        }
      }

      return {
        ...post,
        user: {
          ...post.user,
          profile: post.user.profile ? {
            ...post.user.profile,
            profile_picture: smartResolveMediaUrl(post.user.profile.profile_picture)
          } : null
        },
        like_count: likesCount,
        isLiked,
        poll: post.poll ? {
          ...post.poll,
          options: post.poll.options?.map(opt => ({
            ...opt,
            image_url: smartResolveMediaUrl(opt.image_url)
          }))
        } : null
      };
    }));

    res.status(200).json({ success: true, data: postsWithLikes });
  } catch (error) {
    logger.error(`❌ [POLL_CONTROLLER] getMyPolls failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch your polls" });
  }
};

export const getPollDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        post: true,
        options: { 
          orderBy: { order_index: 'asc' },
          include: { _count: { select: { responses: true } } }
        },
        responses: {
          orderBy: { created_at: 'desc' },
          include: {
            user: { include: { profile: true } },
            option: true
          }
        },
        _count: { select: { responses: true } }
      }
    });

    if (!poll) {
      return res.status(404).json({ success: false, message: "Poll not found" });
    }

    // Ensure the user owns this poll (or maybe allow public if they want? The spec says "view full details" for creators)
    if (poll.post.userId !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to view details" });
    }

    // Resolve participant avatars and poll option images
    if (poll.responses) {
      poll.responses = poll.responses.map(resp => {
        if (resp.user?.profile) {
          resp.user.profile.profile_picture = smartResolveMediaUrl(resp.user.profile.profile_picture);
        }
        return resp;
      });
    }
    
    if (poll.options) {
      poll.options = poll.options.map(opt => ({
        ...opt,
        image_url: smartResolveMediaUrl(opt.image_url)
      }));
    }

    res.status(200).json({ success: true, data: poll });
  } catch (error) {
    logger.error(`❌ [POLL_CONTROLLER] getPollDetails failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch poll details" });
  }
};

export const likePoll = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;

    let hasLiked = false;
    let newLikeCount = 0;

    if (redisAvailable) {
      const redisKey = `post:likes:users:${postId}`;
      const isMember = await redis.sismember(redisKey, userId);
      if (isMember) {
        await redis.srem(redisKey, userId);
        await redis.hincrby(`post:likes:count`, postId, -1);
        hasLiked = false;
      } else {
        await redis.sadd(redisKey, userId);
        await redis.hincrby(`post:likes:count`, postId, 1);
        hasLiked = true;
      }
      
      const countStr = await redis.hget(`post:likes:count`, postId);
      newLikeCount = parseInt(countStr || "0", 10);
      
      await redis.sadd("posts:dirty_likes", postId);
    } else {
      if (!memoryLikes.has(postId)) {
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { like_count: true, likes: { select: { userId: true } } }
        });
        const userSet = new Set(post?.likes.map(l => l.userId) || []);
        memoryLikes.set(postId, userSet);
      }

      const userSet = memoryLikes.get(postId);
      if (userSet.has(userId)) {
        userSet.delete(userId);
        hasLiked = false;
      } else {
        userSet.add(userId);
        hasLiked = true;
      }

      newLikeCount = userSet.size;
      memoryDirty.add(postId);
    }

    res.status(200).json({ success: true, liked: hasLiked, likesCount: newLikeCount });
  } catch (error) {
    logger.error(`❌ [POLL_CONTROLLER] likePoll failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to process like" });
  }
};

export const syncLikesToPostgres = async () => {
  try {
    let dirtyPostIds = [];

    if (redisAvailable) {
      dirtyPostIds = await redis.smembers("posts:dirty_likes");
    } else {
      dirtyPostIds = Array.from(memoryDirty);
    }

    if (dirtyPostIds.length === 0) return;

    logger.info(`🔄 [SCHEDULER] Syncing deferred likes for ${dirtyPostIds.length} posts to Postgres...`);

    for (const postId of dirtyPostIds) {
      let likesCount = 0;
      let userLikes = [];

      if (redisAvailable) {
        const countStr = await redis.hget(`post:likes:count`, postId);
        likesCount = Math.max(0, parseInt(countStr || "0", 10));
        userLikes = await redis.smembers(`post:likes:users:${postId}`);
      } else {
        const userSet = memoryLikes.get(postId) || new Set();
        likesCount = userSet.size;
        userLikes = Array.from(userSet);
      }

      // Update Post like count
      await prisma.post.update({
        where: { id: postId },
        data: { like_count: likesCount }
      });

      // Synchronize PostLike entries
      await prisma.postLike.deleteMany({
        where: {
          postId,
          userId: { notIn: userLikes }
        }
      });

      for (const userId of userLikes) {
        await prisma.postLike.upsert({
          where: { postId_userId: { postId, userId } },
          create: { postId, userId },
          update: {}
        });
      }

      if (redisAvailable) {
        await redis.srem("posts:dirty_likes", postId);
      } else {
        memoryDirty.delete(postId);
      }
    }

    logger.info("✅ [SCHEDULER] Deferred likes sync completed.");
  } catch (error) {
    logger.error(`❌ [SCHEDULER] Deferred likes sync failed: ${error.message}`);
  }
};

// Trigger Nodemon Restart - Cache Clear
