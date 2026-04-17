import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export type FeedItemType = 'POST' | 'REEL' | 'SUGGESTION_EDITORS' | 'SUGGESTION_RENTALS';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  data: any;
}

interface DiscoveryState {
  feed: FeedItem[];
  isLoading: boolean;
  refreshFeed: () => void;
}

const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1540331547168-8b63109225b7?q=80&w=200',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
];

const MOCK_POSTS = [
  {
    author: { name: 'Alex Rivera', avatar: MOCK_AVATARS[0], location: 'Berlin, Germany' },
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1000',
    caption: 'Great day at the set with the new Sony A7R IV. The clarity is insane! 🎥🔥',
    likes: 1240,
    comments: 84
  },
  {
    author: { name: 'Sarah Chen', avatar: MOCK_AVATARS[1], location: 'Singapore' },
    image: 'https://images.unsplash.com/photo-1493723843671-1d655e66ac1c?q=80&w=1000',
    caption: 'Minimalist editing setup goals. Clean mind, clean cuts. #Editing #Setup',
    likes: 856,
    comments: 42
  }
];

const MOCK_REELS = [
  {
    author: { name: 'Jordan Film', avatar: MOCK_AVATARS[2] },
    thumbnail: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600&h=1000',
    title: 'Color Grading Secrets',
    views: '1.2M'
  },
  {
    author: { name: 'Creative Flow', avatar: MOCK_AVATARS[3] },
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=600&h=1000',
    title: 'POV: Your New Camera Picked You',
    views: '450K'
  }
];

const MOCK_EDITORS = [
  { id: 'e1', name: 'Vfx Master', avatar: MOCK_AVATARS[0], rating: 4.9, specialty: 'After Effects' },
  { id: 'e2', name: 'Luca Cuts', avatar: MOCK_AVATARS[1], rating: 4.8, specialty: 'Premiere Pro' },
  { id: 'e3', name: 'Cinematic Joy', avatar: MOCK_AVATARS[2], rating: 5.0, specialty: 'DaVinci Resolve' },
];

const MOCK_RENTALS = [
  { id: 'r1', name: 'Sony A7S III', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400', price: '₹2500/day' },
  { id: 'r2', name: 'DJI Ronin RS3', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=400', price: '₹1200/day' },
  { id: 'r3', name: 'Red Komodo 6K', image: 'https://images.unsplash.com/photo-1589134719002-5883506fb95e?q=80&w=400', price: '₹8000/day' },
];

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  feed: [],
  isLoading: false,
  refreshFeed: async () => {
    const { setIsRefreshing } = useAuthStore.getState();
    set({ isLoading: true });
    setIsRefreshing(true);
    
    const newFeed: FeedItem[] = [
      { id: 'p1', type: 'POST', data: MOCK_POSTS[0] },
      { id: 'r1_reel', type: 'REEL', data: MOCK_REELS[0] },
      { id: 's1', type: 'SUGGESTION_EDITORS', data: MOCK_EDITORS },
      { id: 'p2', type: 'POST', data: MOCK_POSTS[1] },
      { id: 's2', type: 'SUGGESTION_RENTALS', data: MOCK_RENTALS },
      { id: 'r2_reel', type: 'REEL', data: MOCK_REELS[1] },
    ];

    // Artificial delay for skeletal animation impact
    await new Promise(resolve => setTimeout(resolve, 800));
    
    set({ feed: newFeed, isLoading: false });
    setIsRefreshing(false);
  }
}));
