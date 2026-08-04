import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Eye, Flame } from 'lucide-react';

interface WidgetProps {
  className?: string;
  variant?: 'desktop' | 'mobile-flank';
}

// ── INTERNAL HOOK FOR SYNCHRONIZED METRICS ANIMATION ────────────────────────
function useLiveCreatorMetrics() {
  const [viewsCount, setViewsCount] = useState(14.8);
  const [audienceCount, setAudienceCount] = useState(840);
  const [metricPhase, setMetricPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetricPhase((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const targets = [
      { views: 24.8, audience: 920 },
      { views: 48.2, audience: 1450 },
      { views: 18.5, audience: 680 },
    ];
    const target = targets[metricPhase];

    const start = performance.now();
    const duration = 2400;

    const step = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setViewsCount((prev) => Number((prev + (target.views - prev) * ease * 0.15).toFixed(1)));
      setAudienceCount((prev) => Math.round(prev + (target.audience - prev) * ease * 0.15));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [metricPhase]);

  return { viewsCount, audienceCount };
}

// ── COMPONENT 1: LIVE VIEWS & VIRAL GROWTH WIDGET ────────────────────────────
export const ViewsGrowthWidget = React.memo(function ViewsGrowthWidget({
  className = '',
  variant = 'desktop',
}: WidgetProps) {
  const { viewsCount } = useLiveCreatorMetrics();
  const isFlank = variant === 'mobile-flank';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative select-none ${
        isFlank
          ? 'rounded-xl xs:rounded-2xl bg-white/[0.04] backdrop-blur-none p-2 xs:p-2.5 border border-white/20 shadow-sm flex flex-col items-start text-left'
          : 'overflow-hidden rounded-2xl bg-white/[0.06] backdrop-blur-md p-3 sm:p-3.5 border border-white/20'
      } ${className}`}
    >
      {/* Header Row */}
      <div className={`flex items-center justify-between w-full ${isFlank ? 'mb-0.5 gap-1' : 'mb-1.5'}`}>
        <div className="flex items-center gap-1">
          <div
            className={`rounded flex items-center justify-center text-white ${
              isFlank ? 'w-3.5 h-3.5 bg-white/20' : 'w-6 h-6 bg-white/15 border border-white/25 shadow-xs'
            }`}
          >
            <Eye size={isFlank ? 9 : 13} className="stroke-[2.5] text-white" />
          </div>
          <span
            className={`font-bold text-white uppercase tracking-wider ${
              isFlank ? 'text-[7.5px] xs:text-[8px]' : 'text-[10px] sm:text-[11px]'
            }`}
          >
            Views
          </span>
        </div>

        <div
          className={`flex items-center gap-1 rounded-full ${
            isFlank
              ? 'px-1 py-0.2 bg-white/20 text-[6.5px] xs:text-[7px]'
              : 'px-2 py-0.5 bg-white/15 border border-white/30 text-[8.5px]'
          }`}
        >
          <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
          <span className="font-black text-white uppercase tracking-tight">Live</span>
        </div>
      </div>

      {/* Main Metric Value */}
      <div className={`flex items-baseline gap-0.5 ${isFlank ? 'my-0' : 'my-0.5'}`}>
        <span
          className={`font-black text-white tracking-tight font-mono ${
            isFlank ? 'text-xs xs:text-sm sm:text-base' : 'text-xl sm:text-2xl'
          }`}
        >
          {viewsCount.toFixed(1)}M
        </span>
        <span className={`font-bold text-white/80 ${isFlank ? 'text-[8px]' : 'text-[11px]'}`}>+</span>
      </div>

      {/* Animated SVG Sparkline Wave */}
      <div className={`relative w-full overflow-hidden ${isFlank ? 'h-3 xs:h-3.5 my-0.5' : 'h-6 my-1'}`}>
        <svg viewBox="0 0 100 24" className="w-full h-full preserve-3d" fill="none">
          <defs>
            <linearGradient id="viewsGradFlank" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,20 Q15,18 30,12 T60,8 T85,4 T100,2 L100,24 L0,24 Z"
            fill="url(#viewsGradFlank)"
            animate={{
              d: [
                "M0,20 Q15,18 30,12 T60,8 T85,4 T100,2 L100,24 L0,24 Z",
                "M0,22 Q15,14 30,8 T60,14 T85,2 T100,1 L100,24 L0,24 Z",
                "M0,20 Q15,18 30,12 T60,8 T85,4 T100,2 L100,24 L0,24 Z",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M0,20 Q15,18 30,12 T60,8 T85,4 T100,2"
            stroke="#ffffff"
            strokeWidth={isFlank ? "1.8" : "2.2"}
            strokeLinecap="round"
            animate={{
              d: [
                "M0,20 Q15,18 30,12 T60,8 T85,4 T100,2",
                "M0,22 Q15,14 30,8 T60,14 T85,2 T100,1",
                "M0,20 Q15,18 30,12 T60,8 T85,4 T100,2",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <circle cx="98" cy="3" r="1.8" fill="#ffffff" />
        </svg>
      </div>

      {/* Footer Pill */}
      <div
        className={`flex items-center gap-1 font-bold text-white rounded-md w-fit ${
          isFlank
            ? 'text-[7px] xs:text-[7.5px] bg-white/20 px-1 py-0.2'
            : 'text-[9.5px] sm:text-[10px] bg-white/15 border border-white/25 px-2 py-0.5'
        }`}
      >
        <TrendingUp size={isFlank ? 8 : 11} className="stroke-[2.5] text-white" />
        <span>+340%</span>
      </div>
    </motion.div>
  );
});

// ── COMPONENT 2: AUDIENCE REACH & ENGAGEMENT WIDGET ──────────────────────────
export const AudienceReachWidget = React.memo(function AudienceReachWidget({
  className = '',
  variant = 'desktop',
}: WidgetProps) {
  const { audienceCount } = useLiveCreatorMetrics();
  const isFlank = variant === 'mobile-flank';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative select-none ${
        isFlank
          ? 'rounded-xl xs:rounded-2xl bg-white/[0.04] backdrop-blur-none p-2 xs:p-2.5 border border-white/20 shadow-sm flex flex-col items-end text-right'
          : 'overflow-hidden rounded-2xl bg-white/[0.06] backdrop-blur-md p-3 sm:p-3.5 border border-white/20'
      } ${className}`}
    >
      {/* Header Row */}
      <div className={`flex items-center justify-between w-full ${isFlank ? 'mb-0.5 gap-1 flex-row-reverse' : 'mb-1.5'}`}>
        <div className="flex items-center gap-1">
          <div
            className={`rounded flex items-center justify-center text-white ${
              isFlank ? 'w-3.5 h-3.5 bg-white/20' : 'w-6 h-6 bg-white/15 border border-white/25 shadow-xs'
            }`}
          >
            <Users size={isFlank ? 9 : 13} className="stroke-[2.5] text-white" />
          </div>
          <span
            className={`font-bold text-white uppercase tracking-wider ${
              isFlank ? 'text-[7.5px] xs:text-[8px]' : 'text-[10px] sm:text-[11px]'
            }`}
          >
            Reach
          </span>
        </div>

        <div
          className={`flex items-center gap-1 rounded-full ${
            isFlank
              ? 'px-1 py-0.2 bg-white/20 text-[6.5px] xs:text-[7px]'
              : 'px-2 py-0.5 bg-white/15 border border-white/30 text-[8.5px]'
          }`}
        >
          <Flame size={isFlank ? 7 : 10} className="text-white fill-white" />
          <span className="font-black text-white uppercase tracking-tight">Viral</span>
        </div>
      </div>

      {/* Main Metric Value */}
      <div className={`flex items-baseline gap-0.5 ${isFlank ? 'my-0' : 'my-0.5'}`}>
        <span
          className={`font-black text-white tracking-tight font-mono ${
            isFlank ? 'text-xs xs:text-sm sm:text-base' : 'text-xl sm:text-2xl'
          }`}
        >
          {audienceCount >= 1000 ? `${(audienceCount / 1000).toFixed(1)}M` : `${audienceCount}K`}
        </span>
        <span className={`font-bold text-white/80 ${isFlank ? 'text-[8px]' : 'text-[11px]'}`}>Reach</span>
      </div>

      {/* Animated Pure White Equalizer Bars */}
      <div className={`flex items-end justify-between gap-0.5 w-full ${isFlank ? 'h-3 xs:h-3.5 my-0.5' : 'h-6 my-1'}`}>
        {[40, 75, 55, 95, 65, 85, 45, 90, 70, 100, 60, 80].map((height, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-white rounded-full opacity-90"
            animate={{
              height: [
                `${height * 0.4}%`,
                `${Math.min(height * 1.1, 100)}%`,
                `${height * 0.5}%`,
              ],
            }}
            transition={{
              duration: 1.2 + (i % 4) * 0.3,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: i * 0.08,
            }}
          />
        ))}
      </div>

      {/* Footer Pill */}
      <div
        className={`flex items-center gap-1 font-bold text-white rounded-md w-fit ${
          isFlank
            ? 'text-[7px] xs:text-[7.5px] bg-white/20 px-1 py-0.2'
            : 'text-[9.5px] sm:text-[10px] bg-white/15 border border-white/25 px-2 py-0.5'
        }`}
      >
        <span>+98% Ret.</span>
      </div>
    </motion.div>
  );
});

// ── DESKTOP COMBINED TICKER ──────────────────────────────────────────────────
export const CreatorMetricsTicker = React.memo(function CreatorMetricsTicker({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`w-full max-w-[28rem] xl:max-w-[31rem] mx-auto mt-3 grid grid-cols-2 gap-2.5 sm:gap-3.5 select-none ${className}`}>
      <ViewsGrowthWidget variant="desktop" />
      <AudienceReachWidget variant="desktop" />
    </div>
  );
});
