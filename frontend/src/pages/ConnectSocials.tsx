import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ArrowRight,
  Plus,
  Check,
  AlertCircle,
  Play,
  Sparkles,
  ShieldCheck,
  Star,
  Zap,
  Flame,
  Instagram,
  Compass,
  RefreshCw,
  Eye,
  Youtube
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useDispatch, useSelector } from 'react-redux';
import {
  setTempSignupData,
  addDiscoveredChannels,
  resetYoutubeDiscovery,
  type YouTubeChannel
} from '../store/slices/onboardingSlice';
import { useCategories } from '../queries/useCategories';
import type { RootState } from '../store';
import { api } from '../api/client';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import { SuccessOverlay } from '../components/shared/SuccessOverlay';
import logo from '../assets/lightlogo.png';
import brandLogo from '../assets/logo.png';

const formatCount = (n: number | string): string => {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
};

const DEFAULT_NICHES = [
  'Tech & Gadgets',
  'Gaming & Esports',
  'Vlogging & Lifestyle',
  'Fitness & Health',
  'Education & Tutorials',
  'Comedy & Entertainment',
  'Music & Audio',
  'Beauty & Fashion',
  'Food & Cooking',
  'Finance & Business',
  'Travel & Adventure',
  'Film & Animation',
  'Automotive',
  'News & Politics',
  'Science & Nature',
];

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

const SOCIAL_PROOF_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=faces',
];

interface LiveIdentityCardProps {
  primaryChannel: YouTubeChannel;
  selectedNiche: string;
  setSelectedNiche: (s: string) => void;
  availableNiches: string[];
  tempSignupData: any;
}

