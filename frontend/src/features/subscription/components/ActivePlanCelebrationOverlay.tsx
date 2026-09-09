import React from 'react';
import LottieComponent from 'lottie-react';
import { Sparkles } from 'lucide-react';
import activePlanCelebrationLottie from '../../../assets/lottie/active_plan_celebration.json';

// Handle ESM/CJS interop for lottie-react
const Lottie: any = (LottieComponent as any)?.default || LottieComponent;

interface ActivePlanCelebrationOverlayProps {
  isActive?: boolean;
  isDarkMode?: boolean;
  showBadge?: boolean;
}

const ActivePlanCelebrationOverlayComponent: React.FC<ActivePlanCelebrationOverlayProps> = ({
  isActive = true,
  isDarkMode = false,
  showBadge = false,
}) => {
  if (!isActive) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-2xl z-10"
      style={{ contain: 'paint' }}
      aria-hidden="true"
    >
      {/* ── AMBIENT CELEBRATION GLOW ACCENT ────────── */}
      <div
        className={`absolute -top-10 -right-10 w-44 h-44 rounded-full blur-2xl opacity-40 transition-opacity pointer-events-none ${
          isDarkMode ? 'bg-emerald-500/25' : 'bg-emerald-400/20'
        }`}
      />

      {/* ── TOP 52% CONTINUOUS CONFETTI LOTTIE ANIMATION ────────── */}
      <div
        className="absolute top-0 left-0 right-0 h-[52%] flex items-center justify-center pointer-events-none overflow-hidden"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
        }}
      >
        <div className="w-full h-full max-h-[190px] flex items-center justify-center pointer-events-none">
          <Lottie
            animationData={activePlanCelebrationLottie}
            loop={true}
            autoPlay={true}
            style={{ width: '100%', height: '100%' }}
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid meet',
            }}
            className="w-full h-full object-contain transform-gpu will-change-transform pointer-events-none opacity-95 dark:opacity-100"
          />
        </div>
      </div>

      {/* ── TOP-RIGHT ACTIVE BADGE WITH PULSING INDICATOR ────────── */}
      {showBadge && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 backdrop-blur-sm shadow-xs animate-fadeIn">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
            Active Plan
          </span>
          <Sparkles className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export const ActivePlanCelebrationOverlay = React.memo(ActivePlanCelebrationOverlayComponent);
export default ActivePlanCelebrationOverlay;
