import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Youtube, Eye, ThumbsUp, MessageSquare, MapPin, 
  MessageCircle, Send, ShieldAlert, ArrowLeft, Loader2, Play
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { api } from '../api/client';
import defaultProfile from '../assets/defaultprofile.png';
import SILVER_BTN from '../assets/playbuttons/silverbtn.png';
import GOLD_BTN from '../assets/playbuttons/goldenbtn.png';
import DIAMOND_BTN from '../assets/playbuttons/diamondbtn.png';

interface SyncedVideo {
  id: string;
  title: string;
  thumbnail: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

interface OtherChannel {
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  subscriberCount: number;
}

interface ChannelProfileData {
  id: string;
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  bannerUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  viewCount: string;
  averageViews: number;
  engagementRate: number;
  videos: SyncedVideo[];
  creator: {
    userId: string;
    name: string;
    username: string;
    profilePicture: string | null;
    coverBanner: string | null;
    bio: string;
    location: string;
    roles: string[];
    otherChannels: OtherChannel[];
  };
}

export default function ChannelProfilePage() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // 1. Fetch Specific YouTube Channel Details
  const { data: channelData, isLoading, error } = useQuery<ChannelProfileData | null>({
    queryKey: ['channel-profile-details', channelId],
    queryFn: async () => {
      const response = await api.get(`/profile/channel/${channelId}`);
      return response.data?.success ? response.data.data : null;
    },
    enabled: !!channelId,
  });

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

  const totalLinkedChannels = useMemo(() => {
    if (!channelData?.creator) return 0;
    return (channelData.creator.otherChannels?.length || 0) + 1;
  }, [channelData]);

  const achievementBadge = useMemo(() => {
    if (!channelData) return null;
    const subCount = channelData.subscriberCount || 0;
    if (subCount >= 10000000) return { title: 'Diamond Creator', img: DIAMOND_BTN, desc: '10M+ Subscribers' };
    if (subCount >= 1000000) return { title: 'Gold Creator', img: GOLD_BTN, desc: '1M+ Subscribers' };
    if (subCount >= 100000) return { title: 'Silver Creator', img: SILVER_BTN, desc: '100K+ Subscribers' };
    return null;
  }, [channelData]);

  if (isLoading) {
    return (
      <div className={`w-full min-h-[70vh] flex flex-col items-center justify-center gap-3 ${
        isDarkMode ? 'bg-[#0A0A0A]' : 'bg-zinc-50'
      }`}>
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <p className={`text-xs font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Analyzing Media Kit...</p>
      </div>
    );
  }

  if (error || !channelData) {
    return (
      <div className={`w-full min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4 ${
        isDarkMode ? 'bg-[#0A0A0A]' : 'bg-zinc-50'
      }`}>
        <ShieldAlert className="w-12 h-12 text-rose-500" />
        <div className="space-y-1">
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-zinc-955'}`}>Profile Unreachable</h2>
          <p className={`text-xs max-w-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            This creator profile hasn't been synced or isn't public in the B2B catalog.
          </p>
        </div>
        <button 
          onClick={() => navigate('/explore')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] border ${
            isDarkMode 
              ? 'bg-zinc-900 text-white hover:bg-zinc-855 border-zinc-800' 
              : 'bg-white text-zinc-800 hover:bg-zinc-100 border-zinc-200'
          }`}
        >
          Return to Explore
        </button>
      </div>
    );
  }

  const { creator } = channelData;
  const channelBanner = resolveImg(channelData.bannerUrl || creator.coverBanner);
  const channelAvatar = resolveImg(channelData.thumbnailUrl) || defaultProfile;

