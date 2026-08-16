import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';
import { HOME_BANNER_ITEMS } from './banners/HomeBanners';
import defaultProfile from '../../assets/defaultprofile.png';
import darkLogo from '../../assets/darklogo.png';
import lightLogo from '../../assets/lightlogo.png';

const AUTO_ROTATE_INTERVAL = 6000;

export const UnifiedBanner: React.FC<{ className?: string }> = ({ className }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const avatarUrl = user?.profilePicture || defaultProfile;

  const hasBanners = HOME_BANNER_ITEMS.length > 0;
  const currentBanner = hasBanners ? (HOME_BANNER_ITEMS[activeIdx] || HOME_BANNER_ITEMS[0]) : null;
  const CurrentSlideComponent = currentBanner?.Component;

  useEffect(() => {
    if (isPaused || HOME_BANNER_ITEMS.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % HOME_BANNER_ITEMS.length);
    }, AUTO_ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full aspect-[21/7.5] min-h-[240px] rounded-none overflow-hidden select-none border-none shadow-none transition-colors duration-300 ${
        isDarkMode ? 'bg-[#000000]' : 'bg-white'
      } ${className || ''}`}
    >
      {/* 1. Global Common In-Banner Top Navigation (Fixed on Parent Banner) */}
      <div className="absolute top-0 left-0 right-0 z-30 w-full px-5 lg:px-8 pt-3.5 pb-1 flex items-center justify-between pointer-events-auto">
        {/* Left: Brand Logo & Category Navigation */}
        <div className="flex items-center gap-3 lg:gap-5">
          <div 
            onClick={() => navigate('/home')} 
            className="cursor-pointer flex items-center"
          >
            <img 
              src={isDarkMode ? darkLogo : lightLogo} 
              alt="SuviX Logo" 
              className="h-5 sm:h-6 w-auto drop-shadow-md hover:opacity-95 transition-opacity" 
            />
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] font-semibold">
            <span className={isDarkMode ? "text-white/30" : "text-zinc-400"}>|</span>
            <button 
              onClick={() => navigate('/explore')} 
              className={`transition-colors cursor-pointer drop-shadow-sm hover:underline ${
                isDarkMode ? 'text-white/90 hover:text-white' : 'text-zinc-800 hover:text-black'
              }`}
            >
              Trending
            </button>
            <button 
              onClick={() => navigate('/reels')} 
              className={`transition-colors cursor-pointer drop-shadow-sm hover:underline ${
                isDarkMode ? 'text-white/80 hover:text-white' : 'text-zinc-700 hover:text-black'
              }`}
            >
              Reels
            </button>
            <button 
              onClick={() => navigate('/discover')} 
              className={`transition-colors cursor-pointer drop-shadow-sm hover:underline ${
                isDarkMode ? 'text-white/80 hover:text-white' : 'text-zinc-700 hover:text-black'
              }`}
            >
              Spotlight
            </button>
            <button 
              onClick={() => navigate('/nearby')} 
              className={`transition-colors cursor-pointer drop-shadow-sm hover:underline ${
                isDarkMode ? 'text-white/80 hover:text-white' : 'text-zinc-700 hover:text-black'
              }`}
            >
              Portfolios
            </button>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/explore')}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all border shadow-sm cursor-pointer ${
              isDarkMode
                ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-white/20'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200'
            }`}
          >
            <Sparkles size={11} className={isDarkMode ? "text-amber-300" : "text-amber-500"} />
            <span className="hidden sm:inline">Discover</span>
          </button>

          <button
            onClick={() => navigate('/explore')}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all border shadow-sm cursor-pointer ${
              isDarkMode
                ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-white/20'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200'
            }`}
            title="Search"
          >
            <Search size={12} />
          </button>

          <div 
            onClick={() => navigate('/profile')}
            className="w-6 h-6 rounded-full overflow-hidden border border-border-main/50 shadow-sm cursor-pointer hover:scale-105 transition-transform"
          >
            <img src={avatarUrl} alt="User Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* 2. Active Banner Slide Component (if any banners exist in HomeBanners.tsx) */}
      {hasBanners && CurrentSlideComponent && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            <CurrentSlideComponent isDarkMode={isDarkMode} />
          </motion.div>
        </AnimatePresence>
      )}

      {/* 3. Floating Over-the-Banner Available Banners Carousel (shown when 2+ banners exist) */}
      {HOME_BANNER_ITEMS.length > 1 && (
        <div className="absolute bottom-2.5 right-4 sm:right-6 lg:right-8 z-30 flex flex-col items-end pointer-events-auto max-w-[55%] sm:max-w-[48%] lg:max-w-[42%]">
          <div className="flex items-center justify-between w-full mb-1 px-0.5">
            <span className={`text-[8.5px] font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-zinc-300 drop-shadow-sm' : 'text-zinc-700'
            }`}>
              Available Banners
            </span>
            <span className={`text-[8px] font-medium ${
              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              {activeIdx + 1} / {HOME_BANNER_ITEMS.length}
            </span>
          </div>

          {/* Horizontal Row of Floating Cards */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 scrollbar-hide max-w-full">
            {HOME_BANNER_ITEMS.map((item, idx) => {
              const isSelected = idx === activeIdx;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`
                    relative flex-shrink-0 w-[72px] sm:w-[84px] lg:w-[94px] h-[42px] sm:h-[48px] lg:h-[52px] rounded-lg overflow-hidden cursor-pointer
                    transition-all duration-300 group/thumb
                    ${isSelected 
                      ? (isDarkMode ? 'ring-2 ring-white scale-105 shadow-lg' : 'ring-2 ring-black scale-105 shadow-lg')
                      : 'opacity-70 hover:opacity-100 hover:scale-102'}
                  `}
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Poster Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  {/* Top Brand Watermark */}
                  <div className="absolute top-0.5 left-1">
                    <span className="text-[6.5px] font-black text-rose-500 tracking-tighter uppercase">
                      SUVIX
                    </span>
                  </div>

                  {/* Bottom Title */}
                  <div className="absolute bottom-0.5 left-1 right-1">
                    <p className="text-[7.5px] sm:text-[8px] font-bold text-white leading-tight truncate">
                      {item.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};