function LiveIdentityCard({
  primaryChannel,
  selectedNiche,
  setSelectedNiche,
  availableNiches,
  tempSignupData,
}: LiveIdentityCardProps) {
  return (
    <div className="w-full space-y-4">
      {/* Minimalist Premium Black & White YouTube Snapshot Card (SuviX themed) */}
      <div className="w-full max-w-md bg-black rounded-3xl border border-zinc-850 shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-5 sm:p-6 space-y-5 sm:space-y-6 text-left relative overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-900 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-100 animate-pulse" />
            <span className="text-[10px] font-black tracking-wider uppercase text-zinc-500">
              Live Identity Card
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-wider">
            YouTube Linked
          </span>
        </div>

        {/* Info */}
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={primaryChannel.thumbnailUrl || 'https://via.placeholder.com/80'}
              alt={primaryChannel.channelName}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-zinc-800 shadow-md shrink-0 filter grayscale hover:grayscale-0 transition-all duration-300"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm sm:text-base font-extrabold text-white truncate leading-tight">
                  {primaryChannel.channelName}
                </h4>
                <div className="w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center shrink-0">
                  <Check size={11} className="text-black" strokeWidth={4} />
                </div>
              </div>
              <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                {primaryChannel.channelHandle || '@creator'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-900">
              <p className="text-[9px] font-black text-zinc-505 uppercase tracking-widest">Subscribers</p>
              <p className="text-sm sm:text-base font-black text-white mt-0.5">
                {formatCount(primaryChannel.subscriberCount)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-900">
              <p className="text-[9px] font-black text-zinc-505 uppercase tracking-widest">Videos</p>
              <p className="text-sm sm:text-base font-black text-white mt-0.5">
                {formatCount(primaryChannel.videoCount)}
              </p>
            </div>
          </div>
        </div>

        {/* Niche Selector in the Card */}
        <div className="space-y-2 relative z-10">
          <label className="block text-[10px] font-black text-zinc-455 uppercase tracking-wider flex items-center gap-1.5">
            <Compass size={12} className="text-zinc-405" />
            Channel Niche / Primary Category
          </label>
          <div className="relative">
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="w-full h-10 sm:h-11 pl-3 sm:pl-4 pr-8 sm:pr-10 rounded-xl border border-zinc-800 bg-zinc-950 text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all cursor-pointer appearance-none"
            >
              <option value="" disabled className="bg-zinc-955 text-zinc-500">
                Select Niche / Category...
              </option>
              {availableNiches.map((niche) => (
                <option key={niche} value={niche} className="bg-zinc-955 text-white">
                  {niche}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
              <Compass size={14} />
            </div>
          </div>
        </div>

        {/* Recent Uploads Grid in Card */}
        {primaryChannel.videos && primaryChannel.videos.length > 0 && (
          <div className="space-y-2 pt-1 relative z-10 border-t border-zinc-900">
            <p className="text-[10px] font-black text-zinc-550 uppercase tracking-wider flex items-center gap-1">
              <Eye size={12} className="text-zinc-600" /> Recent Uploads Preview
            </p>
            <div className="grid grid-cols-3 gap-2">
              {primaryChannel.videos.slice(0, 3).map((v) => (
                <div key={v.id} className="group rounded-lg overflow-hidden border border-zinc-900 bg-zinc-955 filter grayscale hover:grayscale-0 transition-all duration-350">
                  <div className="aspect-video relative bg-zinc-955 overflow-hidden">
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/45 group-hover:bg-transparent transition-colors" />
                  </div>
                  <p className="p-1.5 text-[9px] font-bold text-zinc-350 line-clamp-1 leading-tight">
                    {v.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Connected Instagram Profile Card Placeholder */}
      {tempSignupData?.instagramAccounts && tempSignupData.instagramAccounts.length > 0 && (
        <div className="w-full max-w-md bg-black rounded-3xl border border-zinc-850 shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-5 sm:p-6 space-y-4 text-left relative overflow-hidden text-white animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-100 animate-pulse" />
              <span className="text-[10px] font-black tracking-wider uppercase text-zinc-500">
                Instagram Profile
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-wider">
              Connected
            </span>
          </div>
          {tempSignupData.instagramAccounts.map((account) => (
            <div key={account.accountId} className="flex items-center gap-4">
              <img
                src={account.profilePictureUrl || 'https://via.placeholder.com/80'}
                alt={account.name || account.handle}
                className="w-12 h-12 rounded-2xl object-cover border border-zinc-800 filter grayscale"
              />
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white">@{account.handle}</h4>
                <p className="text-xs text-zinc-450">{account.name}</p>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">
                  {formatCount(account.followerCount || 0)} Followers
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FloatingCreatorShowcase() {
  return (
    <div className="relative w-full aspect-[16/13] max-w-[42rem] mx-auto select-none">
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
            <div className="relative w-full h-full rounded-[1.6rem] overflow-hidden border-[3.5px] border-white bg-white shadow-[0_20px_50px_rgba(0,0,0,0.14),0_6px_15px_rgba(0,0,0,0.08)] transition-all duration-300 group-hover:shadow-[0_28px_65px_rgba(0,0,0,0.22)] group-hover:border-zinc-50">
              <img
                src={card.mediaUrl}
                alt={card.name}
                className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              {card.tag && (
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  {card.badgeIcon === 'viral' && <Flame size={10} className="text-amber-400 fill-amber-400" />}
                  {card.badgeIcon === 'growth' && <Zap size={10} className="text-emerald-400 fill-emerald-400" />}
                  {card.badgeIcon === 'verified' && <Sparkles size={10} className="text-red-400" />}
                  <span>{card.tag}</span>
                </div>
              )}
            </div>

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
          <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-50 animate-ping" />
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-[3px] border-white shadow-[0_14px_35px_rgba(0,0,0,0.25)] flex items-center justify-center p-2.5 overflow-hidden">
            <img src={brandLogo} alt="SuviX" className="w-full h-full object-contain" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ConnectSocials() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const tempSignupData = useSelector((state: RootState) => state.onboarding.tempSignupData);
  const youtubeDiscovery = useSelector((state: RootState) => state.onboarding.youtubeDiscovery);
  const { categories, isLoading: categoriesLoading } = useCategories();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetchStarted = useRef(false);

  // Selected Niche State for YouTube channels
  const [selectedNiche, setSelectedNiche] = useState<string>('');

  // Categories list for niches
  const availableNiches = useMemo(() => {
    const creatorCat = categories.find((c) => c.slug === 'creator' || c.slug === 'yt_influencer');
    if (creatorCat?.subCategories && creatorCat.subCategories.length > 0) {
      return creatorCat.subCategories.map((s) => s.name);
    }
    return DEFAULT_NICHES;
  }, [categories]);

  const rawToken =
    (location.state?.googleAccessToken as string | undefined) ||
    sessionStorage.getItem('youtube_access_token') ||
    undefined;

  const connected = youtubeDiscovery.channels.length > 0;
  const primaryChannel = youtubeDiscovery.channels[0];

  const handleConnectYoutube = () => {
    sessionStorage.setItem('oauth_intent', 'connect_youtube');
    dispatch(resetYoutubeDiscovery());
    sessionStorage.removeItem('youtube_access_token');
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
    async (token: string, showOverlay = true) => {
      if (showOverlay) {
        setIsLoading(true);
      }
      setFetchError(null);
      try {
        const res = await api.post('/auth/youtube/channels', { accessToken: token });
        if (res.data.success) {
          if (!res.data.channels || res.data.channels.length === 0) {
            setFetchError('No YouTube channel found for this Google account. Please connect an account with a YouTube channel.');
            return;
          }
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
          const hasUnclaimed = res.data.channels.some((c: YouTubeChannel) => !c.isClaimed);
          if (showOverlay && hasUnclaimed) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
          }
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

  // 2. Category Auto-heal
  useEffect(() => {
    if (categoriesLoading) return;
    if (!tempSignupData?.categoryId && categories.length > 0) {
      const ytCat = categories.find((c) => c.slug === 'creator' || c.slug === 'yt_influencer');
      if (ytCat) {
        const data = {
          categoryId: ytCat.id,
          categorySlug: ytCat.slug,
          roleGroup: ytCat.roleGroup,
          roleName: ytCat.name,
          onboardingStep: 'role' as const,
          ...(tempSignupData?.authMethod ? { authMethod: tempSignupData.authMethod } : {}),
          ...(tempSignupData?.intent ? { intent: tempSignupData.intent } : {}),
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
      const hasFreshToken = Boolean(location.state?.googleAccessToken);
      fetchChannels(token, hasFreshToken);
    }
  }, [rawToken, fetchChannels, location.state, youtubeDiscovery.channels.length]);

  /**
   * Complete Social Account Linking and Proceed to Sign Up
   */
  const handleProceedToSignup = () => {
    const ytCat = categories.find((c) => c.slug === 'creator' || c.slug === 'yt_influencer');

    // Attach Niche directly to connected channels
    const formattedYoutubeChannels = youtubeDiscovery.channels
      .filter((c) => !c.isClaimed)
      .map((channel, index: number) => ({
        channelId: channel.channelId,
        channelName: channel.channelName,
        thumbnailUrl: channel.thumbnailUrl || null,
        subscriberCount: Number(channel.subscriberCount || 0),
        videoCount: Number(channel.videoCount || 0),
        isPrimary: index === 0,
        isVerified: true,
        niche: selectedNiche,
        subCategoryName: selectedNiche,
        videos: channel.videos || [],
      }));

    const updatePayload = {
      role: 'creator' as const,
      categoryId: tempSignupData?.categoryId || ytCat?.id || 'creator',
      categorySlug: ytCat?.slug ?? 'creator',
      youtubeChannels: formattedYoutubeChannels,
      instagramAccounts: tempSignupData?.instagramAccounts || [],
      onboardingStep: 'details' as const,
    };

    dispatch(setTempSignupData(updatePayload));
    try {
      const raw = sessionStorage.getItem('suvix_temp_signup_data');
      const cur = raw ? JSON.parse(raw) : {};
      sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify({ ...cur, ...updatePayload }));
    } catch {
      // ignore
    }

    const isGoogleFlow = tempSignupData?.authMethod === 'google';
    if (isGoogleFlow) {
      if (tempSignupData?.socialProfile) {
        navigate('/complete-profile');
      } else {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';
        window.location.href = `${apiUrl}/auth/google`;
      }
    } else {
      navigate('/signup');
    }
  };

  /**
   * Skip All Social Connections (Not Recommended)
   */
  const handleSkipAllConnections = () => {
    const ytCat = categories.find((c) => c.slug === 'creator' || c.slug === 'yt_influencer');
    const updatePayload = {
      ...tempSignupData,
      role: 'creator' as const,
      categoryId: tempSignupData?.categoryId || ytCat?.id || 'creator',
      categorySlug: 'creator' as const,
      youtubeChannels: [],
      instagramAccounts: [],
      onboardingStep: 'details' as const,
    };

    dispatch(setTempSignupData(updatePayload));
    try {
      sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify(updatePayload));
    } catch {
      // ignore
    }

    const isGoogleFlow = tempSignupData?.authMethod === 'google';
    if (isGoogleFlow) {
      if (tempSignupData?.socialProfile) {
        navigate('/complete-profile');
      } else {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';
        window.location.href = `${apiUrl}/auth/google`;
      }
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col relative overflow-x-hidden selection:bg-red-500 selection:text-white">
      {/* ── ARCHITECTURAL GRID BACKGROUND ─────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
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
            <span>Step 2 of 3 • Link Social Profiles</span>
          </div>

          <button
            onClick={() => {
              dispatch(resetYoutubeDiscovery());
              sessionStorage.removeItem('youtube_access_token');
              navigate('/role-selection');
            }}
            className="h-10 px-4 rounded-xl border border-zinc-200/90 bg-white/80 backdrop-blur-md text-zinc-700 hover:text-zinc-950 hover:bg-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 group active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Change Role</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 pt-2 pb-28 relative z-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

          {/* ── LEFT COLUMN: CENTRAL CONNECTOR HUB (7 Cols on lg) ──────────── */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:space-y-8 max-w-2xl mx-auto lg:mx-0 w-full"
          >
            {/* Main Headline */}
            <div className="space-y-2">
              <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950 leading-[1.15]">
                Connect Your{' '}
                <span className="relative inline-block text-zinc-950">
                  Creator Accounts
                  <span className="absolute left-0 bottom-1 w-full h-3 bg-amber-400/35 -z-10 rounded-sm transform -rotate-1" />
                </span>
              </h1>
              
              <p className="text-xs sm:text-sm md:text-base text-zinc-650 font-normal leading-relaxed">
                Link your channels and social profiles to verify your audience, unlock direct brand sponsorships, and auto-match with vetted video editors.
              </p>
            </div>

            {/* ── CONNECTOR CARDS HUB ────────────────────────────────────────── */}
            <div className="w-full space-y-4 pt-2">
              
              {/* 1. YOUTUBE CONNECTOR */}
              <div className={`w-full rounded-2xl border p-4 sm:p-5 transition-all duration-350 ${
                connected 
                  ? 'bg-red-50/20 border-red-200/90 shadow-sm' 
                  : 'bg-white border-zinc-200/90 hover:border-zinc-300 shadow-sm'
              }`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shrink-0">
                      <Play size={18} className="fill-white ml-0.5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2 flex-wrap">
                        YouTube Channel
                        {connected ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-black">
                            <Check size={12} strokeWidth={3.5} /> Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[9px] font-black uppercase tracking-wider animate-pulse">
                            Link Required
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {connected ? `${primaryChannel.channelName} (${formatCount(primaryChannel.subscriberCount)} subs)` : 'Sync subscriber analytics, recent uploads & verify your identity.'}
                      </p>
                    </div>
                  </div>

                  {!connected ? (
                    <Button
                      onClick={handleConnectYoutube}
                      disabled={isLoading}
                      className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shrink-0 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play size={12} className="fill-white" />
                      <span>Link YouTube</span>
                    </Button>
                  ) : (
                    <button
                      onClick={handleConnectYoutube}
                      className="h-8 px-3 rounded-lg border border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-900 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <RefreshCw size={11} />
                      <span>Switch</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. INSTAGRAM CONNECTOR (Optional / Multi-Platform) */}
              <div className="w-full rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 text-left">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-md shrink-0">
                    <Instagram size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2">
                      Instagram Profile
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[9px] font-bold">
                        Optional
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Sync Reels engagement, follower demographics & rate cards.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => alert("Instagram OAuth integration is in beta. You can link this later from your Creator Dashboard settings!")}
                  className="h-10 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Link Instagram</span>
                </Button>
              </div>

              {fetchError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 text-left text-red-600 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                  <span>{fetchError}</span>
                </div>
              )}
            </div>

            {/* Mobile-only Live Identity Card (renders above action controls on mobile) */}
            {connected && primaryChannel && (
              <div className="w-full lg:hidden pt-2 pb-4">
                <LiveIdentityCard
                  primaryChannel={primaryChannel}
                  selectedNiche={selectedNiche}
                  setSelectedNiche={setSelectedNiche}
                  availableNiches={availableNiches}
                  tempSignupData={tempSignupData}
                />
              </div>
            )}

            {/* ── ACTION CONTROLS: CONTINUE & SKIP ───────────────────────────── */}
            <div className="w-full pt-2 space-y-3">
              <div className="space-y-3">
                <Button
                  onClick={handleProceedToSignup}
                  disabled={!connected || (connected && !selectedNiche)}
                  className={`w-full h-13 sm:h-15 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all ${
                    (!connected || (connected && !selectedNiche))
                      ? 'bg-zinc-100 border border-zinc-250 text-zinc-400 cursor-not-allowed'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-xl shadow-zinc-950/10 cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  <span>Continue to Account Details</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </Button>

                {connected && !selectedNiche && (
                  <p className="text-center text-xs font-semibold text-amber-600 animate-pulse">
                    ⚠️ Please select your channel niche in the preview card to continue.
                  </p>
                )}

                {/* Skip button: visible ONLY before connecting any channel */}
                {!connected && (
                  <button
                    type="button"
                    onClick={handleSkipAllConnections}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-zinc-650 hover:text-zinc-900 hover:bg-zinc-100/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Skip and setup manually</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700">
                      Not recommended
                    </span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-2 pt-1 text-[11px] font-medium text-zinc-500">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>Google Verified OAuth • Read-only discovery • 100% Privacy Protected</span>
              </div>
            </div>

            {/* Social Proof Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 text-left border-t border-zinc-200/70 w-full">
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
          </motion.div>

          {/* ── RIGHT COLUMN: SHOWCASE OR DYNAMIC PREVIEW CARD (5 Cols on lg) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:col-span-5 flex flex-col items-center justify-center relative py-4"
          >
            {connected && primaryChannel ? (
              <div className="hidden lg:block w-full space-y-4 animate-fadeIn">
                <LiveIdentityCard
                  primaryChannel={primaryChannel}
                  selectedNiche={selectedNiche}
                  setSelectedNiche={setSelectedNiche}
                  availableNiches={availableNiches}
                  tempSignupData={tempSignupData}
                />
              </div>
            ) : (
              <div className="hidden lg:block w-full">
                <FloatingCreatorShowcase />
              </div>
            )}
          </motion.div>

        </div>
      </main>
    </div>
  );
}
