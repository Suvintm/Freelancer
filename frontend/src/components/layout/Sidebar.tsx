import { useState, useEffect } from 'react';
import { ReactLenis }       from 'lenis/react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  ExternalLink, 
  TrendingUp, 
  Settings, 
  Sparkles, 
  BarChart3, 
  ChevronRight, 
  ChevronDown,
  Youtube, 
  ArrowRight, 
  Share2,
  Award,
  SquarePen,
  PlaySquare,
  Briefcase,
  Radio,
  Check
} from 'lucide-react';
import { useNavigate }      from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme }         from '../../hooks/useTheme';
import { api }              from '../../api/client';
import auth1                from '../../assets/auth/auth_1.png';
import defaultProfile       from '../../assets/defaultprofile.png';
import officialLogo         from '../../assets/officiallogo.png';
import { AccountSwitcher } from '../profile/AccountSwitcher';
import LottieComponent from 'lottie-react';
import { bioApiService } from '../../linkinbio-v2/services/bioApiService';

import { VerifiedBadge } from '../ui/VerifiedBadge';
import sidebarLottieAnimation from '../../assets/lottie/sidebar_lottie.json';
import { OnboardingSyncOverlay } from '../onboarding/OnboardingSyncOverlay';

const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

const COMMUNITY_MEMBERS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
];

const HIGHLIGHTS = [
  { id: 1, label: 'New',      img: null,  isNew: true  },
  { id: 2, label: 'Garden',   img: auth1, isNew: false },
  { id: 3, label: 'Cameras',  img: auth1, isNew: false },
  { id: 4, label: 'Wildlife', img: auth1, isNew: false },
];

const formatNumber = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num) || 0 : num;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
};

// ── Main Sidebar ─────────────────────────────────────────────────────────────

