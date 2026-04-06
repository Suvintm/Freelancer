import { useMemo } from 'react';

export interface StoryItem {
  _id: string;
  username: string;
  avatar: string;
  isSeen?: boolean;
  isUserStory?: boolean;
}

const DEMO_STORIES: StoryItem[] = [
  {
    _id: 'user_story',
    username: 'Your Story',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    isUserStory: true,
  },
  {
    _id: '1',
    username: 'vince_creative',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150',
    isSeen: false,
  },
  {
    _id: '2',
    username: 'maya_editor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    isSeen: false,
  },
  {
    _id: '3',
    username: 'pixel_purist',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=150',
    isSeen: true,
  },
  {
    _id: '4',
    username: 'dhyan_motion',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    isSeen: false,
  },
  {
    _id: '5',
    username: 'suvix_official',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    isSeen: false,
  },
  {
    _id: '6',
    username: 'creative_flow',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    isSeen: true,
  },
];

export const useStories = () => {
  const data = useMemo(() => DEMO_STORIES, []);
  
  return {
    data,
    isLoading: false,
  };
};
