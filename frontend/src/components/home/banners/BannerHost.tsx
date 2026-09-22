import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../../hooks/useTheme';
import { BANNERS_LIST } from './index';

interface BannerHostProps {
  className?: string;
}

export const BannerHost: React.FC<BannerHostProps> = ({ className }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const { isDarkMode } = useTheme();

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const mouseStartXRef = useRef<number | null>(null);
  const isMouseDownRef = useRef(false);

  const hasBanners = BANNERS_LIST.length > 0;
  const currentBanner = hasBanners ? (BANNERS_LIST[activeIdx] || BANNERS_LIST[0]) : null;
  const CurrentSlideComponent = currentBanner?.Component;

  const goToNext = useCallback(() => {
    setActiveIdx((prev) => (prev + 1) % BANNERS_LIST.length);
    setTimerKey((k) => k + 1);
  }, []);

  const goToPrev = useCallback(() => {
    setActiveIdx((prev) => (prev - 1 + BANNERS_LIST.length) % BANNERS_LIST.length);
    setTimerKey((k) => k + 1);
  }, []);

  const goToSlide = useCallback((idx: number) => {
    setActiveIdx(idx);
    setTimerKey((k) => k + 1);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Non-blocking auto-advance timer:
  // After manual change, swipe, or cursor hover, the timer restarts
  // and smoothly continues autoscrolling. Zero page refresh needed!
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (BANNERS_LIST.length <= 1) return;

    const currentDuration = BANNERS_LIST[activeIdx]?.duration || 7000;
    const timer = setTimeout(() => {
      setActiveIdx((prev) => (prev + 1) % BANNERS_LIST.length);
    }, currentDuration);

    return () => clearTimeout(timer);
  }, [activeIdx, timerKey]);

  // Touch Swipe Handlers (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Only trigger if predominantly horizontal and moved at least 40px
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Mouse Drag / Swipe Handlers (Laptop / Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, select')) return;
    isMouseDownRef.current = true;
    mouseStartXRef.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || mouseStartXRef.current === null) return;
    const deltaX = e.clientX - mouseStartXRef.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    isMouseDownRef.current = false;
    mouseStartXRef.current = null;
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
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
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
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
        <div className="absolute bottom-2 sm:bottom-3.5 right-2.5 sm:right-6 z-30 flex items-center gap-2 sm:gap-2.5 pointer-events-auto select-none">
          {/* Dash Pagination Indicators */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {BANNERS_LIST.map((banner, idx) => {
              const isSelected = idx === activeIdx;
              return (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isSelected 
                      ? 'w-3.5 sm:w-5 h-1 sm:h-1.5 bg-zinc-800 dark:bg-white shadow-xs' 
                      : 'w-2 sm:w-3 h-1 sm:h-1.5 bg-zinc-400/60 dark:bg-white/40 hover:bg-zinc-600 dark:hover:bg-white/60'
                  }`}
                  aria-label={`Go to ${banner.title} (Slide ${idx + 1})`}
                  title={`${banner.title} (${(banner.duration / 1000).toFixed(0)}s)`}
                />
              );
            })}
          </div>

          {/* Unified Counter & Chevrons Capsule Pill */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-black/60 dark:bg-black/75 backdrop-blur-md border border-white/20 rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-white shadow-md">
            <button
              type="button"
              onClick={goToPrev}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer text-white/80 hover:text-white"
              aria-label="Previous Banner"
            >
              <ChevronLeft size={11} strokeWidth={2.5} className="sm:hidden" />
              <ChevronLeft size={13} strokeWidth={2.5} className="hidden sm:block" />
            </button>

            <span className="text-[8px] sm:text-[10.5px] font-bold tracking-tight px-1 text-white/95">
              {String(activeIdx + 1).padStart(2, '0')} / {String(BANNERS_LIST.length).padStart(2, '0')}
            </span>

            <button
              type="button"
              onClick={goToNext}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer text-white/80 hover:text-white"
              aria-label="Next Banner"
            >
              <ChevronRight size={11} strokeWidth={2.5} className="sm:hidden" />
              <ChevronRight size={13} strokeWidth={2.5} className="hidden sm:block" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
