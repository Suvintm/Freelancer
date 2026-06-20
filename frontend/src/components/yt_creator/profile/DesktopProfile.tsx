import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { Youtube, Camera, Settings, Plus, BarChart3, Briefcase, Users2, Edit3, Lock, PlaySquare, LayoutGrid, Image as ImageIcon, Check } from 'lucide-react';
import { selectUser, updateUser } from '../../../store/slices/authSlice';
import { api } from '../../../api/client';
import SILVER_BTN from '../../../assets/playbuttons/silverbtn.png';
import GOLD_BTN from '../../../assets/playbuttons/goldenbtn.png';
import DIAMOND_BTN from '../../../assets/playbuttons/diamondbtn.png';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=400';

/**
 * DesktopProfile (YT Creator)
 * Desktop only view for the YT Creator Profile
 */
export const DesktopProfile = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('yt_posts');
  const [showBannerMenu, setShowBannerMenu] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || '');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const bioRef = useRef<HTMLDivElement>(null);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  useEffect(() => {
    if (!isBioExpanded) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (bioRef.current && !bioRef.current.contains(event.target as Node)) {
        setIsBioExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBioExpanded]);

  const maxChars = 75;
  const needsTruncation = user?.bio && (user.bio.length > maxChars || user.bio.includes('\n'));
  
  const displayBio = () => {
    if (!user?.bio) return '';
    if (isBioExpanded || !needsTruncation) return user.bio;
    
    const newlineIdx = user.bio.indexOf('\n');
    let limit = maxChars;
    if (newlineIdx !== -1 && newlineIdx < maxChars) {
      limit = newlineIdx;
    }
    
    return user.bio.substring(0, limit) + '...';
  };

  const startEditingBio = () => {
    setBioText(user?.bio || '');
    setIsEditingBio(true);
  };

  const handleSaveBio = async () => {
    setIsSavingBio(true);
    try {
      const response = await api.patch('/user/me', { bio: bioText });
      if (response.data?.success) {
        dispatch(updateUser({ bio: response.data.user.bio }));
        setIsEditingBio(false);
      }
    } catch (err) {
      console.error('Failed to save bio:', err);
    } finally {
      setIsSavingBio(false);
    }
  };

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
  const primaryChannel = youtubeProfiles.find((p) => p.channel_name) || youtubeProfiles[0] || { channel_name: '', thumbnail_url: '' };
  
  const availableBanners = youtubeProfiles
    .filter((p) => p.banner_url)
    .map((p) => ({ id: p.channelId || p.channel_name, name: p.channel_name, url: p.banner_url || '' }));
  
  const totalVideos = youtubeProfiles.reduce((acc: number, p) => acc + (p.video_count || 0), 0);
  
  const displayName = user.name || primaryChannel.channel_name || 'YouTube Creator';
  const username = user.username ? `@${user.username}` : '@creator';

  const formatCount = (num?: number | string) => {
    if (!num) return '0';
    const n = Number(num);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const milestones = [
    { label: 'Silver', count: 100000, img: SILVER_BTN },
    { label: 'Gold', count: 1000000, img: GOLD_BTN },
    { label: 'Diamond', count: 10000000, img: DIAMOND_BTN },
  ];

  // Use top-level youtubeVideos from auth response which has resolved thumbnails
  const allVideos = user.youtubeVideos || [];

  return (
    <div className="hidden lg:flex w-full flex-col min-h-full pb-20">
      {/* 1. Top Banner Wrapper - allows absolute popover to float above and not get clipped */}
      <div 
        className="relative w-full"
        onMouseLeave={() => setShowBannerMenu(false)}
      >
        {/* Aspect Ratio Banner Image container with rounded corners & overflow hidden */}
        <div className="relative w-full aspect-[21/5] xl:aspect-[21/4] rounded-t-[32px] overflow-hidden">
          {/* Dynamic Gradient Background */}
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

          {/* Subtle Noise/Texture */}
          <div 
            className="absolute inset-0 opacity-[0.05]" 
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
          />

          {/* Floating YouTube Icon */}
          <AnimatePresence>
            {!selectedBanner && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 0.1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Youtube size={80} strokeWidth={1} className="text-white/30" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Edit Cover Overlay & Button - Placed outside overflow-hidden banner */}
        {availableBanners.length > 0 && (
          <>
            <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 z-10 rounded-t-[32px] pointer-events-none ${showBannerMenu ? 'opacity-100' : 'opacity-0'}`} />
            
            <div className="absolute top-4 right-4 z-30 flex flex-col items-end">
              <button 
                onClick={() => setShowBannerMenu(!showBannerMenu)}
                className="bg-black/50 hover:bg-black/75 transition-all duration-300 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg"
              >
                <ImageIcon size={14} />
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
                    className="mt-2 w-64 bg-[#121212]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 z-30"
                  >
                    <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Select Cover</span>
                    </div>

                    <button 
                      onClick={() => { handleBannerChange(null); setShowBannerMenu(false); }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left ${!selectedBanner ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF0000] to-black border border-white/20 flex-shrink-0" />
                      <span className="text-xs font-bold flex-1">SuviX Default</span>
                      {!selectedBanner && <Check size={12} className="text-[#FF0000] flex-shrink-0" />}
                    </button>
                    
                    {availableBanners.map((b) => (
                      <button 
                        key={b.id}
                        onClick={() => { handleBannerChange(b.url); setShowBannerMenu(false); }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left ${selectedBanner === b.url ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
                      >
                        <img src={b.url} alt={b.name} className="w-8 h-8 rounded-lg object-cover border border-white/20 flex-shrink-0" />
                        <span className="text-xs font-bold flex-1 line-clamp-1">{b.name}</span>
                        {selectedBanner === b.url && <Check size={12} className="text-[#FF0000] flex-shrink-0" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Stats on Banner - TIGHTER */}
        <div className="absolute bottom-6 right-10 flex items-center gap-8">
          <div className="text-center space-y-0">
            <p className="text-xl xl:text-2xl font-black text-white tracking-tighter leading-none">{formatCount(user.followers)}</p>
            <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">Followers</p>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="text-center space-y-0">
            <p className="text-xl xl:text-2xl font-black text-white tracking-tighter leading-none">{formatCount(user.following)}</p>
            <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">Following</p>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="text-center space-y-0">
            <p className="text-xl xl:text-2xl font-black text-white tracking-tighter leading-none">{formatCount(totalVideos)}</p>
            <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">Posts</p>
          </div>
        </div>
      </div>

      <div className="px-8 relative z-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between w-full">
            {/* Left Column: Avatar, Identity and Bio */}
            <div className="flex flex-col gap-4 min-w-0 max-w-[50%]">
              {/* Profile Avatar & Identity Block - Next to each other, aligned to the bottom to avoid banner overlap */}
              <div className="flex items-end gap-4 -mt-14">
                <div className="relative group shrink-0">
                  <div className="w-28 h-28 xl:w-32 xl:h-32 rounded-full border-[5px] border-page bg-page overflow-hidden shadow-xl ring-1 ring-border-main">
                    <img 
                      src={user.profilePicture || DEFAULT_AVATAR} 
                      alt="Profile"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  
                  {/* Camera Edit Badge - SMALLER */}
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#FF3040] rounded-full border-[3px] border-page flex items-center justify-center shadow-lg hover:bg-red-600 transition-all active:scale-90">
                    <Camera size={14} className="text-white" />
                  </button>
                </div>

                {/* Identity Block - Beside Avatar, limited letters/words with ellipsis */}
                <div className="space-y-0.5 min-w-0 max-w-[150px] lg:max-w-[180px] xl:max-w-[220px] mb-2">
                   <div className="flex items-center gap-1 min-w-0">
                      <h1 className="text-lg lg:text-xl font-bold text-text-main leading-tight truncate" title={displayName}>
                        {displayName}
                      </h1>
                      {/* Mathematically perfect rosette verified badge in red */}
                      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <title>Verified Creator</title>
                        <path 
                          d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" 
                          fill="#FF3040" 
                        />
                        <path 
                          d="m9 12 2 2 4-4" 
                          stroke="white" 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                      </svg>
                   </div>
                   <p className="text-xs font-medium text-gray-700 truncate" title={username}>{username}</p>
                </div>
              </div>

              {/* Bio - Directly below Avatar & Identity with some gaps, half profile width */}
              <div className="w-full" ref={bioRef}>
                <AnimatePresence mode="wait">
                  {isEditingBio ? (
                    <motion.div 
                      key="edit"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="w-full flex flex-col gap-2"
                    >
                      <textarea
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        maxLength={150}
                        rows={3}
                        disabled={isSavingBio}
                        className="w-full text-[13px] text-gray-700 bg-zinc-950/20 dark:bg-black/40 border border-border-main rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#FF3040]/30 focus:border-[#FF3040]/50 transition-all font-medium resize-none"
                        placeholder="Tell us about yourself..."
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-text-muted font-bold">
                          {bioText.length}/150
                        </span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setIsEditingBio(false)}
                            disabled={isSavingBio}
                            className="h-8 px-4 rounded-xl border border-border-main text-[11px] font-bold hover:bg-border-secondary transition-all disabled:opacity-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleSaveBio}
                            disabled={isSavingBio}
                            className="h-8 px-4 rounded-xl bg-[#FF3040] text-text-main text-[11px] font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            {isSavingBio ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <span>Save</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="view"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="flex items-start gap-2.5 w-full"
                    >
                      <div className="flex-1">
                        {user.bio ? (
                          <p className="text-[13px] text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                            {displayBio()}
                            {needsTruncation && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsBioExpanded(!isBioExpanded);
                                }}
                                className="text-[#FF3040] hover:text-red-600 font-bold ml-1 text-[11px] cursor-pointer inline-block"
                              >
                                {isBioExpanded ? ' less' : ' more'}
                              </button>
                            )}
                          </p>
                        ) : (
                          <p className="text-[13px] text-gray-500 leading-relaxed font-medium italic whitespace-pre-wrap">
                            No bio added yet.
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={startEditingBio}
                        className="text-gray-500 hover:text-text-main transition-colors mt-0.5 shrink-0 cursor-pointer"
                      >
                        <Edit3 size={13} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: Actions & Toolbox - COMPACT */}
            <div className="flex flex-col items-end gap-2 mt-3 shrink-0">
              <div className="flex items-center gap-2">
                <button className="h-9 px-5 rounded-xl bg-border-secondary border border-border-main-black text-text-main text-[12px] font-bold hover:bg-border-main transition-all flex items-center gap-2 active:scale-95">
                  <Settings size={14} />
                  <span>Settings</span>
                </button>
                <button className="h-9 px-5 rounded-xl bg-[#FF3040] text-text-main text-[12px] font-bold hover:bg-red-600 transition-all flex items-center gap-2 shadow-md active:scale-95">
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Add Story</span>
                </button>
              </div>

              {/* Toolbox Row - SHRUNK */}
              <div className="flex items-center border border-black/50 rounded-lg gap-1.5 w-64">
                {[
                  { label: 'Analytics', icon: BarChart3, color: 'text-text-main', bg: 'bg-container hover:bg-border-secondary' },
                  { label: 'Deals',     icon: Briefcase, color: 'text-text-main', bg: 'bg-container hover:bg-border-secondary' },
                  { label: 'Collab',    icon: Users2,    color: 'text-text-main', bg: 'bg-container hover:bg-border-secondary' },
                ].map((tool) => (
                  <button
                    key={tool.label}
                    className={`flex-1 h-10 flex flex-col items-center justify-center gap-0.5 px-3 rounded-lg ${tool.bg} border border-border-main hover:border-border-secondary transition-colors`}
                  >
                    <tool.icon size={12} className={tool.color} />
                    <span className="text-[8px] font-black text-text-muted uppercase tracking-tighter opacity-70">{tool.label}</span>
                  </button>
                ))}
              </div>

              {/* Milestones Play Buttons - Positioned right below actions/toolbox */}
              <div className="flex gap-3 justify-end mt-1.5">
                {milestones.map((m, i) => {
                  const unlockedChannels = youtubeProfiles.filter((p) => (p.subscriber_count || 0) >= m.count).length;
                  const isUnlocked = unlockedChannels > 0;
                  
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="relative group">
                        {/* Circular Container for Play Button */}
                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center overflow-hidden transition-all duration-300 ${isUnlocked ? 'bg-card border-border-main shadow-md group-hover:border-red-500/50' : 'bg-container border-border-secondary border-dashed shadow-inner'}`} title={`${m.label} Milestone (${formatCount(m.count)} subs)`}>
                          <img 
                            src={m.img} 
                            alt={m.label} 
                            className={`w-6 h-6 object-contain transition-transform duration-300 group-hover:scale-110 ${!isUnlocked ? 'opacity-50 grayscale contrast-125 mix-blend-luminosity' : 'drop-shadow-lg'}`}
                          />
                        </div>
                        
                        {!isUnlocked && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                              <Lock size={7} className="text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-wider ${isUnlocked ? 'text-text-main' : 'text-text-muted'}`}>{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Latest Content Section - Full Width */}
          <div className="mt-5 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] opacity-50">Latest Content</h3>
              <button className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">View All</button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide overscroll-x-contain touch-pan-x">
              {allVideos.length > 0 ? allVideos.slice(0, 10).map((video) => (
                <div key={video.id} className="flex-shrink-0 w-52 group cursor-pointer">
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-2 bg-border-secondary border border-border-secondary">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {video.duration && (
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-bold text-text-main">{video.duration}</div>
                    )}
                  </div>
                  <h4 className="text-[12px] font-bold text-text-main leading-tight line-clamp-1 group-hover:text-red-500 transition-colors">{video.title}</h4>
                  {video.description && (
                    <p className="text-[10px] text-text-muted line-clamp-2 mt-1 leading-snug">
                      {video.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-text-muted">{formatCount(video.viewCount)} views</span>
                    {(video.published_at || video.publishedAt) && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border-main" />
                        <span className="text-[10px] font-bold text-text-muted">
                          {new Date((video.published_at || video.publishedAt)!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )) : (
                <div className="w-full py-10 flex items-center justify-center border border-dashed border-border-main rounded-2xl">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">No recent videos found</p>
                </div>
              )}
            </div>
          </div>

          {/* 4. Content Tabs - EXTREMELY TIGHT TOP MARGIN */}
          <div className="mt-2 border-b border-border-main/50">
            <div className="flex items-center gap-10">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative pb-4 flex items-center gap-2.5 transition-all duration-300 ${activeTab === tab.id ? 'text-red-500' : 'text-text-muted hover:text-text-main'}`}
                >
                  <tab.icon size={18} className={activeTab === tab.id ? 'text-red-500' : 'text-text-muted'} />
                  <span className="text-[13px] font-black uppercase tracking-widest">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="py-6">
            {/* Reels Tab - Vertical Grid (Instagram Style) */}
            {activeTab === 'reels' && (
              <div className="w-full py-20 flex items-center justify-center border border-dashed border-border-main rounded-2xl">
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Reels feed coming soon</p>
              </div>
            )}

            {/* Posts Tab - Square Grid (Instagram Style) */}
            {activeTab === 'posts' && (
              <div className="w-full py-20 flex items-center justify-center border border-dashed border-border-main rounded-2xl">
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Posts grid coming soon</p>
              </div>
            )}

            {/* YT Posts Feed */}
            {activeTab === 'yt_posts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allVideos.length > 0 ? allVideos.map((post) => (
                  <div key={post.id} className="group cursor-pointer">
                    {/* Video Thumbnail Container */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-border-secondary border border-border-secondary mb-3">
                      <img 
                        src={post.thumbnail} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      
                      {/* Play Icon on Hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/50">
                          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                        </div>
                      </div>

                      {/* Duration Badge */}
                      {post.duration && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md border border-border-main text-[10px] font-bold text-text-main tracking-tight">
                          {post.duration}
                        </div>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="px-1">
                      <h3 className="text-[14px] font-bold text-text-main leading-snug line-clamp-2 group-hover:text-red-500 transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-bold text-text-muted">{formatCount(post.viewCount)} views</span>
                        {(post.published_at || post.publishedAt) && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-border-main" />
                            <span className="text-[11px] font-bold text-text-muted">
                              {new Date((post.published_at || post.publishedAt)!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 py-20 flex items-center justify-center border border-dashed border-border-main rounded-2xl">
                    <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No YouTube posts available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

