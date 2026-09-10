import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plane, PawPrint, Laptop, Eye, Play, Sparkles, Film } from 'lucide-react';

import video1V from '../../assets/cardassets/video1V.mp4';
import video2V from '../../assets/cardassets/video2V.mp4';
import video3V from '../../assets/cardassets/video3V.mp4';
import video4V from '../../assets/cardassets/video4V.mp4';
import video5H from '../../assets/cardassets/video5H.mp4';
import video6H from '../../assets/cardassets/video6H.mp4';

export interface ReelCardItem {
  id: string;
  category: string;
  categoryIcon: 'lifestyle' | 'travel' | 'pets' | 'tech' | 'cinema' | 'studio';
  title: string;
  views: string;
  imageUrl: string;
  videoUrl?: string;
}

// ── 6 DYNAMIC REEL CARDS (Sequential order matching UI reference) ───────────
const REEL_CARDS: ReelCardItem[] = [
  {
    id: 'card-studio',
    category: 'Studio',
    categoryIcon: 'studio',
    title: 'Small Moments\nBig Stories',
    views: '1.8M',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    videoUrl: video1V,
  },
  {
    id: 'card-pets',
    category: 'Pets',
    categoryIcon: 'pets',
    title: 'Happiness\nLooks Good\nOn You',
    views: '892K',
    imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80',
    videoUrl: video2V,
  },
  {
    id: 'card-tech',
    category: 'Tech',
    categoryIcon: 'tech',
    title: 'Future of\nCreator AI',
    views: '3.1M',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    videoUrl: video3V,
  },
  {
    id: 'card-cinema',
    category: 'Cinema',
    categoryIcon: 'cinema',
    title: 'Wild Coast\nExpeditions',
    views: '4.2M',
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80',
    videoUrl: video6H,
  },
  {
    id: 'card-lifestyle',
    category: 'Lifestyle',
    categoryIcon: 'lifestyle',
    title: 'Mastering\nThe Daily Vlog',
    views: '655K',
    imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
    videoUrl: video5H,
  },
  {
    id: 'card-travel',
    category: 'Travel',
    categoryIcon: 'travel',
    title: 'Find\nNew Places',
    views: '2.4M',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    videoUrl: video4V,
  },
];

interface HeroReelsFanShowcaseProps {
  className?: string;
}

// ── SUB-COMPONENT: SINGLE REEL CARD WITH FLOAT ANIMATION & VIDEO ────────────
interface SingleCardProps {
  card: ReelCardItem;
  offset: number;
  isCenter: boolean;
  onSelect: () => void;
}

