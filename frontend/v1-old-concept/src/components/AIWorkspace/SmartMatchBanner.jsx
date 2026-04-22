import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaMagic } from 'react-icons/fa';

const SmartMatchBanner = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative col-span-full w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#020203] p-4 sm:p-5 shadow-sm dark:shadow-2xl mb-6 group/card"
    >
      {/* ── Mini Reactive Background (Only visible in dark mode for premium feel) ───────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-40 hidden dark:block">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, -10, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-10%',
            width: '60%',
            height: '100%',
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '50%',
            height: '100%',
            background: 'radial-gradient(circle, #db2777 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 space-y-2">
          <div className="space-y-1">
            <motion.h2 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
              className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white uppercase leading-tight"
            >
              Can't find the right editor?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
              className="max-w-xl text-[12px] leading-snug text-zinc-500 dark:text-zinc-400 font-medium"
            >
              Describe your project in natural language. Our AI assistant finds your perfect match in seconds by analyzing skills and style.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-600"
          >
            <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-blue-500" /> 850+ Editors</div>
            <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-pink-500" /> 3s Match</div>
            <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-700" /> AI Scores</div>
          </motion.div>
        </div>

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.4, duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
          onClick={() => navigate('/ai-workspace')}
          className="group relative w-full sm:w-auto flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-zinc-900 dark:bg-white px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white dark:text-black transition-all hover:opacity-90 border-none"
        >
          <span>Try AI Match</span>
          <FaArrowRight className="text-[10px] transition-transform group-hover:translate-x-1" />
          
          {/* Subtle button shine effect (Dark mode only) */}
          <div className="hidden dark:block">
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: 0, left: 0, width: '20%', height: '100%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                transform: 'skewX(-25deg)',
              }}
            />
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SmartMatchBanner;
