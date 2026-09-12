import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, UserPlus, Check, MoreHorizontal } from 'lucide-react';

interface SocialLink {
  type: 'youtube' | 'instagram' | 'linkedin' | 'tiktok' | 'x' | 'spotify' | 'twitch';
}

interface CreatorCardData {
  id: string;
  name: string;
  username: string;
  category: string;
  theme: 'dark' | 'light';
  image: string;
  scriptNote: string;
  bio: string;
  socials: SocialLink[];
  extraSocialsCount: number;
}

const CREATORS: CreatorCardData[] = [
  {
    id: 'arjun-k',
    name: 'Arjun K',
    username: '@arjunkodes',
    category: 'Tech',
    theme: 'dark',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=600&auto=format&fit=crop&crop=face&q=85',
    scriptNote: 'Code\nCreate\nEducate',
    bio: 'Simplifying tech for the next generation.',
    socials: [{ type: 'youtube' }, { type: 'instagram' }, { type: 'linkedin' }],
    extraSocialsCount: 2,
  },
  {
    id: 'meera-s',
    name: 'Meera S',
    username: '@meera.creates',
    category: 'Design',
    theme: 'light',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=600&auto=format&fit=crop&crop=face&q=85',
    scriptNote: 'Design\nfor a\nbetter\ntomorrow',
    bio: 'Design | Productivity | Creator Life',
    socials: [{ type: 'youtube' }, { type: 'instagram' }, { type: 'tiktok' }],
    extraSocialsCount: 1,
  },
  {
    id: 'karan-v',
    name: 'Karan V',
    username: '@karan.travels',
    category: 'Travel',
    theme: 'dark',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&auto=format&fit=crop&crop=face&q=85',
    scriptNote: 'Explore\nCreate\nInspire',
    bio: 'Traveling the world & sharing real stories.',
    socials: [{ type: 'youtube' }, { type: 'instagram' }, { type: 'x' }],
    extraSocialsCount: 3,
  },
  {
    id: 'ananya-r',
    name: 'Ananya R',
    username: '@ananya.fit',
    category: 'Fitness',
    theme: 'light',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=600&auto=format&fit=crop&crop=face&q=85',
    scriptNote: 'Move\nBreathe\nThrive',
    bio: 'Helping 1M+ live healthier with daily workouts.',
    socials: [{ type: 'youtube' }, { type: 'instagram' }, { type: 'spotify' }],
    extraSocialsCount: 2,
  },
  {
    id: 'rohan-d',
    name: 'Rohan D',
    username: '@rohangaming',
    category: 'Gaming',
    theme: 'dark',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=600&auto=format&fit=crop&crop=face&q=85',
    scriptNote: 'Play\nStream\nConquer',
    bio: 'Next-gen gaming, esports strategy, and setups.',
    socials: [{ type: 'youtube' }, { type: 'twitch' }, { type: 'x' }],
    extraSocialsCount: 4,
  },
  {
    id: 'elena-v',
    name: 'Elena V',
    username: '@elenafilms',
    category: 'Cinema',
    theme: 'light',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&h=600&auto=format&fit=crop&crop=face&q=85',
    scriptNote: 'Frame\nColor\nEmotion',
    bio: 'Cinematography breakdowns and visual stories.',
    socials: [{ type: 'youtube' }, { type: 'instagram' }, { type: 'tiktok' }],
    extraSocialsCount: 2,
  },
];

// Helper to render compact branded social icons
const renderSocialIcon = (type: SocialLink['type']) => {
  switch (type) {
    case 'youtube':
      return (
        <div className="w-5 h-5 rounded-full bg-[#FF0000] flex items-center justify-center shadow-2xs shrink-0" title="YouTube">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
      );
    case 'instagram':
      return (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] flex items-center justify-center shadow-2xs shrink-0" title="Instagram">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-none stroke-current stroke-2">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
          </svg>
        </div>
      );
    case 'linkedin':
      return (
        <div className="w-5 h-5 rounded-full bg-[#0077B5] flex items-center justify-center shadow-2xs shrink-0" title="LinkedIn">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.67a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
          </svg>
        </div>
      );
    case 'tiktok':
      return (
        <div className="w-5 h-5 rounded-full bg-black border border-zinc-700/60 flex items-center justify-center shadow-2xs shrink-0" title="TikTok">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.32a6.34 6.34 0 0 0-6.61 6.3 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.18 8.18 0 0 0 4.79 1.54V6.79c-.53 0-1.04-.03-1.6-.1z" />
          </svg>
        </div>
      );
    case 'x':
      return (
        <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-2xs shrink-0" title="X (Twitter)">
          <svg viewBox="0 0 24 24" className="w-2 h-2 fill-white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      );
    case 'spotify':
      return (
        <div className="w-5 h-5 rounded-full bg-[#1DB954] flex items-center justify-center shadow-2xs shrink-0" title="Spotify">
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.625.625 0 0 1-.86.208c-2.355-1.439-5.32-1.764-8.814-.966a.625.625 0 1 1-.278-1.219c3.824-.875 7.102-.505 9.744 1.117.297.182.39.57.208.86zm1.226-2.724a.782.782 0 0 1-1.077.257c-2.697-1.658-6.809-2.137-9.998-1.17a.782.782 0 1 1-.453-1.498c3.645-1.106 8.196-.57 11.27 1.334a.782.782 0 0 1 .258 1.077zm.105-2.835C14.692 8.92 9.36 8.742 6.273 9.68a.938.938 0 1 1-.544-1.795c3.543-1.076 9.44-.868 13.197 1.362a.937.937 0 1 1-.909 1.642z" />
          </svg>
        </div>
      );
    case 'twitch':
      return (
        <div className="w-5 h-5 rounded-full bg-[#9146FF] flex items-center justify-center shadow-2xs shrink-0" title="Twitch">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
          </svg>
        </div>
      );
    default:
      return null;
  }
};

