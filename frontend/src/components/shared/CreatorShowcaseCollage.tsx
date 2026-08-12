import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, Zap, Award, Film, Music } from 'lucide-react';
import logo from '../../assets/logo.png';

// ── Local Showcase Video Assets ───────────────────────────────────────────
import video1V from '../../assets/cardassets/video1V.mp4';
import video2V from '../../assets/cardassets/video2V.mp4';
import video3V from '../../assets/cardassets/video3V.mp4';
import video4V from '../../assets/cardassets/video4V.mp4';
import video5H from '../../assets/cardassets/video5H.mp4';
import video6H from '../../assets/cardassets/video6H.mp4';

interface CreatorCardData {
  id: string;
  name: string;
  handle: string;
  subscribers: string;
  avatar: string;
  mediaUrl: string;
  videoUrl?: string;
  mediaType: 'short' | 'video';
  tag?: string;
  badgeIcon?: 'growth' | 'verified' | 'viral' | 'award' | 'film' | 'music';
  positionClass: string;
  rotation: number;
  zIndex: number;
  chipPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  animClass: string;
}

interface SlotPortalConfig {
  positionClass: string;
  zIndex: number;
  animClass: string;
  chipPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  portalVector: { x: number; y: number; rotate: number };
}

// ── 5 STATIC ORBITAL SLOTS WITH DIRECTIONAL VECTORS TO THE CENTRAL LOGO ────
const ORBITAL_SLOTS: SlotPortalConfig[] = [
  // Slot 0: Top-Left (Moves down-right towards center)
  {
    positionClass: 'w-[42%] sm:w-[38%] aspect-[3/4] top-[0%] left-[2%]',
    zIndex: 20,
    animClass: 'animate-float-1',
    chipPosition: 'bottom-right',
    portalVector: { x: 120, y: 110, rotate: -25 },
  },
  // Slot 1: Top-Right (Moves down-left towards center)
  {
    positionClass: 'w-[44%] sm:w-[42%] aspect-[3/4.2] top-[2%] right-[1%]',
    zIndex: 25,
    animClass: 'animate-float-2',
    chipPosition: 'bottom-left',
    portalVector: { x: -120, y: 110, rotate: 25 },
  },
  // Slot 2: Bottom-Left (Moves up-right towards center)
  {
    positionClass: 'w-[46%] sm:w-[42%] aspect-[16/11] bottom-[12%] left-[0%]',
    zIndex: 15,
    animClass: 'animate-float-3',
    chipPosition: 'bottom-right',
    portalVector: { x: 110, y: -90, rotate: 20 },
  },
  // Slot 3: Bottom-Center (Moves straight up towards center)
  {
    positionClass: 'w-[40%] sm:w-[36%] aspect-[3/4] bottom-[0%] left-[30%]',
    zIndex: 35,
    animClass: 'animate-float-4',
    chipPosition: 'bottom-left',
    portalVector: { x: 15, y: -130, rotate: -15 },
  },
  // Slot 4: Bottom-Right (Moves up-left towards center)
  {
    positionClass: 'w-[46%] sm:w-[44%] aspect-[16/11] bottom-[8%] right-[0%]',
    zIndex: 18,
    animClass: 'animate-float-5',
    chipPosition: 'bottom-left',
    portalVector: { x: -110, y: -90, rotate: -20 },
  },
];

