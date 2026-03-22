import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane } from 'react-icons/fa';
import EditorMatchCard from './EditorMatchCard';

// ─────────────────────────────────────────────────────────────────
// TYPING INDICATOR — three bouncing dots
// ─────────────────────────────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display: 'flex', gap: 4, padding: '12px 14px', alignItems: 'center' }}>
    {[0, 1, 2].map(i => (
      <motion.span
        key={i}
        animate={{ y: [0, -5, 0] }}
        transition={{
          duration: 0.55,
          repeat: Infinity,
          delay: i * 0.13,
          ease: 'easeInOut',
        }}
        style={{
          display: 'block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.45)',
        }}
      />
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// SUVIX AVATAR
// ─────────────────────────────────────────────────────────────────
const SuviXAvatar = () => (
  <div
    style={{
      width: 28,
      height: 28,
      borderRadius: 9,
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      fontSize: 10,
      fontWeight: 800,
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: '-0.02em',
    }}
  >
    S
  </div>
);

// ─────────────────────────────────────────────────────────────────
// MESSAGE BUBBLE
// ─────────────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      {/* Avatar */}
      {!isUser && <SuviXAvatar />}
      {isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.35)',
            flexShrink: 0,
          }}
        >
          U
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 'min(80%, 500px)',
        }}
      >
        {/* Text bubble */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: isUser
              ? '16px 16px 3px 16px'
              : '3px 16px 16px 16px',
            fontSize: 14,
            lineHeight: 1.6,
            fontWeight: 400,
            letterSpacing: '-0.01em',
            // User: slightly blue-tinted; Assistant: pure white/5
            background: isUser
              ? 'rgba(29,78,216,0.25)'
              : 'rgba(255,255,255,0.07)',
            border: `1px solid ${
              isUser
                ? 'rgba(59,130,246,0.2)'
                : 'rgba(255,255,255,0.08)'
            }`,
            color: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          {msg.content}
        </div>

        {/* Editor match cards (horizontal scroll) */}
        {msg.editors && msg.editors.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              paddingBottom: 6,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {msg.editors.map((editor, idx) => (
              <EditorMatchCard
                key={editor._id}
                editor={editor}
                matchScore={editor.matchScore}
                reason={editor.reason}
                compact={true}
                animationDelay={idx * 0.07}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────
// SUGGESTION CHIPS — styled exactly like the video (ChatGPT style)
// Dark charcoal rounded pills, white text, subtle border
// ─────────────────────────────────────────────────────────────────
const SuggestionChip = ({ label, onClick }) => (
  <motion.button
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    style={{
      // Charcoal pill — exactly like the video
      padding: '10px 18px',
      borderRadius: 99,
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.09)',
      fontSize: 13,
      fontWeight: 450,
      color: 'rgba(255,255,255,0.85)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      letterSpacing: '-0.01em',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      lineHeight: 1,
      transition: 'background 0.15s ease, border-color 0.15s ease',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background    = 'rgba(255,255,255,0.14)';
      e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.2)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background    = 'rgba(255,255,255,0.09)';
      e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.12)';
    }}
  >
    {label}
  </motion.button>
);

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// Props:
//   onTypingChange(bool) — called when isTyping changes
//                          so AIWorkspacePage can drive the bg
// ─────────────────────────────────────────────────────────────────
const NaturalChatTab = ({ onTypingChange }) => {
  const [messages,  setMessages]  = useState([
    {
      id: 1,
      role: 'assistant',
      content:
        "Hi — I'm your SuviX editor finder. Tell me about your project: type of video, the style you want, budget, and deadline. I'll find the right editor.",
      timestamp: new Date(),
    },
  ]);
  const [input,     setInput]     = useState('');
  const [isTyping,  setIsTyping]  = useState(false);
  const [charCount, setCharCount] = useState(0);

  const scrollRef   = useRef(null);
  const textareaRef = useRef(null);

  // Sync isTyping upward to AIWorkspacePage → drives background animation
  useEffect(() => {
    onTypingChange?.(isTyping);
  }, [isTyping, onTypingChange]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 130) + 'px';
  }, []);

  const handleInput = (e) => {
    const val = e.target.value.slice(0, 500);
    setInput(val);
    setCharCount(val.length);
    autoResize();
  };

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setCharCount(0);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // ── isTyping = true → triggers background swell animation ──
    setIsTyping(true);

    // ── TODO: replace with real API call ───────────────────────
    // axios.post(`/api/ai-workspace/sessions/${sessionId}/chat`, { message: text })
    //   .then(res => {
    //     setMessages(prev => [...prev, res.data.message]);
    //     setIsTyping(false);  // ← background calms back down
    //   })
    //   .catch(() => setIsTyping(false));
    // ──────────────────────────────────────────────────────────

    // Static simulation — 2.2s delay
    setTimeout(() => {
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content:
          'Based on what you described, I found editors who match your project well. Here are the top recommendations:',
        timestamp: new Date(),
        editors: [
          {
            _id: 'e1',
            name: 'Arjun Mehta',
            rating: 4.9,
            reviewCount: 124,
            skills: ['Cinematic', 'Color Grading', 'DaVinci Resolve'],
            suvixScore: { total: 94, tier: 'elite' },
            availability: { status: 'available' },
            matchScore: 96,
            reason:
              'Arjun specialises in cinematic edits and has delivered 40+ projects in this exact style.',
          },
          {
            _id: 'e2',
            name: 'Riya Sharma',
            rating: 4.8,
            reviewCount: 89,
            skills: ['Storytelling', 'Premiere Pro', 'Wedding Films'],
            suvixScore: { total: 87, tier: 'expert' },
            availability: { status: 'available' },
            matchScore: 91,
            reason:
              "Riya's narrative storytelling perfectly matches your emotional brief.",
          },
          {
            _id: 'e3',
            name: 'Dev Nair',
            rating: 4.7,
            reviewCount: 56,
            skills: ['Color Grading', 'Motion Graphics'],
            suvixScore: { total: 78, tier: 'professional' },
            availability: { status: 'small_only' },
            matchScore: 84,
            reason:
              'Dev delivers fast with strong color work — ideal if your deadline is tight.',
          },
        ],
      };

      setMessages(prev => [...prev, assistantMsg]);
      // ── isTyping = false → background calms back down ──────
      setIsTyping(false);
    }, 2200);
  }, [input, isTyping]);

  // Suggestion texts — same vibe as the video
  const suggestions = [
    'I need a wedding film editor',
    'YouTube video editor, weekly uploads',
    'Cinematic reel editor, tight deadline',
    'Podcast editor with subtitles',
  ];

  const showSuggestions = messages.length === 1 && !isTyping;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Messages area ──────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 16px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.05) transparent',
          background: 'transparent', // Ensure it's transparent
        }}
      >
        <div
          style={{
            maxWidth: 660,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* ── Welcome hero (first load only) ─────────────── */}
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: 'center', padding: '28px 0 4px' }}
            >
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}
              >
                What are you looking for?
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.4)',
                  lineHeight: 1.5,
                  marginBottom: 0,
                }}
              >
                Tap a suggestion or type to find your editor.
              </p>
            </motion.div>
          )}

          {/* ── Message list ─────────────────────────────────── */}
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}
              >
                <SuviXAvatar />
                <div
                  style={{
                    borderRadius: '3px 16px 16px 16px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={scrollRef} />
        </div>
      </div>

      {/* ── Input / suggestions area ───────────────────────── */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(5,5,8,0.15)', // Extremely light overlay
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '12px 16px 18px',
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: 660, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* ── Suggestion chips — ChatGPT style ─────────────── */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  paddingBottom: 4,
                }}
              >
                {suggestions.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <SuggestionChip label={s} onClick={() => setInput(s)} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Textarea row ────────────────────────────────── */}
          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Describe your project or ask anything..."
              rows={1}
              style={{
                width: '100%',
                resize: 'none',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)',
                padding: '13px 52px 13px 16px',
                fontSize: 14,
                lineHeight: 1.5,
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
                minHeight: 50,
                maxHeight: 130,
                fontFamily: 'inherit',
                letterSpacing: '-0.01em',
                transition: 'border-color 0.18s ease, background 0.18s ease',
                backdropFilter: 'blur(8px)',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.22)';
                e.target.style.background  = 'rgba(255,255,255,0.08)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.background  = 'rgba(255,255,255,0.06)';
              }}
            />

            {/* Send button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              style={{
                position: 'absolute',
                right: 10,
                bottom: 10,
                width: 32,
                height: 32,
                borderRadius: 9,
                border: 'none',
                background:
                  input.trim() && !isTyping
                    ? '#fff'
                    : 'rgba(255,255,255,0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
              }}
            >
              <FaPaperPlane
                style={{
                  fontSize: 11,
                  marginLeft: 1,
                  color: input.trim() && !isTyping
                    ? '#000'
                    : 'rgba(255,255,255,0.2)',
                }}
              />
            </motion.button>
          </div>

          {/* Hint + char count */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.18)',
                letterSpacing: '0.02em',
              }}
            >
              Claude-powered · Enter to send
            </span>
            {charCount > 400 && (
              <span
                style={{
                  fontSize: 10,
                  color:
                    charCount > 480
                      ? 'rgba(239,68,68,0.8)'
                      : 'rgba(255,255,255,0.28)',
                }}
              >
                {charCount}/500
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NaturalChatTab;