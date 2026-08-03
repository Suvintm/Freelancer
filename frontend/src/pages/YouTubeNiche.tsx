import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Check,
  Users,
  Video,
  ArrowRight,
  Loader2,
  Sparkles,
  TrendingUp,
  Laptop,
  Gamepad2,
  Camera,
  GraduationCap,
  Smile,
  Dumbbell,
  Music,
  DollarSign,
  Utensils,
  Compass,
  Film,
  Newspaper,
  Car,
  Atom,
  Heart,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useDispatch, useSelector } from 'react-redux';
import { setTempSignupData } from '../store/slices/onboardingSlice';
import { useCategories } from '../queries/useCategories';
import type { RootState } from '../store';
import { selectUser } from '../store/slices/authSlice';
import { api } from '../api/client';
import logo from '../assets/lightlogo.png';

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

interface NicheItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

const YOUTUBE_NICHES: NicheItem[] = [
  { id: 'tech_gadgets', name: 'Tech & Gadgets', icon: <Laptop size={18} /> },
  { id: 'gaming', name: 'Gaming', icon: <Gamepad2 size={18} /> },
  { id: 'vlogs_lifestyle', name: 'Vlogs & Lifestyle', icon: <Camera size={18} /> },
  { id: 'education_howto', name: 'Education & How-To', icon: <GraduationCap size={18} /> },
  { id: 'comedy_entertainment', name: 'Comedy & Entertainment', icon: <Smile size={18} /> },
  { id: 'fitness_health', name: 'Fitness & Health', icon: <Dumbbell size={18} /> },
  { id: 'music_dance', name: 'Music & Dance', icon: <Music size={18} /> },
  { id: 'finance_business', name: 'Finance & Business', icon: <DollarSign size={18} /> },
  { id: 'fashion_beauty', name: 'Fashion & Beauty', icon: <Sparkles size={18} /> },
  { id: 'food_cooking', name: 'Food & Cooking', icon: <Utensils size={18} /> },
  { id: 'travel_adventure', name: 'Travel & Adventure', icon: <Compass size={18} /> },
  { id: 'film_animation', name: 'Film & Animation', icon: <Film size={18} /> },
  { id: 'news_politics', name: 'News & Politics', icon: <Newspaper size={18} /> },
  { id: 'auto_vehicles', name: 'Auto & Vehicles', icon: <Car size={18} /> },
  { id: 'science_nature', name: 'Science & Nature', icon: <Atom size={18} /> },
  { id: 'kids_family', name: 'Kids & Family', icon: <Heart size={18} /> },
];

