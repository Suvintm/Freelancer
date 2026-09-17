import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ArrowRight,
  Check,
  AlertCircle,
  ShieldCheck,
  BarChart3,
  Globe,
  Users,
  Compass,
  RefreshCw,
  LayoutGrid,
  X as CloseIcon,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setTempSignupData,
  clearTempSignupData,
  addDiscoveredChannels,
  resetYoutubeDiscovery,
  setInstagramAccounts,
  resetInstagramAccounts,
  type YouTubeChannel,
} from '../../store/slices/onboardingSlice';
import { useCategories } from '../../queries/useCategories';
import type { RootState } from '../../store';
import { api } from '../../api/client';
import { LoadingOverlay } from '../../components/shared/LoadingOverlay';
import { SuccessOverlay } from '../../components/shared/SuccessOverlay';
import blackLogo from '../../assets/blackbglogo.png';
import socialConnectBg from '../../assets/socialconnectbg.png';
import socialConnectComp from '../../assets/socialconnectcomp.png';

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

const SOCIAL_PROOF_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=faces',
];

// ── Custom High-Fidelity Social Platform Icons ────────────────────────────
function YouTubeIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-[#FF0000] text-white flex items-center justify-center shadow-xs shrink-0">
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    </div>
  );
}

function InstagramIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-xs shrink-0">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    </div>
  );
}

function TikTokIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-xs shrink-0">
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.35 0 .68.06 1 .18V8.9a6.38 6.38 0 0 0-1-.08 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.41a8.3 8.3 0 0 0 4.76 1.47V6.69z" />
      </svg>
    </div>
  );
}

function TwitterXIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-xs shrink-0">
      <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    </div>
  );
}

function FacebookIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shadow-xs shrink-0">
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    </div>
  );
}

function SnapchatIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-[#FFFC00] text-black flex items-center justify-center shadow-xs shrink-0">
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M12.004 2c-3.52 0-6.32 2.5-6.32 5.58 0 .55.07 1.09.22 1.58-.58.26-1.28.7-1.39 1.36-.08.45.16.89.57 1.07.47.2.98.07 1.39-.1.17.75.56 1.43 1.15 1.95-.57.38-1.28.6-1.97.68-.45.05-.87.35-.95.8-.08.47.2.93.65 1.07 1.38.43 2.92.23 4.3-.23.44.75 1.34 1.24 2.35 1.24 1.01 0 1.91-.49 2.35-1.24 1.38.46 2.92.66 4.3.23.45-.14.73-.6.65-1.07-.08-.45-.5-.75-.95-.8-.69-.08-1.4-.3-1.97-.68.59-.52.98-1.2 1.15-1.95.41.17.92.3 1.39.1.41-.18.65-.62.57-1.07-.11-.66-.81-1.1-1.39-1.36.15-.49.22-1.03.22-1.58 0-3.08-2.8-5.58-6.32-5.58z" />
      </svg>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center shadow-xs shrink-0">
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
      </svg>
    </div>
  );
}

function SpotifyIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-[#1DB954] text-black flex items-center justify-center shadow-xs shrink-0">
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.502 9.722 1.113.294.18.386.563.207.857zm1.224-2.72c-.226.367-.708.482-1.075.257-2.69-1.653-6.79-2.133-9.97-1.168-.413.125-.85-.11-.975-.523-.125-.413.11-.85.523-.975 3.633-1.102 8.147-.568 11.24 1.334.367.225.482.708.257 1.075zm.105-2.835C14.692 8.94 8.71 8.74 5.25 9.79c-.49.15-1.01-.133-1.16-.623-.15-.49.133-1.01.623-1.16 3.98-1.208 10.59-.982 14.42 1.293.44.262.585.835.323 1.275-.262.44-.835.585-1.275.323z" />
      </svg>
    </div>
  );
}

const PLATFORM_TABS = [
  'All Platforms',
  'Video',
  'Photo & Reels',
  'Short Form',
  'Audio',
  'Live',
  'Blog',
];

