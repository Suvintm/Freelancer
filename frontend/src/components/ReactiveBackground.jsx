import React from 'react';
import { motion } from 'framer-motion';

/**
 * Shared Reactive Background component
 * - isActive (bool): For reactive behavior (Idle <-> Active)
 * - isAlwaysActive (bool): For continuous, non-stop animation (Chat Page)
 */
const ReactiveBackground = ({ isActive, isAlwaysActive }) => {
  // --- BASE STATES ---
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

  // --- CONTINUOUS FLOATING ANIMATIONS (For Chat Page) ---
  // Increased range and variety for "dancing" effect
  const blueFloating = {
    x: ['-20%', '-10%', '-30%', '-20%', '-15%', '-20%'],
    y: ['-45%', '-35%', '-55%', '-40%', '-50%', '-45%'],
    scale: [2.8, 3.2, 2.5, 3.0, 2.7, 2.8],
    opacity: [0.95, 0.8, 0.95, 0.85, 1, 0.95],
  };

  const pinkFloating = {
    x: ['20%', '35%', '10%', '25%', '15%', '20%'],
    y: ['-50%', '-40%', '-65%', '-45%', '-55%', '-50%'],
    scale: [3.0, 2.6, 3.4, 3.1, 2.8, 3.0],
    opacity: [0.90, 1, 0.8, 0.95, 0.85, 0.90],
  };

  // Reactive transition (snappy)
  const reactiveTransition = {
    duration: 0.6,
    ease: [0.33, 1, 0.68, 1],
  };

  // Continuous transition (Faster and more dynamic)
  const floatingTransition = {
    duration: 5, // Faster "ramp" loop
    repeat: Infinity,
    ease: "linear", // Linear with keyframes often feels more "dancing"
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
        background: '#010101',
      }}
    >
      {/* ── Deep royal blue ─────────────────────────────── */}
      <motion.div
        animate={isAlwaysActive ? blueFloating : (isActive ? blueActive : blueIdle)}
        transition={isAlwaysActive ? floatingTransition : reactiveTransition}
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

      {/* ── Deep rose / magenta ─────────────────────────── */}
      <motion.div
        animate={isAlwaysActive ? pinkFloating : (isActive ? pinkActive : pinkIdle)}
        transition={isAlwaysActive ? floatingTransition : reactiveTransition}
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

      {/* ── Top black overlay (Covering top 60%) ─────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '65%', // Covers more than half
          background: 'linear-gradient(to bottom, #010101 0%, #010101 40%, rgba(1,1,1,0.8) 70%, transparent 100%)',
          zIndex: 10, // Above the blobs
        }}
      />

      {/* ── Centre vignette ──────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(1,1,1,0.4) 100%)',
          zIndex: 11,
        }}
      />
    </div>
  );
};

export default ReactiveBackground;
