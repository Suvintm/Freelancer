import { useQuery } from '@tanstack/react-query';
import { storyApi } from '../api/storyApi';

export interface StorySlide {
  id: string;
  image: string; // Master HLS or Optimized Image
  thumb: string;
  type: 'IMAGE' | 'VIDEO';
  caption?: string;
  durationMs?: number;
}

export interface StoryItem {
  _id: string;
  username: string;
  avatar: string;
  isSeen?: boolean;
  isUserStory?: boolean;
  hasActiveStory?: boolean;
  verifiedColor?: string; 
  slides: StorySlide[]; 
}

export const useStories = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stories', 'active'],
    queryFn: async () => {
        const result = await storyApi.getActiveStories();
        return result.data as StoryItem[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes stale time (matches test mode)
  });
  
  return {
    data: data || [],
    isLoading,
    isError,
    refetch,
    isFallbackData: false,
  };
};
