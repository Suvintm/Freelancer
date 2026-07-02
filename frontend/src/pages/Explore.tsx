import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Users, Play, Camera, CheckCircle2, UserPlus, MoreHorizontal, Loader2, Youtube, MessageSquare, ChevronRight, MessageCircle, Search } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, updateUser } from '../store/slices/authSlice';
import { useTheme } from '../hooks/useTheme';
import defaultProfile from '../assets/defaultprofile.png';
import { api } from '../api/client';
interface ExploreProfile {
  id: string;
  userId: string;
  name: string;
  username: string;
  profilePicture: string | null;
  location?: string;
  bio?: string;
  roles?: string[];
}

interface SyncedVideo {
  id: string;
  title: string;
  thumbnail: string;
  viewCount: number;
}

interface YouTubeChannelProfile {
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  bannerUrl?: string | null;
  subscriberCount: number;
  videoCount: number;
  viewCount: string | number;
  averageViews: number;
  engagementRate: number;
  videos?: SyncedVideo[];
}

interface CreatorProfile {
  id: string;
  userId: string;
  name: string;
  username: string;
  profilePicture: string | null;
  coverBanner: string | null;
  location?: string;
  bio?: string;
  roles?: string[];
  youtubeProfiles?: YouTubeChannelProfile[];
}

interface ChannelCard {
  id: string;
  creator: CreatorProfile;
  channelId?: string;
  channelName: string;
  thumbnailUrl: string;
  bannerUrl?: string | null;
  subscriberCount: number;
  averageViews: number;
  engagementRate: number;
  videos: SyncedVideo[];
  isStub: boolean;
}

// ── Sub-components ──────────────────────────────────────────────────────────

