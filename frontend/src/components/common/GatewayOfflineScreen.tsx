import React, { useState, useEffect, useCallback } from 'react';
import LottieComponent from 'lottie-react';
import maintenanceAnimation from '../../assets/lottie/maintenance.json';
import darkLogo from '../../assets/darklogo.png';
import lightLogo from '../../assets/lightlogo.png';
import { useTheme } from '../../hooks/useTheme';
import { RefreshCw, ArrowRight, LifeBuoy } from 'lucide-react';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

interface GatewayOfflineScreenProps {
  onRetrySuccess?: () => void;
  isDarkMode?: boolean;
  endpointUrl?: string;
}

export const GatewayOfflineScreen: React.FC<GatewayOfflineScreenProps> = ({
  onRetrySuccess,
  endpointUrl,
}) => {
  const { isDarkMode } = useTheme();
  const [isChecking, setIsChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  // Compute base URL for probing
  const apiUrl = endpointUrl || import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
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

  // Probing function
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
          window.location.reload();
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [baseUrl, onRetrySuccess]);

  // Cooldown countdown effect (5s -> 0s)
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

  // 100% User-Initiated Manual Retry Handler with 5s Cooldown
  const handleManualRetry = async () => {
    if (isChecking || cooldown > 0) return;

    setIsChecking(true);
    setRetryMessage(null);

    const success = await probeServerHealth();

    if (!success) {
      setIsChecking(false);
      setCooldown(20);
      setRetryMessage('Systems are still updating. Please retry in a few moments.');
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-8 transition-colors duration-300 select-none ${
        isDarkMode
          ? 'bg-gradient-to-br from-[#090A0F] via-[#0E131F] to-[#090A0F]'
          : 'bg-gradient-to-br from-[#0284c7] via-[#0284c7] to-[#0369a1]'
      }`}
    >
      {/* ── Outer Landing Page Card Container ── */}
      <div
        className={`relative w-full max-w-5xl rounded-3xl sm:rounded-[36px] shadow-2xl overflow-hidden border transition-all duration-300 ${
          isDarkMode
            ? 'bg-[#111319]/95 border-zinc-800/80 text-white shadow-black/80'
            : 'bg-white border-white/40 text-zinc-900 shadow-sky-900/30'
        }`}
      >
        {/* Top Header Bar with SuviX Logo & Navigation */}
        <header
          className={`flex items-center justify-between px-6 sm:px-12 py-5 sm:py-6 border-b transition-colors ${
            isDarkMode ? 'border-zinc-800/60' : 'border-zinc-100'
          }`}
        >
          {/* SuviX Official Logo */}
          <div className="flex items-center gap-3">
            <img
              src={isDarkMode ? darkLogo : lightLogo}
              alt="SuviX"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>

          {/* Clean User-Facing Header Links */}
          <nav className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm font-medium">
            <a
              href="/"
              className={`transition-colors ${
                isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Home
            </a>
            <a
              href="/about"
              className={`transition-colors hidden sm:inline-block ${
                isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              About
            </a>
            <a
              href="mailto:support@suvix.in"
              className={`transition-colors flex items-center gap-1.5 ${
                isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <LifeBuoy className="w-4 h-4 text-emerald-500" />
              <span>Contact</span>
            </a>
          </nav>
        </header>

        {/* Card Body: 2-Column Split matching the Reference UI Design */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 px-6 sm:px-12 py-10 sm:py-16">
          
          {/* ════ LEFT COLUMN: Typography & Action CTA ════ */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-zinc-900 dark:text-white">
                Oops!
              </h1>
              <h2
                className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                  isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
                }`}
              >
                Under Maintenance
              </h2>
            </div>

            <p
              className={`text-sm sm:text-base leading-relaxed max-w-md ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
              }`}
            >
              We're currently performing scheduled platform enhancements and server optimizations to bring you a faster and smoother creator experience. Everything will be back online shortly.
            </p>

            {/* Status Note / Retry Feedback */}
            <div className="flex items-center gap-2 pt-1 text-xs font-medium min-h-[24px]">
              {retryMessage ? (
                <span className="text-amber-500 flex items-center gap-1.5 animate-fadeIn">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>{retryMessage}</span>
                </span>
              ) : cooldown > 0 ? (
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Cooldown active • Button ready in {cooldown}s</span>
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Click below to check if services are back online</span>
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleManualRetry}
                disabled={isChecking || cooldown > 0}
                className="px-8 py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                <span>
                  {isChecking
                    ? 'Checking...'
                    : cooldown > 0
                    ? `Retry in ${cooldown}s`
                    : 'Refresh Page'}
                </span>
              </button>

              <a
                href="/"
                className={`px-6 py-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border flex items-center gap-1.5 ${
                  isDarkMode
                    ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800/60'
                    : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <span>Go to Home</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* ════ RIGHT COLUMN: Maintenance Illustration / Lottie Animation ════ */}
          <div className="lg:col-span-6 flex items-center justify-center relative">
            <div className="w-full max-w-[420px] aspect-square flex items-center justify-center relative">
              <Lottie
                animationData={maintenanceAnimation}
                loop={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

        </div>

        {/* Subtle Bottom Status Pill */}
        <footer
          className={`px-6 sm:px-12 py-3.5 text-center text-[11px] font-medium border-t transition-colors ${
            isDarkMode ? 'border-zinc-800/60 text-zinc-400' : 'border-zinc-100 text-zinc-400'
          }`}
        >
          <span>SuviX Infrastructure Operations</span>
          <span className="mx-2">•</span>
          <span>Your account and active sessions are fully preserved</span>
        </footer>

      </div>
    </div>
  );
};
