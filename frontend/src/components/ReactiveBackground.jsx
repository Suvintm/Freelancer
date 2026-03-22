import React from 'react';
import { motion } from 'framer-motion';

/**
 * Shared Reactive Background component
 * Idle   → blobs sit dim at bottom corners
 * Active → blobs swell up, saturate, fill screen
 * Exactly matches the ChatGPT voice UI color behavior
 */
const ReactiveBackground = ({ isActive }) => {
  // Blue blob — more movement to fill screen
  const blueIdle = {
    scale: 1.5,
    opacity: 0.55,
    y: '10%',
    x: '-5%',
  };
  const blueActive = {
    scale: 2.8,
    opacity: 0.95,
    y: '-45%',
    x: '-20%',
  };

  // Pink/magenta blob — more movement to fill screen
  const pinkIdle = {
    scale: 1.6,
    opacity: 0.60,
    y: '15%',
    x: '10%',
  };
  const pinkActive = {
    scale: 3.0,
    opacity: 0.90,
    y: '-50%',
    x: '20%',
  };

  const transition = {
    duration: 0.6, // High smooth speed "ramp" effect
    ease: [0.33, 1, 0.68, 1], // very snappy
  };

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        background: '#010101', // Pure black base for maximum pop
      }}
    >
      {/* ── Deep royal blue — bottom-left ────────────────── */}
      <motion.div
        animate={isActive ? blueActive : blueIdle}
        transition={transition}
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-20%',
          width: '85vw',
          height: '85vw',
          maxWidth: 800,
          maxHeight: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 60%, #1d4ed8 0%, #1e40af 35%, transparent 75%)',
          filter: 'blur(60px)',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Deep rose / magenta — bottom-right ───────────── */}
      <motion.div
        animate={isActive ? pinkActive : pinkIdle}
        transition={transition}
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-20%',
          width: '80vw',
          height: '80vw',
          maxWidth: 750,
          maxHeight: 750,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 60% 40%, #be185d 0%, #9d174d 40%, transparent 80%)',
          filter: 'blur(70px)',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Centre breathing glow ────────────────────────── */}
      <motion.div
        animate={{
          opacity: [0.15, 0.3, 0.15],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '20%',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, #1e3a8a 0%, transparent 70%)',
          filter: 'blur(100px)',
          opacity: 0.2,
        }}
      />

      {/* ── Top dark fade ────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '30%',
          background: 'linear-gradient(to bottom, rgba(1,1,1,0.5) 0%, transparent 100%)',
        }}
      />

      {/* ── Centre vignette ──────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(1,1,1,0.2) 100%)',
        }}
      />
    </div>
  );
};

export default ReactiveBackground;
