import { communityPostRepository } from '../repositories/communityPost.repository.js';
import { communityMemberRepository } from '../repositories/communityMember.repository.js';
import { communityRepository } from '../repositories/community.repository.js';
import linkPreviewService from './linkPreview.service.js';
// import notificationService from '../../notifications/services/notificationService.js'; // Assuming it exists

class CommunityPostService {
  async createPost(communityId, authorId, data) {
    const member = await communityMemberRepository.findMembership(communityId, authorId);
    if (!['ADMIN', 'MODERATOR'].includes(member?.role)) {
      const error = new Error('Forbidden: Only admins or moderators can post');
      error.statusCode = 403;
      throw error;
    }

    let metadata = data.metadata || {};
    if (data.content) {
      const preview = await linkPreviewService.extractFromText(data.content);
      if (preview) metadata.linkPreview = preview;
    }

    if (data.type !== 'NATIVE') {
      if (!data.sourceId) {
        const error = new Error('Validation: sourceId is required for shared posts');
        error.statusCode = 400;
        throw error;
      }
    }

    const post = await communityPostRepository.create({
      communityId,
      authorId,
      type: data.type || 'NATIVE',
      content: data.content,
      mediaId: data.mediaId,
      sourceId: data.sourceId,
      metadata,
    });

    const community = await communityRepository.findById(communityId);

    // Broadcast push notification (stubbed here, to be properly implemented based on your notificationService)
    try {
      /*
      await notificationService.createNotification({
        type: 'NEW_COMMUNITY_POST',
        title: `New post in ${community.name}`,
        body: data.content?.slice(0, 100) || 'New content shared',
        metadata: { communityId, postId: post.id },
        // send to all members except author
      });
      */
    } catch (err) {
      console.error('Failed to send push notifications', err);
    }

    return post;
  }

  async listPosts(communityId, userId, { cursor, limit }) {
    await communityMemberRepository.findMembership(communityId, userId);
    const { posts, nextCursor } = await communityPostRepository.findMany(communityId, { cursor, limit });

    // Mark as read
    await communityMemberRepository.updateLastRead(communityId, userId);

    // Resolving shared content could be done here (e.g., fetch Post/Reel/YoutubePost data based on sourceId)
    // For now, we return them as is, the client will fetch or we can join if needed.

    return { posts, nextCursor };
  }

  async reactToPost(postId, userId, emoji) {
    const post = await communityPostRepository.findById(postId);
    if (!post) {
      const error = new Error('Not Found');
      error.statusCode = 404;
      throw error;
    }

    const member = await communityMemberRepository.findMembership(post.communityId, userId);
    if (!member || member.isBanned) {
      const error = new Error('Forbidden');
      error.statusCode = 403;
      throw error;
    }

    const existingReaction = await import('../../../infrastructure/database/postgres.js').then(m => m.default.communityPostReaction.findUnique({
      where: { postId_userId_emoji: { postId, userId, emoji } }
    }));

    if (existingReaction) {
      await import('../../../infrastructure/database/postgres.js').then(m => m.default.communityPostReaction.delete({
        where: { id: existingReaction.id }
      }));
    } else {
      await import('../../../infrastructure/database/postgres.js').then(m => m.default.communityPostReaction.create({
        data: { postId, userId, emoji }
      }));
    }

    const counts = await communityPostRepository.getReactionCounts(postId);
    return counts;
  }
}

export default new CommunityPostService();
