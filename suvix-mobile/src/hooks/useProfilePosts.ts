/**
 * 🎣 USE PROFILE POSTS HOOK
 * 
 * Fetches user profile posts with cursor-based infinite scrolling.
 * Uses TanStack Query for caching and smooth UI transitions.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../api/client';

/**
 * Interface for the API response
 */
interface ProfilePost {
  id: string;
  type: string;
  caption?: string;
  createdAt: string;
  thumbnail?: {
    id: string;
    blurhash: string;
    url: string;
  };
}

interface ProfileApiResponse {
  success: boolean;
  items: ProfilePost[];
  pagination: {
    nextCursor: string | null;
    hasNextPage: boolean;
    pageSize: number;
  };
}

export const useProfilePosts = (userId: string) => {
  return useInfiniteQuery<ProfileApiResponse>({
    queryKey: ['profile-posts', userId],
    queryFn: async ({ pageParam }) => {
      const response = await api.get(`/profile/${userId}/posts`, {
        params: {
          cursor: pageParam || undefined,
        },
      });
      return response.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    enabled: !!userId,
    // Keep data fresh but respect the CDN cache headers
    staleTime: 1000 * 30, // 30 seconds
  });
};
