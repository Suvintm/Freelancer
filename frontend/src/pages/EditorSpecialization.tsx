import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Check,
  Search,
  Sparkles,
  ArrowRight,
  Loader2,
  Film,
  Layers,
  Video,
  Globe,
  Clock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useDispatch, useSelector } from 'react-redux';
import { setTempSignupData } from '../store/slices/onboardingSlice';
import type { RootState } from '../store';
import { selectUser } from '../store/slices/authSlice';
import logo from '../assets/whitebglogo.png';

// ── SPECIALIZATIONS & SOFTWARE CATALOG ──────────────────────────────────────────
const CONTENT_SPECIALIZATIONS = [
  { id: 'yt_longform', name: 'YouTube Long-form', desc: 'Story pacing, retaining retention & B-roll', icon: '🎬' },
  { id: 'reels_shorts', name: 'Reels, TikTok & Shorts', desc: 'Fast hooks, dynamic captions & pacing', icon: '⚡' },
  { id: 'gaming_montage', name: 'Gaming & Stream Highlights', desc: 'Sync beats, sound FX & zoom zooms', icon: '🎮' },
  { id: 'documentary', name: 'Documentary & Storytelling', desc: 'Archival research, mood & narrative flow', icon: '📜' },
  { id: 'motion_vfx', name: 'Motion Graphics & VFX', desc: 'Kinetic typography, 3D tracking & intros', icon: '✨' },
  { id: 'cinematic_grading', name: 'Cinematic & Color Grading', desc: 'LUTs, HDR correction & tone mapping', icon: '🎨' },
  { id: 'podcast_interview', name: 'Podcasts & Multicam', desc: 'Auto-cut, speaker tracking & audio cleanup', icon: '🎙️' },
  { id: 'sound_design', name: 'Sound Design & Audio Mixing', desc: 'Foley, soundscapes & vocal leveling', icon: '🎧' },
  { id: 'commercials', name: 'Commercials & High-Ad Creative', desc: 'Product showcase, high-conversion cuts', icon: '📈' },
  { id: 'music_video', name: 'Music Videos & Creative Cuts', desc: 'Rhythmic speed ramps, stylization', icon: '🎵' },
];

const SOFTWARE_TOOLS = [
  { id: 'premiere', name: 'Adobe Premiere Pro', badge: 'Industry Standard' },
  { id: 'after_effects', name: 'Adobe After Effects', badge: 'VFX / Motion' },
  { id: 'davinci', name: 'DaVinci Resolve / Studio', badge: 'Color & Audio' },
  { id: 'final_cut', name: 'Final Cut Pro', badge: 'macOS High-Speed' },
  { id: 'capcut', name: 'CapCut Desktop / Pro', badge: 'Short-form Meta' },
  { id: 'blender', name: 'Blender 3D', badge: '3D VFX' },
  { id: 'photoshop', name: 'Adobe Photoshop', badge: 'Thumbnails & Assets' },
  { id: 'audition', name: 'Adobe Audition', badge: 'Audio Mastering' },
];

const EXPERIENCE_TIERS = [
  { value: 1, label: '< 1 Year', desc: 'Junior / Rising Talent' },
  { value: 2, label: '1 - 3 Years', desc: 'Intermediate Editor' },
  { value: 4, label: '3 - 5 Years', desc: 'Senior / Pro' },
  { value: 6, label: '5+ Years', desc: 'Master / Creative Lead' },
];

const STATIC_PARTICLES = [
  { id: 1, x: '10%', y: '20%', duration: 18, scale: 0.8, opacity: 0.4 },
  { id: 2, x: '85%', y: '15%', duration: 22, scale: 1.2, opacity: 0.6 },
  { id: 3, x: '25%', y: '75%', duration: 15, scale: 0.6, opacity: 0.3 },
  { id: 4, x: '70%', y: '60%', duration: 25, scale: 1.0, opacity: 0.5 },
  { id: 5, x: '50%', y: '40%', duration: 20, scale: 0.9, opacity: 0.4 },
];

