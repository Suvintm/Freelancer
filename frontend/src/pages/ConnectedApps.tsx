import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MoreVertical, 
  User as UserIcon,
  Info,
  ChevronDown,
  Link2,
  ExternalLink,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  FaYoutube, 
  FaInstagram, 
  FaTiktok, 
  FaXTwitter, 
  FaSpotify, 
  FaTwitch, 
  FaDiscord, 
  FaFacebook, 
  FaLinkedin, 
  FaPinterest 
} from 'react-icons/fa6';
import { selectUser, updateUser } from '../store/slices/authSlice';
import { openConnectModal, setAuthToken } from '../store/slices/connectedAppsSlice';
import { ConnectAppModal } from '../components/connectedApps/ConnectAppModal';
import { useTheme } from '../hooks/useTheme';
import { api } from '../api/client';
import { authService } from '../api/services/auth.service';

// ── Formatter for Real Dynamic Counts (Subscribers, Views, Followers, Posts) ─
const formatCount = (n: number | string | undefined | null): string => {
  if (n === undefined || n === null || n === '') return '0';
  const num = Number(n);
  if (isNaN(num)) return String(n);
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
};

// ── Active Accounts Structure with Dual-Theme Gradients (No Borders) ────────
interface ActiveAccount {
  id: string;
  rawProfileId?: string;
  platform: 'youtube' | 'instagram' | 'tiktok' | 'spotify' | 'twitter' | 'twitch' | 'discord' | 'facebook' | 'linkedin' | 'pinterest';
  platformIcon: React.ComponentType<{ className?: string }>;
  platformBg: string;
  platformColor: string;
  avatar: string;
  status: 'connected' | 'syncing';
  name: string;
  subtitle: string;
  metric1: { value: string; label: string };
  metric2: { value: string; label: string };
  actionText: string;
  actionRoute: string;
  externalUrl?: string;
  gradientClasses: string;
}

// ── Directory Platforms Structure with Dual-Theme Gradients (No Borders) ────
interface PlatformCardData {
  id: string;
  name: string;
  description: string;
  category: 'all' | 'video' | 'social' | 'audio' | 'community' | 'publishing';
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  connectedCount?: number;
  avatars?: string[];
  isConnectable: boolean;
  gradientClasses: string;
}

