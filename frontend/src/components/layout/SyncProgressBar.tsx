import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectToken, updateUser } from '../../store/slices/authSlice';
import { connectSocket } from '../../services/socketService';
import { useTheme } from '../../hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Youtube,
  Check,
  X
} from 'lucide-react';

interface SyncStep {
  id: 'connection' | 'metadata' | 'videos' | 'finalize';
  label: string;
  status: 'idle' | 'running' | 'success' | 'failed';
}

interface ActiveSync {
  channelId: string;
  channelName: string;
  progress: number;
  status: 'running' | 'success' | 'failed';
  message: string;
  steps: SyncStep[];
  error?: string;
}

const DEFAULT_STEPS: SyncStep[] = [
  { id: 'connection', label: 'Connecting to YouTube API', status: 'idle' },
  { id: 'metadata', label: 'Fetching profile & channel statistics', status: 'idle' },
  { id: 'videos', label: 'Syncing uploads and video metrics', status: 'idle' },
  { id: 'finalize', label: 'Processing analytics and updating dashboard', status: 'idle' },
];

const getStepsForStepId = (currentStepId: string, isFailed = false): SyncStep[] => {
  const stepOrder = ['connection', 'metadata', 'videos', 'finalize', 'complete'];
  const currentIndex = stepOrder.indexOf(currentStepId);

  return DEFAULT_STEPS.map((step, idx) => {
    if (isFailed) {
      if (idx === currentIndex) {
        return { ...step, status: 'failed' };
      } else if (idx < currentIndex) {
        return { ...step, status: 'success' };
      } else {
        return { ...step, status: 'idle' };
      }
    }

    if (currentStepId === 'complete') {
      return { ...step, status: 'success' };
    }

    if (idx === currentIndex) {
      return { ...step, status: 'running' };
    } else if (idx < currentIndex) {
      return { ...step, status: 'success' };
    } else {
      return { ...step, status: 'idle' };
    }
  });
};

