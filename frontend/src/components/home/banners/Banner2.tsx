import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  LayoutGrid, 
  Users, 
  Link2, 
  Sparkles 
} from 'lucide-react';
import banner2Img from '../../../assets/banner2.png';
import lightLogo from '../../../assets/lightlogo.png';
import darkLogo from '../../../assets/darklogo.png';

// ─────────────────────────────────────────────────────────────
// 1. DURATION DEFINITION (in milliseconds)
// ─────────────────────────────────────────────────────────────
export const BANNER_2_DURATION = 7000; // 7 Seconds

// ─────────────────────────────────────────────────────────────
// 2. BANNER COMPONENT: Link in Bio (One Link. Endless Opportunities.)
// ─────────────────────────────────────────────────────────────
export const Banner2: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative w-full h-full inset-0 overflow-hidden select-none transition-colors duration-300 ${
      isDarkMode ? 'bg-[#000000]' : 'bg-[#FAFAFA]'
    }`}>
      {/* 1. Background Image (banner2.png) */}
      {!imgError && banner2Img && (
        <img
          src={banner2Img}
          alt="SuviX - One Link. Endless Opportunities."
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-[78%_center] sm:object-[72%_center] md:object-right pointer-events-none"
        />
      )}

      {/* 2. Soft Reading Gradient Overlay (Subtly reduced to highlight banner2.png) */}
      <div 
        className={`absolute inset-0 z-10 pointer-events-none transition-colors duration-500 ${
          isDarkMode
            ? 'bg-gradient-to-r from-black/75 via-black/45 via-38% to-transparent'
            : 'bg-gradient-to-r from-white/65 via-white/30 via-36% to-transparent'
        }`}
      />

      {/* 3. Main Content Layer */}
      <div className="relative z-20 h-full w-full px-4 sm:px-8 lg:px-10 py-3 sm:py-6 lg:py-7 flex flex-col justify-between">
        {/* Top & Middle Content Group */}
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="max-w-[260px] xs:max-w-[320px] sm:max-w-md lg:max-w-xl flex flex-col items-start space-y-1 xs:space-y-1.5 sm:space-y-2.5 lg:space-y-3"
        >
          {/* Eyebrow Brand Badge: [SuviX | LINK IN BIO] */}
          <div className={`inline-flex items-center rounded-full border px-1 sm:px-1.5 py-0.5 backdrop-blur-md shadow-2xs transition-colors ${
            isDarkMode 
              ? 'border-white/30 bg-black/60 text-white' 
              : 'border-black/60 bg-white/90 text-black'
          }`}>
            <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full border ${
              isDarkMode 
                ? 'border-white/20 bg-white/10' 
                : 'border-black/20 bg-black/5'
            }`}>
              <img 
                src={isDarkMode ? darkLogo : lightLogo} 
                alt="SuviX" 
                className="h-2 xs:h-2.5 sm:h-3.5 w-auto object-contain" 
              />
            </div>
            <span className="px-1.5 sm:px-2 text-[7px] xs:text-[7.5px] sm:text-[9px] lg:text-[9.5px] font-extrabold tracking-wider uppercase">
              LINK IN BIO
            </span>
          </div>

          {/* Bold 2-line Headline with period */}
          <h1 className={`text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-[34px] xl:text-[38px] font-black tracking-tight leading-[1.08] ${
            isDarkMode ? 'text-white' : 'text-zinc-950'
          }`}>
            One Link.<br />
            Endless Opportunities.
          </h1>

          {/* Subtitle */}
          <p className={`text-[8.5px] xs:text-[9.5px] sm:text-[11px] lg:text-[12.5px] font-medium leading-tight sm:leading-relaxed line-clamp-2 max-w-[220px] xs:max-w-[280px] sm:max-w-md lg:max-w-lg ${
            isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
          }`}>
            Showcase your work, social handles, services and more with a powerful SuviX link in bio. Simple. Beautiful. Yours.
          </p>

          {/* Action Pill Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 pt-0.5 sm:pt-1">
            <button
              type="button"
              onClick={() => navigate('/link-in-bio')}
              className={`h-6.5 xs:h-7 sm:h-8.5 lg:h-9 px-2.5 xs:px-3 sm:px-4.5 rounded-full font-bold text-[8.5px] xs:text-[9.5px] sm:text-xs lg:text-[12.5px] flex items-center gap-1 sm:gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-black text-white hover:bg-zinc-900'
              }`}
            >
              <span>Create Your Link in Bio</span>
              <ArrowRight size={11} strokeWidth={2.5} className="sm:hidden" />
              <ArrowRight size={13} strokeWidth={2.5} className="hidden sm:block" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/explore')}
              className={`h-6.5 xs:h-7 sm:h-8.5 lg:h-9 px-2 xs:px-2.5 sm:px-3.5 rounded-full font-bold text-[8.5px] xs:text-[9.5px] sm:text-xs lg:text-[12.5px] flex items-center gap-1 sm:gap-1.5 border shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isDarkMode
                  ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
                  : 'border-zinc-200 bg-white/90 hover:bg-white text-zinc-900'
              }`}
            >
              <LayoutGrid size={11} strokeWidth={2.2} className="sm:hidden" />
              <LayoutGrid size={13} strokeWidth={2.2} className="hidden sm:block" />
              <span>See Examples</span>
            </button>
          </div>
        </motion.div>

        {/* Bottom Metrics / Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
          className="flex items-center gap-2 xs:gap-3 sm:gap-5 lg:gap-6 pt-2 flex-wrap"
        >
          {/* Stat 1: 500K+ Creators */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Users 
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`} 
              strokeWidth={2.2} 
            />
            <div className="flex flex-col leading-none">
              <span className={`text-[10px] xs:text-[11px] sm:text-xs lg:text-[13px] font-black tracking-tight ${
                isDarkMode ? 'text-white' : 'text-zinc-950'
              }`}>
                500K+
              </span>
              <span className={`text-[7px] xs:text-[7.5px] sm:text-[8.5px] lg:text-[9px] font-semibold mt-0.5 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                Creators
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className={`h-4 sm:h-5 w-[1px] ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />

          {/* Stat 2: 2M+ Links Created */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link2 
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`} 
              strokeWidth={2.2} 
            />
            <div className="flex flex-col leading-none">
              <span className={`text-[10px] xs:text-[11px] sm:text-xs lg:text-[13px] font-black tracking-tight ${
                isDarkMode ? 'text-white' : 'text-zinc-950'
              }`}>
                2M+
              </span>
              <span className={`text-[7px] xs:text-[7.5px] sm:text-[8.5px] lg:text-[9px] font-semibold mt-0.5 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                Links Created
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className={`h-4 sm:h-5 w-[1px] ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-300'}`} />

          {/* Stat 3: 10M+ Opportunities */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Sparkles 
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`} 
              strokeWidth={2.2} 
            />
            <div className="flex flex-col leading-none">
              <span className={`text-[10px] xs:text-[11px] sm:text-xs lg:text-[13px] font-black tracking-tight ${
                isDarkMode ? 'text-white' : 'text-zinc-950'
              }`}>
                10M+
              </span>
              <span className={`text-[7px] xs:text-[7.5px] sm:text-[8.5px] lg:text-[9px] font-semibold mt-0.5 ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                Opportunities
              </span>
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
export const BANNER_2_CONFIG = {
  id: 'banner-2',
  title: 'One Link. Endless Opportunities.',
  badge: 'LINK IN BIO',
  duration: BANNER_2_DURATION,
  thumbnail: banner2Img,
  Component: Banner2,
};