const SectionHeader = ({ title, actionText, onAction }: { title: string; actionText?: string; onAction?: () => void }) => {
  const { isDarkMode } = useTheme();
  return (
    <div className="mb-4 flex items-center justify-between px-6 lg:px-0">
      <h2 className={`text-xl lg:text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>{title}</h2>
      {actionText && (
        <button onClick={onAction} className="text-[11px] font-bold text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-wider">
          {actionText}
        </button>
      )}
    </div>
  );
};

const CreatorCardSkeleton = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`rounded-[28px] border overflow-hidden flex flex-col transition-all duration-300 relative animate-pulse ${
      isDarkMode ? 'bg-[#0d0d0d] border-zinc-900/60' : 'bg-white border-zinc-200/80 shadow-md'
    }`}>
      {/* Cover Header Skeleton */}
      <div className={`h-20 w-full ${isDarkMode ? 'bg-zinc-900/60' : 'bg-zinc-100'}`} />

      {/* Body Content */}
      <div className="px-5 pt-3 pb-4 flex-1 flex flex-col space-y-4">
        
        {/* Avatar, niche badge, channel name row */}
        <div className="flex items-start gap-3">
          {/* Avatar Skeleton */}
          <div className={`w-11 h-11 rounded-full shrink-0 -mt-7 border-2 relative z-10 ${
            isDarkMode ? 'bg-zinc-800 border-[#0d0d0d]' : 'bg-zinc-200 border-white'
          }`} />
          
          {/* Info Column */}
          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Niche Role Badge */}
            <div className={`h-3 w-16 rounded ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
            {/* Channel Name */}
            <div className={`h-4 w-32 rounded ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            {/* Handle & Country */}
            <div className={`h-3 w-24 rounded ${isDarkMode ? 'bg-zinc-850' : 'bg-zinc-150'}`} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-3 gap-3 p-3 rounded-2xl border ${
          isDarkMode ? 'bg-[#111111]/30 border-zinc-900' : 'bg-zinc-50 border-zinc-200/60'
        }`}>
          {[1, 2, 3].map((s) => (
            <div key={s} className="space-y-1">
              <div className={`h-2.5 w-10 rounded ${isDarkMode ? 'bg-zinc-850' : 'bg-zinc-255'}`} />
              <div className={`h-3.5 w-12 rounded ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            </div>
          ))}
        </div>

        {/* Top Videos Row */}
        <div className="space-y-1.5 pt-1">
          <div className={`h-3 w-20 rounded ${isDarkMode ? 'bg-zinc-850' : 'bg-zinc-200'}`} />
          <div className="flex gap-2">
            {[1, 2, 3].map((v) => (
              <div 
                key={v}
                className={`flex-1 aspect-video rounded-lg ${
                  isDarkMode ? 'bg-zinc-900/60' : 'bg-zinc-150'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex gap-2 pt-2 mt-auto">
          <div className={`flex-[3] h-9 rounded-xl ${isDarkMode ? 'bg-zinc-850' : 'bg-zinc-200'}`} />
          <div className={`w-9 h-9 rounded-xl ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
        </div>
      </div>
    </div>
  );
};

export default function Explore() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isSocialPromoter = user?.primaryRole?.category === 'social_promoter';
  const [activeTab, setActiveTab] = useState(isSocialPromoter ? 'YT Creators' : 'All');
  const { isDarkMode } = useTheme();
  const dispatch = useDispatch();

  const formatCount = (num: number | string | undefined) => {
    if (num === undefined || num === null) return '0';
    const val = typeof num === 'string' ? parseInt(num, 10) || 0 : num;
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  const resolveImg = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5051';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${apiBase}${cleanUrl}`;
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user) return;
    const isFollowing = user.followingIds?.includes(targetUserId);

    // Optimistic Update
    const currentFollowingIds = user.followingIds || [];
    const newFollowingIds = isFollowing
      ? currentFollowingIds.filter(id => id !== targetUserId)
      : [...currentFollowingIds, targetUserId];

    dispatch(updateUser({ followingIds: newFollowingIds }));

    try {
      const endpoint = isFollowing ? '/user/unfollow' : '/user/follow';
      const response = await api.post(endpoint, { targetUserId });
      if (response.data?.success) {
        dispatch(updateUser({ followingIds: response.data.followingIds }));
      }
    } catch (err) {
      console.error('Failed to toggle follow status:', err);
      // Revert on error
      dispatch(updateUser({ followingIds: currentFollowingIds }));
    }
  };

  const { data: editors = [], isLoading: isLoadingEditors } = useQuery<ExploreProfile[]>({
    queryKey: ['explore', 'video_editor'],
    queryFn: async () => {
      const response = await api.get('/profile/category/video_editor');
      return response.data?.success ? response.data.data : [];
    },
    enabled: activeTab === 'Editors',
  });

  const { data: creators = [], isLoading: isLoadingCreators } = useQuery<CreatorProfile[]>({
    queryKey: ['explore', 'yt_influencer'],
    queryFn: async () => {
      const response = await api.get('/profile/category/yt_influencer');
      return response.data?.success ? response.data.data : [];
    },
    enabled: activeTab === 'YT Creators',
  });

  // ─── B2B Search & Filter States ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [sortBy, setSortBy] = useState('subscribers');

  // Flat-map creators into separate YouTube channels (one card per channel)
  const youtubeChannelCards = useMemo(() => {
    const list: ChannelCard[] = [];
    creators.forEach((creator: CreatorProfile) => {
      const channels = creator.youtubeProfiles || [];
      if (channels.length === 0) {
        // Fallback stub for creators with no channels in seed database
        list.push({
          id: `creator-${creator.id}`,
          creator,
          channelName: creator.name,
          thumbnailUrl: creator.profilePicture || defaultProfile,
          subscriberCount: 0,
          averageViews: 0,
          engagementRate: 0,
          videos: [],
          isStub: true
        });
      } else {
        channels.forEach((ch: YouTubeChannelProfile) => {
          list.push({
            id: `channel-${ch.channelId}`,
            creator,
            channelId: ch.channelId,
            channelName: ch.channelName,
            thumbnailUrl: ch.thumbnailUrl || creator.profilePicture || defaultProfile,
            bannerUrl: ch.bannerUrl || null,
            subscriberCount: ch.subscriberCount || 0,
            averageViews: ch.averageViews || 0,
            engagementRate: ch.engagementRate || 0,
            videos: ch.videos || [],
            isStub: false
          });
        });
      }
    });
    return list;
  }, [creators]);

  // Extract all unique niches across creators for dynamic filtering
  const niches = useMemo(() => {
    const set = new Set<string>();
    youtubeChannelCards.forEach(c => {
      if (c.creator.roles) {
        c.creator.roles.forEach((r: string) => set.add(r));
      }
    });
    return ['All', ...Array.from(set)];
  }, [youtubeChannelCards]);

  // Client-side search, filtering, and sorting
  const filteredChannelCards = useMemo(() => {
    let result = [...youtubeChannelCards];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.channelName.toLowerCase().includes(q) ||
        c.creator.name.toLowerCase().includes(q) ||
        c.creator.username.toLowerCase().includes(q) ||
        (c.creator.bio && c.creator.bio.toLowerCase().includes(q))
      );
    }

    // 2. Niche Filter
    if (selectedNiche !== 'All') {
      result = result.filter(c => c.creator.roles?.includes(selectedNiche));
    }

    // 3. Audience Size Filter
    if (selectedSize !== 'All') {
      result = result.filter(c => {
        const subs = c.subscriberCount || 0;
        if (selectedSize === 'micro') return subs < 10000;
        if (selectedSize === 'mid') return subs >= 10000 && subs < 100000;
        if (selectedSize === 'macro') return subs >= 100000;
        return true;
      });
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === 'subscribers') {
        return (b.subscriberCount || 0) - (a.subscriberCount || 0);
      }
      if (sortBy === 'avg_views') {
        return (b.averageViews || 0) - (a.averageViews || 0);
      }
      if (sortBy === 'engagement') {
        return (b.engagementRate || 0) - (a.engagementRate || 0);
      }
      return 0;
    });

    return result;
  }, [youtubeChannelCards, searchQuery, selectedNiche, selectedSize, sortBy]);

  const TABS = useMemo(() => {
    if (isSocialPromoter) {
      return [
        { id: 'YT Creators', icon: Youtube, color: '#ef4444' },
        { id: 'YT Videos', icon: Play, color: '#ec4899' },
      ];
    }
    return [
      { id: 'All', icon: LayoutGrid, color: '#6366f1' },
      { id: 'Editors', icon: Users, color: '#a855f7' },
      { id: 'YT Creators', icon: Youtube, color: '#ef4444' },
      { id: 'YT Videos', icon: Play, color: '#ec4899' },
      { id: 'Rental', icon: Camera, color: '#10b981' },
    ];
  }, [isSocialPromoter]);

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div className={`relative flex flex-col min-h-full font-sans selection:bg-rose-500/30 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#000000] text-white' : 'bg-zinc-50 text-zinc-950'
    }`}>
      
      {/* 🌌 ELITE ATMOSPHERIC HEADER (Mobile: Dynamic Tab Glow | Desktop: Clean Sub-nav) */}
      <div className={`sticky top-0 z-[60] lg:relative lg:z-10 lg:backdrop-blur-xl lg:border-b lg:mb-4 transition-colors duration-300 ${
        isDarkMode 
          ? 'lg:bg-black/80 lg:border-white/5' 
          : 'lg:bg-white/80 lg:border-zinc-200'
      }`}>
        
        {/* 🌈 Dynamic Atmospheric Overlay (Mobile Only - Sync with native app) */}
        <div className="absolute inset-0 h-[220px] lg:hidden pointer-events-none">
          {/* Main Gradient Smoke */}
          <div className={`absolute inset-0 bg-gradient-to-b to-transparent transition-colors duration-300 ${
            isDarkMode 
              ? 'from-black via-black/90' 
              : 'from-zinc-50 via-zinc-50/90'
          }`} />
          
          {/* Active Tab Glow */}
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: isDarkMode ? 0.25 : 0.15 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
            style={{ 
              backgroundColor: currentTab.color,
              maskImage: 'radial-gradient(circle at 50% 0%, black 0%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 0%, black 0%, transparent 70%)'
            }}
          />
        </div>

        {/* Tab Bar */}
        <div className="relative z-20 flex items-center px-0 lg:px-10 pt-4 lg:pt-4 lg:pb-1">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2 px-6 lg:px-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 rounded-full px-2.5 py-1 lg:px-3.5 lg:py-1.5 text-[9px] lg:text-[10px] font-bold transition-all duration-300
                  ${activeTab === tab.id 
                    ? (isDarkMode 
                        ? 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.15)] scale-105' 
                        : 'bg-zinc-950 text-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] scale-105')
                    : (isDarkMode 
                        ? 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white' 
                        : 'bg-zinc-200/60 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950')
                  }
                `}
              >
                <tab.icon size={11} strokeWidth={2.5} />
                {tab.id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>


      </div>

      {/* 🚀 MAIN CONTENT AREA */}
      {/* 🚀 MAIN CONTENT AREA */}
      <div className="relative z-10 flex-1 lg:mt-2 px-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="pt-6 lg:pt-0"
          >
            {activeTab === 'All' && (
              <>
                {/* 👋 PERSONALIZED GREETING */}
                <div className="mb-10 px-6 lg:px-0">
                  <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-500">Today's Recommendation For</p>
                  <h2 className={`text-3xl lg:text-4xl font-bold mt-1 transition-colors ${
                    isDarkMode ? 'text-white' : 'text-zinc-950'
                  }`}>
                    {user?.name?.split(' ')[0] || 'Suvin'}
                  </h2>
                </div>

                {/* 🎞️ TRENDING REELS */}
                <section className="mb-10">
                  <SectionHeader title="Trending Reels" actionText="Watch All" />
                  <div className="flex gap-3 overflow-x-auto px-6 lg:px-0 no-scrollbar pb-4 lg:grid lg:grid-cols-4 lg:gap-6">
                    {[
                      { id: 1, name: 'VFX_Alex', views: '145K', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400' },
                      { id: 2, name: 'FilmPro', views: '82K', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400' },
                      { id: 3, name: 'LensLife', views: '210K', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400' },
                      { id: 4, name: 'Motion_Guru', views: '95K', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400' },
                    ].map(reel => (
                      <div key={reel.id} className={`relative aspect-[9/16] w-[130px] lg:w-full shrink-0 overflow-hidden rounded-[24px] border transition-all duration-300 group ${
                        isDarkMode ? 'border-white/5 shadow-2xl' : 'border-zinc-200 shadow-md'
                      }`}>
                        <img src={reel.img} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <p className="text-xs lg:text-base font-bold text-white">{reel.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                            <p className="text-[9px] lg:text-[11px] font-semibold text-zinc-400">👁️ {reel.views}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 📺 SUGGESTED FOR YOU */}
                <section className="mb-10">
                  <SectionHeader title="Suggested for You" actionText="See All" />
                  <div className="flex gap-4 overflow-x-auto px-6 lg:px-0 no-scrollbar pb-6 lg:grid lg:grid-cols-3 lg:gap-8">
                    {[
                      { id: 1, title: 'Directing Music Videos', author: 'Director X', views: '450K', time: '12:45', img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800' },
                      { id: 2, title: 'Cinematic Lighting 101', author: 'LightMaster', views: '220K', time: '08:15', img: 'https://images.unsplash.com/photo-1536240478700-b86d35fd733c?q=80&w=800' },
                      { id: 3, title: 'VFX Speed Art', author: 'FlowArt', views: '310K', time: '05:20', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800' },
                    ].map(video => (
                      <div key={video.id} className="w-[240px] lg:w-full shrink-0 group">
                        <div className={`relative aspect-video overflow-hidden rounded-[20px] border mb-3 shadow-lg transition-all duration-300 ${
                          isDarkMode ? 'border-white/5' : 'border-zinc-200'
                        }`}>
                          <img src={video.img} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black">
                               <Play size={18} fill="currentColor" />
                             </div>
                          </div>
                          <div className="absolute bottom-3 right-3 rounded-lg bg-black/80 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-white">{video.time}</div>
                        </div>
                        <div className="px-1">
                          <h3 className={`text-[13px] lg:text-[15px] font-bold line-clamp-1 leading-tight transition-colors ${
                            isDarkMode ? 'text-white' : 'text-zinc-950'
                          }`}>{video.title}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                             <div className={`w-5 h-5 rounded-full transition-colors ${
                               isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'
                             }`} />
                             <p className={`text-[10px] lg:text-[12px] font-semibold transition-colors ${
                               isDarkMode ? 'text-zinc-500' : 'text-zinc-600'
                             }`}>{video.author} • {video.views}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 👤 FEATURED CREATORS */}
                <section className="mb-10">
                  <SectionHeader title="Featured Creators" actionText="Discover All" />
                  <div className="flex gap-4 overflow-x-auto px-6 lg:px-0 no-scrollbar pb-6 lg:grid lg:grid-cols-3 lg:gap-8">
                    {[
                      { id: 1, name: 'Souvik Suman', handle: '@souviksuman_pro', reach: '3.7M', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400' },
                      { id: 2, name: 'Mayank Creative', handle: '@mayank_creative', reach: '1.5M', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400' },
                      { id: 3, name: 'Rohan Pro', handle: '@rohan_vfx', reach: '800K', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400' },
                    ].map(creator => (
                      <div key={creator.id} className={`w-[240px] lg:w-full shrink-0 rounded-[24px] border p-5 lg:p-6 backdrop-blur-xl relative overflow-hidden group transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-black border-white/5 shadow-2xl' 
                          : 'bg-white border-zinc-200 shadow-lg'
                      }`}>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-3xl group-hover:bg-rose-500/10 transition-colors" />
                        
                        <div className="flex items-center gap-4 mb-5 relative z-10">
                          <div className="h-12 w-12 overflow-hidden rounded-xl border-2 border-rose-500 p-0.5">
                            <img src={creator.img} className="h-full w-full rounded-[10px] object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-sm lg:text-base font-bold truncate transition-colors ${
                                isDarkMode ? 'text-white' : 'text-zinc-950'
                              }`}>{creator.name}</p>
                              <CheckCircle2 size={12} className="text-rose-500 fill-rose-500/20" />
                            </div>
                            <p className="text-[11px] font-bold text-rose-500">{creator.handle}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-5 px-1">
                          <div>
                            <p className={`text-base font-bold transition-colors ${
                              isDarkMode ? 'text-white' : 'text-zinc-950'
                            }`}>{creator.reach}</p>
                            <p className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${
                              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                            }`}>Reach</p>
                          </div>
                          <button className={`p-2 rounded-xl transition-colors ${
                            isDarkMode 
                              ? 'bg-white/5 text-zinc-400 hover:text-white' 
                              : 'bg-zinc-100 text-zinc-50 hover:text-zinc-950'
                          }`}>
                            <MoreHorizontal size={18} />
                          </button>
                        </div>

                        <div className="flex gap-2 relative z-10">
                          <button className={`flex-[2] rounded-xl py-3 text-[11px] font-bold transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-white text-black hover:opacity-90' 
                              : 'bg-zinc-950 text-white hover:bg-zinc-900'
                          }`}>Connect</button>
                          <button className={`flex-1 rounded-xl border py-3 flex items-center justify-center transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                              : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'
                          }`}>
                            <UserPlus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 📸 PREMIUM GEAR RENTALS */}
                <section className="mb-20">
                  <SectionHeader title="Premium Gear Rentals" actionText="Browse Catalog" />
                  <div className="flex gap-4 overflow-x-auto px-6 lg:px-0 no-scrollbar pb-6 lg:grid lg:grid-cols-4 lg:gap-6">
                    {[
                      { id: 1, name: 'Sony FX3', price: '₹2500', cat: 'CAMERA', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400' },
                      { id: 2, name: 'DJI RS3', price: '₹1200', cat: 'GIMBAL', img: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=400' },
                      { id: 3, name: 'Aputure 600d', price: '₹1800', cat: 'LIGHT', img: 'https://images.unsplash.com/photo-1536240478700-b86d35fd733c?q=80&w=800' },
                      { id: 4, name: 'Zeiss 35mm', price: '₹1500', cat: 'LENS', img: 'https://images.unsplash.com/photo-1617005082133-548c4ea2e935?q=80&w=400' },
                    ].map(item => (
                      <div key={item.id} className={`relative h-[160px] lg:h-[220px] w-[160px] lg:w-full shrink-0 overflow-hidden rounded-[24px] border shadow-xl group transition-colors duration-300 ${
                        isDarkMode ? 'border-white/5' : 'border-zinc-200'
                      }`}>
                        <img src={item.img} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                        <div className="absolute top-4 right-4 rounded-lg bg-green-500 px-2 py-1 text-[9px] font-bold text-white shadow-lg">
                          {item.price}
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{item.cat}</p>
                          <p className="text-xs lg:text-sm font-bold text-white mt-0.5">{item.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {activeTab === 'Editors' && (
              <div className="px-6 lg:px-0 mb-20">
                <div className="mb-8">
                  <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-500">Discover Elite Talent</p>
                  <h2 className={`text-3xl lg:text-4xl font-bold mt-1 transition-colors ${
                    isDarkMode ? 'text-white' : 'text-zinc-950'
                  }`}>
                    Professional Video Editors
                  </h2>
                </div>

                {isLoadingEditors ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <CreatorCardSkeleton key={i} />
                    ))}
                  </div>
                ) : editors.length === 0 ? (
                  <div className="text-center py-20 opacity-55">
                    <Users size={48} className="mx-auto mb-4" />
                    <p className="text-sm font-medium">No professional editors found. Add some from the seed script!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {editors.map((editor) => (
                      <motion.div
                        key={editor.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => navigate('/creator/' + editor.userId)}
                        className={`rounded-[24px] border p-5 lg:p-6 backdrop-blur-xl relative overflow-hidden group transition-all duration-300 cursor-pointer ${
                          isDarkMode 
                            ? 'bg-black border-white/5 shadow-2xl hover:border-white/10' 
                            : 'bg-white border-zinc-200 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-3xl group-hover:bg-rose-500/10 transition-colors" />
                        
                        <div className="flex items-start gap-4 mb-5 relative z-10">
                          <div className="h-14 w-14 overflow-hidden rounded-xl border-2 border-rose-500 p-0.5 flex-shrink-0">
                            <img 
                              src={editor.profilePicture || defaultProfile} 
                              alt={editor.name} 
                              className="h-full w-full rounded-[10px] object-cover" 
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className={`text-base font-bold truncate transition-colors ${
                                isDarkMode ? 'text-white' : 'text-zinc-950'
                              }`}>{editor.name}</p>
                              <CheckCircle2 size={12} className="text-rose-500 fill-rose-500/20" />
                            </div>
                            <p className="text-[11px] font-bold text-rose-500">@{editor.username}</p>
                            <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{editor.location || 'India'}</p>
                          </div>
                        </div>

                        {/* Bio or tag line */}
                        <div className="mb-5">
                          <p className={`text-xs line-clamp-2 leading-relaxed ${
                            isDarkMode ? 'text-zinc-400' : 'text-zinc-650'
                          }`}>
                            {editor.bio || `Specialist in video editing, storytelling, and high-fidelity video production.`}
                          </p>
                        </div>

                        {/* Skills / Subcategories Badges */}
                        {editor.roles && editor.roles.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {editor.roles.map((role, idx) => (
                              <span
                                key={idx}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  isDarkMode 
                                    ? 'bg-white/5 text-zinc-400 border border-white/5' 
                                    : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                }`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 relative z-10 w-full">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleFollowToggle(editor.userId); }}
                            className={`flex-[2] rounded-xl py-3 text-[11px] font-bold transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                              user?.followingIds?.includes(editor.userId)
                                ? isDarkMode
                                  ? 'bg-zinc-800/80 border border-zinc-700/80 text-zinc-400 hover:bg-zinc-850'
                                  : 'bg-zinc-200 border border-zinc-300 text-zinc-650 hover:bg-zinc-250'
                                : isDarkMode
                                  ? 'bg-white text-black hover:opacity-90'
                                  : 'bg-zinc-950 text-white hover:bg-zinc-905'
                            }`}
                          >
                            {user?.followingIds?.includes(editor.userId) ? 'Following' : 'Follow'}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate('/communication-hub?userId=' + editor.userId); }}
                            className={`flex-1 rounded-xl border py-3 text-[11px] font-bold flex items-center justify-center transition-colors duration-300 cursor-pointer ${
                              isDarkMode 
                                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                                : 'bg-zinc-100 border-zinc-200 text-zinc-850 hover:bg-zinc-200'
                            }`}
                          >
                            Connect
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'YT Creators' && (
              <div className="px-4 md:px-6 mb-20">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-500">Connect with Influencers</p>
                    <h2 className={`text-3xl lg:text-4xl font-bold mt-1 transition-colors ${
                      isDarkMode ? 'text-white' : 'text-zinc-950'
                    }`}>
                      {isSocialPromoter ? 'Explore YouTube Channels' : 'YouTube Creators'}
                    </h2>
                  </div>
                </div>

                {/* B2B Filter Panel (SuviX Black/White Aesthetic) */}
                {isSocialPromoter && (
                  <div className={`p-4 rounded-3xl border mb-8 flex flex-col md:flex-row md:items-center gap-4 transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-[#0a0a0a]/90 backdrop-blur-md border-zinc-800 shadow-2xl' 
                      : 'bg-white border-zinc-200/80 shadow-md'
                  }`}>
                    {/* Search Input */}
                    <div className="flex-1 relative">
                      <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-500">
                        <Search size={16} />
                      </span>
                      <input 
                        type="text"
                        placeholder="Search channels, creators, niches..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full h-11 pl-11 pr-4 rounded-2xl text-xs font-semibold focus:outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-zinc-900/60 border border-zinc-805 text-white placeholder-zinc-500 focus:border-zinc-700' 
                            : 'bg-zinc-100 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-300'
                        }`}
                      />
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Niche Filter */}
                      <select 
                        value={selectedNiche}
                        onChange={(e) => setSelectedNiche(e.target.value)}
                        className={`h-11 px-4 rounded-2xl text-xs font-semibold focus:outline-none transition-all cursor-pointer border ${
                          isDarkMode 
                            ? 'bg-zinc-900/60 border-zinc-800 text-white focus:border-zinc-700' 
                            : 'bg-zinc-100 border-zinc-200 text-zinc-900 focus:border-zinc-305'
                        }`}
                      >
                        <option value="All">All Niches</option>
                        {niches.filter(n => n !== 'All').map((n, idx) => (
                          <option key={idx} value={n}>{n}</option>
                        ))}
                      </select>

                      {/* Size Filter */}
                      <select 
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className={`h-11 px-4 rounded-2xl text-xs font-semibold focus:outline-none transition-all cursor-pointer border ${
                          isDarkMode 
                            ? 'bg-zinc-900/60 border-zinc-800 text-white focus:border-zinc-700' 
                            : 'bg-zinc-100 border-zinc-200 text-zinc-900 focus:border-zinc-305'
                        }`}
                      >
                        <option value="All">All Sizes</option>
                        <option value="micro">Micro (&lt;10K)</option>
                        <option value="mid">Mid-Tier (10K - 100K)</option>
                        <option value="macro">Macro (100K+)</option>
                      </select>

                      {/* Sort Filter */}
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={`h-11 px-4 rounded-2xl text-xs font-semibold focus:outline-none transition-all cursor-pointer border ${
                          isDarkMode 
                            ? 'bg-zinc-900/60 border-zinc-800 text-white focus:border-zinc-700' 
                            : 'bg-zinc-100 border-zinc-200 text-zinc-900 focus:border-zinc-305'
                        }`}
                      >
                        <option value="subscribers">Sort: Subscribers</option>
                        <option value="avg_views">Sort: Avg Views</option>
                        <option value="engagement">Sort: Engagement</option>
                      </select>
                    </div>
                  </div>
                )}

                {isLoadingCreators ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <CreatorCardSkeleton key={i} />
                    ))}
                  </div>
                ) : isSocialPromoter && filteredChannelCards.length === 0 ? (
                  <div className="text-center py-20 opacity-55">
                    <Youtube size={48} className="mx-auto mb-4 text-red-500" />
                    <p className="text-sm font-medium">No YouTube channels match your search criteria.</p>
                  </div>
                ) : !isSocialPromoter && creators.length === 0 ? (
                  <div className="text-center py-20 opacity-55">
                    <Youtube size={48} className="mx-auto mb-4 text-red-500" />
                    <p className="text-sm font-medium">No YouTube creators found. Add some from the seed script!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isSocialPromoter ? (
                      filteredChannelCards.map((card) => {
                        const creator = card.creator;
                        const yt = card.isStub ? null : card;
                        const coverBanner = resolveImg(card.bannerUrl || creator.coverBanner);
                        const avatar = resolveImg(card.thumbnailUrl) || defaultProfile;

                        return (
                          <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -6 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => navigate(card.isStub ? `/creator/${creator.userId}` : `/channel/${card.channelId}`)}
                            className={`rounded-[28px] border overflow-hidden flex flex-col transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl relative ${
                              isDarkMode 
                                ? 'bg-[#0d0d0d] border-zinc-900/60 hover:border-zinc-800 hover:shadow-purple-500/5' 
                                : 'bg-white border-zinc-200/80 hover:border-zinc-300 hover:shadow-zinc-200/40'
                            }`}
                          >
                            {/* Card Cover Header */}
                            <div className="h-20 relative w-full overflow-hidden bg-zinc-900">
                              {coverBanner ? (
                                <img src={coverBanner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Banner" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-zinc-800 via-zinc-900 to-zinc-950" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                              
                              {/* Owner Attribution Badge */}
                              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full py-0.5 pl-0.5 pr-2.5 flex items-center gap-1 z-20">
                                <img src={resolveImg(creator.profilePicture) || defaultProfile} className="w-4.5 h-4.5 rounded-full object-cover" />
                                <span className="text-[8px] font-bold text-white max-w-[80px] truncate">{creator.name}</span>
                              </div>

                              {/* Official YouTube Play Icon Red Badge */}
                              <span className="absolute top-2 right-2 z-10 bg-red-600 text-white rounded-md p-1.5 flex items-center justify-center shadow-lg">
                                <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.387.51A3.003 3.003 0 0 0 .502 6.163C0 8.04 0 12 0 12s0 3.96.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.862.51 9.387.51 9.387.51s7.524 0 9.387-.51a3.003 3.003 0 0 0 2.11-2.108C24 15.96 24 12 24 12s0-3.96-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                              </span>
                            </div>

                            {/* Identity Row (Overlapping avatar + info layout) */}
                            <div className="flex items-start gap-3 px-4 -mt-8 relative z-10">
                              <img 
                                src={avatar} 
                                className={`w-16 h-16 rounded-2xl object-cover border-4 shadow-md shrink-0 ${
                                  isDarkMode ? 'border-zinc-950' : 'border-white'
                                }`}
                                alt={card.channelName}
                              />
                              
                              <div className="pt-8 min-w-0 flex-1 flex flex-col gap-0.5">
                                {/* Roles / Niche Badges (Placed beside avatar, above channel name!) */}
                                {creator.roles && creator.roles.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {creator.roles.slice(0, 1).map((role: string, idx: number) => (
                                      <span 
                                        key={idx} 
                                        className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                                          isDarkMode ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' : 'bg-zinc-100 text-zinc-650'
                                        }`}
                                      >
                                        {role}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Channel Name */}
                                <h4 className={`text-sm font-black truncate leading-tight flex items-center gap-1 ${
                                  isDarkMode ? 'text-white' : 'text-zinc-950'
                                }`}>
                                  {card.channelName}
                                  <CheckCircle2 size={11} className="text-red-500 fill-red-500/10 shrink-0" />
                                </h4>

                                {/* Username & Country */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-[10px] font-bold text-red-500">@{creator.username}</p>
                                  <span className="text-[9px] text-text-muted">•</span>
                                  <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider">{creator.location || 'India'}</p>
                                </div>
                              </div>
                            </div>

                            {/* YouTube Metrics Grid */}
                            <div className={`grid grid-cols-3 gap-2 px-4 py-2.5 mt-3 border-t border-b ${
                              isDarkMode ? 'border-zinc-900/60 bg-zinc-950/20' : 'border-zinc-100 bg-zinc-50/40'
                            }`}>
                              <div className="text-center">
                                <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider">Subscribers</span>
                                <p className={`text-[11px] font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                  {card.isStub ? '0' : formatCount(card.subscriberCount)}
                                </p>
                              </div>
                              <div className="text-center">
                                <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider">Avg Views</span>
                                <p className={`text-[11px] font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                  {card.isStub || !card.averageViews ? 'TBD' : formatCount(card.averageViews)}
                                </p>
                              </div>
                              <div className="text-center">
                                <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider">Engagement</span>
                                <p className="text-[11px] font-black mt-0.5 text-emerald-500">
                                  {card.isStub || !card.engagementRate ? 'TBD' : (card.engagementRate * 100).toFixed(1) + '%'}
                                </p>
                              </div>
                            </div>

                            {/* Top Highlights Previews */}
                            {yt?.videos && yt.videos.length > 0 && (
                              <div className="px-4 mt-2.5 space-y-1">
                                <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider">Top Highlights</span>
                                <div className="flex gap-2">
                                  {yt.videos.slice(0, 3).map((video: SyncedVideo, idx: number) => (
                                    <div key={idx} className="flex-1 aspect-video rounded-lg overflow-hidden bg-zinc-800 relative group/video">
                                      <img src={resolveImg(video.thumbnail) || ''} alt={video.title} className="w-full h-full object-cover group-hover/video:scale-105 transition-transform" />
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity">
                                        <Play size={10} className="text-white fill-white" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions Footer */}
                            <div className="flex gap-2 px-4 py-3.5 mt-auto w-full z-10">
                              <button
                                onClick={() => navigate(card.isStub ? `/creator/${creator.userId}` : `/channel/${card.channelId}`)}
                                className={`flex-[3] h-9 rounded-xl text-[10px] font-bold transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                                  isDarkMode 
                                    ? 'bg-white text-black hover:bg-zinc-200' 
                                    : 'bg-zinc-950 text-white hover:bg-zinc-900'
                                }`}
                              >
                                View Media Kit
                                <ChevronRight size={12} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); navigate('/communication-hub?userId=' + creator.userId); }}
                                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors duration-300 shrink-0 ${
                                  isDarkMode 
                                    ? 'bg-zinc-900/50 border-zinc-800 text-white hover:bg-zinc-850' 
                                    : 'bg-zinc-100 border-zinc-200 text-zinc-855 hover:bg-zinc-200'
                                }`}
                                title="Message"
                              >
                                <MessageCircle size={14} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      creators.map((creator) => (
                        <motion.div
                          key={creator.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ y: -4 }}
                          transition={{ duration: 0.3 }}
                          onClick={() => navigate('/creator/' + creator.userId)}
                          className={`rounded-[24px] border p-5 lg:p-6 backdrop-blur-xl relative overflow-hidden group transition-all duration-300 cursor-pointer ${
                            isDarkMode 
                              ? 'bg-black border-white/5 shadow-2xl hover:border-white/10' 
                              : 'bg-white border-zinc-200 shadow-lg hover:shadow-xl'
                          }`}
                        >
                          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-3xl group-hover:bg-red-500/10 transition-colors" />
                          
                          <div className="flex items-start gap-4 mb-5 relative z-10">
                            <div className="h-14 w-14 overflow-hidden rounded-xl border-2 border-red-500 p-0.5 flex-shrink-0">
                              <img 
                                src={creator.profilePicture || defaultProfile} 
                                alt={creator.name} 
                                className="h-full w-full rounded-[10px] object-cover" 
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className={`text-base font-bold truncate transition-colors ${
                                  isDarkMode ? 'text-white' : 'text-zinc-950'
                                }`}>{creator.name}</p>
                                <CheckCircle2 size={12} className="text-red-500 fill-red-500/20" />
                              </div>
                              <p className="text-[11px] font-bold text-red-500">@{creator.username}</p>
                              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{creator.location || 'India'}</p>
                            </div>
                          </div>

                          {/* Bio / Niche info */}
                          <div className="mb-5">
                            <p className={`text-xs line-clamp-2 leading-relaxed ${
                              isDarkMode ? 'text-zinc-400' : 'text-zinc-650'
                            }`}>
                              {creator.bio || `Content creator specializing in engaging digital media, YouTube entertainment, and video storytelling.`}
                            </p>
                          </div>

                          {/* Subcategory / Roles Badges */}
                          {creator.roles && creator.roles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-6">
                              {creator.roles.map((role, idx) => (
                                <span
                                  key={idx}
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    isDarkMode 
                                      ? 'bg-white/5 text-zinc-400 border border-white/5' 
                                      : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                  }`}
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 relative z-10 w-full">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleFollowToggle(creator.userId); }}
                              className={`flex-[3] rounded-xl py-3 text-[11px] font-bold transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                                user?.followingIds?.includes(creator.userId)
                                  ? isDarkMode
                                    ? 'bg-zinc-800/80 border border-zinc-700/80 text-zinc-400 hover:bg-zinc-850'
                                    : 'bg-zinc-200 border border-zinc-300 text-zinc-650 hover:bg-zinc-250'
                                  : isDarkMode
                                    ? 'bg-white text-black hover:opacity-90'
                                    : 'bg-zinc-950 text-white hover:bg-zinc-905'
                              }`}
                            >
                              {user?.followingIds?.includes(creator.userId) ? 'Following' : 'Follow'}
                            </button>
                            
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate('/communication-hub?userId=' + creator.userId); }}
                              className={`flex-1 rounded-xl border py-3 text-[11px] font-bold flex items-center justify-center transition-colors duration-300 cursor-pointer ${
                                isDarkMode 
                                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                                  : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-250'
                              }`}
                              title="Contact Message"
                            >
                              <MessageSquare size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
