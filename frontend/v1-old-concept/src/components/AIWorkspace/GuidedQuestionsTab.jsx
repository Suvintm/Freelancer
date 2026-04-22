import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowRight, HiArrowLeft, HiCheck } from 'react-icons/hi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAppContext } from '../../context/AppContext';
import EditorMatchCard from './EditorMatchCard';

// ── Data ─────────────────────────────────────────────────────
const PROJECT_TYPES = [
  { id: 'wedding', label: 'Wedding', emoji: '💍' },
  { id: 'youtube', label: 'YouTube', emoji: '🎬' },
  { id: 'reels', label: 'Reels', emoji: '📱' },
  { id: 'podcast', label: 'Podcast', emoji: '🎙️' },
  { id: 'vfx', label: 'VFX', emoji: '✨' },
  { id: 'cinematic', label: 'Cinematic', emoji: '🎞️' },
  { id: 'ads', label: 'Ads', emoji: '📢' },
  { id: 'corporate', label: 'Corporate', emoji: '🏢' },
  { id: 'music_video', label: 'Music Video', emoji: '🎵' },
];

const SOFTWARES = [
  'Premiere Pro', 'DaVinci Resolve', 'After Effects', 'Final Cut Pro', 'CapCut', 'No preference',
];

const VIBES = [
  { id: 'cinematic', label: 'Cinematic', sub: 'Epic storytelling', emoji: '🎬' },
  { id: 'dynamic', label: 'Fast-paced', sub: 'High energy', emoji: '⚡' },
  { id: 'emotional', label: 'Emotional', sub: 'Warm feel', emoji: '💕' },
  { id: 'documentary', label: 'Documentary', sub: 'Authentic', emoji: '📽️' },
  { id: 'corporate', label: 'Corporate', sub: 'Polished', emoji: '🎯' },
  { id: 'music_driven', label: 'Beat-synced', sub: 'Music focus', emoji: '🎵' },
];

const BUDGETS = [
  { label: 'Under ₹3,000', val: '<3k' },
  { label: '₹3,000 – ₹8,000', val: '3-8k' },
  { label: '₹8,000 – ₹20,000', val: '8-20k' },
  { label: 'Premium ₹20,000+', val: '20k+' },
];

const DEADLINES = [
  { label: 'Urgent — 1 to 2 days', val: 'urgent' },
  { label: 'This week', val: 'week' },
  { label: 'Next 2 weeks', val: 'fortnight' },
  { label: 'Flexible', val: 'flex' },
];

const STEPS = [
  { title: 'What are you creating?', sub: 'Pick the project type' },
  { title: 'Software preference?', sub: 'Optional selection' },
  { title: "What's the vibe?", sub: 'Pick up to 3' },
  { title: "Project budget?", sub: 'In Rupees (₹)' },
  { title: 'Delivery deadline?', sub: 'Sets priority' },
];

// ── Shared primitives (Monochrome) ───────────────────────────
const SelectableChip = ({ active, onClick, children }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    style={{
      padding: '8px 16px',
      borderRadius: 8,
      border: `1px solid ${active ? '#fff' : 'rgba(255,255,255,0.08)'}`,
      background: active ? '#fff' : 'rgba(255,255,255,0.03)',
      fontSize: 11,
      fontWeight: 500,
      color: active ? '#000' : 'rgba(255,255,255,0.4)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: 5,
    }}
  >
    {active && <HiCheck style={{ fontSize: 11, color: '#000' }} />}
    {children}
  </motion.button>
);

