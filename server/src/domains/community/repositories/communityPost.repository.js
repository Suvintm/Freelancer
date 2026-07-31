import prisma from '../../../infrastructure/database/postgres.js';

export const communityPostRepository = {
  create: async (data) => {
    return prisma.communityPost.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: { select: { avatar_url: true } },
          },
        },
        media: true,
      },
    });
  },

  findById: async (postId) => {
    return prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: { select: { avatar_url: true } },
          },
        },
        media: true,
      },
    });
  },

  findMany: async (communityId, { cursor, limit = 20 }) => {
    const posts = await prisma.communityPost.findMany({
      where: {
        communityId,
        isDeleted: false,
      },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [
        { isPinned: 'desc' },
        { created_at: 'desc' },
      ],
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: { select: { avatar_url: true } },
          },
        },
        media: true,
      },
    });

    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop();
    }

    const nextCursor = hasMore ? posts[posts.length - 1].id : null;

    return {
      posts,
      nextCursor,
    };
  },

  softDelete: async (postId) => {
    return prisma.communityPost.update({
      where: { id: postId },
      data: { isDeleted: true },
    });
  },

  unpinAll: async (communityId) => {
    return prisma.communityPost.updateMany({
      where: { communityId, isPinned: true },
      data: { isPinned: false },
    });
  },

  pin: async (postId) => {
    return prisma.communityPost.update({
      where: { id: postId },
      data: { isPinned: true },
    });
  },

  incrementViewCount: async (postId) => {
    return prisma.communityPost.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });
  },

  getReactionCounts: async (postId) => {
    const reactions = await prisma.communityPostReaction.groupBy({
      by: ['emoji'],
      where: { postId },
      _count: { emoji: true },
    });
    
    return reactions.map(r => ({
      emoji: r.emoji,
      count: r._count.emoji,
    }));
  },
};
