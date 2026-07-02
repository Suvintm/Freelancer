import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Youtube, Eye, ThumbsUp, MessageSquare, MapPin, 
  Globe, ExternalLink, MessageCircle, Send, 
  ShieldAlert, Sparkles, ArrowLeft, Loader2 
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { api } from '../api/client';
import defaultProfile from '../assets/defaultprofile.png';
import SILVER_BTN from '../assets/playbuttons/silverbtn.png';
import GOLD_BTN from '../assets/playbuttons/goldenbtn.png';
import DIAMOND_BTN from '../assets/playbuttons/diamondbtn.png';

interface YouTubeVideo {
  id: string;
  video_id?: string;
  title: string;
  thumbnail: string;
  view_count?: string | number;
  like_count?: string | number;
  comment_count?: string | number;
  duration_secs?: number;
}

interface CreatorPost {
  id: string;
  type: string;
  thumbnail?: string;
  media?: {
    url: string;
  };
}

interface YouTubeProfile {
  id: string;
  channel_id: string;
  channel_name: string;
  thumbnail_url?: string;
  subscriber_count?: number;
  video_count?: number;
  view_count?: string | number;
  average_views?: number;
  engagement_rate?: number;
  videos?: YouTubeVideo[];
  banner_url?: string | null;
  bannerUrl?: string | null;
}

interface CreatorProfileData {
  id: string;
  email: string;
  profile?: {
    name: string;
    username: string;
    profile_picture: string | null;
    cover_banner: string | null;
    bio: string | null;
    website: string | null;
    location_city: string | null;
    location_country: string | null;
    category?: {
      name: string;
      slug: string;
    };
    roles?: Array<{
      subCategory: {
        name: string;
        slug: string;
      };
    }>;
  };
  youtubeProfiles?: YouTubeProfile[];
  profilePicture?: string | null;
  coverBanner?: string | null;
}


