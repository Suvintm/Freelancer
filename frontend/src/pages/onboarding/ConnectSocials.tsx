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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useDispatch, useSelector } from 'react-redux';
import {
  setTempSignupData,
  addDiscoveredChannels,
  resetYoutubeDiscovery,
  setInstagramAccounts,
  resetInstagramAccounts,
  type YouTubeChannel,
  type InstagramAccount,
} from '../../store/slices/onboardingSlice';
import { useCategories } from '../../queries/useCategories';
import type { RootState } from '../../store';
import { api } from '../../api/client';
import { LoadingOverlay } from '../../components/shared/LoadingOverlay';
import { SuccessOverlay } from '../../components/shared/SuccessOverlay';
import logo from '../../assets/lightlogo.png';
import brandLogo from '../../assets/logo.png';

// ── Local Showcase Video Assets ───────────────────────────────────────────
import video1V from '../../assets/cardassets/video1V.mp4';
import video2V from '../../assets/cardassets/video2V.mp4';
import video3V from '../../assets/cardassets/video3V.mp4';
import video5H from '../../assets/cardassets/video5H.mp4';
import video6H from '../../assets/cardassets/video6H.mp4';

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
  videoUrl?: string;
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
    videoUrl: video1V,
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
    videoUrl: video2V,
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
    videoUrl: video5H,
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
    videoUrl: video3V,
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
    videoUrl: video6H,
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


