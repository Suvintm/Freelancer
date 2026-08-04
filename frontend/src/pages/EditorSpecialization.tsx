import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Check,
  Search,
  ArrowRight,
  Loader2,
  Film,
  Layers,
  Video,
  Globe,
  Clock,
  ShieldCheck,
  Award,
  Zap,
  PlaySquare,
  Sparkles,
  Palette,
  Mic,
  Headphones,
  TrendingUp,
  Music,
  Gamepad2,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useDispatch, useSelector } from 'react-redux';
import { setTempSignupData } from '../store/slices/onboardingSlice';
import type { RootState } from '../store';
import { selectUser } from '../store/slices/authSlice';
import logo from '../assets/lightlogo.png';
import editorBadge from '../assets/verifiedBadges/editor_badge.png';

// ── SPECIALIZATIONS CATALOG WITH MODERN LUCIDE ICONS ─────────────────────────
interface SpecializationOption {
  id: string;
  name: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

const CONTENT_SPECIALIZATIONS: SpecializationOption[] = [
  { id: 'yt_longform', name: 'YouTube Long-form', desc: 'Story pacing, high retention & B-roll cuts', icon: PlaySquare },
  { id: 'reels_shorts', name: 'Reels, TikTok & Shorts', desc: 'Fast hooks, kinetic captions & viral pacing', icon: Zap },
  { id: 'gaming_montage', name: 'Gaming & Stream Highlights', desc: 'Beat sync, sound FX & dynamic zooms', icon: Gamepad2 },
  { id: 'documentary', name: 'Documentary & Storytelling', desc: 'Archival research, cinematic mood & narrative', icon: BookOpen },
  { id: 'motion_vfx', name: 'Motion Graphics & VFX', desc: 'Kinetic typography, 3D tracking & intros', icon: Sparkles },
  { id: 'cinematic_grading', name: 'Color Grading & Look Dev', desc: 'LUTs, HDR correction & film tone mapping', icon: Palette },
  { id: 'podcast_interview', name: 'Podcasts & Multicam', desc: 'Auto-cut, speaker tracking & audio cleanup', icon: Mic },
  { id: 'sound_design', name: 'Sound Design & Audio Mix', desc: 'Foley, soundscapes & vocal leveling', icon: Headphones },
  { id: 'commercials', name: 'Commercials & High-Ad Creative', desc: 'Product showcase & high-conversion cuts', icon: TrendingUp },
  { id: 'music_video', name: 'Music Videos & Creative Cuts', desc: 'Rhythmic speed ramps & creative stylization', icon: Music },
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

export default function EditorSpecialization() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tempSignupData = useSelector((state: RootState) => state.onboarding.tempSignupData);
  const user = useSelector(selectUser);

  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(
    tempSignupData?.specializations || ['YouTube Long-form']
  );
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>(
    tempSignupData?.softwareUsed || ['Adobe Premiere Pro']
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
      try {
        const rawBackup = sessionStorage.getItem('suvix_temp_signup_data');
        if (rawBackup) {
          const parsed = JSON.parse(rawBackup);
          if (parsed?.categoryId || parsed?.categorySlug === 'editor' || parsed?.categorySlug === 'video_editor') {
            dispatch(setTempSignupData(parsed));
            return;
          }
        }
      } catch {
        // ignore
      }
      navigate('/role-selection', { replace: true });
    }
  }, [tempSignupData, user, navigate, dispatch]);

  const toggleSpec = (name: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const toggleSoftware = (name: string) => {
    setSelectedSoftware((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const filteredSpecs = useMemo(() => {
    if (!searchQuery.trim()) return CONTENT_SPECIALIZATIONS;
    const q = searchQuery.toLowerCase();
    return CONTENT_SPECIALIZATIONS.filter(
      (s) => s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleContinue = () => {
    if (selectedSpecs.length === 0) return;
    setIsSubmitting(true);

    let normalizedPortfolio = portfolioUrl.trim();
    if (normalizedPortfolio && !/^https?:\/\//i.test(normalizedPortfolio)) {
      normalizedPortfolio = `https://${normalizedPortfolio}`;
    }

    const updateData = {
      specializations: selectedSpecs,
      softwareUsed: selectedSoftware,
      skills: selectedSoftware, // Also populate skills for creator search indexing
      roleSubCategoryIds: selectedSpecs, // Backwards compatibility
      portfolioUrl: normalizedPortfolio,
      experienceYears,
      onboardingStep: 'specialization' as const,
    };

    dispatch(setTempSignupData(updateData));

    try {
      const raw = sessionStorage.getItem('suvix_temp_signup_data');
      const cur = raw ? JSON.parse(raw) : {};
      sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify({ ...cur, ...updateData }));
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsSubmitting(false);
      const isSocial = tempSignupData?.isSocialSignup;
      if (isSocial) {
        navigate('/complete-profile');
      } else {
        navigate('/signup');
      }
    }, 350);
  };

  const expTierObj = useMemo(
    () => EXPERIENCE_TIERS.find((t) => t.value === experienceYears) || EXPERIENCE_TIERS[1],
    [experienceYears]
  );

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] text-zinc-900 flex flex-col relative selection:bg-zinc-900 selection:text-white">
      {/* ── SUBTLE ENTERPRISE GRID PATTERN ─────────────────────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(228, 228, 231, 0.6) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(228, 228, 231, 0.6) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ── TOP HEADER / NAVIGATION BAR ────────────────────────────────────── */}
      <header className="relative z-50 w-full px-4 py-3.5 sm:px-8 sm:py-4.5 md:px-12 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="SuviX"
            className="h-7 sm:h-8 md:h-8.5 w-auto object-contain cursor-pointer"
            onClick={() => navigate('/')}
          />
        </div>

        {/* Step Indicator & Back Button */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 shadow-2xs text-xs font-medium text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
            <span>Step 2 of 3 • Editor Profile</span>
          </div>

          <button
            onClick={() => navigate('/role-selection')}
            className="h-9 px-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 hover:text-zinc-950 text-xs font-medium transition-all flex items-center gap-1.5 group active:scale-95 cursor-pointer shadow-2xs"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-zinc-500" />
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT: 2-COLUMN DESKTOP SPLIT ───────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 pt-2 sm:pt-4 pb-36 relative z-10">
        
        {/* Mobile Header */}
        <div className="lg:hidden mb-5 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-semibold uppercase tracking-wider mb-2">
            Editor &amp; Talent Setup
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
            Your Editing Specializations
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-md mx-auto">
            Choose what you edit and the tools you use to match with creators looking for dedicated editors.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* ╔════════════════════════════════════════════════════════════════╗
              ║  LEFT COLUMN: Live Editor Talent Card & Matchmaking Hub (lg:5) ║
              ╚════════════════════════════════════════════════════════════════╝ */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-24">
            
            {/* Desktop Section Header */}
            <div className="hidden lg:block">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-2.5">
                Editor &amp; Talent Setup
              </span>
              <h1 className="text-3xl font-bold text-zinc-950 tracking-tight leading-tight">
                Your Editing Specializations
              </h1>
              <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
                Choose what you edit and the tools you use. Top YouTube creators looking for editors discover and hire talent through these verified tags.
              </p>
            </div>

            {/* ── LIVE INTERACTIVE EDITOR TALENT PREVIEW CARD ──────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-5 shadow-xs">
              {/* Card Header with Editor Details */}
              <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                    <Film className="w-5 h-5 text-zinc-700" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-zinc-950 truncate">
                      {user?.name || tempSignupData?.socialProfile?.name || 'Professional Video Editor'}
                    </h2>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {selectedSpecs[0] || 'General Post-Production'}
                    </p>
                  </div>
                </div>

                {/* Verified Editor Badge */}
                <div className="flex flex-col items-end shrink-0">
                  <img
                    src={editorBadge}
                    alt="Verified Editor"
                    className="h-6.5 w-auto object-contain"
                  />
                  <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mt-1">
                    Verified Talent
                  </span>
                </div>
              </div>

              {/* Data Specifications Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/60 text-xs mb-3.5">
                <div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Specializations
                  </span>
                  <span className="font-semibold text-zinc-900 block mt-0.5">
                    {selectedSpecs.length} Selected
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Software Toolkit
                  </span>
                  <span className="font-semibold text-zinc-900 block mt-0.5">
                    {selectedSoftware.length} Primary Tools
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Experience Level
                  </span>
                  <span className="font-semibold text-zinc-900 block mt-0.5">
                    {expTierObj.label} ({expTierObj.desc})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Showreel / Reel
                  </span>
                  <span className="font-semibold text-zinc-900 truncate block mt-0.5">
                    {portfolioUrl.trim() ? 'Link Verified' : 'Optional'}
                  </span>
                </div>
              </div>

              {/* Live Matchmaking Status */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900 text-white text-xs">
                <div className="flex items-center gap-2">
                  <Zap size={13} className="text-zinc-300 fill-zinc-300" />
                  <span className="text-[11px] font-medium text-zinc-200">
                    Direct Creator Project Match
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 text-white uppercase tracking-wider">
                  Active
                </span>
              </div>
            </div>

            {/* Enterprise Guarantees Pills */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                <ShieldCheck size={16} className="text-zinc-800 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-900 block">Escrow Protected</span>
                <span className="text-[9px] text-zinc-500 block mt-0.5">Milestone payouts</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                <Award size={16} className="text-zinc-800 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-900 block">Creator Network</span>
                <span className="text-[9px] text-zinc-500 block mt-0.5">Verified Channels</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                <TrendingUp size={16} className="text-zinc-800 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-900 block">Direct Placements</span>
                <span className="text-[9px] text-zinc-500 block mt-0.5">Automated Briefs</span>
              </div>
            </div>

          </div>

          {/* ╔════════════════════════════════════════════════════════════════╗
              ║  RIGHT COLUMN: Clean Professional Editor Form (lg:7)           ║
              ╚════════════════════════════════════════════════════════════════╝ */}
          <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5">

            {/* ── SECTION 1: CONTENT SPECIALIZATIONS ───────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-6 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-zinc-800" />
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
                    1. Content Types &amp; Niches ({selectedSpecs.length} selected) <span className="text-red-500">*</span>
                  </h2>
                </div>
                <span className="text-[11px] text-zinc-400 font-medium">
                  Select all that apply
                </span>
              </div>

              {/* Clean Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search editing niches (e.g. Shorts, VFX, Podcasts, Gaming)..."
                  className="w-full bg-white border border-zinc-200 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
                />
              </div>

              {/* Specializations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {filteredSpecs.map((spec) => {
                  const isSelected = selectedSpecs.includes(spec.name);
                  const IconComp = spec.icon;
                  return (
                    <div
                      key={spec.id}
                      onClick={() => toggleSpec(spec.name)}
                      className={`cursor-pointer p-3 sm:p-3.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2.5 select-none ${
                        isSelected
                          ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/70 text-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div
                          className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                            isSelected
                              ? 'bg-zinc-800 border-zinc-700 text-white'
                              : 'bg-zinc-100 border-zinc-200/80 text-zinc-700'
                          }`}
                        >
                          <IconComp size={15} strokeWidth={2} />
                        </div>

                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                            {spec.name}
                          </p>
                          <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                            {spec.desc}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                          isSelected
                            ? 'bg-white border-white text-zinc-900'
                            : 'border-zinc-300 bg-zinc-50 text-transparent'
                        }`}
                      >
                        <Check size={9} strokeWidth={3} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── SECTION 2: EDITING SOFTWARE & TOOLS ──────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-6 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-zinc-800" />
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
                    2. Software &amp; Editing Tools ({selectedSoftware.length} selected)
                  </h2>
                </div>
                <span className="text-[11px] text-zinc-400 font-medium">
                  Select primary software
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
                {SOFTWARE_TOOLS.map((tool) => {
                  const isSelected = selectedSoftware.includes(tool.name);
                  return (
                    <div
                      key={tool.id}
                      onClick={() => toggleSoftware(tool.name)}
                      className={`cursor-pointer p-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2 select-none ${
                        isSelected
                          ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/70 text-zinc-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                          {tool.name}
                        </p>
                        <span className={`text-[9.5px] block truncate mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                          {tool.badge}
                        </span>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                          isSelected
                            ? 'bg-white border-white text-zinc-900'
                            : 'border-zinc-300 bg-zinc-50 text-transparent'
                        }`}
                      >
                        <Check size={9} strokeWidth={3} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── SECTION 3: EXPERIENCE LEVEL ──────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-6 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-100">
                <Clock className="w-4 h-4 text-zinc-800" />
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
                  3. Video Editing Experience
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EXPERIENCE_TIERS.map((tier) => {
                  const isSelected = experienceYears === tier.value;
                  return (
                    <div
                      key={tier.value}
                      onClick={() => setExperienceYears(tier.value)}
                      className={`cursor-pointer p-2.5 sm:p-3 rounded-xl border text-center transition-all select-none ${
                        isSelected
                          ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                          : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{tier.label}</p>
                      <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>{tier.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── SECTION 4: PORTFOLIO & SHOWREEL LINK ─────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-6 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-zinc-800" />
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
                    4. Portfolio / Showreel Link (Optional)
                  </h2>
                </div>
                <span className="text-[11px] text-zinc-400">YouTube, Behance, Drive, or Site</span>
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <Globe className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="e.g. https://youtube.com/watch?v=... or behance.net/portfolio"
                    className="w-full bg-white border border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
                  />
                </div>
                {portfolioUrl.trim() && (
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                    <ExternalLink size={10} /> Link will be displayed on your verified editor profile
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* ── STICKY PROFESSIONAL BOTTOM ACTION BAR ──────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 py-3.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Dynamic Status Summary */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                {selectedSpecs.length > 0
                  ? `${selectedSpecs.length} specializations • ${selectedSoftware.length} tools • ${expTierObj.label}`
                  : 'Select at least 1 specialization to proceed'}
              </p>
            </div>
            <p className="text-[10px] sm:text-xs text-zinc-500 hidden sm:block mt-0.5">
              Verified editor profile, direct YouTube creator briefs &amp; smart escrow payouts
            </p>
          </div>

          {/* Right: Tactile Action CTA Button */}
          <Button
            onClick={handleContinue}
            disabled={selectedSpecs.length === 0 || isSubmitting}
            className={`!h-11 sm:!h-11.5 !px-6 sm:!px-8 !text-xs sm:!text-sm !font-semibold !tracking-wide flex items-center gap-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              selectedSpecs.length > 0
                ? '!bg-zinc-950 hover:!bg-zinc-800 !text-white shadow-xs active:scale-[0.98]'
                : '!bg-zinc-100 !text-zinc-400 cursor-not-allowed border border-zinc-200'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight size={15} strokeWidth={2.5} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
