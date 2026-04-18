import { useMemo } from 'react';

export interface StorySlide {
  id: string;
  image: string;
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
  verifiedColor?: string; // Dynamic badge color for roles
  slides: StorySlide[]; 
}

import { SUVIX_INDUSTRY_STORIES } from '../data/suvixStories';

export const useStories = () => {
  const data = useMemo(() => SUVIX_INDUSTRY_STORIES, []);
  
  return {
    data,
    isLoading: false,
    isFallbackData: true,
  };
};
