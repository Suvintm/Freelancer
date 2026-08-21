import { communityMemberRepository } from './repositories/communityMember.repository.js';

export const registerCommunitySocket = (io, socket) => {
  socket.on('community:join', async ({ communityId }) => {
    try {
      const member = await communityMemberRepository.findMembership(communityId, socket.userId);
      if (!member || member.isBanned) {
        return socket.emit('community:error', { code: 'NOT_MEMBER', message: 'Not a member or banned' });
      }
      socket.join(`community:${communityId}`);
      socket.emit('community:joined', { communityId });
    } catch (err) {
      socket.emit('community:error', { code: 'SERVER_ERROR', message: err.message });
    }
  });

  socket.on('community:leave', ({ communityId }) => {
    socket.leave(`community:${communityId}`);
  });

  socket.on('community:read', async ({ communityId }) => {
    try {
      await communityMemberRepository.updateLastRead(communityId, socket.userId);
    } catch (err) {
      // Ignore or log error
    }
  });

  // Reactions can be triggered via socket, but the controller is usually better for REST semantics.
  // If we want to handle reactions purely over socket:
  /*
  socket.on('community:post:react', async ({ postId, communityId, emoji }) => {
    try {
      const counts = await communityPostService.reactToPost(postId, socket.userId, emoji);
      // Fan out broadcast
      io.to(`community:${communityId}`).emit('community:post:reaction:update', { postId, reactions: counts });
    } catch (err) {
      socket.emit('community:error', { code: 'REACTION_FAILED', message: err.message });
    }
  });
  */
};
