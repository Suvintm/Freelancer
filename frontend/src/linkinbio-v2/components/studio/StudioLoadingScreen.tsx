import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import officialLogo from '../../../assets/officiallogo.png';

interface StudioLoadingScreenProps {
  message?: string;
  submessage?: string;
}

export const StudioLoadingScreen: React.FC<StudioLoadingScreenProps> = ({
  message = 'Loading Bio Studio...',
  submessage = 'Fetching your customized blocks, theme, and real-time assets...',
}) => {
  return (
    <div className="w-full h-screen bg-[#0d0d11] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans select-none z-50">
      
      {/* Background Ambient Glow */}
      <div className="absolute w-96 h-96 bg-[#4D6234]/20 rounded-full blur-3xl pointer-events-none -top-20 -left-20" />
      <div className="absolute w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20" />

      {/* Main Center Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative flex flex-col items-center text-center p-8 max-w-sm mx-auto"
      >
        {/* Animated Brand Emblem */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl flex items-center justify-center relative z-10">
            <img 
              src={officialLogo} 
              alt="SuviX" 
              className="w-10 h-10 object-contain brightness-0 invert animate-pulse" 
            />
          </div>

          {/* Spinner Halo */}
          <div className="absolute -inset-2 rounded-[28px] border-2 border-emerald-500/40 border-t-emerald-400 animate-spin" />

          {/* Sparkle badge */}
          <div className="absolute -top-1.5 -right-1.5 p-1.5 rounded-full bg-amber-400 text-black shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-extrabold tracking-tight text-white mb-1.5">
          {message}
        </h2>

        {/* Subtitle */}
        <p className="text-xs text-zinc-400 max-w-xs leading-relaxed mb-6">
          {submessage}
        </p>

        {/* Progress Bar Animation */}
        <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="w-1/2 h-full bg-gradient-to-r from-emerald-500 via-sky-400 to-emerald-500 rounded-full"
          />
        </div>

        <div className="flex items-center gap-1.5 mt-4 text-[10px] text-zinc-500 font-mono">
          <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
          <span>Syncing with SuviX Cloud...</span>
        </div>
      </motion.div>

    </div>
  );
};

export default StudioLoadingScreen;