const ALL_PLATFORMS_BASE: Omit<PlatformCardData, 'connectedCount' | 'avatars'>[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Share videos, analytics and more.',
    category: 'video',
    icon: FaYoutube,
    iconBg: 'bg-[#FF0000]',
    iconColor: 'text-white',
    isConnectable: true,
    gradientClasses: 'bg-gradient-to-b from-[#FFB5AE] via-[#FFE8E6] to-white dark:bg-gradient-to-b dark:from-[#3D0A0A] dark:via-[#220B0B]/90 dark:to-[#121215]',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Sync reels, posts and insights.',
    category: 'social',
    icon: FaInstagram,
    iconBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
    iconColor: 'text-white',
    isConnectable: true,
    gradientClasses: 'bg-gradient-to-b from-[#FFAECF] via-[#FFE2EE] to-white dark:bg-gradient-to-b dark:from-[#3F0E25] dark:via-[#240C18]/90 dark:to-[#121215]',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Track content and audience.',
    category: 'social',
    icon: FaTiktok,
    iconBg: 'bg-black',
    iconColor: 'text-white',
    isConnectable: true,
    gradientClasses: 'bg-gradient-to-b from-[#C5CCD8] via-[#E8ECF2] to-white dark:bg-gradient-to-b dark:from-[#252830] dark:via-[#1A1C22]/90 dark:to-[#121215]',
  },
  {
    id: 'spotify',
    name: 'Spotify for Creators',
    description: 'Sync music, audience and performance.',
    category: 'audio',
    icon: FaSpotify,
    iconBg: 'bg-[#1DB954]',
    iconColor: 'text-black',
    isConnectable: true,
    gradientClasses: 'bg-gradient-to-b from-[#8EE8B0] via-[#D7F7E3] to-white dark:bg-gradient-to-b dark:from-[#08301B] dark:via-[#0A1E13]/90 dark:to-[#121215]',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    description: 'Stream, clips and community data.',
    category: 'video',
    icon: FaTwitch,
    iconBg: 'bg-[#9146FF]',
    iconColor: 'text-white',
    isConnectable: false,
    gradientClasses: 'bg-gradient-to-b from-[#C3A6FA] via-[#ECE2FD] to-white dark:bg-gradient-to-b dark:from-[#280F4A] dark:via-[#190C2C]/90 dark:to-[#121215]',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    description: 'Share content and track engagement.',
    category: 'social',
    icon: FaXTwitter,
    iconBg: 'bg-black',
    iconColor: 'text-white',
    isConnectable: true,
    gradientClasses: 'bg-gradient-to-b from-[#C5CCD8] via-[#E8ECF2] to-white dark:bg-gradient-to-b dark:from-[#252830] dark:via-[#1A1C22]/90 dark:to-[#121215]',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Showcase your professional journey.',
    category: 'publishing',
    icon: FaLinkedin,
    iconBg: 'bg-[#0A66C2]',
    iconColor: 'text-white',
    isConnectable: false,
    gradientClasses: 'bg-gradient-to-b from-[#9BCEFC] via-[#D8ECFD] to-white dark:bg-gradient-to-b dark:from-[#0B2544] dark:via-[#0A1A2E]/90 dark:to-[#121215]',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Build and manage your community.',
    category: 'community',
    icon: FaDiscord,
    iconBg: 'bg-[#5865F2]',
    iconColor: 'text-white',
    isConnectable: false,
    gradientClasses: 'bg-gradient-to-b from-[#A2B8FD] via-[#DDE6FE] to-white dark:bg-gradient-to-b dark:from-[#131B45] dark:via-[#0F142D]/90 dark:to-[#121215]',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Sync your Page and track performance.',
    category: 'social',
    icon: FaFacebook,
    iconBg: 'bg-[#1877F2]',
    iconColor: 'text-white',
    isConnectable: false,
    gradientClasses: 'bg-gradient-to-b from-[#9ECCFF] via-[#D8EAFD] to-white dark:bg-gradient-to-b dark:from-[#0B2447] dark:via-[#0B1A30]/90 dark:to-[#121215]',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    description: 'Showcase your ideas and drive traffic.',
    category: 'publishing',
    icon: FaPinterest,
    iconBg: 'bg-[#E60023]',
    iconColor: 'text-white',
    isConnectable: false,
    gradientClasses: 'bg-gradient-to-b from-[#FFB5AE] via-[#FFE8E6] to-white dark:bg-gradient-to-b dark:from-[#3D0A0A] dark:via-[#220B0B]/90 dark:to-[#121215]',
  },
];