export default function CreatorProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'youtube' | 'posts'>('youtube');
  const currentUser = useSelector(selectUser);
  const isOwnProfile = currentUser?.id === userId;

  // 1. Fetch Creator Basic & YouTube Profile Info
  const { data: creatorResponse, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ['creator-profile-details', userId],
    queryFn: async () => {
      const response = await api.get(`/profile/${userId}`);
      return response.data?.success ? response.data.data : null;
    },
    enabled: !!userId,
  });

  const creator = creatorResponse as CreatorProfileData | null;

  // 2. Fetch Creator Posts
  const { data: postsResponse } = useQuery({
    queryKey: ['creator-posts', userId],
    queryFn: async () => {
      const response = await api.get(`/profile/${userId}/posts`);
      return response.data?.success ? response.data.items : [];
    },
    enabled: !!userId,
  });

  const posts = postsResponse || [];

  // 3. Fetch Creator Videos dynamically
  const { data: videosResponse } = useQuery({
    queryKey: ['creator-videos', userId],
    queryFn: async () => {
      const response = await api.get(`/youtube/videos/${userId}`);
      return response.data?.success ? response.data.data : [];
    },
    enabled: !!userId,
  });

  const youtubeVideos = videosResponse || [];

  // Helper formatting values
  const formatCount = (num: number | string | undefined) => {
    if (num === undefined || num === null) return '0';
    const val = typeof num === 'string' ? parseInt(num, 10) || 0 : num;
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  // Determine active youtube profile details
  const activeYtProfile = useMemo(() => {
    return creator?.youtubeProfiles?.[0] || null;
  }, [creator]);

  // YouTube Videos list is now fetched dynamically via React Query above.

  // Badge eligibility based on subs
  const achievementBadge = useMemo(() => {
    const subCount = activeYtProfile?.subscriber_count || 0;
    if (subCount >= 10000) return { label: 'Diamond Creator', img: DIAMOND_BTN };
    if (subCount >= 1000) return { label: 'Gold Creator', img: GOLD_BTN };
    if (subCount >= 100) return { label: 'Silver Creator', img: SILVER_BTN };
    return null;
  }, [activeYtProfile]);

  if (isLoadingProfile) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Loading Media Kit...</p>
      </div>
    );
  }

  if (profileError || !creator) {
    return (
      <div className="w-full max-w-xl mx-auto py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold">Failed to load profile</h3>
        <p className="text-xs text-text-muted">The user may not exist, or their profile details are currently unavailable.</p>
        <button 
          onClick={() => navigate(-1)}
          className="h-10 px-6 rounded-xl border border-border-main text-xs font-bold hover:bg-container transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const resolveImg = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5051';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${apiBase}${cleanUrl}`;
  };

  const profilePic = resolveImg(creator.profilePicture || creator.profile?.profile_picture) || defaultProfile;
  const coverBanner = resolveImg(activeYtProfile?.banner_url || activeYtProfile?.bannerUrl || creator.coverBanner || creator.profile?.cover_banner);

  return (
    <div className="w-full flex flex-col font-sans relative">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className={`absolute top-4 left-4 z-30 p-2.5 rounded-full border transition-all active:scale-95 shadow-md ${
          isDarkMode 
            ? 'bg-zinc-950/70 border-zinc-800 text-white hover:bg-zinc-900' 
            : 'bg-white/80 border-zinc-200 text-zinc-800 hover:bg-zinc-100'
        }`}
      >
        <ArrowLeft size={16} />
      </button>

      {/* ─── Hero Banner Section ─── */}
      <div className="w-full h-44 md:h-64 relative bg-gradient-to-r from-purple-900 to-indigo-900 overflow-hidden">
        {coverBanner ? (
          <img 
            src={coverBanner} 
            alt="Cover Banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 via-pink-600/20 to-zinc-900/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-page via-transparent to-transparent" />
      </div>

      {/* ─── Connect YouTube Analytics Callout (Own Profile Only) ─── */}
      {isOwnProfile && !activeYtProfile && (
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 mt-4 relative z-15">
          <div className={`border p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
            isDarkMode 
              ? 'bg-gradient-to-r from-amber-500/10 via-zinc-950/20 to-zinc-950 border-amber-500/20' 
              : 'bg-gradient-to-r from-amber-50/50 via-white to-white border-amber-200'
          }`}>
            <div className="space-y-1">
              <p className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                ⚠️ YouTube Analytics Disabled
              </p>
              <p className={`text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Connect your YouTube Analytics to display audience demographics, avg watch time, and **get sponsors 10x faster**!
              </p>
            </div>
            <button 
              onClick={() => navigate('/youtube-dashboard')}
              className="shrink-0 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/20"
            >
              Connect Now
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Content Layout ─── */}
      <div className="w-full px-4 lg:px-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* Left / Center: Details & Tabs */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            
            {/* Identity Card */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
              <img 
                src={profilePic} 
                alt={creator.profile?.name || 'Creator'} 
                className={`w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 shadow-xl ${
                  isDarkMode ? 'border-zinc-950' : 'border-white'
                }`}
              />
              <div className="flex-1 pb-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                    {creator.profile?.name || 'Unknown User'}
                  </h1>
                  {activeYtProfile && (
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        <Youtube size={10} /> Verified Creator
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        Verified Analytics
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-text-muted mt-1">
                  @{creator.profile?.username || 'username'}
                </p>
                
                {/* Meta details */}
                <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1.5 mt-3 text-xs font-medium text-text-muted">
                  {(creator.profile?.location_city || creator.profile?.location_country) && (
                    <div className="flex items-center gap-1">
                      <MapPin size={13} className="text-text-muted" />
                      <span>{creator.profile.location_city ? `${creator.profile.location_city}, ` : ''}{creator.profile.location_country || 'India'}</span>
                    </div>
                  )}
                  {creator.profile?.website && (
                    <a 
                      href={creator.profile.website.startsWith('http') ? creator.profile.website : `https://${creator.profile.website}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1 text-purple-500 hover:text-purple-400 hover:underline"
                    >
                      <Globe size={13} />
                      <span>{creator.profile.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Biography */}
            <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-sm'}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-2.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>About Creator</h3>
              <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-650'}`}>
                {creator.profile?.bio || "This creator hasn't written a biography yet."}
              </p>
            </div>

            {/* Achievement Badge (If applicable) */}
            {achievementBadge && (
              <div className={`flex items-center gap-4 p-4 rounded-2xl border ${
                isDarkMode ? 'bg-zinc-950/40 border-zinc-900/60' : 'bg-purple-50/50 border-purple-100 shadow-sm'
              }`}>
                <img src={achievementBadge.img} alt={achievementBadge.label} className="w-12 h-12 object-contain" />
                <div>
                  <h4 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{achievementBadge.label} Award</h4>
                  <p className="text-xs font-semibold text-text-muted mt-0.5">Recognized for achieving significant audience milestones on YouTube.</p>
                </div>
              </div>
            )}

            {/* ─── Tabs Switcher ─── */}
            <div className="flex border-b border-border-main">
              <button 
                onClick={() => setActiveTab('youtube')}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all relative ${
                  activeTab === 'youtube' 
                    ? 'border-purple-500 text-purple-500' 
                    : 'border-transparent text-text-muted hover:text-text-main'
                }`}
              >
                YouTube Analytics
              </button>
              <button 
                onClick={() => setActiveTab('posts')}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all relative ${
                  activeTab === 'posts' 
                    ? 'border-purple-500 text-purple-500' 
                    : 'border-transparent text-text-muted hover:text-text-main'
                }`}
              >
                SuviX Feed ({posts.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="pt-2">
              <AnimatePresence mode="wait">
                {activeTab === 'youtube' && (
                  <motion.div 
                    key="youtube-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {activeYtProfile ? (
                      <>
                        {/* Channel Statistics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-sm'}`}>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Subscribers</p>
                            <h4 className="text-2xl font-black text-purple-500 mt-1">{formatCount(activeYtProfile.subscriber_count)}</h4>
                          </div>
                          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-sm'}`}>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Views</p>
                            <h4 className="text-2xl font-black text-purple-500 mt-1">{formatCount(activeYtProfile.view_count)}</h4>
                          </div>
                          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-sm'}`}>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Videos</p>
                            <h4 className="text-2xl font-black text-purple-500 mt-1">{formatCount(activeYtProfile.video_count)}</h4>
                          </div>
                        </div>

                        {/* YouTube Video List Header */}
                        <div className="flex items-center justify-between pt-2">
                          <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>Recent Uploads</h3>
                          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Synced from YouTube</span>
                        </div>

                        {/* YouTube Videos Grid */}
                        {youtubeVideos.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {youtubeVideos.slice(0, 8).map((video: YouTubeVideo) => (
                              <div 
                                key={video.id}
                                className={`flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                                  isDarkMode ? 'bg-zinc-950/40 border-zinc-900 hover:bg-zinc-950/60' : 'bg-white border-zinc-200 shadow-sm hover:shadow-md'
                                }`}
                              >
                                <div className="aspect-video relative overflow-hidden bg-zinc-800">
                                  <img src={resolveImg(video.thumbnail) || ''} alt={video.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                                  <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                    {video.title}
                                  </h4>
                                  <div className="flex items-center gap-4 text-[10px] font-bold text-text-muted mt-auto pt-2">
                                    <div className="flex items-center gap-1">
                                      <Eye size={12} />
                                      <span>{formatCount(video.view_count)} views</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <ThumbsUp size={12} />
                                      <span>{formatCount(video.like_count)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MessageSquare size={12} />
                                      <span>{formatCount(video.comment_count)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10 text-text-muted text-xs font-medium">
                            No synced videos found for this channel.
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12 text-text-muted text-xs font-medium">
                        This creator has not connected their YouTube channel yet.
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'posts' && (
                  <motion.div 
                    key="posts-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {posts.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {posts.map((post: CreatorPost) => (
                          <div 
                            key={post.id} 
                            className={`aspect-square rounded-xl overflow-hidden relative group cursor-pointer border ${
                              isDarkMode ? 'border-zinc-900' : 'border-zinc-200'
                            }`}
                          >
                            <img 
                              src={resolveImg(post.media?.url || post.thumbnail) || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=400'} 
                              alt="Post Thumbnail" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {post.type === 'reel' && (
                              <div className="absolute top-2 right-2 bg-black/60 p-1 rounded-md text-white text-[10px] font-bold">
                                Reel
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-text-muted text-xs font-medium">
                        This creator has not uploaded any posts to SuviX yet.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: B2B Sponsor Action Drawer */}
          <div className="space-y-6">
            
            {/* Direct Sponsorship Card */}
            <div className={`p-6 rounded-3xl border flex flex-col gap-5 ${
              isDarkMode 
                ? 'border-zinc-900 bg-zinc-950/40 shadow-[0_4px_24px_rgba(0,0,0,0.4)]' 
                : 'border-zinc-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
            }`}>
              <div>
                <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>Direct Partnerships</h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">Skip the agency fees. Collaborate directly with this creator, propose brief details, and lock in integrations.</p>
              </div>

              <div className="border-t border-border-main pt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-text-muted">Estimated Integration Cost</span>
                  {activeYtProfile?.subscriber_count ? (
                    <span className={isDarkMode ? 'text-white' : 'text-zinc-900'}>
                      ₹{(activeYtProfile.subscriber_count * 0.15).toLocaleString(undefined, { maximumFractionDigits: 0 })} - 
                      ₹{(activeYtProfile.subscriber_count * 0.4).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  ) : (
                    <span className="text-text-muted">Available upon request</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-text-muted">Average View Benchmark</span>
                  <span className={isDarkMode ? 'text-white' : 'text-zinc-900'}>
                    {activeYtProfile?.average_views ? formatCount(activeYtProfile.average_views) : 'TBD'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-text-muted">Avg. Engagement Rate</span>
                  <span className="text-emerald-500">
                    {activeYtProfile?.engagement_rate ? (activeYtProfile.engagement_rate * 100).toFixed(2) + '%' : 'TBD'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3.5 pt-2">
                <button 
                  onClick={() => navigate(`/communication-hub?userId=${creator.id}`)}
                  className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-purple-600/10"
                >
                  <MessageCircle size={15} />
                  Message Creator
                </button>
                <button 
                  onClick={() => navigate(`/communication-hub?userId=${creator.id}&action=send_offer`)}
                  className={`w-full h-11 border rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'border-zinc-800 text-white hover:bg-zinc-900/60' 
                      : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <Send size={14} />
                  Send Sponsorship Brief
                </button>
              </div>
            </div>

            {/* Campaign Guide Card */}
            <div className={`p-5 rounded-2xl border space-y-3 ${
              isDarkMode ? 'border-zinc-900/60 bg-zinc-950/20' : 'border-zinc-200/60 bg-zinc-50/50'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                <Sparkles size={14} className="text-purple-500" />
                <span>SuviX Escrow Protected</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">All agreements on SuviX are protected by secure escrows. Funds are deposited only when you approve the contract, and released automatically when integration video links are verified via API.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
