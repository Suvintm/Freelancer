import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { api } from '../api/client';

export type FeedItemType = 'POST' | 'REEL' | 'SUGGESTION_EDITORS' | 'SUGGESTION_RENTALS' | 'YOUTUBE_DISCOVERY' | 'THUMBNAIL_VOTE' | 'POLL' | 'YT_VIDEO';

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

const MOCK_THUMB_VOTE = {
  id: 'mock_thumb_vote',
  user: 'SuviX Official',
  location: 'Global',
  img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
  images: [
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=800'
  ],
  likes: 12400,
  comment: 'Help me choose the thumbnail for my next UI/UX redesign tutorial! Which one grabs your attention?',
  commentsCount: 342,
  tags: ['UIUX', 'Design', 'YouTubeGrowth'],
  votes: [120, 85, 43, 98]
};

const MOCK_POLL = {
  id: 'mock_poll_post',
  user: {
    username: 'TechVibe',
    profile: { name: 'TechVibe Reviews', profile_picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' }
  },
  like_count: 542,
  isLiked: false,
  poll: {
    id: 'poll-1',
    question: 'Which editing software do you use the most for your video projects?',
    type: 'MULTIPLE_CHOICE',
    totalVotes: 3520,
    options: [
      { id: 'opt-1', text: 'Adobe Premiere Pro', order_index: 0, _count: { responses: 1620 } },
      { id: 'opt-2', text: 'DaVinci Resolve', order_index: 1, _count: { responses: 1240 } },
      { id: 'opt-3', text: 'Final Cut Pro', order_index: 2, _count: { responses: 480 } },
      { id: 'opt-4', text: 'Other (CapCut, etc.)', order_index: 3, _count: { responses: 180 } }
    ]
  }
};

const MOCK_YT_VIDEO = {
  id: 'mock_yt_video',
  user: 'MKBHD',
  location: 'New York, USA',
  img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
  likes: 42100,
  comment: 'Check out my full review of the new spatial computing headset! Video linked below.',
  commentsCount: 1840,
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  ytChannelName: 'Marques Brownlee',
  ytSubscribeLink: 'https://youtube.com',
  watchOnYtLink: 'https://youtube.com'
};

const resolveMediaUrl = (path: string | undefined | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = api.defaults.baseURL || 'http://192.168.0.175:5051/api';
  const cleanBase = baseUrl.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}/${cleanPath}`;
};

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  feed: [],
  isLoading: false,
  refreshFeed: async () => {
    const { setIsRefreshing } = useAuthStore.getState();
    set({ isLoading: true });
    setIsRefreshing(true);
    
    const fallbackFeed: FeedItem[] = [
      { id: 'y1', type: 'YOUTUBE_DISCOVERY', data: {} },
      { id: 'p1', type: 'POST', data: MOCK_POSTS[0] },
      { id: 'thumb1', type: 'THUMBNAIL_VOTE', data: MOCK_THUMB_VOTE },
      { id: 'r1_reel', type: 'REEL', data: MOCK_REELS[0] },
      { id: 'poll1', type: 'POLL', data: MOCK_POLL },
      { id: 's1', type: 'SUGGESTION_EDITORS', data: MOCK_EDITORS },
      { id: 'yt_vid1', type: 'YT_VIDEO', data: MOCK_YT_VIDEO },
      { id: 'r2_reel', type: 'REEL', data: MOCK_REELS[1] },
      { id: 'p2', type: 'POST', data: MOCK_POSTS[1] },
      { id: 'r3_reel', type: 'REEL', data: MOCK_REELS[2] },
      { id: 's2', type: 'SUGGESTION_RENTALS', data: MOCK_RENTALS },
      { id: 'r4_reel', type: 'REEL', data: MOCK_REELS[3] },
    ];

    try {
      // 📡 Concurrent Axios calls to backend temp-feed and polls
      const [tempFeedRes, pollsRes] = await Promise.all([
        api.get('/temp-feed').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/polls').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      const dbItems: FeedItem[] = [];

      // 1. Process Temp-Feed Items
      if (tempFeedRes.data?.success && Array.isArray(tempFeedRes.data.data)) {
        tempFeedRes.data.data.forEach((item: any) => {
          const avatarUrl = resolveMediaUrl(item.author?.avatar) || MOCK_AVATARS[0];
          const authorName = item.user || item.author?.name || 'Creator';
          const captionText = item.comment || item.caption || '';
          const locationName = item.location || 'Global';
          const likesCount = typeof item.likes === 'number' ? item.likes : parseInt(item.likes, 10) || 0;
          const commentsCount = item.commentsCount || 0;

          if (item.type === 'reel') {
            dbItems.push({
              id: item._id,
              type: 'REEL',
              data: {
                id: item._id,
                author: { name: authorName, avatar: avatarUrl },
                thumbnail: resolveMediaUrl(item.images?.[0] || item.img || ''),
                videoUrl: resolveMediaUrl(item.videoUrl || ''),
                title: captionText,
                views: '150K'
              }
            });
          } else if (item.type === 'yt_video') {
            dbItems.push({
              id: item._id,
              type: 'YT_VIDEO',
              data: {
                id: item._id,
                user: authorName,
                location: locationName,
                img: resolveMediaUrl(item.images?.[0] || item.img || ''),
                likes: likesCount,
                comment: captionText,
                commentsCount: commentsCount,
                videoUrl: resolveMediaUrl(item.videoUrl || ''),
                ytChannelName: item.ytChannelName || '',
                ytSubscribeLink: item.ytSubscribeLink || '',
                watchOnYtLink: item.watchOnYtLink || ''
              }
            });
          } else if (item.type === 'thumbnail_vote') {
            dbItems.push({
              id: item._id,
              type: 'THUMBNAIL_VOTE',
              data: {
                id: item._id,
                user: authorName,
                location: locationName,
                img: resolveMediaUrl(item.images?.[0] || item.img || ''),
                images: Array.isArray(item.images) ? item.images.map((img: string) => resolveMediaUrl(img)) : [],
                likes: likesCount,
                comment: captionText,
                commentsCount: commentsCount,
                tags: item.tags || [],
                votes: item.votes || []
              }
            });
          } else {
            // Default to POST
            dbItems.push({
              id: item._id,
              type: 'POST',
              data: {
                author: { name: authorName, avatar: avatarUrl, location: locationName },
                image: resolveMediaUrl(item.images?.[0] || item.img || ''),
                caption: captionText,
                likes: likesCount,
                comments: commentsCount
              }
            });
          }
        });
      }

      // 2. Process Poll Items
      if (pollsRes.data?.success && Array.isArray(pollsRes.data.data)) {
        pollsRes.data.data.forEach((p: any) => {
          dbItems.push({
            id: p.id,
            type: 'POLL',
            data: {
              id: p.id,
              user: {
                username: p.user?.username || 'Creator',
                profile: {
                  name: p.user?.profile?.name || '',
                  profile_picture: resolveMediaUrl(p.user?.profile?.profile_picture) || ''
                }
              },
              like_count: p.like_count || 0,
              isLiked: p.isLiked || false,
              poll: {
                ...p.poll,
                totalVotes: p.poll?._count?.responses || 0,
                options: p.poll?.options || []
              }
            }
          });
        });
      }

      // If we got items from the database, assemble the full feed
      if (dbItems.length > 0) {
        const assembledFeed: FeedItem[] = [
          { id: 'y1', type: 'YOUTUBE_DISCOVERY', data: {} }
        ];

        dbItems.forEach((item, index) => {
          assembledFeed.push(item);
          // Interleave suggestion carousels at specific intervals
          if (index === 2) {
            assembledFeed.push({ id: 's1', type: 'SUGGESTION_EDITORS', data: MOCK_EDITORS });
          } else if (index === 5) {
            assembledFeed.push({ id: 's2', type: 'SUGGESTION_RENTALS', data: MOCK_RENTALS });
          }
        });

        // Ensure suggestion carousels are included even if feed is short
        if (dbItems.length <= 2) {
          assembledFeed.push({ id: 's1', type: 'SUGGESTION_EDITORS', data: MOCK_EDITORS });
        }
        if (dbItems.length <= 5) {
          assembledFeed.push({ id: 's2', type: 'SUGGESTION_RENTALS', data: MOCK_RENTALS });
        }

        set({ feed: assembledFeed, isLoading: false });
      } else {
        // Fallback to local mock items if DB is empty
        set({ feed: fallbackFeed, isLoading: false });
      }
    } catch (err) {
      console.error('Error loading backend temp feed in store:', err);
      // Fallback to local mock items if network request fails
      set({ feed: fallbackFeed, isLoading: false });
    } finally {
      setIsRefreshing(false);
    }
  }
}));
