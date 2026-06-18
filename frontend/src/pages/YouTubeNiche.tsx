import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Check,
  Users,
  Video,
  ArrowRight,
  Loader2,
  Youtube,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useDispatch, useSelector } from 'react-redux';
import { setTempSignupData } from '../store/slices/onboardingSlice';
import { useCategories } from '../queries/useCategories';
import logo from '../assets/darklogo.png';

const formatCount = (n: number | string): string => {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatVideoDate = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// Generated once at module load to maintain strict component render purity
const STATIC_PARTICLES = [...Array(50)].map((_, i) => ({
  id: i,
  x: Math.random() * 100 + '%',
  y: (i < 35) ? (Math.random() * 60 + '%') : (Math.random() * 100 + '%'),
  opacity: Math.random() * 0.8,
  scale: Math.random() * 0.7 + 0.3,
  duration: Math.random() * 5 + 4,
}));

export default function YouTubeNiche() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tempSignupData = useSelector((state: any) => state.onboarding.tempSignupData);
  const { categories } = useCategories();

  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const youtubeCategory = categories.find(c => c.slug === 'yt_influencer');
  const channel = tempSignupData?.youtubeChannels?.[0];

  if (!channel) {
    navigate('/youtube-connect', { replace: true });
    return null;
  }

  const selectedNicheName = youtubeCategory?.subCategories?.find(s => s.id === selectedNiche)?.name;

  const handleContinue = () => {
    if (!selectedNiche) return;
    setIsSubmitting(true);
    const subCategory = youtubeCategory?.subCategories?.find(s => s.id === selectedNiche);
    const youtubeChannels = (tempSignupData?.youtubeChannels ?? []).map((ch: any) => ({
      ...ch,
      subCategoryId:   selectedNiche,
      subCategorySlug: subCategory?.slug ?? null,
    }));
    dispatch(setTempSignupData({
      youtubeChannels,
      roleSubCategoryIds: [selectedNiche],
      onboardingStep:     'youtube',
    }));
    setTimeout(() => {
      setIsSubmitting(false);
      const isSocial = tempSignupData?.isSocialSignup;
      navigate(isSocial ? '/complete-profile' : '/signup');
    }, 900);
  };

  return (
    <div className="h-screen w-full bg-black flex flex-col relative overflow-hidden selection:bg-red-500 selection:text-white">

      {/* ── BACKGROUND — identical to YouTubeConnect ───────────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[70vh] bg-gradient-to-b from-red-600/[0.12] to-transparent blur-[120px]" />
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
            className="absolute w-1 h-1 bg-red-500 rounded-full blur-[1px]"
          />
        ))}
        <motion.div animate={{ scale: [1, 1.15, 1], x: ['-4%', '4%', '-4%'], rotate: [0, 45, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} className="absolute -top-[10%] -left-[10%] w-[90%] h-[60%] bg-zinc-900/15 rounded-full blur-[140px]" />
        <motion.div animate={{ scale: [1.15, 1, 1.15], x: ['4%', '-4%', '4%'], rotate: [0, -45, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} className="absolute -top-[5%] -right-[10%] w-[90%] h-[60%] bg-red-900/[0.08] rounded-full blur-[140px]" />
      </div>

      {/* ── HEADER — same absolute style as YouTubeConnect ─────────────────── */}
      <div className="absolute top-0 inset-x-0 z-[100] p-4 md:p-6 lg:p-8 flex items-center justify-between pointer-events-none">
        {/* Logo */}
        <div className="pointer-events-auto">
          <img src={logo} alt="SuviX" className="h-6 md:h-7 lg:h-9" />
        </div>

        {/* Step indicator — center */}
        <div className="flex items-center gap-2 pointer-events-none">
          {[
            { label: 'Role',    done: true  },
            { label: 'YouTube', done: true  },
            { label: 'Niche',   done: false, active: true },
            { label: 'Details', done: false },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all ${
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
          onClick={() => navigate('/youtube-connect')}
          className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-zinc-800 flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-auto group active:scale-95"
        >
          <ChevronLeft size={15} className="text-zinc-400 group-hover:text-white" />
        </button>
      </div>

      {/* ── MAIN: Two-column layout — no outer scroll ──────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch overflow-hidden relative z-10 pt-16 md:pt-20 pb-20">

        {/* ╔══════════════════════════════════════════════════════╗
            ║  LEFT: Channel Identity Card (sticky, compact)      ║
            ╚══════════════════════════════════════════════════════╝ */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-[42%] xl:w-[38%] flex flex-col px-5 md:px-8 lg:px-10 xl:px-14 py-4 lg:py-8 lg:overflow-y-auto lg:border-r lg:border-zinc-900/60 custom-scrollbar"
        >
          {/* Channel hero */}
          <div className="flex flex-row lg:flex-col items-center lg:items-start gap-5 lg:gap-4 mb-5 lg:mb-6">
            {/* Avatar + verified */}
            <div className="relative flex-shrink-0">
              {/* Mini banner glow behind avatar */}
              <div className="absolute inset-0 scale-150 rounded-full blur-2xl opacity-40"
                style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)' }} />
              <img
                src={channel.thumbnailUrl ?? ''}
                alt={channel.channelName}
                className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full object-cover border-4 border-zinc-900 shadow-2xl"
              />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center border-2 border-black shadow-xl">
                <Check size={11} strokeWidth={3} className="text-white" />
              </div>
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 lg:w-full">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight truncate">{channel.channelName}</h2>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/10 border border-red-600/20 flex-shrink-0">
                  <Youtube size={9} className="text-red-500" />
                  <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Verified</span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-red-400 font-bold">
                  <Users size={13} />
                  <span className="text-sm">{formatCount(channel.subscriberCount ?? 0)}</span>
                </div>
                <div className="w-px h-3.5 bg-zinc-800" />
                <div className="flex items-center gap-1.5 text-zinc-500 font-semibold">
                  <Video size={12} />
                  <span className="text-xs">{formatCount(channel.videoCount ?? 0)} videos</span>
                </div>
                <div className="w-px h-3.5 bg-zinc-800 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Identity Synced</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-900 mb-5" />

          {/* Recent videos — horizontal compact strip */}
          {channel.videos && channel.videos.length > 0 && (
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-2">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.25em]">Channel Highlights</p>
                <span className="text-[8px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Live Synced</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                {channel.videos.slice(0, 6).map((video: any) => (
                  <a
                    key={video.id}
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-none w-[130px] md:w-[150px] group/v rounded-xl bg-zinc-950/80 border border-zinc-800/60 hover:border-zinc-700 overflow-hidden transition-all hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-video bg-zinc-900">
                      <img src={video.thumbnail} alt="" className="w-full h-full object-cover group-hover/v:scale-105 transition-transform duration-400" />
                      <div className="absolute inset-0 bg-black/20 group-hover/v:bg-black/0 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/v:opacity-100 transition-opacity">
                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white ml-0.5"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-[9px] font-semibold text-zinc-400 line-clamp-2 leading-snug group-hover/v:text-red-400 transition-colors">{video.title}</p>
                      <p className="text-[8px] text-zinc-600 mt-0.5">{formatVideoDate(video.publishedAt)}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Benefits Card — same as YT Connect left column */}
          <div className="hidden lg:block w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 text-left relative overflow-hidden group mt-auto">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Video size={56} className="text-zinc-500" />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[8px] font-bold uppercase tracking-widest">
                <Sparkles size={8} /> Creator Benefits
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">Unlock Your Creator Identity</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-1">
                {[
                  { icon: <Users size={12} />, text: "Verified Stats" },
                  { icon: <TrendingUp size={12} />, text: "Engagement" },
                  { icon: <Check size={12} />, text: "Search Priority" },
                  { icon: <Video size={12} />, text: "Brand Verified" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-zinc-400 text-[9px] font-bold uppercase tracking-tight">
                    <div className="p-1 rounded-md bg-white/5 border border-white/10 text-red-500">{item.icon}</div>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ╔══════════════════════════════════════════════════════╗
            ║  RIGHT: Niche Selection (scrollable within column)  ║
            ╚══════════════════════════════════════════════════════╝ */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:flex-1 flex flex-col px-5 md:px-8 lg:px-10 xl:px-14 py-4 lg:py-8 overflow-y-auto custom-scrollbar"
        >
          {/* Heading */}
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Step 3 of 4</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-[2.25rem] font-bold text-white tracking-tight leading-tight">
              What content do <br className="hidden lg:block" />
              <span className="text-zinc-600">you create?</span>
            </h1>
            <p className="text-zinc-500 text-xs md:text-sm font-medium mt-2 max-w-sm">
              Choose the niche that best describes your channel. This helps brands and clients discover you.
            </p>
          </div>

          {/* Niche grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-3 mb-5">
            {youtubeCategory?.subCategories?.map((sub) => {
              const isActive = selectedNiche === sub.id;
              return (
                <motion.button
                  key={sub.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedNiche(sub.id)}
                  className={`relative px-3 py-3.5 md:px-4 md:py-4 rounded-2xl text-[11px] md:text-xs font-bold transition-all border text-center leading-snug cursor-pointer overflow-hidden group ${
                    isActive
                      ? 'bg-white border-white text-black shadow-[0_8px_24px_rgba(255,255,255,0.1)]'
                      : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  <span className="relative z-10 flex flex-col items-center justify-center gap-1.5 min-h-[2rem]">
                    {isActive && <Check size={13} strokeWidth={3} className="text-black" />}
                    {sub.name}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Selected confirmation strip */}
          <AnimatePresence>
            {selectedNiche && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-green-500/5 border border-green-500/20 mt-1"
              >
                <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-green-400">Niche confirmed</p>
                  <p className="text-[10px] text-zinc-500">
                    Tagged as <span className="text-white font-bold">{selectedNicheName}</span> — you can update this later.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── STICKY BOTTOM HUD — same style as YouTubeConnect ──────────────── */}
      <div className="absolute bottom-4 inset-x-4 md:bottom-6 z-[100] flex justify-center pointer-events-none">
        <div className="w-full max-w-[44rem] bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800 p-3 md:p-4 rounded-[2rem] flex items-center justify-between gap-4 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3 pl-2">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${selectedNiche ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-700'}`} />
            </div>
            <div className="hidden sm:block">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-0.5">Niche Status</p>
              <p className="text-sm font-bold text-white leading-none truncate max-w-[180px] md:max-w-xs">
                {selectedNiche
                  ? selectedNicheName
                  : 'Select a niche above to continue'
                }
              </p>
            </div>
          </div>

          <Button
            size="lg"
            disabled={!selectedNiche || isSubmitting}
            onClick={handleContinue}
            className={`h-11 md:h-13 px-6 md:px-8 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 border-none flex-shrink-0 ${
              selectedNiche
                ? 'bg-white text-black hover:opacity-90 active:scale-[0.98] shadow-xl shadow-white/5'
                : 'bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-50'
            }`}
          >
            {isSubmitting
              ? <Loader2 size={15} className="animate-spin" />
              : <><span>Continue to Details</span><ArrowRight size={16} /></>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
