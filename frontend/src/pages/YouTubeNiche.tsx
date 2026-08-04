import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
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
  Utensils,
  Compass,
  Film,
  Newspaper,
  Car,
  Atom,
  Heart,
  Layers,
  ShieldCheck,
  Play,
  Clock
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
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

interface NicheItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

const YOUTUBE_NICHES: NicheItem[] = [
  { id: 'tech_gadgets', name: 'Tech & Gadgets', icon: <Laptop size={17} strokeWidth={1.75} /> },
  { id: 'gaming', name: 'Gaming', icon: <Gamepad2 size={17} strokeWidth={1.75} /> },
  { id: 'vlogs_lifestyle', name: 'Vlogs & Lifestyle', icon: <Camera size={17} strokeWidth={1.75} /> },
  { id: 'education_howto', name: 'Education & How-To', icon: <GraduationCap size={17} strokeWidth={1.75} /> },
  { id: 'comedy_entertainment', name: 'Comedy & Entertainment', icon: <Smile size={17} strokeWidth={1.75} /> },
  { id: 'fitness_health', name: 'Fitness & Health', icon: <Dumbbell size={17} strokeWidth={1.75} /> },
  { id: 'music_dance', name: 'Music & Dance', icon: <Music size={17} strokeWidth={1.75} /> },
  { id: 'finance_business', name: 'Finance & Business', icon: <TrendingUp size={17} strokeWidth={1.75} /> },
  { id: 'fashion_beauty', name: 'Fashion & Beauty', icon: <Sparkles size={17} strokeWidth={1.75} /> },
  { id: 'food_cooking', name: 'Food & Cooking', icon: <Utensils size={17} strokeWidth={1.75} /> },
  { id: 'travel_adventure', name: 'Travel & Adventure', icon: <Compass size={17} strokeWidth={1.75} /> },
  { id: 'film_animation', name: 'Film & Animation', icon: <Film size={17} strokeWidth={1.75} /> },
  { id: 'news_politics', name: 'News & Politics', icon: <Newspaper size={17} strokeWidth={1.75} /> },
  { id: 'auto_vehicles', name: 'Auto & Vehicles', icon: <Car size={17} strokeWidth={1.75} /> },
  { id: 'science_nature', name: 'Science & Nature', icon: <Atom size={17} strokeWidth={1.75} /> },
  { id: 'kids_family', name: 'Kids & Family', icon: <Heart size={17} strokeWidth={1.75} /> },
];

// ── COMPACT LATEST VIDEOS SWIPEABLE CAROUSEL ───────────────────────────────
interface VideoCarouselProps {
  videos: Array<{
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
  }>;
}

