import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { useTheme } from '../hooks/useTheme';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Youtube, Eye, Video, ArrowLeft, ExternalLink, 
  ChevronDown, Search, Play, ArrowUpRight, MapPin, 
  TrendingUp, ShieldAlert, Sparkles, Clock, Plus
} from 'lucide-react';

interface YouTubeVideo {
  id: string;
  video_id?: string;
  youtubeProfileId?: string;
  channel_id?: string;
  title: string;
  thumbnail: string;
  // Stats — all come as strings from backend (BigInt serialized as string)
  viewCount?: string | number;
  view_count?: string | number;
  likeCount?: string | number;
  like_count?: string | number;
  commentCount?: string | number;
  comment_count?: string | number;
  duration_secs?: number | null;
  duration?: string;
  published_at?: string;
  publishedAt?: string;
  description?: string;
  tags?: string | null;
  category_id?: string | null;
  made_for_kids?: boolean;
}
import { motion, AnimatePresence } from 'framer-motion';

import SILVER_BTN from '../assets/playbuttons/silverbtn.png';
import GOLD_BTN from '../assets/playbuttons/goldenbtn.png';
import DIAMOND_BTN from '../assets/playbuttons/diamondbtn.png';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=400';

const YouTubeVerificationBadge = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold tracking-tight shadow-sm shrink-0 ${
      isDarkMode 
        ? 'bg-zinc-950/90 border-zinc-800/80 text-zinc-300 shadow-black/20' 
        : 'bg-zinc-50 border-zinc-200 text-zinc-700 shadow-zinc-100'
    }`}>
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <div className="flex items-center gap-1.5 leading-none">
        <Youtube className="w-3.5 h-3.5 fill-[#FF0000] text-[#FF0000] stroke-none shrink-0" />
        <span>Verified Partner</span>
        <span className="opacity-60 font-normal text-[10px]">| Approved by Google & YouTube API</span>
      </div>
    </div>
  );
};

export default function YTDashboard() {
  const user = useSelector(selectUser);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { channelId } = useParams<{ channelId?: string }>();

  const channels = useMemo(() => user?.youtubeProfile || [], [user?.youtubeProfile]);

  // 1. Determine active channel (only populated if channelId exists in URL)
  const activeChannel = useMemo(() => {
    if (channels.length === 0 || !channelId) return null;
    return channels.find(c => c.id === channelId || c.channel_id === channelId) || channels[0];
  }, [channels, channelId]);

  // 2. Filter videos for active channel
  const channelVideos = useMemo(() => {
    if (!activeChannel) return [];
    return (user?.youtubeVideos || []).filter(
      (v: YouTubeVideo) => v.youtubeProfileId === activeChannel.id || v.channel_id === activeChannel.channel_id
    );
  }, [user?.youtubeVideos, activeChannel]);

  // 3. Combined stats for Creator Hub main entrance page
  const totalNetworkStats = useMemo(() => {
    return channels.reduce((acc, ch) => {
      const subs = ch.subscriber_count || 0;
      const views = Number(ch.view_count || 0);
      const vids = ch.video_count || 0;
      return {
        subs: acc.subs + subs,
        views: acc.views + views,
        vids: acc.vids + vids
      };
    }, { subs: 0, views: 0, vids: 0 });
  }, [channels]);

  // 4. Search and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'views'>('recent');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 5. Formatting helper
  const formatCount = (num: number | string | undefined) => {
    if (num === undefined || num === null) return '0';
    const val = typeof num === 'string' ? parseInt(num, 10) || 0 : num;
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  // 6. Niche achievement calculation
  const subCount = activeChannel?.subscriber_count || 0;
  const achievementBadge = useMemo(() => {
    if (subCount >= 10000) return { label: 'Diamond', img: DIAMOND_BTN };
    if (subCount >= 1000) return { label: 'Gold', img: GOLD_BTN };
    if (subCount >= 100) return { label: 'Silver', img: SILVER_BTN };
    return null;
  }, [subCount]);

  // 7. Split videos into Featured (latest 5) and Archive
  const featuredVideos = useMemo(() => channelVideos.slice(0, 5), [channelVideos]);
  const archiveVideos = useMemo(() => channelVideos.slice(5), [channelVideos]);

  // 8. Filtered videos for the archive grid
  const filteredVideos = useMemo(() => {
    let result = [...archiveVideos];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => v.title.toLowerCase().includes(q));
    }
    if (sortBy === 'views') {
      result.sort((a, b) => {
        const aViews = Number(a.viewCount || a.view_count || 0);
        const bViews = Number(b.viewCount || b.view_count || 0);
        return bViews - aViews;
      });
    } else {
      const getVal = (v: YouTubeVideo) => new Date(v.published_at || v.publishedAt || 0).getTime();
      result.sort((a, b) => getVal(b) - getVal(a));
    }
    return result;
  }, [archiveVideos, searchQuery, sortBy]);

  // 9. Upload frequency calculation
  const uploadFrequency = useMemo(() => {
    if (channelVideos.length < 2) return 'N/A';
    const sorted = [...channelVideos].sort((a, b) => new Date(b.published_at || b.publishedAt || 0).getTime() - new Date(a.published_at || a.publishedAt || 0).getTime());
    const latest = new Date(sorted[0].published_at || sorted[0].publishedAt || 0);
    const oldest = new Date(sorted[sorted.length - 1].published_at || sorted[sorted.length - 1].publishedAt || 0);
    const diffDays = (latest.getTime() - oldest.getTime()) / (1000 * 3600 * 24);
    if (diffDays <= 0) return 'N/A';
    const freqPerMonth = (sorted.length / diffDays) * 30;
    if (freqPerMonth > 15) return `${(freqPerMonth / 4).toFixed(1)} vids/week`;
    return `${freqPerMonth.toFixed(1)} vids/month`;
  }, [channelVideos]);

  // 10. Top Videos calculation
  const topVideos = useMemo(() => {
    return [...channelVideos]
      .sort((a, b) => Number(b.view_count || b.viewCount || 0) - Number(a.view_count || a.viewCount || 0))
      .slice(0, 3);
  }, [channelVideos]);

  // Watch video helper
  const handleWatch = (videoId: string | undefined) => {
    if (videoId) {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    }
  };

  // Open Youtube Studio helper
  const handleOpenStudio = () => {
    if (activeChannel?.channel_id) {
      window.open(`https://studio.youtube.com/channel/${activeChannel.channel_id}/editing/details`, '_blank');
    }
  };

  const handleBack = () => {
    if (channels.length > 1) {
      navigate('/youtube-dashboard');
    } else {
      navigate('/profile');
    }
  };

  // Empty state if no channels connected
  if (channels.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-bounce ${isDarkMode ? 'bg-zinc-900 text-rose-500' : 'bg-rose-50 text-rose-600'}`}>
          <Youtube size={44} className="fill-current stroke-none" />
        </div>
        <h2 className={`text-xl font-bold mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
          No YouTube Channel Linked
        </h2>
        <p className={`text-sm max-w-sm mb-6 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Connect your YouTube account to unlock creators analytics, deals, performance monitoring and media portfolios.
        </p>
        <div className="mb-8">
          <YouTubeVerificationBadge />
        </div>
        <button
          onClick={() => navigate('/youtube-connect')}
          className={`px-8 py-3 rounded-full font-bold text-sm tracking-wide shadow-sm hover:-translate-y-0.5 transition-all active:scale-[0.98] cursor-pointer ${
            isDarkMode 
              ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-950/20' 
              : 'bg-zinc-950 text-white hover:bg-rose-900 shadow-zinc-200'
          }`}
        >
          Link YouTube Profile
        </button>
      </div>
    );
  }

  // ─── STAGE A: Main Hub Entrance Page ───
  if (!channelId) {
    return (
      <div className="w-full h-full flex flex-col space-y-5">
        {/* Creator Hub Header & Welcome */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-main pb-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                Creator Hub
              </h1>
              <YouTubeVerificationBadge />
            </div>
            <p className="text-xs text-text-muted mt-1 font-medium">
              Manage your connected channels, analytics workspaces, and portfolios.
            </p>
          </div>
          
          <button
            onClick={() => navigate('/youtube-connect')}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer ${
              isDarkMode 
                ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-950/20' 
                : 'bg-zinc-950 text-white hover:bg-zinc-900 shadow-zinc-200'
            }`}
          >
            <Plus size={14} />
            <span>Connect Channel</span>
          </button>
        </div>

        {/* Combined Network Reach Card */}
        <div className={`relative overflow-hidden rounded-2xl p-6 border ${
          isDarkMode 
            ? 'bg-zinc-950 border-border-main  shadow-sm' 
            : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div>
              <span className={`text-[9px] font-semibold tracking-widest px-3 py-1 rounded-full uppercase ${
                isDarkMode ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' : 'bg-zinc-200/60 text-zinc-700'
              }`}>
                Combined Network Reach
              </span>
              <h2 className={`text-xl font-bold tracking-tight mt-4 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                Workspace Insights
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-border-main/50">
              <div>
                <p className="text-2xl font-bold tracking-tight text-text-main leading-none">
                  {formatCount(totalNetworkStats.subs)}
                </p>
                <p className="text-[10px] font-bold text-text-muted mt-2 uppercase tracking-wider">Total Subscribers</p>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-text-main leading-none">
                  {formatCount(totalNetworkStats.views)}
                </p>
                <p className="text-[10px] font-bold text-text-muted mt-2 uppercase tracking-wider">Combined Network Views</p>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-text-main leading-none">
                  {formatCount(totalNetworkStats.vids)}
                </p>
                <p className="text-[10px] font-bold text-text-muted mt-2 uppercase tracking-wider">Videos Managed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Channels Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-rose-500 rounded-full" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-main">
              Your Connected Channels ({channels.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.map((channel) => {
              const hasMilestone = (channel.subscriber_count || 0) >= 100;
              const milestoneImg = (channel.subscriber_count || 0) >= 10000 
                ? DIAMOND_BTN 
                : ((channel.subscriber_count || 0) >= 1000 ? GOLD_BTN : SILVER_BTN);
                
              return (
                <motion.div
                  key={channel.channel_id}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(`/youtube-dashboard/${channel.channel_id}`)}
                  className={`group rounded-xl border overflow-hidden cursor-pointer transition-all duration-300 relative ${
                    isDarkMode 
                      ? 'bg-zinc-950 border-border-main hover:border-zinc-700 shadow-sm' 
                      : 'bg-white border-zinc-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Banner image or fallback gradient */}
                  <div className="relative h-20 w-full bg-zinc-900 overflow-hidden">
                    {channel.banner_url ? (
                      <img 
                        src={channel.banner_url} 
                        alt="" 
                        className="w-full h-full object-cover opacity-60 group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-zinc-900 to-rose-950/40 opacity-70" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    
                    {/* Achievement badge */}
                    {hasMilestone && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1 shadow-md">
                        <img src={milestoneImg} alt="" className="w-3.5 h-3.5 object-contain" />
                        <span className="text-[8px] font-semibold text-white uppercase tracking-wider">Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Channel Details Overlay */}
                  <div className="p-4 pt-0 relative">
                    {/* Offset Avatar */}
                    <div className={`w-12 h-12 rounded-full overflow-hidden border-[3px] -mt-6 shadow-md relative ${
                      isDarkMode ? 'border-zinc-950' : 'border-white'
                    }`}>
                      <img 
                        src={channel.thumbnail_url || DEFAULT_AVATAR} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="mt-3">
                      <h4 className={`text-base font-semibold truncate leading-snug group-hover:text-rose-500 transition-colors ${
                        isDarkMode ? 'text-white' : 'text-zinc-950'
                      }`}>
                        {channel.channel_name}
                      </h4>
                      <p className="text-[10px] text-text-muted font-bold tracking-wider mt-0.5">
                        {channel.custom_url || `@${channel.channel_id?.substring(0, 14)}`}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className={`grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl border text-center ${
                      isDarkMode ? 'bg-zinc-900/30 border-border-main/50' : 'bg-zinc-50 border-zinc-100'
                    }`}>
                      <div>
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Subs</p>
                        <p className="text-xs font-semibold text-text-main mt-0.5">{formatCount(channel.subscriber_count)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Views</p>
                        <p className="text-xs font-semibold text-text-main mt-0.5">{formatCount(channel.view_count)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Videos</p>
                        <p className="text-xs font-semibold text-text-main mt-0.5">{formatCount(channel.video_count)}</p>
                      </div>
                    </div>

                    {/* Entrance Button */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-main/20">
                      <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-widest flex items-center gap-1">
                        {channel.subCategoryName || 'YouTube Workspace'}
                      </span>
                      <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wider transition-colors duration-200 ${
                        isDarkMode 
                          ? 'border-border-main text-text-muted group-hover:text-white group-hover:bg-border-secondary' 
                          : 'border-zinc-200 text-zinc-600 group-hover:border-zinc-950 group-hover:bg-zinc-950 group-hover:text-white'
                      }`}>
                        <span>Workspace</span>
                        <ArrowUpRight size={12} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Connect Channel Action Card */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => navigate('/youtube-connect')}
              className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 min-h-[160px] text-center cursor-pointer transition-all duration-300 ${
                isDarkMode 
                  ? 'border-border-main bg-black/20 hover:bg-zinc-900/10 hover:border-zinc-700 text-text-muted hover:text-text-main' 
                  : 'border-zinc-300 bg-zinc-50/30 hover:bg-zinc-100/50 hover:border-zinc-500 text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                isDarkMode ? 'bg-zinc-900' : 'bg-zinc-200'
              }`}>
                <Plus size={20} />
              </div>
              <h4 className="text-xs font-semibold uppercase tracking-widest">Connect Another Channel</h4>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed max-w-[200px]">
                Add more YouTube workspaces to track views and manage deals.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STAGE B: Active Channel Details View ───
  return (
    <div className="w-full h-full flex flex-col space-y-4">
      
      {/* ─── Top Header: Dropdown Channel Selector ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-main pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBack}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDarkMode 
                ? 'border-border-main text-text-muted hover:text-text-main hover:bg-border-secondary' 
                : 'border-zinc-200 text-zinc-600 hover:border-zinc-950 hover:bg-zinc-100'
            }`}
            title="Back to Channels"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div className="relative">
            {channels.length > 1 ? (
              <div>
                <button
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all text-left cursor-pointer ${
                    isDarkMode 
                      ? 'border-border-main bg-zinc-950/60 hover:bg-zinc-900 text-white' 
                      : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-950 shadow-sm'
                  }`}
                >
                  <img 
                    src={activeChannel?.thumbnail_url || DEFAULT_AVATAR} 
                    alt={activeChannel?.channel_name} 
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-[120px] max-w-[180px]">
                    <p className="text-xs font-semibold truncate leading-none">{activeChannel?.channel_name}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 truncate leading-none">
                      {formatCount(activeChannel?.subscriber_count)} Subscribers
                    </p>
                  </div>
                  <ChevronDown size={14} className={`text-text-muted transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className={`absolute top-full left-0 mt-2 w-64 rounded-2xl border shadow-sm z-20 overflow-hidden ${
                          isDarkMode 
                            ? 'bg-zinc-950 border-border-main' 
                            : 'bg-white border-zinc-200'
                        }`}
                      >
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em] px-4 py-3 border-b border-border-main/50">
                          Select Channel
                        </p>
                        <div className="max-h-60 overflow-y-auto">
                          {channels.map((ch) => (
                            <button
                              key={ch.channel_id}
                              onClick={() => {
                                setIsDropdownOpen(false);
                                navigate(`/youtube-dashboard/${ch.channel_id}`);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                                ch.channel_id === activeChannel?.channel_id
                                  ? (isDarkMode ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-50 text-rose-600')
                                  : (isDarkMode ? 'hover:bg-zinc-900 text-white' : 'hover:bg-zinc-50 text-zinc-900')
                              }`}
                            >
                              <img 
                                src={ch.thumbnail_url || DEFAULT_AVATAR} 
                                alt={ch.channel_name} 
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold truncate leading-tight">{ch.channel_name}</p>
                                <p className="text-[10px] text-text-muted truncate mt-0.5">
                                  {formatCount(ch.subscriber_count)} Subscribers
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <img 
                  src={activeChannel?.thumbnail_url || DEFAULT_AVATAR} 
                  alt={activeChannel?.channel_name} 
                  className="w-10 h-10 rounded-full object-cover border border-border-main shrink-0"
                />
                <div>
                  <h1 className={`text-lg font-bold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                    {activeChannel?.channel_name}
                  </h1>
                  <p className="text-xs text-text-muted mt-1 leading-none">YouTube Dashboard</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <YouTubeVerificationBadge />
          <button
            onClick={() => navigate('/youtube-connect')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold tracking-wide transition-all active:scale-[0.98] cursor-pointer ${
              isDarkMode 
                ? 'border-border-main bg-zinc-950 text-white hover:bg-border-secondary' 
                : 'border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 hover:shadow-sm'
            }`}
          >
            <Youtube size={14} className="fill-red-500 stroke-none" />
            <span>Link Another Channel</span>
          </button>
        </div>
      </div>

      {/* ─── Hero Banner Box ─── */}
      <div className={`relative w-full aspect-[6/1] rounded-xl overflow-hidden border shadow-sm ${
        isDarkMode ? 'border-border-main bg-zinc-900' : 'border-zinc-950 border-[1.5px]'
      }`}>
        {activeChannel?.banner_url ? (
          <img 
            src={activeChannel.banner_url} 
            alt="YouTube Channel Banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#1E1B4B] via-[#881337] to-[#831843] flex items-center justify-center">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <Youtube size={56} className="text-white/20 fill-current stroke-none" />
          </div>
        )}
        
        {/* Banner Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <button
          onClick={handleOpenStudio}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 hover:border-white/40 active:scale-95 text-[10px] font-bold text-white transition-all cursor-pointer shadow-md"
        >
          <span>EDIT PROFILE</span>
          <ExternalLink size={10} />
        </button>
      </div>

      {/* ─── Identity Information Row ─── */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-4 px-4 -mt-8 relative z-10">
        {/* Large Avatar */}
        <div className={`relative w-16 h-16 rounded-full overflow-hidden border-[4px] shrink-0 shadow-sm ${
          isDarkMode ? 'border-black bg-zinc-950' : 'border-white bg-zinc-200'
        }`}>
          <img 
            src={activeChannel?.thumbnail_url || DEFAULT_AVATAR} 
            alt={activeChannel?.channel_name} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Identity Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className={`text-xl font-bold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
              {activeChannel?.channel_name}
            </h2>
            
            {activeChannel?.subCategoryName && (
              <span className={`text-[9px] font-semibold tracking-widest px-2.5 py-1 rounded-full uppercase shrink-0 ${
                isDarkMode 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                  : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}>
                {activeChannel.subCategoryName}
              </span>
            )}

            {achievementBadge && (
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 shrink-0">
                <img src={achievementBadge.img} alt={achievementBadge.label} className="w-3.5 h-3.5 object-contain" />
                <span className="text-[8px] font-semibold text-white uppercase tracking-wider">{achievementBadge.label}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-text-muted mt-2 flex items-center gap-1.5 flex-wrap font-medium">
            <span>{activeChannel?.custom_url || `@${activeChannel?.channel_id?.substring(0, 14)}`}</span>
            <span className="w-1 h-1 rounded-full bg-border-main" />
            <span className="flex items-center gap-1">
              <MapPin size={10} />
              {activeChannel?.country?.toUpperCase() || 'GLOBAL'}
            </span>
          </p>
        </div>

        <button
          onClick={handleOpenStudio}
          className={`flex items-center gap-2 h-11 px-5 rounded-2xl font-bold text-xs tracking-wide transition-all shadow-md active:scale-[0.98] cursor-pointer shrink-0 ${
            isDarkMode 
              ? 'bg-white text-black hover:bg-zinc-100 shadow-zinc-950/20' 
              : 'bg-zinc-950 text-white hover:bg-zinc-900 shadow-zinc-200'
          }`}
        >
          <TrendingUp size={13} />
          <span>YouTube Studio</span>
          <ArrowUpRight size={12} />
        </button>
      </div>

      {/* ─── KPI Stats Grid ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total Subscribers', 
            val: formatCount(activeChannel?.subscriber_count), 
            desc: 'Subscribers base', 
            icon: Youtube, 
            color: 'text-rose-500 bg-rose-500/10' 
          },
          { 
            label: 'Total Video Views', 
            val: formatCount(activeChannel?.view_count), 
            desc: 'Cumulative views', 
            icon: Eye, 
            color: 'text-blue-500 bg-blue-500/10' 
          },
          { 
            label: 'Avg Views/Video', 
            val: formatCount(activeChannel?.avg_views_per_video), 
            desc: 'Per recent videos', 
            icon: TrendingUp, 
            color: 'text-emerald-500 bg-emerald-500/10' 
          },
          { 
            label: 'Engagement Rate', 
            val: activeChannel?.engagement_rate ? `${activeChannel.engagement_rate.toFixed(2)}%` : 'N/A', 
            desc: 'Likes/Comments per view', 
            icon: Sparkles, 
            color: 'text-purple-500 bg-purple-500/10' 
          },
        ].map((stat, i) => (
          <div 
            key={i}
            className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
              isDarkMode 
                ? 'bg-zinc-950/30 border-border-main hover:border-zinc-800' 
                : 'bg-white border-zinc-200 hover:shadow-md'
            }`}
          >
            {/* Glowing Accent Glow */}
            <div className="absolute -top-12 -right-12 w-16 h-16 rounded-full blur-[32px] opacity-10 bg-current transition-opacity group-hover:opacity-20" />
            
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              
              {/* Premium Mini-Sparkline decoration */}
              <svg className="w-16 h-8 text-emerald-500 opacity-60" viewBox="0 0 100 30" fill="none">
                <path d="M0,25 Q15,10 30,22 T60,5 T90,15 T100,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <div className="mt-4">
              <h3 className="text-2xl font-bold tracking-tight leading-none text-text-main">{stat.val}</h3>
              <p className="text-xs font-bold text-text-muted mt-2 uppercase tracking-widest">{stat.label}</p>
              <p className="text-[10px] text-text-muted mt-1 font-medium">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Description / Niche Box ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeChannel?.description && (
          <div className={`col-span-1 md:col-span-2 p-4 rounded-xl border ${
            isDarkMode ? 'bg-zinc-950/20 border-border-main/60 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
          }`}>
            <div className="flex items-center gap-2 mb-2 text-text-main">
              <Sparkles size={14} className="text-rose-500" />
              <h3 className="text-xs font-semibold uppercase tracking-widest">Channel Description & Bio</h3>
            </div>
            <p className="text-xs leading-relaxed font-medium">
              {activeChannel.description}
            </p>
          </div>
        )}

        <div className={`col-span-1 p-4 rounded-xl border flex flex-col justify-center ${
          isDarkMode ? 'bg-zinc-950/20 border-border-main/60' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex items-center gap-2 mb-3 text-text-main">
            <Clock size={14} className="text-amber-500" />
            <h3 className="text-xs font-semibold uppercase tracking-widest">Upload Frequency</h3>
          </div>
          <p className="text-2xl font-bold tracking-tight text-text-main leading-none mb-1">
            {uploadFrequency}
          </p>
          <p className="text-[10px] text-text-muted font-medium">Based on latest uploads</p>
        </div>
      </div>

      {/* ─── Unlock More Deals (Analytics OAuth Placeholder) ─── */}
      <div className={`relative overflow-hidden rounded-xl border p-5 sm:p-6 ${
        isDarkMode ? 'bg-gradient-to-br from-indigo-950/40 via-purple-900/20 to-zinc-950 border-indigo-500/30' : 'bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white border-indigo-200'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-500">
              <ShieldAlert size={16} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Unlock 3x More Brand Deals</h3>
            </div>
            <p className={`text-xs max-w-xl font-medium leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Brands prefer creators who share true audience analytics. Connect your YouTube Analytics to unlock Audience Demographics, Avg Watch Time, and Geo-Targeting on your profile.
            </p>
            <p className="text-[10px] text-text-muted font-bold tracking-wider pt-1">
              Your data is only shown to brands you approve.
            </p>
          </div>
          <button className={`shrink-0 px-6 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-sm hover:-translate-y-0.5 transition-all active:scale-[0.98] cursor-pointer ${
            isDarkMode 
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/20' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
          }`}>
            Connect Analytics
          </button>
        </div>
      </div>

      {/* ─── Top 3 Performing Videos ─── */}
      {topVideos.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-main">
              Top Performing Videos
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topVideos.map((video, idx) => {
              const videoId = video.video_id || video.id;
              const views = video.viewCount || video.view_count;
              const dateVal = video.published_at || video.publishedAt;
              
              return (
                <div 
                  key={videoId} 
                  onClick={() => handleWatch(videoId)}
                  className={`relative flex flex-col rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 group ${
                    isDarkMode 
                      ? 'bg-zinc-950 border-border-main hover:border-zinc-800' 
                      : 'bg-white border-zinc-200 hover:shadow-md'
                  }`}
                >
                  <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
                    #{idx + 1}
                  </div>
                  <div className="relative aspect-video bg-black overflow-hidden shrink-0">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-semibold text-white">
                        {video.duration}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/90 text-white flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <Play size={20} fill="currentColor" className="ml-1" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <h4 className="text-xs font-semibold text-text-main line-clamp-2 leading-snug group-hover:text-emerald-500 transition-colors">
                      {video.title}
                    </h4>
                    
                    <div className="flex items-center justify-between text-[10px] text-text-muted font-bold uppercase tracking-wider pt-2 border-t border-border-main/30">
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>{dateVal ? new Date(dateVal).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : 'Unknown'}</span>
                      </div>
                      <span className="text-emerald-500 flex items-center gap-1"><TrendingUp size={10} /> {formatCount(views)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Featured Content Section (Netflix Landscape Carousel) ─── */}
      {featuredVideos.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-rose-500 rounded-full" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-main">
              Featured Content (Latest {featuredVideos.length})
            </h3>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide overscroll-x-contain touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0">
            {featuredVideos.map((video) => {
              const videoId = video.video_id || video.id;
              const views = video.viewCount || video.view_count;
              const dateVal = video.published_at || video.publishedAt;
              
              return (
                <div 
                  key={videoId} 
                  onClick={() => handleWatch(videoId)}
                  className={`flex-shrink-0 w-72 rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 group ${
                    isDarkMode 
                      ? 'bg-zinc-950 border-border-main hover:border-zinc-800' 
                      : 'bg-white border-zinc-200 hover:shadow-md'
                  }`}
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-semibold text-white">
                        {video.duration}
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <Play size={20} fill="currentColor" className="ml-1" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-text-main line-clamp-1 leading-snug group-hover:text-rose-500 transition-colors">
                      {video.title}
                    </h4>
                    
                    <div className="flex items-center justify-between text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>{dateVal ? new Date(dateVal).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}</span>
                      </div>
                      <span>{formatCount(views)} views</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Video Library Section (Archive List) ─── */}
      <div className="space-y-4 pt-6">
        {/* Title & Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border-main/50 pt-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-rose-500 rounded-full" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-main">
              Video Archive ({channelVideos.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-9 pr-4 py-2 rounded-xl text-xs font-semibold outline-none border transition-all ${
                  isDarkMode 
                    ? 'border-border-main bg-zinc-950/60 focus:bg-zinc-900 text-white focus:border-zinc-700' 
                    : 'border-zinc-200 bg-white focus:bg-zinc-50 text-zinc-950 focus:border-zinc-400'
                }`}
              />
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>

            {/* Sort Toggle */}
            <div className={`flex rounded-xl p-0.5 border ${
              isDarkMode ? 'border-border-main bg-zinc-950/40' : 'border-zinc-200 bg-zinc-50'
            }`}>
              {[
                { id: 'recent', label: 'Recent' },
                { id: 'views', label: 'Views' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSortBy(btn.id as 'recent' | 'views')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    sortBy === btn.id
                      ? (isDarkMode ? 'bg-white text-black font-semibold' : 'bg-zinc-950 text-white')
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Video Grid */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => {
              const videoId = video.video_id || video.id;
              const views = video.viewCount || video.view_count;
              const dateVal = video.published_at || video.publishedAt;
              
              return (
                <div
                  key={videoId}
                  onClick={() => handleWatch(videoId)}
                  className={`flex flex-col rounded-2xl border overflow-hidden cursor-pointer group transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-zinc-950/20 border-border-main hover:border-zinc-800' 
                      : 'bg-white border-zinc-200 hover:shadow-md'
                  }`}
                >
                  <div className="relative aspect-video bg-black overflow-hidden shrink-0">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                    
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-semibold text-white">
                        {video.duration}
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <h4 className="text-xs font-bold text-text-main line-clamp-2 leading-relaxed leading-snug group-hover:text-rose-500 transition-colors">
                      {video.title}
                    </h4>
                    
                    <div className="flex items-center justify-between text-[9px] text-text-muted font-bold uppercase tracking-wider pt-2 border-t border-border-main/30">
                      <span>{dateVal ? new Date(dateVal).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'}</span>
                      <span>{formatCount(views)} views</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center border border-dashed border-border-main rounded-xl">
            <ShieldAlert size={28} className="text-text-muted mb-2" />
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">No matching videos found</p>
          </div>
        )}
      </div>

    </div>
  );
}
