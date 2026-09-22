import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Sparkles,
  Users,
  Video,
  Check,
  AlertCircle,
  Clock,
  Plus,
  Play,
  Eye,
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
  FaPinterest,
} from 'react-icons/fa6';
import { useTheme } from '../../hooks/useTheme';
import {
  selectConnectedApps,
  closeConnectModal,
  resetConnectedAppFlow,
  setStep,
  setAuthToken,
  setDiscoveredChannels,
  setSelectedChannelId,
  setSelectedNiche,
  setSyncProgress,
  setSyncSuccess,
  setFlowError,
} from '../../store/slices/connectedAppsSlice';
import type { DiscoveredChannel } from '../../store/slices/connectedAppsSlice';
import { updateUser } from '../../store/slices/authSlice';
import { api } from '../../api/client';
import { authService } from '../../api/services/auth.service';

const YOUTUBE_NICHES = [
  'Technology & Coding',
  'Gaming & Esports',
  'Entertainment & Comedy',
  'Education & Tutorials',
  'Lifestyle & Vlogging',
  'Music & Audio',
  'Fitness & Health',
  'Finance & Business',
  'Science & Innovation',
  'Other',
];

interface ConnectAppModalProps {
  onSuccess?: () => void;
}

export const ConnectAppModal: React.FC<ConnectAppModalProps> = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();
  const flowState = useSelector(selectConnectedApps);

  const {
    isModalOpen,
    activePlatformId,
    activePlatformName,
    step,
    discoveredChannels,
    selectedChannelId,
    selectedNiche,
    syncProgress,
    syncStatusMessage,
    errorMessage,
  } = flowState;

  const [confirmExitPrompt, setConfirmExitPrompt] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const popupRef = useRef<Window | null>(null);

  // Format large numbers
  const formatCount = (count?: number | string | null): string => {
    if (!count) return '0';
    const num = typeof count === 'string' ? parseInt(count, 10) : count;
    if (isNaN(num)) return '0';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Format video publish date
  const formatVideoDate = (dateStr?: string): string => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recent';
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  // Sync window route hash with modal state (e.g. connected-apps#youtube)
  useEffect(() => {
    if (isModalOpen && activePlatformId) {
      if (window.location.hash !== `#${activePlatformId}`) {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}#${activePlatformId}`
        );
      }
    } else {
      if (window.location.hash) {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}`
        );
      }
    }
  }, [isModalOpen, activePlatformId]);

  // Safe Exit Handler (resets Redux state completely and clears hash)
  const handleClose = useCallback(() => {
    if (step === 'syncing') {
      setConfirmExitPrompt(true);
      return;
    }
    setConfirmExitPrompt(false);
    if (window.location.hash) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`
      );
    }
    dispatch(closeConnectModal());
  }, [dispatch, step]);

  const forceExit = useCallback(() => {
    setConfirmExitPrompt(false);
    if (window.location.hash) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`
      );
    }
    dispatch(resetConnectedAppFlow());
  }, [dispatch]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, handleClose]);

  // Channel discovery caller for YouTube
  const fetchChannels = useCallback(
    async (token: string) => {
      dispatch(setStep('discovering'));
      try {
        const res = await api.post('/auth/youtube/channels', { accessToken: token });
        if (res.data?.success && res.data?.channels && res.data.channels.length > 0) {
          const channels: DiscoveredChannel[] = res.data.channels.map((ch: any) => ({
            channelId: ch.channelId || ch.channel_id || ch.id,
            channelName: ch.channelName || ch.channel_name || ch.title || 'YouTube Channel',
            thumbnailUrl: ch.thumbnailUrl || ch.thumbnail_url || ch.thumbnail || '',
            subscriberCount: Number(ch.subscriberCount || ch.subscriber_count || 0),
            videoCount: Number(ch.videoCount || ch.video_count || 0),
            viewCount: String(ch.viewCount || ch.view_count || '0'),
            description: ch.description || '',
            customUrl: ch.customUrl || ch.custom_url || '',
            isClaimed: Boolean(ch.isClaimed),
            niche: ch.niche || '',
            videos: Array.isArray(ch.videos) ? ch.videos : [],
          }));
          dispatch(setDiscoveredChannels(channels));
        } else {
          dispatch(
            setFlowError(
              'No YouTube channel was found for this Google account. Please connect an account with an active YouTube channel.'
            )
          );
        }
      } catch (err: any) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          'Failed to retrieve YouTube channels. Please try again.';
        dispatch(setFlowError(msg));
      }
    },
    [dispatch]
  );

  // Common handler when OAuth token is received from popup (via postMessage, BroadcastChannel, or storage event)
  const handleOAuthToken = useCallback(
    (token: string, platform?: string) => {
      dispatch(setAuthToken({ token }));
      if (platform === 'youtube' || activePlatformId === 'youtube') {
        fetchChannels(token);
      }
      if (popupRef.current && !popupRef.current.closed) {
        try {
          popupRef.current.close();
        } catch {
          // ignore
        }
      }
    },
    [dispatch, activePlatformId, fetchChannels]
  );

  // 1. Listen for postMessage from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'SUVIX_OAUTH_SUCCESS' && event.data?.token) {
        handleOAuthToken(event.data.token, event.data.platform);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleOAuthToken]);

  // 2. Listen via BroadcastChannel (rock-solid cross-window communication)
  useEffect(() => {
    let broadcast: BroadcastChannel | null = null;
    try {
      broadcast = new BroadcastChannel('suvix_oauth_channel');
      broadcast.onmessage = (event) => {
        if (event.data?.type === 'SUVIX_OAUTH_SUCCESS' && event.data?.token) {
          handleOAuthToken(event.data.token, event.data.platform);
        }
      };
    } catch (err) {
      console.warn('[ConnectModal] BroadcastChannel not supported:', err);
    }

    return () => {
      broadcast?.close();
    };
  }, [handleOAuthToken]);

  // 3. Listen via localStorage storage event (fallback when window.opener is severed by Google)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'suvix_oauth_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.type === 'SUVIX_OAUTH_SUCCESS' && parsed.token) {
            localStorage.removeItem('suvix_oauth_event');
            handleOAuthToken(parsed.token, parsed.platform);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [handleOAuthToken]);

  // When accessToken is present (e.g. returning from Google OAuth in same browser tab), fetch channels automatically
  useEffect(() => {
    if (
      flowState.accessToken &&
      flowState.activePlatformId === 'youtube' &&
      flowState.discoveredChannels.length === 0 &&
      (flowState.step === 'idle' || flowState.step === 'authorizing')
    ) {
      fetchChannels(flowState.accessToken);
    }
  }, [
    flowState.accessToken,
    flowState.activePlatformId,
    flowState.discoveredChannels.length,
    flowState.step,
    fetchChannels,
  ]);

  // Initiate YouTube OAuth flow directly in the CURRENT browser tab (no secondary popup window)
  const handleInitiateYouTubeOAuth = () => {
    sessionStorage.setItem('oauth_origin', 'connected_apps');
    localStorage.setItem('oauth_origin', 'connected_apps');
    sessionStorage.setItem('oauth_intent', 'connect_youtube');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';
    window.location.href = `${apiUrl}/auth/google/youtube`;
  };

  // Initiate Instagram OAuth flow
  const handleInitiateInstagramOAuth = () => {
    sessionStorage.setItem('oauth_origin', 'connected_apps');
    localStorage.setItem('oauth_origin', 'connected_apps');
    sessionStorage.setItem('oauth_intent', 'connect_instagram');
    localStorage.setItem('instagram_oauth_pending', 'true');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';
    window.location.href = `${apiUrl}/auth/meta/instagram`;
  };

  // Perform foreground manual sync for YouTube
  const handleConfirmAndSyncYouTube = async () => {
    const selectedChannel = discoveredChannels.find((c) => c.channelId === selectedChannelId);
    if (!selectedChannel) return;

    try {
      dispatch(
        setSyncProgress({
          progress: 20,
          message: 'Authorizing channel and verifying ownership...',
        })
      );

      const channelPayload = {
        ...selectedChannel,
        niche: selectedNiche || selectedChannel.niche || 'Other',
      };

      await api.post('/youtube-creator/channel/link', {
        channel: channelPayload,
      });

      dispatch(
        setSyncProgress({
          progress: 50,
          message: 'Mirroring high-resolution channel artwork and media...',
        })
      );

      dispatch(
        setSyncProgress({
          progress: 80,
          message: 'Syncing real-time video metrics and audience analytics...',
        })
      );

      await api.post('/youtube-creator/channel/sync-manual');

      dispatch(
        setSyncProgress({
          progress: 95,
          message: 'Finalizing live connection...',
        })
      );

      const meRes = await authService.fetchMe();
      if (meRes?.success && meRes?.user) {
        dispatch(updateUser(meRes.user));
      }

      dispatch(setSyncSuccess());
      onSuccess?.();

      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to link and sync channel. Please try again.';
      dispatch(setFlowError(msg));
    }
  };

  if (!isModalOpen) return null;

  const selectedChannel = discoveredChannels.find((c) => c.channelId === selectedChannelId);

  // Platform icon and color resolver
  const renderPlatformHeaderIcon = () => {
    switch (activePlatformId) {
      case 'youtube':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center shadow-2xs">
            <FaYoutube size={22} />
          </div>
        );
      case 'instagram':
        return (
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shadow-2xs">
            <FaInstagram size={22} />
          </div>
        );
      case 'tiktok':
        return (
          <div className="w-10 h-10 rounded-xl bg-cyan-400/10 text-cyan-400 flex items-center justify-center shadow-2xs">
            <FaTiktok size={20} />
          </div>
        );
      case 'twitter':
        return (
          <div className="w-10 h-10 rounded-xl bg-zinc-500/10 text-zinc-300 flex items-center justify-center shadow-2xs">
            <FaXTwitter size={20} />
          </div>
        );
      case 'spotify':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-2xs">
            <FaSpotify size={20} />
          </div>
        );
      case 'twitch':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-2xs">
            <FaTwitch size={20} />
          </div>
        );
      case 'discord':
        return (
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-2xs">
            <FaDiscord size={20} />
          </div>
        );
      case 'facebook':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shadow-2xs">
            <FaFacebook size={20} />
          </div>
        );
      case 'linkedin':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-2xs">
            <FaLinkedin size={20} />
          </div>
        );
      case 'pinterest':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shadow-2xs">
            <FaPinterest size={20} />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-2xs">
            <Sparkles size={20} />
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`relative w-full max-w-lg sm:max-w-xl rounded-[26px] overflow-hidden border shadow-2xl z-10 flex flex-col max-h-[90vh] ${
            isDarkMode
              ? 'bg-[#121316] border-zinc-800 text-white shadow-black/80'
              : 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-400/20'
          }`}
        >
          {/* Top Header */}
          <div className="px-6 pt-5 pb-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {renderPlatformHeaderIcon()}
              <div>
                <h3 className="text-base sm:text-lg font-bold font-display leading-tight">
                  Connect {activePlatformName || 'Platform'}
                </h3>
                <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {activePlatformId === 'youtube'
                    ? 'Official Google OAuth Data Sync'
                    : activePlatformId === 'instagram'
                    ? 'Meta Graph API Verification'
                    : 'Creator Platform Integration'}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              disabled={step === 'syncing'}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
              title="Close"
            >
              <X size={17} />
            </button>
          </div>

          {/* Modal Body: DYNAMIC BASED ON PLATFORM */}
          <div className="p-6 overflow-y-auto scrollbar-hide space-y-5">
            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* 1. YOUTUBE SPECIFIC FLOW                                           */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {activePlatformId === 'youtube' && (
              <>
                {/* ── STEP: IDLE / AUTHORIZE ───────────────────────────────── */}
                {step === 'idle' && (
                  <div className="space-y-5">
                    <div
                      className={`p-4 rounded-2xl border ${
                        isDarkMode
                          ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300'
                          : 'bg-zinc-50 border-zinc-200/80 text-zinc-700'
                      }`}
                    >
                      <p className="text-xs leading-relaxed">
                        Link your verified YouTube channel to display live subscriber counts, automate video analytics synchronization, and showcase verified proof of reach to brands.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                        <span>Real-time subscriber, view, and video count synchronization</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                        <span>Read-only analytics access (no posting or modifying rights)</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                        <span>Instant access to Creator Studio analytics & metrics</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleInitiateYouTubeOAuth}
                        className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer active:scale-[0.99]"
                      >
                        <FaYoutube size={18} />
                        <span>Sign in with Google to Connect</span>
                      </button>
                      <p className="text-[10.5px] text-zinc-400 text-center mt-2.5 flex items-center justify-center gap-1">
                        <Shield size={12} className="text-emerald-500" />
                        <span>Secured with official YouTube Data API v3 OAuth</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* ── STEP: AUTHORIZING (Popup opened) ─────────────────────── */}
                {step === 'authorizing' && (
                  <div className="py-8 flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full border-3 border-red-500/20 border-t-red-600 animate-spin flex items-center justify-center" />
                      <div className="absolute inset-0 flex items-center justify-center text-red-600">
                        <FaYoutube size={20} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white">
                        Waiting for Google Authorization...
                      </h4>
                      <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                        Complete authorization in the Google pop-up window. If the pop-up did not open, click below.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={handleInitiateYouTubeOAuth}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Re-open Pop-up
                      </button>
                      <button
                        onClick={() => dispatch(setStep('idle'))}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP: DISCOVERING CHANNELS (Professional Centered App Icon Loader) ── */}
                {step === 'discovering' && (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-red-500/20 border-t-red-600 animate-spin" />
                      <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center shadow-xs">
                        <FaYoutube size={22} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white">
                        Fetching YouTube Details...
                      </h4>
                      <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                        Connecting your channel data and subscriber metrics.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── STEP: CHANNEL SELECT ──────────────────────────────────── */}
                {step === 'channel_select' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                        Select Channel to Link
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        We found {discoveredChannels.length} channel{discoveredChannels.length > 1 ? 's' : ''} associated with your account.
                      </p>
                    </div>

                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {discoveredChannels.map((channel) => {
                        const isSelected = selectedChannelId === channel.channelId;
                        const isClaimed = channel.isClaimed;

                        return (
                          <div
                            key={channel.channelId}
                            onClick={() => {
                              if (!isClaimed) {
                                dispatch(setSelectedChannelId(channel.channelId));
                              }
                            }}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? isDarkMode
                                  ? 'bg-red-950/20 border-red-500/50 ring-1 ring-red-500/40'
                                  : 'bg-red-50/50 border-red-300 ring-1 ring-red-200'
                                : isClaimed
                                ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                                : isDarkMode
                                ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                                : 'bg-zinc-50/80 border-zinc-200 hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {channel.thumbnailUrl && !failedImages[channel.channelId] ? (
                                <img
                                  src={channel.thumbnailUrl}
                                  alt={channel.channelName}
                                  referrerPolicy="no-referrer"
                                  crossOrigin="anonymous"
                                  onError={() =>
                                    setFailedImages((prev) => ({
                                      ...prev,
                                      [channel.channelId]: true,
                                    }))
                                  }
                                  className="w-11 h-11 rounded-full object-cover shrink-0 ring-1 ring-black/5 dark:ring-white/10"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ring-1 ring-white/10">
                                  {channel.channelName.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h5 className="text-xs sm:text-[13px] font-bold text-zinc-950 dark:text-white truncate">
                                    {channel.channelName}
                                  </h5>
                                  {channel.customUrl && (
                                    <span className="text-[10px] text-zinc-400 truncate">
                                      {channel.customUrl}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                  <span className="flex items-center gap-1">
                                    <Users size={11} className="text-zinc-400" />
                                    <strong className="font-semibold text-zinc-900 dark:text-white">
                                      {formatCount(channel.subscriberCount)}
                                    </strong>{' '}
                                    subs
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Video size={11} className="text-zinc-400" />
                                    <strong className="font-semibold text-zinc-900 dark:text-white">
                                      {channel.videoCount}
                                    </strong>{' '}
                                    videos
                                  </span>
                                </div>

                                {isClaimed && (
                                  <p className="text-[10px] text-amber-500 font-semibold mt-1">
                                    Already linked to an account
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {selectedChannel?.isClaimed ? (
                      <div className="pt-2 space-y-3">
                        <div
                          className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                            isDarkMode
                              ? 'bg-amber-950/20 border border-amber-800/40 text-amber-300'
                              : 'bg-amber-50 border border-amber-200 text-amber-800'
                          }`}
                        >
                          <AlertTriangle size={16} className="shrink-0 text-amber-500 mt-0.5" />
                          <div>
                            <p className="font-bold">Channel Already Linked</p>
                            <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                              This YouTube channel is already connected to an account on SuviX. To link another channel or Brand account, click below to select a different Google account.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleInitiateYouTubeOAuth}
                          className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-[0.99]"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                          <span>Add Another YouTube Channel</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* ── Latest 5 Videos Preview ── */}
                        {selectedChannel && Array.isArray(selectedChannel.videos) && selectedChannel.videos.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-3.5 bg-red-600 rounded-full" />
                                <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                                  Recent Uploads ({Math.min(selectedChannel.videos.length, 5)})
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                                YouTube Preview
                              </span>
                            </div>

                            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 -mx-1 px-1">
                              {selectedChannel.videos.slice(0, 5).map((vid: any, idx: number) => {
                                const videoId = vid.id || vid.videoId || `vid-${idx}`;
                                const viewCountStr = formatCount(vid.viewCount);
                                const dateStr = formatVideoDate(vid.publishedAt);

                                return (
                                  <div
                                    key={videoId}
                                    className={`shrink-0 w-44 sm:w-48 rounded-xl border overflow-hidden transition-all duration-200 group flex flex-col ${
                                      isDarkMode
                                        ? 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700'
                                        : 'bg-zinc-50 border-zinc-200/90 hover:border-zinc-300 hover:bg-white hover:shadow-xs'
                                    }`}
                                  >
                                    {/* Video Thumbnail */}
                                    <div className="relative aspect-video w-full bg-black overflow-hidden">
                                      <img
                                        src={vid.thumbnail || 'https://via.placeholder.com/320x180?text=No+Thumbnail'}
                                        alt={vid.title}
                                        referrerPolicy="no-referrer"
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      />
                                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                                          <Play size={13} fill="currentColor" className="ml-0.5" />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Video Details */}
                                    <div className="p-2.5 flex-1 flex flex-col justify-between gap-1.5">
                                      <h6
                                        title={vid.title}
                                        className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight"
                                      >
                                        {vid.title}
                                      </h6>

                                      <div className="flex items-center justify-between text-[9.5px] text-zinc-500 dark:text-zinc-400 font-medium pt-0.5">
                                        <span className="flex items-center gap-1 truncate">
                                          <Eye size={10} className="shrink-0 text-zinc-400" />
                                          {viewCountStr} views
                                        </span>
                                        <span className="shrink-0">{dateStr}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="pt-1">
                          <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span>Primary Content Category</span>
                            <span
                              className={`text-[10px] font-semibold normal-case ${
                                !selectedNiche ? 'text-amber-500' : 'text-emerald-500'
                              }`}
                            >
                              {!selectedNiche ? 'Required' : 'Selected'}
                            </span>
                          </label>
                          <select
                            value={selectedNiche || ''}
                            onChange={(e) => dispatch(setSelectedNiche(e.target.value))}
                            className={`w-full h-9 px-3 rounded-xl text-xs font-medium border transition-colors focus:outline-none ${
                              isDarkMode
                                ? 'bg-zinc-900 border-zinc-800 text-white focus:border-zinc-600'
                                : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-400'
                            }`}
                          >
                            <option value="">Select a category...</option>
                            {YOUTUBE_NICHES.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="pt-2 space-y-2">
                          <button
                            type="button"
                            onClick={handleConfirmAndSyncYouTube}
                            disabled={!selectedChannel || !selectedNiche}
                            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                          >
                            <CheckCircle2 size={16} />
                            <span>Confirm & Connect Channel</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleInitiateYouTubeOAuth}
                            className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Plus size={13} />
                            <span>Link a different YouTube account</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── STEP: FOREGROUND SYNCING (Foreground Manual Sync) ────── */}
                {step === 'syncing' && (
                  <div className="py-6 space-y-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-red-500/20 border-t-red-600 animate-spin" />
                        <FaYoutube size={24} className="text-red-600" />
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-zinc-950 dark:text-white">
                          Syncing YouTube Channel in Real-time
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1">
                          {syncStatusMessage || 'Synchronizing channel analytics...'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                        <span>Synchronization Progress</span>
                        <span>{syncProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full"
                          initial={{ width: '10%' }}
                          animate={{ width: `${syncProgress}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    </div>

                    {/* 🛡️ CRITICAL FOREGROUND WARNING NOTICE */}
                    <div
                      className={`p-4 rounded-2xl border flex items-start gap-3 ${
                        isDarkMode
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-amber-50 border-amber-300 text-amber-900'
                      }`}
                    >
                      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          Do Not Close, Refresh, or Go Back
                        </p>
                        <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                          Your channel data and videos are actively synchronizing in the foreground. Leaving now will interrupt the process.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* 2. INSTAGRAM SPECIFIC FLOW                                         */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {activePlatformId === 'instagram' && (
              <div className="space-y-5">
                <div
                  className={`p-4 rounded-2xl border ${
                    isDarkMode
                      ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300'
                      : 'bg-zinc-50 border-zinc-200/80 text-zinc-700'
                  }`}
                >
                  <p className="text-xs leading-relaxed">
                    Connect your professional <strong>Instagram Creator or Business</strong> account via Meta OAuth to sync followers, reel analytics, and reach.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>Requires an Instagram Creator or Business account</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>Live follower count, posts, and reels engagement sync</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>Official Meta Graph API verification</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleInitiateInstagramOAuth}
                    className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 text-white flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer active:scale-[0.99]"
                  >
                    <FaInstagram size={18} />
                    <span>Connect with Instagram via Meta</span>
                  </button>
                  <p className="text-[10.5px] text-zinc-400 text-center mt-2.5 flex items-center justify-center gap-1">
                    <Shield size={12} className="text-emerald-500" />
                    <span>Official Meta Graph API OAuth</span>
                  </p>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* 3. OTHER APPS: DEDICATED UNDER DEVELOPMENT COMPONENT              */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            {activePlatformId !== 'youtube' && activePlatformId !== 'instagram' && (
              <div className="py-6 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm">
                  {renderPlatformHeaderIcon()}
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-1">
                    <Clock size={12} />
                    <span>Integration Under Development</span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-950 dark:text-white">
                    {activePlatformName} Integration Coming Soon
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Our verified official integration with {activePlatformName} is currently in progress with developer API partners. You will soon be able to connect your profile and sync live analytics directly.
                  </p>
                </div>

                <div className="w-full pt-3">
                  <button
                    onClick={handleClose}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 transition-all cursor-pointer"
                  >
                    Got It
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: SUCCESS ───────────────────────────────────────────── */}
            {step === 'success' && (
              <div className="py-8 flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-xs">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-zinc-950 dark:text-white">
                    {activePlatformName} Connected Successfully!
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs">
                    Your {activePlatformName} account is now linked and active in your Creator Ecosystem.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP: ERROR ─────────────────────────────────────────────── */}
            {step === 'error' && (
              <div className="py-6 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                  <AlertCircle size={26} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white">
                    Connection Error
                  </h4>
                  <p className="text-xs text-red-500 max-w-sm leading-relaxed">
                    {errorMessage || `Unable to connect to ${activePlatformName}. Please try again.`}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => dispatch(setStep('idle'))}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 transition-all cursor-pointer"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Confirmation Guard Dialog (if user attempts to exit while syncing) */}
        {confirmExitPrompt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div
              className={`w-full max-w-xs p-5 rounded-2xl border shadow-2xl text-center space-y-3 ${
                isDarkMode ? 'bg-[#18181C] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
              }`}
            >
              <AlertTriangle className="text-amber-500 mx-auto" size={24} />
              <h4 className="text-sm font-bold">Cancel Synchronization?</h4>
              <p className="text-xs text-zinc-400">
                Synchronization is currently in progress. Exiting now may leave your channel in an incomplete state.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setConfirmExitPrompt(false)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-white"
                >
                  Keep Waiting
                </button>
                <button
                  onClick={forceExit}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white"
                >
                  Stop & Exit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
