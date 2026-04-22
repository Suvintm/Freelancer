import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHistory } from 'react-icons/fa';
import { HiChatAlt2, HiCursorClick } from 'react-icons/hi';
import ReactiveBackground from '../ReactiveBackground';
import NaturalChatTab from './NaturalChatTab';
import GuidedQuestionsTab from './GuidedQuestionsTab';

// ─────────────────────────────────────────────────────────────────
// REACTIVE BACKGROUND
// Idle   → blobs sit dim at bottom corners, barely visible
// Active → blobs swell up, saturate, fill screen from bottom
// Exactly matches the ChatGPT voice UI color behaviour
// ─────────────────────────────────────────────────────────────────

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
          onClick={() => {
            localStorage.removeItem('suvix_ai_session_id');
            window.location.reload(); // Simple way to reset state across tabs
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <FaHistory style={{ fontSize: 10 }} />
          <span>New Chat</span>
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