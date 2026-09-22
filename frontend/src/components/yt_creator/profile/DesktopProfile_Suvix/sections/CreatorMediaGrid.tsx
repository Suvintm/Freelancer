/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  MessageSquare, 
  Eye, 
  ThumbsUp, 
  Heart, 
  MessageCircle, 
  Trash2, 
  X, 
  LayoutGrid, 
  PlaySquare, 
  Youtube, 
  Image as ImageIcon,
  Users2, 
  Tag, 
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Upload,
  Plus,
  ExternalLink,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProfileTabType } from './CreatorContentTabs';
import { VerifiedBadge } from '../../../../ui/VerifiedBadge';
import defaultProfile from '../../../../../assets/defaultprofile.png';

interface CreatorMediaGridProps {
  activeTab: ProfileTabType;
  sortBy?: string;
  allVideos?: any[];
  userVideos?: any[];
  userPosts?: any[];
  userReels?: any[];
  thumbnailVotes?: any[];
  collabs?: any[];
  tagged?: any[];
  user?: any;
  isLoading?: boolean;
  onDeleteItem?: (id: string, e?: React.MouseEvent) => void;
}

// ── Fallback High-Quality Showcase Data ───────────────────────────────────────
const SAMPLE_YT_POSTS = [
  {
    id: 'yt-1',
    title: 'My Creator Setup 2025 | Gear, Tools & Workflow',
    channelName: 'Suvin T M',
    channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    duration: '12:34',
    view_count: 12400,
    like_count: 892,
    comment_count: 124,
    timeAgo: '3 days ago',
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'yt-2',
    title: 'Top 10 AI Tools Every Creator Should Use in 2025',
    channelName: 'Suvin T M',
    channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    duration: '10:21',
    view_count: 25100,
    like_count: 1400,
    comment_count: 210,
    timeAgo: '6 days ago',
    published_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'yt-3',
    title: 'Mobile Video Editing Tutorial (Complete Guide)',
    channelName: 'TechWithSam',
    channelAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800',
    duration: '8:17',
    view_count: 18600,
    like_count: 963,
    comment_count: 145,
    timeAgo: '10 days ago',
    published_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'yt-4',
    title: 'Kudremukh Travel Vlog | A Day in the Hills',
    channelName: 'Suvin T M',
    channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800',
    duration: '14:09',
    view_count: 32400,
    like_count: 2100,
    comment_count: 320,
    timeAgo: '2 weeks ago',
    published_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'yt-5',
    title: 'Build & Deploy a Full Stack App (React + Node.js)',
    channelName: 'CodeWithSuvin',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800',
    duration: '18:26',
    view_count: 14200,
    like_count: 1100,
    comment_count: 260,
    timeAgo: '2 weeks ago',
    published_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'yt-6',
    title: 'The Creator Mindset | Discipline, Consistency, Growth',
    channelName: 'Suvin T M',
    channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    duration: '9:44',
    view_count: 21700,
    like_count: 1300,
    comment_count: 188,
    timeAgo: '3 weeks ago',
    published_at: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
  {
    id: 'yt-7',
    title: 'How I Organize My Life with Notion (Template Included)',
    channelName: 'TechWithSam',
    channelAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200',
    thumbnail: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=800',
    duration: '11:36',
    view_count: 17900,
    like_count: 876,
    comment_count: 134,
    timeAgo: '3 weeks ago',
    published_at: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
  {
    id: 'yt-8',
    title: 'How I Grew from 0 to 10K Subscribers | My Journey',
    channelName: 'Suvin T M',
    channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    thumbnail: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800',
    duration: '13:02',
    view_count: 28300,
    like_count: 2400,
    comment_count: 412,
    timeAgo: '1 month ago',
    published_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

const SAMPLE_POSTS = [
  {
    _id: 'post-1',
    id: 'post-1',
    img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800'],
    comment: 'Studio setup desk tour 2024. Clean minimal setup for deep coding & video production sessions ⚡',
    likes: 1240,
    commentsCount: 88,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    tags: ['studio', 'desksetup', 'productivity'],
  },
  {
    _id: 'post-2',
    id: 'post-2',
    img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'],
    comment: 'Productivity breakdown: How time-blocking 90-minute creative sprints tripled my weekly output.',
    likes: 2150,
    commentsCount: 142,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    tags: ['creatoreconomy', 'deepwork'],
  },
  {
    _id: 'post-3',
    id: 'post-3',
    img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800'],
    comment: 'Behind the scenes shooting the new brand campaign video. Big announcement coming Friday!',
    likes: 3410,
    commentsCount: 230,
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    tags: ['bts', 'filmmaking'],
  },
  {
    _id: 'post-4',
    id: 'post-4',
    img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800'],
    comment: 'The next era of social media belongs to creators who own their audience relationships directly.',
    likes: 1890,
    commentsCount: 95,
    createdAt: new Date(Date.now() - 16 * 86400000).toISOString(),
    tags: ['creators', 'growth'],
  },
];

const SAMPLE_REELS = [
  {
    _id: 'reel-1',
    id: 'reel-1',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-43093-large.mp4',
    comment: '3 keyboard shortcuts that save me 2 hours every single day ⌨️',
    likes: 18400,
    commentsCount: 312,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    _id: 'reel-2',
    id: 'reel-2',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-43094-large.mp4',
    comment: 'Stop editing videos like this in 2024. Use dynamic sound design instead 🎧',
    likes: 24300,
    commentsCount: 420,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    _id: 'reel-3',
    id: 'reel-3',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-at-a-coffee-shop-43095-large.mp4',
    comment: 'How top YouTubers script their hooks to get 80%+ 30s retention rate 📈',
    likes: 31900,
    commentsCount: 560,
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

const SAMPLE_THUMBNAIL_VOTES = [
  {
    _id: 'poll-1',
    id: 'poll-1',
    comment: 'Which thumbnail layout will get a higher Click-Through Rate (CTR) for tomorrow’s video?',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    ],
    votes: [482, 198],
  },
];

const SAMPLE_COLLABS = [
  {
    id: 'collab-1',
    partnerName: 'Apex Creative Studio',
    partnerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    partnerRole: 'Video Production',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    title: 'Co-directed 4K Cinematic Brand Commercial for Nike India',
    category: 'Brand Sponsorship',
    views: '142K',
    likes: '12.4K',
    date: '2 weeks ago',
  },
  {
    id: 'collab-2',
    partnerName: 'TechReview Daily',
    partnerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    partnerRole: 'Tech Creator',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800',
    title: 'Dual Creator Roundtable: The Future of AI in Video Editing',
    category: 'Podcast Collaboration',
    views: '98K',
    likes: '8.7K',
    date: '1 month ago',
  },
];

const SAMPLE_TAGGED = [
  {
    id: 'tagged-1',
    taggedBy: 'DesignSystems Weekly',
    taggedByAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800',
    caption: 'Featured @suvintm as our Creator of the Month for exceptional UI design workflows!',
    date: '3 days ago',
  },
];

const formatCount = (count?: string | number) => {
  if (count === undefined || count === null || count === '') return '0';
  const num = typeof count === 'string' ? parseFloat(count) : count;
  if (isNaN(num)) return '0';
  if (num >= 1000000) {
    const formatted = (num / 1000000).toFixed(1);
    return formatted.endsWith('.0') ? `${Math.floor(num / 1000000)}M` : `${formatted}M`;
  }
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1);
    return formatted.endsWith('.0') ? `${Math.floor(num / 1000)}K` : `${formatted}K`;
  }
  return num.toString();
};

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
};

export const CreatorMediaGrid: React.FC<CreatorMediaGridProps> = ({
  activeTab,
  sortBy = 'Latest',
  allVideos = [],
  userVideos = [],
  userPosts = [],
  userReels = [],
  thumbnailVotes = [],
  collabs = [],
  tagged = [],
  user,
  isLoading = false,
  onDeleteItem,
}) => {
  const navigate = useNavigate();
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');

  // Dynamic connected YouTube channels
  const channels: any[] = useMemo(() => {
    if (Array.isArray(user?.youtubeProfile) && user.youtubeProfile.length > 0) {
      return user.youtubeProfile;
    }
    return [];
  }, [user?.youtubeProfile]);

  // ── 1. Resolve Active Items with Realistic Fallbacks ────────────────────────
  const rawItems = useMemo(() => {
    switch (activeTab) {
      case 'yt_videos':
        return allVideos.length > 0 ? allVideos : SAMPLE_YT_POSTS;
      case 'yt_posts':
        return userVideos.length > 0 ? userVideos : SAMPLE_POSTS;
      case 'posts':
        return userPosts.length > 0 ? userPosts : SAMPLE_POSTS;
      case 'reels':
        return userReels.length > 0 ? userReels : SAMPLE_REELS;
      case 'thumbnail_vote':
        return thumbnailVotes.length > 0 ? thumbnailVotes : SAMPLE_THUMBNAIL_VOTES;
      case 'collabs':
        return collabs.length > 0 ? collabs : SAMPLE_COLLABS;
      case 'tagged':
        return tagged.length > 0 ? tagged : SAMPLE_TAGGED;
      default:
        return userPosts.length > 0 ? userPosts : SAMPLE_POSTS;
    }
  }, [activeTab, allVideos, userVideos, userPosts, userReels, thumbnailVotes, collabs, tagged]);

  // ── 2. Dynamic Sort Order ───────────────────────────────────────────────────
  const sortedItems = useMemo(() => {
    const list = [...rawItems];
    if (sortBy === 'Popular') {
      return list.sort((a, b) => {
        const aCount = a.views || a.view_count || a.likes || 0;
        const bCount = b.views || b.view_count || b.likes || 0;
        return (typeof bCount === 'number' ? bCount : 0) - (typeof aCount === 'number' ? aCount : 0);
      });
    }
    if (sortBy === 'Oldest') {
      return list.sort((a, b) => {
        const aDate = new Date(a.createdAt || a.created_at || a.published_at || a.publishedAt || 0).getTime();
        const bDate = new Date(b.createdAt || b.created_at || b.published_at || b.publishedAt || 0).getTime();
        return aDate - bDate;
      });
    }
    if (sortBy === 'Most Discussed') {
      return list.sort((a, b) => {
        const aComm = a.comment_count || a.commentsCount || 0;
        const bComm = b.comment_count || b.commentsCount || 0;
        return bComm - aComm;
      });
    }
    // Default 'Latest'
    return list.sort((a, b) => {
      const aDate = new Date(a.createdAt || a.created_at || a.published_at || a.publishedAt || 0).getTime();
      const bDate = new Date(b.createdAt || b.created_at || b.published_at || b.publishedAt || 0).getTime();
      return bDate - aDate;
    });
  }, [rawItems, sortBy]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 mt-3">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="h-44 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full mt-2">
      {/* ──────────────── 1. TAB: YouTube Videos (Real YouTube Channel Videos) ────── */}
      {activeTab === 'yt_videos' && (
        <div className="space-y-4">
          {/* ── Top Header Row: Title & Upload Video Button ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h3 className="text-base sm:text-[17px] font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">
                YouTube Videos
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-0.5 leading-none">
                All videos from your connected YouTube channels in one place.
              </p>
            </div>

            {/* Upload Video Button */}
            <button
              type="button"
              onClick={() => navigate('/upload')}
              className="flex items-center gap-2 h-9 px-3.5 rounded-xl bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-black text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Upload size={14} strokeWidth={2.2} />
              <span>Upload Video</span>
              <ChevronDown size={13} strokeWidth={2.2} />
            </button>
          </div>

          {/* ── Channels Filter Bar / Connect Button Row ── */}
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide py-0.5">
            {channels.length === 0 ? (
              /* If no account connected: show Connect YouTube Channel button */
              <button
                type="button"
                onClick={() => navigate('/connect-socials')}
                className="flex items-center gap-2 h-11 px-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all cursor-pointer text-xs font-bold text-zinc-800 dark:text-zinc-200 shadow-2xs group shrink-0"
              >
                <Plus size={14} strokeWidth={2.2} className="text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-white" />
                <span>Connect YouTube Channel</span>
              </button>
            ) : (
              /* If 1 or more accounts connected */
              <>
                {/* All Channels Filter Pill */}
                <button
                  type="button"
                  onClick={() => setSelectedChannelId('all')}
                  className={`flex items-center gap-2.5 h-11 px-3.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                    selectedChannelId === 'all'
                      ? 'bg-zinc-950 dark:bg-white text-white dark:text-black shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs'
                  }`}
                >
                  <LayoutGrid size={15} strokeWidth={2.2} className={selectedChannelId === 'all' ? 'text-white dark:text-black' : 'text-zinc-400'} />
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-xs font-bold">All Channels</span>
                    <span className={`text-[10px] mt-0.5 ${selectedChannelId === 'all' ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-400'}`}>
                      ({channels.length} {channels.length === 1 ? 'channel' : 'channels'})
                    </span>
                  </div>
                </button>

                {/* Each Connected Channel Card */}
                {channels.map((ch: any) => {
                  const chId = ch.channel_id || ch.channelId || ch.id || ch.channel_name;
                  const isSelected = selectedChannelId === chId;
                  const subCount = ch.subscriber_count || ch.subscribers || 0;
                  const avatar = ch.thumbnail_url || ch.channel_avatar || defaultProfile;

                  return (
                    <button
                      key={chId}
                      type="button"
                      onClick={() => setSelectedChannelId(chId)}
                      className={`flex items-center gap-2.5 h-11 px-3.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-zinc-950 dark:bg-white text-white dark:text-black shadow-xs'
                          : 'bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs'
                      }`}
                    >
                      <img
                        src={avatar}
                        alt={ch.channel_name}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 border border-zinc-200/60 dark:border-zinc-700"
                      />
                      <div className="flex flex-col text-left leading-none max-w-[130px]">
                        <span className="text-xs font-bold truncate">
                          {ch.channel_name}
                        </span>
                        <span className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-400'}`}>
                          {formatCount(subCount)} subscribers
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* Connect More Channel Button */}
                <button
                  type="button"
                  onClick={() => navigate('/connect-socials')}
                  className="flex items-center gap-1.5 h-11 px-3.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-white dark:hover:bg-zinc-850 hover:border-zinc-400 transition-all cursor-pointer group shrink-0 text-zinc-800 dark:text-zinc-200"
                >
                  <Plus size={14} strokeWidth={2.2} className="text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-white" />
                  <span className="text-xs font-bold leading-none">
                    Connect YouTube Channel
                  </span>
                </button>
              </>
            )}
          </div>

          {/* ── Real YouTube Videos Grid (Exact 4-Column Grid Design) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedItems
              .filter((video: any) => {
                if (selectedChannelId === 'all') return true;
                return (
                  video.channel_id === selectedChannelId ||
                  video.channelId === selectedChannelId ||
                  video.channel_name === selectedChannelId ||
                  video.channelTitle === selectedChannelId ||
                  video.channelName === selectedChannelId
                );
              })
              .map((video: any) => {
                const matchedChannel = channels.find((ch: any) => {
                  const chId = ch.channel_id || ch.channelId || ch.id;
                  const vChId = video.channel_id || video.channelId;
                  if (chId && vChId && String(chId) === String(vChId)) return true;
                  if (ch.channel_name && (ch.channel_name === video.channel_name || ch.channel_name === video.channelTitle)) return true;
                  return false;
                }) || (channels.length > 0 ? channels[0] : null);

                const channelAvatar =
                  video.channel_avatar ||
                  video.channelAvatar ||
                  video.channelThumbnail ||
                  matchedChannel?.thumbnail_url ||
                  matchedChannel?.channel_avatar ||
                  matchedChannel?.avatar ||
                  defaultProfile;

                const channelName =
                  video.channel_name ||
                  video.channelName ||
                  video.channelTitle ||
                  matchedChannel?.channel_name ||
                  matchedChannel?.title ||
                  'YouTube Channel';

                return (
                  <div
                    key={video.id || video._id}
                    onClick={() => setSelectedMedia({ ...video, type: 'yt_video', comment: video.title, img: video.thumbnail || video.img })}
                    className="group cursor-pointer select-none flex flex-col"
                  >
                    {/* Thumbnail Container */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      <img
                        src={video.thumbnail || video.img || video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Duration Badge */}
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/85 backdrop-blur-xs text-[10.5px] font-bold text-white tracking-tight leading-none">
                          {video.duration}
                        </div>
                      )}
                    </div>

                    {/* Channel Info & Title Row */}
                    <div className="flex items-start gap-2.5 mt-2.5 px-0.5">
                      <img
                        src={channelAvatar}
                        alt={channelName}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-tight truncate">
                          {channelName}
                        </h4>
                        <p className="text-xs font-normal sm:font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-snug mt-0.5">
                          {video.title}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 shrink-0 ml-1 transition-colors"
                        title="Options"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>

                  {/* Bottom Stats Line */}
                  <div className="flex items-center justify-between mt-2.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 px-0.5">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye size={12} strokeWidth={1.8} className="text-zinc-400 dark:text-zinc-500" />
                        <span>{formatCount(video.view_count || video.viewCount || video.views)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={11} strokeWidth={1.8} className="text-zinc-400 dark:text-zinc-500" />
                        <span>{formatCount(video.like_count || video.likes || video.likeCount)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={11} strokeWidth={1.8} className="text-zinc-400 dark:text-zinc-500" />
                        <span>{formatCount(video.comment_count || video.commentsCount || video.commentCount)}</span>
                      </span>
                    </div>
                    <span className="text-[10.5px] font-medium text-zinc-400 dark:text-zinc-500">
                      {video.timeAgo || formatTimeAgo(video.published_at || video.publishedAt || video.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────── 2. TAB: YT Posts (Platform Landscape Videos & Community Posts) ─ */}
      {activeTab === 'yt_posts' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
          {sortedItems.map((video: any) => (
            <div
              key={video._id || video.id}
              onClick={() => setSelectedMedia({ ...video, type: 'video' })}
              className="group relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer shadow-2xs hover:shadow-md transition-all duration-300"
            >
              <img
                src={video.thumbnail || video.img || video.videoUrl}
                alt={video.comment || video.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Bottom Left Play Icon */}
              <div className="absolute bottom-2.5 left-2.5 p-1.5 bg-black/70 backdrop-blur-md rounded-full text-white group-hover:scale-110 transition-transform">
                <Play size={13} className="fill-white" />
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3.5">
                <div className="flex justify-end">
                  {onDeleteItem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(video._id || video.id, e);
                      }}
                      className="p-1.5 bg-red-600/80 hover:bg-red-600 rounded-full text-white transition-colors"
                      title="Delete Post"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="text-white space-y-1">
                  <p className="text-xs font-bold line-clamp-2 leading-tight">{video.comment || video.title}</p>
                  <div className="flex items-center gap-3 text-[11px] font-semibold">
                    <span className="flex items-center gap-1"><Heart size={12} fill="white" /> {formatCount(video.likes)}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={12} fill="white" /> {formatCount(video.commentsCount)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ──────────────── 3. TAB: Posts (Square Instagram Grid) ───────────────── */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
          {sortedItems.map((post: any) => (
            <div
              key={post._id || post.id}
              onClick={() => setSelectedMedia({ ...post, type: 'post' })}
              className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer shadow-2xs hover:shadow-md transition-all duration-300"
            >
              <img
                src={post.images?.[0] || post.img}
                alt={post.comment}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Multi-Image Indicator */}
              {post.images && post.images.length > 1 && (
                <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md p-1.5 rounded-lg text-white">
                  <LayoutGrid size={12} />
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
                <div className="flex justify-end">
                  {onDeleteItem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(post._id || post.id, e);
                      }}
                      className="p-1.5 bg-red-600/80 hover:bg-red-600 rounded-full text-white transition-colors"
                      title="Delete Post"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="text-white space-y-1">
                  <p className="text-xs font-bold line-clamp-2 leading-tight">{post.comment}</p>
                  <div className="flex items-center gap-3 text-[11px] font-semibold">
                    <span className="flex items-center gap-1"><Heart size={12} fill="white" /> {formatCount(post.likes)}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={12} fill="white" /> {formatCount(post.commentsCount)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ──────────────── 4. TAB: Reels (Vertical 9:16 Cards) ─────────────────── */}
      {activeTab === 'reels' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
          {sortedItems.map((reel: any) => (
            <div
              key={reel._id || reel.id}
              onClick={() => setSelectedMedia({ ...reel, type: 'reel' })}
              className="group relative aspect-[9/16] rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer shadow-2xs hover:shadow-md transition-all duration-300"
            >
              <img
                src={reel.img || reel.videoUrl}
                alt={reel.comment}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Bottom Left PlaySquare Pill */}
              <div className="absolute bottom-2.5 left-2.5 p-1.5 bg-black/70 backdrop-blur-md rounded-full text-white group-hover:scale-110 transition-transform">
                <PlaySquare size={13} />
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3.5">
                <div className="flex justify-end">
                  {onDeleteItem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(reel._id || reel.id, e);
                      }}
                      className="p-1.5 bg-red-600/80 hover:bg-red-600 rounded-full text-white transition-colors"
                      title="Delete Reel"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="text-white space-y-1">
                  <p className="text-xs font-bold line-clamp-2 leading-tight">{reel.comment}</p>
                  <div className="flex items-center gap-3 text-[11px] font-semibold">
                    <span className="flex items-center gap-1"><Heart size={12} fill="white" /> {formatCount(reel.likes)}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={12} fill="white" /> {formatCount(reel.commentsCount)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ──────────────── 5. TAB: Thumbnails (A/B Voting Polls) ──────────────── */}
      {activeTab === 'thumbnail_vote' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedItems.map((poll: any) => {
            const images = poll.images || [];
            const votes = poll.votes || new Array(images.length).fill(0);
            const totalVotes = votes.reduce((a: number, b: number) => a + b, 0);

            return (
              <div
                key={poll._id || poll.id}
                className="rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10.5px] font-bold text-zinc-400">
                    {new Date(poll.createdAt || poll.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Active Poll
                  </span>
                </div>

                {/* Caption */}
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-2 mb-3">
                  {poll.comment || 'Which thumbnail layout gets the highest click-through rate?'}
                </h4>

                {/* Side-by-Side Thumbnail Comparison */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {images.map((img: string, idx: number) => {
                    const voteCount = votes[idx] || 0;
                    const percentage = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
                    const isWinner = totalVotes > 0 && voteCount === Math.max(...votes);

                    return (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group">
                        <img src={img} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                        
                        {/* Vote Results Overlay */}
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-1">
                          <span className="text-white font-black text-sm sm:text-base">{percentage}%</span>
                          <span className="text-[9px] text-zinc-300 font-semibold">{voteCount} votes</span>
                          {isWinner && (
                            <span className="absolute top-1 right-1 bg-amber-400 text-zinc-950 text-[7.5px] font-black uppercase px-1.5 py-0.2 rounded shadow-xs">
                              Winner
                            </span>
                          )}
                        </div>

                        {/* Option Tag */}
                        <span className="absolute top-1 left-1 bg-black/75 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] text-white font-bold">
                          Option {idx === 0 ? 'A' : idx === 1 ? 'B' : String.fromCharCode(65 + idx)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Stats */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2.5 flex items-center justify-between text-[11px] font-bold text-zinc-500">
                  <span>Total Votes: {totalVotes}</span>
                  <span className="text-zinc-400 font-normal">Updated Live</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ──────────────── 6. TAB: Collabs (Collaborations) ───────────────────── */}
      {activeTab === 'collabs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sortedItems.map((collab: any) => (
            <div
              key={collab.id}
              className="rounded-2xl p-3.5 border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex items-center gap-3.5 group hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 relative">
                <img src={collab.thumbnail} alt={collab.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[8px] font-black uppercase">
                  Collab
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <img src={collab.partnerAvatar} alt={collab.partnerName} className="w-4 h-4 rounded-full object-cover" />
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate">{collab.partnerName}</span>
                </div>
                <h4 className="text-xs font-black text-zinc-900 dark:text-white leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                  {collab.title}
                </h4>
                <div className="flex items-center gap-3 mt-2 text-[10.5px] font-semibold text-zinc-400">
                  <span>{collab.views} views</span>
                  <span>•</span>
                  <span>{collab.likes} likes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ──────────────── 7. TAB: Tagged (Mentions & Community Tags) ──────────── */}
      {activeTab === 'tagged' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {sortedItems.map((item: any) => (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs group cursor-pointer"
            >
              <div className="aspect-video relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <img src={item.taggedByAvatar || defaultProfile} alt="" className="w-4 h-4 rounded-full object-cover" />
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">@{item.taggedBy}</span>
                  <span className="text-[10px] text-zinc-400 ml-auto">{item.date}</span>
                </div>
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ──────────────── 8. Media Detail Modal (Immersive Viewer) ─────────────── */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-sm select-none"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-4xl h-[72vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="absolute top-3.5 right-3.5 z-20 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>

              {/* Left: Media Display Screen */}
              <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
                {selectedMedia.type === 'reel' || selectedMedia.videoUrl ? (
                  <video
                    src={selectedMedia.videoUrl}
                    poster={selectedMedia.img || selectedMedia.thumbnail}
                    controls
                    autoPlay
                    loop
                    className="w-full max-h-full object-contain"
                  />
                ) : (
                  <PostImageSlider images={selectedMedia.images?.length > 0 ? selectedMedia.images : [selectedMedia.img || selectedMedia.thumbnail]} />
                )}
              </div>

              {/* Right: Creator Info & Interaction Panel */}
              <div className="w-full md:w-[320px] lg:w-[340px] flex flex-col h-full bg-white dark:bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800">
                {/* Author Header */}
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user?.profilePicture || defaultProfile}
                      className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                      alt={user?.name || 'Creator'}
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs font-black text-zinc-900 dark:text-white leading-tight">{user?.name || 'Suvin T M'}</h4>
                        <VerifiedBadge isVerified={true} role="Creator" className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[10.5px] font-medium text-zinc-400">@{user?.username || 'suvintm'}</p>
                    </div>
                  </div>
                  {onDeleteItem && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteItem(selectedMedia._id || selectedMedia.id);
                        setSelectedMedia(null);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Caption & Metadata */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedMedia.comment && (
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {selectedMedia.comment}
                    </p>
                  )}

                  {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedMedia.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] font-medium text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    Uploaded {new Date(selectedMedia.createdAt || selectedMedia.created_at || selectedMedia.published_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {/* Footer Interaction Bar */}
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between text-xs font-black text-zinc-900 dark:text-white">
                  <span className="flex items-center gap-1.5">
                    <Heart size={15} className="text-red-500 fill-red-500" />
                    {formatCount(selectedMedia.likes || 1240)} Likes
                  </span>
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <MessageCircle size={15} />
                    {formatCount(selectedMedia.commentsCount || selectedMedia.comment_count || 48)} Comments
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Multi-Image Slider for Post Previews ──────────────────────────────────────
const PostImageSlider: React.FC<{ images: string[] }> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <img
        src={images[currentIndex]}
        alt=""
        className="w-full h-full object-contain select-none"
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
            className="absolute left-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors border border-white/15 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
            className="absolute right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors border border-white/15 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>

          <div className="absolute bottom-3 flex gap-1.5">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'bg-white scale-125' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

