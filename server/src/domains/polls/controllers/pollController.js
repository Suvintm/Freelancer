import prisma from "../../../infrastructure/database/postgres.js";
import logger from "../../../infrastructure/monitoring/logger.js";
import { redis, redisAvailable } from "../../../infrastructure/cache/redis.client.js";
import { smartResolveMediaUrl } from "../../../infrastructure/storage/media-resolver.js";
import { pollMemoryLikes, pollMemoryDirty } from "../services/likeSync.service.js";

/**
 * 📝 POLL CONTROLLER (SOCIAL MODULE)
 * Handles creating polls and receiving poll responses.
 */

export const createPoll = async (req, res) => {
  try {
    const { question, type = "MULTIPLE_CHOICE", layout = "STANDARD", options = [], show_response_count = true, visibility = "PUBLIC", caption = "" } = req.body;
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required for a poll." });
    }

    if (type === "MULTIPLE_CHOICE" && options.length < 2) {
      return res.status(400).json({ success: false, message: "Multiple choice polls require at least 2 options." });
    }

    const poll = await prisma.$transaction(async (tx) => {
      // Create the Poll
      const newPoll = await tx.poll.create({
        data: {
          userId,
          question,
          caption,
          type,
          layout,
          show_response_count,
          visibility,
        },
      });

      // Create Options if multiple choice
      if (type === "MULTIPLE_CHOICE") {
        const optionsData = options.map((opt, index) => ({
          pollId: newPoll.id,
          text: opt.text,
          // Media handling logic would go here if mediaId is available
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
    const polls = await prisma.poll.findMany({
      where: { visibility: "PUBLIC" },
      orderBy: { created_at: 'desc' },
      include: {
        user: { include: { profile: true } },
        options: { 
          orderBy: { order_index: 'asc' },
          include: { 
            media: true,
            _count: { select: { responses: true } } 
          }
        },
        _count: { select: { responses: true } },
        ...(userId ? { responses: { where: { userId } } } : {})
      },
      take: 25
    });
    
    // Merge cached values and override DB ones
    const pollsWithLikes = await Promise.all(polls.map(async (poll) => {
      let isLiked = false;
      let likesCount = poll.like_count || 0;

      if (redisAvailable) {
        const cachedCount = await redis.hget(`poll:likes:count`, poll.id);
        if (cachedCount !== null) {
          likesCount = parseInt(cachedCount, 10);
        }
        if (userId) {
          const isMember = await redis.sismember(`poll:likes:users:${poll.id}`, userId);
          isLiked = !!isMember;
        }
      } else {
        if (pollMemoryLikes.has(poll.id)) {
          likesCount = pollMemoryLikes.get(poll.id).size;
          isLiked = userId ? pollMemoryLikes.get(poll.id).has(userId) : false;
        } else {
          if (userId) {
            const likedInDb = await prisma.pollLike.findUnique({
              where: { pollId_userId: { pollId: poll.id, userId } }
            });
            isLiked = !!likedInDb;
          }
        }
      }

      return {
        ...poll,
        user: {
          ...poll.user,
          profile: poll.user.profile ? {
            ...poll.user.profile,
            profile_picture: smartResolveMediaUrl(poll.user.profile.profile_picture)
          } : null
        },
        like_count: likesCount,
        isLiked,
        options: poll.options?.map(opt => ({
          ...opt,
          image_url: opt.media ? smartResolveMediaUrl(opt.media.url) : null
        }))
      };
    }));

    res.status(200).json({ success: true, data: pollsWithLikes });
  } catch (error) {
    logger.error(`❌ [POLL_CONTROLLER] getPollPosts failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch polls" });
  }
};

export const getMyPolls = async (req, res) => {
  try {
    const userId = req.user.id;
    const polls = await prisma.poll.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { responses: true } },
        options: {
          orderBy: { order_index: 'asc' },
          include: { media: true }
        },
        user: { include: { profile: true } }
      }
    });

    const pollsWithLikes = await Promise.all(polls.map(async (poll) => {
      let isLiked = false;
      let likesCount = poll.like_count || 0;

      if (redisAvailable) {
        const cachedCount = await redis.hget(`poll:likes:count`, poll.id);
        if (cachedCount !== null) {
          likesCount = parseInt(cachedCount, 10);
        }
        const isMember = await redis.sismember(`poll:likes:users:${poll.id}`, userId);
        isLiked = !!isMember;
      } else {
        if (pollMemoryLikes.has(poll.id)) {
          likesCount = pollMemoryLikes.get(poll.id).size;
          isLiked = pollMemoryLikes.get(poll.id).has(userId);
        } else {
          const likedInDb = await prisma.pollLike.findUnique({
            where: { pollId_userId: { pollId: poll.id, userId } }
          });
          isLiked = !!likedInDb;
        }
      }

      return {
        ...poll,
        user: poll.user ? {
          ...poll.user,
          profile: poll.user.profile ? {
            ...poll.user.profile,
            profile_picture: smartResolveMediaUrl(poll.user.profile.profile_picture)
          } : null
        } : null,
        like_count: likesCount,
        isLiked,
        options: poll.options?.map(opt => ({
          ...opt,
          image_url: opt.media ? smartResolveMediaUrl(opt.media.url) : null
        }))
      };
    }));

    res.status(200).json({ success: true, data: pollsWithLikes });
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
        options: { 
          orderBy: { order_index: 'asc' },
          include: { 
            media: true,
            _count: { select: { responses: true } } 
          }
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

    if (poll.userId !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to view details" });
    }

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
        image_url: opt.media ? smartResolveMediaUrl(opt.media.url) : null
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
    const { id: pollId } = req.params;
    const userId = req.user.id;

    let hasLiked = false;
    let newLikeCount = 0;

    if (redisAvailable) {
      const redisKey = `poll:likes:users:${pollId}`;
      const isMember = await redis.sismember(redisKey, userId);
      if (isMember) {
        await redis.srem(redisKey, userId);
        await redis.hincrby(`poll:likes:count`, pollId, -1);
        hasLiked = false;
      } else {
        await redis.sadd(redisKey, userId);
        await redis.hincrby(`poll:likes:count`, pollId, 1);
        hasLiked = true;
      }
      
      const countStr = await redis.hget(`poll:likes:count`, pollId);
      newLikeCount = parseInt(countStr || "0", 10);
      
      await redis.sadd("polls:dirty_likes", pollId);
    } else {
      if (!pollMemoryLikes.has(pollId)) {
        const poll = await prisma.poll.findUnique({
          where: { id: pollId },
          select: { like_count: true, likes: { select: { userId: true } } }
        });
        const userSet = new Set(poll?.likes.map(l => l.userId) || []);
        pollMemoryLikes.set(pollId, userSet);
      }

      const userSet = pollMemoryLikes.get(pollId);
      if (userSet.has(userId)) {
        userSet.delete(userId);
        hasLiked = false;
      } else {
        userSet.add(userId);
        hasLiked = true;
      }

      newLikeCount = userSet.size;
      pollMemoryDirty.add(pollId);
    }

    res.status(200).json({ success: true, liked: hasLiked, likesCount: newLikeCount });
  } catch (error) {
    logger.error(`❌ [POLL_CONTROLLER] likePoll failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to process like" });
  }
};
