import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ExternalLink, 
  Link2, 
  CheckCircle, 
  Flame 
} from 'lucide-react';
import { FaYoutube, FaInstagram } from 'react-icons/fa6';

// ─────────────────────────────────────────────────────────────
// 1. DURATION DEFINITION (in milliseconds)
// ─────────────────────────────────────────────────────────────
export const BANNER_2_DURATION = 6000; // 6 Seconds

// ─────────────────────────────────────────────────────────────
// 2. BANNER COMPONENT: Link in Bio Studio
// ─────────────────────────────────────────────────────────────
export const Banner2: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const navigate = useNavigate();

  return (
    <div className={`relative w-full h-full inset-0 overflow-hidden select-none transition-colors duration-300 ${
      isDarkMode ? 'bg-[#000000]' : 'bg-white'
    }`}>
      {/* 1. High-Resolution Modern Studio Background Image */}
      <img
        src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=1600"
        alt="Link in Bio Studio"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* 2. Banner-Specific Custom Gradient Overlays */}
      {/* Top Subtle Scrim */}
      <div className="absolute inset-x-0 top-0 h-16 z-10 bg-gradient-to-b from-black/40 via-black/10 to-transparent pointer-events-none" />

      {/* Left-to-Right Reading Scrim */}
      <div 
        className={`absolute inset-0 z-10 pointer-events-none transition-colors duration-500 ${
          isDarkMode
            ? 'bg-gradient-to-r from-[#000000] via-[#000000]/90 via-42% to-transparent'
            : 'bg-gradient-to-r from-white via-white/95 via-42% to-transparent'
        }`}
      />

      {/* Bottom Full Solid Blend */}
      <div 
        className={`absolute inset-x-0 bottom-0 h-28 lg:h-36 z-10 pointer-events-none transition-colors duration-500 ${
          isDarkMode
            ? 'bg-gradient-to-t from-[#000000] via-[#000000]/80 via-50% to-transparent'
            : 'bg-gradient-to-t from-white via-white/80 via-50% to-transparent'
        }`} 
      />

      {/* 3. Main Content Layer */}
      <div className="relative z-20 h-full w-full px-3.5 sm:px-8 lg:px-10 py-2.5 sm:py-6 lg:py-8 flex items-center justify-between">
        {/* Left: Headline, Description & CTAs */}
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="max-w-[260px] xs:max-w-[320px] sm:max-w-md lg:max-w-lg flex flex-col items-start space-y-1 sm:space-y-2 lg:space-y-2.5"
        >
          {/* Eyebrow Status Badge */}
          <div className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-xs ${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-zinc-200' 
              : 'bg-zinc-900/10 border-zinc-900/20 text-zinc-900'
          }`}>
            <Sparkles size={9} className={`sm:hidden ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`} />
            <Sparkles size={11} className={`hidden sm:block ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`} />
            <span className="text-[7.5px] xs:text-[8.5px] sm:text-[9px] font-extrabold tracking-wider uppercase">
              LINK IN BIO STUDIO
            </span>
          </div>

          {/* Bold Headline */}
          <h1 className={`text-sm xs:text-base sm:text-2xl lg:text-3xl xl:text-[34px] font-black tracking-tight leading-[1.15] ${
            isDarkMode ? 'text-white' : 'text-zinc-950'
          }`}>
            One Link for Everything You Create
          </h1>

          {/* Feature Subtitle */}
          <p className={`hidden xs:block text-[9.5px] sm:text-xs font-medium leading-tight sm:leading-relaxed line-clamp-1 sm:line-clamp-2 max-w-[240px] sm:max-w-sm ${
            isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
          }`}>
            Build your creator bio page with live feeds, social handles & booking links.
          </p>

          {/* Action Pill Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 pt-0.5 sm:pt-1">
            <button
              type="button"
              onClick={() => navigate('/link-in-bio')}
              className={`h-6 xs:h-7 sm:h-8.5 px-2.5 xs:px-3 sm:px-4 rounded-full font-bold text-[9px] xs:text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-zinc-950 text-white hover:bg-zinc-900'
              }`}
            >
              <span>Build Bio</span>
              <ArrowRight size={11} className="sm:hidden" />
              <ArrowRight size={13} className="hidden sm:block" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/link-in-bio')}
              className={`h-6 xs:h-7 sm:h-8.5 px-2 xs:px-2.5 sm:px-3.5 rounded-full font-semibold text-[9px] xs:text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 backdrop-blur-md border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isDarkMode
                  ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
                  : 'border-zinc-300 bg-white/80 hover:bg-white text-zinc-900 shadow-xs'
              }`}
            >
              <Link2 size={11} className={`sm:hidden ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`} />
              <Link2 size={13} className={`hidden sm:block ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`} />
              <span>Explore</span>
            </button>
          </div>
        </motion.div>

        {/* Right: Floating Glassmorphism Bio Card Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="hidden md:flex flex-col items-end pr-2 lg:pr-6"
        >
          <div className={`w-[200px] lg:w-[220px] rounded-2xl p-3 backdrop-blur-xl border shadow-xl transition-all ${
            isDarkMode 
              ? 'bg-zinc-950/80 border-white/15 text-white shadow-black/60' 
              : 'bg-white/90 border-zinc-200 text-zinc-900 shadow-lg'
          }`}>
            {/* Mockup Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" 
                  alt="Creator" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[11px] truncate">Sarah Vance</span>
                  <CheckCircle size={10} className="text-blue-500 shrink-0" />
                </div>
                <span className="text-[9px] text-zinc-400">@sarahfilms • 120k</span>
              </div>
            </div>

            {/* Mockup Social Pill Badges */}
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <div className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[9px] font-semibold ${
                isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-zinc-100 border border-zinc-200'
              }`}>
                <FaYoutube className="text-red-500 text-[10px]" />
                <span className="truncate">YouTube 48k</span>
              </div>
              <div className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[9px] font-semibold ${
                isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-zinc-100 border border-zinc-200'
              }`}>
                <FaInstagram className="text-pink-500 text-[10px]" />
                <span className="truncate">Insta 72k</span>
              </div>
            </div>

            {/* Mockup Live Links */}
            <div className="space-y-1">
              <div className={`w-full py-1 px-2.5 rounded-lg flex items-center justify-between text-[9.5px] font-bold border ${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
              }`}>
                <span className="truncate">🎬 Latest Reel Showcase</span>
                <ExternalLink size={9} className="opacity-80" />
              </div>
              <div className={`w-full py-1 px-2.5 rounded-lg flex items-center justify-between text-[9.5px] font-medium border ${
                isDarkMode ? 'bg-white/5 text-zinc-300 border-white/10' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
              }`}>
                <span className="truncate">💼 Book Consultation</span>
                <Flame size={10} className="text-amber-500" />
              </div>
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
  title: 'Link in Bio Studio',
  badge: 'New Feature',
  duration: BANNER_2_DURATION,
  thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=600',
  Component: Banner2,
};