// ── 3 DIVERSE CREATOR ROTATION SETS (5 cards each) ──────────────────────────
const SHOWCASE_SETS: CreatorCardData[][] = [
  // ── SET 1: Elite Content Creators & Educators ──
  [
    {
      id: 'set1-vanessa',
      name: 'Vanessa Lau',
      handle: '@VanessaLau',
      subscribers: '954K subs',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=520&auto=format&fit=crop&q=75',
      videoUrl: video1V,
      mediaType: 'short',
      tag: '⚡ Top Educator',
      badgeIcon: 'verified',
      positionClass: '',
      rotation: -5,
      zIndex: 20,
      chipPosition: 'bottom-right',
      animClass: 'animate-float-1',
    },
    {
      id: 'set1-jenny',
      name: 'Jenny Hoyos',
      handle: '@JennyHoyos',
      subscribers: '9.2M subs',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=580&auto=format&fit=crop&q=75',
      videoUrl: video2V,
      mediaType: 'short',
      tag: '🔥 100M+ Views',
      badgeIcon: 'viral',
      positionClass: '',
      rotation: 5,
      zIndex: 25,
      chipPosition: 'bottom-left',
      animClass: 'animate-float-2',
    },
    {
      id: 'set1-sauce',
      name: 'Sauce Stache',
      handle: '@SauceStache',
      subscribers: '655K subs',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=450&h=300&auto=format&fit=crop&q=75',
      videoUrl: video5H,
      mediaType: 'video',
      tag: '🍳 Studio Creator',
      badgeIcon: 'growth',
      positionClass: '',
      rotation: -3,
      zIndex: 15,
      chipPosition: 'bottom-right',
      animClass: 'animate-float-3',
    },
    {
      id: 'set1-danie',
      name: 'Danie Jay',
      handle: '@DanieJay',
      subscribers: '120K subs',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=520&auto=format&fit=crop&q=75',
      videoUrl: video3V,
      mediaType: 'short',
      tag: '📈 +310% YoY',
      badgeIcon: 'growth',
      positionClass: '',
      rotation: 2,
      zIndex: 35,
      chipPosition: 'bottom-left',
      animClass: 'animate-float-4',
    },
    {
      id: 'set1-devin',
      name: 'Devin Super Tramp',
      handle: '@devinsupertramp',
      subscribers: '6.4M subs',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      videoUrl: video6H,
      mediaType: 'video',
      tag: '🎬 4K Action Films',
      badgeIcon: 'film',
      positionClass: '',
      rotation: 4,
      zIndex: 18,
      chipPosition: 'bottom-left',
      animClass: 'animate-float-5',
    },
  ],

  // ── SET 2: Cinematic Video Editors & Visual Artists ──
  [
    {
      id: 'set2-daniel',
      name: 'Daniel Schiffer',
      handle: '@DanielSchiffer',
      subscribers: '2.8M subs',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=520&auto=format&fit=crop&q=75',
      videoUrl: video4V,
      mediaType: 'short',
      tag: '🎥 Commercial VFX',
      badgeIcon: 'award',
      positionClass: '',
      rotation: -5,
      zIndex: 20,
      chipPosition: 'bottom-right',
      animClass: 'animate-float-1',
    },
    {
      id: 'set2-sam',
      name: 'Sam Kolder',
      handle: '@SamKolder',
      subscribers: '1.6M subs',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=580&auto=format&fit=crop&q=75',
      videoUrl: video1V,
      mediaType: 'short',
      tag: '🌊 Drone & Travel',
      badgeIcon: 'viral',
      positionClass: '',
      rotation: 5,
      zIndex: 25,
      chipPosition: 'bottom-left',
      animClass: 'animate-float-2',
    },
    {
      id: 'set2-peter',
      name: 'Peter McKinnon',
      handle: '@PeterMcKinnon',
      subscribers: '5.9M subs',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=450&h=300&auto=format&fit=crop&q=75',
      videoUrl: video6H,
      mediaType: 'video',
      tag: '☕ Storytelling',
      badgeIcon: 'verified',
      positionClass: '',
      rotation: -3,
      zIndex: 15,
      chipPosition: 'bottom-right',
      animClass: 'animate-float-3',
    },
    {
      id: 'set2-justin',
      name: 'Justin Odisho',
      handle: '@JustinOdisho',
      subscribers: '1.3M subs',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=520&auto=format&fit=crop&q=75',
      videoUrl: video2V,
      mediaType: 'short',
      tag: '⚡ Premiere VFX',
      badgeIcon: 'growth',
      positionClass: '',
      rotation: 2,
      zIndex: 35,
      chipPosition: 'bottom-left',
      animClass: 'animate-float-4',
    },
    {
      id: 'set2-cinecom',
      name: 'Jordy Vandeput',
      handle: '@CinecomNet',
      subscribers: '2.5M subs',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=450&h=300&auto=format&fit=crop&q=75',
      videoUrl: video5H,
      mediaType: 'video',
      tag: '✨ Motion Design',
      badgeIcon: 'film',
      positionClass: '',
      rotation: 4,
      zIndex: 18,
      chipPosition: 'bottom-left',
      animClass: 'animate-float-5',
    },
  ],

  // ── SET 3: Tech, Audio & Entrepreneur Influencers ──
  [
    {
      id: 'set3-mkbhd',
      name: 'Marques Brownlee',
      handle: '@MKBHD',
      subscribers: '18.5M subs',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=520&auto=format&fit=crop&q=75',
      videoUrl: video3V,
      mediaType: 'short',
      tag: '📱 Tech Elite',
      badgeIcon: 'award',
      positionClass: '',
      rotation: -5,
      zIndex: 20,
      chipPosition: 'bottom-right',
      animClass: 'animate-float-1',
    },
    {
      id: 'set3-ali',
      name: 'Ali Abdaal',
      handle: '@AliAbdaal',
      subscribers: '5.4M subs',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=580&auto=format&fit=crop&q=75',
      videoUrl: video4V,
      mediaType: 'short',
      tag: '🚀 Growth Systems',
      badgeIcon: 'growth',
      positionClass: '',
      rotation: 5,
      zIndex: 25,
      chipPosition: 'bottom-left',
      animClass: 'animate-float-2',
    },
    {
      id: 'set3-andrew',
      name: 'Andrew Huang',
      handle: '@AndrewHuang',
      subscribers: '2.4M subs',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=450&h=300&auto=format&fit=crop&q=75',
      videoUrl: video5H,
      mediaType: 'video',
      tag: '🎵 Music Production',
      badgeIcon: 'music',
      positionClass: '',
      rotation: -3,
      zIndex: 15,
      chipPosition: 'bottom-right',
      animClass: 'animate-float-3',
    },
    {
      id: 'set3-sara',
      name: 'Sara Dietschy',
      handle: '@SaraDietschy',
      subscribers: '920K subs',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=520&auto=format&fit=crop&q=75',
      videoUrl: video1V,
      mediaType: 'short',
      tag: '🎙️ Creative Studio',
      badgeIcon: 'verified',
      positionClass: '',
      rotation: 2,
      zIndex: 35,
      chipPosition: 'bottom-left',
      animClass: 'animate-float-4',
    },
    {
      id: 'set3-finance',
      name: 'Sara Finance',
      handle: '@SaraFinance',
      subscribers: '1.2M subs',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&auto=format&fit=crop&crop=faces&q=75',
      mediaUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=450&h=300&auto=format&fit=crop&q=75',
      videoUrl: video6H,
      mediaType: 'video',
      tag: '💎 Monetization',
      badgeIcon: 'viral',
      positionClass: '',
      rotation: 4,
      zIndex: 18,
      chipPosition: 'bottom-left',
      animClass: 'animate-float-5',
    },
  ],
];