const SelectableCard = ({ active, onClick, emoji, label, sub }) => (
  <motion.button
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    style={{
      padding: '12px 10px',
      borderRadius: 10,
      border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
      background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'left',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      backdropFilter: 'blur(4px)',
    }}
  >
    <span style={{ fontSize: 20 }}>{emoji}</span>
    <span style={{ fontSize: 12, fontWeight: 500, color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}>
      {label}
    </span>
    {sub && (
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.01em' }}>
        {sub}
      </span>
    )}
  </motion.button>
);

// ── Processing (Mono) ───────────────────────────────────────
const ProcessingState = () => {
  const [labelIdx, setLabelIdx] = useState(0);
  const labels = ['Analyzing project...', 'Matching editors...', 'Ranking results...'];

  React.useEffect(() => {
    const t = setInterval(() => setLabelIdx(i => (i + 1) % labels.length), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #fff' }}
      />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{labels[labelIdx]}</p>
      </div>
    </div>
  );
};

// ── Results View ─────────────────────────────────────────────
const ResultsView = ({ onReset, editors = [] }) => {

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px 16px 32px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
            Match results
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 500, color: '#fff', marginTop: 8 }}>Suggested Editors</h2>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {editors.map((editor, i) => (
            <EditorMatchCard key={editor._id} editor={editor} matchScore={editor.matchScore || (95 - i * 4)} reason={editor.reason || "Direct skill match"} compact={false} animationDelay={i * 0.1} />
          ))}
          {editors.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
              No perfect matches found. Try adjusting your vibe or software preferences.
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={onReset} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            ← Start a new search
          </button>
        </div>
      </div>
    </div>
  );
};

const GuidedQuestionsTab = () => {
  const { user, backendURL } = useAppContext();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ projectType: '', softwares: [], vibe: [], budget: '', deadline: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);

  const toggle = (key, val, limit = 99) => {
    setAnswers(prev => {
      const arr = prev[key];
      if (arr.includes(val)) return { ...prev, [key]: arr.filter(v => v !== val) };
      if (arr.length >= limit) return prev;
      return { ...prev, [key]: [...arr, val] };
    });
  };

  const handleNext = async () => {
    if (step < 4) { setStep(s => s + 1); return; }
    
    setIsSubmitting(true);
    try {
      let currentSessionId = localStorage.getItem('suvix_ai_session_id');
      
      // 1. Create session if none exists
      if (!currentSessionId) {
        const { data: sData } = await axios.post(`${backendURL}/api/ai-workspace/sessions`, 
          { sessionType: 'guided' },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        currentSessionId = sData.sessionId;
        localStorage.setItem('suvix_ai_session_id', currentSessionId);
      }

      // 2. Submit matching request
      const { data } = await axios.post(`${backendURL}/api/ai-workspace/sessions/${currentSessionId}/match`,
        answers,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setResults(data.editors || []);
      setShowResults(true);
    } catch (err) {
      console.error("Guided Match failed:", err);
      toast.error("Matching engine is currently offline. Please try again later.");
      localStorage.removeItem('suvix_ai_session_id');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {PROJECT_TYPES.map(pt => (
              <SelectableCard key={pt.id} active={answers.projectType === pt.id} onClick={() => setAnswers(a => ({ ...a, projectType: pt.id }))} emoji={pt.emoji} label={pt.label} />
            ))}
          </div>
        );
      case 1:
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SOFTWARES.map(sw => (
              <SelectableChip key={sw} active={answers.softwares.includes(sw)} onClick={() => toggle('softwares', sw)}>{sw}</SelectableChip>
            ))}
          </div>
        );
      case 2:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {VIBES.map(v => (
              <SelectableCard key={v.id} active={answers.vibe.includes(v.id)} onClick={() => toggle('vibe', v.id, 3)} emoji={v.emoji} label={v.label} sub={v.sub} />
            ))}
          </div>
        );
      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: 360, margin: '0 auto', width: '100%' }}>
            {BUDGETS.map(b => (
              <button key={b.val} onClick={() => setAnswers(a => ({ ...a, budget: b.val }))} style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${answers.budget === b.val ? '#fff' : 'rgba(255,255,255,0.06)'}`, background: answers.budget === b.val ? '#fff' : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 500, color: answers.budget === b.val ? '#000' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                {b.label}
                {answers.budget === b.val && <HiCheck style={{ fontSize: 14 }} />}
              </button>
            ))}
          </div>
        );
      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: 360, margin: '0 auto', width: '100%' }}>
            {DEADLINES.map(d => (
              <button key={d.val} onClick={() => setAnswers(a => ({ ...a, deadline: d.val }))} style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${answers.deadline === d.val ? '#fff' : 'rgba(255,255,255,0.06)'}`, background: answers.deadline === d.val ? '#fff' : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 500, color: answers.deadline === d.val ? '#000' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                {d.label}
                {answers.deadline === d.val && <HiCheck style={{ fontSize: 14 }} />}
              </button>
            ))}
          </div>
        );
      default: return null;
    }
  };

  if (isSubmitting) return <ProcessingState />;
  if (showResults) return <ResultsView editors={results} onReset={() => { setShowResults(false); setStep(0); setAnswers({ projectType: '', softwares: [], vibe: [], budget: '', deadline: '' }); }} />;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '16px 16px' }}>
      <div style={{ maxWidth: 540, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', fontWeight: 500 }}>Step {step + 1} of 5</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{Math.round(((step + 1) / 5) * 100)}%</span>
          </div>
          <div style={{ height: 2, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div initial={{ width: `${(step / 5) * 100}%` }} animate={{ width: `${((step + 1) / 5) * 100}%` }} transition={{ duration: 0.4 }} style={{ height: '100%', background: '#fff' }} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 500, color: '#fff', marginBottom: 3 }}>{STEPS[step].title}</h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{STEPS[step].sub}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.3 }} style={{ flex: 1 }}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingBottom: 16 }}>
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', fontSize: 11, fontWeight: 500, color: step === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            Back
          </button>
          <button onClick={handleNext} disabled={step === 0 && !answers.projectType} style={{ padding: '10px 22px', borderRadius: 9, border: 'none', background: (step === 0 && !answers.projectType) ? 'rgba(255,255,255,0.05)' : '#fff', fontSize: 12, fontWeight: 600, color: (step === 0 && !answers.projectType) ? 'rgba(255,255,255,0.2)' : '#000', cursor: 'pointer' }}>
            {step === 4 ? 'Match Now' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuidedQuestionsTab;