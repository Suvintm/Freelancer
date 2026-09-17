import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../../hooks/useTheme';
import { BANNERS_LIST } from './index';

interface BannerHostProps {
  className?: string;
}

export const BannerHost: React.FC<BannerHostProps> = ({ className }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { isDarkMode } = useTheme();

  const hasBanners = BANNERS_LIST.length > 0;
  const currentBanner = hasBanners ? (BANNERS_LIST[activeIdx] || BANNERS_LIST[0]) : null;
  const CurrentSlideComponent = currentBanner?.Component;

  // ─────────────────────────────────────────────────────────────
  // Dynamic per-banner duration timer:
  // Reads the exact `duration` defined on the active banner itself!
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused || BANNERS_LIST.length <= 1) return;

    const currentDuration = BANNERS_LIST[activeIdx]?.duration || 6000;
    const timer = setTimeout(() => {
      setActiveIdx((prev) => (prev + 1) % BANNERS_LIST.length);
    }, currentDuration);

    return () => clearTimeout(timer);
  }, [activeIdx, isPaused]);

  return (
    <div 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full h-[175px] xs:h-[195px] sm:h-[280px] md:h-[340px] lg:h-[395px] min-h-[175px] xs:min-h-[195px] sm:min-h-[280px] md:min-h-[340px] lg:min-h-[395px] rounded-[18px] sm:rounded-[22px] lg:rounded-[26px] overflow-hidden select-none transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#000000] border border-white/10 shadow-none' 
          : 'bg-white border border-black/20 shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
      } ${className || ''}`}
    >
      {/* 1. Active Banner Slide Component */}
      {hasBanners && CurrentSlideComponent && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            <CurrentSlideComponent isDarkMode={isDarkMode} />
          </motion.div>
        </AnimatePresence>
      )}

      {/* 2. 3D Curved Glass / Samsung Edge Screen Inner Shadow & Specular Bevel */}
      <div 
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 rounded-[18px] sm:rounded-[22px] lg:rounded-[26px] shadow-[inset_0_0_24px_rgba(0,0,0,0.14),inset_10px_0_16px_-4px_rgba(0,0,0,0.2),inset_-10px_0_16px_-4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-8px_16px_-4px_rgba(0,0,0,0.18)] dark:shadow-[inset_0_0_24px_rgba(0,0,0,0.4),inset_10px_0_16px_-3px_rgba(255,255,255,0.08),inset_-10px_0_16px_-3px_rgba(255,255,255,0.08),inset_0_1.5px_2.5px_rgba(255,255,255,0.22),inset_0_-8px_16px_-4px_rgba(0,0,0,0.5)]" 
      />
      
      {/* Curved Edge Glass Rim Highlight */}
      <div 
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 rounded-[18px] sm:rounded-[22px] lg:rounded-[26px] ring-1 ring-inset ring-black/5 dark:ring-white/12" 
      />

      {/* Samsung Curved Glass Side Edge Overlays (Blended Dark Base with Subtle White Specular Sheen) */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-8 z-20 opacity-0 dark:opacity-100 bg-gradient-to-r from-white/[0.08] via-black/40 to-transparent rounded-l-[18px] sm:rounded-l-[22px] lg:rounded-l-[26px] transition-opacity duration-300"
      >
        <div className="absolute inset-y-4 left-[1px] w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent" />
      </div>
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-8 z-20 opacity-0 dark:opacity-100 bg-gradient-to-l from-white/[0.08] via-black/40 to-transparent rounded-r-[18px] sm:rounded-r-[22px] lg:rounded-r-[26px] transition-opacity duration-300"
      >
        <div className="absolute inset-y-4 right-[1px] w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent" />
      </div>

      {/* 3. Interactive Navigation Controls (Rendered when 2+ banners exist) */}
      {BANNERS_LIST.length > 1 && (
        <>
          {/* Bottom-Center: Pagination Indicators (Pill + Dots) */}
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-1.5 pointer-events-auto select-none">
            {BANNERS_LIST.map((banner, idx) => {
              const isSelected = idx === activeIdx;
              return (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isSelected 
                      ? 'w-4 sm:w-6 h-1 sm:h-1.5 bg-indigo-600 dark:bg-indigo-400 shadow-sm' 
                      : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-zinc-300/80 dark:bg-zinc-600/80 hover:bg-zinc-400'
                  }`}
                  aria-label={`Go to ${banner.title} (Slide ${idx + 1})`}
                  title={`${banner.title} (${(banner.duration / 1000).toFixed(0)}s)`}
                />
              );
            })}
          </div>

          {/* Bottom-Right: Prev & Next Circular Chevron Buttons */}
          <div className="absolute bottom-2 sm:bottom-4 right-2.5 sm:right-6 z-30 flex items-center gap-1 sm:gap-1.5 pointer-events-auto select-none">
            <button
              type="button"
              onClick={() => setActiveIdx((prev) => (prev - 1 + BANNERS_LIST.length) % BANNERS_LIST.length)}
              className={`w-5.5 h-5.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isDarkMode 
                  ? 'bg-zinc-900/90 border-zinc-700 text-white hover:bg-zinc-800' 
                  : 'bg-white/90 border-zinc-200 text-zinc-900 hover:bg-white'
              }`}
              aria-label="Previous Banner"
            >
              <ChevronLeft size={11} strokeWidth={2.5} className="sm:hidden" />
              <ChevronLeft size={15} strokeWidth={2.5} className="hidden sm:block" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIdx((prev) => (prev + 1) % BANNERS_LIST.length)}
              className={`w-5.5 h-5.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isDarkMode 
                  ? 'bg-zinc-900/90 border-zinc-700 text-white hover:bg-zinc-800' 
                  : 'bg-white/90 border-zinc-200 text-zinc-900 hover:bg-white'
              }`}
              aria-label="Next Banner"
            >
              <ChevronRight size={11} strokeWidth={2.5} className="sm:hidden" />
              <ChevronRight size={15} strokeWidth={2.5} className="hidden sm:block" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
