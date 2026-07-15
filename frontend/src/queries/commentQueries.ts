import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export interface CommentUser {
  id: string;
  username: string;
  is_verified?: boolean;
  role?: string;
  profile?: {
    profile_picture?: string;
  };
}

export interface Comment {
  id: string;
  userId: string;
  parentId?: string | null;
  content: string;
  like_count: number;
  reply_count: number;
  created_at: string;
  user: CommentUser;
}

export interface CommentsResponse {
  success: boolean;
  data: Comment[];
  nextCursor: string | null;
}

/**
 * Hook to fetch top-level comments for a Post, Reel, or YoutubePost
 */
export const useComments = (entityType: 'POST' | 'REEL' | 'YOUTUBE_POST', entityId: string) => {
  return useInfiniteQuery<CommentsResponse, Error>({
    queryKey: ['comments', entityType, entityId],
    queryFn: async ({ pageParam = null }) => {
      const url = `/social/comments/${entityType}/${entityId}`;
      const params = pageParam ? { cursor: pageParam } : {};
      const { data } = await api.get(url, { params });
      return data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!entityId,
  });
};

/**
 * Hook to fetch replies for a specific comment
 */
export const useReplies = (commentId: string) => {
  return useInfiniteQuery<CommentsResponse, Error>({
    queryKey: ['replies', commentId],
    queryFn: async ({ pageParam = null }) => {
      const url = `/social/comments/${commentId}/replies`;
      const params = pageParam ? { cursor: pageParam } : {};
      const { data } = await api.get(url, { params });
      return data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!commentId,
  });
};
