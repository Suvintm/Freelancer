import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHistory } from 'react-icons/fa';
import { HiChatAlt2, HiCursorClick } from 'react-icons/hi';
import NaturalChatTab from './NaturalChatTab';
import GuidedQuestionsTab from './GuidedQuestionsTab';

// ─────────────────────────────────────────────────────────────────
// REACTIVE BACKGROUND
// Idle   → blobs sit dim at bottom corners, barely visible
// Active → blobs swell up, saturate, fill screen from bottom
// Exactly matches the ChatGPT voice UI color behaviour
// ─────────────────────────────────────────────────────────────────
const ReactiveBackground = ({ isActive }) => {
  // Blue blob — more movement to fill screen
  const blueIdle = {
    scale:   1.2,
    opacity: 0.45,
    y:       '10%',
    x:       '-5%',
  };
  const blueActive = {
    scale:   2.8,
    opacity: 0.95,
    y:       '-45%',
    x:       '-20%',
  };

  // Pink/magenta blob — more movement to fill screen
  const pinkIdle = {
    scale:   1.4,
    opacity: 0.50,
    y:       '15%',
    x:       '10%',
  };
  const pinkActive = {
    scale:   3.0,
    opacity: 0.90,
    y:       '-50%',
    x:       '20%',
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
        background: '#020203', // Slightly darker base to make colors pop
      }}
    >
      {/* ── Deep royal blue — bottom-left ────────────────── */}
      <motion.div
        animate={isActive ? blueActive : blueIdle}
        transition={transition}
        style={{
          position: 'absolute',
          bottom: '-10%',
          left:   '-20%',
          width:  '85vw',
          height: '85vw',
          maxWidth:  800,
          maxHeight: 800,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 40% 60%, #1d4ed8 0%, #1e40af 35%, transparent 75%)',
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
          right:  '-20%',
          width:  '80vw',
          height: '80vw',
          maxWidth:  750,
          maxHeight: 750,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 60% 40%, #be185d 0%, #9d174d 40%, transparent 80%)',
          filter: 'blur(70px)',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Centre breathing glow ────────────────────────── */}
      <motion.div
        animate={{
          opacity: [0.1, 0.25, 0.1],
          scale:   [1, 1.15, 1],
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
          opacity: 0.15,
        }}
      />

      {/* ── Top dark fade — Lightened significantly ─────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '30%',
          background:
            'linear-gradient(to bottom, rgba(2,2,3,0.4) 0%, transparent 100%)',
        }}
      />

      {/* ── Centre vignette — Lightened significantly ────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(2,2,3,0.15) 100%)',
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────
const AIWorkspacePage = () => {
  const navigate = useNavigate();
  const [activeTab,    setActiveTab]    = useState('natural_chat');
  const [showHistory,  setShowHistory]  = useState(false);
  // Lifted from NaturalChatTab — drives the background animation
  const [isTyping,     setIsTyping]     = useState(false);

  const handleTabSwitch = (tab) => {
    if (tab === activeTab) return;
    setIsTyping(false); // reset animation on tab switch
    setActiveTab(tab);
  };

  // NaturalChatTab calls this whenever isTyping changes
  const handleTypingChange = useCallback((val) => {
    setIsTyping(val);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: '#010101', // Purest black to let colors bloom
        color: '#fff',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── Reactive background (z=0) ────────────────────── */}
      <ReactiveBackground isActive={isTyping} />

      {/* ── Header (z=30) ────────────────────────────────── */}
      <header
        style={{
          position: 'relative',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 54,
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(5,5,8,0.25)', // Reduced from 0.5
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          flexShrink: 0,
        }}
      >
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <FaArrowLeft style={{ fontSize: 11 }} />
        </motion.button>

        <motion.span
          animate={{ opacity: isTyping ? 0.5 : 0.75 }}
          transition={{ duration: 0.8 }}
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.75)',
            userSelect: 'none',
          }}
        >
          {activeTab === 'natural_chat' ? 'AI Match Assistant' : 'Guided Match'}
        </motion.span>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowHistory(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <FaHistory style={{ fontSize: 9 }} />
          <span className="hidden sm:inline">Sessions</span>
        </motion.button>
      </header>

      {/* ── Tab switcher (z=30) ───────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 30,
          display: 'flex',
          justifyContent: 'center',
          padding: '10px 16px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 2,
            padding: 3,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {[
            { id: 'natural_chat', label: 'Natural Talk', Icon: HiChatAlt2 },
            { id: 'guided',       label: 'AI Queries',   Icon: HiCursorClick },
          ].map(({ id, label, Icon }) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleTabSwitch(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 18px',
                borderRadius: 9,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                border: 'none',
                background:
                  activeTab === id ? '#fff' : 'transparent',
                color:
                  activeTab === id ? '#000' : 'rgba(255,255,255,0.35)',
                boxShadow:
                  activeTab === id
                    ? '0 2px 12px rgba(255,255,255,0.12)'
                    : 'none',
              }}
            >
              <Icon style={{ fontSize: 13 }} />
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Main content (z=20) ──────────────────────────── */}
      <main
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          zIndex: 20,
        }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'natural_chat' ? (
            <motion.div
              key="natural"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              style={{ height: '100%' }}
            >
              {/* Pass onTypingChange so NaturalChatTab can drive the bg */}
              <NaturalChatTab onTypingChange={handleTypingChange} />
            </motion.div>
          ) : (
            <motion.div
              key="guided"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              style={{ height: '100%' }}
            >
              <GuidedQuestionsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AIWorkspacePage;