import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectToken, selectUser, updateUser } from '../../store/slices/authSlice';
import type { AuthUser } from '../../store/slices/authSlice';
import type { RootState } from '../../store';
import { connectSocket } from '../../services/socketService';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { clearTempSignupData } from '../../store/slices/onboardingSlice';
import { api } from '../../api/client';
import { FaYoutube, FaInstagram, FaCheck, FaArrowRight, FaShieldAlt } from 'react-icons/fa';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import logo from '../../assets/blackbglogo.png';

interface SyncProgressEvent {
  type: string;
  metadata: {
    userId?: string;
    progress: number;
    channelId?: string;
    channelName?: string;
    step?: string;
    message?: string;
    platform?: 'youtube' | 'instagram' | string;
  };
}

export const OnboardingSyncOverlay: React.FC<{ nextRoute?: string }> = ({
  nextRoute = '/home',
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector(selectToken);
  const user = useSelector(selectUser);

  const tempSignupData = useSelector((state: RootState) => state.onboarding.tempSignupData);
  const onboardingCreatorData = useSelector((state: RootState) => state.onboarding.creatorData);

  // ── 1. DETECT CONNECTED PLATFORMS ──────────────────────────────────────────
  const hasYoutube = useMemo(() => {
    const fromUser = (Array.isArray(user?.youtubeChannels) && user.youtubeChannels.length > 0) ||
                     (Array.isArray(user?.youtubeProfile) && user.youtubeProfile.length > 0) ||
                     (user?.channelLinkStatus === 'LINKED') ||
                     Boolean(user?.creatorProfile?.channels && user.creatorProfile.channels.length > 0);
    const fromTemp = Boolean(tempSignupData?.youtubeChannels && tempSignupData.youtubeChannels.length > 0);
    const fromCreator = Boolean(onboardingCreatorData?.channels && onboardingCreatorData.channels.length > 0);
    return Boolean(fromUser || fromTemp || fromCreator);
  }, [user, tempSignupData?.youtubeChannels, onboardingCreatorData?.channels]);

  const hasInstagram = useMemo(() => {
    const fromUser = Boolean(user?.instagramProfile) ||
                     (Array.isArray(user?.instagramAccounts) && user.instagramAccounts.length > 0);
    const fromTemp = Boolean(tempSignupData?.instagramAccounts && tempSignupData.instagramAccounts.length > 0);
    const fromCreator = Boolean(onboardingCreatorData?.instagramAccounts && onboardingCreatorData.instagramAccounts.length > 0);
    return Boolean(fromUser || fromTemp || fromCreator);
  }, [user, tempSignupData?.instagramAccounts, onboardingCreatorData?.instagramAccounts]);

  // Extract initial handles/names
  const initialYtName = useMemo(() => {
    if (tempSignupData?.youtubeChannels?.[0]?.channelName) return tempSignupData.youtubeChannels[0].channelName;
    if (onboardingCreatorData?.channels?.[0]?.channelName) return onboardingCreatorData.channels[0].channelName;
    if (user?.youtubeChannels?.[0]?.channel_name || user?.youtubeChannels?.[0]?.channelName) {
      return user.youtubeChannels[0].channel_name || user.youtubeChannels[0].channelName;
    }
    return 'YouTube Channel';
  }, [tempSignupData?.youtubeChannels, onboardingCreatorData?.channels, user?.youtubeChannels]);

  const initialInstaHandle = useMemo(() => {
    if (tempSignupData?.instagramAccounts?.[0]?.handle) return `@${tempSignupData.instagramAccounts[0].handle.replace(/^@/, '')}`;
    if (onboardingCreatorData?.instagramAccounts?.[0]?.handle) return `@${onboardingCreatorData.instagramAccounts[0].handle.replace(/^@/, '')}`;
    if (user?.instagramAccounts?.[0]?.username || user?.instagramAccounts?.[0]?.handle) {
      return `@${(user.instagramAccounts[0].username || user.instagramAccounts[0].handle).replace(/^@/, '')}`;
    }
    return '@instagram';
  }, [tempSignupData?.instagramAccounts, onboardingCreatorData?.instagramAccounts, user?.instagramAccounts]);

  // ── 2. INDEPENDENT PLATFORM PROGRESS STATES ─────────────────────────────────
  const [ytProgress, setYtProgress] = useState(hasYoutube ? 15 : 0);
  const [ytMessage, setYtMessage] = useState(
    hasYoutube ? 'Connecting to YouTube API...' : 'Not connected'
  );
  const [ytChannelName, setYtChannelName] = useState(initialYtName);
  const [ytCompleted, setYtCompleted] = useState(!hasYoutube);

  const [instaProgress, setInstaProgress] = useState(hasInstagram ? 20 : 0);
  const [instaMessage, setInstaMessage] = useState(
    hasInstagram ? 'Connecting to Meta Graph API...' : 'Not connected'
  );
  const [instaHandle, setInstaHandle] = useState(initialInstaHandle);
  const [instaCompleted, setInstaCompleted] = useState(!hasInstagram);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  const syncTriggered = useRef(false);
  const isCompletedRef = useRef(false);

  // ── 3. OVERALL COMPLETION CHECK ───────────────────────────────────────────
  const isAllCompleted = useMemo(() => {
    const isYtDone = !hasYoutube || ytCompleted || ytProgress >= 100;
    const isInstaDone = !hasInstagram || instaCompleted || instaProgress >= 100;
    return isYtDone && isInstaDone;
  }, [hasYoutube, hasInstagram, ytCompleted, ytProgress, instaCompleted, instaProgress]);

  const finishAllSync = useCallback(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    console.log('🎉 [SYNC-OVERLAY] All platform syncs completed 100%! Ready for navigation.');
    setYtProgress(100);
    setInstaProgress(100);
    setYtCompleted(true);
    setInstaCompleted(true);
    setCountdown(3); // Start 3-second countdown to auto-navigate
  }, []);

  useEffect(() => {
    if (isAllCompleted && !isCompletedRef.current) {
      finishAllSync();
    }
  }, [isAllCompleted, finishAllSync]);

  // ── 4. SAFETY FALLBACK TIMER (35s) ────────────────────────────────────────
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!isCompletedRef.current) {
        setShowFallback(true);
      }
    }, 35000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // ── 5. PREVENT USER NAVIGATION AWAY ────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Syncing your creator accounts in the background. Please wait...';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.body.style.overflow = 'auto';
    };
  }, []);

  // ── 6. MANUAL INLINE SYNC TRIGGER (FOREGROUND FALLBACK) ────────────────────
  useEffect(() => {
    let isMounted = true;
    const triggerForegroundSync = async () => {
      // Trigger YouTube Sync if connected
      if (hasYoutube) {
        try {
          console.log('🚀 [SYNC-OVERLAY] Triggering manual YouTube sync...');
          setYtMessage('Syncing video library (up to 50 videos)...');
          setYtProgress(50);
          const ytRes = await api.post('/youtube-creator/channel/sync-manual');
          if (ytRes.data?.success && isMounted) {
            setYtProgress(100);
            setYtCompleted(true);
            setYtMessage('Channel videos & stats synced successfully!');
          }
        } catch (err) {
          console.warn('⚠️ [SYNC-OVERLAY] Foreground YouTube sync handled by worker/background:', err);
        }
      }

      // Trigger Instagram Sync if connected
      if (hasInstagram) {
        try {
          console.log('🚀 [SYNC-OVERLAY] Triggering manual Instagram sync...');
          setInstaMessage('Mirroring latest post & reel thumbnails to S3...');
          setInstaProgress(50);
          const igRes = await api.post('/instagram-creator/sync-manual');
          if (igRes.data?.success && isMounted) {
            setInstaProgress(100);
            setInstaCompleted(true);
            setInstaMessage('Profile & media thumbnails synced successfully!');
          }
        } catch (err) {
          console.warn('⚠️ [SYNC-OVERLAY] Foreground Instagram sync handled by worker/background:', err);
        }
      }
    };

    if (token && isMounted && !syncTriggered.current) {
      syncTriggered.current = true;
      triggerForegroundSync();
    }

    return () => {
      isMounted = false;
    };
  }, [token, hasYoutube, hasInstagram]);

  // ── 7. SOCKET.IO MULTI-PLATFORM PROGRESS LISTENER ─────────────────────────
  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);

    const handleProgress = (data: SyncProgressEvent) => {
      if (data.type === 'SYNC_PROGRESS') {
        const { progress: p, channelName: cName, message: msg, platform } = data.metadata;
        console.log(`📈 [SYNC-OVERLAY] Socket ${platform || 'general'}: ${p}% - ${msg}`);

        if (platform === 'instagram') {
          setInstaProgress(p);
          if (msg) setInstaMessage(msg);
          if (cName) setInstaHandle(cName.startsWith('@') ? cName : `@${cName}`);
          if (p >= 100) setInstaCompleted(true);
        } else {
          // YouTube
          setYtProgress(p);
          if (msg) setYtMessage(msg);
          if (cName) setYtChannelName(cName);
          if (p >= 100) setYtCompleted(true);
        }
      } else if (data.type === 'SYNC_COMPLETE') {
        finishAllSync();
      }
    };

    socket.on('notification:new', (data: unknown) => {
      const syncData = data as { type?: string };
      if (syncData?.type === 'SYNC_PROGRESS' || syncData?.type === 'SYNC_COMPLETE') {
        handleProgress(data as SyncProgressEvent);
      }
    });

    socket.on('user:profile_updated', (payload: { youtubeProfile?: AuthUser['youtubeProfile'] }) => {
      if (payload && payload.youtubeProfile) {
        dispatch(updateUser({ youtubeProfile: payload.youtubeProfile }));
        setYtProgress(100);
        setYtCompleted(true);
      }
    });

    return () => {
      socket.off('notification:new');
      socket.off('user:profile_updated');
    };
  }, [token, finishAllSync, dispatch]);

  // ── 8. REDIRECT COUNTDOWN ──────────────────────────────────────────────────
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      dispatch(clearTempSignupData());
      navigate(nextRoute, { replace: true });
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, dispatch, navigate, nextRoute]);

  const handleManualProceed = () => {
    dispatch(clearTempSignupData());
    navigate(nextRoute, { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar with Logo and Live Status Pill */}
      <div className="w-full max-w-2xl flex items-center justify-between z-20">
        <img src={logo} alt="SuviX Logo" className="h-7 sm:h-9 object-contain" />

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200/80 bg-zinc-50/80 backdrop-blur-sm shadow-xs">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isAllCompleted ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isAllCompleted ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="text-[11px] font-bold text-zinc-700 tracking-wide">
            {isAllCompleted ? 'All Synced' : 'Live Sync Active'}
          </span>
        </div>
      </div>

      {/* Center Main Stage */}
      <div className="w-full max-w-xl flex flex-col items-center text-center my-auto z-10 py-6">
        
        {/* Animated Icon Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 relative"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-zinc-900 text-white flex items-center justify-center shadow-xl shadow-zinc-950/15 border border-zinc-800">
            {isAllCompleted ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
              >
                <CheckCircle2 size={36} className="text-emerald-400" />
              </motion.div>
            ) : (
              <Sparkles size={32} className="text-amber-400 animate-pulse" />
            )}
          </div>
        </motion.div>

        {/* Dynamic Heading */}
        <motion.div
          key={isAllCompleted ? 'completed' : 'syncing'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-1.5 mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            {isAllCompleted ? "You're All Set!" : 'Setting Up Your Creator Studio'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-md mx-auto">
            {isAllCompleted
              ? 'Your connected channels, reels, and analytics are ready to explore.'
              : 'Importing your media, statistics, and live identity from connected platforms.'}
          </p>
        </motion.div>

        {/* ── DUAL PLATFORM SYNC CARDS ──────────────────────────────────────── */}
        <div className="w-full space-y-3.5 mb-8 text-left">
          
          {/* 1. YOUTUBE SYNC CARD */}
          <div
            className={`w-full p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
              hasYoutube
                ? ytCompleted
                  ? 'bg-white border-emerald-200/90 shadow-sm'
                  : 'bg-white border-zinc-200/90 shadow-sm'
                : 'bg-zinc-50/60 border-zinc-200/50 opacity-55'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    hasYoutube
                      ? 'bg-[#FF0000] text-white'
                      : 'bg-zinc-200 text-zinc-400'
                  }`}
                >
                  <FaYoutube size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-extrabold text-zinc-900 truncate">
                      {hasYoutube ? ytChannelName : 'YouTube Channel'}
                    </span>
                    {hasYoutube && ytCompleted && (
                      <span className="inline-flex items-center text-emerald-600 text-[10px] font-extrabold gap-0.5">
                        <FaCheck size={9} /> Ready
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-zinc-500 font-medium truncate mt-0.5">
                    {ytMessage}
                  </p>
                </div>
              </div>

              {/* Progress Value / Status Indicator */}
              <div className="shrink-0 text-right">
                {hasYoutube ? (
                  ytCompleted ? (
                    <span className="text-xs sm:text-sm font-black text-emerald-600">100%</span>
                  ) : (
                    <div className="flex items-center gap-1.5 text-zinc-700">
                      <Loader2 size={13} className="animate-spin text-red-500" />
                      <span className="text-xs sm:text-sm font-black">{ytProgress}%</span>
                    </div>
                  )
                ) : (
                  <span className="text-[10px] font-bold text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-100">
                    Not Connected
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar (Only when platform connected) */}
            {hasYoutube && (
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden relative">
                <motion.div
                  className={`h-full rounded-full ${
                    ytCompleted
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-red-600 to-rose-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${ytProgress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.4 }}
                />
              </div>
            )}
          </div>

          {/* 2. INSTAGRAM SYNC CARD */}
          <div
            className={`w-full p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
              hasInstagram
                ? instaCompleted
                  ? 'bg-white border-emerald-200/90 shadow-sm'
                  : 'bg-white border-zinc-200/90 shadow-sm'
                : 'bg-zinc-50/60 border-zinc-200/50 opacity-55'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    hasInstagram
                      ? 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white'
                      : 'bg-zinc-200 text-zinc-400'
                  }`}
                >
                  <FaInstagram size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-extrabold text-zinc-900 truncate">
                      {hasInstagram ? instaHandle : 'Instagram Profile'}
                    </span>
                    {hasInstagram && instaCompleted && (
                      <span className="inline-flex items-center text-emerald-600 text-[10px] font-extrabold gap-0.5">
                        <FaCheck size={9} /> Ready
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-zinc-500 font-medium truncate mt-0.5">
                    {instaMessage}
                  </p>
                </div>
              </div>

              {/* Progress Value / Status Indicator */}
              <div className="shrink-0 text-right">
                {hasInstagram ? (
                  instaCompleted ? (
                    <span className="text-xs sm:text-sm font-black text-emerald-600">100%</span>
                  ) : (
                    <div className="flex items-center gap-1.5 text-zinc-700">
                      <Loader2 size={13} className="animate-spin text-pink-500" />
                      <span className="text-xs sm:text-sm font-black">{instaProgress}%</span>
                    </div>
                  )
                ) : (
                  <span className="text-[10px] font-bold text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-100">
                    Not Connected
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar (Only when platform connected) */}
            {hasInstagram && (
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden relative">
                <motion.div
                  className={`h-full rounded-full ${
                    instaCompleted
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${instaProgress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.4 }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── ACTION FOOTER / REDIRECT BUTTON ───────────────────────────────── */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {isAllCompleted ? (
              <motion.button
                key="complete-btn"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleManualProceed}
                className="w-full h-13 sm:h-14 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-zinc-950/15 cursor-pointer active:scale-[0.99]"
              >
                <span>Continue to Dashboard</span>
                {countdown !== null && (
                  <span className="text-zinc-400 font-medium text-xs">({countdown}s)</span>
                )}
                <FaArrowRight size={14} />
              </motion.button>
            ) : showFallback ? (
              <motion.div
                key="fallback-box"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-2.5"
              >
                <p className="text-[11px] text-zinc-500 font-medium">
                  Sync is continuing in the background. You can proceed directly to your studio.
                </p>
                <button
                  onClick={handleManualProceed}
                  className="px-6 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-800 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span>Skip to Dashboard</span>
                  <FaArrowRight size={11} />
                </button>
              </motion.div>
            ) : (
              <p className="text-[10px] sm:text-xs font-bold text-zinc-400 tracking-wider uppercase">
                Please keep this window open while we configure your studio
              </p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Subtle Trust Security Badge */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 z-20">
        <FaShieldAlt size={12} className="text-emerald-500" />
        <span>End-to-End Encrypted OAuth Synchronization</span>
      </div>
    </div>
  );
};
