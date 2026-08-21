import { communityMemberRepository } from '../repositories/communityMember.repository.js';
import { communityRepository } from '../repositories/community.repository.js';

class CommunityMemberService {
  async join(communityId, userId, inviteCode) {
    const community = await communityRepository.findById(communityId);
    if (!community) {
      const error = new Error('Not Found: Community does not exist');
      error.statusCode = 404;
      throw error;
    }

    if (community.isPrivate) {
      if (!inviteCode) {
        const error = new Error('Forbidden: This community is private and requires an invite code');
        error.statusCode = 403;
        throw error;
      }
      // TODO: validateInviteCode(communityId, inviteCode)
    }

    const existing = await communityMemberRepository.findMembership(communityId, userId);
    if (existing?.isBanned) {
      const error = new Error('Forbidden: You are banned from this community');
      error.statusCode = 403;
      throw error;
    }
    if (existing) return existing;

    const member = await communityMemberRepository.create(communityId, userId, 'MEMBER');
    await communityRepository.incrementMemberCount(communityId);
    
    // Socket emit would happen in controller or via an event emitter
    return member;
  }

  async leave(communityId, userId) {
    const community = await communityRepository.findById(communityId);
    if (community.ownerId === userId) {
      const error = new Error('Validation: Owner cannot leave. Delete the community instead.');
      error.statusCode = 400;
      throw error;
    }

    const existing = await communityMemberRepository.findMembership(communityId, userId);
    if (!existing) return;

    await communityMemberRepository.remove(communityId, userId);
    await communityRepository.decrementMemberCount(communityId);
  }

  async updateLastRead(communityId, userId) {
    await communityMemberRepository.updateLastRead(communityId, userId);
  }

  async kick(communityId, targetUserId) {
    // Requires authorization check in middleware/controller (MOD/ADMIN only)
    const community = await communityRepository.findById(communityId);
    if (community.ownerId === targetUserId) {
      const error = new Error('Validation: Cannot kick the owner.');
      error.statusCode = 400;
      throw error;
    }
    await communityMemberRepository.remove(communityId, targetUserId);
    await communityRepository.decrementMemberCount(communityId);
  }

  async ban(communityId, targetUserId, reason) {
    const community = await communityRepository.findById(communityId);
    if (community.ownerId === targetUserId) {
      const error = new Error('Validation: Cannot ban the owner.');
      error.statusCode = 400;
      throw error;
    }
    await communityMemberRepository.ban(communityId, targetUserId, reason);
    await communityRepository.decrementMemberCount(communityId);
  }

  async promote(communityId, targetUserId, newRole) {
    await communityMemberRepository.updateRole(communityId, targetUserId, newRole);
  }
}

export default new CommunityMemberService();
