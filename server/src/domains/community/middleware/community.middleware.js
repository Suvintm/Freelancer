import { communityRepository } from '../repositories/community.repository.js';
import { communityMemberRepository } from '../repositories/communityMember.repository.js';

export const requireCommunityExists = async (req, res, next) => {
  try {
    const communityId = req.params.id || req.params.communityId;
    const community = await communityRepository.findById(communityId);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }
    req.community = community;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireMembership = async (req, res, next) => {
  try {
    const communityId = req.params.id || req.params.communityId;
    const member = await communityMemberRepository.findMembership(communityId, req.user.id);
    if (!member || member.isBanned) {
      return res.status(403).json({ success: false, message: 'Not a member or banned' });
    }
    req.membership = member;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.membership?.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};
