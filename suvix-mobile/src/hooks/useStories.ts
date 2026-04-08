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
  slides: StorySlide[]; // Added multi-slide support
}

const DEMO_STORIES: StoryItem[] = [
  {
    _id: 'user_story',
    username: 'Your Story',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    isUserStory: true,
    hasActiveStory: true,
    slides: [
      { id: 'u1', image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=1080', caption: 'Loving the SuviX creative vibes! 🚀' },
      { id: 'u2', image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=1080', caption: 'New project starting today.' },
    ]
  },
  {
    _id: '1',
    username: 'vince_creative',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150',
    isSeen: false,
    slides: [
      { id: 'v1', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1080', caption: 'Setup goals 💻' },
      { id: 'v2', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1080', caption: 'Clean code, clean mind.' },
    ]
  },
  {
    _id: '2',
    username: 'maya_editor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    isSeen: false,
    slides: [
      { id: 'm1', image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=1080', caption: 'Grading this new reel 🎨' },
    ]
  },
  {
    _id: '3',
    username: 'pixel_purist',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=150',
    isSeen: true,
    slides: [
      { id: 'p1', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1080', caption: 'Nikon vs Sony?' },
    ]
  },
  {
    _id: '4',
    username: 'dhyan_motion',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    isSeen: false,
    slides: [
      { id: 'd1', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1080', caption: 'Retro edit in progress...' },
    ]
  },
  {
    _id: '5',
    username: 'suvix_official',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    isSeen: false,
    slides: [
      { id: 's1', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1080', caption: 'Join the next creator workshop!' },
    ]
  }
];

export const useStories = () => {
  const data = useMemo(() => DEMO_STORIES, []);
  
  return {
    data,
    isLoading: false,
  };
};
