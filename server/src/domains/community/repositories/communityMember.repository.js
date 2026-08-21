import prisma from '../../../infrastructure/database/postgres.js';

export const communityMemberRepository = {
  findMembership: async (communityId, userId) => {
    return prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId, userId },
      },
    });
  },

  create: async (communityId, userId, role = 'MEMBER') => {
    return prisma.communityMember.create({
      data: {
        communityId,
        userId,
        role,
      },
    });
  },

  remove: async (communityId, userId) => {
    return prisma.communityMember.delete({
      where: {
        communityId_userId: { communityId, userId },
      },
    });
  },

  updateRole: async (communityId, userId, newRole) => {
    return prisma.communityMember.update({
      where: {
        communityId_userId: { communityId, userId },
      },
      data: { role: newRole },
    });
  },

  ban: async (communityId, userId, reason) => {
    return prisma.communityMember.update({
      where: {
        communityId_userId: { communityId, userId },
      },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        banReason: reason,
      },
    });
  },

  updateLastRead: async (communityId, userId) => {
    return prisma.communityMember.update({
      where: {
        communityId_userId: { communityId, userId },
      },
      data: { lastReadAt: new Date() },
    });
  },

  listMembers: async (communityId, { cursor, limit = 20, role }) => {
    const where = { communityId, isBanned: false };
    if (role) where.role = role;

    const members = await prisma.communityMember.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { joined_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { avatar_url: true },
            },
          },
        },
      },
    });

    const hasMore = members.length > limit;
    if (hasMore) {
      members.pop();
    }

    const nextCursor = hasMore ? members[members.length - 1].id : null;

    return {
      members: members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        username: m.user.username,
        avatar_url: m.user.profile?.avatar_url,
        role: m.role,
        joined_at: m.joined_at,
      })),
      nextCursor,
    };
  },
};
