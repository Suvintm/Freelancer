/**
 * 🎣 USE PROFILE REELS HOOK
 * 
 * Fetches user profile reels (isReel: true) with infinite scrolling.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../api/client';

interface ProfileReel {
  id: string;
  caption?: string;
  createdAt: string;
  media: {
    id: string;
    blurhash: string;
    duration: number;
    thumbnailUrl: string;
    urls: {
        video: string;
        hls: string;
        thumb: string;
    }
  } | null;
}

interface ReelsApiResponse {
  success: boolean;
  items: ProfileReel[];
  pagination: {
    nextCursor: string | null;
    hasNextPage: boolean;
    pageSize: number;
  };
}

export const useProfileReels = (userId: string) => {
  return useInfiniteQuery<ReelsApiResponse>({
    queryKey: ['profile-reels', userId],
    queryFn: async ({ pageParam }) => {
      const response = await api.get(`/profile/${userId}/reels`, {
        params: {
          cursor: pageParam || undefined,
        },
      });
      return response.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
};