const SingleReelCard = React.memo(function SingleReelCard({
  card,
  offset,
  isCenter,
  onSelect,
}: SingleCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // When card enters Center slot, smoothly play video. When leaves, pause.
  useEffect(() => {
    if (isCenter && videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
            }
          });
      }
    } else if (!isCenter && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isCenter]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const renderBadgeIcon = (icon: ReelCardItem['categoryIcon']) => {
    switch (icon) {
      case 'travel':
        return <Plane size={7} className="text-white fill-white shrink-0 sm:w-2 sm:h-2" />;
      case 'lifestyle':
        return <Heart size={7} className="text-white fill-white shrink-0 sm:w-2 sm:h-2" />;
      case 'pets':
        return <PawPrint size={7} className="text-white fill-white shrink-0 sm:w-2 sm:h-2" />;
      case 'tech':
        return <Laptop size={7} className="text-white shrink-0 sm:w-2 sm:h-2" />;
      case 'cinema':
        return <Film size={7} className="text-white shrink-0 sm:w-2 sm:h-2" />;
      default:
        return <Sparkles size={7} className="text-white shrink-0 sm:w-2 sm:h-2" />;
    }
  };

  // ── MATHEMATICAL 3D FAN POSITIONS BASED ON OFFSET RELATIVE TO CENTER ──────
  // Center card is tilted towards the first column (left: -2.8deg), side cards fan outward
  const getMotionProps = (off: number) => {
    switch (off) {
      case 0:
        // Active Center Card (Foreground Hero: enlarged scale 1.10)
        return {
          x: '0%',
          y: '0%',
          rotate: -2.8,
          scale: 1.10,
          zIndex: 30,
          opacity: 1,
          pointerEvents: 'auto' as const,
        };
      case 1:
        // Immediate Right Card (Pets - Tilted clockwise ~6deg, scale 0.84)
        return {
          x: '42%',
          y: '4%',
          rotate: 6.0,
          scale: 0.84,
          zIndex: 20,
          opacity: 1,
          pointerEvents: 'auto' as const,
        };
      case -1:
        // Immediate Left Card (Travel - Tilted counter-clockwise ~ -8.5deg, scale 0.84)
        return {
          x: '-42%',
          y: '4%',
          rotate: -8.5,
          scale: 0.84,
          zIndex: 20,
          opacity: 1,
          pointerEvents: 'auto' as const,
        };
      case 2:
        // Far Right Card (Desktop/Tablet queue)
        return {
          x: '72%',
          y: '10%',
          rotate: 13.0,
          scale: 0.68,
          zIndex: 10,
          opacity: 0.85,
          pointerEvents: 'auto' as const,
        };
      case -2:
        // Far Left Card (Desktop/Tablet queue)
        return {
          x: '-72%',
          y: '10%',
          rotate: -15.0,
          scale: 0.68,
          zIndex: 10,
          opacity: 0.85,
          pointerEvents: 'auto' as const,
        };
      default:
        // Distant background queue
        return {
          x: off > 0 ? '100%' : '-100%',
          y: '20%',
          rotate: off > 0 ? 20 : -20,
          scale: 0.5,
          zIndex: 0,
          opacity: 0,
          pointerEvents: 'none' as const,
        };
    }
  };

  const motionStyles = getMotionProps(offset);

  return (
    <motion.div
      initial={false}
      animate={{
        x: motionStyles.x,
        y: motionStyles.y,
        rotate: motionStyles.rotate,
        scale: motionStyles.scale,
        zIndex: motionStyles.zIndex,
        opacity: motionStyles.opacity,
      }}
      transition={{
        duration: 1.15, // Slow, very smooth luxurious conveyor transition
        ease: [0.16, 1, 0.3, 1], // Custom smooth ease
      }}
      onClick={onSelect}
      style={{
        zIndex: motionStyles.zIndex,
        pointerEvents: motionStyles.pointerEvents,
        transformOrigin: '50% 88%',
      }}
      className={`absolute ${
        Math.abs(offset) >= 2 ? 'hidden sm:block ' : ''
      }w-[76px] xs:w-[88px] sm:w-[135px] md:w-[155px] xl:w-[175px] aspect-[9/15.6] rounded-[13px] sm:rounded-[18px] overflow-hidden select-none cursor-pointer transition-shadow duration-300 ${
        isCenter
          ? 'shadow-[0_20px_45px_-8px_rgba(0,0,0,0.65)] border-[2.2px] sm:border-[3px] border-white ring-1 ring-white/30'
          : 'shadow-[0_10px_24px_rgba(0,0,0,0.45)] border-[1.6px] sm:border-[2.5px] border-white/95 hover:border-white hover:brightness-105'
      }`}
    >
      {/* ── Continuous Smooth GPU Floating Layer for Side Cards ── */}
      <div
        className={`w-full h-full relative ${
          !isCenter
            ? offset < 0
              ? 'animate-reel-float-left'
              : 'animate-reel-float-right'
            : ''
        }`}
      >
        {/* Dynamic Video Media or High-Resolution Poster */}
        {card.videoUrl ? (
          <video
            ref={videoRef}
            src={card.videoUrl}
            poster={card.imageUrl}
            autoPlay={isCenter}
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          />
        ) : (
          <img
            src={card.imageUrl}
            alt={card.category}
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          />
        )}

        {/* Seamless contrast gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/45 pointer-events-none" />

        {/* Subtle snow / depth-of-field glass overlay on far cards */}
        {Math.abs(offset) === 2 && (
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[0.5px] pointer-events-none rounded-[inherit] z-20" />
        )}

        {/* Category Pill Badge */}
        <div
          className={`absolute top-1.5 xs:top-2 sm:top-3 z-10 whitespace-nowrap ${
            isCenter ? 'left-1/2 -translate-x-1/2' : 'left-1.5 xs:left-2 sm:left-3'
          }`}
        >
          <div className="flex items-center gap-1 px-1.5 xs:px-2 sm:px-2.5 py-0.5 rounded-full bg-black/55 backdrop-blur-md border border-white/25 text-white text-[7.5px] xs:text-[8px] sm:text-[9px] font-medium sm:font-semibold shadow-xs">
            {renderBadgeIcon(card.categoryIcon)}
            <span>{card.category}</span>
          </div>
        </div>

        {/* Bottom Content & Play Button */}
        <div className="absolute bottom-1.5 xs:bottom-2 sm:bottom-3 left-1.5 xs:left-2 sm:left-3 right-1.5 xs:right-2 sm:right-3 z-10 flex items-end justify-between gap-1">
          <div className="flex flex-col text-left min-w-0">
            <h3
              className={`text-white leading-[1.12] whitespace-pre-line tracking-tight drop-shadow-md transition-all ${
                isCenter
                  ? 'text-[9px] xs:text-[10.5px] sm:text-[12.5px] md:text-[13.5px] font-semibold sm:font-bold'
                  : 'text-[6.5px] xs:text-[7.5px] sm:text-[9.5px] font-medium'
              }`}
            >
              {card.title}
            </h3>
            <div className="flex items-center gap-0.5 xs:gap-1 mt-0.5 text-white text-[7px] xs:text-[8px] sm:text-[9px] font-normal sm:font-medium drop-shadow-md">
              <Eye size={8} className="text-white fill-white shrink-0" />
              <span>{card.views}</span>
            </div>
          </div>

          {/* Circular Frosted Glass Play Button */}
          {isCenter ? (
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-5.5 h-5.5 xs:w-6.5 xs:h-6.5 sm:w-8 sm:h-8 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/35 flex items-center justify-center text-white shadow-md cursor-pointer shrink-0 transition-transform active:scale-95 hover:scale-105"
            >
              <Play
                size={8}
                className={`text-white fill-white ml-0.5 transition-transform ${
                  isPlaying ? 'scale-90' : 'scale-100'
                }`}
              />
            </button>
          ) : (
            <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 rounded-full bg-black/50 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0 opacity-85">
              <Play size={5} className="fill-white ml-0.5" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// ── MAIN FAN SHOWCASE COMPONENT WITH 5-SECOND CONVEYOR TIMER ─────────────────
export function HeroReelsFanShowcase({ className = '' }: HeroReelsFanShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const cardCount = REEL_CARDS.length;

  // ── 5-SECOND SEQUENTIAL CONVEYOR ROTATION TIMER ─────────────────────────────
  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      setActiveIndex((curr) => (curr + 1) % cardCount);
    }, 5000); // Plays for exactly 5 seconds, then slowly and smoothly advances

    return () => clearInterval(timer);
  }, [isHovered, cardCount]);

  return (
    <div
      className={`relative w-full max-w-[260px] xs:max-w-[290px] sm:max-w-[345px] md:max-w-[375px] xl:max-w-[395px] mx-auto select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── DOODLE 1: Top "Real Stories Real People" (Top-right on mobile, Top-left on desktop) ── */}
      <div className="absolute -top-1 xs:top-0 sm:-top-10 md:-top-12 right-0 sm:right-auto sm:-left-6 md:-left-8 z-40 pointer-events-none -rotate-6">
        <div
          style={{ fontFamily: "'Caveat', cursive" }}
          className="text-zinc-900 font-bold text-[11.5px] xs:text-[13px] sm:text-lg xl:text-[21px] leading-[0.95] drop-shadow-2xs text-right sm:text-left"
        >
          <span>Real Stories</span>
          <br />
          <span>Real People</span>
        </div>
        {/* Hand-drawn organic double underline stroke */}
        <svg
          viewBox="0 0 120 16"
          className="w-11 xs:w-13 sm:w-22 text-zinc-900 fill-none stroke-current stroke-[2] stroke-linecap-round mt-0.5 ml-auto sm:ml-0"
        >
          <path d="M4 6 Q 60 12, 116 5" />
          <path d="M12 11 Q 58 15, 96 10" />
        </svg>
      </div>

      {/* ── DOODLE 2: Top-Right Curved Arrow + "Discover Create Share Grow ~" (Desktop/Tablet only) ── */}
      <div className="hidden sm:flex absolute -top-9 sm:-top-11 md:-top-13 -right-3 sm:-right-6 md:-right-8 z-40 pointer-events-none items-start gap-1">
        {/* Curved arrow pointing down-left toward the cards */}
        <svg
          viewBox="0 0 45 45"
          className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-zinc-800 fill-none stroke-current stroke-[2] stroke-linecap-round stroke-linejoin-round mt-0.5 shrink-0 -rotate-6"
        >
          <path d="M36 6 C 22 10, 10 22, 12 37" />
          <path d="M6 30 L 12 37 L 20 33" />
        </svg>
        <div
          style={{ fontFamily: "'Caveat', cursive" }}
          className="text-zinc-800 font-bold text-[11px] sm:text-xs leading-tight -rotate-2 text-left"
        >
          <p>Discover</p>
          <p>Create</p>
          <p>Share</p>
          <p>Grow</p>
          <p className="text-[9px] text-zinc-500 font-normal">~</p>
        </div>
      </div>

      {/* ── 3D REELS CAROUSEL CONVEYOR ── */}
      <div className="relative w-full h-[175px] xs:h-[195px] sm:h-[265px] md:h-[290px] xl:h-[310px] flex items-center justify-center pt-1">
        {REEL_CARDS.map((card, idx) => {
          // Calculate circular offset relative to center activeIndex
          let offset = (idx - activeIndex) % cardCount;
          if (offset > cardCount / 2) offset -= cardCount;
          if (offset < -cardCount / 2) offset += cardCount;

          return (
            <SingleReelCard
              key={card.id}
              card={card}
              offset={offset}
              isCenter={offset === 0}
              onSelect={() => setActiveIndex(idx)}
            />
          );
        })}
      </div>

      {/* ── DOODLE 3: Bottom-Right "Create a Brighter Tomorrow" (Positioned below the cards, not overlapping) ── */}
      <div className="absolute -bottom-5 xs:-bottom-6 sm:-bottom-8 md:-bottom-9 right-0 sm:-right-5 md:-right-7 z-20 pointer-events-none -rotate-6">
        <div
          style={{ fontFamily: "'Caveat', cursive" }}
          className="text-zinc-900 font-bold text-[10.5px] xs:text-[11.5px] sm:text-sm xl:text-[15px] leading-tight text-right"
        >
          <span>Create a</span>
          <br />
          <span>Brighter Tomorrow</span>
        </div>
        {/* Hand-drawn double underline */}
        <svg
          viewBox="0 0 100 14"
          className="w-11 xs:w-13 sm:w-17 text-zinc-900 fill-none stroke-current stroke-[1.8] stroke-linecap-round ml-auto mt-0.5"
        >
          <path d="M3 5 Q 50 11, 97 4" />
          <path d="M10 10 Q 48 14, 86 9" />
        </svg>
      </div>

      {/* ── CAROUSEL PAGINATION PILL DOTS (Clean separation below the cards) ── */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 mt-1.5 xs:mt-2 sm:mt-7 xl:mt-8 z-30 relative">
        {REEL_CARDS.map((card, i) => {
          const isActive = activeIndex === i;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Showcase Reel ${i + 1}`}
              className={`h-0.8 sm:h-1.2 rounded-full transition-all duration-500 cursor-pointer ${
                isActive
                  ? 'w-4 sm:w-7 bg-black shadow-xs'
                  : 'w-2.5 sm:w-5 bg-zinc-300 hover:bg-zinc-400'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
