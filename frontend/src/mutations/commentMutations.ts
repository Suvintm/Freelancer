import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Comment } from '../queries/commentQueries';

interface AddCommentPayload {
  entityType: 'POST' | 'REEL' | 'YOUTUBE_POST';
  entityId: string;
  content: string;
  parentId?: string; // Optional: For replies
}

interface ToggleLikePayload {
  commentId: string;
}

interface DeleteCommentPayload {
  commentId: string;
}

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddCommentPayload) => {
      const { data } = await api.post('/social/comments', payload);
      return data.data; // Returns the created comment
    },
    onSuccess: (_, variables) => {
      // Optimistically invalidate/update queries
      if (variables.parentId) {
        queryClient.invalidateQueries({ queryKey: ['replies', variables.parentId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments', variables.entityType, variables.entityId] });
      }
    },
  });
};

export const useToggleCommentLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId }: ToggleLikePayload) => {
      const { data } = await api.post(`/social/comments/${commentId}/like`);
      return { commentId, liked: data.data.liked };
    },
    // We can add onMutate here for instant optimistic UI updates if needed,
    // but invalidateQueries is a simpler start.
    onSuccess: () => {
      // Invalidate queries so the like count updates
      // This is broad, but guarantees consistency
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId }: DeleteCommentPayload) => {
      const { data } = await api.delete(`/social/comments/${commentId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });
};
