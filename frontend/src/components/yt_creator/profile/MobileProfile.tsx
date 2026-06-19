import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Youtube, Camera, Settings, Plus, BarChart3, Briefcase, Users2, Edit3, 
  Lock, PlaySquare, LayoutGrid, CheckCircle2, Globe, 
  Trash2, ChevronRight, AlertCircle, Play, Image as ImageIcon, Check
} from 'lucide-react';
import { selectUser, updateUser } from '../../../store/slices/authSlice';
import { api } from '../../../api/client';
import SILVER_BTN from '../../../assets/playbuttons/silverbtn.png';
import GOLD_BTN from '../../../assets/playbuttons/goldenbtn.png';
import DIAMOND_BTN from '../../../assets/playbuttons/diamondbtn.png';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=400';

export const MobileProfile = () => {
  const user = useSelector(selectUser) as any;
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('yt_posts');
  const [showBannerMenu, setShowBannerMenu] = useState(false);

  const selectedBanner = user?.coverBanner || null;

  const handleBannerChange = async (bannerUrl: string | null) => {
    const previousBanner = user?.coverBanner || null;
    try {
      // 1. Optimistic Update in Redux
      dispatch(updateUser({ coverBanner: bannerUrl }));
      
      // 2. Persist in DB
      await api.put('/user/me/cover-banner', { bannerUrl });
    } catch (err) {
      console.error('Failed to update cover banner:', err);
      // Revert on error
      dispatch(updateUser({ coverBanner: previousBanner }));
    }
  };

  const TABS = [
    { id: 'yt_posts', label: 'YT Posts', icon: Youtube },
    { id: 'posts',    label: 'Posts',    icon: LayoutGrid },
    { id: 'reels',    label: 'Reels',    icon: PlaySquare },
  ];

  if (!user) return null;

  const youtubeProfiles = user.youtubeProfile || [];
  const primaryChannel = youtubeProfiles.find((p: any) => p.channel_name) || youtubeProfiles[0] || {} as any;
  
  const availableBanners = youtubeProfiles
    .filter((p: any) => p.banner_url)
    .map((p: any) => ({ id: p.channelId || p.channel_name, name: p.channel_name, url: p.banner_url }));
  
  const totalVideos = youtubeProfiles.reduce((acc: number, p: any) => acc + (p.video_count || 0), 0);
  
  const displayName = user.name || primaryChannel.channel_name || 'YouTube Creator';
  
  const allRoles = Array.from(new Set(
    youtubeProfiles
      .map((p: any) => p.subCategoryName)
      .filter(Boolean)
  )) as string[];

  const formatCount = (num?: number | string) => {
    if (!num) return '0';
    const n = Number(num);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const milestones = [
    { label: 'Silver', count: 100, img: SILVER_BTN },
    { label: 'Gold', count: 1000, img: GOLD_BTN },
    { label: 'Diamond', count: 10000, img: DIAMOND_BTN },
  ];

  // Use top-level youtubeVideos from auth response which has resolved thumbnails
  const allVideos = user.youtubeVideos || [];

  return (
    <div className="flex lg:hidden w-full flex-col min-h-screen bg-page pb-24 font-sans text-text-main">
      {/* 1. Top Banner Wrapper - allows absolute popover to float above and not get clipped */}
      <div 
        className="relative w-full"
        onMouseLeave={() => setShowBannerMenu(false)}
      >
        <div className="relative w-full h-[100px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF0000] via-[#990000] to-black" />
          
          {/* Animated Custom Banner Overlay */}
          <AnimatePresence>
            {selectedBanner && (
              <motion.img 
                key={selectedBanner}
                src={selectedBanner}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!selectedBanner && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 0.2 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Youtube size={64} className="text-white/30" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Edit Cover Overlay & Button (Mobile keeps it visible or semi-visible) - Moved outside overflow-hidden */}
        {availableBanners.length > 0 && (
          <>
            <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 z-10 pointer-events-none ${showBannerMenu ? 'opacity-100' : 'opacity-0'}`} />
            
            <div className="absolute top-3 right-3 z-30 flex flex-col items-end">
              <button 
                onClick={() => setShowBannerMenu(!showBannerMenu)}
                className="bg-black/50 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg active:scale-95"
              >
                <ImageIcon size={12} />
                Edit Cover
              </button>

              {/* Banner Selection Popover */}
              <AnimatePresence>
                {showBannerMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 w-44 bg-[#121212]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-0.5 z-30"
                  >
                    <div className="px-2.5 py-1 border-b border-white/10 flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Select Cover</span>
                    </div>

                    <button 
                      onClick={() => { handleBannerChange(null); setShowBannerMenu(false); }}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors text-left ${!selectedBanner ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FF0000] to-black border border-white/20 flex-shrink-0" />
                      <span className="text-[9px] font-bold flex-1">Default</span>
                      {!selectedBanner && <Check size={8} className="text-[#FF0000] flex-shrink-0" />}
                    </button>
                    
                    {availableBanners.map((b: any) => (
                      <button 
                        key={b.id}
                        onClick={() => { handleBannerChange(b.url); setShowBannerMenu(false); }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors text-left ${selectedBanner === b.url ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
                      >
                        <img src={b.url} alt={b.name} className="w-5 h-5 rounded-full object-cover border border-white/20 flex-shrink-0" />
                        <span className="text-[9px] font-bold flex-1 line-clamp-1">{b.name}</span>
                        {selectedBanner === b.url && <Check size={8} className="text-[#FF0000] flex-shrink-0" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* 2. Profile Wrap */}
      <div className="px-4 relative bg-page rounded-t-[24px] -mt-6 pt-4 pb-6 z-10">
        
        {/* Avatar & Stats Row */}
        <div className="flex items-start justify-between">
          <div className="relative -mt-12 group">
            <div className="w-24 h-24 rounded-full border-4 border-page bg-page overflow-hidden shadow-xl">
              <img 
                src={user.profilePicture || DEFAULT_AVATAR} 
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#FF3040] rounded-full border-2 border-page flex items-center justify-center shadow-lg active:scale-95">
              <Camera size={12} className="text-white" />
            </button>
          </div>

          <div className="flex flex-col flex-1 ml-4 mt-2">
            <div className="flex justify-around items-center w-full mb-3">
              <div className="flex flex-col items-center">
                <span className="text-sm font-black text-text-main">{formatCount(user.followers)}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-black text-text-main">{formatCount(user.following)}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase">Following</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm font-black text-text-main">{formatCount(totalVideos)}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase">Posts</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex-1 h-8 rounded-lg bg-border-secondary border border-border-main text-text-main text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95">
                <Settings size={12} />
                Settings
              </button>
              <button className="flex-1 h-8 rounded-lg bg-[#FF3040] text-text-main text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95">
                <Plus size={14} />
                Add Story
              </button>
            </div>

            {/* Toolbox */}
            <div className="flex items-center gap-1 mt-2">
              <button className="flex-1 h-8 rounded-md bg-border-secondary flex items-center justify-center gap-1 border border-border-main/50">
                <BarChart3 size={10} className="text-red-500" />
                <span className="text-[9px] font-bold text-text-main">Analytics</span>
              </button>
              <button className="flex-1 h-8 rounded-md bg-border-secondary flex items-center justify-center gap-1 border border-border-main/50">
                <Briefcase size={10} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-text-main">Deals</span>
              </button>
              <button className="flex-1 h-8 rounded-md bg-border-secondary flex items-center justify-center gap-1 border border-border-main/50">
                <Users2 size={10} className="text-blue-500" />
                <span className="text-[9px] font-bold text-text-main">Community</span>
              </button>
            </div>
          </div>
        </div>

        {/* Info Block */}
        <div className="mt-4">
          <div className="flex items-center gap-1">
            <h1 className="text-[15px] font-bold text-text-main">{displayName}</h1>
            <CheckCircle2 size={14} className="text-[#FF3040] fill-[#FF3040]/20" />
          </div>

          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {allRoles.length > 0 ? allRoles.map((role, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-border-secondary border border-border-main text-[9px] font-bold text-text-muted uppercase">
                {role}
              </span>
            )) : (
              <span className="px-2 py-0.5 rounded border border-dashed border-border-main text-[9px] font-bold text-text-dim uppercase">
                SELECT NICHE
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-2">
            <Globe size={10} className="text-text-dim" />
            <span className="text-[10px] font-bold text-text-dim uppercase">GLOBAL</span>
          </div>

          <div className="mt-2.5 flex items-start gap-2">
            {user.bio ? (
              <>
                <p className="flex-1 text-[12px] text-text-muted leading-relaxed font-medium">
                  {user.bio}
                </p>
                <button className="text-text-dim mt-0.5">
                  <Edit3 size={12} />
                </button>
              </>
            ) : (
              <button className="flex items-center gap-1.5 text-[#FF3040] text-[11px] font-bold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                <Edit3 size={12} />
                Add profile bio
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Milestones */}
      <div className="border-t border-border-main/50 pt-4 pb-2">
        <h3 className="text-[10px] font-black text-text-dim uppercase tracking-widest px-4 mb-3">YT Creator Milestones</h3>
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide">
          
          <button className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="w-[72px] h-[72px] rounded-2xl bg-container flex items-center justify-center border border-border-main shadow-lg active:scale-95 transition-transform">
              <Plus size={24} className="text-text-main" />
            </div>
            <span className="text-[10px] font-bold text-text-main">Add Post</span>
            <span className="text-[8px] font-black text-[#FF3040] uppercase">Share Now</span>
          </button>

          {milestones.map((m, i) => {
            const unlockedChannels = youtubeProfiles.filter((p: any) => (p.subscriber_count || 0) >= m.count).length;
            const isUnlocked = unlockedChannels > 0;

            return (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className={`relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center border transition-all duration-300 ${isUnlocked ? 'bg-card border-border-main shadow-md' : 'bg-container border-border-secondary border-dashed shadow-inner'}`}>
                  <img src={m.img} alt={m.label} className={`w-10 h-10 object-contain transition-transform duration-300 ${!isUnlocked ? 'opacity-50 grayscale contrast-125 mix-blend-luminosity' : 'drop-shadow-lg'}`} />
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                        <Lock size={12} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-center space-y-0.5">
                  <span className={`block text-[11px] font-black uppercase tracking-wider ${isUnlocked ? 'text-text-main' : 'text-text-muted'}`}>{m.label}</span>
                  <span className={`block text-[8px] font-bold uppercase tracking-widest ${isUnlocked ? 'text-emerald-500' : 'text-text-dim'}`}>
                    {isUnlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Linked Channels */}
      <div className="px-4 py-4 border-t border-border-main/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[12px] font-bold text-text-main">Linked Channels ({youtubeProfiles.length})</h3>
          <button className="flex items-center gap-1 bg-border-secondary px-2.5 py-1.5 rounded-lg border border-[#FF3040]/30 active:scale-95">
            <Plus size={12} className="text-[#FF3040]" />
            <span className="text-[10px] font-bold text-[#FF3040]">Add Another</span>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {youtubeProfiles.length > 0 ? youtubeProfiles.map((channel: any, i: number) => (
            <div key={channel.id || i} className="bg-border-secondary rounded-xl p-3 border border-border-main">
              <div className="flex items-center gap-3">
                <img src={channel.thumbnail_url || DEFAULT_AVATAR} alt={channel.channel_name} className="w-12 h-12 rounded-full bg-page object-cover border border-border-main" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-text-main line-clamp-1">{channel.channel_name}</span>
                    {i === 0 && (
                      <span className="bg-[#FF3040]/10 text-[#FF3040] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border border-[#FF3040]/20">Primary</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1">
                      <Users2 size={10} className="text-red-500" />
                      <span className="text-[10px] font-bold text-white/60">{formatCount(channel.subscriber_count)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Youtube size={10} className="text-blue-500" />
                      <span className="text-[10px] font-bold text-white/60">{formatCount(channel.view_count || 0)}</span>
                    </div>
                  </div>
                  <div className="mt-1.5">
                    {channel.subCategoryName ? (
                      <span className="text-[9px] font-bold text-[#FF3040] uppercase">{channel.subCategoryName}</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <AlertCircle size={8} className="text-yellow-500" />
                        <span className="text-[9px] font-bold text-yellow-500">NICHE NOT SET</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-main/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-red-500" />
                  <button className="p-1 active:scale-90">
                    <Trash2 size={14} className="text-text-dim hover:text-red-500 transition-colors" />
                  </button>
                </div>
                <button className="flex items-center gap-0.5 active:opacity-70">
                  <span className="text-[10px] font-bold text-[#FF3040]">Analytics</span>
                  <ChevronRight size={12} className="text-[#FF3040]" />
                </button>
              </div>
            </div>
          )) : (
            <div className="bg-border-secondary rounded-xl p-6 border border-border-main text-center border-dashed">
              <p className="text-xs font-medium text-text-dim">No channels linked yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Tabs & Feed */}
      <div className="mt-2 border-t border-border-main/50 pt-2">
        <div className="flex items-center justify-around">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1.5 py-3 flex-1 relative ${activeTab === tab.id ? 'text-red-500' : 'text-text-dim'}`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-red-500' : 'text-text-dim'} />
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="pt-4 px-4 pb-8">
          {activeTab === 'yt_posts' && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-[#FF0000] rounded-full" />
                  <span className="text-[11px] font-black text-text-main uppercase tracking-widest">Featured</span>
                  {allVideos.length > 0 && (
                    <span className="bg-[#FF0000]/10 text-[#FF0000] text-[8px] font-black px-1.5 py-0.5 rounded border border-[#FF0000]/20">TOP {Math.min(allVideos.length, 10)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Swipe</span>
                  <ChevronRight size={10} className="text-[#FF3040]" />
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                {allVideos.length > 0 ? allVideos.slice(0, 10).map((video: any, idx: number) => (
                  <div key={video.id} className="flex-shrink-0 w-[260px] bg-border-secondary rounded-xl overflow-hidden border border-border-main">
                    <div className="relative aspect-video bg-page">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      
                      <div className="absolute top-2 left-2 bg-[#FF0000] text-text-main text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest">
                        NEW
                      </div>
                      
                      <div className="absolute top-2 right-2 bg-black/60 text-text-main text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                        #{idx + 1}
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-border-main">
                          <Play size={16} className="text-text-main fill-white ml-1" />
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                        <span className="text-[9px] font-bold text-white/90">
                          {new Date(video.published_at || video.publishedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="text-[12px] font-bold text-text-main leading-snug line-clamp-2 mb-1">{video.title}</h4>
                      {video.description && (
                        <p className="text-[10px] text-text-muted line-clamp-2 mb-2 leading-snug">
                          {video.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <img src={primaryChannel.thumbnail_url || DEFAULT_AVATAR} className="w-5 h-5 rounded-full object-cover border border-border-main" />
                        <span className="text-[10px] font-bold text-text-dim">{primaryChannel.channel_name || 'Creator'}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="w-full py-10 flex items-center justify-center border border-dashed border-border-main rounded-2xl">
                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest">No featured videos</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'posts' && (
            <div className="text-center py-10 border border-dashed border-border-main rounded-xl">
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Posts grid coming soon</p>
            </div>
          )}
          {activeTab === 'reels' && (
            <div className="text-center py-10 border border-dashed border-border-main rounded-xl">
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Reels feed coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
