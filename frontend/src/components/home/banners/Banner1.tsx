import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  LayoutGrid, 
  Users, 
  Briefcase, 
  Zap 
} from 'lucide-react';
import banner1Img from '../../../assets/banner1.png';

// ─────────────────────────────────────────────────────────────
// 1. DURATION DEFINITION (in milliseconds)
// ─────────────────────────────────────────────────────────────
export const BANNER_1_DURATION = 7000; // 7 Seconds

// ─────────────────────────────────────────────────────────────
// 2. BANNER COMPONENT: Ecosystem
// ─────────────────────────────────────────────────────────────
export const Banner1: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative w-full h-full inset-0 overflow-hidden select-none transition-colors duration-300 ${
      isDarkMode ? 'bg-[#000000]' : 'bg-white'
    }`}>
      {/* 1. Background Image Layer with Graceful Fallback */}
      {!imgError && banner1Img && (
        <img
          src={banner1Img}
          alt="SuviX - More Tools, More Creators"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-right sm:object-center pointer-events-none"
        />
      )}

      {/* 2. Reading Gradient Overlays */}
      <div 
        className={`absolute inset-0 z-10 pointer-events-none transition-colors duration-500 ${
          isDarkMode
            ? 'bg-gradient-to-r from-black via-black/85 via-48% to-black/30'
            : 'bg-gradient-to-r from-white/70 via-white/40 via-40% to-transparent'
        }`}
      />

      {/* Top Subtle Scrim */}
      <div className="absolute inset-x-0 top-0 h-16 z-10 bg-gradient-to-b from-black/25 via-black/5 to-transparent pointer-events-none" />

      {/* 3. Main Content Layer */}
      <div className="relative z-20 h-full w-full px-3.5 sm:px-8 lg:px-10 py-2.5 sm:pt-6 lg:pt-7 sm:pb-9 lg:pb-10 flex flex-col justify-between">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="max-w-[260px] xs:max-w-[320px] sm:max-w-md lg:max-w-xl flex flex-col items-start space-y-1 sm:space-y-2 lg:space-y-2.5"
        >
          {/* Eyebrow Label */}
          <div className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] lg:text-[10.5px] font-extrabold tracking-[0.15em] sm:tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase select-none">
            CREATE &nbsp;·&nbsp; COLLABORATE &nbsp;·&nbsp; GROW
          </div>

          {/* Bold 3-line Headline with lighter 3rd line */}
          <h1 className={`text-sm xs:text-base sm:text-2xl lg:text-[30px] xl:text-[34px] font-black tracking-tight leading-[1.15] ${
            isDarkMode ? 'text-white' : 'text-zinc-950'
          }`}>
            More Tools.<br />
            More Creators.<br />
            <span className="text-zinc-400 dark:text-zinc-500 font-extrabold">
              A Brighter Tomorrow.
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`hidden xs:block text-[9.5px] sm:text-[11.5px] lg:text-[12.5px] font-medium leading-tight sm:leading-relaxed line-clamp-1 sm:line-clamp-2 max-w-[220px] sm:max-w-md ${
            isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
          }`}>
            Everything you need to create, collaborate and grow — in one powerful ecosystem.
          </p>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 pt-0.5 sm:pt-1">
            <button
              type="button"
              onClick={() => navigate('/create')}
              className={`h-6 xs:h-7 sm:h-8.5 lg:h-9 px-2.5 xs:px-3 sm:px-4 lg:px-5 rounded-full font-bold text-[9px] xs:text-[10px] sm:text-xs lg:text-[12.5px] flex items-center gap-1 sm:gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-[#15171C] text-white hover:bg-black'
              }`}
            >
              <span>Create Now</span>
              <ArrowRight size={11} strokeWidth={2.5} className="sm:hidden" />
              <ArrowRight size={13} strokeWidth={2.5} className="hidden sm:block" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/creator-tools')}
              className={`h-6 xs:h-7 sm:h-8.5 lg:h-9 px-2 xs:px-2.5 sm:px-3.5 lg:px-4 rounded-full font-bold text-[9px] xs:text-[10px] sm:text-xs lg:text-[12.5px] flex items-center gap-1 sm:gap-1.5 border shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isDarkMode
                  ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
                  : 'border-zinc-200 bg-white/90 hover:bg-white text-zinc-900'
              }`}
            >
              <LayoutGrid size={11} strokeWidth={2.2} className="sm:hidden" />
              <LayoutGrid size={13} strokeWidth={2.2} className="hidden sm:block" />
              <span>Explore Tools</span>
            </button>
          </div>
        </motion.div>

        {/* 4. Bottom Metric Badges Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
          className="hidden sm:flex items-center gap-2 sm:gap-2.5 pt-3 flex-wrap"
        >
          {/* Stat 1: 1M+ Creators */}
          <div className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl border shadow-2xs transition-all backdrop-blur-md ${
            isDarkMode
              ? 'bg-zinc-900/80 border-zinc-800 text-white'
              : 'bg-white/90 border-zinc-200/80 text-zinc-900'
          }`}>
            <div className="w-5.5 h-5.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Users size={11} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[11px] sm:text-xs font-black">1M+</span>
              <span className="text-[8px] sm:text-[8.5px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Creators</span>
            </div>
          </div>

          {/* Stat 2: 500+ Brands */}
          <div className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl border shadow-2xs transition-all backdrop-blur-md ${
            isDarkMode
              ? 'bg-zinc-900/80 border-zinc-800 text-white'
              : 'bg-white/90 border-zinc-200/80 text-zinc-900'
          }`}>
            <div className="w-5.5 h-5.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Briefcase size={11} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[11px] sm:text-xs font-black">500+</span>
              <span className="text-[8px] sm:text-[8.5px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Brands</span>
            </div>
          </div>

          {/* Stat 3: 10M+ Opportunities */}
          <div className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl border shadow-2xs transition-all backdrop-blur-md ${
            isDarkMode
              ? 'bg-zinc-900/80 border-zinc-800 text-white'
              : 'bg-white/90 border-zinc-200/80 text-zinc-900'
          }`}>
            <div className="w-5.5 h-5.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap size={11} strokeWidth={2.5} className="fill-current" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[11px] sm:text-xs font-black">10M+</span>
              <span className="text-[8px] sm:text-[8.5px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Opportunities</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 3. BANNER CONFIGURATION
// ─────────────────────────────────────────────────────────────
export const BANNER_1_CONFIG = {
  id: 'banner-1',
  title: 'More Tools. More Creators.',
  badge: 'Ecosystem',
  duration: BANNER_1_DURATION,
  thumbnail: banner1Img,
  Component: Banner1,
};
