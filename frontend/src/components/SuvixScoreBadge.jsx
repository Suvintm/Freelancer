import React from 'react';
import { motion } from 'framer-motion';
import { FaCrown, FaStar, FaGem, FaCheck } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import { MdWorkspacePremium } from 'react-icons/md';

const TIER_CONFIG = {
  elite: { 
    label: 'Elite Pro', 
    color: '#FFD700', 
    Icon: FaCrown, 
    bg: 'from-amber-400 to-yellow-600',
    glow: 'shadow-yellow-500/50'
  },
  expert: { 
    label: 'Expert', 
    color: '#C0C0C0', 
    Icon: FaStar, 
    bg: 'from-slate-300 to-slate-500',
    glow: 'shadow-slate-400/50'
  },
  professional: { 
    label: 'Professional', 
    color: '#3498DB', 
    Icon: FaGem, 
    bg: 'from-blue-400 to-blue-600',
    glow: 'shadow-blue-500/50'
  },
  established: { 
    label: 'Established', 
    color: '#27AE60', 
    Icon: FaCheck, 
    bg: 'from-emerald-400 to-emerald-600',
    glow: 'shadow-emerald-500/50'
  },
  rising: { 
    label: 'Rising Star', 
    color: '#1ABC9C', 
    Icon: HiSparkles, 
    bg: 'from-cyan-400 to-teal-600',
    glow: 'shadow-cyan-400/50'
  },
  newcomer: { 
    label: 'Newcomer', 
    color: '#95A5A6', 
    Icon: MdWorkspacePremium, 
    bg: 'from-gray-400 to-gray-600',
    glow: 'shadow-gray-400/50'
  },
};

const SuvixScoreBadge = ({ 
  score = 0, 
  tier = 'newcomer', 
  isEligible = false,
  isSelfView = false,
  size = 'medium',
  showLabel = true,
  showScore = true,
  onClick = null,
}) => {
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.newcomer;
  
  const sizeMap = {
    small:  { width: 'w-12', height: 'h-12', font: 'text-[10px]', iconSize: 'text-[10px]', labelSize: 'text-[8px]', stroke: 2 },
    medium: { width: 'w-16', height: 'h-16', font: 'text-[14px]', iconSize: 'text-[14px]', labelSize: 'text-[10px]', stroke: 3 },
    large:  { width: 'w-24', height: 'h-24', font: 'text-[20px]', iconSize: 'text-[20px]', labelSize: 'text-[12px]', stroke: 4 },
  };
  
  const config = sizeMap[size] || sizeMap.medium;
  const radius = 45; // base radius from 100x100 coord system
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const dashOffset = circumference - progress;

  if (!isEligible && !isSelfView) {
    return (
      <div className="flex flex-col items-center gap-1.5 opacity-60">
        <div className={`${config.width} ${config.height} rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center`}>
           <span className={`${config.iconSize} grayscale opacity-50`}>🔒</span>
        </div>
        {showLabel && <span className={`${config.labelSize} font-black text-gray-500 uppercase tracking-widest`}>Locked</span>}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="flex flex-col items-center gap-2 group cursor-pointer"
      onClick={onClick}
    >
      <div className={`relative ${config.width} ${config.height} flex items-center justify-center`}>
        {/* Outer Glow */}
        <div className={`absolute inset-1 rounded-full bg-gradient-to-br ${tierConfig.bg} opacity-20 blur-md group-hover:opacity-40 transition-opacity`} />
        
        {/* Progress SVG */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 select-none pointer-events-none" viewBox="0 0 100 100">
           {/* Track */}
           <circle
             cx="50" cy="50" r={radius}
             fill="none"
             className="stroke-white/10"
             strokeWidth={config.stroke}
           />
           {/* Progress */}
           <motion.circle
             cx="50" cy="50" r={radius}
             fill="none"
             stroke="currentColor"
             strokeWidth={config.stroke}
             strokeDasharray={circumference}
             initial={{ strokeDashoffset: circumference }}
             animate={{ strokeDashoffset: dashOffset }}
             transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
             strokeLinecap="round"
             className={`${tierConfig.color === '#FFD700' ? 'text-amber-400' : `text-[${tierConfig.color}]`}`}
             style={{ color: tierConfig.color, filter: 'drop-shadow(0 0 5px currentColor)' }}
           />
        </svg>

        {/* Central Content */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {showScore ? (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className={`${config.font} font-black text-white drop-shadow-lg tracking-tighter`}
            >
              {score}
            </motion.span>
          ) : (
            <tierConfig.Icon className={`${config.iconSize} text-white drop-shadow-md`} />
          )}
          {/* Suvix Label (Mini) */}
          <span className="text-[6px] font-black text-white/50 uppercase tracking-tighter -mt-1">SuviX</span>
        </div>
      </div>

      {showLabel && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-col items-center gap-0.5`}
        >
          <span className={`${config.labelSize} font-black uppercase tracking-[0.2em]`} style={{ color: tierConfig.color }}>
            {tierConfig.label}
          </span>
          {/* Tier specific decorative element */}
          <div className={`w-4 h-[2px] rounded-full bg-gradient-to-r ${tierConfig.bg} opacity-60`} />
        </motion.div>
      )}
    </motion.div>
  );
};

export default SuvixScoreBadge;
