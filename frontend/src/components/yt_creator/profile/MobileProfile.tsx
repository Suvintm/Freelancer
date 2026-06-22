import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Youtube, Camera, Settings, Plus, BarChart3, Briefcase, Users2, Edit3,
  Lock, PlaySquare, LayoutGrid, CheckCircle2, Globe,
  Trash2, ChevronRight, AlertCircle, Play, Image as ImageIcon, Check, Eye,
  X, Heart, MessageCircle
} from 'lucide-react';
import { selectUser, updateUser } from '../../../store/slices/authSlice';
import { api } from '../../../api/client';
import SILVER_BTN from '../../../assets/playbuttons/silverbtn.png';
import GOLD_BTN from '../../../assets/playbuttons/goldenbtn.png';
import DIAMOND_BTN from '../../../assets/playbuttons/diamondbtn.png';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=400';

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

export const MobileProfile = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
  const [now] = useState(() => Date.now());

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
    if (newlineIdx !== -1 && newlineIdx < maxChars) limit = newlineIdx;
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
      dispatch(updateUser({ coverBanner: bannerUrl }));
      await api.put('/user/me/cover-banner', { bannerUrl });
    } catch (err) {
      console.error('Failed to update cover banner:', err);
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

  const allRoles = Array.from(new Set(
    youtubeProfiles.map((p) => p.subCategoryName).filter(Boolean)
  )) as string[];

  const allLocations = Array.from(new Set(
    youtubeProfiles.map((p) => (p as { country?: string }).country).filter(Boolean)
  )) as string[];

  const languages = Array.from(new Set(
    youtubeProfiles.map((p) => (p as { language?: string }).language).filter(Boolean)
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

  const allVideos = user.youtubeVideos || [];

  const timeAgo = (d?: string): string => {
    if (!d) return '';
    const days = Math.floor((now - new Date(d).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  const isRecent = (d?: string): boolean =>
    !!d && now - new Date(d).getTime() < 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="flex lg:hidden w-full flex-col min-h-screen bg-[#000000] pb-24 font-sans text-white">

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — YT BANNER + STATS ON BANNER
      ═══════════════════════════════════════════════════════ */}
      <div
        className="relative w-full"
        onMouseLeave={() => setShowBannerMenu(false)}
      >
        <div className="relative w-full h-[110px] overflow-hidden">
          {/* Base Gradient */}
          <div className="absolute inset-0 bg-gradient-to-bl from-black via-[#990000] to-[#FF0000]" />

          {/* Custom Banner overlay */}
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

          {/* YouTube watermark icon */}
          <AnimatePresence>
            {!selectedBanner && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Youtube size={60} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats row — aligned right and raised, bare white text */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-end gap-6 pr-6 pb-6">
            <div className="flex flex-col items-center">
              <span className="text-[16px] font-bold text-white leading-none">{formatCount(user.followers)}</span>
              <span className="text-[8px] font-semibold text-white/80 uppercase tracking-wider mt-0.5">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[16px] font-bold text-white leading-none">{formatCount(user.following)}</span>
              <span className="text-[8px] font-semibold text-white/80 uppercase tracking-wider mt-0.5">Following</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[16px] font-bold text-white leading-none">{formatCount(totalVideos)}</span>
              <span className="text-[8px] font-semibold text-white/80 uppercase tracking-wider mt-0.5">Posts</span>
            </div>
          </div>
        </div>

        {/* Edit Cover button — floats top-right above overflow */}
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
                    {availableBanners.map((b) => (
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

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — PROFILE HEADER ROW
          Avatar (left, overlapping banner) + Buttons (right)
      ═══════════════════════════════════════════════════════ */}
      <div className="px-4 bg-[#000000] -mt-5 rounded-t-[24px] pt-0 pb-0 z-10 relative">
        <div className="flex items-start gap-3 w-full">

          {/* Avatar */}
          <div className="relative shrink-0 -mt-5">
            <div className="w-[80px] h-[80px] rounded-full border-[3px] border-[#000000] bg-[#0B0B0B] overflow-hidden shadow-2xl">
              <img
                src={user.profilePicture || DEFAULT_AVATAR}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-0.5 right-0.5 w-[22px] h-[22px] bg-[#FF3040] rounded-full border-2 border-[#000000] flex items-center justify-center shadow-lg active:scale-95">
              <Camera size={10} className="text-white" />
            </button>
          </div>

          {/* Right column: Buttons + Toolbox */}
          <div className="flex-1 flex flex-col gap-1.5 pb-1 mt-4">
            {/* Settings + Add Story row */}
            <div className="flex items-center gap-2">
              <button className="flex-1 h-[30px] rounded-lg bg-[#0B0B0B] border border-[#1A1A1B] text-white text-[10px] font-bold flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer">
                <Settings size={11} />
                Settings
              </button>
              <button className="flex-1 h-[30px] rounded-lg bg-[#FF3040] text-white text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 cursor-pointer">
                <Plus size={12} />
                Add Story
              </button>
            </div>

            {/* Toolbox row */}
            <div className="flex items-center gap-1.5">
              <button className="flex-1 h-[26px] rounded-lg bg-[#0B0B0B] border border-[#1A1A1B] flex items-center justify-center gap-1 cursor-pointer active:scale-95">
                <BarChart3 size={9} className="text-[#FF0000]" />
                <span className="text-[8px] font-bold text-white uppercase tracking-wider">Analytics</span>
              </button>
              <button className="flex-1 h-[26px] rounded-lg bg-[#0B0B0B] border border-[#1A1A1B] flex items-center justify-center gap-1 cursor-pointer active:scale-95">
                <Briefcase size={9} className="text-white" />
                <span className="text-[8px] font-bold text-white uppercase tracking-wider">Deals</span>
              </button>
              <button className="flex-1 h-[26px] rounded-lg bg-[#0B0B0B] border border-[#1A1A1B] flex items-center justify-center gap-1 cursor-pointer active:scale-95">
                <Users2 size={9} className="text-[#22C55E]" />
                <span className="text-[8px] font-bold text-white uppercase tracking-wider">Community</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3 — IDENTITY BLOCK
            Name · Chips · Location · Bio
        ═══════════════════════════════════════════════════════ */}
        <div className="mt-0.5 pl-1">
          {/* Name + verified badge */}
          <div className="flex items-center gap-1.5">
            <h1 className="text-[15px] font-bold text-white leading-tight">{displayName}</h1>
            {/* Red verified rosette */}
            <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
                fill="#FF3040"
              />
              <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Category / role chips */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {allRoles.length > 0 ? allRoles.map((role, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-[#0B0B0B] border border-[#1A1A1B] text-[9px] font-bold text-[#A1A1AA] uppercase tracking-widest">
                {role}
              </span>
            )) : (
              <span className="px-2 py-0.5 rounded-md border border-dashed border-[#1A1A1B] text-[9px] font-bold text-[#A1A1AA] uppercase tracking-widest">
                SELECT CHANNEL ROLE
              </span>
            )}
          </div>

          {/* Location + Language */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <Globe size={10} className="text-[#A1A1AA] shrink-0" />
            <span className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wide">
              {allLocations.length > 0 ? allLocations.join(' • ') : 'GLOBAL'}
              {languages.length > 0 ? ` • ${languages.join(', ').toUpperCase()}` : ''}
            </span>
          </div>

          {/* Bio */}
          <div className="mt-2.5 w-full" ref={bioRef}>
            <AnimatePresence mode="wait">
              {isEditingBio ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="w-full flex flex-col gap-2"
                >
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    maxLength={150}
                    rows={3}
                    disabled={isSavingBio}
                    className="w-full text-[12px] text-[#A1A1AA] bg-[#0B0B0B] border border-[#1A1A1B] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#FF3040]/30 focus:border-[#FF3040]/50 transition-all font-medium resize-none placeholder-[#A1A1AA]/40"
                    placeholder="Tell us about yourself..."
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#A1A1AA]/60 font-bold">{bioText.length}/150</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingBio(false)}
                        disabled={isSavingBio}
                        className="h-7 px-3 rounded-lg border border-[#1A1A1B] text-[11px] font-bold text-white hover:bg-[#0B0B0B] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBio}
                        disabled={isSavingBio}
                        className="h-7 px-3 rounded-lg bg-[#FF3040] text-white text-[11px] font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSavingBio ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                            <span>Saving...</span>
                          </>
                        ) : <span>Save</span>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="flex items-start gap-2 w-full"
                >
                  <div className="flex-1 max-w-[50%]">
                    {user.bio ? (
                      <p className="text-[12px] text-[#A1A1AA] leading-relaxed font-medium whitespace-pre-wrap">
                        {displayBio()}
                        {needsTruncation && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setIsBioExpanded(!isBioExpanded); }}
                            className="text-[#FF3040] hover:text-red-400 font-bold ml-1 text-[11px] cursor-pointer inline-block"
                          >
                            {isBioExpanded ? ' less' : ' more'}
                          </button>
                        )}
                      </p>
                    ) : (
                      <button
                        onClick={startEditingBio}
                        className="flex items-center gap-1.5 text-[#FF3040] text-[11px] font-bold bg-[#FF3040]/10 px-3 py-1.5 rounded-lg border border-[#FF3040]/20 cursor-pointer"
                      >
                        <Edit3 size={12} />
                        Add profile bio
                      </button>
                    )}
                  </div>
                  {user.bio && (
                    <button
                      onClick={startEditingBio}
                      className="text-[#A1A1AA] hover:text-white transition-colors mt-0.5 shrink-0 cursor-pointer"
                    >
                      <Edit3 size={13} />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — YT CREATOR MILESTONES
      ═══════════════════════════════════════════════════════ */}
      <div className="mt-4 pb-1 px-4">
        <h3 className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-[0.12em] mb-2">
          YT Creator Milestones
        </h3>
        <div className="flex justify-start gap-5 pb-1">

          {milestones.map((m) => {
            const unlockedChannels = youtubeProfiles.filter((p) => (p.subscriber_count || 0) >= m.count).length;
            const isUnlocked = unlockedChannels > 0;

            return (
              <div key={m.label} className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className={`relative w-[60px] h-[60px] rounded-full flex items-center justify-center border border-[#1A1A1B] bg-[#0B0B0B]/40 transition-all duration-300`}>
                  <img
                    src={m.img}
                    alt={m.label}
                    className={`w-8 h-8 object-contain transition-all duration-300 ${!isUnlocked ? 'opacity-40 grayscale' : 'drop-shadow-lg'}`}
                  />
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                      <Lock size={13} className="text-white" />
                    </div>
                  )}
                </div>
                <span className={`text-[9px] font-bold tracking-wide ${isUnlocked ? 'text-white' : 'text-[#A1A1AA]/50'}`}>{m.label}</span>
                <span className={`text-[7.5px] font-semibold uppercase tracking-wider ${isUnlocked ? 'text-white' : 'text-[#A1A1AA]/40'}`}>
                  {unlockedChannels} / {youtubeProfiles.length || 1} UNLOCKED
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — LINKED CHANNELS
      ═══════════════════════════════════════════════════════ */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-bold text-white">Linked Channels ({youtubeProfiles.length})</h3>
          <button 
            onClick={() => navigate('/youtube-connect')}
            className="flex items-center gap-1.5 bg-[#0B0B0B] px-2.5 py-1.5 rounded-lg border border-white/20 active:scale-95 cursor-pointer"
          >
            <Plus size={12} className="text-white" />
            <span className="text-[10px] font-bold text-white">Add Another</span>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {youtubeProfiles.length > 0 ? youtubeProfiles.map((channel, i) => (
            <div 
              key={channel.id || i} 
              onClick={() => navigate(`/channel/${channel.channel_id}`)}
              className="bg-[#0B0B0B] hover:bg-[#111112] transition-colors rounded-xl p-3 border border-[#1A1A1B] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <img
                  src={channel.thumbnail_url || DEFAULT_AVATAR}
                  alt={channel.channel_name}
                  className="w-[48px] h-[48px] rounded-full bg-[#000] object-cover border border-[#1A1A1B] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  {/* Channel name + PRIMARY badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-white line-clamp-1">{channel.channel_name}</span>
                    {i === 0 && (
                      <span className="bg-[#FF3040] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0">
                        PRIMARY
                      </span>
                    )}
                    {/* Highest achievement badge */}
                    {(channel.subscriber_count || 0) >= 10000 ? (
                      <img src={DIAMOND_BTN} alt="Diamond" className="w-4 h-4 object-contain shrink-0" />
                    ) : (channel.subscriber_count || 0) >= 1000 ? (
                      <img src={GOLD_BTN} alt="Gold" className="w-4 h-4 object-contain shrink-0" />
                    ) : (channel.subscriber_count || 0) >= 100 ? (
                      <img src={SILVER_BTN} alt="Silver" className="w-4 h-4 object-contain shrink-0" />
                    ) : null}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1">
                      <Users2 size={11} className="text-[#FF0000]" />
                      <span className="text-[10px] font-bold text-[#A1A1AA]">{formatCount(channel.subscriber_count)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye size={11} className="text-white/60" />
                      <span className="text-[10px] font-bold text-[#A1A1AA]">{formatCount(channel.view_count || 0)}</span>
                    </div>
                  </div>

                  {/* Niche */}
                  <div className="mt-1.5">
                    {channel.subCategoryName ? (
                      <span className="text-[9px] font-bold text-[#FF3040] uppercase tracking-wider">{channel.subCategoryName}</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <AlertCircle size={8} className="text-yellow-500" />
                        <span className="text-[9px] font-bold text-yellow-500">NICHE NOT SET</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom divider row — verified + delete + analytics */}
              <div 
                className="flex items-center justify-between mt-3 pt-3 border-t border-[#1A1A1B]"
                onClick={(e) => e.stopPropagation()} // Prevent card navigation when clicking specific action buttons
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#FF0000]" />
                  <button className="p-0.5 active:scale-90 cursor-pointer">
                    <Trash2 size={14} className="text-[#A1A1AA]/60 hover:text-[#FF3040] transition-colors" />
                  </button>
                </div>
                <button 
                  onClick={() => navigate(`/channel/${channel.channel_id}`)}
                  className="flex items-center gap-0.5 active:opacity-70 cursor-pointer"
                >
                  <span className="text-[10px] font-bold text-[#FF3040]">Analytics</span>
                  <ChevronRight size={12} className="text-[#FF3040]" />
                </button>
              </div>
            </div>
          )) : (
            <div className="bg-[#0B0B0B] rounded-xl p-6 border border-dashed border-[#1A1A1B] text-center">
              <Youtube size={28} className="text-[#A1A1AA]/40 mx-auto mb-2" />
              <p className="text-[11px] font-medium text-[#A1A1AA]/60">No channels linked yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 6 — TAB BAR
      ═══════════════════════════════════════════════════════ */}
      <div className="mt-1 border-t border-[#1A1A1B]">
        <div className="flex items-center justify-around">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1.5 py-3 flex-1 relative cursor-pointer ${activeTab === tab.id ? 'text-[#FF3040]' : 'text-[#A1A1AA]'}`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-[#FF3040]' : 'text-[#A1A1AA]'} />
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF3040] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 7 — TAB CONTENT
      ═══════════════════════════════════════════════════════ */}
      <div className="pb-8">

        {/* ── YT POSTS TAB ─────────────────────────────────── */}
        {activeTab === 'yt_posts' && (
          <div className="w-full pt-5">

            {/* FEATURED Section */}
            <div>
              {/* Section header */}
              <div className="flex items-center justify-between px-4 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-[3px] h-[16px] bg-[#FF0000] rounded-full" />
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">Featured</span>
                  {allVideos.length > 0 && (
                    <span className="bg-[#FF0000]/15 text-[#FF0000] text-[8px] font-black px-1.5 py-0.5 rounded border border-[#FF0000]/20 tracking-widest">
                      TOP {Math.min(allVideos.length, 6)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-bold text-[#A1A1AA] uppercase tracking-widest">SWIPE</span>
                  <ChevronRight size={11} className="text-[#FF3040]" />
                  <ChevronRight size={11} className="text-[#FF3040] -ml-2" />
                </div>
              </div>

              {/* Featured horizontal scroll */}
              <div className="flex gap-3.5 overflow-x-auto pb-4 scrollbar-hide -ml-0 px-4">
                {allVideos.length > 0 ? allVideos.slice(0, 6).map((video, idx) => (
                  <div
                    key={video.id || idx}
                    className="flex-shrink-0 w-[72vw] max-w-[280px] bg-[#0B0B0B] rounded-xl overflow-hidden border border-[#1A1A1B]"
                  >
                    {/* 16:9 Thumbnail */}
                    <div className="relative w-full aspect-video bg-[#0B0B0B]">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Bottom gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                      {/* NEW badge */}
                      {isRecent(video.published_at || video.publishedAt) && (
                        <div className="absolute top-2 left-2 bg-[#FF0000] text-white text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest">
                          NEW
                        </div>
                      )}

                      {/* Index badge */}
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                        #{idx + 1}
                      </div>

                      {/* Centre play button */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                          <Play size={14} className="text-white fill-white ml-0.5" />
                        </div>
                      </div>

                      {/* Time pill bottom-left */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                        <span className="text-[8px] font-bold text-white/85">
                          {timeAgo(video.published_at || video.publishedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Info bar below thumbnail */}
                    <div className="p-2.5">
                      <h4 className="text-[11px] font-bold text-white leading-snug line-clamp-2 mb-1.5">{video.title || 'Untitled Video'}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {primaryChannel.thumbnail_url ? (
                            <img src={primaryChannel.thumbnail_url} className="w-[14px] h-[14px] rounded-full object-cover border border-[#1A1A1B] shrink-0" alt="" />
                          ) : (
                            <Youtube size={11} className="text-[#FF0000] shrink-0" />
                          )}
                          <span className="text-[9px] font-semibold text-[#A1A1AA] line-clamp-1">
                            {primaryChannel.channel_name || 'Creator'}
                          </span>
                        </div>
                        {/* Watch pill */}
                        <div className="flex items-center gap-1 bg-[#FF3040]/10 px-2 py-0.5 rounded-full border border-[#FF3040]/20 shrink-0">
                          <Play size={8} className="text-[#FF3040] fill-[#FF3040]" />
                          <span className="text-[8px] font-black text-[#FF3040] uppercase tracking-wider">WATCH</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="w-full py-10 flex items-center justify-center border border-dashed border-[#1A1A1B] rounded-2xl mx-4">
                    <div className="flex flex-col items-center gap-2">
                      <Youtube size={32} className="text-[#A1A1AA]/30" />
                      <p className="text-[11px] font-bold text-[#A1A1AA]/40 uppercase tracking-widest">No featured videos</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ALL VIDEOS (Archive) Section */}
            {allVideos.length > 6 && (
              <div className="px-4 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-[3px] h-[16px] bg-white/40 rounded-full" />
                    <span className="text-[11px] font-black text-white uppercase tracking-widest">All Videos</span>
                    <span className="bg-white/8 text-[#A1A1AA] text-[8px] font-black px-1.5 py-0.5 rounded border border-white/10 tracking-widest">
                      {allVideos.length - 6} MORE
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  {allVideos.slice(6).map((video, idx) => (
                    <div key={video.id || idx} className="flex bg-[#0B0B0B] rounded-xl overflow-hidden border border-[#1A1A1B]">
                      {/* Thumbnail */}
                      <div className="relative w-[140px] shrink-0">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          style={{ minHeight: '80px' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40 pointer-events-none" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center border border-white/20">
                            <Play size={10} className="text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="flex-1 p-2.5 min-w-0 flex flex-col justify-between">
                        <h4 className="text-[11px] font-bold text-white leading-snug line-clamp-2">{video.title || 'Untitled Video'}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] font-medium text-[#A1A1AA] line-clamp-1 flex-1 min-w-0">
                            {primaryChannel.channel_name || 'Creator'}
                          </span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <span className="text-[9px] font-bold text-[#FF3040]">Watch</span>
                            <ChevronRight size={10} className="text-[#FF3040]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── YT VIDEOS TAB ─────────────────────────────────── */}
        {activeTab === 'yt_videos' && (
          isLoadingFeed ? (
            <div className="w-full py-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#FF3040] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : ytVideos.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 px-1">
              {ytVideos.map((video) => (
                <div 
                  key={video._id} 
                  onClick={() => setSelectedMedia(video)}
                  className="relative aspect-video bg-[#0B0B0B] border border-[#1A1A1B] active:opacity-75 overflow-hidden"
                >
                  <video 
                    src={video.videoUrl} 
                    preload="metadata" 
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 p-1 rounded-full text-white scale-75">
                    <Play size={12} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-4 mt-4 text-center py-10 border border-dashed border-[#1A1A1B] rounded-xl">
              <Play size={24} className="text-[#A1A1AA]/30 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-[#A1A1AA]/40 uppercase tracking-widest">No platform videos uploaded yet</p>
            </div>
          )
        )}

        {/* ── POSTS TAB ─────────────────────────────────────── */}
        {activeTab === 'posts' && (
          isLoadingFeed ? (
            <div className="w-full py-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#FF3040] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 px-1">
              {posts.map((post) => (
                <div 
                  key={post._id} 
                  onClick={() => setSelectedMedia(post)}
                  className="relative aspect-square bg-[#0B0B0B] border border-[#1A1A1B] active:opacity-75 overflow-hidden"
                >
                  <img 
                    src={post.images?.[0]} 
                    alt={post.comment} 
                    className="w-full h-full object-cover"
                  />
                  {post.images && post.images.length > 1 && (
                    <div className="absolute top-1.5 right-1.5 bg-black/60 p-1 rounded text-white scale-75">
                      <LayoutGrid size={12} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-4 mt-4 text-center py-10 border border-dashed border-[#1A1A1B] rounded-xl">
              <LayoutGrid size={24} className="text-[#A1A1AA]/30 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-[#A1A1AA]/40 uppercase tracking-widest">No posts uploaded yet</p>
            </div>
          )
        )}

        {/* ── THUMBNAILS TAB ─────────────────────────────────── */}
        {activeTab === 'thumbnail_vote' && (
          isLoadingFeed ? (
            <div className="w-full py-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#FF3040] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : thumbnailVotes.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 px-4 mt-2">
              {thumbnailVotes.map((item) => {
                const images = item.images || [];
                const votes = item.votes || new Array(images.length).fill(0);
                const totalVotes = votes.reduce((a: number, b: number) => a + b, 0);

                return (
                  <div 
                    key={item._id}
                    className="border border-[#1A1A1B] rounded-2xl p-4 bg-[#0B0B0B] flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-[#A1A1AA]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteItem(item._id, e)}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Caption */}
                    <p className="text-xs font-semibold text-white mb-3 line-clamp-2">
                      {item.comment || "Thumbnail Choice Vote"}
                    </p>

                    {/* Image Grid with Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {images.map((img: string, idx: number) => {
                        const voteCount = votes[idx] || 0;
                        const percentage = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
                        const isWinner = totalVotes > 0 && voteCount === Math.max(...votes);

                        return (
                          <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/5">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            {/* Overlay Vote Results */}
                            <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center p-1">
                              <span className="text-white font-extrabold text-[13px]">{percentage}%</span>
                              <span className="text-[8px] text-zinc-300 font-medium">{voteCount} votes</span>
                              {isWinner && (
                                <span className="absolute top-1 right-1 bg-yellow-500 text-black text-[6px] font-black uppercase px-1 rounded">
                                  Winner
                                </span>
                              )}
                            </div>
                            {/* Badge */}
                            <span className="absolute top-1 left-1 bg-black/70 px-1 py-0.5 rounded text-[7px] text-white font-bold leading-none">
                              No. {idx + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Footer */}
                    <div className="border-t border-[#1A1A1B] pt-2 flex items-center justify-between text-[10px] text-[#A1A1AA]">
                      <span>Total Votes: {totalVotes}</span>
                      <span className="text-blue-400 uppercase text-[8px] tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-full">
                        Active Poll
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mx-4 mt-4 text-center py-10 border border-dashed border-[#1A1A1B] rounded-xl">
              <ImageIcon size={24} className="text-[#A1A1AA]/30 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-[#A1A1AA]/40 uppercase tracking-widest">No thumbnail votes uploaded yet</p>
            </div>
          )
        )}

        {/* ── REELS TAB ─────────────────────────────────────── */}
        {activeTab === 'reels' && (
          isLoadingFeed ? (
            <div className="w-full py-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#FF3040] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reels.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 px-1">
              {reels.map((reel) => (
                <div 
                  key={reel._id} 
                  onClick={() => setSelectedMedia(reel)}
                  className="relative aspect-[9/16] bg-[#0B0B0B] border border-[#1A1A1B] active:opacity-75 overflow-hidden"
                >
                  <video 
                    src={reel.videoUrl} 
                    preload="metadata" 
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 p-1 rounded-full text-white scale-75">
                    <PlaySquare size={12} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-4 mt-4 text-center py-10 border border-dashed border-[#1A1A1B] rounded-xl">
              <PlaySquare size={24} className="text-[#A1A1AA]/30 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-[#A1A1AA]/40 uppercase tracking-widest">No reels uploaded yet</p>
            </div>
          )
        )}
      </div>

      {/* Immersive Media Details Modal (Mobile-Optimized) */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-[#000000] flex flex-col justify-between"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1A1A1B] bg-black">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedMedia(null)}
                  className="p-1 text-white active:scale-95 cursor-pointer"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <img 
                    src={user.profilePicture || DEFAULT_AVATAR} 
                    className="w-8 h-8 rounded-full object-cover border border-[#1A1A1B]" 
                    alt="" 
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{displayName}</h4>
                    <p className="text-[10px] text-[#A1A1AA]">@{user.username || 'creator'}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteItem(selectedMedia._id)}
                className="p-2 text-[#A1A1AA] hover:text-red-500 active:scale-90 cursor-pointer"
                title="Delete Post"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Media Area */}
            <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden select-none">
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

            {/* Footer / Caption Area */}
            <div className="p-4 bg-black/95 border-t border-[#1A1A1B] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5"><Heart size={16} className="text-[#FF3040] fill-[#FF3040]" /> {selectedMedia.likes || 0} Likes</span>
                <span className="flex items-center gap-1.5"><MessageCircle size={16} className="text-[#A1A1AA]" /> {selectedMedia.commentsCount || 0} Comments</span>
              </div>
              
              <div className="space-y-1.5">
                {selectedMedia.location && (
                  <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">{selectedMedia.location}</p>
                )}
                {selectedMedia.comment && (
                  <p className="text-xs text-white leading-relaxed font-medium">
                    {selectedMedia.comment}
                  </p>
                )}
                {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedMedia.tags.map((tag: string, idx: number) => (
                      <span 
                        key={idx} 
                        className="text-[9px] font-bold text-[#FF3040] uppercase tracking-wider mr-1.5"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
