import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectToken, updateUser } from '../../store/slices/authSlice';
import type { AuthUser } from '../../store/slices/authSlice';
import { connectSocket } from '../../services/socketService';
import { motion } from 'framer-motion';
import { Youtube, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearTempSignupData } from '../../store/slices/onboardingSlice';
import { api } from '../../api/client';

interface SyncStep {
  id: 'connection' | 'metadata' | 'videos' | 'finalize';
  label: string;
  status: 'idle' | 'running' | 'success' | 'failed';
}

const DEFAULT_STEPS: SyncStep[] = [
  { id: 'connection', label: 'Connecting to YouTube API', status: 'idle' },
  { id: 'metadata', label: 'Fetching profile & channel statistics', status: 'idle' },
  { id: 'videos', label: 'Syncing uploads and video metrics (up to 50)', status: 'idle' },
  { id: 'finalize', label: 'Processing analytics and updating dashboard', status: 'idle' },
];

const getStepsForStepId = (currentStepId: string): SyncStep[] => {
  const stepOrder = ['connection', 'metadata', 'videos', 'finalize', 'complete'];
  const currentIndex = stepOrder.indexOf(currentStepId);

  return DEFAULT_STEPS.map((step, idx) => {
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

export const OnboardingSyncOverlay = ({ nextRoute = '/home' }: { nextRoute?: string }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector(selectToken);

  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Initializing sync...');
  const [steps, setSteps] = useState<SyncStep[]>(DEFAULT_STEPS);
  const [channelName, setChannelName] = useState('your channel');
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // ── TRAP THE USER: Prevent navigation away ──────────────────────────────────
  useEffect(() => {
    // 1. Prevent refresh / tab close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const msg = "YouTube sync is still running. Are you sure you want to leave?";
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. Prevent browser back button
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);

    // 3. Disable scrolling
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.body.style.overflow = 'auto';
    };
  }, []);

  // ── TRIGGER MANUAL SYNC (FOREGROUND MODE) ──────────────────────────────────
  const syncTriggered = useRef(false);
  const isCompleted = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const triggerSync = async () => {
      try {
        console.log("🚀 [FRONTEND] Triggering manual YouTube sync endpoint...");
        const response = await api.post('/youtube-creator/channel/sync-manual');
        console.log("✅ [FRONTEND] Manual sync endpoint responded successfully:", response.data);
      } catch (error) {
        console.error("❌ [FRONTEND] Manual sync trigger failed:", error);
      }
    };

    if (token && isMounted && !syncTriggered.current) {
      syncTriggered.current = true;
      triggerSync();
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  // ── HANDLE COUNTDOWN AND REDIRECT ──────────────────────────────────────────
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      dispatch(clearTempSignupData());
      navigate(nextRoute, { replace: true });
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => prev !== null ? prev - 1 : null);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, dispatch, navigate, nextRoute]);

  // ── SOCKET LISTENER FOR PROGRESS ───────────────────────────────────────────
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

    const completeSync = () => {
      if (isCompleted.current) return; // Guard against double-firing
      isCompleted.current = true;
      console.log("🎉 [FRONTEND] Sync completed 100%! Navigating to:", nextRoute);
      setIsSuccess(true);
      setProgress(100);
      setSteps(getStepsForStepId('complete'));
      setMessage('Sync completed successfully!');
      
      // Start 3 second countdown instead of immediate timeout
      setCountdown(3);
    };

    const handleProgress = (data: SyncProgressData) => {
      if (data.type === 'SYNC_PROGRESS') {
        const { progress: p, channelName: cName, step, message: msg } = data.metadata;
        console.log(`📈 [FRONTEND] Socket SYNC_PROGRESS received: ${p}% - ${step} - ${msg}`);
        setProgress(p);
        if (cName) setChannelName(cName);
        if (msg) setMessage(msg);
        setSteps(getStepsForStepId(step));
      } else if (data.type === 'SYNC_COMPLETE') {
        completeSync();
      }
    };

    socket.on('notification:new', (data: unknown) => {
      const syncData = data as { type: string };
      if (syncData.type === 'SYNC_PROGRESS' || syncData.type === 'SYNC_COMPLETE') {
        handleProgress(data as SyncProgressData);
      }
    });

    socket.on('user:profile_updated', (payload: { youtubeProfile?: AuthUser['youtubeProfile'] }) => {
      if (payload && payload.youtubeProfile) {
        dispatch(updateUser({ youtubeProfile: payload.youtubeProfile }));
        completeSync();
      }
    });

    return () => {
      socket.off('notification:new');
      socket.off('user:profile_updated');
    };
  }, [token, dispatch, navigate]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 selection:bg-red-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[70vh] bg-gradient-to-b from-red-600/[0.12] to-transparent blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border shadow-xl ${
            isSuccess 
              ? 'bg-green-500/10 border-green-500/30 text-green-500'
              : 'bg-red-500/10 border-red-500/30 text-red-500'
          }`}>
            {isSuccess ? <Check size={32} /> : <Youtube size={32} />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            {isSuccess ? "You're all set!" : `Syncing ${channelName}...`}
          </h2>
          <p className="text-sm font-medium text-zinc-400">
            {message}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-zinc-500 uppercase tracking-widest">Progress</span>
            <span className={isSuccess ? 'text-green-400' : 'text-red-400'}>{progress}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.3 }}
            />
          </div>
        </div>

        {/* Steps Timeline */}
        <div className="space-y-4 relative pl-2">
          <div className="absolute left-[13px] top-2 bottom-2 w-px bg-zinc-800" />
          
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-4 relative">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 shrink-0 border ${
                step.status === 'success' 
                  ? 'bg-green-500/20 border-green-500/30 text-green-500'
                  : step.status === 'running'
                    ? 'bg-black border-red-500 text-red-500'
                    : 'bg-black border-zinc-800 text-zinc-700'
              }`}>
                {step.status === 'success' ? (
                  <Check size={10} strokeWidth={3} />
                ) : step.status === 'running' ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                )}
              </div>
              <span className={`text-sm font-medium ${
                step.status === 'running' 
                  ? 'text-white'
                  : step.status === 'success'
                    ? 'text-zinc-400'
                    : 'text-zinc-600'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800/50 text-center">
          {isSuccess ? (
            <button 
              onClick={() => {
                setCountdown(0);
              }}
              className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm w-full transition-colors flex items-center justify-center gap-2"
            >
              Continue to Dashboard ({countdown}s)
            </button>
          ) : (
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Please do not close this page
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
