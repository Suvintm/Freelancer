import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Play, 
  TrendingUp, 
  Handshake, 
  Wallet 
} from 'lucide-react';
import banner3Img from '../../../assets/banner3.png';
import lightLogo from '../../../assets/lightlogo.png';
import darkLogo from '../../../assets/darklogo.png';

// ─────────────────────────────────────────────────────────────
// 1. DURATION DEFINITION (in milliseconds)
// ─────────────────────────────────────────────────────────────
export const BANNER_3_DURATION = 7000; // 7 Seconds

// ─────────────────────────────────────────────────────────────
// 2. BANNER COMPONENT: Growth (Grow Everywhere. Earn More with SuviX.)
// ─────────────────────────────────────────────────────────────
export const Banner3: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative w-full h-full inset-0 overflow-hidden select-none transition-colors duration-300 ${
      isDarkMode ? 'bg-[#000000]' : 'bg-[#FAFAFA]'
    }`}>
      {/* 1. Background Image (banner3.png - shifted towards right so contents are unobstructed) */}
      {!imgError && banner3Img && (
        <img
          src={banner3Img}
          alt="SuviX - Grow Everywhere. Earn More with SuviX."
          onError={() => setImgError(true)}
          className="absolute inset-y-0 right-0 w-full h-full object-cover object-[92%_center] sm:object-right translate-x-2 sm:translate-x-6 md:translate-x-10 lg:translate-x-14 pointer-events-none"
        />
      )}

      {/* 2. Responsive Reading & Left-Edge Blending Gradient Overlay */}
      <div 
        className={`absolute inset-0 z-10 pointer-events-none transition-colors duration-500 ${
          isDarkMode
            ? 'bg-gradient-to-r from-black from-0% via-black/95 via-22% via-black/60 via-45% to-transparent'
            : 'bg-gradient-to-r from-white/75 via-white/40 via-34% to-transparent'
        }`}
      />

      {/* Extra deep left-edge seamless black blend for Dark Mode */}
      {isDarkMode && (
        <div 
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1/3 z-10 pointer-events-none bg-gradient-to-r from-black via-black/90 to-transparent" 
        />
      )}

      {/* 3. Main Content Layer */}
      <div className="relative z-20 h-full w-full px-4 sm:px-8 lg:px-10 py-3 sm:py-6 lg:py-7 flex flex-col justify-between">
        {/* Top Content Group: Eyebrow Header, Headline & Description (Constrained to left side) */}
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="max-w-[240px] xs:max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[420px] xl:max-w-[440px] flex flex-col items-start space-y-1 xs:space-y-1.5 sm:space-y-2.5 lg:space-y-3"
        >
          {/* Top Brand & Eyebrow Row: [SuviX Logo] | CREATE · COLLABORATE · EARN / FOR A BIGGER TOMORROW */}
          <div className="flex items-center gap-2 sm:gap-2.5 select-none">
            <img 
              src={isDarkMode ? darkLogo : lightLogo} 
              alt="SuviX" 
              className="h-3 xs:h-3.5 sm:h-4 lg:h-4.5 w-auto object-contain" 
            />
            <div className={`h-5 sm:h-6 w-[1px] ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
            <div className="flex flex-col leading-none">
              <span className="text-[6.5px] xs:text-[7.5px] sm:text-[8.5px] lg:text-[9px] font-extrabold tracking-[0.18em] sm:tracking-[0.22em] text-zinc-500 dark:text-zinc-400 uppercase">
                CREATE &nbsp;·&nbsp; COLLABORATE &nbsp;·&nbsp; EARN
              </span>
              <span className="text-[6px] xs:text-[7px] sm:text-[7.5px] lg:text-[8px] font-bold tracking-[0.14em] sm:tracking-[0.16em] text-zinc-400 dark:text-zinc-500 uppercase mt-0.5">
                FOR A BIGGER TOMORROW
              </span>
            </div>
          </div>

          {/* Bold 2-Line Headline with subtle underline */}
          <div className="relative">
            <h1 className={`text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-[34px] xl:text-[38px] font-black tracking-tight leading-[1.08] ${
              isDarkMode ? 'text-white' : 'text-zinc-950'
            }`}>
              Grow Everywhere.<br />
              <span className="relative inline-block">
                Earn More with SuviX.
                {/* Hand-drawn style decorative underline */}
                <span className="absolute -bottom-1 left-0 w-2/5 h-[2px] sm:h-[2.5px] bg-black dark:bg-white rounded-full opacity-80" />
              </span>
            </h1>
          </div>

          {/* Feature Subtitle */}
          <p className={`text-[8.5px] xs:text-[9.5px] sm:text-[11px] lg:text-[12.5px] font-medium leading-tight sm:leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-[220px] xs:max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[420px] ${
            isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
          }`}>
            Keep creating on Instagram, YouTube, TikTok, Facebook and everywhere you love. Grow your audience, bring new opportunities to SuviX, collaborate with brands, and turn your influence into real income.
          </p>
        </motion.div>

        {/* Bottom Group: Metrics Row (Above Buttons) + Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
          className="max-w-[280px] xs:max-w-[320px] sm:max-w-[380px] md:max-w-[420px] flex flex-col gap-2 sm:gap-3 pt-1"
        >
          {/* 3-Column Inline Metrics Row */}
          <div className="flex items-center gap-2 xs:gap-3 sm:gap-5 lg:gap-6 flex-wrap">
            {/* Metric 1: More Opportunities */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingUp 
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`} 
                strokeWidth={2.2} 
              />
              <div className="flex flex-col leading-none">
                <span className={`text-[10px] xs:text-[11px] sm:text-xs lg:text-[13px] font-black tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-zinc-950'
                }`}>
                  More
                </span>
                <span className={`text-[7px] xs:text-[7.5px] sm:text-[8.5px] lg:text-[9px] font-semibold mt-0.5 ${
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  Opportunities
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className={`h-4 sm:h-5 w-[1px] ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />

            {/* Metric 2: Brand Collaborations */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Handshake 
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`} 
                strokeWidth={2.2} 
              />
              <div className="flex flex-col leading-none">
                <span className={`text-[10px] xs:text-[11px] sm:text-xs lg:text-[13px] font-black tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-zinc-950'
                }`}>
                  Brand
                </span>
                <span className={`text-[7px] xs:text-[7.5px] sm:text-[8.5px] lg:text-[9px] font-semibold mt-0.5 ${
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  Collaborations
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className={`h-4 sm:h-5 w-[1px] ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />

            {/* Metric 3: Real Earnings */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Wallet 
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`} 
                strokeWidth={2.2} 
              />
              <div className="flex flex-col leading-none">
                <span className={`text-[10px] xs:text-[11px] sm:text-xs lg:text-[13px] font-black tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-zinc-950'
                }`}>
                  Real
                </span>
                <span className={`text-[7px] xs:text-[7.5px] sm:text-[8.5px] lg:text-[9px] font-semibold mt-0.5 ${
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  Earnings
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/create')}
              className={`h-6.5 xs:h-7 sm:h-8.5 lg:h-9 px-2.5 xs:px-3 sm:px-4.5 rounded-full font-bold text-[8.5px] xs:text-[9.5px] sm:text-xs lg:text-[12.5px] flex items-center gap-1 sm:gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-black text-white hover:bg-zinc-900'
              }`}
            >
              <span>Start Your Journey</span>
              <ArrowRight size={11} strokeWidth={2.5} className="sm:hidden" />
              <ArrowRight size={13} strokeWidth={2.5} className="hidden sm:block" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/explore')}
              className={`h-6.5 xs:h-7 sm:h-8.5 lg:h-9 px-2.5 xs:px-3 sm:px-4 rounded-full font-bold text-[8.5px] xs:text-[9.5px] sm:text-xs lg:text-[12.5px] flex items-center gap-1 sm:gap-1.5 border shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isDarkMode
                  ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
                  : 'border-zinc-200 bg-white/90 hover:bg-white text-zinc-900'
              }`}
            >
              <Play size={11} strokeWidth={2.2} className="sm:hidden" />
              <Play size={13} strokeWidth={2.2} className="hidden sm:block" />
              <span>Watch How</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 3. BANNER CONFIGURATION
// ─────────────────────────────────────────────────────────────
export const BANNER_3_CONFIG = {
  id: 'banner-3',
  title: 'Grow Everywhere. Earn More with SuviX.',
  badge: 'GROWTH',
  duration: BANNER_3_DURATION,
  thumbnail: banner3Img,
  Component: Banner3,
};
