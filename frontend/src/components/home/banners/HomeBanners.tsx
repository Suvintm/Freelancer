import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ExternalLink, Link2, CheckCircle, Flame } from 'lucide-react';
import { FaYoutube, FaInstagram } from 'react-icons/fa6';

export interface BannerItem {
  id: string;
  title: string;
  badge: string;
  thumbnail: string;
  Component: React.FC<{ isDarkMode: boolean }>;
}

// ─────────────────────────────────────────────────────────────
// 1. BANNER 1: Link in Bio Studio
// ─────────────────────────────────────────────────────────────
export const BannerLinkInBio: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-full inset-0 overflow-hidden select-none">
      {/* 1. High-Resolution Modern Studio Background Image */}
      <img
        src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=1600"
        alt="Link in Bio Studio"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* 2. Banner-Specific Custom Gradient Overlays */}
      {/* Top Subtle Scrim for Navigation */}
      <div className="absolute inset-x-0 top-0 h-20 z-10 bg-gradient-to-b from-black/45 via-black/10 to-transparent pointer-events-none" />

      {/* Left-to-Right High-Contrast Reading Scrim */}
      <div 
        className={`absolute inset-0 z-10 pointer-events-none transition-colors duration-500 ${
          isDarkMode
            ? 'bg-gradient-to-r from-[#000000] via-[#000000]/90 via-42% to-transparent'
            : 'bg-gradient-to-r from-white via-white/95 via-42% to-transparent'
        }`}
      />

      {/* Bottom Full Solid Blend - Seamlessly merges 100% into the canvas below with zero hard edge */}
      <div 
        className={`absolute inset-x-0 bottom-0 h-32 lg:h-40 z-10 pointer-events-none transition-colors duration-500 ${
          isDarkMode
            ? 'bg-gradient-to-t from-[#000000] via-[#000000]/85 via-50% to-transparent'
            : 'bg-gradient-to-t from-white via-white/85 via-50% to-transparent'
        }`} 
      />

      {/* 3. Main Content Layer (Elevated slightly above) */}
      <div className="relative z-20 h-full w-full px-5 lg:px-8 pt-7 sm:pt-8 lg:pt-9 -mt-1 pb-3 flex items-center justify-between">
        {/* Left: Headline, Description & CTAs in Clean Black & Neutral Theme */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="max-w-[320px] sm:max-w-md lg:max-w-lg flex flex-col items-start space-y-1.5 sm:space-y-2"
        >
          {/* Eyebrow Status Badge (Clean Neutral Black / White Style) */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-sm ${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-zinc-200' 
              : 'bg-zinc-900/10 border-zinc-900/20 text-zinc-900'
          }`}>
            <Sparkles size={11} className={isDarkMode ? 'text-zinc-300' : 'text-zinc-800'} />
            <span className="text-[9px] font-extrabold tracking-wider uppercase">
              LINK IN BIO STUDIO
            </span>
          </div>

          {/* Bold Solid Black / White Headline */}
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-[1.1] ${
            isDarkMode ? 'text-white' : 'text-zinc-950'
          }`}>
            One Link for Everything You Create
          </h1>

          {/* Feature Subtitle */}
          <p className={`text-[11px] sm:text-xs font-medium leading-relaxed line-clamp-2 max-w-xs sm:max-w-sm ${
            isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
          }`}>
            Build your bespoke creator bio page with live YouTube feeds, portfolios, social handles & booking links in 60s.
          </p>

          {/* Action Pill Buttons (High Contrast Monochrome) */}
          <div className="flex items-center gap-2 pt-1">
            {/* Primary Action Button */}
            <button
              onClick={() => navigate('/link-in-bio')}
              className={`h-8 px-4.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-zinc-950 text-white hover:bg-zinc-900'
              }`}
            >
              <span>Build Your Bio</span>
              <ArrowRight size={13} />
            </button>

            {/* Secondary Action Button */}
            <button
              onClick={() => navigate('/link-in-bio')}
              className={`h-8 px-3.5 rounded-full font-semibold text-xs flex items-center gap-1.5 backdrop-blur-md border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isDarkMode
                  ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
                  : 'border-zinc-300 bg-white/80 hover:bg-white text-zinc-900 shadow-sm'
              }`}
            >
              <Link2 size={13} className={isDarkMode ? "text-zinc-300" : "text-zinc-700"} />
              <span>Explore Studio</span>
            </button>
          </div>
        </motion.div>

        {/* Right: Floating Clean Glassmorphism Bio Card Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="hidden md:flex flex-col items-end pr-2 lg:pr-6"
        >
          <div className={`w-[210px] lg:w-[230px] rounded-2xl p-3 backdrop-blur-xl border shadow-xl transition-all ${
            isDarkMode 
              ? 'bg-zinc-950/80 border-white/15 text-white shadow-black/60' 
              : 'bg-white/90 border-zinc-200 text-zinc-900 shadow-lg'
          }`}>
            {/* Mockup Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-border-main">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" 
                  alt="Creator" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[11px] truncate">Sarah Vance</span>
                  <CheckCircle size={10} className="text-blue-500 flex-shrink-0" />
                </div>
                <span className="text-[9px] text-text-muted">@sarahfilms • 120k</span>
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
                  : 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
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
// Master Banner Items Registry
// ─────────────────────────────────────────────────────────────
export const HOME_BANNER_ITEMS: BannerItem[] = [
  {
    id: 'banner-link-in-bio',
    title: 'Link in Bio Studio',
    badge: 'New Feature',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=600',
    Component: BannerLinkInBio,
  },
];
