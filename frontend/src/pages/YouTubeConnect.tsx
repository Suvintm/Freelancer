import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import LottieComponent from 'lottie-react';
import youtubeLoaderAnimation from '../assets/lottie/youtube_loader.json';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

import {
  ChevronLeft,
  ArrowRight,
  Plus,
  Check,
  Users,
  Video,
  AlertCircle,
  Play,
  Sparkles,
  ShieldCheck,
  Star,
  Award,
  Zap,
  Flame
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useDispatch, useSelector } from 'react-redux';
import { setTempSignupData, addDiscoveredChannels } from '../store/slices/onboardingSlice';
import { useCategories } from '../queries/useCategories';
import type { RootState } from '../store';
import { api } from '../api/client';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import logo from '../assets/lightlogo.png';
import brandLogo from '../assets/logo.png';

const formatCount = (n: number | string): string => {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
};

// ── Showcase 3D Cards Data ────────────────────────────────────────────────
interface CreatorCardData {
  id: string;
  name: string;
  handle: string;
  subscribers: string;
  avatar: string;
  mediaUrl: string;
  mediaType: 'short' | 'video';
  tag?: string;
  badgeIcon?: 'growth' | 'verified' | 'viral';
  positionClass: string;
  rotation: number;
  zIndex: number;
  chipPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  floatDuration: number;
  floatDelay: number;
}

const SHOWCASE_CARDS: CreatorCardData[] = [
  {
    id: 'vanessa-lau',
    name: 'Vanessa Lau',
    handle: '@VanessaLau',
    subscribers: '954K subscribers',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    mediaUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=650&fit=crop',
    mediaType: 'short',
    tag: '⚡ Top Educator',
    badgeIcon: 'verified',
    positionClass: 'w-[42%] sm:w-[38%] aspect-[3/4] top-[0%] left-[2%]',
    rotation: -5,
    zIndex: 20,
    chipPosition: 'bottom-right',
    floatDuration: 5.2,
    floatDelay: 0,
  },
  {
    id: 'jenny-hoyos',
    name: 'Jenny Hoyos',
    handle: '@JennyHoyos',
    subscribers: '9M subscribers',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces',
    mediaUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&h=750&fit=crop',
    mediaType: 'short',
    tag: '🔥 100M+ Monthly Views',
    badgeIcon: 'viral',
    positionClass: 'w-[44%] sm:w-[42%] aspect-[3/4.2] top-[2%] right-[1%]',
    rotation: 5,
    zIndex: 25,
    chipPosition: 'bottom-left',
    floatDuration: 5.8,
    floatDelay: 0.7,
  },
  {
    id: 'saucestache',
    name: 'Sauce Stache',
    handle: '@SauceStache',
    subscribers: '655K subscribers',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
    mediaUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&h=400&fit=crop',
    mediaType: 'video',
    tag: '🍳 Studio Creator',
    badgeIcon: 'growth',
    positionClass: 'w-[46%] sm:w-[42%] aspect-[16/11] bottom-[12%] left-[0%]',
    rotation: -3,
    zIndex: 15,
    chipPosition: 'bottom-right',
    floatDuration: 6.2,
    floatDelay: 1.2,
  },
  {
    id: 'danie-jay',
    name: 'Danie Jay',
    handle: '@DanieJay',
    subscribers: '80K subscribers',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces',
    mediaUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&h=650&fit=crop',
    mediaType: 'short',
    tag: '📈 +310% YoY',
    badgeIcon: 'growth',
    positionClass: 'w-[40%] sm:w-[36%] aspect-[3/4] bottom-[0%] left-[30%]',
    rotation: 2,
    zIndex: 35,
    chipPosition: 'bottom-left',
    floatDuration: 4.8,
    floatDelay: 0.3,
  },
  {
    id: 'devin-supertramp',
    name: 'Devin Super Tramp',
    handle: '@devinsupertramp',
    subscribers: '6.4M subscribers',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
    mediaUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&h=400&fit=crop',
    mediaType: 'video',
    tag: '🎬 4K Action Films',
    badgeIcon: 'verified',
    positionClass: 'w-[46%] sm:w-[44%] aspect-[16/11] bottom-[8%] right-[0%]',
    rotation: 4,
    zIndex: 18,
    chipPosition: 'bottom-left',
    floatDuration: 5.5,
    floatDelay: 1.5,
  },
];