export default function YouTubeNiche() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tempSignupData = useSelector((state: RootState) => state.onboarding.tempSignupData);
  const { categories } = useCategories();
  const user = useSelector(selectUser);

  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const youtubeCategory = categories.find(
    (c) => c.slug === 'yt_influencer' || c.slug === 'creator' || c.maps_to_role === 'creator'
  );
  const channel = tempSignupData?.youtubeChannels?.[0];

  const availableNiches: NicheItem[] = useMemo(() => {
    if (youtubeCategory?.subCategories && youtubeCategory.subCategories.length > 0) {
      return youtubeCategory.subCategories.map((sub) => {
        const fallback = YOUTUBE_NICHES.find((n) => n.id === sub.id || n.name.toLowerCase() === sub.name.toLowerCase());
        return {
          id: sub.id,
          name: sub.name,
          icon: fallback?.icon || <Layers size={18} />,
        };
      });
    }
    return YOUTUBE_NICHES;
  }, [youtubeCategory]);

  useEffect(() => {
    if (!channel) {
      try {
        const rawBackup = sessionStorage.getItem('suvix_temp_signup_data');
        if (rawBackup) {
          const parsed = JSON.parse(rawBackup);
          if (parsed?.youtubeChannels?.[0]) {
            dispatch(setTempSignupData(parsed));
            return;
          }
        }
      } catch {
        // ignore
      }
      navigate('/youtube-connect', { replace: true });
    }
  }, [channel, dispatch, navigate]);

  if (!channel) return null;

  const selectedNicheItem = availableNiches.find((s) => s.id === selectedNiche);
  const selectedNicheName = selectedNicheItem?.name;

  const handleContinue = async () => {
    if (!selectedNiche) return;
    setIsSubmitting(true);
    try {
      const matched = availableNiches.find((s) => s.id === selectedNiche);
      const nicheName = matched?.name || selectedNiche;
      const youtubeChannels = (tempSignupData?.youtubeChannels ?? []).map((ch) => ({
        ...ch,
        niche: nicheName,
        subCategoryId: selectedNiche,
        subCategorySlug: selectedNiche,
      }));

      const updateData = {
        youtubeChannels,
        roleSubCategoryIds: [selectedNiche],
        onboardingStep: 'youtube' as const,
      };

      dispatch(setTempSignupData(updateData));
      try {
        const raw = sessionStorage.getItem('suvix_temp_signup_data');
        const cur = raw ? JSON.parse(raw) : {};
        sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify({ ...cur, ...updateData }));
      } catch {
        // ignore
      }

      const isEmailFlow = tempSignupData?.authMethod === 'email';
      const isSocialFlow = tempSignupData?.isSocialSignup || tempSignupData?.authMethod === 'google';
      const isRegistering = tempSignupData?.intent === 'register' || isEmailFlow || isSocialFlow || !user?.isOnboarded;

      // IF USER IS ALREADY AN ONBOARDED USER LINKING A CHANNEL FROM DASHBOARD SETTINGS:
      if (user && user.isOnboarded && !isRegistering) {
        for (const ch of youtubeChannels) {
          await api.post('/youtube-creator/channel/link', { channel: ch });
        }
        setIsSubmitting(false);
        navigate('/youtube-dashboard');
        return;
      }

      setTimeout(() => {
        setIsSubmitting(false);
        if (isEmailFlow) {
          navigate('/signup');
        } else {
          navigate('/complete-profile');
        }
      }, 700);
    } catch (err) {
      console.error('Failed to link YouTube channel niche:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fcfcfd] text-zinc-900 flex flex-col relative overflow-x-hidden selection:bg-red-500 selection:text-white font-sans">
      
      {/* ── ARCHITECTURAL GRID BACKGROUND ─────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(228, 228, 231, 0.7) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(228, 228, 231, 0.7) 1px, transparent 1px)
            `,
            backgroundSize: '44px 44px',
          }}
        />
        {/* Soft Ambient Glows */}
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[80rem] h-[35rem] bg-gradient-to-b from-amber-500/10 via-red-500/5 to-transparent rounded-full blur-[130px]" />
        <div className="absolute top-[30%] right-[-10%] w-[35rem] h-[35rem] bg-amber-400/[0.08] rounded-full blur-[140px]" />
      </div>

      {/* ── TOP HEADER ────────────────────────────────────────────────────── */}
      <header className="relative z-50 w-full px-6 py-6 md:px-12 md:py-8 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="SuviX" className="h-7 md:h-9 object-contain" />
        </div>

        {/* Step Indicator & Back Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 shadow-sm text-xs font-semibold text-zinc-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Step 3 of 4 • Primary Niche</span>
          </div>

          <button
            onClick={() => navigate('/youtube-connect')}
            className="h-10 px-4 rounded-xl border border-zinc-200/90 bg-white/80 backdrop-blur-md text-zinc-700 hover:text-zinc-950 hover:bg-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 group active:scale-95"
          >
            <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Channel</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT (2-COLUMN RESPONSIVE LAYOUT) ─────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 pt-2 pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ╔════════════════════════════════════════════════════════════════╗
              ║  LEFT COLUMN: Channel Identity & Highlights (5 Cols on lg)   ║
              ╚════════════════════════════════════════════════════════════════╝ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-28"
          >
            {/* Channel Identity Card */}
            <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.05)] p-6 relative overflow-hidden">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  <img
                    src={channel.thumbnailUrl ?? 'https://via.placeholder.com/96'}
                    alt={channel.channelName}
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-sm">
                    <Check size={12} strokeWidth={3} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black text-zinc-950 truncate tracking-tight">
                      {channel.channelName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[9px] font-black uppercase tracking-wider">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs font-bold text-zinc-600 flex-wrap">
                    <span className="flex items-center gap-1.5 text-red-600">
                      <Users size={14} /> {formatCount(channel.subscriberCount ?? 0)}
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span className="flex items-center gap-1 text-zinc-600">
                      <Video size={13} /> {formatCount(channel.videoCount ?? 0)} videos
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Identity Linked with Google</span>
                  </div>
                </div>
              </div>

              {/* Video Highlights Strip */}
              {channel.videos && channel.videos.length > 0 && (
                <div className="mt-6 pt-5 border-t border-zinc-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Recent Channel Highlights
                    </p>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      Live Synced
                    </span>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                    {channel.videos.slice(0, 4).map((video) => (
                      <a
                        key={video.id}
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 w-36 sm:w-40 rounded-xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 overflow-hidden transition-all hover:-translate-y-0.5 group shadow-sm"
                      >
                        <div className="relative aspect-video bg-zinc-100">
                          <img
                            src={video.thumbnail}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-[10px] font-bold text-zinc-800 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                            {video.title}
                          </p>
                          <p className="text-[9px] text-zinc-400 mt-1 font-medium">
                            {formatVideoDate(video.publishedAt)}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Why Niche Matters Card (Desktop & Tablet) */}
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm hidden sm:block">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
                  <Sparkles size={14} />
                </div>
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                  Why Pick Your Niche?
                </h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                Selecting your primary niche trains the SuviX matching engine to connect you with the highest-converting opportunities:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <TrendingUp size={13} />, title: 'Brand Deals', desc: 'Direct sponsor matchmaking' },
                  { icon: <Users size={13} />, title: 'Video Editors', desc: 'Niche-specialized editors' },
                  { icon: <ShieldCheck size={13} />, title: 'Rank Priority', desc: 'Top category search rank' },
                  { icon: <Video size={13} />, title: 'Growth Tools', desc: 'SEO & keyword benchmarks' },
                ].map((item, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-xs">
                      <span className="text-amber-500">{item.icon}</span>
                      <span>{item.title}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ╔════════════════════════════════════════════════════════════════╗
              ║  RIGHT COLUMN: Interactive Niche Selection (7 Cols on lg)    ║
              ╚════════════════════════════════════════════════════════════════╝ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-7 flex flex-col space-y-6"
          >
            {/* Header / Title Area */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-200 bg-white shadow-sm mb-3">
                <Sparkles size={11} className="text-amber-500" />
                <span className="text-[9.5px] font-black text-zinc-700 uppercase tracking-[0.16em]">
                  Creator Categorization
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-zinc-950 tracking-tight leading-tight">
                What content do{' '}
                <span className="relative inline-block text-zinc-950">
                  you create?
                  <span className="absolute left-0 bottom-1 w-full h-2.5 bg-amber-400/35 -z-10 rounded-sm transform -rotate-1" />
                </span>
              </h1>

              <p className="text-sm text-zinc-600 font-medium mt-2 max-w-xl leading-relaxed">
                Choose the primary niche that best represents your channel. Brands and top video editors use this to discover and collaborate with you.
              </p>
            </div>

            {/* Niches Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {availableNiches.map((niche) => {
                const isActive = selectedNiche === niche.id;
                return (
                  <motion.button
                    key={niche.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedNiche(niche.id)}
                    className={`relative p-4 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between min-h-[5.75rem] cursor-pointer group select-none ${
                      isActive
                        ? 'bg-amber-500/10 border-2 border-amber-500 text-zinc-950 shadow-[0_8px_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/80 text-zinc-800 shadow-sm'
                    }`}
                  >
                    {/* Top Row: Icon + Checkmark */}
                    <div className="flex items-center justify-between w-full mb-2">
                      <div
                        className={`p-2 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-zinc-100 text-zinc-600 group-hover:text-zinc-900 group-hover:bg-zinc-200/80'
                        }`}
                      >
                        {niche.icon}
                      </div>

                      {isActive && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                          <Check size={11} strokeWidth={3.5} />
                        </div>
                      )}
                    </div>

                    {/* Niche Name */}
                    <span className="text-xs font-bold leading-tight line-clamp-2">
                      {niche.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Selection Confirmation Strip */}
            <AnimatePresence>
              {selectedNiche && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex items-center gap-3.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-900">
                      Primary Niche Selected: <span className="font-extrabold">{selectedNicheName}</span>
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                      You can add secondary niches or adjust this anytime from your creator settings.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </main>

      {/* ── STICKY BOTTOM HUD BAR (Responsive & Sleek) ────────────────────── */}
      <div className="fixed bottom-5 inset-x-4 sm:bottom-6 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-2xl bg-white/90 backdrop-blur-xl border border-zinc-200/90 p-3 sm:p-4 rounded-2xl sm:rounded-3xl flex items-center justify-between gap-4 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
          
          <div className="flex items-center gap-3 pl-2 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  selectedNiche
                    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    : 'bg-zinc-400'
                }`}
              />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider leading-none mb-1">
                Niche Status
              </p>
              <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                {selectedNiche ? selectedNicheName : 'Select a niche above to proceed'}
              </p>
            </div>
          </div>

          <Button
            size="lg"
            disabled={!selectedNiche || isSubmitting}
            onClick={handleContinue}
            className={`h-11 sm:h-13 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 border-none shrink-0 ${
              selectedNiche
                ? 'bg-[#ffb703] hover:bg-[#fb8500] text-zinc-950 shadow-md shadow-amber-500/20 active:scale-95'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>Continue to Details</span>
                <ArrowRight size={15} strokeWidth={2.5} />
              </>
            )}
          </Button>
        </div>
      </div>

    </div>
  );
}