export default function ConnectSocials() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const onboardingState = useSelector((state: RootState) => state.onboarding);
  const tempSignupData = onboardingState?.tempSignupData;
  const youtubeDiscovery = onboardingState?.youtubeDiscovery || { channels: [], selectedChannelIds: [], categorizations: {} };
  const creatorData = onboardingState?.creatorData || { channels: [], selectedChannelIds: [], instagramAccounts: [], selectedInstagramAccountIds: [], selectedNiches: [], discoveryToken: null };
  const channels = youtubeDiscovery?.channels || creatorData?.channels || [];
  const instagramAccounts = creatorData?.instagramAccounts || [];

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const [activeTab, setActiveTab] = useState('All Platforms');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [instaFetchError, setInstaFetchError] = useState<string | null>(null);
  const [showMorePlatformsModal, setShowMorePlatformsModal] = useState(false);
  const [manualLinkPlatform, setManualLinkPlatform] = useState<string | null>(null);
  const [manualHandleInput, setManualHandleInput] = useState('');

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
    ? sessionStorage.getItem('instagram_access_token') || localStorage.getItem('instagram_access_token') || undefined
    : (location.state?.instagramAccessToken as string | undefined);

  const connected = (channels || []).length > 0;
  const primaryChannel = (channels || [])[0];
  const isChannelClaimed = connected && Boolean(primaryChannel?.isClaimed);

  const freshChannels = (channels || []).filter((c) => !c.isClaimed);
  const hasFreshYoutube = freshChannels.length > 0;
  const hasFreshInstagram = (instagramAccounts || []).length > 0;
  const hasAnyValidSocial = hasFreshYoutube || hasFreshInstagram;
  const isContinueDisabled = !hasAnyValidSocial || (hasFreshYoutube && !selectedNiche);

  const instaConnected = (instagramAccounts || []).length > 0;
  const primaryInstaAccount = (instagramAccounts || [])[0];

  const handleConnectYoutube = () => {
    sessionStorage.setItem('oauth_intent', 'connect_youtube');
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
    localStorage.setItem('instagram_oauth_pending', 'true');
    if (channels && channels.length > 0) {
      try {
        sessionStorage.setItem('suvix_saved_youtube_channels', JSON.stringify(channels));
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
        localStorage.setItem('suvix_temp_signup_data_backup', JSON.stringify(tempSignupData));
      } catch {
        // ignore
      }
    }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';
    window.location.href = `${apiUrl}/auth/meta/instagram`;
  };

  const handleOtherPlatformClick = (platformName: string) => {
    setManualLinkPlatform(platformName);
    setManualHandleInput('');
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
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2400);
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

  useEffect(() => {
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const instaTokenFromHash = hashParams.get('instaToken');
      if (instaTokenFromHash) {
        sessionStorage.setItem('instagram_access_token', instaTokenFromHash);
        localStorage.setItem('instagram_access_token', instaTokenFromHash);
        localStorage.removeItem('instagram_oauth_pending');
        window.history.replaceState(null, '', window.location.pathname);
        instaFetchStarted.current = false;
        fetchInstagramAccounts(instaTokenFromHash, true);
      }
    }
  }, [fetchInstagramAccounts]);

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

    try {
      const savedYt = sessionStorage.getItem('suvix_saved_youtube_channels');
      if (savedYt && channels.length === 0) {
        const parsed = JSON.parse(savedYt);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch(addDiscoveredChannels(parsed));
        }
      }
    } catch {
      // ignore
    }
  }, [tempSignupData, instagramAccounts.length, channels.length, dispatch]);

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

  useEffect(() => {
    const token = rawToken;
    if (token && channels.length === 0 && !fetchStarted.current) {
      fetchStarted.current = true;
      fetchChannels(token, true);
    }
  }, [rawToken, fetchChannels, channels.length]);

  useEffect(() => {
    const token = rawInstaToken;
    if (token && instagramAccounts.length === 0 && !instaFetchStarted.current) {
      instaFetchStarted.current = true;
      fetchInstagramAccounts(token, true);
    }
  }, [rawInstaToken, fetchInstagramAccounts, instagramAccounts.length]);

  const handleProceedToSignup = () => {
    const ytCat = categories.find((c) => c.slug === 'creator' || c.slug === 'yt_influencer');
    const validYoutubeChannels = channels.filter((c) => !c.isClaimed);

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
    <div className="min-h-screen w-full bg-[#f8f9fc] text-zinc-900 flex flex-col relative overflow-x-hidden selection:bg-black selection:text-white font-sans">
      {/* ── BACKGROUND ARTWORK ────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <img
          src={socialConnectBg}
          alt=""
          className="w-full h-full object-cover object-right-bottom"
        />
      </div>

      <LoadingOverlay isVisible={isLoading} theme="youtube" message="Connecting your account..." />
      <SuccessOverlay
        isVisible={showSuccess}
        type="youtube"
        title="Account Linked!"
        message={primaryChannel?.channelName ? `Discovered and verified "${primaryChannel.channelName}"` : "Your creator profile was successfully discovered."}
      />

      {/* ── TOP HEADER / LOGO BAR ──────────────────────────────────────── */}
      <header className="relative z-40 w-full px-4 sm:px-8 md:px-12 pt-4 sm:pt-6 pb-2 max-w-[1440px] mx-auto flex items-center justify-between">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <img
            src={blackLogo}
            alt="SuviX"
            className="h-12 xs:h-14 sm:h-18 md:h-22 w-auto object-contain transition-transform group-hover:scale-105"
          />
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
            } catch {
              // ignore
            }
            navigate('/role-selection');
          }}
          className="group h-8.5 sm:h-9 px-3 sm:px-4 rounded-full bg-white/90 hover:bg-zinc-100 border border-zinc-200/90 text-zinc-700 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Change Role</span>
        </button>
      </header>

      {/* ── MAIN TWO-COLUMN CONTAINER ─────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 pb-36 sm:pb-40 pt-1 sm:pt-2 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-start">
          
          {/* ── LEFT COLUMN: MAIN HEADING & PLATFORM CARDS (~7 Cols) ─────── */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-3.5 sm:space-y-4.5 w-full">
            
            {/* Step 2 of 3 */}
            <div className="flex items-center gap-2 select-none">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                STEP 2 OF 3
              </span>
              <div className="lg:hidden w-12 h-1 rounded-full bg-zinc-200 overflow-hidden flex">
                <div className="w-2/3 h-full bg-zinc-950 rounded-full" />
              </div>
            </div>

            {/* Hero Title & Subtitle + Mobile Side Illustration */}
            <div className="w-full flex items-start justify-between gap-2.5 sm:gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-zinc-950 leading-[1.12]">
                  Connect Your<br />Creator Accounts
                </h1>
                <p className="lg:hidden text-[10.5px] sm:text-xs text-zinc-500 font-normal leading-relaxed mt-1.5 max-w-md">
                  Link your social profiles to verify your audience, unlock brand opportunities, and get matched with the right collaborations.
                </p>
              </div>

              {/* Mobile Graphic: Showcase Image on Mobile Top Right Only */}
              <div className="lg:hidden w-[48%] xs:w-[50%] sm:w-[44%] shrink-0 flex items-center justify-end rounded-tl-[2.25rem] rounded-br-[2.25rem] rounded-tr-lg rounded-bl-lg overflow-hidden border-none shadow-none -mt-3">
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  src={socialConnectComp}
                  alt="SuviX Social Connect"
                  className="w-full max-h-[230px] xs:max-h-[260px] sm:max-h-[290px] object-contain select-none pointer-events-none"
                />
              </div>
            </div>

            {/* Platform Filter Tabs */}
            <div className="w-full overflow-x-auto no-scrollbar py-0.5">
              <div className="flex items-center gap-1.5 min-w-max">
                {PLATFORM_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-zinc-100/90 text-zinc-600 hover:text-black hover:bg-zinc-200/80'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* ── 2-COLUMN PLATFORM CARDS GRID ──────────────────────────── */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 w-full">
              
              {/* 1. YOUTUBE CARD */}
              <div className={`relative rounded-2xl border bg-white p-3 sm:p-4 shadow-2xs flex flex-col justify-between gap-2.5 transition-all ${
                connected ? 'col-span-2 sm:col-span-1' : 'col-span-1'
              } ${
                isChannelClaimed
                  ? 'border-red-300 bg-red-50/30'
                  : connected
                    ? 'ring-2 ring-emerald-500/40 border-emerald-500/80 bg-emerald-50/15 shadow-xs'
                    : 'border-zinc-200/90 hover:border-zinc-300'
              }`}>
                {/* Connected Floating Top Badge (Like Role Selection) */}
                {connected && !isChannelClaimed && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute -top-2.5 right-3 z-30 bg-zinc-950 text-white px-2 sm:px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-zinc-700/70 whitespace-nowrap text-[8.5px] sm:text-[10px] font-bold select-none"
                  >
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
                    </div>
                    <span>Connected</span>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-2.5">
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <YouTubeIcon />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-zinc-900">YouTube</span>
                        {isChannelClaimed ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[8.5px] font-semibold uppercase">
                            Claimed
                          </span>
                        ) : connected ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8.5px] font-bold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" /> Connected
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[8.5px] font-semibold border border-rose-100">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-[9.5px] sm:text-[11px] text-zinc-500 mt-0.5 leading-tight sm:leading-snug line-clamp-2 sm:line-clamp-none font-normal">
                        {isChannelClaimed
                          ? 'Channel linked to another account.'
                          : connected
                            ? `Verified ${primaryChannel?.channelName || 'channel'}`
                            : 'Verify your channel, uploads and audience details.'}
                      </p>
                    </div>
                  </div>

                  {/* Desktop Connect Button */}
                  <div className="hidden sm:block shrink-0">
                    {!connected ? (
                      <button
                        onClick={handleConnectYoutube}
                        disabled={isLoading}
                        className="px-4 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                      >
                        Connect
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectYoutube}
                        className="p-1.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors shadow-2xs cursor-pointer"
                        title="Switch YouTube Channel"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* If YouTube is Connected: Show Mini Preview Card + Prominent Niche Picker */}
                {primaryChannel && (
                  <div className="pt-2 border-t border-zinc-100 space-y-2">
                    <div className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                      <img
                        src={primaryChannel.thumbnailUrl || 'https://via.placeholder.com/40'}
                        alt={primaryChannel.channelName}
                        className="w-6 h-6 rounded-full object-cover border border-zinc-200 shadow-2xs shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] sm:text-xs font-semibold text-zinc-900 truncate">
                          {primaryChannel.channelName}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-zinc-500 font-normal truncate">
                          {formatCount(primaryChannel.subscriberCount)} subscribers
                        </p>
                      </div>
                    </div>

                    {/* Channel Niche Selection */}
                    {!isChannelClaimed && (
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1">
                            <Compass className="w-3 h-3 text-amber-500" />
                            <span>Select Channel Niche</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          {!selectedNiche && (
                            <span className="text-[8.5px] text-amber-600 font-bold animate-pulse">
                              Required
                            </span>
                          )}
                        </div>
                        <select
                          value={selectedNiche}
                          onChange={(e) => setSelectedNiche(e.target.value)}
                          className={`w-full h-8 sm:h-8.5 px-2.5 rounded-xl border text-zinc-900 text-[11px] sm:text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-950 transition-all cursor-pointer shadow-2xs ${
                            !selectedNiche
                              ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-300/70'
                              : 'border-zinc-300 bg-white'
                          }`}
                        >
                          <option value="" disabled>Choose your channel niche...</option>
                          {availableNiches.map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Mobile Full-width Connect Button */}
                <div className="sm:hidden">
                  {!connected ? (
                    <button
                      onClick={handleConnectYoutube}
                      disabled={isLoading}
                      className="w-full py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Connect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectYoutube}
                      className="w-full py-1.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Switch Channel</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. INSTAGRAM CARD */}
              <div className={`relative rounded-2xl border bg-white p-3 sm:p-4 shadow-2xs flex flex-col justify-between gap-2.5 transition-all ${
                instaConnected ? 'col-span-2 sm:col-span-1' : 'col-span-1'
              } ${
                instaConnected
                  ? 'ring-2 ring-emerald-500/40 border-emerald-500/80 bg-emerald-50/15 shadow-xs'
                  : 'border-zinc-200/90 hover:border-zinc-300'
              }`}>
                {/* Connected Floating Top Badge (Like Role Selection) */}
                {instaConnected && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute -top-2.5 right-3 z-30 bg-zinc-950 text-white px-2 sm:px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-zinc-700/70 whitespace-nowrap text-[8.5px] sm:text-[10px] font-bold select-none"
                  >
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
                    </div>
                    <span>Connected</span>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-2.5">
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <InstagramIcon />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-zinc-900">Instagram</span>
                        {instaConnected ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8.5px] font-bold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" /> Connected
                          </span>
                        ) : hasFreshYoutube ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[8.5px] font-semibold">
                            Optional
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[8.5px] font-semibold border border-rose-100">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-[9.5px] sm:text-[11px] text-zinc-500 mt-0.5 leading-tight sm:leading-snug line-clamp-2 sm:line-clamp-none font-normal">
                        {instaConnected
                          ? `Verified @${primaryInstaAccount?.handle}`
                          : 'Sync your profile, reels and engagement insights.'}
                      </p>
                    </div>
                  </div>

                  {/* Desktop Connect Button */}
                  <div className="hidden sm:block shrink-0">
                    {!instaConnected ? (
                      <button
                        onClick={handleConnectInstagram}
                        disabled={isLoading}
                        className="px-4 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                      >
                        Connect
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectInstagram}
                        className="p-1.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors shadow-2xs cursor-pointer"
                        title="Switch Instagram Account"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* If Instagram is Connected: Show Account Details */}
                {instaConnected && primaryInstaAccount && (
                  <div className="pt-2 border-t border-zinc-100">
                    <div className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                      <img
                        src={primaryInstaAccount.profilePictureUrl || 'https://via.placeholder.com/40'}
                        alt={primaryInstaAccount.handle}
                        className="w-6 h-6 rounded-full object-cover border border-zinc-200 shadow-2xs shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] sm:text-xs font-semibold text-zinc-900 truncate">
                          @{primaryInstaAccount.handle}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-zinc-500 font-normal truncate">
                          {formatCount(primaryInstaAccount.followerCount)} followers
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Full-width Connect Button */}
                <div className="sm:hidden">
                  {!instaConnected ? (
                    <button
                      onClick={handleConnectInstagram}
                      disabled={isLoading}
                      className="w-full py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Connect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectInstagram}
                      className="w-full py-1.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Switch Account</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 3. TIKTOK CARD */}
              <div className="col-span-1 relative rounded-2xl border border-zinc-200/90 bg-white p-3 sm:p-4 shadow-2xs flex flex-col justify-between gap-2.5 hover:border-zinc-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-2.5">
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <TikTokIcon />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-zinc-900">TikTok</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[8px] sm:text-[8.5px] font-black tracking-wider uppercase">
                          BETA
                        </span>
                      </div>
                      <p className="text-[9.5px] sm:text-[11px] text-zinc-500 mt-0.5 leading-tight sm:leading-snug line-clamp-2 sm:line-clamp-none font-normal">
                        Showcase your content and reach.
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block shrink-0">
                    <button
                      onClick={() => handleOtherPlatformClick('TikTok')}
                      className="px-4 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      Connect
                    </button>
                  </div>
                </div>
                <div className="sm:hidden">
                  <button
                    onClick={() => handleOtherPlatformClick('TikTok')}
                    className="w-full py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Connect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 4. X (TWITTER) CARD */}
              <div className="col-span-1 relative rounded-2xl border border-zinc-200/90 bg-white p-3 sm:p-4 shadow-2xs flex flex-col justify-between gap-2.5 hover:border-zinc-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-2.5">
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <TwitterXIcon />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-zinc-900">X (Twitter)</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[8px] sm:text-[8.5px] font-black tracking-wider uppercase">
                          BETA
                        </span>
                      </div>
                      <p className="text-[9.5px] sm:text-[11px] text-zinc-500 mt-0.5 leading-tight sm:leading-snug line-clamp-2 sm:line-clamp-none font-normal">
                        Link your profile to show your audience and influence.
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block shrink-0">
                    <button
                      onClick={() => handleOtherPlatformClick('X (Twitter)')}
                      className="px-4 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      Connect
                    </button>
                  </div>
                </div>
                <div className="sm:hidden">
                  <button
                    onClick={() => handleOtherPlatformClick('X (Twitter)')}
                    className="w-full py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Connect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 5. FACEBOOK CARD */}
              <div className="col-span-1 relative rounded-2xl border border-zinc-200/90 bg-white p-3 sm:p-4 shadow-2xs flex flex-col justify-between gap-2.5 hover:border-zinc-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-2.5">
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <FacebookIcon />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-zinc-900">Facebook</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[8px] sm:text-[8.5px] font-black tracking-wider uppercase">
                          BETA
                        </span>
                      </div>
                      <p className="text-[9.5px] sm:text-[11px] text-zinc-500 mt-0.5 leading-tight sm:leading-snug line-clamp-2 sm:line-clamp-none font-normal">
                        Connect your page to share your followers and engagement.
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block shrink-0">
                    <button
                      onClick={() => handleOtherPlatformClick('Facebook')}
                      className="px-4 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      Connect
                    </button>
                  </div>
                </div>
                <div className="sm:hidden">
                  <button
                    onClick={() => handleOtherPlatformClick('Facebook')}
                    className="w-full py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Connect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 6. SNAPCHAT CARD */}
              <div className="col-span-1 relative rounded-2xl border border-zinc-200/90 bg-white p-3 sm:p-4 shadow-2xs flex flex-col justify-between gap-2.5 hover:border-zinc-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-2.5">
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <SnapchatIcon />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-zinc-900">Snapchat</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[8px] sm:text-[8.5px] font-black tracking-wider uppercase">
                          BETA
                        </span>
                      </div>
                      <p className="text-[9.5px] sm:text-[11px] text-zinc-500 mt-0.5 leading-tight sm:leading-snug line-clamp-2 sm:line-clamp-none font-normal">
                        Showcase your content and audience.
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block shrink-0">
                    <button
                      onClick={() => handleOtherPlatformClick('Snapchat')}
                      className="px-4 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      Connect
                    </button>
                  </div>
                </div>
                <div className="sm:hidden">
                  <button
                    onClick={() => handleOtherPlatformClick('Snapchat')}
                    className="w-full py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Connect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 7. LINKEDIN CARD */}
              <div className="col-span-1 relative rounded-2xl border border-zinc-200/90 bg-white p-3 sm:p-4 shadow-2xs flex flex-col justify-between gap-2.5 hover:border-zinc-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-2.5">
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <LinkedInIcon />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-zinc-900">LinkedIn</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[8px] sm:text-[8.5px] font-black tracking-wider uppercase">
                          BETA
                        </span>
                      </div>
                      <p className="text-[9.5px] sm:text-[11px] text-zinc-500 mt-0.5 leading-tight sm:leading-snug line-clamp-2 sm:line-clamp-none font-normal">
                        Highlight your professional presence.
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block shrink-0">
                    <button
                      onClick={() => handleOtherPlatformClick('LinkedIn')}
                      className="px-4 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      Connect
                    </button>
                  </div>
                </div>
                <div className="sm:hidden">
                  <button
                    onClick={() => handleOtherPlatformClick('LinkedIn')}
                    className="w-full py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Connect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 8. SPOTIFY CARD */}
              <div className="col-span-1 relative rounded-2xl border border-zinc-200/90 bg-white p-3 sm:p-4 shadow-2xs flex flex-col justify-between gap-2.5 hover:border-zinc-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-2.5">
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <SpotifyIcon />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-zinc-900">Spotify</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[8px] sm:text-[8.5px] font-black tracking-wider uppercase">
                          BETA
                        </span>
                      </div>
                      <p className="text-[9.5px] sm:text-[11px] text-zinc-500 mt-0.5 leading-tight sm:leading-snug line-clamp-2 sm:line-clamp-none font-normal">
                        Connect your artist or creator profile.
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block shrink-0">
                    <button
                      onClick={() => handleOtherPlatformClick('Spotify')}
                      className="px-4 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      Connect
                    </button>
                  </div>
                </div>
                <div className="sm:hidden">
                  <button
                    onClick={() => handleOtherPlatformClick('Spotify')}
                    className="w-full py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 tracking-tight shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Connect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* View More Platforms Button */}
            <button
              type="button"
              onClick={() => setShowMorePlatformsModal(true)}
              className="w-full p-3 sm:p-3.5 rounded-2xl border border-zinc-200/90 bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-semibold tracking-tight flex items-center justify-between shadow-2xs transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-4 h-4 text-zinc-800" />
                <span>View More Platforms</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Error notifications */}
            {instaFetchError && (
              <div className="w-full flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-2xl p-3.5 text-left text-red-600 text-xs font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                <span>{instaFetchError}</span>
              </div>
            )}

            {fetchError && (
              <div className="w-full flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-2xl p-3.5 text-left text-red-600 text-xs font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                <span>{fetchError}</span>
              </div>
            )}

            {/* Social Proof Footer Strip (Left bottom) */}
            <div className="pt-4 border-t border-zinc-200/80 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
              <div className="space-y-1">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                  TRUSTED BY 1M+ CREATORS WORLDWIDE
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2 overflow-hidden p-0.5">
                    {SOCIAL_PROOF_AVATARS.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt="Creator"
                        className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-white object-cover shadow-xs"
                      />
                    ))}
                    <div className="h-6.5 w-6.5 rounded-full bg-zinc-900 text-white text-[9px] font-bold ring-2 ring-white flex items-center justify-center shadow-xs">
                      +1M
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-500 font-medium max-w-xs">
                Join a global community of creators growing with SuviX.
              </p>
            </div>
          </div>

          {/* ── RIGHT COLUMN: SHOWCASE COMPOSITE & CTA (~5 Cols, Desktop only) ─────────── */}
          <div className="hidden lg:flex lg:col-span-5 flex-col items-center justify-start space-y-6 lg:pl-4 w-full">
            
            {/* Hero Showcase Illustration in Clean White Box (Matching Desktop Mockup) */}
            <div className="relative w-full max-w-[500px] xl:max-w-[540px] flex items-center justify-center rounded-3xl bg-white/95 border border-zinc-200/90 shadow-sm p-5 sm:p-6 backdrop-blur-xs">
              <motion.img
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                src={socialConnectComp}
                alt="SuviX - One Profile. More Opportunities."
                className="w-full h-auto object-contain max-h-[460px] xl:max-h-[500px] select-none pointer-events-none"
              />
            </div>

            {/* Value Card Box ("Turn Your Content Into Opportunities") */}
            <div className="w-full rounded-2xl bg-white/95 border border-zinc-200/90 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xs">
              {/* Handwritten Left Accent */}
              <div className="sm:w-1/2 text-left">
                <p className="font-['Caveat',_cursive,_sans-serif] text-2xl sm:text-3xl font-bold text-zinc-900 leading-tight">
                  Turn<br />
                  Your Content<br />
                  Into Opportunities
                </p>
              </div>

              {/* Stats List Right */}
              <div className="sm:w-1/2 flex flex-col gap-2.5 text-left border-t sm:border-t-0 sm:border-l border-zinc-200/80 pt-3 sm:pt-0 sm:pl-4 w-full">
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-zinc-700 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block leading-tight">500+</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Partner Brands</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-zinc-700 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block leading-tight">Real</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Growth Opportunities</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-zinc-700 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block leading-tight">Global</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Reach</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Protection Note */}
            <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] font-semibold text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Google & Meta Verified OAuth • Read-only discovery • 100% Privacy Protected</span>
            </div>

          </div>

        </div>
      </main>

      {/* ── BOTTOM STICKY ACTION DOCK ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl rounded-t-[2rem] sm:rounded-t-3xl border-t border-zinc-200/90 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] px-4 sm:px-8 md:px-12 py-3.5 sm:py-4"
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Connection Status */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-colors duration-200 ${
                hasAnyValidSocial && (!hasFreshYoutube || selectedNiche)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-200 text-zinc-400'
              }`}
            >
              {hasAnyValidSocial && (!hasFreshYoutube || selectedNiche) ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-zinc-400" />
              )}
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-zinc-700 truncate">
                {hasAnyValidSocial ? (
                  <>
                    Connected:{' '}
                    <span className="text-zinc-950 font-bold">
                      {hasFreshYoutube && hasFreshInstagram
                        ? 'YouTube & Instagram'
                        : hasFreshYoutube
                        ? primaryChannel?.channelName || 'YouTube Channel'
                        : `@${primaryInstaAccount?.handle || 'Instagram'}`}
                    </span>
                    {hasFreshYoutube && !selectedNiche && (
                      <span className="text-rose-600 font-bold text-xs ml-1.5">(Select Niche)</span>
                    )}
                  </>
                ) : (
                  'Connect at least one creator account to proceed'
                )}
              </span>
              <span className="text-[10px] sm:text-[11px] text-zinc-400 font-normal truncate">
                {isChannelClaimed && !hasFreshInstagram
                  ? '⚠️ Channel is claimed by another user'
                  : 'Zero commitment • Fast setup in 60 seconds'}
              </span>
            </div>
          </div>

          {/* Right: Continue Button & Manual Skip */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ">
            {/* Skip Button if no accounts connected */}
            {!hasAnyValidSocial && (
              <button
                type="button"
                onClick={handleSkipAllConnections}
                className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-xs sm:text-sm font-bold text-zinc-800 shadow-2xs transition-all flex items-center justify-center cursor-pointer whitespace-nowrap"
              >
                <span>Skip Manually</span>
              </button>
            )}

            {/* Continue to Account Details Button */}
            <button
              type="button"
              onClick={handleProceedToSignup}
              disabled={isContinueDisabled}
              className={`h-9 sm:h-10 px-4 sm:px-6 md:px-7 rounded-full text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                !isContinueDisabled
                  ? 'bg-zinc-950 hover:bg-zinc-800 text-white active:scale-95 cursor-pointer opacity-100'
                  : 'bg-zinc-100 text-zinc-400 border border-zinc-200 opacity-80 cursor-not-allowed'
              }`}
            >
              <span>Continue to Account Details</span>
              <ArrowRight size={14} className="shrink-0" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── MODAL: VIEW MORE PLATFORMS ─────────────────────────────────── */}
      <AnimatePresence>
        {showMorePlatformsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-zinc-200 space-y-4 text-left"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-zinc-950">More Creator Platforms</h3>
                <button
                  onClick={() => setShowMorePlatformsModal(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-zinc-600">
                Connect your profiles across other platforms to consolidate your digital footprint on SuviX.
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                {['Twitch', 'Pinterest', 'Discord', 'Threads', 'Patreon', 'Substack'].map((platform) => (
                  <div
                    key={platform}
                    className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-zinc-900">{platform}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[8px] font-black tracking-wider uppercase">
                        BETA
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowMorePlatformsModal(false);
                        handleOtherPlatformClick(platform);
                      }}
                      className="px-2.5 py-1 rounded-full bg-black text-white text-[11px] font-bold hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: MANUAL HANDLE LINK PROMPT FOR OTHER PLATFORMS ────────── */}
      <AnimatePresence>
        {manualLinkPlatform && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 space-y-4 text-left"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-zinc-950">Connect {manualLinkPlatform}</h3>
                <button
                  onClick={() => setManualLinkPlatform(null)}
                  className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-zinc-600">
                Enter your {manualLinkPlatform} profile link or username to showcase on your SuviX profile.
              </p>

              <div className="space-y-2">
                <input
                  type="text"
                  value={manualHandleInput}
                  onChange={(e) => setManualHandleInput(e.target.value)}
                  placeholder={`e.g. @yourhandle or https://${manualLinkPlatform.toLowerCase()}.com/...`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setManualLinkPlatform(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (manualHandleInput.trim()) {
                      setManualLinkPlatform(null);
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
