import prisma from '../../../config/prisma.js';
import slugify from 'slugify';

class CommunityService {
  /**
   * Create a new community
   */
  async createCommunity(ownerId, data) {
    const { name, description, thumbnail, category, isPrivate, linkedAccounts } = data;
    
    // Generate a unique slug
    let slug = slugify(name, { lower: true, strict: true });
    
    const slugExists = await prisma.community.findUnique({ where: { slug } });
    if (slugExists) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Create the community
      const community = await tx.community.create({
        data: {
          ownerId,
          name,
          slug,
          description,
          thumbnail,
          category,
          isPrivate: isPrivate || false,
        },
      });

      // 2. Add owner as ADMIN member
      await tx.communityMember.create({
        data: {
          communityId: community.id,
          userId: ownerId,
          role: 'ADMIN',
        },
      });

      // 3. Link accounts if provided
      if (linkedAccounts && Array.isArray(linkedAccounts)) {
        await tx.communityLinkedAccount.createMany({
          data: linkedAccounts.map(acc => ({
            communityId: community.id,
            platform: acc.platform,
            externalId: acc.externalId,
            displayName: acc.displayName,
            url: acc.url,
            isVerified: acc.isVerified || false,
          })),
        });
      }

      // 4. Create an automatic welcome message
      await tx.communityMessage.create({
        data: {
          communityId: community.id,
          senderId: ownerId,
          content: `Welcome to our new community! 👋 Let's start the conversation.`,
          type: 'text'
        }
      });

      return community;
    });
  }

  /**
   * Join a community
   */
  async joinCommunity(communityId, userId) {
    // Check if already a member
    const existing = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId, userId }
      }
    });

    if (existing) return existing;

    return await prisma.communityMember.create({
      data: {
        communityId,
        userId,
        role: 'MEMBER'
      }
    });
  }

  /**
   * Send a message to community
   */
  async sendMessage(communityId, senderId, data) {
    const { type, content, mediaId, metadata } = data;

    // Check membership
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: senderId } }
    });

    if (!member) {
      throw new Error('Not a member of this community');
    }

    return await prisma.communityMessage.create({
      data: {
        communityId,
        senderId,
        type: type || 'text',
        content,
        mediaId,
        metadata: metadata || {},
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                name: true,
                profile_picture: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Get community by slug
   */
  async getCommunityBySlug(slug) {
    return await prisma.community.findUnique({
      where: { slug },
      include: {
        owner: {
          select: { id: true, username: true }
        },
        linkedAccounts: true,
        _count: {
          select: { members: true }
        }
      }
    });
  }

  /**
   * Get messages for community
   */
  async getMessages(communityId, limit = 50, cursor) {
    return await prisma.communityMessage.findMany({
      where: { communityId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { created_at: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                name: true,
                profile_picture: true
              }
            }
          }
        },
        media: true,
        reactions: {
          select: {
            id: true,
            emoji: true,
            user: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: { name: true, profile_picture: true }
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * React to a message
   */
  async reactToMessage(communityId, messageId, userId, emoji) {
    // Validate message belongs to community
    const message = await prisma.communityMessage.findUnique({
      where: { id: messageId }
    });

    if (!message || message.communityId !== communityId) {
      throw new Error('Message not found in this community');
    }

    // Check if user already reacted with this emoji
    const existingReaction = await prisma.communityMessageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji
        }
      }
    });

    if (existingReaction) {
      // Toggle off
      await prisma.communityMessageReaction.delete({
        where: { id: existingReaction.id }
      });
      return { action: 'removed', emoji };
    } else {
      // Toggle on
      const newReaction = await prisma.communityMessageReaction.create({
        data: {
          messageId,
          userId,
          emoji
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: { name: true, profile_picture: true }
              }
            }
          }
        }
      });
      return { action: 'added', reaction: newReaction };
    }
  }

  /**
   * Get communities for a user
   */
  async getMyCommunities(userId) {
    return await prisma.community.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        _count: {
          select: { members: true }
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            sender: {
              include: { profile: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Get community by ID
   */
  async getCommunityById(communityId) {
    return await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        owner: {
          select: { id: true, username: true }
        },
        linkedAccounts: true,
        _count: {
          select: { members: true }
        }
      }
    });
  }
}

export default new CommunityService();

