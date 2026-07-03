import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Video, GraduationCap, Star, MessageSquare } from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
  image_url?: string;
  order_index: number;
  _count?: {
    responses: number;
  };
}

interface PollLayoutProps {
  options: PollOption[];
  localCounts: Record<string, number>;
  totalVotes: number;
  hasVoted: boolean;
  selectedOption: number | null;
  onVote: (optId: string, index: number) => void;
  isDarkMode: boolean;
  showResults: boolean;
}

// Map index to specific icons and vibrant gradients to match the screenshots
const ICON_MAP = [Video, GraduationCap, Star, MessageSquare];
const GRADIENT_MAP = [
  'bg-gradient-to-t from-[#c026d3] to-[#fb7185]', // Pink/Purple
  'bg-gradient-to-t from-[#4f46e5] to-[#818cf8]', // Indigo/Blue
  'bg-gradient-to-t from-[#d97706] to-[#fcd34d]', // Gold/Yellow
  'bg-gradient-to-t from-[#ea580c] to-[#fdba74]', // Orange
  'bg-gradient-to-t from-[#059669] to-[#34d399]', // Green
];
const COLOR_HEX_MAP = ['#ec4899', '#6366f1', '#f59e0b', '#f97316', '#10b981']; // Corresponding hex values for SVG strokes

const NeonBorderColor = '#d9f99d'; // The lime green from Image 2 active state