function ShowcaseVideo({ videoUrl, poster, alt }: { videoUrl: string; poster: string; alt: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = true;

    const playVideo = () => {
      video.play().catch(() => {
        // Fallback for browsers that require user gesture on first load
        const retry = () => {
          video.play().catch(() => {});
          window.removeEventListener('touchstart', retry);
          window.removeEventListener('click', retry);
        };
        window.addEventListener('touchstart', retry, { once: true });
        window.addEventListener('click', retry, { once: true });
      });
    };

    if (video.readyState >= 2) {
      playVideo();
    } else {
      video.addEventListener('loadeddata', playVideo, { once: true });
      video.addEventListener('canplay', playVideo, { once: true });
    }

    return () => {
      video.removeEventListener('loadeddata', playVideo);
      video.removeEventListener('canplay', playVideo);
    };
  }, [videoUrl]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-label={alt}
        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
      />
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
              {card.videoUrl ? (
                <ShowcaseVideo videoUrl={card.videoUrl} poster={card.mediaUrl} alt={card.name} />
              ) : (
                <img
                  src={card.mediaUrl}
                  alt={card.name}
                  className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

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
  const instagramAccounts = useSelector((state: RootState) => state.onboarding.creatorData?.instagramAccounts || []);
  const { categories, isLoading: categoriesLoading } = useCategories();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showInstaSuccess, setShowInstaSuccess] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [instaFetchError, setInstaFetchError] = useState<string | null>(null);
  const fetchStarted = useRef(false);
  const instaFetchStarted = useRef(false);

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

  const isInstaOAuthPending = 
    localStorage.getItem('instagram_oauth_pending') === 'true' || 
    sessionStorage.getItem('oauth_intent') === 'connect_instagram';

  const rawInstaToken = isInstaOAuthPending
    ? (sessionStorage.getItem('instagram_access_token') || localStorage.getItem('instagram_access_token') || undefined)
    : (location.state?.instagramAccessToken as string | undefined);


  const connected = youtubeDiscovery.channels.length > 0;
  const primaryChannel = youtubeDiscovery.channels[0];
  const isChannelClaimed = connected && Boolean(primaryChannel?.isClaimed);

  const freshChannels = youtubeDiscovery.channels.filter((c) => !c.isClaimed);
  const hasFreshYoutube = freshChannels.length > 0;
  const hasFreshInstagram = instagramAccounts.length > 0;
  const hasAnyValidSocial = hasFreshYoutube || hasFreshInstagram;
  const isContinueDisabled = !hasAnyValidSocial || (hasFreshYoutube && !selectedNiche);

  const instaConnected = instagramAccounts.length > 0;
  const primaryInstaAccount = instagramAccounts[0];

  const handleConnectYoutube = () => {
    sessionStorage.setItem('oauth_intent', 'connect_youtube');
    // Preserve any currently connected Instagram accounts across the redirect
    if (instagramAccounts && instagramAccounts.length > 0) {
      try {
        sessionStorage.setItem('suvix_saved_instagram_accounts', JSON.stringify(instagramAccounts));
      } catch {
        // ignore
      }
    }
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

  const handleConnectInstagram = () => {
    sessionStorage.setItem('oauth_intent', 'connect_instagram');
    // Save to localStorage so it survives the full-page navigation to Instagram and back
    localStorage.setItem('instagram_oauth_pending', 'true');
    // Preserve any currently connected YouTube channels across the redirect
    if (youtubeDiscovery.channels && youtubeDiscovery.channels.length > 0) {
      try {
        sessionStorage.setItem('suvix_saved_youtube_channels', JSON.stringify(youtubeDiscovery.channels));
      } catch {
        // ignore
      }
    }
    dispatch(resetInstagramAccounts());
    sessionStorage.removeItem('instagram_access_token');
    localStorage.removeItem('instagram_access_token');
    if (tempSignupData?.categoryId) {
      try {
        sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify(tempSignupData));
        // Also persist to localStorage so OnboardingGuard can recover it on return
        localStorage.setItem('suvix_temp_signup_data_backup', JSON.stringify(tempSignupData));
      } catch {
        // ignore
      }
    }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';
    window.location.href = `${apiUrl}/auth/meta/instagram`;
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
          try {
            sessionStorage.setItem('suvix_saved_youtube_channels', JSON.stringify(res.data.channels));
          } catch {
            // ignore
          }
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
          if (showOverlay && (hasUnclaimed || res.data.channels.length > 0)) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2400);
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

  const fetchInstagramAccounts = useCallback(
    async (token: string, showOverlay = true) => {
      if (showOverlay) setIsLoading(true);
      setInstaFetchError(null);
      try {
        const res = await api.post('/auth/instagram/accounts', { accessToken: token });
        if (res.data.success) {
          if (!res.data.accounts || res.data.accounts.length === 0) {
            setInstaFetchError('No Instagram account found. Please ensure it is a Creator or Business account.');
            return;
          }
          dispatch(setInstagramAccounts(res.data.accounts));
          try {
            sessionStorage.setItem('suvix_saved_instagram_accounts', JSON.stringify(res.data.accounts));
          } catch {
            // ignore
          }
          
          if (showOverlay) {
            setShowInstaSuccess(true);
            setTimeout(() => setShowInstaSuccess(false), 2400);
          }
        } else {
          throw new Error(res.data.message || 'Failed to fetch Instagram accounts');
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        sessionStorage.removeItem('instagram_access_token');
        localStorage.removeItem('instagram_access_token');
        localStorage.removeItem('instagram_oauth_pending');
        sessionStorage.removeItem('oauth_intent');
        setInstaFetchError(error.response?.data?.message || error.message || 'Unable to connect. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch]
  );

  // Intercept instaToken from hash if returning from backend OAuth redirect
  // NOTE: must be defined AFTER fetchInstagramAccounts to avoid ReferenceError
  useEffect(() => {
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const instaTokenFromHash = hashParams.get('instaToken');
      if (instaTokenFromHash) {
        // Save to BOTH storages for reliability
        sessionStorage.setItem('instagram_access_token', instaTokenFromHash);
        localStorage.setItem('instagram_access_token', instaTokenFromHash);
        // Clear the pending flag
        localStorage.removeItem('instagram_oauth_pending');
        // Clear hash from URL cleanly
        window.history.replaceState(null, '', window.location.pathname);
        // Trigger the fetch directly without a reload — no redirect needed
        instaFetchStarted.current = false;
        fetchInstagramAccounts(instaTokenFromHash, true);
      }
    }
  }, [fetchInstagramAccounts]);

  // 1. Session Storage State Recovery (Temp signup data, Instagram accounts, and YouTube channels)
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

    // Recover persisted Instagram accounts across full-page OAuth redirects
    try {
      const savedInsta = sessionStorage.getItem('suvix_saved_instagram_accounts');
      if (savedInsta && instagramAccounts.length === 0) {
        const parsed = JSON.parse(savedInsta);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch(setInstagramAccounts(parsed));
        }
      }
    } catch {
      // ignore
    }

    // Recover persisted YouTube channels across full-page OAuth redirects
    try {
      const savedYt = sessionStorage.getItem('suvix_saved_youtube_channels');
      if (savedYt && youtubeDiscovery.channels.length === 0) {
        const parsed = JSON.parse(savedYt);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch(addDiscoveredChannels(parsed));
        }
      }
    } catch {
      // ignore
    }
  }, [tempSignupData, instagramAccounts.length, youtubeDiscovery.channels.length, dispatch]);

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
      fetchChannels(token, true);
    }
  }, [rawToken, fetchChannels, youtubeDiscovery.channels.length]);

  // 4. Instagram Account Fetch on Token Arrival
  useEffect(() => {
    const token = rawInstaToken;
    if (token && instagramAccounts.length === 0 && !instaFetchStarted.current) {
      instaFetchStarted.current = true;
      fetchInstagramAccounts(token, true);
    }
  }, [rawInstaToken, fetchInstagramAccounts, instagramAccounts.length]);

  /**
   * Complete Social Account Linking and Proceed to Sign Up
   */
  const handleProceedToSignup = () => {
    const ytCat = categories.find((c) => c.slug === 'creator' || c.slug === 'yt_influencer');

    // Only forward fresh, unclaimed YouTube channels
    const validYoutubeChannels = youtubeDiscovery.channels.filter((c) => !c.isClaimed);

    const formattedYoutubeChannels = validYoutubeChannels.map((channel, index: number) => ({
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

    // If YouTube channel was claimed, clear it from session storage and Redux so it is completely dropped
    if (isChannelClaimed && validYoutubeChannels.length === 0) {
      sessionStorage.removeItem('suvix_saved_youtube_channels');
      sessionStorage.removeItem('youtube_access_token');
      dispatch(resetYoutubeDiscovery());
    }

    const updatePayload = {
      role: 'creator' as const,
      categoryId: tempSignupData?.categoryId || ytCat?.id || 'creator',
      categorySlug: ytCat?.slug ?? 'creator',
      youtubeChannels: formattedYoutubeChannels,
      instagramAccounts: instagramAccounts,
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

      <LoadingOverlay isVisible={isLoading} theme="youtube" message="Connecting to YouTube..." />
      <SuccessOverlay
        isVisible={showSuccess}
        type="youtube"
        title="Channel Found!"
        message={primaryChannel?.channelName ? `Discovered and verified "${primaryChannel.channelName}"` : "Your YouTube channel was discovered and verified."}
      />

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
              dispatch(clearTempSignupData());
              try {
                sessionStorage.removeItem('suvix_temp_signup_data');
                sessionStorage.removeItem('suvix_saved_instagram_accounts');
                sessionStorage.removeItem('suvix_saved_youtube_channels');
                sessionStorage.removeItem('instagram_access_token');
                sessionStorage.removeItem('instagram_oauth_pending');
                sessionStorage.removeItem('youtube_access_token');
                sessionStorage.removeItem('youtube_oauth_pending');
                sessionStorage.removeItem('oauth_intent');
                sessionStorage.removeItem('suvix_oauth_role');
                sessionStorage.removeItem('suvix_oauth_category');
              } catch {
                // ignore
              }
              navigate('/role-selection');
            }}
            className="group relative h-9 sm:h-10 pl-1.5 pr-3 sm:pr-4 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200/80 text-zinc-600 hover:text-zinc-900 text-[10px] sm:text-xs font-bold shadow-sm transition-all duration-300 flex items-center gap-2 active:scale-95 cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-100 group-hover:bg-white shadow-inner flex items-center justify-center border border-zinc-200/50 group-hover:shadow-sm transition-all duration-300">
                 <ChevronLeft size={14} strokeWidth={2.5} className="text-zinc-500 group-hover:text-zinc-900 group-hover:-translate-x-0.5 transition-transform duration-300" />
              </div>
              <span className="tracking-wide uppercase sm:normal-case font-black sm:font-bold">Change Role</span>
            </div>
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
            className="lg:col-span-7 flex flex-col items-start text-left space-y-6 lg:space-y-8 max-w-2xl mx-auto lg:mx-0 w-full"
          >
            {/* Main Headline & Mobile Animation (50:50 Split) */}
            <div className="flex items-center justify-between gap-4 w-full">
              
              {/* Left Side: Headline */}
              <div className="w-[55%] lg:w-full space-y-2">
                <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight text-zinc-950 leading-[1.15]">
                  Connect Your{' '}
                  <span className="relative inline-block text-zinc-950">
                    Creator Accounts
                    <span className="absolute left-0 bottom-1 w-full h-2 sm:h-3 bg-amber-400/35 -z-10 rounded-sm transform -rotate-1" />
                  </span>
                </h1>
                
                <p className="text-[10px] xs:text-[11px] sm:text-sm md:text-base text-zinc-650 font-medium leading-relaxed">
                  Link your channels and social profiles to verify your audience, unlock direct brand sponsorships, and auto-match with vetted video editors.
                </p>
              </div>

              {/* Right Side: Mobile-only Card Animation */}
              <div className="w-[45%] lg:hidden relative flex items-center justify-end min-h-[120px]">
                <div className="absolute right-[-10px] xs:right-0 top-1/2 -translate-y-1/2 w-[260px] xs:w-[300px] sm:w-[380px] transform scale-[0.6] xs:scale-[0.65] sm:scale-[0.75] origin-right pointer-events-none">
                  <FloatingCreatorShowcase />
                </div>
              </div>
              
            </div>

            {/* ── CONNECTOR CARDS HUB ────────────────────────────────────────── */}
            <div className="w-full space-y-3 pt-1">
              
              {/* 1. YOUTUBE CONNECTOR */}
              <div className={`w-full rounded-2xl border transition-all duration-350 overflow-hidden ${
                isChannelClaimed
                  ? 'bg-red-50/40 border-red-200/90 shadow-sm'
                  : connected 
                    ? 'bg-white border-zinc-200/90 shadow-sm' 
                    : 'bg-white border-zinc-200/90 hover:border-zinc-300 shadow-sm'
              }`}>
                <div className="flex flex-col lg:grid lg:grid-cols-10 gap-0">
                  
                  {/* Left Side (60%) */}
                  <div className="lg:col-span-6 p-3.5 sm:p-5 flex flex-col justify-between gap-4">
                    <div className="flex items-start gap-3 text-left">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shrink-0">
                        <Play size={16} className="fill-white ml-0.5" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm md:text-base font-black text-zinc-955 flex items-center gap-1.5 flex-wrap">
                          YouTube Channel
                          {isChannelClaimed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-650 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                              Already Linked
                            </span>
                          ) : connected ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[10px] sm:text-xs font-black">
                              <Check size={10} strokeWidth={4} /> Connected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[8px] sm:text-[9px] font-black uppercase tracking-wider animate-pulse">
                              Link Required
                            </span>
                          )}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 leading-snug">
                          {isChannelClaimed
                            ? `The channel "${primaryChannel?.channelName}" is already linked to another user.`
                            : connected 
                              ? `Connected to Google Account successfully.` 
                              : 'Sync subscriber analytics, recent uploads & verify your identity.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!primaryChannel ? (
                        <Button
                          onClick={handleConnectYoutube}
                          disabled={isLoading}
                          className="h-8.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] sm:text-xs sm:h-10 sm:px-5 sm:rounded-xl flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-95 transition-all cursor-pointer w-full sm:w-auto"
                        >
                          <Play size={12} className="fill-white" />
                          <span>Link YouTube</span>
                        </Button>
                      ) : (
                        <button
                          onClick={handleConnectYoutube}
                          className={`h-8.5 sm:h-10 px-3 sm:px-5 rounded-lg sm:rounded-xl border bg-white text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0 w-full sm:w-auto ${isChannelClaimed ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                        >
                          <RefreshCw size={12} strokeWidth={2.5} />
                          <span>{isChannelClaimed ? 'Link Another' : 'Switch Account'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Side (40%) - Fetched Channel Details */}
                  {primaryChannel && (
                    <div className={`lg:col-span-4 p-3.5 sm:p-5 border-t lg:border-t-0 lg:border-l flex flex-col gap-3 justify-center ${isChannelClaimed ? 'bg-red-50/50 border-red-200/70' : 'bg-zinc-50/50 border-zinc-200/70'}`}>
                      
                      {/* Premium Mini Card */}
                      <div className={`flex flex-col gap-2 p-2.5 sm:p-3 rounded-xl shadow-sm border bg-white relative overflow-hidden ${isChannelClaimed ? 'border-red-200' : 'border-zinc-200'}`}>
                        {isChannelClaimed && (
                          <div className="absolute top-0 right-0 w-0 h-0 border-t-[28px] border-l-[28px] border-t-red-500 border-l-transparent">
                             <span className="absolute -top-[26px] -left-[12px] text-white text-[9px] font-black">!</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={primaryChannel.thumbnailUrl || 'https://via.placeholder.com/40'}
                            alt={primaryChannel.channelName}
                            className={`w-8 h-8 rounded-full object-cover border shadow-sm shrink-0 ${isChannelClaimed ? 'border-red-200' : 'border-zinc-200'}`} 
                          />
                          <div className="flex flex-col text-left min-w-0 flex-1">
                            <span className={`text-[11px] sm:text-xs font-extrabold leading-tight truncate ${isChannelClaimed ? 'text-red-950' : 'text-zinc-900'}`}>
                              {primaryChannel.channelName}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-semibold tracking-wide">
                              {formatCount(primaryChannel.subscriberCount)} subs
                            </span>
                          </div>
                        </div>

                        {/* Recent Videos Grid */}
                        {primaryChannel.videos && primaryChannel.videos.length > 0 && (
                          <div className="grid grid-cols-3 gap-1.5 mt-1">
                            {primaryChannel.videos.slice(0, 3).map((v, i) => (
                              <div key={i} className="aspect-video bg-zinc-100 rounded-md overflow-hidden border border-zinc-200/50 relative group">
                                <img src={v.thumbnail || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <Play size={8} className="text-white fill-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Niche Selector */}
                      {!isChannelClaimed && (
                        <div className="w-full space-y-1 mt-0.5">
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1 text-left">
                            <Compass size={10} className="text-amber-500" />
                            Select Niche
                          </label>
                          <div className="relative">
                            <select
                              value={selectedNiche}
                              onChange={(e) => setSelectedNiche(e.target.value)}
                              className="w-full h-8 sm:h-9 pl-2.5 pr-8 rounded-lg border border-zinc-200 bg-white text-zinc-800 text-[10px] sm:text-xs font-bold focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all cursor-pointer appearance-none shadow-sm"
                            >
                              <option value="" disabled className="text-zinc-400">Choose...</option>
                              {availableNiches.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-zinc-400">
                              <Compass size={12} />
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>

              {/* 2. INSTAGRAM CONNECTOR (Optional / Multi-Platform) */}
              <div className={`w-full rounded-2xl border transition-all duration-350 overflow-hidden ${
                  instaConnected 
                    ? 'bg-white border-zinc-200/90 shadow-sm' 
                    : 'bg-white border-zinc-200/90 hover:border-zinc-300 shadow-sm'
                }`}>
                <div className="flex flex-col lg:grid lg:grid-cols-10 gap-0">
                  
                  {/* Left Side (60%) */}
                  <div className="lg:col-span-6 p-3.5 sm:p-5 flex flex-col justify-between gap-4">
                    <div className="flex items-start gap-3 text-left">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-md shrink-0">
                        <Instagram size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm md:text-base font-black text-zinc-955 flex items-center gap-1.5 flex-wrap">
                          Instagram Profile
                          {instaConnected ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[10px] sm:text-xs font-black">
                              <Check size={10} strokeWidth={4} /> Connected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[8px] sm:text-[9px] font-bold">
                              Optional
                            </span>
                          )}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 leading-snug">
                          {instaConnected 
                            ? 'Connected to Meta Account successfully.' 
                            : 'Sync Reels engagement, follower demographics & rate cards.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!instaConnected ? (
                        <Button
                          onClick={handleConnectInstagram}
                          disabled={isLoading}
                          className="h-8.5 px-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-[10px] sm:text-xs sm:h-10 sm:px-4 sm:rounded-xl flex items-center justify-center gap-1.5 shrink-0 cursor-pointer w-full sm:w-auto"
                        >
                          <Plus size={10} />
                          <span>Link Instagram</span>
                        </Button>
                      ) : (
                        <button
                          onClick={handleConnectInstagram}
                          className="h-8.5 sm:h-10 px-3 sm:px-5 rounded-lg sm:rounded-xl border bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0 w-full sm:w-auto"
                        >
                          <RefreshCw size={12} strokeWidth={2.5} />
                          <span>Switch Account</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Side (40%) - Fetched Account Details */}
                  {instaConnected && primaryInstaAccount && (
                    <div className="lg:col-span-4 p-3.5 sm:p-5 border-t lg:border-t-0 lg:border-l flex flex-col gap-3 justify-center bg-zinc-50/50 border-zinc-200/70">
                      
                      {/* Premium Mini Card */}
                      <div className="flex flex-col gap-2 p-2.5 sm:p-3 rounded-xl shadow-sm border bg-white relative overflow-hidden border-zinc-200">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={primaryInstaAccount.profilePictureUrl || 'https://via.placeholder.com/40'}
                            alt={primaryInstaAccount.handle}
                            className="w-8 h-8 rounded-full object-cover border shadow-sm shrink-0 border-zinc-200" 
                          />
                          <div className="flex flex-col text-left min-w-0 flex-1">
                            <span className="text-[11px] sm:text-xs font-extrabold leading-tight truncate text-zinc-900">
                              @{primaryInstaAccount.handle}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-semibold tracking-wide flex items-center gap-2">
                              <span>{formatCount(primaryInstaAccount.followerCount)} followers</span>
                              <span>•</span>
                              <span>{formatCount(primaryInstaAccount.mediaCount)} posts</span>
                            </span>
                          </div>
                        </div>

                        {/* Bio snippet if available */}
                        {primaryInstaAccount.bio && (
                          <p className="text-[9px] text-zinc-600 line-clamp-1 text-left">
                            {primaryInstaAccount.bio}
                          </p>
                        )}

                        {/* Recent Media Thumbnails Grid (Up to 3 thumbnails preview) */}
                        {primaryInstaAccount.recentMedia && primaryInstaAccount.recentMedia.length > 0 && (
                          <div className="grid grid-cols-3 gap-1.5 mt-1">
                            {primaryInstaAccount.recentMedia.slice(0, 3).map((m, i) => (
                              <a
                                key={m.id || i}
                                href={m.permalink || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="aspect-square bg-zinc-100 rounded-md overflow-hidden border border-zinc-200/50 relative group block"
                              >
                                <img
                                  src={m.thumbnailUrl || 'https://via.placeholder.com/150'}
                                  alt={m.caption || 'Instagram Post'}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                                  ❤️ {formatCount(m.likeCount || 0)}
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              </div>

              {instaFetchError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 text-left text-red-600 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                  <span>{instaFetchError}</span>
                </div>
              )}

              {fetchError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 text-left text-red-600 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                  <span>{fetchError}</span>
                </div>
              )}
            </div>

            {/* Removed Mobile-only Live Identity Card - it now renders inside the connector */}

            {/* ── ACTION CONTROLS: CONTINUE & SKIP ───────────────────────────── */}
            <div className="w-full pt-2 space-y-3">
              <div className="space-y-3">
                <Button
                  onClick={handleProceedToSignup}
                  disabled={isContinueDisabled}
                  className={`w-full h-13 sm:h-15 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all ${
                    isContinueDisabled
                      ? 'bg-zinc-100 border border-zinc-250 text-zinc-400 cursor-not-allowed'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-xl shadow-zinc-950/10 cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  <span>Continue to Account Details</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </Button>

                {isChannelClaimed && !hasFreshInstagram ? (
                  <p className="text-center text-xs font-semibold text-red-600 animate-pulse">
                    ⚠️ The connected YouTube channel is already linked to another SuviX user. Please connect another channel or link your Instagram.
                  </p>
                ) : isChannelClaimed && hasFreshInstagram ? (
                  <p className="text-center text-xs font-semibold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    ℹ️ Note: Your already-linked YouTube channel will be omitted, and only your verified Instagram account will be connected.
                  </p>
                ) : hasFreshYoutube && !selectedNiche ? (
                  <p className="text-center text-xs font-semibold text-amber-600 animate-pulse">
                    ⚠️ Please select your channel niche in the preview card to continue.
                  </p>
                ) : null}

                {/* Skip button: visible if no valid social account has been linked */}
                {!hasAnyValidSocial && (
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
            {/* Always show FloatingCreatorShowcase regardless of connection status */}
            <div className="hidden lg:block w-full">
              <FloatingCreatorShowcase />
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
