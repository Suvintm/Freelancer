import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export type FeedItemType = 'POST' | 'REEL' | 'SUGGESTION_EDITORS' | 'SUGGESTION_RENTALS' | 'YOUTUBE_DISCOVERY';

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
    id: 'r1',
    author: { name: 'Cinematic Joy', avatar: MOCK_AVATARS[0] },
    thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', // Landscape (16:9)
    title: 'Landscape Mode (16:9)',
    views: '1.2M'
  },
  {
    id: 'r2',
    author: { name: 'Luca Cuts', avatar: MOCK_AVATARS[1] },
    thumbnail: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', // Balanced
    title: 'Square Focus (1:1)',
    views: '450K'
  },
  {
    id: 'r3',
    author: { name: 'Vertical Pro', avatar: MOCK_AVATARS[2] },
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=600&h=1000',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4', // Tall test
    title: 'Portrait View (4:5)',
    views: '850K'
  },
  {
    id: 'r4',
    author: { name: 'Elite Vertical', avatar: MOCK_AVATARS[3] },
    thumbnail: 'https://images.unsplash.com/photo-1540331547168-8b63109225b7?q=80&w=600&h=1000',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Max Vertical
    title: 'Max Vertical (9:16)',
    views: '2.1M'
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
      { id: 'y1', type: 'YOUTUBE_DISCOVERY', data: {} },
      { id: 'p1', type: 'POST', data: MOCK_POSTS[0] },
      { id: 'r1_reel', type: 'REEL', data: MOCK_REELS[0] },
      { id: 's1', type: 'SUGGESTION_EDITORS', data: MOCK_EDITORS },
      { id: 'r2_reel', type: 'REEL', data: MOCK_REELS[1] },
      { id: 'p2', type: 'POST', data: MOCK_POSTS[1] },
      { id: 'r3_reel', type: 'REEL', data: MOCK_REELS[2] },
      { id: 's2', type: 'SUGGESTION_RENTALS', data: MOCK_RENTALS },
      { id: 'r4_reel', type: 'REEL', data: MOCK_REELS[3] },
    ];

    // Artificial delay for skeletal animation impact
    await new Promise(resolve => setTimeout(resolve, 800));
    
    set({ feed: newFeed, isLoading: false });
    setIsRefreshing(false);
  }
}));
