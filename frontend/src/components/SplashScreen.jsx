import React from 'react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

const SplashScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#09090b]"
    >
      {/* Dynamic Background Element */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0.15 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        className="absolute w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="relative flex flex-col items-center">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            duration: 1.2, 
            ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for premium feel
            delay: 0.2 
          }}
          className="mb-6 relative"
        >
          <img 
            src={logo} 
            alt="SuviX Logo" 
            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          />
        </motion.div>

        {/* Text Animation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col items-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-white mb-2">
            Suvi<span className="text-emerald-500">X</span>
          </h1>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 1.2, ease: "easeInOut" }}
            className="h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
          />
          <p className="mt-4 text-zinc-500 text-sm md:text-base font-medium tracking-[0.2em] uppercase">
            Video Editing Redefined
          </p>
        </motion.div>
      </div>

      {/* Loading Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-12 flex items-center gap-3"
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                delay: i * 0.2 
              }}
              className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