// ── Showcase Video Component with Reliable Autoplay ────────────────────────
function ShowcaseVideo({ videoUrl, poster, alt }: { videoUrl: string; poster: string; alt: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = true;

    const playVideo = () => {
      video.play().catch(() => {
        const retry = () => {
          video.play().catch(() => {});
          window.removeEventListener('touchstart', retry);
          window.removeEventListener('click', retry);
        };
        window.addEventListener('touchstart', retry, { once: true });
        window.addEventListener('click', retry, { once: true });
      });
    };

    if (video.readyState >= 2) {
      playVideo();
    } else {
      video.addEventListener('loadeddata', playVideo, { once: true });
      video.addEventListener('canplay', playVideo, { once: true });
    }

    return () => {
      video.removeEventListener('loadeddata', playVideo);
      video.removeEventListener('canplay', playVideo);
    };
  }, [videoUrl]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-label={alt}
        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
}

// ── INDIVIDUAL CARD SLOT WITH INDEPENDENT 10-SECOND TIMER ───────────────────
interface CreatorCardSlotProps {
  slotIdx: number;
  slotConfig: SlotPortalConfig;
  initialDelayMs: number;
  stayDurationMs: number;
  isDark: boolean;
}

const CreatorCardSlot = React.memo(function CreatorCardSlot({
  slotIdx,
  slotConfig,
  initialDelayMs,
  stayDurationMs,
  isDark,
}: CreatorCardSlotProps) {
  const [setIdx, setSetIdx] = useState(0);

  // Each card slot has an independent 10-second timer
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    // 1. Initial delay so cards rest calmly on page load
    const timeoutId = setTimeout(() => {
      // First card swap
      setSetIdx((prev) => (prev + 1) % SHOWCASE_SETS.length);

      // 2. Once swapped, wait a FULL 10 seconds (stayDurationMs) before swapping again
      intervalId = setInterval(() => {
        setSetIdx((prev) => (prev + 1) % SHOWCASE_SETS.length);
      }, stayDurationMs);
    }, initialDelayMs);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [initialDelayMs, stayDurationMs]);

  const card = SHOWCASE_SETS[setIdx][slotIdx];

  return (
    <div
      style={{ zIndex: slotConfig.zIndex }}
      className={`absolute ${slotConfig.positionClass}`}
    >
      {/* Hardware-Accelerated 60FPS GPU Floating Container */}
      <div className={`relative w-full h-full group cursor-pointer gpu-layer ${slotConfig.animClass}`}>
        {/* 🌀 Portal In/Out Animation: Swallowed into center circle & spawned from center circle */}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`${card.id}-${setIdx}`}
            initial={{
              x: slotConfig.portalVector.x,
              y: slotConfig.portalVector.y,
              scale: 0.08,
              opacity: 0,
              rotate: slotConfig.portalVector.rotate,
            }}
            animate={{
              x: 0,
              y: 0,
              scale: 1,
              opacity: 1,
              rotate: 0,
            }}
            exit={{
              x: slotConfig.portalVector.x,
              y: slotConfig.portalVector.y,
              scale: 0.08,
              opacity: 0,
              rotate: slotConfig.portalVector.rotate,
            }}
            transition={{
              duration: 0.85,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute inset-0 w-full h-full gpu-layer"
          >
            {/* Card Frame with 3D Depth */}
            <div
              className={`relative w-full h-full rounded-[1.4rem] sm:rounded-[1.6rem] overflow-hidden border-[3px] shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105 ${
                isDark
                  ? 'border-white/90 bg-zinc-900 group-hover:shadow-[0_20px_45px_rgba(255,255,255,0.12)]'
                  : 'border-white bg-white group-hover:shadow-[0_20px_45px_rgba(0,0,0,0.22)]'
              }`}
            >
              {card.videoUrl ? (
                <ShowcaseVideo videoUrl={card.videoUrl} poster={card.mediaUrl} alt={card.name} />
              ) : (
                <img
                  src={card.mediaUrl}
                  alt={card.name}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

              {/* Tag / Micro Badge on Image */}
              {card.tag && (
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm border border-white/20 text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  {card.badgeIcon === 'viral' && <Flame size={9} className="text-amber-400 fill-amber-400" />}
                  {card.badgeIcon === 'growth' && <Zap size={9} className="text-emerald-400 fill-emerald-400" />}
                  {card.badgeIcon === 'verified' && <Sparkles size={9} className="text-red-400" />}
                  {card.badgeIcon === 'award' && <Award size={9} className="text-yellow-400" />}
                  {card.badgeIcon === 'film' && <Film size={9} className="text-cyan-400" />}
                  {card.badgeIcon === 'music' && <Music size={9} className="text-pink-400" />}
                  <span>{card.tag}</span>
                </div>
              )}
            </div>

            {/* Creator Identity Chip (Float Overlay Pill) */}
            <div
              className={`absolute ${
                slotConfig.chipPosition === 'bottom-left'
                  ? '-bottom-2.5 -left-2.5 sm:-bottom-3.5 sm:-left-3.5'
                  : '-bottom-2.5 -right-2.5 sm:-bottom-3.5 sm:-right-3.5'
              } z-40 bg-white text-zinc-900 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.3)] border border-zinc-100 pl-1.5 pr-3 py-1 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-transform duration-300 group-hover:scale-105`}
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-900 border border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={card.avatar}
                  alt={card.name}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col leading-tight pr-0.5">
                <span className="text-[9.5px] sm:text-[10.5px] font-black text-zinc-900 tracking-tight">
                  {card.handle}
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold text-zinc-500">{card.subscribers}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

interface CreatorShowcaseCollageProps {
  className?: string;
  theme?: 'dark' | 'light';
}

export const CreatorShowcaseCollage = React.memo(function CreatorShowcaseCollage({
  className = '',
  theme = 'dark',
}: CreatorShowcaseCollageProps) {
  const isDark = theme === 'dark';

  // 🚀 Preload all card media & avatars across all sets for instant 3D swaps
  useEffect(() => {
    SHOWCASE_SETS.flat().forEach((card) => {
      const img1 = new Image();
      img1.src = card.mediaUrl;
      const img2 = new Image();
      img2.src = card.avatar;
    });
  }, []);

  return (
    <div className={`relative w-full aspect-[16/13] max-w-[28rem] xl:max-w-[31rem] mx-auto select-none gpu-layer ${className}`}>
      {/* Ambient Radial Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-red-600/15 via-amber-500/15 to-rose-600/10 rounded-full blur-2xl -z-10 pointer-events-none" />

      {/* 5 Independent Orbital Card Slots — Each card independently waits 10s after exchanging */}
      {ORBITAL_SLOTS.map((slot, slotIdx) => (
        <CreatorCardSlot
          key={`slot-${slotIdx}`}
          slotIdx={slotIdx}
          slotConfig={slot}
          initialDelayMs={10000 + slotIdx * 2000} // Staggered initial starts: 10s, 12s, 14s, 16s, 18s
          stayDurationMs={10000} // Once exchanged, stays calmly displayed for a FULL 10 seconds
          isDark={isDark}
        />
      ))}

      {/* Central Brand Mark / Nexus Center Hub (SuviX Logo) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none gpu-layer">
        <div className="relative flex items-center justify-center animate-hub-pulse gpu-layer">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-[3px] border-white shadow-[0_12px_30px_rgba(0,0,0,0.4)] flex items-center justify-center p-2.5 overflow-hidden">
            <img src={logo} alt="SuviX" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
});
