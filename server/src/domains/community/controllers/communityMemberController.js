import communityMemberService from '../services/communityMemberService.js';
import { communityMemberRepository } from '../repositories/communityMember.repository.js';

export const joinCommunity = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    const member = await communityMemberService.join(req.params.id, req.user.id, inviteCode);
    res.status(200).json({ success: true, data: member });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

export const leaveCommunity = async (req, res, next) => {
  try {
    await communityMemberService.leave(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Left community' });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

export const listMembers = async (req, res, next) => {
  try {
    const { cursor, limit, role } = req.query;
    const data = await communityMemberRepository.listMembers(req.params.id, { cursor, limit: parseInt(limit) || 20, role });
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const kickMember = async (req, res, next) => {
  try {
    await communityMemberService.kick(req.params.id, req.params.userId);
    res.status(200).json({ success: true, message: 'Member kicked' });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

export const banMember = async (req, res, next) => {
  try {
    const { reason } = req.body;
    await communityMemberService.ban(req.params.id, req.params.userId, reason);
    res.status(200).json({ success: true, message: 'Member banned' });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

export const promoteMember = async (req, res, next) => {
  try {
    const { role } = req.body;
    await communityMemberService.promote(req.params.id, req.params.userId, role);
    res.status(200).json({ success: true, message: 'Member role updated' });
  } catch (err) {
    next(err);
  }
};