// ---------------------------------------------------------
// 1. BAR_CHART (Image 1 style)
// ---------------------------------------------------------
export const BarChartLayout: React.FC<PollLayoutProps> = ({ options, localCounts, totalVotes, hasVoted, selectedOption, onVote, isDarkMode, showResults }) => {
  return (
    <div className="flex items-end gap-3 h-56 mt-4 px-2">
      {options.map((opt, idx) => {
        const count = (opt._count?.responses || 0) + (localCounts[opt.id] || 0);
        const heightPct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
        const Icon = ICON_MAP[idx % ICON_MAP.length];
        const GradientClass = GRADIENT_MAP[idx % GRADIENT_MAP.length];
        const isSelected = selectedOption === idx;
        
        return (
          <button
            key={idx}
            onClick={() => onVote(opt.id, idx)}
            disabled={hasVoted}
            className={`relative flex-1 flex flex-col items-center justify-end h-full group outline-none`}
          >
            {/* Percentage Label */}
            {showResults && (
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-[12px] font-black mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
              >
                {Math.round(heightPct)}%
              </motion.span>
            )}

            {/* The Bar */}
            <motion.div
              initial={{ height: '0%' }}
              animate={{ height: showResults ? `${Math.max(heightPct, 15)}%` : '15%' }}
              className={`w-full max-w-[60px] rounded-[20px] transition-all duration-700 ease-out flex flex-col justify-end pb-3 items-center shadow-lg ${showResults ? GradientClass : (isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200')} ${isSelected && showResults ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-black' : ''}`}
            >
              <Icon size={18} className="text-white drop-shadow-md" />
            </motion.div>
          </button>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------
// 2. DONUT_CHART (Image 3 style)
// ---------------------------------------------------------
export const DonutChartLayout: React.FC<PollLayoutProps> = ({ options, localCounts, totalVotes, hasVoted, selectedOption, onVote, isDarkMode, showResults }) => {

  
  return (
    <div className="flex flex-col items-center gap-6 mt-4">
      {/* Large Glowing Donut */}
      <div className="relative w-64 h-64 shrink-0">
        {/* Background Track */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-2xl">
          <circle cx="50" cy="50" r="40" fill="none" stroke={isDarkMode ? '#18181b' : '#f4f4f5'} strokeWidth="18" />
        </svg>

        {/* Foreground Animated Track */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90 z-10">
          {options.map((opt, idx) => {
            const count = (opt._count?.responses || 0) + (localCounts[opt.id] || 0);
            const pct = totalVotes > 0 ? (count / totalVotes) : (1 / options.length); // Equal segments if no votes
            const circumference = 2 * Math.PI * 40; // ~251.2
            
            // We subtract a small gap from the stroke to create segment spacing
            const strokeDasharray = `${Math.max((pct * circumference) - 2, 0)} ${circumference}`; 
            
            // Calculate offset based on sum of previous percentages
            const prevCounts = options.slice(0, idx).reduce((sum, o) => sum + ((o._count?.responses || 0) + (localCounts[o.id] || 0)), 0);
            const prevPct = totalVotes > 0 ? (prevCounts / totalVotes) : (idx / options.length);
            const offset = -(prevPct * circumference);
            
            return (
              <motion.circle
                key={idx}
                cx="50" cy="50" r="40"
                fill="none"
                stroke={COLOR_HEX_MAP[idx % COLOR_HEX_MAP.length]}
                strokeWidth="18"
                strokeDasharray="0 251.2"
                animate={{ strokeDasharray: showResults ? strokeDasharray : `${(circumference/options.length) - 2} ${circumference}` }}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out drop-shadow-xl"
              />
            );
          })}
        </svg>

        {/* Icons inside the donut track - calculated using polar coordinates */}
        {showResults && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            {(() => {
              let iconOffset = 0;
              return options.map((opt, idx) => {
                const count = (opt._count?.responses || 0) + (localCounts[opt.id] || 0);
                const pct = totalVotes > 0 ? (count / totalVotes) : (1 / options.length);
                
                // Angle in the middle of the segment
                const segmentMiddlePct = iconOffset + (pct / 2);
                iconOffset += pct;
                
                // Convert percentage to angle (in radians). -90 deg offset because SVG starts from right but we rotated -90
                const angle = (segmentMiddlePct * 360) - 90;
                const radians = angle * (Math.PI / 180);
                
                // Radius matches the circle radius in viewBox scale, mapped to container size
                // 40% of container size
                const radius = 51.2; // roughly 40% of 128px (half of 256px)
                const x = Math.cos(radians) * radius;
                const y = Math.sin(radians) * radius;

                const Icon = ICON_MAP[idx % ICON_MAP.length];
                
                if (pct < 0.05) return null; // Don't show icon if segment is too small

                return (
                  <motion.div
                    key={`icon-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute top-1/2 left-1/2 w-6 h-6 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                    style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                  >
                    <Icon size={14} className="text-white drop-shadow-lg" />
                  </motion.div>
                );
              });
            })()}
          </div>
        )}

        {/* Center Text */}
        <div className={`absolute inset-0 flex items-center justify-center flex-col z-30`}>
          <span className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {totalVotes > 0 ? totalVotes.toLocaleString() : '0'}
          </span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Votes</span>
        </div>
      </div>
      
      {/* Option Buttons below chart */}
      <div className="w-full flex flex-wrap justify-center gap-2">
        {options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const count = (opt._count?.responses || 0) + (localCounts[opt.id] || 0);
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          return (
            <button
              key={idx}
              onClick={() => onVote(opt.id, idx)}
              disabled={hasVoted}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all ${isSelected ? (isDarkMode ? 'border-white bg-white/10' : 'border-zinc-900 bg-zinc-100') : (isDarkMode ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50' : 'border-zinc-200 hover:border-zinc-300 bg-white')}`}
            >
              <div className="w-3 h-3 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: COLOR_HEX_MAP[idx % COLOR_HEX_MAP.length] }} />
              <span className={`text-[13px] font-bold truncate max-w-[120px] ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{opt.text}</span>
              {showResults && (
                <span className={`text-[13px] font-black shrink-0 ml-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{pct}%</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// 3. GRID_CARDS (Image 2 style)
// ---------------------------------------------------------
export const GridCardsLayout: React.FC<PollLayoutProps> = ({ options, localCounts, totalVotes, hasVoted, selectedOption, onVote, isDarkMode, showResults }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
      {options.map((opt, idx) => {
        const count = (opt._count?.responses || 0) + (localCounts[opt.id] || 0);
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isSelected = selectedOption === idx;
        const Icon = ICON_MAP[idx % ICON_MAP.length];
        
        return (
          <button
            key={idx}
            onClick={() => onVote(opt.id, idx)}
            disabled={hasVoted}
            className={`relative flex flex-col items-center text-center p-4 rounded-[20px] border-2 transition-all duration-300 outline-none
              ${isSelected 
                ? (isDarkMode ? 'bg-[#181a14]' : 'bg-[#f4fec8]') 
                : (isDarkMode ? 'bg-zinc-900/60 hover:bg-zinc-800/80' : 'bg-zinc-50 hover:bg-zinc-100')}
            `}
            style={{
              borderColor: isSelected ? NeonBorderColor : (isDarkMode ? '#27272a' : '#e4e4e7'),
              boxShadow: isSelected && isDarkMode ? `0 0 20px -5px ${NeonBorderColor}50` : 'none'
            }}
          >
            {/* Glow Bar at Bottom for Active State */}
            {isSelected && (
              <motion.div layoutId="active-glow" className="absolute -bottom-2 left-4 right-4 h-1 rounded-full bg-[#d9f99d] shadow-[0_0_10px_#d9f99d]" />
            )}

            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-colors ${isSelected ? (isDarkMode ? 'text-[#d9f99d] bg-[#d9f99d]/10' : 'text-[#65a30d] bg-[#d9f99d]/30') : (isDarkMode ? 'text-zinc-400 bg-zinc-800' : 'text-zinc-500 bg-zinc-200')}`}>
              <Icon size={18} />
            </div>
            
            <div className="flex-1 w-full flex flex-col justify-center">
              {showResults && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-[22px] font-black leading-tight mb-2 ${isSelected ? (isDarkMode ? 'text-[#d9f99d]' : 'text-[#65a30d]') : (isDarkMode ? 'text-white' : 'text-zinc-900')}`}
                >
                  {pct}%
                </motion.div>
              )}
              <span className={`text-[13px] font-bold line-clamp-2 leading-snug ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {opt.text}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------
// 4. IMAGE_CAROUSEL (Thumbnail Poll)
// ---------------------------------------------------------
export const ImageCarouselLayout: React.FC<PollLayoutProps> = ({ options, localCounts, totalVotes, hasVoted, selectedOption, onVote, isDarkMode, showResults }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Autoscroll every 4s
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % options.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [options.length]);

  return (
    <div className="mt-4 space-y-4">
      {/* Carousel Viewport */}
      <div className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-black flex items-center justify-center border-2 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'} group shadow-xl`}>
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={options[currentIndex].image_url || 'https://via.placeholder.com/600'}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full object-cover"
            alt={options[currentIndex].text}
          />
        </AnimatePresence>
        
        {/* Navigation Arrows */}
        <button 
          onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev - 1 + options.length) % options.length); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev + 1) % options.length); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight size={20} />
        </button>
        
        {/* Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md">
          {options.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} />
          ))}
        </div>
      </div>

      {/* Voting Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {options.map((opt, idx) => {
          const count = (opt._count?.responses || 0) + (localCounts[opt.id] || 0);
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = selectedOption === idx;
          const isActiveImg = currentIndex === idx;
          
          return (
            <button
              key={idx}
              onClick={() => { onVote(opt.id, idx); setCurrentIndex(idx); }}
              disabled={hasVoted}
              className={`p-3 rounded-2xl border-2 flex flex-col items-start gap-2 transition-all duration-300 outline-none
                ${isSelected 
                  ? (isDarkMode ? 'border-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'border-zinc-900 bg-zinc-900 text-white') 
                  : (isActiveImg 
                      ? (isDarkMode ? 'border-zinc-500 bg-zinc-800' : 'border-zinc-400 bg-zinc-100') 
                      : (isDarkMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-200 bg-zinc-50'))}
              `}
            >
              <div className="w-full flex items-center justify-between">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm ${isSelected ? (isDarkMode ? 'bg-white text-black' : 'bg-white text-black') : (isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-zinc-500 border border-zinc-200')}`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                {showResults && (
                  <span className={`text-[15px] font-black ${isSelected ? (isDarkMode ? 'text-white' : 'text-white') : (isDarkMode ? 'text-zinc-300' : 'text-zinc-800')}`}>
                    {pct}%
                  </span>
                )}
              </div>
              <span className={`text-[12px] font-bold line-clamp-1 w-full text-left ${isSelected ? (isDarkMode ? 'text-zinc-200' : 'text-zinc-300') : (isDarkMode ? 'text-zinc-400' : 'text-zinc-500')}`}>
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
