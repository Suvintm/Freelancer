import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TIER_COLOR = {
  elite:        { text: '#fff', bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.15)' },
  expert:       { text: 'rgba(255,255,255,0.8)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' },
  professional: { text: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
  established:  { text: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
  rising:       { text: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
  newcomer:     { text: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.05)' },
};

const AVAIL_STYLE = {
  available:  { dot: '#fff', label: 'Available', text: 'rgba(255,255,255,0.7)' },
  small_only: { dot: '#888', label: 'Limited',   text: 'rgba(255,255,255,0.5)' },
  busy:       { dot: '#444', label: 'Busy',      text: 'rgba(255,255,255,0.3)' },
};

// ── Score arc ring (Mono) ─────────────────────────────────────
const ScoreRing = ({ score, size = 48 }) => {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const fill = (score / 100) * c;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - fill }} transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>match</span>
      </div>
    </div>
  );
};

// ── Compact card (chat mode) ───────────────────────────────────
const CompactCard = ({ editor, matchScore, onContact }) => {
  const avail = AVAIL_STYLE[editor.availability?.status] || AVAIL_STYLE.available;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      style={{
        width: 190, flexShrink: 0, borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.03)', overflow: 'hidden', cursor: 'pointer', backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ height: 60, background: 'rgba(255,255,255,0.02)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Portfolio Preview</span>
        <div style={{ position: 'absolute', top: 6, right: 6, padding: '2px 6px', borderRadius: 6, background: '#fff', fontSize: 9, fontWeight: 700, color: '#000' }}>
          {matchScore}%
        </div>
      </div>
      <div style={{ padding: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#000', flexShrink: 0 }}>
            {editor.name?.charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{editor.name}</p>
            <span style={{ fontSize: 9, color: avail.text }}>{avail.label}</span>
          </div>
        </div>
        <button
          onClick={onContact}
          style={{ width: '100%', padding: '7px 0', borderRadius: 6, border: 'none', background: '#fff', fontSize: 10, fontWeight: 600, color: '#000', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          View Profile
        </button>
      </div>
    </motion.div>
  );
};

// ── Full card (results mode) ──────────────────────────────────
const FullCard = ({ editor, matchScore, reason, animationDelay, onContact }) => {
  const [expanded, setExpanded] = useState(false);
  const tier = editor.suvixScore?.tier || 'newcomer';
  const tc = TIER_COLOR[tier] || TIER_COLOR.newcomer;
  const avail = AVAIL_STYLE[editor.availability?.status] || AVAIL_STYLE.available;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: animationDelay || 0 }}
      style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.025)', overflow: 'hidden', backdropFilter: 'blur(10px)' }}
    >
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000', flexShrink: 0 }}>
            {editor.name?.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{editor.name}</span>
              <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: tc.bg, border: `1px solid ${tc.border}`, color: tc.text, textTransform: 'uppercase' }}>{tier}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: avail.text }}>{avail.label}</span>
              {editor.rating > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>★ {editor.rating} ({editor.reviewCount})</span>}
            </div>
          </div>
          <ScoreRing score={matchScore} size={46} />
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ width: '100%', textAlign: 'left', padding: '8px 0', border: 'none', background: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}
        >
          {expanded ? 'Hide Analysis ↑' : 'Show Match Analysis ↓'}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, padding: '8px 0 12px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>{reason}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
        <button onClick={onContact} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#fff', fontSize: 12, fontWeight: 600, color: '#000', cursor: 'pointer' }}>View Details</button>
        <button style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Share</button>
      </div>
    </motion.div>
  );
};

const EditorMatchCard = ({ editor, matchScore = 80, reason = '', compact = false, animationDelay = 0 }) => {
  const navigate = useNavigate();
  const handleContact = () => navigate(`/public-profile/${editor._id}`);
  
  if (compact) return <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, delay: animationDelay }}><CompactCard editor={editor} matchScore={matchScore} onContact={handleContact} /></motion.div>;
  return <FullCard editor={editor} matchScore={matchScore} reason={reason} animationDelay={animationDelay} onContact={handleContact} />;
};

export default EditorMatchCard;