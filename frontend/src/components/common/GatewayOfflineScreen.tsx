import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Zap,
  Database,
  ShieldCheck,
  Clock,
  RotateCw,
  Home,
  ArrowLeft,
  Instagram,
  Youtube,
  Linkedin,
  AlertCircle,
  X as CloseIcon,
} from 'lucide-react';
import logo from '../../assets/blackbglogo.png';
import serverBusyDesktop from '../../assets/serverbusy.png';
import serverBusyMobile from '../../assets/serverbusymobile.png';

interface GatewayOfflineScreenProps {
  onRetrySuccess?: () => void;
  isDarkMode?: boolean;
  endpointUrl?: string;
}

export const GatewayOfflineScreen: React.FC<GatewayOfflineScreenProps> = ({
  onRetrySuccess,
  endpointUrl,
}) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [cooldown, setCooldown] = useState(15);
  const [hasAutoRetried, setHasAutoRetried] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  // Compute base URL for probing health endpoints
  const apiUrl =
    endpointUrl || import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
  let baseUrl = apiUrl;
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    try {
      baseUrl = new URL(apiUrl).origin;
    } catch {
      // fallback
    }
  } else {
    if (baseUrl.endsWith('/api/v1')) baseUrl = baseUrl.slice(0, -7);
    else if (baseUrl.endsWith('/api')) baseUrl = baseUrl.slice(0, -4);
  }

  // Health check probing function
  const probeServerHealth = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${baseUrl}/api/health`, {
        signal: controller.signal,
        cache: 'no-cache',
      }).catch(async () => {
        return await fetch(`${baseUrl}/health`, {
          signal: controller.signal,
          cache: 'no-cache',
        });
      });

      clearTimeout(timeoutId);

      if (res && res.ok) {
        if (onRetrySuccess) {
          onRetrySuccess();
        } else {
          window.location.href = '/';
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [baseUrl, onRetrySuccess]);

  // Initial 15s Countdown: Runs only ONCE upon load, then auto-retries once
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle the single automatic retry when initial 15s countdown reaches 0
  useEffect(() => {
    if (cooldown === 0 && !hasAutoRetried && !isChecking) {
      setHasAutoRetried(true);
      setIsChecking(true);
      setRetryMessage('Checking server availability...');

      probeServerHealth().then((success) => {
        setIsChecking(false);
        if (!success) {
          setRetryMessage('Maintenance still in progress. Click "Retry Now" to check again.');
        }
      });
    }
  }, [cooldown, hasAutoRetried, isChecking, probeServerHealth]);

  // User initiates manual retry -> opens confirmation modal ("Are you sure?")
  const handleRetryButtonClick = () => {
    if (isChecking) return;
    if (cooldown > 0) return;
    setShowConfirmModal(true);
  };

  // User confirms in modal -> executes actual manual probe
  const executeManualRetry = async () => {
    setShowConfirmModal(false);
    setIsChecking(true);
    setRetryMessage('Checking server availability...');

    const success = await probeServerHealth();

    if (!success) {
      setIsChecking(false);
      setRetryMessage('Maintenance still in progress. Please retry in a few moments.');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="relative h-screen max-h-screen h-[100dvh] max-h-[100dvh] w-full bg-[#f8f9fa] flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* ── DESKTOP BACKGROUND ARTWORK (Visible on lg+) ── */}
      <div className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <motion.img
          src={serverBusyDesktop}
          alt="System Maintenance Background"
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{
            scale: [1.05, 1, 1.025, 1],
            opacity: 1,
            x: [0, -8, 0],
          }}
          transition={{
            opacity: { duration: 0.8, ease: 'easeOut' },
            scale: { duration: 18, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
            x: { duration: 18, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
          }}
          className="w-full h-full object-cover object-right"
        />
      </div>

      {/* ── MOBILE BACKGROUND ARTWORK FOR TOP SECTION (< lg only) ── */}
      <div className="block lg:hidden absolute top-0 left-0 right-0 h-[48vh] pointer-events-none z-0 overflow-hidden">
        <motion.img
          src={serverBusyMobile}
          alt="Maintenance Mobile Art"
          initial={{ scale: 1.03, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.95 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full h-full object-cover object-top"
        />
        {/* Subtle bottom fade to seamlessly blend into page canvas without washing out colors */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-[#f8f9fa]" />
      </div>

      {/* ── TOP HEADER NAVIGATION ── */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-3 sm:pt-4 lg:pt-6 pb-1 flex items-center justify-between shrink-0">
        {/* Brand Logo - Enlarged */}
        <div className="flex items-center">
          <img
            src={logo}
            alt="SuviX"
            className="h-10 xs:h-11 sm:h-12 md:h-14 lg:h-16 w-auto object-contain cursor-pointer transition-transform duration-200 hover:scale-[1.03]"
            onClick={handleGoHome}
          />
        </div>

        {/* Go to Home Top Button */}
        <button
          type="button"
          onClick={handleGoHome}
          className="group px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-zinc-200/90 bg-white/90 hover:bg-zinc-50 backdrop-blur-xs text-xs sm:text-sm font-bold text-zinc-900 shadow-2xs hover:shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-700 group-hover:-translate-x-0.5 transition-transform" />
          <span>Go to Home</span>
        </button>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex-1 min-h-0 flex flex-col justify-center py-1 sm:py-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-4 lg:gap-10 h-full">
          {/* ════ LEFT COLUMN: Hero Typography, Chips, Callout & CTA ════ */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center text-left space-y-3 sm:space-y-4 lg:space-y-4.5 my-auto">
            {/* System Maintenance Badge */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs border border-zinc-200/90 shadow-2xs w-fit"
            >
              <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-800 animate-[spin_8s_linear_infinite]" />
              <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-zinc-900">
                SYSTEM MAINTENANCE
              </span>
            </motion.div>

            {/* Main Headline & Subheadline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="space-y-0.5 sm:space-y-1"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[54px] font-black text-zinc-950 tracking-tight leading-none">
                Hang tight!
              </h1>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] xl:text-[44px] font-black text-zinc-600 tracking-tight leading-tight">
                We’ll be back soon.
              </h2>
            </motion.div>

            {/* Description Body */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="text-xs sm:text-sm lg:text-base text-zinc-600 font-medium leading-snug sm:leading-relaxed max-w-md"
            >
              Our servers are currently undergoing maintenance to bring you a
              faster, more reliable and better creator experience.
            </motion.p>

            {/* ── 3 FEATURE CHIPS ROW ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
              className="grid grid-cols-3 gap-2 sm:gap-3 py-0.5"
            >
              {/* Chip 1: Improving Performance */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-zinc-200/90 shadow-2xs flex items-center justify-center shrink-0 text-zinc-950">
                  <Zap className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9.5px] sm:text-xs font-bold text-zinc-900 leading-tight">
                    Improving
                  </span>
                  <span className="text-[9.5px] sm:text-xs font-bold text-zinc-900 leading-tight">
                    Performance
                  </span>
                </div>
              </div>

              {/* Chip 2: Enhancing Reliability */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-zinc-200/90 shadow-2xs flex items-center justify-center shrink-0 text-zinc-950">
                  <Database className="w-3.5 h-3.5 text-zinc-950" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9.5px] sm:text-xs font-bold text-zinc-900 leading-tight">
                    Enhancing
                  </span>
                  <span className="text-[9.5px] sm:text-xs font-bold text-zinc-900 leading-tight">
                    Reliability
                  </span>
                </div>
              </div>

              {/* Chip 3: Serving You Better */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-zinc-200/90 shadow-2xs flex items-center justify-center shrink-0 text-zinc-950">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-950" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9.5px] sm:text-xs font-bold text-zinc-900 leading-tight">
                    Serving You
                  </span>
                  <span className="text-[9.5px] sm:text-xs font-bold text-zinc-900 leading-tight">
                    Better
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ── INFO CALLOUT CARD ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="w-full rounded-2xl bg-white/95 backdrop-blur-xs border border-zinc-200/90 p-2.5 sm:p-3.5 flex items-center gap-3 shadow-2xs"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f2f4f7] border border-zinc-200 flex items-center justify-center shrink-0 text-zinc-900 shadow-2xs">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-900" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs sm:text-sm font-bold text-zinc-950">
                  We’ll be back shortly!
                </span>
                <span className="text-[10.5px] sm:text-xs text-zinc-500 font-medium">
                  {retryMessage || 'Our team is working hard to resolve the issue.'}
                </span>
              </div>
            </motion.div>

            {/* ── ACTION BUTTONS ROW ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.24 }}
              className="grid grid-cols-2 gap-2.5 sm:gap-4 pt-0.5"
            >
              {/* Primary Black Action Button: Retry in 15s / Retry Now */}
              <button
                type="button"
                onClick={handleRetryButtonClick}
                disabled={isChecking || cooldown > 0}
                className="w-full py-2.5 sm:py-3.5 px-3 sm:px-5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:active:scale-100 transition-all cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                    isChecking ? 'animate-spin' : ''
                  }`}
                />
                <span>
                  {isChecking
                    ? 'Checking...'
                    : cooldown > 0
                    ? `Retry in ${cooldown}s`
                    : 'Retry Now'}
                </span>
              </button>

              {/* Secondary White Button: Go to Home */}
              <button
                type="button"
                onClick={handleGoHome}
                className="w-full py-2.5 sm:py-3.5 px-3 sm:px-5 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200/90 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-zinc-950" />
                <span>Go to Home</span>
              </button>
            </motion.div>
          </div>

          {/* ════ RIGHT COLUMN (Empty space on Desktop as background artwork fills it) ════ */}
          <div className="hidden lg:block lg:col-span-6 xl:col-span-7 h-full min-h-[300px]" />
        </div>
      </main>

      {/* ── BOTTOM FOOTER BAR ── */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-2.5 sm:py-3.5 lg:py-5 border-t border-zinc-200/60 lg:border-none shrink-0">
        {/* DESKTOP FOOTER (lg+) */}
        <div className="hidden lg:flex items-center justify-between text-xs text-zinc-500 font-medium">
          {/* Left: Brand + Slogan */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="SuviX" className="h-6 sm:h-7 md:h-8 w-auto object-contain" />
            <span className="text-zinc-300">|</span>
            <span className="text-zinc-500 font-medium text-xs">
              Creators Edit a Better Tomorrow.
            </span>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => probeServerHealth()}
              className="hover:text-zinc-950 transition-colors cursor-pointer"
            >
              Status
            </button>
            <a href="/privacy" className="hover:text-zinc-950 transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-zinc-950 transition-colors">
              Terms
            </a>
            <a
              href="mailto:support@suvix.in"
              className="hover:text-zinc-950 transition-colors"
            >
              Support
            </a>
          </div>

          {/* Social Icons & Copyright */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-zinc-700">
              {/* X / Twitter */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-950 transition-colors"
                aria-label="X Twitter"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-950 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-950 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-950 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>

            <span className="text-zinc-400">
              © 2026 SuviX Inc. All rights reserved.
            </span>
          </div>
        </div>

        {/* MOBILE FOOTER (< lg) */}
        <div className="lg:hidden flex flex-col items-center justify-center text-center space-y-1.5">
          <div className="flex flex-col items-center gap-0.5">
            <img src={logo} alt="SuviX" className="h-6 sm:h-7 w-auto object-contain" />
            <p className="text-[10px] text-zinc-500 font-medium">
              Creators Edit a Better Tomorrow.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-600 font-medium">
            <button
              onClick={() => probeServerHealth()}
              className="hover:text-zinc-950 transition-colors cursor-pointer"
            >
              Status
            </button>
            <a href="/privacy" className="hover:text-zinc-950 transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-zinc-950 transition-colors">
              Terms
            </a>
            <a
              href="mailto:support@suvix.in"
              className="hover:text-zinc-950 transition-colors"
            >
              Support
            </a>
          </div>

          <p className="text-[9px] text-zinc-400 font-medium">
            © 2026 SuviX Inc. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ── CONFIRMATION MODAL ("Are you sure?") ── */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-zinc-200 text-left space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-950">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-lg font-black text-zinc-950">
                  Are you sure?
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                  This will test server connectivity and check if platform maintenance has completed.
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeManualRetry}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Yes, Retry</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
