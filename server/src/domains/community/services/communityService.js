import { communityRepository } from "../repositories/community.repository.js";
import { communityMemberRepository } from "../repositories/communityMember.repository.js";
import prisma from "../../../infrastructure/database/postgres.js";
import slugify from "slugify";
import { smartResolveMediaUrl } from "../../../infrastructure/storage/media-resolver.js";

class CommunityService {
  formatCommunity(community) {
    if (!community) return community;
    const formatted = { ...community };

    if (formatted.thumbnail) {
      formatted.thumbnail = smartResolveMediaUrl(formatted.thumbnail);
    }

    if (formatted.owner?.profile?.profile_picture) {
      formatted.owner.profile.profile_picture = smartResolveMediaUrl(
        formatted.owner.profile.profile_picture
      );
    }

    return formatted;
  }

  async createCommunity(ownerId, data) {
    const { name, isPrivate, ytChannelId, ytProfileId } = data;
    const channelIdToLink = ytChannelId || ytProfileId;

    // 1. Verify user owns the YT channel they are linking
    if (channelIdToLink) {
      const ytChannel = await prisma.youTubeChannel.findUnique({
        where: { id: channelIdToLink },
      });
      if (!ytChannel || ytChannel.userId !== ownerId) {
        const error = new Error("Forbidden: You do not own this YouTube channel");
        error.statusCode = 403;
        throw error;
      }
      const existing = await communityRepository.findByYtChannelId(channelIdToLink);
      if (existing) {
        const error = new Error("Conflict: Community already exists for this channel");
        error.statusCode = 409;
        throw error;
      }
    }

    // 2. Generate a unique slug
    let slug = slugify(name, { lower: true, strict: true });
    const slugExists = await communityRepository.findBySlug(slug);
    if (slugExists) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 3. Create
    const community = await communityRepository.create({
      ...data,
      ytChannelId: channelIdToLink,
      ownerId,
      slug,
      isPrivate: isPrivate || false,
    });

    return this.formatCommunity(community);
  }

  async updateCommunity(communityId, data) {
    if ("isPrivate" in data) {
      const error = new Error("Validation: Privacy cannot be changed after creation");
      error.statusCode = 400;
      throw error;
    }

    const community = await communityRepository.update(communityId, data);
    return this.formatCommunity(community);
  }

  async getCommunityById(communityId) {
    const community = await communityRepository.findById(communityId);
    return this.formatCommunity(community);
  }

  async getCommunityBySlug(slug) {
    const community = await communityRepository.findBySlug(slug);
    return this.formatCommunity(community);
  }

  async getMyCommunities(userId, { cursor, limit = 20 } = {}) {
    const { communities, nextCursor } = await communityRepository.findForUser(userId, {
      cursor,
      limit,
    });
    return {
      communities: communities.map((c) => this.formatCommunity(c)),
      nextCursor,
    };
  }

  async getDiscoverCommunities({ cursor, limit = 20 } = {}) {
    const communities = await communityRepository.findPublic({ cursor, limit });
    return {
      communities: communities.map((c) => this.formatCommunity(c)),
    };
  }

  async deleteCommunity(communityId) {
    await communityRepository.delete(communityId);
    return { success: true };
  }
}

export default new CommunityService();