export const SyncProgressBar = () => {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const { isDarkMode } = useTheme();
  
  const [activeSync, setActiveSync] = useState<ActiveSync | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Handle countdown timer upon sync completion
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown <= 0) {
      // Defer state update to next tick to avoid synchronous setState warnings inside effect body
      const fadeTimeout = setTimeout(() => {
        setShowNotification(false);
      }, 0);

      const dismissTimeout = setTimeout(() => {
        setActiveSync(null);
        setIsExpanded(false);
        setCountdown(null);
      }, 400);

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(dismissTimeout);
      };
    }

    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);

    interface SyncProgressData {
      type: string;
      metadata: {
        progress: number;
        channelId: string;
        channelName?: string;
        step: string;
        message?: string;
      };
    }

    interface SyncFailureData {
      type: string;
      metadata: {
        channelId?: string;
        channelName?: string;
        message?: string;
      };
    }

    interface ProfileUpdatedPayload {
      youtubeProfile?: unknown[];
      youtubeVideos?: unknown[];
    }

    const handleProgress = (data: SyncProgressData) => {
      if (data.type === 'SYNC_PROGRESS') {
        const { progress, channelId, channelName, step, message } = data.metadata;
        
        setCountdown(null);
        setShowNotification(true);
        setActiveSync({
          channelId,
          channelName: channelName || 'YouTube Channel',
          progress,
          status: 'running',
          message: message || 'Syncing content...',
          steps: getStepsForStepId(step)
        });
      } else if (data.type === 'SYNC_COMPLETE') {
        setActiveSync(prev => {
          if (!prev) return null;
          return {
            ...prev,
            progress: 100,
            status: 'success',
            message: 'Sync completed successfully!',
            steps: getStepsForStepId('complete')
          };
        });
        
        setCountdown(5);
      }
    };

    const handleFailure = (data: SyncFailureData) => {
      if (data.type === 'SYNC_FAILED') {
        const { channelId, channelName, message } = data.metadata;

        setCountdown(null);
        setShowNotification(true);
        setActiveSync(prev => {
          const currentStep = prev?.steps.find(s => s.status === 'running')?.id || 'connection';
          return {
            channelId: channelId || prev?.channelId || '',
            channelName: channelName || prev?.channelName || 'YouTube Channel',
            progress: prev?.progress || 0,
            status: 'failed',
            message: 'Sync failed',
            error: message || 'An error occurred during synchronization.',
            steps: getStepsForStepId(currentStep, true)
          };
        });
      }
    };

    const handleProfileUpdated = (payload: ProfileUpdatedPayload) => {
      console.log('🛰️ [SyncProgressBar] Received user:profile_updated, refreshing Redux store...');
      if (payload && (payload.youtubeProfile || payload.youtubeVideos)) {
        dispatch(updateUser({
          youtubeProfile: payload.youtubeProfile,
          youtubeVideos: payload.youtubeVideos
        }));
      }
    };

    socket.on('notification:new', (data: unknown) => {
      const syncData = data as { type: string };
      if (syncData.type === 'SYNC_PROGRESS') {
        handleProgress(data as SyncProgressData);
      } else if (syncData.type === 'SYNC_COMPLETE') {
        handleProgress(data as SyncProgressData);
      } else if (syncData.type === 'SYNC_FAILED') {
        handleFailure(data as SyncFailureData);
      }
    });

    socket.on('user:profile_updated', handleProfileUpdated);

    return () => {
      socket.off('notification:new');
      socket.off('user:profile_updated');
    };
  }, [token, dispatch]);

  if (!showNotification || !activeSync) return null;

  const isSuccess = activeSync.status === 'success';
  const isFailed = activeSync.status === 'failed';

  const getStepIcon = (status: SyncStep['status']) => {
    switch (status) {
      case 'success':
        return (
          <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 z-10 border border-emerald-500/20">
            <Check size={9} strokeWidth={3} />
          </div>
        );
      case 'failed':
        return (
          <div className="w-4 h-4 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 z-10 border border-rose-500/20">
            <X size={9} strokeWidth={3} />
          </div>
        );
      case 'running':
        return (
          <div className="w-4 h-4 rounded-full border border-zinc-400 border-t-transparent animate-spin shrink-0 z-10" />
        );
      default:
        return (
          <div className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center shrink-0 z-10">
            <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-650" />
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`w-full mb-4 rounded-2xl border overflow-hidden ${
        isDarkMode 
          ? 'bg-black border-zinc-800 text-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-zinc-200 text-zinc-800 shadow-[0_4px_16px_rgba(0,0,0,0.03)]'
      }`}
    >
      {/* 1. Main Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-zinc-500/5 transition-colors duration-150 select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Strict B&W Icon wrapper */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
            isFailed 
              ? 'bg-rose-500/5 border-rose-500/10 text-rose-500' 
              : isSuccess 
                ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' 
                : 'bg-zinc-500/5 border-zinc-500/10 text-zinc-400 dark:text-zinc-500'
          }`}>
            {isFailed ? (
              <X size={14} strokeWidth={2.5} />
            ) : isSuccess ? (
              <Check size={14} strokeWidth={2.5} />
            ) : (
              <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin shrink-0" />
            )}
          </div>

          <div className="min-w-0">
            {/* Simple SuviX typography for section header */}
            <div className="flex items-center gap-1.5">
              <Youtube className="w-3 h-3 text-rose-600 shrink-0" />
              <span className="font-semibold text-[9px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500 font-display">
                YouTube Connection Sync
              </span>
            </div>
            <p className={`text-xs font-semibold truncate mt-0.5 font-display ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
              {isFailed 
                ? `Sync Failed: ${activeSync.channelName}` 
                : isSuccess 
                  ? `Synced ${activeSync.channelName} successfully`
                  : `Syncing ${activeSync.channelName}`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Countdown timer badge or percentage */}
          {countdown !== null ? (
            <span className="text-[9px] font-semibold text-emerald-500 uppercase tracking-wider font-display">
              Dismissing in {countdown}s
            </span>
          ) : (
            <span className="font-mono text-[10px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-500/5 px-2 py-0.5 rounded-lg border border-zinc-500/5">
              {activeSync.progress}%
            </span>
          )}

          {/* Chevron expand */}
          <div className={`p-0.5 rounded transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </div>
        </div>
      </div>

      {/* 2. Timeline Step Checklist */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="border-t border-zinc-200/50 dark:border-zinc-800/40 overflow-hidden bg-zinc-500/[0.01]"
          >
            <div className="p-4 space-y-3.5">
              <div className="relative pl-1 space-y-3.5">
                {/* Connecting Vertical Timeline Line */}
                <div 
                  className="absolute left-[7px] top-3.5 bottom-3.5 w-[1px] bg-zinc-200 dark:bg-zinc-800" 
                />

                {activeSync.steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3 relative">
                    {getStepIcon(step.status)}
                    
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[11px] tracking-wide font-display ${
                        step.status === 'running' 
                          ? (isDarkMode ? 'text-white font-medium' : 'text-zinc-950 font-medium') 
                          : step.status === 'success' 
                            ? 'text-zinc-400 dark:text-zinc-550' 
                            : step.status === 'failed'
                              ? 'text-rose-500 dark:text-rose-450 font-medium'
                              : 'text-zinc-400/50 dark:text-zinc-655'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error block for Failure state */}
              {isFailed && activeSync.error && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-600 dark:text-rose-400 text-[10.5px] leading-relaxed font-display">
                  <span className="font-semibold flex items-center gap-1.5 text-rose-500 mb-0.5">
                    Synchronization details:
                  </span>
                  {activeSync.error}
                </div>
              )}

              {/* Action Buttons */}
              {(isFailed || isSuccess) && (
                <div className="flex justify-end pt-2.5 border-t border-zinc-200/50 dark:border-zinc-800/40">
                  <button
                    onClick={() => {
                      setShowNotification(false);
                      setTimeout(() => {
                        setActiveSync(null);
                        setIsExpanded(false);
                        setCountdown(null);
                      }, 300);
                    }}
                    className="h-7.5 px-4 rounded-lg text-[10px] font-semibold transition-all bg-zinc-500/10 hover:bg-zinc-500/15 text-zinc-600 dark:text-zinc-300 border border-zinc-500/5 active:scale-97 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Sleek Instagram Style Progress Bar (Always at bottom) */}
      <div className="w-full h-[2px] bg-zinc-150 dark:bg-zinc-900 relative">
        <motion.div 
          className={`h-full absolute left-0 top-0 transition-all ${
            isFailed 
              ? 'bg-rose-500' 
              : isSuccess 
                ? 'bg-emerald-500' 
                : 'bg-gradient-to-r from-[#f99f1b] via-[#e2306c] to-[#a22da2]' // Instagram brand gradient
          }`}
          style={{ 
            width: countdown !== null ? `${(countdown / 5) * 100}%` : `${activeSync.progress}%` 
          }}
          transition={{
            ease: countdown !== null ? 'linear' : 'easeOut',
            duration: countdown !== null ? 1 : 0.3
          }}
        />
      </div>
    </motion.div>
  );
};