export const Sidebar = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { isDarkMode } = useTheme();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [showTestSync, setShowTestSync] = useState(false);
  const [qrSvgData, setQrSvgData] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/${user?.username || 'suvintm'}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.name || 'Creator'}'s Profile on SuviX`,
          text: 'Check out my creator profile and link in bio on SuviX!',
          url: profileUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setIsLoadingQr(true);
    bioApiService.getQrStatus()
      .then((status) => {
        if (status?.qrSvg) {
          setQrSvgData(status.qrSvg);
          setTimeout(() => setIsLoadingQr(false), 1200);
        } else {
          bioApiService.generateQr({ slug: 'main' })
            .then((res) => {
              if (res?.qrSvg) {
                setQrSvgData(res.qrSvg);
              }
              setTimeout(() => setIsLoadingQr(false), 1200);
            })
            .catch(() => {
              setIsLoadingQr(false);
            });
        }
      })
      .catch(() => {
        setTimeout(() => setIsLoadingQr(false), 1400);
      });
  }, [user?.id, user?.username]);

  const roleStr = (user?.role || '').toLowerCase();
  const categoryStr = (user?.primaryRole?.category || '').toLowerCase();
  const categorySlugStr = (user?.primaryRole?.categorySlug || '').toLowerCase();

  const isCreator =
    roleStr === 'creator' ||
    roleStr === 'yt_influencer' ||
    categoryStr === 'creator' ||
    categoryStr === 'youtube creator' ||
    categoryStr === 'yt_influencer' ||
    categorySlugStr === 'creator' ||
    categorySlugStr === 'yt_influencer' ||
    !!user?.creatorProfile;

  const isClientCategory =
    roleStr === 'user' ||
    roleStr === 'brand' ||
    roleStr === 'direct_client' ||
    categoryStr.includes('brand') ||
    categoryStr.includes('user') ||
    categorySlugStr.includes('user') ||
    categorySlugStr.includes('brand');

  const youtubeChannels = user?.youtubeProfile || [];
  const ytVideoCount = youtubeChannels.reduce((acc: number, p: { video_count?: number | string }) => acc + (Number(p.video_count) || 0), 0);
  const userFollowing = Array.isArray(user?.followingIds) 
    ? user.followingIds.length 
    : (Number(user?.following) || 0);
  const userFollowers = Number(user?.followers) || Number(user?.followersCount) || 0;
  const userPosts = Number(user?.postsCount) || Number(user?.posts?.length) || ytVideoCount || 0;

  const [stats, setStats] = useState({
    posts: userPosts,
    followers: userFollowers,
    following: userFollowing,
  });

  useEffect(() => {
    setStats({
      posts: userPosts,
      followers: userFollowers,
      following: userFollowing,
    });

    if (!user?.id) return;

    let isMounted = true;
    const fetchLiveStats = async () => {
      try {
        const [postsRes, profileRes] = await Promise.allSettled([
          api.get(`/profile/${user.id}/posts`),
          api.get(`/profile/${user.id}`),
        ]);

        if (!isMounted) return;

        let livePosts = userPosts;
        let liveFollowers = userFollowers;
        let liveFollowing = userFollowing;

        if (postsRes.status === 'fulfilled' && postsRes.value.data?.success) {
          const items = postsRes.value.data.items || [];
          livePosts = Math.max(items.length, ytVideoCount);
          if (items.length > 0 && ytVideoCount > 0) {
            livePosts = items.length + ytVideoCount;
          }
        }

        if (profileRes.status === 'fulfilled' && profileRes.value.data?.success) {
          const pData = profileRes.value.data.data;
          if (pData?.followers !== undefined && pData?.followers !== null) {
            liveFollowers = Number(pData.followers) || 0;
          }
          if (pData?.following !== undefined && pData?.following !== null) {
            liveFollowing = Number(pData.following) || 0;
          }
          if (pData?.postsCount !== undefined && pData?.postsCount !== null) {
            livePosts = Math.max(livePosts, Number(pData.postsCount) || 0);
          }
        }

        setStats({
          posts: livePosts,
          followers: liveFollowers,
          following: liveFollowing,
        });
      } catch {
        // Keep stats from user object
      }
    };

    fetchLiveStats();

    return () => {
      isMounted = false;
    };
  }, [user?.id, userFollowers, userFollowing, userPosts, ytVideoCount]);

  const CHANNEL = {
    name:           user?.name || 'Suvin T M',
    handle:         `@${user?.username || 'suvintm'}`,
    avatar:         user?.profilePicture || defaultProfile,
    subscribers:    '0',
    views:          '0',
    videos:         stats.posts,
    category:       user?.primaryRole?.category || 'Member',
    role:           user?.primaryRole?.subCategory || 'Member',
    bio:            user?.bio || (isClientCategory 
                      ? 'Brand Sponsor looking to collaborate with top creators for video sponsorships and integrations.' 
                      : 'Professional Creator · UI Designer · Lifestyle Blogger · Building in public 🚀'),
    followers:      stats.followers,
    following:      stats.following,
  };

  return (
    <ReactLenis className="w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
      <div className="flex flex-col h-full gap-3.5 p-3.5 xl:p-4 select-none">

        {/* ── 1. User Identity & Stats Card ─────────────────────────── */}
        <div className={`relative rounded-2xl border transition-all duration-300 p-4 space-y-3 shadow-xs ${
          isDarkMode ? 'bg-[#121215] border-zinc-800/80 text-white' : 'bg-white border-zinc-200/80 text-zinc-900'
        }`}>

          {/* Premium Plan Badge */}
          {user?.subscription && (user.subscription.tier !== 'free' || user.subscription.planTier) && (
            <div className="absolute top-3.5 right-24 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xs flex items-center gap-1 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white animate-pulse">
              <Sparkles size={8} className="text-white fill-white" />
              <span>{user.subscription.tier || user.subscription.planTier || 'PRO'}</span>
            </div>
          )}

          {/* Avatar + name + online status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={CHANNEL.avatar}
                  alt={CHANNEL.name}
                  className={`w-11 h-11 rounded-full object-cover border-2 ${isDarkMode ? 'border-zinc-700' : 'border-zinc-200'}`}
                />
                {/* Blue Checkmark Badge */}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 rounded-full ring-2 ring-white dark:ring-black flex items-center justify-center">
                  <svg width="7" height="6" viewBox="0 0 10 8" fill="none">
                    <path d="M1.5 4L3.8 6.5L8.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="min-w-0">
                <div 
                  className="flex items-center gap-1 cursor-pointer group"
                  onClick={() => setIsSwitcherOpen(true)}
                  title="Switch Account"
                >
                  <p className="text-[13.5px] font-bold leading-tight truncate text-zinc-900 dark:text-white">
                    {CHANNEL.name}
                  </p>
                  <VerifiedBadge isVerified={user?.is_verified} role={user?.primaryRole?.category || user?.role} />
                  <ChevronDown size={12} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0" />
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium leading-tight mt-0.5 truncate">
                  {CHANNEL.handle}
                </p>
              </div>
            </div>

            {/* Online Status Pill */}
            <div className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/50 text-[10.5px] font-bold select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </div>
          </div>

          {/* Bio */}
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
            {CHANNEL.bio}
          </p>

          {/* Stats Grid: Posts, Followers, Following */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-zinc-900 dark:text-white leading-tight">
                {formatNumber(stats.posts)}
              </p>
              <p className="text-[10.5px] font-medium text-zinc-400 dark:text-zinc-500">
                Posts
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-zinc-900 dark:text-white leading-tight">
                {formatNumber(stats.followers)}
              </p>
              <p className="text-[10.5px] font-medium text-zinc-400 dark:text-zinc-500">
                Followers
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-zinc-900 dark:text-white leading-tight">
                {formatNumber(stats.following)}
              </p>
              <p className="text-[10.5px] font-medium text-zinc-400 dark:text-zinc-500">
                Following
              </p>
            </div>
          </div>

          {/* Action Row: View Profile + Settings */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => navigate('/profile')}
              className={`flex-1 py-1.5 px-3 rounded-xl border text-[11.5px] font-bold transition-all active:scale-[0.98] cursor-pointer ${
                isDarkMode 
                  ? 'border-zinc-700 bg-transparent text-white hover:bg-zinc-800' 
                  : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 shadow-2xs'
              }`}
            >
              View Profile
            </button>
            <button
              onClick={() => navigate('/settings')}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white' 
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-2xs'
              }`}
              title="Settings"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* ── 2. QR Code / Creator Identity Card ────────────────────── */}
        <div className={`rounded-2xl border transition-all p-3 flex items-center gap-3 shadow-xs ${
          isDarkMode ? 'bg-[#121215] border-zinc-800/80' : 'bg-white border-zinc-200/80'
        }`}>
          {/* Left: QR Code Matrix Box with Scanner Frame */}
          <div className={`relative w-[84px] h-[84px] rounded-xl border shrink-0 p-1.5 flex items-center justify-center overflow-hidden transition-all ${
            isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200 shadow-2xs'
          }`}>
            {/* Animated Scanner Brackets */}
            <motion.div 
              animate={{ opacity: [0.75, 1, 0.75], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1 left-1 w-3 h-3 border-t-[2px] border-l-[2px] border-emerald-500 rounded-tl pointer-events-none z-10" 
            />
            <motion.div 
              animate={{ opacity: [0.75, 1, 0.75], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1 right-1 w-3 h-3 border-t-[2px] border-r-[2px] border-emerald-500 rounded-tr pointer-events-none z-10" 
            />
            <motion.div 
              animate={{ opacity: [0.75, 1, 0.75], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-1 left-1 w-3 h-3 border-b-[2px] border-l-[2px] border-emerald-500 rounded-bl pointer-events-none z-10" 
            />
            <motion.div 
              animate={{ opacity: [0.75, 1, 0.75], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-1 right-1 w-3 h-3 border-b-[2px] border-r-[2px] border-emerald-500 rounded-br pointer-events-none z-10" 
            />

            {/* QR SVG / Fallback */}
            <div className="relative w-full h-full flex items-center justify-center">
              {qrSvgData ? (
                <div 
                  className="w-full h-full flex items-center justify-center relative [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: qrSvgData }}
                />
              ) : (
                <svg viewBox="0 0 200 200" className="w-full h-full text-black dark:text-white fill-current">
                  <rect x="16" y="16" width="48" height="48" rx="8" fill="currentColor" />
                  <rect x="24" y="24" width="32" height="32" rx="4" fill={isDarkMode ? '#18181B' : '#FFFFFF'} />
                  <rect x="32" y="32" width="16" height="16" rx="2" fill="currentColor" />
                  <rect x="136" y="16" width="48" height="48" rx="8" fill="currentColor" />
                  <rect x="144" y="24" width="32" height="32" rx="4" fill={isDarkMode ? '#18181B' : '#FFFFFF'} />
                  <rect x="152" y="32" width="16" height="16" rx="2" fill="currentColor" />
                  <rect x="16" y="136" width="48" height="48" rx="8" fill="currentColor" />
                  <rect x="24" y="144" width="32" height="32" rx="4" fill={isDarkMode ? '#18181B' : '#FFFFFF'} />
                  <rect x="32" y="152" width="16" height="16" rx="2" fill="currentColor" />
                  <circle cx="85" cy="24" r="4.5" />
                  <circle cx="105" cy="24" r="4.5" />
                  <circle cx="90" cy="52" r="4.5" />
                  <circle cx="75" cy="75" r="4.5" />
                  <circle cx="95" cy="75" r="4.5" />
                  <circle cx="125" cy="75" r="4.5" />
                  <circle cx="145" cy="75" r="4.5" />
                  <circle cx="75" cy="130" r="4.5" />
                  <circle cx="105" cy="130" r="4.5" />
                  <circle cx="125" cy="130" r="4.5" />
                  <circle cx="165" cy="148" r="4.5" />
                  <circle cx="85" cy="165" r="4.5" />
                  <circle cx="105" cy="165" r="4.5" />
                  <circle cx="148" cy="165" r="4.5" />
                </svg>
              )}

              {/* Official Center Logo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="w-5.5 h-5.5 rounded-full bg-white ring-2 ring-white shadow-sm flex items-center justify-center overflow-hidden p-0.5">
                  <img src={officialLogo} alt="SuviX" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Scanning Laser Line Animation */}
              {isLoadingQr && (
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-lg">
                  <motion.div
                    animate={{ top: ['0%', '92%', '0%'] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.9)] z-30"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: Info & Share Button */}
          <div className="min-w-0 flex-1">
            <h4 className="text-[12.5px] font-bold text-zinc-900 dark:text-white leading-tight">
              Your Creator Identity
            </h4>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5 mb-2 line-clamp-2">
              Scan to view your bio page and share with the world.
            </p>

            <button
              onClick={handleShareProfile}
              className={`px-3 py-1 rounded-full border text-[10.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                copiedShare 
                  ? 'bg-emerald-500 text-white border-emerald-500' 
                  : isDarkMode 
                    ? 'border-zinc-700 bg-zinc-850 hover:bg-zinc-800 text-white' 
                    : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800'
              }`}
            >
              {copiedShare ? (
                <>
                  <Check size={11} strokeWidth={2.5} />
                  <span>Copied Link!</span>
                </>
              ) : (
                <>
                  <Share2 size={11} strokeWidth={2.2} />
                  <span>Share Profile</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── 3. Get Verified Card ──────────────────────────────────── */}
        <div 
          onClick={() => navigate('/subscription')}
          className={`rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-sm border ${
            isDarkMode 
              ? 'bg-[#18181B] hover:bg-[#202024] border-zinc-800 text-white' 
              : 'bg-black hover:bg-zinc-900 border-black text-white'
          }`}
          title="Get Verified"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Golden Badge */}
            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Award size={17} className="text-amber-400 fill-amber-400/30" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[12.5px] font-black text-white leading-tight">
                {user?.is_verified ? 'Verified Creator' : 'Get Verified'}
              </h4>
              <p className="text-[10px] text-zinc-400 leading-tight mt-0.5 truncate">
                {user?.is_verified ? 'Priority search & official badge' : 'Build credibility. Unlock more.'}
              </p>
            </div>
          </div>

          <div className="w-6.5 h-6.5 rounded-full bg-white/10 flex items-center justify-center text-white/80 shrink-0 ml-2">
            <ChevronRight size={14} strokeWidth={2.5} />
          </div>
        </div>

        {/* ── 4. Quick Create ───────────────────────────────────────── */}
        <div className="space-y-1.5">
          <h4 className="text-[11.5px] font-bold text-zinc-900 dark:text-white px-0.5">
            Quick Create
          </h4>

          <div className="grid grid-cols-2 gap-2">
            {/* Create Post */}
            <button
              onClick={() => navigate('/create')}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all active:scale-[0.98] cursor-pointer shadow-2xs ${
                isDarkMode 
                  ? 'bg-[#121215] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850' 
                  : 'bg-white border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <div className="w-6.5 h-6.5 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0">
                <SquarePen size={13} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-bold text-zinc-900 dark:text-white truncate">
                Create Post
              </span>
            </button>

            {/* Upload Reel */}
            <button
              onClick={() => navigate('/reels')}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all active:scale-[0.98] cursor-pointer shadow-2xs ${
                isDarkMode 
                  ? 'bg-[#121215] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850' 
                  : 'bg-white border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <div className="w-6.5 h-6.5 rounded-lg bg-pink-500/15 text-pink-500 flex items-center justify-center shrink-0">
                <PlaySquare size={13} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-bold text-zinc-900 dark:text-white truncate">
                Upload Reel
              </span>
            </button>

            {/* Start a Project */}
            <button
              onClick={() => navigate('/jobs')}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all active:scale-[0.98] cursor-pointer shadow-2xs ${
                isDarkMode 
                  ? 'bg-[#121215] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850' 
                  : 'bg-white border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                <Briefcase size={13} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-bold text-zinc-900 dark:text-white truncate">
                Start a Project
              </span>
            </button>

            {/* Go Live */}
            <button
              onClick={() => navigate('/create')}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all active:scale-[0.98] cursor-pointer shadow-2xs ${
                isDarkMode 
                  ? 'bg-[#121215] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850' 
                  : 'bg-white border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <div className="w-6.5 h-6.5 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                <Radio size={13} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-bold text-zinc-900 dark:text-white truncate">
                Go Live
              </span>
            </button>
          </div>
        </div>

        {/* ── 5. Join Our Creator Community Card ────────────────────── */}
        <div
          onClick={() => navigate('/community')}
          className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer shadow-xs ${
            isDarkMode 
              ? 'bg-[#121215] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850' 
              : 'bg-white border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* 3 overlapping member avatars */}
            <div className="flex items-center -space-x-2 shrink-0">
              {COMMUNITY_MEMBERS.map((avatar, idx) => (
                <img
                  key={idx}
                  src={avatar}
                  alt="Community"
                  className="w-6 h-6 rounded-full object-cover border-2 border-white dark:border-zinc-900 ring-1 ring-black/5"
                />
              ))}
            </div>

            <div className="min-w-0">
              <p className="text-[11.5px] font-bold text-zinc-900 dark:text-white leading-tight truncate">
                Join Our Creator Community
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5 truncate">
                Connect. Collaborate. Grow together.
              </p>
            </div>
          </div>

          <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0 ml-1.5">
            <ChevronRight size={13} strokeWidth={2.5} />
          </div>
        </div>

        {/* ── Test Sync Button (Preserved) ── */}
        <button
          onClick={() => setShowTestSync(true)}
          className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Youtube size={14} />
          <span>Test Sync UI</span>
        </button>
        {showTestSync && <OnboardingSyncOverlay nextRoute="/home" />}

        {/* ── Creator Tools Promotion Widget (Preserved) ── */}
        <div 
          onClick={() => navigate('/creator-tools')}
          className={`w-full rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all border shadow-xs ${
            isDarkMode ? 'bg-[#121215] border-zinc-800/80 hover:border-zinc-700' : 'bg-white border-zinc-200/80 hover:border-zinc-300'
          }`}
        >
          <div className="w-full aspect-[16/9] flex items-center justify-center p-3">
            <Lottie 
              animationData={sidebarLottieAnimation} 
              loop={true} 
              style={{ width: '60%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          <div className="w-full p-3 pt-0 flex justify-center">
            <button className={`w-full text-[11px] font-bold uppercase tracking-wider py-2 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-zinc-200' 
                : 'bg-black text-white hover:bg-zinc-800'
            }`}>
              <span>Explore Tools</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* ── 1.5 Growth Tools (Preserved) ────────────────────────────────── */}
        {isCreator && (
          <button
            onClick={() => navigate('/polls/create')}
            className={`
              w-full py-3 px-3.5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group cursor-pointer
              ${isDarkMode 
                ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500 hover:bg-rose-500/10' 
                : 'border-rose-400/40 bg-rose-50/50 hover:border-rose-500 hover:bg-rose-50 shadow-xs'}
            `}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-rose-500 text-white' : 'bg-rose-600 text-white'} group-hover:scale-110 transition-transform shadow-md shadow-rose-500/20`}>
              <BarChart3 size={16} />
            </div>
            <div className="text-center">
              <span className={`block text-[12.5px] font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Create poll for growth</span>
              <span className={`block text-[10px] font-semibold mt-0.5 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>Engage &amp; Grow Your Channel</span>
            </div>
          </button>
        )}

        {/* ── 2. YouTube Channel Overview (YouTube Creators only) ──────────── */}
        {isCreator && (
          <div className="space-y-2.5">
            <h4 className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider px-1">
              Connected Channel
            </h4>

            {youtubeChannels.length > 0 ? (
              <>
                {/* Only show ONE YouTube account card */}
                {youtubeChannels.slice(0, 1).map((channel) => (
                  <div 
                    key={channel.channel_id} 
                    className={`
                      relative overflow-hidden rounded-2xl border transition-all duration-300 group shadow-xs
                      ${isDarkMode 
                        ? 'bg-[#121215] border-zinc-800/80 hover:border-zinc-700' 
                        : 'bg-white border-zinc-200/80 hover:border-zinc-300'}
                    `}
                  >
                    {/* Top YouTube accent stripe */}
                    <div className="h-[3px] w-full bg-[#FF0000] opacity-85" />

                    <div className="p-5 space-y-4">
                      {/* Header: Identity & Brand */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={channel.thumbnail_url || auth1}
                              alt={channel.channel_name}
                              className={`w-12 h-12 rounded-full object-cover border-2 ${isDarkMode ? 'border-border-main' : 'border-zinc-200'}`}
                            />
                            {/* YouTube Mini-Badge */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#FF0000] rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-black">
                              <svg width="8" height="6" viewBox="0 0 24 17" fill="white">
                                <path d="M23.5 2.9c-.3-1-1.1-1.8-2.1-2.1C19.5 0 12 0 12 0S4.5 0 2.6.8C1.6 1.1.8 2 .5 2.9 0 4.8 0 8.5 0 8.5s0 3.7.5 5.6c.3 1 1.1 1.8 2.1 2.1C4.5 17 12 17 12 17s7.5 0 9.4-.8c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.6.5-5.6s0-3.7-.5-5.6z"/>
                                <path d="M9.5 12.1V4.9l6.3 3.6-6.3 3.6z" fill="#FF0000"/>
                              </svg>
                            </div>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-text-main leading-tight truncate group-hover:text-rose-500 transition-colors">
                              {channel.channel_name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                Connected
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => navigate(`/youtube-dashboard/${channel.channel_id}`)}
                          className={`
                            p-1.5 rounded-lg border transition-all cursor-pointer text-text-muted hover:text-text-main
                            ${isDarkMode ? 'border-border-main hover:bg-border-secondary' : 'border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50'}
                          `}
                          title="Open Channel"
                        >
                          <ExternalLink size={13} />
                        </button>
                      </div>

                      {/* Stats Grid: Clean pill container */}
                      <div className={`
                        grid grid-cols-3 gap-2 p-3 rounded-2xl border text-center
                        ${isDarkMode ? 'bg-zinc-900/30 border-border-secondary' : 'bg-zinc-50 border-zinc-100'}
                      `}>
                        {[
                          { value: channel.subscriber_count || 0, label: 'Subs' },
                          { value: channel.view_count || 0, label: 'Views' },
                          { value: channel.video_count || 0, label: 'Videos' },
                        ].map(({ value, label }) => {
                          let displayVal = '0';
                          const num = typeof value === 'string' ? parseInt(value, 10) || 0 : value;
                          if (num >= 1000000) {
                            displayVal = (num / 1000000).toFixed(1) + 'M';
                          } else if (num >= 1000) {
                            displayVal = (num / 1000).toFixed(1) + 'K';
                          } else {
                            displayVal = num.toString();
                          }
                          return (
                            <div key={label} className="flex flex-col items-center">
                              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider scale-90 origin-bottom">
                                {label}
                              </span>
                              <span className="text-[13px] font-bold text-text-main font-display mt-0.5">
                                {displayVal}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Area */}
                      <div className="flex items-center gap-2">
                        <button
                          className={`
                            flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-[11px] font-bold transition-all active:scale-[0.98] cursor-pointer
                            ${isDarkMode 
                              ? 'bg-white text-black hover:bg-zinc-100' 
                              : 'bg-zinc-950 text-white hover:bg-zinc-900 hover:shadow-sm'}
                          `}
                          onClick={() => navigate(`/youtube-dashboard/${channel.channel_id}`)}
                        >
                          <TrendingUp size={13} />
                          Dashboard
                        </button>
                        <button
                          className={`
                            w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer
                            ${isDarkMode 
                              ? 'border-border-main text-text-muted hover:text-text-main hover:bg-border-secondary' 
                              : 'border-zinc-200 text-zinc-950 hover:bg-zinc-100'}
                          `}
                          title="Channel Settings"
                        >
                          <Settings size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* If multiple channels, show "See all your channels" */}
                {youtubeChannels.length > 1 && (
                  <button 
                    onClick={() => navigate('/profile')}
                    className={`
                      w-full h-11 rounded-2xl border-2 border-dashed
                      flex items-center justify-center gap-2 cursor-pointer
                      text-[11px] font-bold transition-all
                      ${isDarkMode
                        ? 'border-border-main text-text-muted hover:text-text-main hover:border-text-muted/50 hover:bg-border-secondary/30'
                        : 'border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white hover:border-solid'}
                    `}
                  >
                    <Plus size={14} />
                    See all your channels
                  </button>
                )}
              </>
            ) : (
              /* No channels connected state: Styled like a dashed file-upload / input area */
              <div 
                onClick={() => navigate('/connect-socials')}
                className={`
                  border-2 border-dashed rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300
                  ${isDarkMode 
                    ? 'border-border-main bg-black/40 hover:border-rose-500/50 hover:bg-rose-500/5' 
                    : 'border-zinc-950 bg-zinc-50/50 hover:bg-zinc-950/10 hover:shadow-sm'}
                `}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-900 text-rose-500' : 'bg-zinc-200 text-rose-600'}`}>
                  <svg width="20" height="15" viewBox="0 0 24 17" fill="currentColor">
                    <path d="M23.5 2.9c-.3-1-1.1-1.8-2.1-2.1C19.5 0 12 0 12 0S4.5 0 2.6.8C1.6 1.1.8 2 .5 2.9 0 4.8 0 8.5 0 8.5s0 3.7.5 5.6c.3 1 1.1 1.8 2.1 2.1C4.5 17 12 17 12 17s7.5 0 9.4-.8c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.6.5-5.6s0-3.7-.5-5.6z"/>
                    <path d="M9.5 12.1V4.9l6.3 3.6-6.3 3.6z" fill="white"/>
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-text-main">No Channels Connected</p>
                  <p className="text-[10px] text-text-muted leading-relaxed max-w-[200px] mx-auto">
                    You don't have any channels. First, go and add your YT channel.
                  </p>
                </div>
                <button 
                  className={`
                    mt-1 px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer
                    ${isDarkMode 
                      ? 'bg-rose-600 text-white hover:bg-rose-700' 
                      : 'bg-zinc-950 text-white hover:bg-zinc-900'}
                  `}
                >
                  Connect Channel
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 3. Story highlights ───────────────────────────────────── */}
        <div>
          <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.1em] px-1 mb-3">
            Archive Collections
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.id}
                className={`
                  flex flex-col items-center gap-1.5 p-3
                  rounded-xl border border-border-main
                  cursor-pointer transition-colors group
                  ${isDarkMode ? 'bg-black' : 'bg-white shadow-lg border-zinc-100'}
                `}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-border-main group-hover:border-text-muted transition-colors bg-border-secondary flex items-center justify-center">
                  {item.isNew ? (
                    <Plus size={16} className="text-text-muted" />
                  ) : item.img ? (
                    <img src={item.img} alt={item.label} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <span className="text-[11px] font-semibold text-text-muted group-hover:text-text-main transition-colors">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />
        <div className="text-center space-y-2.5 pb-4">
          <div className="flex items-center justify-center gap-2.5 text-[10px] text-text-muted select-none">
            <button onClick={() => navigate('/about')} className="hover:text-text-main transition-colors font-semibold cursor-pointer">About</button>
            <span className="w-1 h-1 rounded-full bg-border-main" />
            <button onClick={() => navigate('/privacy')} className="hover:text-text-main transition-colors font-semibold cursor-pointer">Privacy</button>
            <span className="w-1 h-1 rounded-full bg-border-main" />
            <button onClick={() => navigate('/terms')} className="hover:text-text-main transition-colors font-semibold cursor-pointer">Terms</button>
          </div>
          <p className="text-[10px] text-text-muted opacity-70">
            © 2026 SuviX Inc.
          </p>
        </div>
      </div>

      <AccountSwitcher 
        isOpen={isSwitcherOpen} 
        onClose={() => setIsSwitcherOpen(false)} 
      />
    </ReactLenis>
  );
};