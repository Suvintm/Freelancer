import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { Youtube, Camera, Settings, Plus, BarChart3, Briefcase, Users2, Edit3, Lock, PlaySquare, LayoutGrid, Image as ImageIcon, Check, Trash2, X, Heart, MessageCircle, Play, Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import { selectUser, updateUser } from '../../../store/slices/authSlice';
import { api } from '../../../api/client';
import { useTheme } from '../../../hooks/useTheme';
import SILVER_BTN from '../../../assets/playbuttons/silverbtn.png';
import GOLD_BTN from '../../../assets/playbuttons/goldenbtn.png';
import DIAMOND_BTN from '../../../assets/playbuttons/diamondbtn.png';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=400';

/**
 * DesktopProfile (YT Creator)
 * Desktop only view for the YT Creator Profile
 */
interface FeedItem {
  _id: string;
  id?: string | number;
  user: string;
  type: 'reel' | 'post' | 'yt_video' | 'thumbnail_vote';
  img: string;
  images?: string[];
  comment?: string;
  votes?: number[];
  likes?: string | number;
  createdAt: string;
  videoUrl?: string;
  commentsCount?: number;
  location?: string;
  tags?: string[];
}

export const DesktopProfile = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('yt_posts');
  const [reels, setReels] = useState<FeedItem[]>([]);
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [ytVideos, setYtVideos] = useState<FeedItem[]>([]);
  const [thumbnailVotes, setThumbnailVotes] = useState<FeedItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<FeedItem | null>(null);

  useEffect(() => {
    let active = true;
    const fetchFeed = async () => {
      // Force execution to be asynchronous to avoid React cascading render warnings
      await Promise.resolve();
      if (!active || !user?.username) return;
      setIsLoadingFeed(true);
      try {
        const response = await api.get('/temp-feed');
        if (response.data.success && active) {
          const creatorFeed = response.data.data.filter(
            (item: FeedItem) => item.user === user.username
          );
          setReels(creatorFeed.filter((item: FeedItem) => item.type === 'reel'));
          setPosts(creatorFeed.filter((item: FeedItem) => item.type === 'post'));
          setYtVideos(creatorFeed.filter((item: FeedItem) => item.type === 'yt_video'));
          setThumbnailVotes(creatorFeed.filter((item: FeedItem) => item.type === 'thumbnail_vote'));
        }
      } catch (err) {
        console.error('Failed to fetch temp feed for profile:', err);
      } finally {
        if (active) {
          setIsLoadingFeed(false);
        }
      }
    };

    fetchFeed();
    return () => {
      active = false;
    };
  }, [user?.username]);

  const handleDeleteItem = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await api.delete(`/temp-feed/${id}`);
      if (response.data.success) {
        setReels((prev) => prev.filter((item) => item._id !== id));
        setPosts((prev) => prev.filter((item) => item._id !== id));
        setYtVideos((prev) => prev.filter((item) => item._id !== id));
        setThumbnailVotes((prev) => prev.filter((item) => item._id !== id));
        if (selectedMedia?._id === id) {
          setSelectedMedia(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete feed item:', err);
      alert('Error deleting item');
    }
  };
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
    { id: 'yt_videos', label: 'YT Videos', icon: Play },
    { id: 'posts',    label: 'Posts',    icon: LayoutGrid },
    { id: 'reels',    label: 'Reels',    icon: PlaySquare },
    { id: 'thumbnail_vote', label: 'Thumbnails', icon: ImageIcon },
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
                  <div className="flex items-center justify-between mt-2.5 text-[10.5px] font-semibold text-text-muted border-t border-white/5 pt-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5" title="Views">
                        <Eye size={12} className="text-zinc-500" />
                        {formatCount(video.view_count || video.viewCount)}
                      </span>
                      <span className="flex items-center gap-1.5" title="Likes">
                        <ThumbsUp size={11} className="text-zinc-500" />
                        {formatCount(video.like_count)}
                      </span>
                      <span className="flex items-center gap-1.5" title="Comments">
                        <MessageSquare size={11} className="text-zinc-500" />
                        {formatCount(video.comment_count)}
                      </span>
                    </div>
                    {(video.published_at || video.publishedAt) && (
                      <span className="text-[10px] text-zinc-500">
                        {new Date((video.published_at || video.publishedAt)!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
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
              isLoadingFeed ? (
                <div className="w-full py-20 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : reels.length > 0 ? (
                <div className="grid grid-cols-3 gap-6">
                  {reels.map((reel) => (
                    <div 
                      key={reel._id} 
                      onClick={() => setSelectedMedia(reel)}
                      className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-border-secondary border border-border-secondary cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <video 
                        src={reel.videoUrl} 
                        preload="metadata" 
                        className="w-full h-full object-cover"
                      />
                      {/* Hover Info Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                        <div className="flex justify-end">
                          <button 
                            onClick={(e) => handleDeleteItem(reel._id, e)}
                            className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex flex-col gap-1.5 text-white">
                          <p className="text-xs font-bold line-clamp-2 leading-snug">{reel.comment}</p>
                          <div className="flex items-center gap-4 text-xs font-black">
                            <span className="flex items-center gap-1"><Heart size={14} fill="white" /> {reel.likes || 0}</span>
                            <span className="flex items-center gap-1"><MessageCircle size={14} fill="white" /> {reel.commentsCount || 0}</span>
                          </div>
                        </div>
                      </div>
                      {/* Play Icon overlay (default state) */}
                      <div className="absolute bottom-4 left-4 p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white group-hover:scale-110 transition-transform duration-300">
                        <PlaySquare size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full py-20 flex flex-col items-center justify-center border border-dashed border-border-main rounded-2xl">
                  <PlaySquare size={32} className="text-text-muted mb-2" />
                  <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No reels uploaded yet</p>
                </div>
              )
            )}

            {/* YT Videos Tab - Landscape Video Grid (YouTube Style) */}
            {activeTab === 'yt_videos' && (
              isLoadingFeed ? (
                <div className="w-full py-20 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : ytVideos.length > 0 ? (
                <div className="grid grid-cols-3 gap-6">
                  {ytVideos.map((video) => (
                    <div 
                      key={video._id} 
                      onClick={() => setSelectedMedia(video)}
                      className="group relative aspect-video rounded-2xl overflow-hidden bg-border-secondary border border-border-secondary cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <video 
                        src={video.videoUrl} 
                        preload="metadata" 
                        className="w-full h-full object-cover"
                      />
                      {/* Hover Info Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                        <div className="flex justify-end">
                          <button 
                            onClick={(e) => handleDeleteItem(video._id, e)}
                            className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex flex-col gap-1.5 text-white">
                          <p className="text-xs font-bold line-clamp-2 leading-snug">{video.comment}</p>
                          <div className="flex items-center gap-4 text-xs font-black">
                            <span className="flex items-center gap-1"><Heart size={14} fill="white" /> {video.likes || 0}</span>
                            <span className="flex items-center gap-1"><MessageCircle size={14} fill="white" /> {video.commentsCount || 0}</span>
                          </div>
                        </div>
                      </div>
                      {/* Play Icon overlay (default state) */}
                      <div className="absolute bottom-4 left-4 p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white group-hover:scale-110 transition-transform duration-300">
                        <Play size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full py-20 flex flex-col items-center justify-center border border-dashed border-border-main rounded-2xl">
                  <Play size={32} className="text-text-muted mb-2" />
                  <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No platform videos uploaded yet</p>
                </div>
              )
            )}

            {/* Posts Tab - Square Grid (Instagram Style) */}
            {activeTab === 'posts' && (
              isLoadingFeed ? (
                <div className="w-full py-20 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <div 
                      key={post._id} 
                      onClick={() => setSelectedMedia(post)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-border-secondary border border-border-secondary cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <img 
                        src={post.images?.[0]} 
                        alt={post.comment} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Multi-Image indicator badge */}
                      {post.images && post.images.length > 1 && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 p-1.5 rounded-lg text-white">
                          <LayoutGrid size={14} />
                        </div>
                      )}
                      {/* Hover Info Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                        <div className="flex justify-end">
                          <button 
                            onClick={(e) => handleDeleteItem(post._id, e)}
                            className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex flex-col gap-1.5 text-white">
                          <p className="text-xs font-bold line-clamp-2 leading-snug">{post.comment}</p>
                          <div className="flex items-center gap-4 text-xs font-black">
                            <span className="flex items-center gap-1"><Heart size={14} fill="white" /> {post.likes || 0}</span>
                            <span className="flex items-center gap-1"><MessageCircle size={14} fill="white" /> {post.commentsCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full py-20 flex flex-col items-center justify-center border border-dashed border-border-main rounded-2xl">
                  <LayoutGrid size={32} className="text-text-muted mb-2" />
                  <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No posts uploaded yet</p>
                </div>
              )
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
                      <div className="flex items-center justify-between mt-3 text-[11px] font-semibold text-text-muted border-t border-white/5 pt-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5" title="Views">
                            <Eye size={12} className="text-zinc-500" />
                            {formatCount(post.view_count || post.viewCount)}
                          </span>
                          <span className="flex items-center gap-1.5" title="Likes">
                            <ThumbsUp size={11} className="text-zinc-500" />
                            {formatCount(post.like_count)}
                          </span>
                          <span className="flex items-center gap-1.5" title="Comments">
                            <MessageSquare size={11} className="text-zinc-500" />
                            {formatCount(post.comment_count)}
                          </span>
                        </div>
                        {(post.published_at || post.publishedAt) && (
                          <span className="text-[10px] text-zinc-500">
                            {new Date((post.published_at || post.publishedAt)!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
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

            {/* Thumbnails Tab - Dynamic Poll results */}
            {activeTab === 'thumbnail_vote' && (
              isLoadingFeed ? (
                <div className="w-full py-20 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : thumbnailVotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {thumbnailVotes.map((item) => {
                    const images = item.images || [];
                    const votes = item.votes || new Array(images.length).fill(0);
                    const totalVotes = votes.reduce((a: number, b: number) => a + b, 0);

                    return (
                      <div 
                        key={item._id}
                        className={`border rounded-3xl p-4 flex flex-col justify-between transition-all ${
                          isDarkMode ? 'bg-[#0a0a0a] border-border-main' : 'bg-white border-zinc-200 shadow-sm'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold text-text-muted">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={(e) => handleDeleteItem(item._id, e)}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors"
                            title="Delete Thumbnail Vote"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Caption */}
                        <p className="text-xs font-semibold text-text-main line-clamp-2 mb-4">
                          {item.comment || "Thumbnail Choice Vote"}
                        </p>

                        {/* Thumbnail Grid with Stats */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {images.map((img: string, idx: number) => {
                            const voteCount = votes[idx] || 0;
                            const percentage = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
                            const isWinner = totalVotes > 0 && voteCount === Math.max(...votes);

                            return (
                              <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/5">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                                {/* Overlay Vote Results */}
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-1">
                                  <span className="text-white font-extrabold text-[15px]">{percentage}%</span>
                                  <span className="text-[9px] text-zinc-300 font-medium">{voteCount} votes</span>
                                  {isWinner && (
                                    <span className="absolute top-1 right-1 bg-yellow-500 text-black text-[7px] font-black uppercase px-1 rounded">
                                      Winner
                                    </span>
                                  )}
                                </div>
                                {/* Badge */}
                                <span className="absolute top-1 left-1 bg-black/70 px-1 py-0.5 rounded text-[8px] text-white font-bold leading-none">
                                  No. {idx + 1}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Summary Footer */}
                        <div className="border-t border-border-main/50 pt-2 flex items-center justify-between text-[11px] font-bold text-text-muted">
                          <span>Total Votes: {totalVotes}</span>
                          <span className="text-blue-500 uppercase text-[9px] tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-full">
                            Active Poll
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full py-20 flex flex-col items-center justify-center border border-dashed border-border-main rounded-2xl">
                  <ImageIcon size={32} className="text-text-muted mb-2" />
                  <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No thumbnail votes uploaded yet</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Immersive Media Details Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl h-[70vh] bg-page border border-border-main rounded-3xl overflow-hidden shadow-2xl flex"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Left Column: Media Display */}
              <div className="flex-1 bg-black flex items-center justify-center relative select-none">
                {selectedMedia.type === 'reel' ? (
                  <video 
                    src={selectedMedia.videoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <PostImageSlider images={selectedMedia.images || []} />
                )}
              </div>

              {/* Right Column: Information Panel */}
              <div className="w-[340px] border-l border-border-main flex flex-col h-full bg-page">
                {/* Creator Header */}
                <div className="p-4 border-b border-border-main flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={user.profilePicture || DEFAULT_AVATAR} 
                      className="w-10 h-10 rounded-full object-cover border border-border-main" 
                      alt="" 
                    />
                    <div>
                      <h4 className="text-sm font-black text-text-main leading-tight">{displayName}</h4>
                      <p className="text-xs text-text-muted">{username}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteItem(selectedMedia._id)}
                    className="p-2 text-text-muted hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-full cursor-pointer"
                    title="Delete Post"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Details Section */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedMedia.location && (
                    <div className="flex items-center gap-1.5 text-xs text-text-muted font-bold">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      <span>{selectedMedia.location}</span>
                    </div>
                  )}

                  {selectedMedia.comment && (
                    <p className="text-sm text-text-main leading-relaxed font-medium">
                      {selectedMedia.comment}
                    </p>
                  )}

                  {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMedia.tags.map((tag: string, idx: number) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 bg-border-secondary border border-border-secondary text-[10px] font-black text-text-muted rounded-md uppercase tracking-wider"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-text-muted font-bold">
                    Uploaded {new Date(selectedMedia.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Footer Section */}
                <div className="p-4 border-t border-border-main bg-border-secondary/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-text-main">
                    <span className="flex items-center gap-1.5"><Heart size={16} className="text-red-500 fill-red-500" /> {selectedMedia.likes || 0} Likes</span>
                    <span className="flex items-center gap-1.5"><MessageCircle size={16} className="text-text-muted" /> {selectedMedia.commentsCount || 0} Comments</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PostImageSlider = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <img 
        src={images[currentIndex]} 
        alt="" 
        className="w-full h-full object-contain select-none"
      />

      {images.length > 1 && (
        <>
          {/* Left Arrow */}
          <button 
            onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
            className="absolute left-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors border border-white/10 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Right Arrow */}
          <button 
            onClick={() => setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
            className="absolute right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors border border-white/10 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 flex gap-1.5">
            {images.map((_, idx) => (
              <div 
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