function LatestVideosCarousel({ videos }: VideoCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [videos]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!videos || videos.length === 0) return null;

  return (
    <div className="w-full bg-white rounded-2xl border border-zinc-200/80 p-3 sm:p-4 shadow-2xs">
      {/* Carousel Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
            <Play size={10} className="fill-red-600 ml-0.5" />
          </div>
          <h3 className="text-xs font-semibold text-zinc-900">
            Latest Videos
          </h3>
          <span className="text-[10px] text-zinc-400 font-normal">
            ({videos.length})
          </span>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
              canScrollLeft
                ? 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 active:scale-95 cursor-pointer'
                : 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
            }`}
            aria-label="Previous"
          >
            <ChevronLeft size={13} />
          </button>

          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
              canScrollRight
                ? 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 active:scale-95 cursor-pointer'
                : 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
            }`}
            aria-label="Next"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Swipeable Compact Scroll Track */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2.5 overflow-x-auto pb-0.5 snap-x snap-mandatory scrollbar-none scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {videos.map((video) => (
          <a
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-32 sm:w-36 md:w-40 snap-start rounded-xl bg-zinc-50 border border-zinc-200/70 hover:border-red-300 overflow-hidden transition-all duration-150 hover:-translate-y-0.5 group block"
          >
            {/* Thumbnail with Minimal Play Overlay */}
            <div className="relative aspect-video bg-zinc-100 overflow-hidden">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              
              {/* Subtle Play Overlay */}
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs">
                  <Play size={10} className="fill-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* Video Details */}
            <div className="p-2">
              <p className="text-[11px] font-medium text-zinc-800 line-clamp-1 leading-snug group-hover:text-red-600 transition-colors">
                {video.title}
              </p>
              
              <div className="flex items-center gap-1 text-[9.5px] text-zinc-400 mt-1 font-normal">
                <Clock size={9} />
                <span>{formatVideoDate(video.publishedAt)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function YouTubeNiche() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tempSignupData = useSelector((state: RootState) => state.onboarding.tempSignupData);
  const { categories } = useCategories();
  const user = useSelector(selectUser);

  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

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
          icon: fallback?.icon || <Layers size={17} strokeWidth={1.75} />,
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

  const avatarSrc =
    !avatarError && channel.thumbnailUrl
      ? channel.thumbnailUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.channelName || 'YouTube')}&background=E60000&color=ffffff&bold=true&size=128`;

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
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[80rem] h-[35rem] bg-gradient-to-b from-red-500/5 via-amber-500/5 to-transparent rounded-full blur-[130px]" />
        <div className="absolute top-[30%] right-[-10%] w-[35rem] h-[35rem] bg-red-500/[0.04] rounded-full blur-[140px]" />
      </div>

      {/* ── TOP HEADER ────────────────────────────────────────────────────── */}
      <header className="relative z-50 w-full px-5 py-4 sm:px-8 sm:py-5 md:px-12 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="SuviX" className="h-7 md:h-8 object-contain" />
        </div>

        {/* Step Indicator & Back Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs font-medium text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>Step 3 of 4 • Primary Niche</span>
          </div>

          <button
            onClick={() => navigate('/youtube-connect')}
            className="h-9 px-3.5 rounded-xl border border-zinc-200 bg-white/90 text-zinc-700 hover:text-zinc-950 hover:bg-white text-xs font-medium transition-all flex items-center gap-1.5 group active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 pt-1 pb-36 relative z-10">
        
        {/* ── MOBILE ONLY: Compact Channel Banner + Videos Carousel (<140px) ── */}
        <div className="lg:hidden w-full mb-5 space-y-2.5">
          {/* Channel Banner */}
          <div className="bg-gradient-to-r from-[#E60000] via-[#D00000] to-[#B00000] rounded-2xl p-3 text-white shadow-sm border border-red-500/30 flex items-center justify-between gap-3 relative overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={avatarSrc}
                  alt={channel.channelName}
                  onError={() => setAvatarError(true)}
                  className="w-10 h-10 rounded-xl object-cover border border-white shadow-2xs"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white text-red-600 flex items-center justify-center">
                  <Check size={8} strokeWidth={3} />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-semibold text-white truncate max-w-[160px]">
                    {channel.channelName}
                  </h2>
                  <span className="px-1.5 py-0.2 rounded bg-black/40 text-white text-[8.5px] font-medium uppercase tracking-wider shrink-0">
                    Verified
                  </span>
                </div>

                <p className="text-[11px] text-red-100 font-normal truncate mt-0.5">
                  {formatCount(channel.subscriberCount ?? 0)} subscribers • {formatCount(channel.videoCount ?? 0)} videos
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 text-white text-[9.5px] font-medium">
              <Play size={8} className="fill-white" />
              <span>Connected</span>
            </div>
          </div>

          {/* Swipeable Video Carousel */}
          {channel.videos && channel.videos.length > 0 && (
            <LatestVideosCarousel videos={channel.videos} />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ╔════════════════════════════════════════════════════════════════╗
              ║  LEFT COLUMN: Desktop Channel Card, Videos Carousel (5)       ║
              ╚════════════════════════════════════════════════════════════════╝ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:flex lg:col-span-5 flex-col gap-4 lg:sticky lg:top-24"
          >
            {/* Desktop YouTube Red Channel Profile Card */}
            <div className="bg-gradient-to-br from-[#E60000] via-[#D00000] to-[#B00000] rounded-3xl border border-red-500/30 shadow-lg p-5 text-white space-y-4 relative overflow-hidden">
              {/* Ambient Glow */}
              <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              {/* Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/15 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white text-red-600 flex items-center justify-center">
                    <Play size={11} className="fill-red-600 ml-0.5" />
                  </div>
                  <span className="text-xs font-semibold tracking-wide text-white uppercase">
                    Connected Channel
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/35 text-white text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Identity Row */}
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="relative shrink-0">
                  <img
                    src={avatarSrc}
                    alt={channel.channelName}
                    onError={() => setAvatarError(true)}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-xs"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-white text-red-600 flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-white truncate">
                    {channel.channelName}
                  </h2>

                  <p className="text-xs text-red-100 font-normal truncate mt-0.5">
                    {channel.channelHandle || '@creator'}
                  </p>

                  <p className="text-[10px] text-white/70 font-mono truncate mt-0.5">
                    ID: {channel.channelId}
                  </p>
                </div>
              </div>

              {/* Stat Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 pt-0.5 relative z-10">
                <div className="p-2.5 rounded-xl bg-white text-zinc-950 shadow-2xs">
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Users size={11} className="text-red-600" /> Subscribers
                  </p>
                  <p className="text-sm font-semibold text-zinc-950 mt-0.5">
                    {formatCount(channel.subscriberCount ?? 0)}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white text-zinc-950 shadow-2xs">
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Video size={11} className="text-zinc-900" /> Videos
                  </p>
                  <p className="text-sm font-semibold text-zinc-950 mt-0.5">
                    {formatCount(channel.videoCount ?? 0)}
                  </p>
                </div>
              </div>

              {/* OAuth Notice */}
              <div className="flex items-center gap-1.5 pt-0.5 text-[11px] font-normal text-red-100 relative z-10">
                <ShieldCheck size={13} className="text-emerald-300 shrink-0" />
                <span>Google Verified OAuth • Privacy Protected</span>
              </div>
            </div>

            {/* Video Carousel */}
            {channel.videos && channel.videos.length > 0 && (
              <LatestVideosCarousel videos={channel.videos} />
            )}

            {/* Why Niche Matters Card */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded-md bg-red-50 text-red-600">
                  <Sparkles size={13} />
                </div>
                <h3 className="text-xs font-semibold text-zinc-900">
                  Why Pick Your Primary Niche?
                </h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed mb-3 font-normal">
                Helps SuviX connect your channel with relevant brand sponsors and specialized video editors:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <TrendingUp size={12} className="text-red-500" />, title: 'Brand Deals', desc: 'Direct matchmaking' },
                  { icon: <Users size={12} className="text-red-500" />, title: 'Video Editors', desc: 'Niche talent' },
                  { icon: <ShieldCheck size={12} className="text-red-500" />, title: 'Rank Priority', desc: 'Top category rank' },
                  { icon: <Video size={12} className="text-red-500" />, title: 'Growth Benchmarks', desc: 'Competitor stats' },
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                    <div className="flex items-center gap-1 text-zinc-800 font-medium text-xs">
                      {item.icon}
                      <span>{item.title}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-normal">{item.desc}</p>
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
            transition={{ duration: 0.5, delay: 0.05 }}
            className="lg:col-span-7 flex flex-col space-y-5"
          >
            {/* Header / Title Area */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-zinc-200 bg-white shadow-2xs mb-2.5">
                <Sparkles size={11} className="text-red-600" />
                <span className="text-[9.5px] font-medium text-zinc-700 uppercase tracking-wider">
                  Creator Categorization
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-950 tracking-tight leading-tight">
                What content do{' '}
                <span className="relative inline-block text-zinc-950">
                  you create?
                  <span className="absolute left-0 bottom-0.5 w-full h-2 bg-red-500/15 -z-10 rounded-sm transform -rotate-1" />
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-1.5 max-w-xl leading-relaxed">
                Choose the primary niche that best represents your channel. Brands and video editors use this to discover and collaborate with you.
              </p>
            </div>

            {/* Niches Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
              {availableNiches.map((niche) => {
                const isActive = selectedNiche === niche.id;
                return (
                  <motion.button
                    key={niche.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedNiche(niche.id)}
                    className={`relative p-3 rounded-xl text-left transition-all duration-150 border flex flex-col justify-between min-h-[5rem] sm:min-h-[5.25rem] cursor-pointer group select-none ${
                      isActive
                        ? 'bg-zinc-950 border-zinc-950 text-white shadow-md'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800 shadow-2xs'
                    }`}
                  >
                    {/* Top Row: Icon + Checkmark */}
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'bg-zinc-100 text-zinc-600 group-hover:text-zinc-900'
                        }`}
                      >
                        {niche.icon}
                      </div>

                      {isActive && (
                        <div className="w-4.5 h-4.5 rounded-full bg-white text-zinc-950 flex items-center justify-center">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Niche Name */}
                    <span className={`text-xs leading-tight line-clamp-2 ${
                      isActive ? 'font-medium text-white' : 'font-medium text-zinc-700'
                    }`}>
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
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check size={14} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-950">
                      Primary Niche Selected: <span>{selectedNicheName}</span>
                    </p>
                    <p className="text-[11px] text-emerald-700 font-normal mt-0.5">
                      You can add secondary niches or adjust this anytime from creator settings.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </main>

      {/* ── STICKY BOTTOM HUD BAR ────────────────────────────────────────── */}
      <div className="fixed bottom-4 inset-x-3 sm:bottom-6 sm:inset-x-4 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-zinc-200/90 p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-3 pointer-events-auto shadow-[0_12px_36px_rgba(0,0,0,0.1)]">
          
          <div className="flex items-center gap-2.5 pl-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
              <div
                className={`w-2 h-2 rounded-full ${
                  selectedNiche
                    ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                    : 'bg-zinc-400'
                }`}
              />
            </div>

            <div className="min-w-0">
              <p className="text-[9.5px] font-medium text-zinc-400 uppercase tracking-wider leading-none mb-0.5">
                Niche Status
              </p>
              <p className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                {selectedNiche ? selectedNicheName : 'Select a niche above'}
              </p>
            </div>
          </div>

          <Button
            size="lg"
            disabled={!selectedNiche || isSubmitting}
            onClick={handleContinue}
            className={`h-10 sm:h-11 px-5 sm:px-7 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 border-none shrink-0 cursor-pointer ${
              selectedNiche
                ? 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs active:scale-95'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                <span>Continue to Details</span>
                <ArrowRight size={14} strokeWidth={2} />
              </>
            )}
          </Button>
        </div>
      </div>

    </div>
  );
}
