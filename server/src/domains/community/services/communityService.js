import prisma from '../../../infrastructure/database/postgres.js';
import reactionBuffer from "../../messaging/services/reaction.service.js";
import slugify from 'slugify';
import { smartResolveMediaUrl } from '../../../infrastructure/storage/media-resolver.js';

class CommunityService {
  /**
   * Resolve media URLs for a message object
   */
  formatMessage(message) {
    if (!message) return message;
    const formatted = { ...message };
    
    // Resolve sender avatar
    if (formatted.sender?.profile?.profile_picture) {
      formatted.sender.profile.profile_picture = smartResolveMediaUrl(formatted.sender.profile.profile_picture);
    }
    
    // Resolve media content (if any)
    if (formatted.media?.url) {
      formatted.media.url = smartResolveMediaUrl(formatted.media.url);
    }
    
    return formatted;
  }

  /**
   * Resolve media URLs for a community object
   */
  formatCommunity(community) {
    if (!community) return community;
    const formatted = { ...community };
    
    if (formatted.thumbnail) {
      formatted.thumbnail = smartResolveMediaUrl(formatted.thumbnail);
    }
    
    if (formatted.owner?.profile?.profile_picture) {
      formatted.owner.profile.profile_picture = smartResolveMediaUrl(formatted.owner.profile.profile_picture);
    }

    if (formatted.messages && Array.isArray(formatted.messages)) {
      formatted.messages = formatted.messages.map(m => this.formatMessage(m));
    }
    
    return formatted;
  }
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

    const message = await prisma.communityMessage.create({
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

    // Update community updated_at for sorting
    await prisma.community.update({
      where: { id: communityId },
      data: { updated_at: new Date() }
    });

    return this.formatMessage(message);
  }

  /**
   * Get community by slug
   */
  async getCommunityBySlug(slug) {
    const community = await prisma.community.findUnique({
      where: { slug },
      include: {
        owner: {
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
        linkedAccounts: true,
        _count: {
          select: { members: true }
        }
      }
    });

    return this.formatCommunity(community);
  }

  /**
   * Get messages for community
   */
  async getMessages(communityId, limit = 50, cursor) {
    const messages = await prisma.communityMessage.findMany({
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

    return messages.map(m => this.formatMessage(m));
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
      // Toggle off - Buffer the delete
      reactionBuffer.push({ messageId, userId, emoji, type: 'remove' });
      return { action: 'removed', emoji, userId };
    } else {
      // Toggle on - Buffer the create
      reactionBuffer.push({ messageId, userId, emoji, type: 'add' });
      return { 
        action: 'added', 
        emoji, 
        userId,
        // We return a mock reaction object for the socket broadcast
        reaction: { messageId, userId, emoji, created_at: new Date() } 
      };
    }
  }

  /**
   * Get communities for a user
   */
  async getMyCommunities(userId, limit = 20, cursor) {
    const communities = await prisma.community.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { updated_at: 'desc' },
      include: {
        owner: {
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
      }
    });

    return communities.map(c => this.formatCommunity(c));
  }

  /**
   * Get community by ID
   */
  async getCommunityById(communityId) {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        owner: {
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
        linkedAccounts: true,
        _count: {
          select: { members: true }
        }
      }
    });

    return this.formatCommunity(community);
  }
}

export default new CommunityService();

