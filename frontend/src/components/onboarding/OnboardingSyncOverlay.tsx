import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectToken, updateUser } from '../../store/slices/authSlice';
import type { AuthUser } from '../../store/slices/authSlice';
import { connectSocket } from '../../services/socketService';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { clearTempSignupData } from '../../store/slices/onboardingSlice';
import { api } from '../../api/client';
import LottieComponent from 'lottie-react';
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

import planeAnimation from '../../assets/lottie/plane.json';
import progressAnimation from '../../assets/lottie/progress.json';
import { FaLink, FaDatabase, FaVideo, FaCog, FaCheckCircle } from 'react-icons/fa';
import logo from '../../assets/blackbglogo.png';

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
  const [, setMessage] = useState('Initializing sync...');
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

  const activeStep = steps.find(s => s.status === 'running') || steps[steps.length - 1];

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'connection': return <FaLink size={24} className="text-black" />;
      case 'metadata': return <FaDatabase size={24} className="text-black" />;
      case 'videos': return <FaVideo size={24} className="text-black" />;
      case 'finalize': return <FaCog size={24} className="text-black animate-spin" />;
      case 'complete': return <FaCheckCircle size={24} className="text-green-500" />;
      default: return <FaLink size={24} className="text-black" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 selection:bg-red-500 selection:text-white">
      {/* Top Left Logo */}
      <img src={logo} alt="SuviX" className="absolute top-10 left-10 h-8 md:h-25 z-50 opacity-90" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-2xl flex flex-col items-center mt-[-10vh]"
      >
        {/* Top Plane Lottie (You may have accidentally swapped the JSON files, please make sure plane.json is the plane) */}
        <div className="w-64 h-64 -mb-10 z-10 pointer-events-none">
          <Lottie animationData={planeAnimation} loop={true} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Title */}
        <div className="text-center mb-16 relative z-20">
          <h2 className="text-3xl font-bold text-black mb-2 tracking-tight">
            {isSuccess ? "You're all set!" : `Syncing ${channelName}...`}
          </h2>
        </div>

        {/* Custom Progress Area */}
        <div className="w-full max-w-md flex flex-col items-center">
          
          {/* Second Lottie (Progress Concept) stacked cleanly above the black progress bar */}
          {!isSuccess && (
            <div className="w-full h-32 -mt-6 mb-2 pointer-events-none z-30 flex items-center justify-center mix-blend-multiply">
              <Lottie animationData={progressAnimation} loop={true} style={{ width: '120%', height: '120%', objectFit: 'contain' }} />
            </div>
          )}

          {/* Original Custom Progress Bar (Black track, White fill) */}
          <div className="w-full mb-8 relative">
            <div className="flex justify-between text-xs font-bold mb-3 relative z-10">
              <span className="text-black uppercase tracking-widest">Progress</span>
              <span className="text-black">{progress}%</span>
            </div>
            <div className="h-4 w-full bg-black rounded-full overflow-hidden p-[2px] border border-black shadow-inner relative z-10">
            <motion.div 
              className="h-full bg-white rounded-full relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-100 to-transparent opacity-50 w-full animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </div>
        </div>

        {/* Active Step Indicator */}
        <div className="w-full max-w-md bg-zinc-50 rounded-2xl p-6 border border-zinc-100 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center shrink-0">
            {getStepIcon(activeStep.id)}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
              Current Process
            </span>
            <span className="text-sm font-bold text-black">
              {activeStep.label}
            </span>
          </div>
        </div>

        <div className="mt-12 text-center">
          {isSuccess ? (
            <button 
              onClick={() => {
                setCountdown(0);
              }}
              className="px-8 py-4 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-sm w-full transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              Continue to Dashboard ({countdown}s)
            </button>
          ) : (
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Please do not close this page
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