export default function EditorSpecialization() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tempSignupData = useSelector((state: RootState) => state.onboarding.tempSignupData);
  const user = useSelector(selectUser);

  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(
    tempSignupData?.specializations || []
  );
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>(
    tempSignupData?.softwareUsed || []
  );
  const [experienceYears, setExperienceYears] = useState<number>(
    tempSignupData?.experienceYears ?? 2
  );
  const [portfolioUrl, setPortfolioUrl] = useState<string>(
    tempSignupData?.portfolioUrl || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔐 PRODUCTION GUARD: Requires editor role selection
  useEffect(() => {
    const isAuthed = !!user?.id;
    if (isAuthed && user.isOnboarded) {
      navigate('/home', { replace: true });
      return;
    }

    const categoryId = tempSignupData?.categoryId;
    const categorySlug = tempSignupData?.categorySlug;
    const isEditor = categorySlug === 'editor' || categorySlug === 'video_editor';

    if (!categoryId && !isEditor) {
      navigate('/role-selection', { replace: true });
    }
  }, [tempSignupData, user, navigate]);

  const toggleSpec = (name: string) => {
    setSelectedSpecs(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const toggleSoftware = (name: string) => {
    setSelectedSoftware(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const filteredSpecs = useMemo(() => {
    if (!searchQuery.trim()) return CONTENT_SPECIALIZATIONS;
    const q = searchQuery.toLowerCase();
    return CONTENT_SPECIALIZATIONS.filter(
      s => s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleContinue = () => {
    if (selectedSpecs.length === 0) return;
    setIsSubmitting(true);

    let normalizedPortfolio = portfolioUrl.trim();
    if (normalizedPortfolio && !/^https?:\/\//i.test(normalizedPortfolio)) {
      normalizedPortfolio = `https://${normalizedPortfolio}`;
    }

    dispatch(
      setTempSignupData({
        specializations: selectedSpecs,
        softwareUsed: selectedSoftware,
        skills: selectedSoftware, // Also populate skills for search indexing
        roleSubCategoryIds: selectedSpecs, // Backwards compatibility with legacy consumers
        portfolioUrl: normalizedPortfolio,
        experienceYears,
        onboardingStep: 'specialization',
      })
    );

    setTimeout(() => {
      setIsSubmitting(false);
      const isSocial = tempSignupData?.isSocialSignup;
      if (isSocial) {
        navigate('/complete-profile');
      } else {
        navigate('/signup');
      }
    }, 400);
  };

  const totalSelections = selectedSpecs.length + selectedSoftware.length;

  return (
    <div className="h-screen w-full bg-black flex flex-col relative overflow-hidden selection:bg-purple-500 selection:text-white">
      {/* ── BACKGROUND ACCENTS ────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[70vh] bg-gradient-to-b from-purple-600/[0.12] to-transparent blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        {STATIC_PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, opacity: p.opacity, scale: p.scale }}
            animate={{ y: [null, '-25%', '25%', '-10%'], x: [null, '12%', '-12%', '6%'], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: 'linear' }}
            className="absolute w-1 h-1 bg-purple-500 rounded-full blur-[1px]"
          />
        ))}
        <motion.div animate={{ scale: [1, 1.15, 1], x: ['-4%', '4%', '-4%'], rotate: [0, 45, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} className="absolute -top-[10%] -left-[10%] w-[90%] h-[60%] bg-zinc-900/15 rounded-full blur-[140px]" />
        <motion.div animate={{ scale: [1.15, 1, 1.15], x: ['4%', '-4%', '4%'], rotate: [0, -45, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} className="absolute -top-[5%] -right-[10%] w-[90%] h-[60%] bg-purple-900/[0.08] rounded-full blur-[140px]" />
      </div>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-[100] p-4 md:p-6 lg:p-8 flex items-center justify-between pointer-events-none">
        {/* Logo */}
        <div className="pointer-events-auto">
          <img src={logo} alt="SuviX" className="h-6 md:h-7 lg:h-9" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 pointer-events-none">
          {[
            { label: 'Role', done: true },
            { label: 'Specialization', done: false, active: true },
            { label: 'Details', done: false },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all ${
                s.done   ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                s.active ? 'bg-white/10 border-white/20 text-white' :
                           'bg-zinc-900/60 border-zinc-800 text-zinc-600'
              }`}>
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black ${
                  s.done   ? 'bg-green-500 text-black' :
                  s.active ? 'bg-white text-black' :
                             'bg-zinc-800 text-zinc-600'
                }`}>
                  {s.done ? <Check size={7} strokeWidth={3} /> : i + 1}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </div>
              {i < arr.length - 1 && <div className={`w-4 h-px ${s.done ? 'bg-green-500/30' : 'bg-zinc-800'}`} />}
            </div>
          ))}
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/role-selection')}
          className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-zinc-800 flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-auto group active:scale-95 transition-transform"
        >
          <ChevronLeft size={15} className="text-zinc-400 group-hover:text-white" />
        </button>
      </div>

      {/* ── SCROLLABLE CONTENT ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto z-10 pt-20 md:pt-24 pb-28 px-4 md:px-8 max-w-5xl mx-auto w-full scrollbar-none">
        {/* Title Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={13} />
            Editor Profile Customization
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            What are your editing specializations?
          </h1>
          <p className="text-zinc-400 text-sm md:text-base mt-2 max-w-xl mx-auto">
            Choose what you edit and the tools you use. Creators looking for editors will discover your profile through these tags.
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto mt-6 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search editing niches (e.g. Shorts, VFX, Gaming)..."
              className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-purple-500/50 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all backdrop-blur-sm"
            />
          </div>
        </motion.div>

        {/* ── SECTION 1: CONTENT SPECIALIZATIONS ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4 mb-10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                1. Content Types & Niches ({selectedSpecs.length} selected)
              </h2>
            </div>
            <span className="text-xs text-zinc-500">Select all that apply</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {filteredSpecs.map((spec) => {
                const isSelected = selectedSpecs.includes(spec.name);
                return (
                  <motion.div
                    key={spec.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => toggleSpec(spec.name)}
                    className={`cursor-pointer group relative p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-500/10'
                        : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-2xl select-none">{spec.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                            {spec.name}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {spec.desc}
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-purple-500 border-purple-400 text-white'
                          : 'border-zinc-700 bg-zinc-800/50 text-transparent'
                      }`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── SECTION 2: SOFTWARE & TOOLS ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                2. Software & Editing Tools ({selectedSoftware.length} selected)
              </h2>
            </div>
            <span className="text-xs text-zinc-500">Pick your primary tools</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {SOFTWARE_TOOLS.map((tool) => {
              const isSelected = selectedSoftware.includes(tool.name);
              return (
                <div
                  key={tool.id}
                  onClick={() => toggleSoftware(tool.name)}
                  className={`cursor-pointer group relative p-3 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/70 shadow-md shadow-purple-500/10'
                      : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                        {tool.name}
                      </p>
                      <span className="text-[10px] text-zinc-500 block truncate mt-0.5">
                        {tool.badge}
                      </span>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ${
                      isSelected
                        ? 'bg-purple-500 border-purple-400 text-white'
                        : 'border-zinc-700 bg-zinc-800/50 text-transparent'
                    }`}>
                      <Check size={10} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── SECTION 3: EXPERIENCE & SHOWREEL ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-5 md:p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-6"
        >
          {/* Experience level */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                3. Video Editing Experience
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {EXPERIENCE_TIERS.map((tier) => {
                const isSelected = experienceYears === tier.value;
                return (
                  <div
                    key={tier.value}
                    onClick={() => setExperienceYears(tier.value)}
                    className={`cursor-pointer p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500/70 shadow-sm shadow-purple-500/20'
                        : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <p className="text-xs font-black text-white">{tier.label}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{tier.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Showreel / Portfolio link */}
          <div className="space-y-2 pt-3 border-t border-zinc-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Portfolio / Showreel Link (Optional)
                </h3>
              </div>
              <span className="text-[11px] text-zinc-500">YouTube, Behance, Drive, or Site</span>
            </div>
            <div className="relative">
              <Globe className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or behance.net/..."
                className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-purple-500/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── STICKY BOTTOM BAR ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-black/80 backdrop-blur-lg border-t border-zinc-800/80 p-4 md:py-4 md:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
              {totalSelections}
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {selectedSpecs.length > 0
                  ? `${selectedSpecs.length} specializations selected`
                  : 'Please select at least 1 specialization'}
              </p>
              <p className="text-[10px] text-zinc-500 hidden sm:block">
                {selectedSoftware.length > 0 ? `+ ${selectedSoftware.length} editing tools` : 'Select your primary software for best matches'}
              </p>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            disabled={selectedSpecs.length === 0 || isSubmitting}
            className={`!h-11 !px-6 !text-xs !font-black !uppercase !tracking-wider flex items-center gap-2 rounded-xl transition-all ${
              selectedSpecs.length > 0
                ? '!bg-white hover:!bg-zinc-200 !text-black shadow-lg shadow-white/10'
                : '!bg-zinc-800 !text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={15} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
