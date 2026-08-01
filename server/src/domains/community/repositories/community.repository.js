import prisma from '../../../infrastructure/database/postgres.js';

export const communityRepository = {
  findById: async (id) => {
    return prisma.community.findUnique({
      where: { id },
      include: {
        ytProfile: true,
      },
    });
  },

  findBySlug: async (slug) => {
    return prisma.community.findUnique({
      where: { slug },
      include: {
        ytProfile: true,
      },
    });
  },

  findByYtProfileId: async (ytProfileId) => {
    if (!ytProfileId) return null;
    return prisma.community.findUnique({
      where: { ytProfileId },
    });
  },

  create: async (data) => {
    // Atomic creation: Community + ADMIN member + optional welcome post
    return prisma.$transaction(async (tx) => {
      const community = await tx.community.create({
        data: {
          ownerId: data.ownerId,
          ytProfileId: data.ytProfileId,
          name: data.name,
          slug: data.slug,
          description: data.description,
          thumbnail: data.thumbnail,
          bannerUrl: data.bannerUrl,
          rules: data.rules,
          category: data.category,
          isPrivate: data.isPrivate,
          memberCount: 1, // owner is the first member
          metadata: data.metadata || {},
          members: {
            create: {
              userId: data.ownerId,
              role: 'ADMIN',
            },
          },
        },
      });

      // Create welcome post if it's not private (or always)
      await tx.communityPost.create({
        data: {
          communityId: community.id,
          authorId: data.ownerId,
          type: 'NATIVE',
          content: `Welcome to ${community.name}!`,
        },
      });

      return community;
    });
  },

  update: async (id, data) => {
    return prisma.community.update({
      where: { id },
      data,
    });
  },

  delete: async (id) => {
    return prisma.community.delete({
      where: { id },
    });
  },

  findPublic: async ({ cursor, limit = 20 }) => {
    return prisma.community.findMany({
      where: { isPrivate: false },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { memberCount: 'desc' },
    });
  },

  findForUser: async (userId, { cursor, limit = 20 }) => {
    const memberships = await prisma.communityMember.findMany({
      where: { userId, isBanned: false },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { joined_at: 'desc' },
      include: {
        community: true,
      },
    });

    const hasMore = memberships.length > limit;
    if (hasMore) {
      memberships.pop();
    }

    const nextCursor = hasMore ? memberships[memberships.length - 1].id : null;

    return {
      communities: memberships.map((m) => ({ ...m.community, role: m.role })),
      nextCursor,
    };
  },

  incrementMemberCount: async (id) => {
    return prisma.community.update({
      where: { id },
      data: { memberCount: { increment: 1 } },
    });
  },

  decrementMemberCount: async (id) => {
    return prisma.community.update({
      where: { id },
      data: { memberCount: { decrement: 1 } },
    });
  },
};