// Top Creator Avatars for the Social Proof Bar
const SOCIAL_PROOF_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=faces',
];

function FloatingCreatorShowcase() {
  return (
    <div className="relative w-full aspect-[16/13] max-w-[42rem] mx-auto select-none">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-red-500/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      {SHOWCASE_CARDS.map((card) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 30, rotate: card.rotation, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, rotate: card.rotation, scale: 1 }}
          transition={{ duration: 0.8, delay: card.floatDelay * 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ zIndex: card.zIndex }}
          className={`absolute ${card.positionClass}`}
        >
          {/* Continuous Floating Bob Animation */}
          <motion.div
            animate={{
              y: [0, -12, 0],
              rotate: [card.rotation, card.rotation + (card.rotation > 0 ? 1 : -1), card.rotation],
            }}
            transition={{
              duration: card.floatDuration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: card.floatDelay,
            }}
            className="relative w-full h-full group cursor-pointer"
          >
            {/* Card Container with 3D Depth & Shadow */}
            <div className="relative w-full h-full rounded-[1.6rem] overflow-hidden border-[3.5px] border-white bg-white shadow-[0_20px_50px_rgba(0,0,0,0.14),0_6px_15px_rgba(0,0,0,0.08)] transition-all duration-300 group-hover:shadow-[0_28px_65px_rgba(0,0,0,0.22)] group-hover:border-zinc-50">
              <img
                src={card.mediaUrl}
                alt={card.name}
                className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              {/* Tag / Micro Badge on Image */}
              {card.tag && (
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  {card.badgeIcon === 'viral' && <Flame size={10} className="text-amber-400 fill-amber-400" />}
                  {card.badgeIcon === 'growth' && <Zap size={10} className="text-emerald-400 fill-emerald-400" />}
                  {card.badgeIcon === 'verified' && <Sparkles size={10} className="text-red-400" />}
                  <span>{card.tag}</span>
                </div>
              )}
            </div>

            {/* Creator Identity Chip (Float Overlay Pill) */}
            <div
              className={`absolute ${
                card.chipPosition === 'bottom-left'
                  ? '-bottom-4 -left-4 sm:-bottom-5 sm:-left-5'
                  : '-bottom-4 -right-4 sm:-bottom-5 sm:-right-5'
              } z-40 bg-white rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.18)] border border-zinc-100/90 pl-1.5 pr-4 py-1.5 flex items-center gap-2.5 whitespace-nowrap transition-transform duration-300 group-hover:scale-105`}
            >
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                <img src={card.avatar} alt={card.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col leading-tight pr-1">
                <span className="text-[11px] font-black text-zinc-900 tracking-tight flex items-center gap-1">
                  {card.handle}
                </span>
                <span className="text-[9.5px] font-semibold text-zinc-500">{card.subscribers}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ))}

      {/* Central Brand Mark / Nexus Center Hub */}
      <motion.div
        initial={{ scale: 0, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 150, damping: 14, delay: 0.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex items-center justify-center"
        >
          {/* Pulsing Backlight */}
          <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-50 animate-ping" />
          
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-[3px] border-white shadow-[0_14px_35px_rgba(0,0,0,0.25)] flex items-center justify-center p-2.5 overflow-hidden">
            <img src={brandLogo} alt="SuviX" className="w-full h-full object-contain" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function YouTubeConnect() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const tempSignupData = useSelector((state: RootState) => state.onboarding.tempSignupData);
  const youtubeDiscovery = useSelector((state: RootState) => state.onboarding.youtubeDiscovery);
  const { categories, isLoading: categoriesLoading } = useCategories();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetchStarted = useRef(false);

  const rawToken =
    (location.state?.googleAccessToken as string | undefined) ||
    sessionStorage.getItem('youtube_access_token') ||
    undefined;

  const connected = youtubeDiscovery.channels.length > 0;
  const hasUnclaimedChannel = youtubeDiscovery.channels.some((c) => !c.isClaimed);

  const handleConnect = () => {
    // Flag so OAuthSuccess knows we are ONLY fetching channels, not logging in
    sessionStorage.setItem('oauth_intent', 'connect_youtube');
    if (tempSignupData?.categoryId) {
      try {
        sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify(tempSignupData));
      } catch {
        // ignore
      }
    }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';
    window.location.href = `${apiUrl}/auth/google/youtube`;
  };

  const fetchChannels = useCallback(
    async (token: string) => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await api.post('/auth/youtube/channels', { accessToken: token });
        if (res.data.success) {
          dispatch(addDiscoveredChannels(res.data.channels));
          const updates: Record<string, unknown> = {};
          if (res.data.discoveryToken) {
            updates.discoveryToken = res.data.discoveryToken;
          }
          if (res.data.googleUser?.email) {
            updates.socialProfile = {
              name: res.data.googleUser.name || '',
              email: res.data.googleUser.email,
              picture: res.data.googleUser.picture || undefined,
              googleId: res.data.googleUser.googleId || '',
            };
          }
          if (Object.keys(updates).length > 0) {
            dispatch(setTempSignupData(updates));
            try {
              const raw = sessionStorage.getItem('suvix_temp_signup_data');
              const cur = raw ? JSON.parse(raw) : {};
              sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify({ ...cur, ...updates }));
            } catch {
              // ignore
            }
          }
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        } else {
          throw new Error(res.data.message || 'Failed to fetch channels');
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        setFetchError(error.response?.data?.message || error.message || 'Unable to connect. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch]
  );

  // 1. Session Storage State Recovery
  useEffect(() => {
    if (!tempSignupData?.categoryId) {
      try {
        const rawBackup = sessionStorage.getItem('suvix_temp_signup_data');
        if (rawBackup) {
          const parsed = JSON.parse(rawBackup);
          if (parsed?.categoryId) {
            dispatch(setTempSignupData(parsed));
          }
        }
      } catch {
        // ignore
      }
    }
  }, [tempSignupData, dispatch]);

  // 2. Category Auto-heal (prevent redirecting out if categories are ready)
  useEffect(() => {
    if (categoriesLoading) return;
    if (!tempSignupData?.categoryId && categories.length > 0) {
      const ytCat = categories.find((c) => c.slug === 'yt_influencer' || c.slug === 'creator');
      if (ytCat) {
        const data = {
          categoryId: ytCat.id,
          categorySlug: ytCat.slug,
          roleGroup: ytCat.roleGroup,
          roleName: ytCat.name,
          onboardingStep: 'role' as const,
        };
        dispatch(setTempSignupData(data));
        try {
          sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify(data));
        } catch {
          // ignore
        }
      } else {
        navigate('/role-selection', { replace: true });
      }
    }
  }, [categories, categoriesLoading, tempSignupData, dispatch, navigate]);

  // 3. Channel Fetch on Token Arrival
  useEffect(() => {
    const token = rawToken;
    if (token && youtubeDiscovery.channels.length === 0 && !fetchStarted.current) {
      fetchStarted.current = true;
      fetchChannels(token);
    }
  }, [rawToken, fetchChannels, youtubeDiscovery.channels.length]);

  /**
   * Save channel data (without niche — that comes next) and go to niche selection page.
   */
  const handleNext = () => {
    const ytCat = categories.find((c) => c.slug === 'yt_influencer' || c.slug === 'creator');

    const youtubeChannels = youtubeDiscovery.channels
      .filter((c) => !c.isClaimed)
      .map((channel, index: number) => ({
        channelId: channel.channelId,
        channelName: channel.channelName,
        thumbnailUrl: channel.thumbnailUrl || null,
        subscriberCount: Number(channel.subscriberCount || 0),
        videoCount: Number(channel.videoCount || 0),
        isPrimary: index === 0,
        isVerified: true,
        videos: channel.videos || [],
      }));

    const updatePayload = {
      categorySlug: ytCat?.slug ?? 'yt_influencer',
      youtubeChannels,
      onboardingStep: 'youtube' as const,
    };

    dispatch(setTempSignupData(updatePayload));
    try {
      const raw = sessionStorage.getItem('suvix_temp_signup_data');
      const cur = raw ? JSON.parse(raw) : {};
      sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify({ ...cur, ...updatePayload }));
    } catch {
      // ignore
    }

    navigate('/youtube-niche');
  };

  if (categoriesLoading) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-40 h-40 flex items-center justify-center">
            <Lottie
              animationData={youtubeLoaderAnimation}
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2">
            Initializing Sync...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#fcfcfd] text-zinc-900 flex flex-col relative overflow-x-hidden selection:bg-red-500 selection:text-white font-sans">
      
      {/* ── ARCHITECTURAL GRID BACKGROUND ─────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Subtle geometric grid background */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(228, 228, 231, 0.7) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(228, 228, 231, 0.7) 1px, transparent 1px)
            `,
            backgroundSize: '44px 44px',
          }}
        />

        {/* Ambient Top Glows */}
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[80rem] h-[35rem] bg-gradient-to-b from-amber-500/10 via-red-500/5 to-transparent rounded-full blur-[130px]" />
        <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-amber-400/[0.08] rounded-full blur-[140px]" />
      </div>

      <LoadingOverlay isVisible={isLoading} theme="youtube" message="Verifying YouTube Channel with Google..." />
      <SuccessOverlay isVisible={showSuccess} type="youtube" title="Channel Verified!" message="YouTube identity synced successfully." />

      {/* ── TOP NAVIGATION ────────────────────────────────────────────────── */}
      <header className="relative z-50 w-full px-6 py-6 md:px-12 md:py-8 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="SuviX" className="h-7 md:h-9 object-contain" />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-zinc-200 shadow-sm text-xs font-semibold text-zinc-600">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Step 2 of 3 • Channel Verification</span>
          </div>

          <button
            onClick={() => navigate('/role-selection')}
            className="h-10 px-4 rounded-xl border border-zinc-200/90 bg-white/80 backdrop-blur-md text-zinc-700 hover:text-zinc-950 hover:bg-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 group active:scale-95"
          >
            <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Change Role</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 pt-4 pb-28 relative z-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">

          {/* ── LEFT COLUMN: HERO & ACTION HUB (5 Cols on lg) ──────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 max-w-xl mx-auto lg:mx-0"
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-300/80 bg-white shadow-sm">
              <span className="text-[10px] font-black text-zinc-800 tracking-[0.18em] uppercase">
                #1 YouTube SEO & Growth Tool
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight text-zinc-950 leading-[1.12]">
                Get More{' '}
                <span className="relative inline-block text-zinc-950">
                  Views &amp;
                  {/* Subtle highlight brush underline */}
                  <span className="absolute left-0 bottom-1 w-full h-3 bg-amber-400/35 -z-10 rounded-sm transform -rotate-1" />
                </span>
                <br />
                Subscribers on YouTube
              </h1>
              
              <p className="text-sm sm:text-base text-zinc-600 font-normal leading-relaxed max-w-lg">
                Optimize your content, gain visibility, and grow faster on YouTube. SuviX is an all-in-one optimization platform with powerful YouTube SEO, verified brand sponsorships, and video editor collaboration.
              </p>
            </div>

            {/* Primary Action Button (CTA) */}
            <div className="w-full sm:max-w-md pt-2 space-y-3">
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className={`w-full h-14 sm:h-16 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-[0.98] ${
                  connected
                    ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl shadow-zinc-900/10'
                    : 'bg-[#ffb703] hover:bg-[#fb8500] text-zinc-950 shadow-[0_12px_28px_rgba(251,133,0,0.3)] hover:shadow-[0_16px_34px_rgba(251,133,0,0.4)]'
                }`}
              >
                {connected ? (
                  <>
                    <Plus size={20} strokeWidth={3} />
                    <span>Connect Another Channel</span>
                  </>
                ) : (
                  <>
                    <span className="w-7 h-7 rounded-lg bg-black/10 flex items-center justify-center">
                      <Play size={14} className="fill-current text-current ml-0.5" />
                    </span>
                    <span>Connect YouTube Channel</span>
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </>
                )}
              </Button>

              {/* OAuth Trust & Security Notice */}
              <div className="flex items-center justify-center lg:justify-start gap-2 pt-1 text-[11px] font-medium text-zinc-500">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>Google Verified OAuth • Read-only discovery • 100% Privacy Protected</span>
              </div>

              {fetchError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 text-left text-red-600 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                  <span>{fetchError}</span>
                </div>
              )}
            </div>

            {/* Social Proof Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 text-left border-t border-zinc-200/70 w-full">
              {/* Creator Avatars */}
              <div className="flex -space-x-2.5 overflow-hidden p-0.5">
                {SOCIAL_PROOF_AVATARS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Creator"
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-sm"
                  />
                ))}
              </div>

              {/* Stars & Text */}
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-zinc-800 mt-1">
                  10M+ creators worldwide trust SuviX
                </span>
              </div>
            </div>

            {/* External Trust Badges */}
            <div className="flex items-center gap-3 pt-1">
              <div className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 shadow-sm flex items-center gap-2 text-[11px] font-bold text-zinc-700">
                <span className="text-amber-500 font-extrabold">★ 4.8</span>
                <span className="text-zinc-400">|</span>
                <span>10K+ reviews</span>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 shadow-sm flex items-center gap-2 text-[11px] font-bold text-zinc-700">
                <Award size={13} className="text-amber-500" />
                <span>4.9 G2 · Top Rated 2025</span>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT COLUMN: 3D FLOATING CREATOR COLLAGE (6 Cols on lg) ───── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 w-full flex flex-col items-center justify-center relative py-4"
          >
            {/* Discovered Channels View (When Connected) */}
            {connected ? (
              <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
                      Channel Discovered
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Verified
                  </span>
                </div>

                {youtubeDiscovery.channels.map((channel) => (
                  <div
                    key={channel.channelId}
                    className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center gap-4"
                  >
                    <img
                      src={channel.thumbnailUrl || 'https://via.placeholder.com/80'}
                      alt={channel.channelName}
                      className="w-16 h-16 rounded-xl object-cover border border-white shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-zinc-900 truncate">
                        {channel.channelName}
                      </h4>
                      <p className="text-xs text-zinc-500 font-medium">{channel.channelHandle || '@creator'}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs font-bold text-zinc-700">
                        <span className="flex items-center gap-1 text-red-600">
                          <Users size={13} /> {formatCount(channel.subscriberCount)}
                        </span>
                        <span className="text-zinc-300">•</span>
                        <span className="flex items-center gap-1 text-zinc-600">
                          <Video size={13} /> {formatCount(channel.videoCount)} videos
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <Button
                    onClick={handleNext}
                    className="w-full h-13 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>Continue to Select Niche</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              /* 3D Floating Creator Showcase (Default Hero) */
              <FloatingCreatorShowcase />
            )}
          </motion.div>

        </div>
      </main>

      {/* ── STICKY BOTTOM HUD (When Connected) ────────────────────────────── */}
      {connected && (
        <div className="fixed bottom-6 inset-x-4 md:bottom-8 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-xl bg-white/90 backdrop-blur-xl border border-zinc-200/90 p-4 rounded-2xl flex items-center justify-between gap-4 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
            <div className="flex items-center gap-3 pl-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <Check size={18} strokeWidth={3} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Channel Status</p>
                <p className="text-xs font-bold text-zinc-900">
                  {hasUnclaimedChannel
                    ? `${youtubeDiscovery.channels.filter((c) => !c.isClaimed).length} Channel ready to link`
                    : 'All channels claimed'}
                </p>
              </div>
            </div>

            <Button
              size="default"
              disabled={!hasUnclaimedChannel}
              onClick={handleNext}
              className="h-11 px-6 rounded-xl font-bold text-xs bg-zinc-950 hover:bg-zinc-800 text-white flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <span>Next: Choose Niche</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