  return (
    <div className={`w-full flex flex-col font-sans relative pb-20 min-h-screen ${
      isDarkMode ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'
    }`}>
      
      {/* Hero Banner Section (Floating style with rounded edges) */}
      <div className="px-4 md:px-8 pt-4">
        <div className={`w-full h-40 md:h-56 relative rounded-3xl overflow-hidden shadow-lg border ${
          isDarkMode ? 'bg-zinc-900 border-zinc-900' : 'bg-zinc-100 border-zinc-200'
        }`}>
          {channelBanner ? (
            <img 
              src={channelBanner} 
              alt="YouTube Channel Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800 via-zinc-900 to-zinc-955" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className={`absolute top-4 left-4 z-30 p-2.5 rounded-full border transition-all active:scale-95 shadow-md ${
              isDarkMode 
                ? 'bg-zinc-900/70 border-zinc-800 text-white hover:bg-zinc-900' 
                : 'bg-white/80 border-zinc-200 text-zinc-850 hover:bg-zinc-100'
            }`}
          >
            <ArrowLeft size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Layout (No padding/margin to parent box) */}
      <div className="w-full px-4 md:px-8 mt-6">
        
        {/* Full-width Header Row: Channel profile image, details, and CTA buttons stacked vertically on the right corner */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-5 text-center md:text-left mb-8 px-2 border-b border-zinc-900/5 dark:border-white/5 pb-6">
          
          {/* Left Side: Avatar and Name */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
            <img 
              src={channelAvatar} 
              alt={channelData.channelName} 
              className={`w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 shadow-xl shrink-0 -mt-10 md:-mt-14 relative z-20 ${
                isDarkMode ? 'border-[#0A0A0A]' : 'border-white'
              }`}
            />
            <div className="min-w-0">
              <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2.5">
                <h1 className={`text-xl md:text-2xl font-semibold tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-zinc-955'}`}>
                  {channelData.channelName}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-1 text-[9px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider w-max mx-auto md:mx-0 shrink-0">
                  <Youtube size={10} className="fill-red-500 text-red-500" /> Synced Channel
                </div>
              </div>
              <p className={`text-xs font-semibold mt-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Owned by <span className={isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}>{creator.name}</span> • @{creator.username}
              </p>
            </div>
          </div>

          {/* Right Side: CTA Action Buttons (Stacked vertically one by one, fixed width of 220px to prevent overflow) */}
          <div className="flex flex-col gap-2 w-full max-w-[220px] shrink-0 pb-1">
            <button 
              onClick={() => navigate('/communication-hub?userId=' + creator.userId)}
              className={`w-full h-10 rounded-2xl text-xs font-bold transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm ${
                isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-950 text-white hover:bg-zinc-900'
              }`}
            >
              <MessageCircle size={14} className={isDarkMode ? 'text-black' : 'text-white'} />
              <span className={isDarkMode ? 'text-black' : 'text-white'}>Message Channel</span>
            </button>
            <button 
              onClick={() => navigate('/sponsorship-brief?creatorId=' + creator.userId)}
              className={`w-full h-10 rounded-2xl text-xs font-bold border transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm ${
                isDarkMode 
                  ? 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-800/80' 
                  : 'bg-zinc-50 border-zinc-250 hover:bg-zinc-100 hover:border-zinc-300'
              }`}
            >
              <Send size={12} className={isDarkMode ? 'text-white' : 'text-zinc-800'} />
              <span className={isDarkMode ? 'text-white font-bold' : 'text-zinc-800 font-bold'}>Propose Campaign Brief</span>
            </button>
          </div>
        </div>

        {/* Top 2 Columns Section below the full-width header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Creator profile card */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* B2B Professional Box Component (Channel owner details) */}
            <div className={`p-6 rounded-3xl border flex flex-col gap-5 shadow-lg transition-all duration-300 hover:shadow-xl ${
              isDarkMode 
                ? 'bg-zinc-950 border-zinc-900 hover:border-zinc-800/80' 
                : 'bg-white border-zinc-200 shadow-zinc-100/50 hover:shadow-zinc-200/50'
            }`}>
              
              {/* Creator details header */}
              <div className="space-y-4">
                <span className={`text-[9px] font-bold uppercase tracking-widest block ${
                  isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                }`}>
                  Verified Channel Owner
                </span>
                
                {/* Creator Avatar & Basic Details */}
                <div className="flex items-center gap-3.5 pb-3 border-b border-zinc-900/10 dark:border-white/5">
                  <img 
                    src={resolveImg(creator.profilePicture) || defaultProfile} 
                    alt={creator.name} 
                    className={`w-11 h-11 rounded-full object-cover border-2 shadow-sm ${
                      isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-xs font-bold truncate leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      {creator.name}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-semibold">@{creator.username}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500 font-medium">
                      <MapPin size={11} className="text-zinc-500" />
                      <span>{creator.location}</span>
                    </div>
                  </div>
                </div>

                {/* Inline Linked Channels List under Owner Details */}
                <div className="space-y-2 pt-2">
                  <span className={`text-[9px] font-bold uppercase tracking-widest block ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>
                    Linked Channels ({totalLinkedChannels})
                  </span>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {/* Active Channel */}
                    <div className={`flex items-center gap-2 p-1.5 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-zinc-900/40 border-zinc-800' 
                        : 'bg-zinc-100 border-zinc-200/80'
                    }`}>
                      <img src={channelAvatar} className="w-5 h-5 rounded-full object-cover" />
                      <span className={`text-[10px] font-bold truncate flex-1 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
                        {channelData.channelName}
                      </span>
                      <span className="text-[7px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded uppercase">Active</span>
                    </div>

                    {/* Other Linked Channels */}
                    {creator.otherChannels?.map((ch) => (
                      <div 
                        key={ch.channelId}
                        onClick={() => navigate(`/channel/${ch.channelId}`)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                          isDarkMode 
                            ? 'bg-zinc-900/10 border-transparent hover:border-zinc-800' 
                            : 'bg-zinc-50/50 border-transparent hover:border-zinc-200'
                        }`}
                      >
                        <img src={resolveImg(ch.thumbnailUrl) || defaultProfile} className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-[10px] font-semibold text-zinc-550 truncate flex-1">
                          {ch.channelName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Creator Bio Container */}
                {creator.bio && (
                  <div className={`text-xs leading-relaxed font-medium pl-3 border-l-2 ${
                    isDarkMode 
                      ? 'border-zinc-800 bg-zinc-900/10 text-zinc-400 py-1' 
                      : 'border-zinc-200 bg-zinc-50/50 text-zinc-655 py-1'
                  }`}>
                    {creator.bio}
                  </div>
                )}
              </div>

              {/* Achievement Badge */}
              {achievementBadge && (
                <div className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
                  isDarkMode ? 'bg-[#111111]/40 border-zinc-900' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <img src={achievementBadge.img} alt={achievementBadge.title} className="w-9 h-9 object-contain shrink-0" />
                  <div className="min-w-0">
                    <h5 className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      {achievementBadge.title}
                    </h5>
                    <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">{achievementBadge.desc}</p>
                  </div>
                </div>
              )}

              {/* Creator Specialties */}
              {creator.roles && creator.roles.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-900/10 dark:border-white/5">
                  <span className={`text-[9px] font-bold uppercase tracking-widest block ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>
                    Specialties
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {creator.roles.map((role: string, idx: number) => (
                      <span 
                        key={idx} 
                        className={`text-[8px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          isDarkMode 
                            ? 'bg-zinc-900 text-zinc-400 border border-zinc-800/60' 
                            : 'bg-zinc-100 text-zinc-650 border border-zinc-200/60'
                        }`}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Performance Stats and Campaign Escrow Guarantee */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Performance Statistics Grid */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl border ${
              isDarkMode ? 'bg-[#111111]/40 border-zinc-900' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Subscribers</span>
                <p className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-955'}`}>
                  {formatCount(channelData.subscriberCount)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Avg Views</span>
                <p className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-905'}`}>
                  {formatCount(channelData.averageViews)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Engagement</span>
                <p className="text-xl font-bold tracking-tight text-emerald-500">
                  {(channelData.engagementRate * 100).toFixed(2)}%
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Total Videos</span>
                <p className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-955'}`}>
                  {formatCount(channelData.videoCount)}
                </p>
              </div>
            </div>

            {/* Campaign Contract Escrow Warning */}
            <div className={`p-5 rounded-3xl border flex items-start gap-3.5 ${
              isDarkMode ? 'bg-[#111111]/20 border-zinc-900/60' : 'bg-rose-50/10 border-rose-100/50'
            }`}>
              <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={16} />
              <div className="space-y-1">
                <h5 className={`text-xs font-bold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-850'}`}>Escrow Guarantee</h5>
                <p className={`text-[10.5px] leading-relaxed font-medium ${
                  isDarkMode ? 'text-zinc-500' : 'text-zinc-600'
                }`}>
                  Always process campaigns using SuviX Escrow Contracts. Funds remain safely in escrow until YouTube syncer verifies campaign integrations.
                </p>
              </div>
            </div>

            {/* Campaign Integration Price Box */}
            <div className={`p-5 rounded-3xl border flex items-center justify-between ${
              isDarkMode ? 'bg-[#111111]/20 border-zinc-900/60' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Estimated Sponsorship Cost</span>
                <p className="text-[10.5px] text-zinc-500 font-medium">Calculated dynamically based on subscriber milestone values.</p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                  ${formatCount(Math.round((channelData.subscriberCount || 0) * 0.015) || 150)}
                </span>
                <span className="text-[9px] font-bold text-zinc-500 block">/ integration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Section below: Videos list grid (not 2 columns) */}
        <div className={`mt-8 p-6 rounded-3xl border space-y-5 ${
          isDarkMode ? 'bg-[#111111]/10 border-zinc-900' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-900/10 dark:border-white/5">
            <h3 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Recent Uploads</h3>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Synced Real-Time</span>
          </div>

          {channelData.videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {channelData.videos.slice(0, 12).map((video: SyncedVideo) => (
                <div 
                  key={video.id}
                  className={`flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
                    isDarkMode ? 'bg-zinc-950/40 border-zinc-900 hover:bg-zinc-950/60' : 'bg-white border-zinc-200 hover:shadow-md'
                  }`}
                >
                  <div className="aspect-video relative overflow-hidden bg-zinc-800 group">
                    <img src={resolveImg(video.thumbnail) || ''} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={16} className="text-white fill-white" />
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <h4 className={`text-xs font-semibold leading-snug line-clamp-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      {video.title}
                    </h4>
                    <div className="flex items-center gap-4 text-[9px] font-bold text-zinc-500 mt-auto pt-2 border-t border-zinc-900/10 dark:border-white/5">
                      <div className="flex items-center gap-1">
                        <Eye size={11} />
                        <span>{formatCount(video.viewCount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp size={11} />
                        <span>{formatCount(video.likeCount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare size={11} />
                        <span>{formatCount(video.commentCount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center opacity-50">
              <Youtube size={32} className="mx-auto mb-2 text-zinc-500" />
              <p className="text-xs text-zinc-400">No synced video highlights found on this channel.</p>
            </div>
          )}
        </div>

        {/* Other Channels horizontal list stretching full-width at the bottom */}
        {creator.otherChannels && creator.otherChannels.length > 0 && (
          <div className={`mt-6 p-6 rounded-3xl border space-y-4 ${
            isDarkMode ? 'bg-[#111111]/10 border-zinc-900' : 'bg-white border-zinc-200'
          }`}>
            <h3 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Other Channels by this Creator
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {creator.otherChannels.map((ch) => (
                <div 
                  key={ch.channelId}
                  onClick={() => navigate(`/channel/${ch.channelId}`)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
                    isDarkMode 
                      ? 'bg-zinc-950/30 border-zinc-900 hover:bg-zinc-950/60 hover:border-zinc-800' 
                      : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <img 
                    src={resolveImg(ch.thumbnailUrl) || defaultProfile} 
                    alt={ch.channelName} 
                    className="w-10 h-10 rounded-lg object-cover shrink-0" 
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      {ch.channelName}
                    </h3>
                    <p className="text-[9px] font-semibold text-zinc-550 mt-0.5">
                      {formatCount(ch.subscriberCount)} Subscribers
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
