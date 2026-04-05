import { useInfiniteQuery } from '@tanstack/react-query';
import { reelsApi } from '../api/reelsApi';
import { ReelsResponse } from '../types/reel';

/**
 * useReelsFeed Hook
 * Handles infinite pagination and server-state management for Reels.
 */
export const useReelsFeed = (limit: number = 10) => {
  return useInfiniteQuery<ReelsResponse>({
    queryKey: ['reels', 'feed'],
    queryFn: ({ pageParam = 1 }) => 
      reelsApi.fetchReelsFeed(pageParam as number, limit, 'latest'),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Backend provides hasMore and current page
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    // Keep data fresh but allow some caching for smooth scrolling
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