export default function ConnectedApps() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Active account dropdown & management states
  const [activeMenuAccountId, setActiveMenuAccountId] = useState<string | null>(null);
  const [accountToDisconnect, setAccountToDisconnect] = useState<ActiveAccount | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSyncingAccount, setIsSyncingAccount] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'info',
  });

  // Listen for redirect returns from OAuth (fallback when popup is blocked)
  useEffect(() => {
    const locState = location.state as { oauthToken?: string; platform?: string; autoOpen?: boolean } | undefined;
    const sessionToken = sessionStorage.getItem('connected_apps_token');
    const sessionPlatform = sessionStorage.getItem('connected_apps_platform');

    const token = locState?.oauthToken || sessionToken;
    const platform = locState?.platform || sessionPlatform || 'youtube';

    if (token) {
      sessionStorage.removeItem('connected_apps_token');
      sessionStorage.removeItem('connected_apps_platform');
      dispatch(
        openConnectModal({
          platformId: platform,
          platformName: platform === 'youtube' ? 'YouTube' : platform,
        })
      );
      dispatch(setAuthToken({ token }));
    }
  }, [location.state, dispatch]);

  // Listen for route hash e.g. #youtube, #instagram, #spotify
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, '').toLowerCase();
      if (hash) {
        const matched = ALL_PLATFORMS_BASE.find((p) => p.id === hash);
        if (matched) {
          dispatch(openConnectModal({ platformId: matched.id, platformName: matched.name }));
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [dispatch]);

  const carouselRef = useRef<HTMLDivElement>(null);
  const availableAppsSectionRef = useRef<HTMLDivElement>(null);

  const scrollToAvailableApps = () => {
    availableAppsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Show self-contained toast
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  }, []);

  // Fetch latest authenticated user state on mount
  useEffect(() => {
    let isMounted = true;
    const refreshUserData = async () => {
      try {
        const res = await authService.fetchMe();
        if (isMounted && res?.success && res?.user) {
          dispatch(updateUser(res.user));
        }
      } catch {
        // Silently continue with existing Redux user state
      }
    };
    refreshUserData();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  // Scroll active accounts carousel
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // ── 1. Real Dynamic YouTube Accounts from Redux ──────────────────────────
  const dynamicYoutubeAccounts: ActiveAccount[] = useMemo(() => {
    const rawChannels = user?.youtubeProfile || user?.youtubeChannels || [];
    if (!Array.isArray(rawChannels) || rawChannels.length === 0) return [];

    return rawChannels.map((channel: any, idx: number) => {
      const rawId = channel.id || channel.channel_id || `yt-${idx}`;
      const channelId = channel.channel_id || channel.channelId || '';
      const channelName = channel.channel_name || channel.custom_url || 'YouTube Channel';
      const avatarUrl = channel.thumbnail_url || user?.profilePicture || '';
      const subs = formatCount(channel.subscriber_count);
      const views = formatCount(channel.view_count || channel.video_count);
      const viewsLabel = channel.view_count !== undefined && channel.view_count !== null ? 'Views' : 'Videos';

      return {
        id: channelId || rawId,
        rawProfileId: channel.id || channel.channel_id,
        platform: 'youtube' as const,
        platformIcon: FaYoutube,
        platformBg: 'bg-[#FF0000]',
        platformColor: 'text-white',
        avatar: avatarUrl,
        status: (channel.sync_status === 'syncing' ? 'syncing' : 'connected') as 'connected' | 'syncing',
        name: channelName,
        subtitle: 'YouTube Channel',
        metric1: { value: subs, label: 'Subscribers' },
        metric2: { value: views, label: viewsLabel },
        actionText: 'View Analytics →',
        actionRoute: channelId ? `/youtube-dashboard/${channelId}` : '/youtube-dashboard',
        externalUrl: channelId ? `https://www.youtube.com/channel/${channelId}` : undefined,
        gradientClasses: 'bg-gradient-to-b from-[#FFB5AE] via-[#FFE8E6] to-white dark:bg-gradient-to-b dark:from-[#3D0A0A] dark:via-[#220B0B]/90 dark:to-[#121215]',
      };
    });
  }, [user?.youtubeProfile, user?.youtubeChannels, user?.profilePicture]);

  // ── 2. Real Dynamic Instagram Accounts from Redux ────────────────────────
  const dynamicInstagramAccounts: ActiveAccount[] = useMemo(() => {
    const rawAccounts = user?.instagramAccounts || user?.instagramProfile?.accounts || [];
    if (!Array.isArray(rawAccounts) || rawAccounts.length === 0) return [];

    return rawAccounts.map((account: any, idx: number) => {
      const rawId = account.id || account.account_id || `ig-${idx}`;
      const handle = account.username || account.handle || account.display_name || 'instagram_creator';
      const avatarUrl = account.profile_picture_url || account.profilePictureUrl || user?.profilePicture || '';
      const followers = formatCount(account.followers_count || account.followersCount || 0);
      const media = formatCount(account.media_count || account.mediaCount || 0);

      return {
        id: rawId,
        rawProfileId: account.id || account.account_id,
        platform: 'instagram' as const,
        platformIcon: FaInstagram,
        platformBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
        platformColor: 'text-white',
        avatar: avatarUrl,
        status: 'connected' as const,
        name: handle.startsWith('@') ? handle : `@${handle}`,
        subtitle: 'Instagram Account',
        metric1: { value: followers, label: 'Followers' },
        metric2: { value: media, label: 'Posts' },
        actionText: 'View Insights →',
        actionRoute: '/reels',
        externalUrl: account.username ? `https://instagram.com/${account.username}` : undefined,
        gradientClasses: 'bg-gradient-to-b from-[#FFAECF] via-[#FFE2EE] to-white dark:bg-gradient-to-b dark:from-[#3F0E25] dark:via-[#240C18]/90 dark:to-[#121215]',
      };
    });
  }, [user?.instagramAccounts, user?.instagramProfile, user?.profilePicture]);

  // ── 3. Combined Active Accounts (100% Dynamic, 0 Dummy Data) ─────────────
  const activeAccounts: ActiveAccount[] = useMemo(() => {
    return [...dynamicYoutubeAccounts, ...dynamicInstagramAccounts];
  }, [dynamicYoutubeAccounts, dynamicInstagramAccounts]);

  // ── 4. Dynamically Compute Platform Directory Cards ──────────────────────
  const platformDirectoryList: PlatformCardData[] = useMemo(() => {
    return ALL_PLATFORMS_BASE.map((platform) => {
      const matchingAccounts = activeAccounts.filter((acc) => acc.platform === platform.id);
      const connectedCount = matchingAccounts.length;
      const avatars = matchingAccounts
        .map((acc) => acc.avatar)
        .filter((av) => Boolean(av));

      return {
        ...platform,
        connectedCount,
        avatars,
      };
    });
  }, [activeAccounts]);

  // Filter directory platforms by search and category
  const filteredPlatforms = useMemo(() => {
    return platformDirectoryList.filter((platform) => {
      const matchesCategory = selectedCategory === 'all' || platform.category === selectedCategory;
      const matchesSearch = 
        platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        platform.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [platformDirectoryList, searchQuery, selectedCategory]);

  // ── Connection Initiator (Opens Multi-Platform Connect Modal) ────────────
  const handleConnectAction = (app: PlatformCardData) => {
    dispatch(
      openConnectModal({
        platformId: app.id,
        platformName: app.name,
      })
    );
  };

  // ── Manual Sync Action ───────────────────────────────────────────────────
  const handleManualSync = async (account: ActiveAccount) => {
    setActiveMenuAccountId(null);
    setIsSyncingAccount(account.id);
    try {
      if (account.platform === 'youtube') {
        await api.post('/youtube-creator/channel/sync-manual');
      } else if (account.platform === 'instagram') {
        await api.post('/instagram-creator/sync-manual');
      }
      const res = await authService.fetchMe();
      if (res?.success && res?.user) {
        dispatch(updateUser(res.user));
      }
      showToast(`Synced latest analytics for ${account.name}!`, 'success');
    } catch {
      showToast(`Unable to sync ${account.name}. Please try again later.`, 'error');
    } finally {
      setIsSyncingAccount(null);
    }
  };

  // ── Disconnect Account Action ────────────────────────────────────────────
  const confirmDisconnect = async () => {
    if (!accountToDisconnect) return;
    setIsDisconnecting(true);

    try {
      if (accountToDisconnect.platform === 'youtube') {
        if (accountToDisconnect.rawProfileId) {
          await api.delete(`/creator/youtube/channel/${accountToDisconnect.rawProfileId}`);
        }
        const remainingYt = (user?.youtubeProfile || []).filter(
          (ch: any) => (ch.id || ch.channel_id) !== accountToDisconnect.rawProfileId && ch.channel_id !== accountToDisconnect.id
        );
        dispatch(updateUser({ youtubeProfile: remainingYt, youtubeChannels: remainingYt }));
      } else if (accountToDisconnect.platform === 'instagram') {
        if (accountToDisconnect.rawProfileId) {
          await api.delete(`/creator/instagram/account/${accountToDisconnect.rawProfileId}`);
        }
        const remainingIg = (user?.instagramAccounts || []).filter(
          (ig: any) => ig.id !== accountToDisconnect.rawProfileId && ig.account_id !== accountToDisconnect.id
        );
        dispatch(updateUser({ instagramAccounts: remainingIg }));
      }

      showToast(`${accountToDisconnect.name} disconnected successfully.`, 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || `Failed to disconnect ${accountToDisconnect.name}.`;
      showToast(msg, 'error');
    } finally {
      setIsDisconnecting(false);
      setAccountToDisconnect(null);
    }
  };

  return (
    <div className={`w-full min-h-full pb-24 font-sans select-none transition-colors duration-200 ${
      isDarkMode ? 'bg-[#000000] text-white' : 'bg-white text-zinc-900'
    }`}>
      {/* Click outside to close 3-dots account menu */}
      {activeMenuAccountId && (
        <div 
          className="fixed inset-0 z-20"
          onClick={() => setActiveMenuAccountId(null)}
        />
      )}

      <div className="w-full px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">

        {/* ── 1. Top Header Area ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-0.5">
              CREATOR ECOSYSTEM
            </p>
            <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-tight text-zinc-950 dark:text-white font-display leading-tight">
              Connected Apps
            </h1>
          </div>

          <button
            onClick={scrollToAvailableApps}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xs shrink-0 cursor-pointer active:scale-[0.98]"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Connect account</span>
          </button>
        </div>

        {/* ── 2. Active Accounts Section (Dynamic Carousel or Empty State) ─ */}
        <div className="mt-8">
          {/* Section Header with Left/Right Controls */}
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="text-[15px] font-bold text-zinc-950 dark:text-white leading-tight">
                Active accounts ({activeAccounts.length})
              </h2>
              <p className="text-[12px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Your connected accounts with live data and sync status.
              </p>
            </div>

            {activeAccounts.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft size={14} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>

          {/* Active Accounts Content: Empty State vs Live Carousel */}
          {activeAccounts.length === 0 ? (
            <div className={`w-full rounded-[22px] border-none p-8 sm:p-10 flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] ${
              isDarkMode 
                ? 'bg-gradient-to-b from-[#1C1D24] via-[#15161B] to-[#121215]' 
                : 'bg-gradient-to-b from-[#F7F9FC] via-[#F1F4F9] to-white'
            }`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-sm ${
                isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-zinc-900'
              }`}>
                <Link2 size={24} className="opacity-80" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                No Connected Accounts Yet
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 max-w-md mt-1.5 leading-relaxed">
                Connect your YouTube channel, Instagram, or creative platforms below to sync real-time analytics, automate multi-platform workflows, and showcase verified reach.
              </p>
              <button
                onClick={scrollToAvailableApps}
                className={`mt-5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm ${
                  isDarkMode
                    ? 'bg-white hover:bg-zinc-100 text-black'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                }`}
              >
                <Plus size={16} />
                Connect Your First Account
              </button>
            </div>
          ) : (
            /* Carousel Viewport with Borderless Gradient Cards */
            <div className="relative group">
              <div
                ref={carouselRef}
                className="flex items-stretch gap-3.5 overflow-x-auto scrollbar-hide pb-2 pt-0.5 select-none"
              >
                {activeAccounts.map((account) => {
                  const IconComponent = account.platformIcon;
                  const isSyncing = account.status === 'syncing';
                  const isMenuOpen = activeMenuAccountId === account.id;

                  return (
                    <div
                      key={account.id}
                      className={`w-[196px] sm:w-[206px] shrink-0 rounded-[20px] border-none transition-all duration-200 p-3.5 flex flex-col justify-between relative shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] ${account.gradientClasses}`}
                    >
                      {/* Top Row: Platform Icon (Left) + Connected Badge (Center) + Three Dots (Right) */}
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2.5">
                          {/* Platform Icon */}
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center shadow-xs shrink-0 ${account.platformBg} ${account.platformColor}`}>
                            <IconComponent className="text-[12px]" />
                          </div>

                          {/* Top Center: Connected / Syncing Badge */}
                          <div className="flex-1 flex justify-center">
                            {isSyncing ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-white/80 dark:bg-black/40 border border-blue-200/50 dark:border-blue-700/40 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Syncing
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-white/80 dark:bg-black/40 border border-emerald-200/50 dark:border-emerald-700/40 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Connected
                              </span>
                            )}
                          </div>

                          {/* Right: Three Dots Dropdown */}
                          <div className="relative shrink-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuAccountId(isMenuOpen ? null : account.id);
                              }}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 -mr-1 transition-colors cursor-pointer rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                              title="Account Options"
                            >
                              <MoreVertical size={13} />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute right-0 top-7 w-40 rounded-xl border p-1 shadow-xl z-30 ${
                                  isDarkMode ? 'bg-[#18181C] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                                }`}
                              >
                                {account.externalUrl && (
                                  <a
                                    href={account.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setActiveMenuAccountId(null)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                                      isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'
                                    }`}
                                  >
                                    <ExternalLink size={12} />
                                    <span>Open Channel</span>
                                  </a>
                                )}

                                <button
                                  onClick={() => handleManualSync(account)}
                                  disabled={isSyncingAccount === account.id}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                                    isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'
                                  }`}
                                >
                                  <RefreshCw size={12} className={isSyncingAccount === account.id ? 'animate-spin' : ''} />
                                  <span>{isSyncingAccount === account.id ? 'Syncing...' : 'Sync Data'}</span>
                                </button>

                                <div className="my-1 border-t border-black/5 dark:border-white/10" />

                                <button
                                  onClick={() => {
                                    setActiveMenuAccountId(null);
                                    setAccountToDisconnect(account);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                  <span>Disconnect</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle: Centered Avatar + Handle & Subtitle */}
                        <div className="flex flex-col items-center text-center mt-1">
                          {/* Avatar with image error fallback & status dot */}
                          <div className="relative mb-1.5">
                            {account.avatar ? (
                              <img
                                src={account.avatar}
                                alt={account.name}
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
                              />
                            ) : null}
                            <div 
                              style={{ display: account.avatar ? 'none' : 'flex' }}
                              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full items-center justify-center ring-1 ring-black/5 dark:ring-white/10 font-bold text-sm ${
                                isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-800'
                              }`}
                            >
                              {account.name.replace(/^@/, '').charAt(0).toUpperCase() || 'A'}
                            </div>
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ${
                              isDarkMode ? 'ring-[#15171A]' : 'ring-white'
                            } ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                          </div>

                          {/* Account Name */}
                          <h3 className="text-[12.5px] font-bold text-zinc-950 dark:text-white truncate max-w-[160px] leading-tight">
                            {account.name}
                          </h3>

                          {/* Subtitle */}
                          <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[160px] mt-0.5">
                            {account.subtitle}
                          </p>
                        </div>

                        {/* Metrics 2-column strip (Clean, No Top Border Line) */}
                        <div className="grid grid-cols-2 gap-1 text-center mt-2.5 pt-0.5">
                          <div>
                            <span className="block text-[12.5px] font-bold text-zinc-950 dark:text-white font-display">
                              {account.metric1.value}
                            </span>
                            <span className="block text-[9.5px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {account.metric1.label}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[12.5px] font-bold text-zinc-950 dark:text-white font-display">
                              {account.metric2.value}
                            </span>
                            <span className="block text-[9.5px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {account.metric2.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Button (Clean Pill in Both Themes) */}
                      <button
                        onClick={() => navigate(account.actionRoute)}
                        className={`w-full mt-2.5 py-1.5 px-2.5 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98] ${
                          isDarkMode 
                            ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10 shadow-2xs' 
                            : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/80 shadow-2xs'
                        }`}
                      >
                        <span>{account.actionText}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Connect Another Account Section (5x2 Borderless Grid) ────── */}
        <div ref={availableAppsSectionRef} className="mt-9 scroll-mt-6">
          {/* Header Row: Title on Left, Search & Dropdown on Right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-zinc-950 dark:text-white leading-tight">
                Connect another account
              </h2>
              <p className="text-[12px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Link new platforms to expand your reach. Each connection is secure and can be added anytime.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Input */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search platforms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`h-8.5 pl-8 pr-3 w-44 sm:w-48 rounded-xl text-[12px] font-medium border transition-all focus:outline-none ${
                    isDarkMode 
                      ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700' 
                      : 'bg-white border-zinc-200/90 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
                  }`}
                />
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`h-8.5 px-3 rounded-xl border text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isDarkMode 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-850' 
                      : 'bg-white border-zinc-200/90 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <span className="capitalize">
                    {selectedCategory === 'all' ? 'All Platforms' : selectedCategory}
                  </span>
                  <ChevronDown size={13} className="text-zinc-400" />
                </button>

                {isDropdownOpen && (
                  <div className={`absolute right-0 mt-1.5 w-40 rounded-xl border p-1 shadow-lg z-20 ${
                    isDarkMode ? 'bg-[#18181C] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}>
                    {[
                      { id: 'all', label: 'All Platforms' },
                      { id: 'video', label: 'Video' },
                      { id: 'social', label: 'Social & Short' },
                      { id: 'audio', label: 'Audio & Music' },
                      { id: 'community', label: 'Community' },
                      { id: 'publishing', label: 'Publishing' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                          selectedCategory === cat.id 
                            ? 'bg-zinc-100 dark:bg-zinc-800 font-bold' 
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5-Column Borderless Grid with Dual-Theme Top-to-Bottom Gradients */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {filteredPlatforms.map((platform) => {
              const IconComponent = platform.icon;
              const hasConnected = Boolean(platform.connectedCount && platform.connectedCount > 0);

              return (
                <div
                  key={platform.id}
                  className={`rounded-[20px] border-none p-4 flex flex-col justify-between min-h-[148px] transition-all duration-200 hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] ${platform.gradientClasses}`}
                >
                  {/* Top: Icon, Title & Description */}
                  <div>
                    <div className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center shadow-xs mb-2.5 ${platform.iconBg} ${platform.iconColor}`}>
                      <IconComponent className="text-[14px]" />
                    </div>

                    <h3 className="text-[13px] font-bold text-zinc-950 dark:text-white leading-tight">
                      {platform.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2 mt-0.5">
                      {platform.description}
                    </p>
                  </div>

                  {/* Bottom: Left = Dynamic Avatars / Status, Right = Action Button */}
                  <div className="pt-3 mt-auto flex items-center justify-between gap-1.5">
                    {hasConnected ? (
                      <>
                        {/* Connected: Overlapping circular avatars + real dynamic count */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="flex items-center -space-x-1.5 shrink-0">
                            {(platform.avatars || []).slice(0, 2).map((av, idx) => (
                              av ? (
                                <img
                                  key={idx}
                                  src={av}
                                  alt="Account"
                                  className="w-5 h-5 rounded-full object-cover ring-2 ring-white dark:ring-[#1E1E24]"
                                />
                              ) : (
                                <div
                                  key={idx}
                                  className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 ring-2 ring-white dark:ring-[#1E1E24] flex items-center justify-center text-[9px] font-bold text-zinc-700 dark:text-zinc-300"
                                >
                                  {platform.name.charAt(0)}
                                </div>
                              )
                            ))}
                          </div>
                          <span className="text-[10.5px] font-medium text-zinc-600 dark:text-zinc-400 truncate">
                            {platform.connectedCount} {platform.connectedCount === 1 ? 'account' : 'accounts'}
                          </span>
                        </div>

                        {/* Add account button */}
                        <button
                          onClick={() => handleConnectAction(platform)}
                          className={`shrink-0 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer active:scale-95 ${
                            isDarkMode 
                              ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10 shadow-2xs' 
                              : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/80 shadow-2xs'
                          }`}
                        >
                          Add account
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Not Connected: Two grey silhouette avatars + "No accounts" */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="flex items-center -space-x-1.5 shrink-0">
                            <div className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 flex items-center justify-center ring-2 ring-white dark:ring-[#1E1E24]">
                              <UserIcon size={10} />
                            </div>
                            <div className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 flex items-center justify-center ring-2 ring-white dark:ring-[#1E1E24]">
                              <UserIcon size={10} />
                            </div>
                          </div>
                          <span className="text-[10.5px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                            No accounts
                          </span>
                        </div>

                        {/* Connect button */}
                        <button
                          onClick={() => handleConnectAction(platform)}
                          className={`shrink-0 px-3.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer active:scale-95 ${
                            isDarkMode 
                              ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10 shadow-2xs' 
                              : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/80 shadow-2xs'
                          }`}
                        >
                          Connect
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>



      {/* ── Disconnect Confirmation Modal ─────────────────────────────── */}
      {/* ── Disconnect Confirmation / Warning Modal ─────────────────────── */}
      <AnimatePresence>
        {accountToDisconnect && (() => {
          const totalAccounts = activeAccounts.length;
          const isBlocked = totalAccounts <= 1;
          const isWarningLast = totalAccounts === 2;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl relative ${
                  isDarkMode ? 'bg-[#18181C] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                }`}
              >
                {/* Icon header */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isBlocked 
                      ? 'bg-amber-500/10 text-amber-500'
                      : isWarningLast 
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {isBlocked ? (
                      <AlertCircle size={22} />
                    ) : isWarningLast ? (
                      <AlertTriangle size={20} />
                    ) : (
                      <Trash2 size={20} />
                    )}
                  </div>
                  <button
                    onClick={() => setAccountToDisconnect(null)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Case 1: Blocked (Only 1 account connected) */}
                {isBlocked ? (
                  <>
                    <h3 className="text-[16px] font-bold font-display text-zinc-950 dark:text-white">
                      Cannot Disconnect Account
                    </h3>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1.5 mb-4">
                      As an active creator on SuviX, your profile must maintain at least <span className="font-semibold text-zinc-900 dark:text-zinc-200">one connected social account</span> to preserve your creator dashboard, analytics, and deal opportunities.
                    </p>
                    <div className={`p-3 rounded-xl border text-[11.5px] leading-relaxed mb-5 ${
                      isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}>
                      <p className="font-bold flex items-center gap-1.5 mb-0.5">
                        <AlertCircle size={13} className="shrink-0" /> Policy Requirement
                      </p>
                      To disconnect <span className="font-semibold">{accountToDisconnect.name}</span>, please link another YouTube channel or Instagram account first.
                    </div>
                    <button
                      onClick={() => setAccountToDisconnect(null)}
                      className="w-full py-2.5 rounded-xl text-[12px] font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 transition-all cursor-pointer"
                    >
                      Understood
                    </button>
                  </>
                ) : isWarningLast ? (
                  /* Case 2: Warning (2 accounts, deleting this leaves 1 that CANNOT be deleted) */
                  <>
                    <h3 className="text-[16px] font-bold font-display text-zinc-950 dark:text-white">
                      Disconnect {accountToDisconnect.name}?
                    </h3>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1.5 mb-3">
                      Are you sure you want to remove this {accountToDisconnect.subtitle.toLowerCase()}? Live analytics and automated sync will pause immediately.
                    </p>
                    <div className={`p-3 rounded-xl border text-[11.5px] leading-relaxed mb-5 ${
                      isDarkMode ? 'bg-amber-500/10 border-amber-500/25 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <AlertTriangle size={13} className="shrink-0 text-amber-500" />
                        <span>Important Notice</span>
                      </div>
                      <p>
                        You currently have <span className="font-bold">2 connected accounts</span>. If you disconnect this account, you will have only <span className="font-bold">1 account remaining</span>, which <span className="font-bold underline">CANNOT be deleted or disconnected</span> under SuviX creator policies unless another account is linked.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setAccountToDisconnect(null)}
                        disabled={isDisconnecting}
                        className={`flex-1 py-2 rounded-xl text-[12px] font-bold border transition-colors cursor-pointer ${
                          isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDisconnect}
                        disabled={isDisconnecting}
                        className="flex-1 py-2 rounded-xl text-[12px] font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isDisconnecting ? 'Disconnecting...' : 'I Understand, Disconnect'}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Case 3: Standard Confirmation (>2 accounts) */
                  <>
                    <h3 className="text-[16px] font-bold font-display text-zinc-950 dark:text-white">
                      Disconnect {accountToDisconnect.name}?
                    </h3>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1.5 mb-5">
                      Are you sure you want to remove this {accountToDisconnect.subtitle.toLowerCase()}? Live analytics and automated sync will pause immediately.
                    </p>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setAccountToDisconnect(null)}
                        disabled={isDisconnecting}
                        className={`flex-1 py-2 rounded-xl text-[12px] font-bold border transition-colors cursor-pointer ${
                          isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDisconnect}
                        disabled={isDisconnecting}
                        className="flex-1 py-2 rounded-xl text-[12px] font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ── Toast Notification Banner ──────────────────────────────────── */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? isDarkMode
                  ? 'bg-emerald-950/90 border-emerald-800 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : toast.type === 'error'
                ? isDarkMode
                  ? 'bg-red-950/90 border-red-800 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-800'
                : isDarkMode
                ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle size={16} className="text-red-500 shrink-0" />
            ) : (
              <Info size={16} className="text-blue-500 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Multi-Platform Connect & Sync Modal ────────────────────────── */}
      <ConnectAppModal
        onSuccess={() => showToast('Channel successfully connected and synced!', 'success')}
      />
    </div>
  );
}