export const FeaturedCreatorsCarousel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Toggle follow state
  const handleToggleFollow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowingMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Smooth manual navigation
  const handleManualScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const cardStep = 280;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -cardStep : cardStep,
      behavior: 'smooth',
    });
  };

  // Render a single creator card
  const renderCreatorCard = (creator: CreatorCardData, keySuffix: string) => {
    const isDark = creator.theme === 'dark';
    const isFollowing = Boolean(followingMap[creator.id]);

    return (
      <div
        key={`${creator.id}-${keySuffix}`}
        className="w-[220px] xs:w-[235px] sm:w-[260px] shrink-0 flex flex-col select-none group"
      >
        <div
          className={`relative rounded-2xl sm:rounded-[26px] overflow-hidden flex flex-col justify-between h-full border transition-all duration-300 transform-gpu hover:-translate-y-1.5 hover:shadow-xl ${
            isDark
              ? 'bg-zinc-950 text-white border-zinc-800 shadow-[0_8px_24px_rgba(0,0,0,0.22)]'
              : 'bg-white text-zinc-950 border-zinc-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
          }`}
        >
          {/* Card Top: Photo Container with Overlays */}
          <div className="relative w-full h-[155px] xs:h-[170px] sm:h-[185px] overflow-hidden bg-zinc-900">
            <img
              src={creator.image}
              alt={creator.name}
              loading="lazy"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 select-none"
            />

            {/* Gradient Fade into card body */}
            <div
              className={`absolute inset-0 bg-gradient-to-t ${
                isDark
                  ? 'from-zinc-950 via-zinc-950/20 to-black/40'
                  : 'from-white via-white/10 to-black/30'
              }`}
            />

            {/* Top Pill Category Tag */}
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-semibold tracking-wide bg-black/60 backdrop-blur-md text-white border border-white/15 shadow-xs">
                {creator.category}
              </span>
            </div>

            {/* Top Right More Menu Button */}
            <div className="absolute top-2.5 right-2.5 z-10">
              <button
                type="button"
                className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/15 hover:bg-black/80 active:scale-95 transition-all cursor-pointer"
                title="More options"
              >
                <MoreHorizontal size={12} />
              </button>
            </div>

            {/* Floating Handwritten Script on Photo */}
            <div className="absolute bottom-2 right-3 z-10 text-right rotate-[-4deg]">
              <span
                className={`font-['Caveat'] text-xs sm:text-sm font-bold italic tracking-tight leading-tight block drop-shadow-md ${
                  isDark ? 'text-zinc-200' : 'text-zinc-800'
                }`}
              >
                {creator.scriptNote.split('\n').map((line, lIdx) => (
                  <span key={lIdx} className="block leading-none">
                    {line}
                  </span>
                ))}
              </span>
            </div>
          </div>

          {/* Card Bottom: Info & Follow CTA */}
          <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1">
            <div>
              {/* Name + Verified Checkmark Badge */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3
                  className={`text-sm sm:text-base font-black tracking-tight leading-tight ${
                    isDark ? 'text-white' : 'text-zinc-950'
                  }`}
                >
                  {creator.name}
                </h3>
                {/* Verified Checkmark Badge */}
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-white text-zinc-950' : 'bg-zinc-950 text-white'
                  }`}
                  title="Verified Creator"
                >
                  <Check size={8} strokeWidth={3.5} />
                </div>
              </div>

              {/* Username */}
              <p
                className={`text-[10px] sm:text-[11px] font-normal mb-1.5 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                {creator.username}
              </p>

              {/* Bio / Description */}
              <p
                className={`text-[10.5px] sm:text-xs font-normal leading-snug line-clamp-2 mb-3 ${
                  isDark ? 'text-zinc-300' : 'text-zinc-700'
                }`}
              >
                {creator.bio}
              </p>
            </div>

            <div>
              {/* Social Media Links Row */}
              <div className="flex items-center gap-1.5 mb-3">
                {creator.socials.map((social, sIdx) => (
                  <div key={sIdx} className="cursor-pointer hover:scale-110 active:scale-95 transition-transform">
                    {renderSocialIcon(social.type)}
                  </div>
                ))}

                {/* Extra socials counter */}
                {creator.extraSocialsCount > 0 && (
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isDark
                        ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                    }`}
                  >
                    +{creator.extraSocialsCount}
                  </span>
                )}
              </div>

              {/* Follow CTA Button */}
              <button
                type="button"
                onClick={(e) => handleToggleFollow(creator.id, e)}
                className={`w-full py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer shadow-2xs ${
                  isFollowing
                    ? 'bg-emerald-600 text-white'
                    : isDark
                    ? 'bg-white hover:bg-zinc-100 text-zinc-950'
                    : 'bg-zinc-950 hover:bg-black text-white'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check size={13} strokeWidth={2.5} />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={13} />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className={`relative w-full py-6 sm:py-10 bg-white overflow-hidden select-none font-sans ${className}`}>
      
      {/* ── HIGH-PERFORMANCE GPU KEYFRAME ANIMATION (0% CPU, 120 FPS) ── */}
      <style>{`
        @keyframes svxMarqueeInfinite {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .svx-marquee-track {
          display: flex;
          width: max-content;
          animation: svxMarqueeInfinite 38s linear infinite;
          will-change: transform;
        }
        .svx-marquee-wrapper:hover .svx-marquee-track,
        .svx-marquee-wrapper:focus-within .svx-marquee-track {
          animation-play-state: paused !important;
        }
      `}</style>

      <div className="w-full max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        
        {/* ── 1. HEADER SECTION ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 sm:mb-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Top Tag: FEATURED CREATORS */}
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1 block">
              FEATURED CREATORS
            </span>

            {/* Main Title: Real Creators. Real Impact. */}
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight leading-[1.1]">
              Real Creators. <br />
              <span>Real </span>
              <span className="font-['Playfair_Display'] italic font-normal tracking-normal text-zinc-950">
                Impact.
              </span>
            </h2>

            {/* Subtitle Description */}
            <p className="text-[11px] sm:text-xs text-zinc-500 max-w-lg font-normal leading-relaxed mt-1.5">
              Meet creators who are building, sharing, and growing with SuviX. Different passions. One bigger tomorrow.
            </p>
          </motion.div>

          {/* Right Controls: Arrow Buttons + Inspiring Creators Everyday Stack */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: 10 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start sm:items-end gap-2 shrink-0"
          >
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleManualScroll('left')}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-zinc-200 bg-white flex items-center justify-center text-zinc-800 shadow-2xs hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer"
                title="Previous Creators"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleManualScroll('right')}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-zinc-200 bg-white flex items-center justify-center text-zinc-800 shadow-2xs hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer"
                title="Next Creators"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="flex flex-col items-start sm:items-end text-left sm:text-right">
              <span className="w-5 h-[1.5px] bg-zinc-300 rounded-full mb-0.5 inline-block" />
              <span className="text-[7.5px] sm:text-[8.5px] font-extrabold uppercase tracking-[0.2em] text-zinc-400 leading-tight">
                INSPIRING
              </span>
              <span className="text-[7.5px] sm:text-[8.5px] font-extrabold uppercase tracking-[0.2em] text-zinc-400 leading-tight">
                CREATORS
              </span>
              <span className="text-[7.5px] sm:text-[8.5px] font-extrabold uppercase tracking-[0.2em] text-zinc-400 leading-tight">
                EVERYDAY
              </span>
            </div>
          </motion.div>
        </div>

      </div>

      {/* ── 2. INFINITE CONTINUOUS HARDWARE-ACCELERATED CAROUSEL ── */}
      <motion.div
        initial={{ opacity: 0, y: 35, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: false, amount: 0.1 }}
        transition={{ duration: 1.05, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full relative overflow-hidden svx-marquee-wrapper py-1 transform-gpu"
      >
        {/* Soft edge blur masks on left and right for seamless cinematic bleed */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto no-scrollbar scroll-smooth"
        >
          <div className="svx-marquee-track flex gap-3 sm:gap-4.5 px-3 sm:px-6 py-1">
            {/* Set 1: Original Cards */}
            <div className="flex gap-3 sm:gap-4.5 shrink-0">
              {CREATORS.map((creator) => renderCreatorCard(creator, 'set1'))}
            </div>

            {/* Set 2: Seamless Infinite Duplicate Clone */}
            <div className="flex gap-3 sm:gap-4.5 shrink-0" aria-hidden="true">
              {CREATORS.map((creator) => renderCreatorCard(creator, 'set2'))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 3. BOTTOM SUBTEXT & ACCENT ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.15 }}
        transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-7xl mx-auto px-4 mt-3 flex flex-col items-center justify-center text-center transform-gpu"
      >
        <div className="flex items-center gap-1 mb-1">
          <span className="w-4.5 h-1 rounded-full bg-zinc-950 inline-block" />
          <span className="w-1.5 h-1 rounded-full bg-zinc-300 inline-block" />
          <span className="w-1.5 h-1 rounded-full bg-zinc-300 inline-block" />
          <span className="w-1.5 h-1 rounded-full bg-zinc-300 inline-block" />
        </div>

        <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400">
          Creators across the world are growing with SuviX
        </span>
      </motion.div>
    </section>
  );
};
