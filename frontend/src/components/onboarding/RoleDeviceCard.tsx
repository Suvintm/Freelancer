import React from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import {
  Check,
  Video,
  Film,
  Briefcase,
  Users,
  Camera,
  Music,
  Sparkles,
  Heart,
  Play,
  Wifi,
  Mic,
  Activity,
  Star,
  Megaphone,
  User,
} from 'lucide-react';
import type { RoleCategory } from '../../api/services/category.service';
import {
  ROLE_PRESENTATION_MAP,
  PRIMARY_ROLE_CARDS,
  type RolePresentation,
} from '../../features/onboarding/data/roleCardData';

interface RoleDeviceCardProps {
  category: RoleCategory | RolePresentation;
  isSelected: boolean;
  index: number;
  onSelect: () => void;
}

// ── BRAND LOGOS COMPONENT (Phone 3: Nike, Samsung, Zomato, Myntra) ─────────
const BrandLogosRow = () => (
  <div className="w-full bg-white/70 backdrop-blur-md border border-white/50 shadow-md rounded-lg sm:rounded-xl p-0.5 sm:p-1.5 flex items-center justify-between gap-0.5 sm:gap-1 select-none">
    {/* Nike */}
    <div className="flex-1 h-4 sm:h-6 bg-white rounded-md sm:rounded-lg shadow-2xs border border-zinc-100/80 flex items-center justify-center p-0.5 sm:p-1">
      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 sm:w-4 sm:h-4 fill-black">
        <path d="M21.707 5.293c-2.483 3.65-6.074 7.218-10.707 10.707-2.613-2.613-5.32-4.14-8.121-4.586-.537-.086-.989.283-.989.827 0 .37.228.703.577.828 3.86 1.385 7.02 4.417 9.48 9.091.246.467.893.524 1.218.106 3.636-4.667 8.544-11.973 8.542-16.973 0-.414-.414-.707-.828-.707a.994.994 0 0 0-.172.015z" />
      </svg>
    </div>
    {/* Samsung */}
    <div className="flex-1 h-4 sm:h-6 bg-white rounded-md sm:rounded-lg shadow-2xs border border-zinc-100/80 flex items-center justify-center px-0.5 sm:px-1">
      <span className="text-[5.5px] sm:text-[8px] font-black tracking-tighter text-[#1428A0] font-sans">
        SAMSUNG
      </span>
    </div>
    {/* Zomato */}
    <div className="flex-1 h-4 sm:h-6 bg-white rounded-md sm:rounded-lg shadow-2xs border border-zinc-100/80 flex items-center justify-center px-0.5 sm:px-1">
      <span className="text-[6.5px] sm:text-[9.5px] font-black italic text-[#E23744] font-sans tracking-tight">
        zomato
      </span>
    </div>
    {/* Myntra */}
    <div className="flex-1 h-4 sm:h-6 bg-white rounded-md sm:rounded-lg shadow-2xs border border-zinc-100/80 flex items-center justify-center px-0.5 sm:px-1">
      <svg viewBox="0 0 48 36" className="h-2.5 sm:h-3.5 w-auto" fill="none">
        <path d="M4 32V12L12 24L20 12V32" stroke="#FF3F6C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 32V12L28 24L36 12V32" stroke="#F16521" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M36 32V12L44 24" stroke="#F7A200" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

// ── CREATOR STATS GLASS PILL (Phone 1: 12.9K Followers | 3.4M Views) ─────────
const CreatorStatsPill = () => (
  <div className="w-full bg-white/75 backdrop-blur-md border border-white/60 shadow-lg rounded-xl sm:rounded-2xl p-1 sm:p-2 md:p-2.5 flex items-center justify-around gap-1 sm:gap-2 select-none">
    <div className="flex items-center gap-1 sm:gap-1.5">
      <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
        <Heart size={8} className="sm:w-2.5 sm:h-2.5" fill="currentColor" />
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] sm:text-[11px] font-black text-zinc-950 leading-none">12.9K</span>
        <span className="text-[6px] sm:text-[8px] font-semibold text-zinc-500 leading-tight">Followers</span>
      </div>
    </div>
    <div className="w-[1px] h-3.5 sm:h-5 bg-zinc-300/80" />
    <div className="flex items-center gap-1 sm:gap-1.5">
      <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
        <Play size={7} className="sm:w-2.5 sm:h-2.5 ml-0.5" fill="currentColor" />
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] sm:text-[11px] font-black text-zinc-950 leading-none">3.4M</span>
        <span className="text-[6px] sm:text-[8px] font-semibold text-zinc-500 leading-tight">Views</span>
      </div>
    </div>
  </div>
);

// ── VIDEO EDITOR TIMELINE PREVIEW (Phone 2: Studio Timeline Glow) ───────────
const EditorTimelinePreview = () => (
  <div className="w-full bg-black/60 backdrop-blur-md border border-white/15 shadow-lg rounded-lg sm:rounded-xl p-1 sm:p-2 flex flex-col gap-0.5 sm:gap-1 select-none">
    <div className="flex items-center justify-between text-[6.5px] sm:text-[8px] font-mono text-cyan-300 px-0.5">
      <span>00:01:24:18</span>
      <span className="text-zinc-400">4K • 60 FPS</span>
    </div>
    {/* Multitrack audio & video timeline bars */}
    <div className="w-full h-1 sm:h-1.5 bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
      <div className="w-[45%] h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
      <div className="w-[30%] h-full bg-cyan-400 rounded-full" />
      <div className="w-[25%] h-full bg-rose-500 rounded-full" />
    </div>
    <div className="w-full h-0.5 sm:h-1 bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
      <div className="w-[20%] h-full bg-emerald-400 rounded-full" />
      <div className="w-[50%] h-full bg-amber-400 rounded-full" />
      <div className="w-[30%] h-full bg-blue-400 rounded-full" />
    </div>
  </div>
);

// ── HELPER ICON PICKER ──────────────────────────────────────────────────────
function RoleBadgeIcon({
  iconName,
  size = 10,
  className = '',
}: {
  iconName: string;
  size?: number;
  className?: string;
}) {
  switch (iconName) {
    case 'video':
      return <Video size={size} className={className} strokeWidth={2.4} />;
    case 'film':
      return <Film size={size} className={className} strokeWidth={2.4} />;
    case 'briefcase':
      return <Briefcase size={size} className={className} strokeWidth={2.4} />;
    case 'users':
      return <Users size={size} className={className} strokeWidth={2.4} />;
    case 'user':
      return <User size={size} className={className} strokeWidth={2.4} />;
    case 'camera':
      return <Camera size={size} className={className} strokeWidth={2.4} />;
    case 'music':
      return <Music size={size} className={className} strokeWidth={2.4} />;
    case 'mic':
      return <Mic size={size} className={className} strokeWidth={2.4} />;
    case 'activity':
      return <Activity size={size} className={className} strokeWidth={2.4} />;
    case 'star':
      return <Star size={size} className={className} strokeWidth={2.4} />;
    case 'megaphone':
      return <Megaphone size={size} className={className} strokeWidth={2.4} />;
    default:
      return <Sparkles size={size} className={className} strokeWidth={2.4} />;
  }
}

// ── CONFIGURATION FOR INDIVIDUAL 3D PERSPECTIVE PER PHONE ──────────────────
interface PhonePerspectiveConfig {
  rotateY: number;
  rotateX: number;
  rotateZ: number;
  perspective: number;
  transformOrigin: string;
  edgeShadow: string;
  rimHighlight: string;
  shadowOffset: string;
}

const PHONE_PERSPECTIVES: PhonePerspectiveConfig[] = [
  // Phone 1 — Outward left fan tilt (-3.8° Z), facing slightly inward (+8.5° Y), anchored at bottom center
  {
    rotateY: 8.5,
    rotateX: 4.8,
    rotateZ: -3.8,
    perspective: 1100,
    transformOrigin: '50% 100%',
    edgeShadow:
      '-4px 1.5px 0 1px #2f323c, -8px 3px 0 1.5px #1c1d24, -16px 14px 32px rgba(0,0,0,0.38)',
    rimHighlight: 'border-l-[1.5px] border-l-white/30 border-t-[1px] border-t-white/20',
    shadowOffset: 'translate-x-2',
  },
  // Phone 2 — Gentle inner-left fan tilt (-1.3° Z), facing slightly inward (+2.8° Y), anchored at bottom center
  {
    rotateY: 2.8,
    rotateX: 3.5,
    rotateZ: -1.3,
    perspective: 1200,
    transformOrigin: '50% 100%',
    edgeShadow:
      '-2px 1px 0 0.8px #2b2d35, -4px 2px 0 1px #1a1b20, -10px 10px 24px rgba(0,0,0,0.28)',
    rimHighlight: 'border-l-[1px] border-l-white/20 border-t-[1px] border-t-white/15',
    shadowOffset: 'translate-x-0.5',
  },
  // Phone 3 — Gentle inner-right fan tilt (+1.3° Z), facing slightly inward (-2.8° Y), anchored at bottom center
  {
    rotateY: -2.8,
    rotateX: 3.5,
    rotateZ: 1.3,
    perspective: 1200,
    transformOrigin: '50% 100%',
    edgeShadow:
      '2px 1px 0 0.8px #2b2d35, 4px 2px 0 1px #1a1b20, 10px 10px 24px rgba(0,0,0,0.28)',
    rimHighlight: 'border-r-[1px] border-r-white/20 border-t-[1px] border-t-white/15',
    shadowOffset: '-translate-x-0.5',
  },
  // Phone 4 — Outward right fan tilt (+3.8° Z), facing slightly inward (-8.5° Y), anchored at bottom center
  {
    rotateY: -8.5,
    rotateX: 4.8,
    rotateZ: 3.8,
    perspective: 1100,
    transformOrigin: '50% 100%',
    edgeShadow:
      '4px 1.5px 0 1px #2f323c, 8px 3px 0 1.5px #1c1d24, 16px 14px 32px rgba(0,0,0,0.38)',
    rimHighlight: 'border-r-[1.5px] border-r-white/30 border-t-[1px] border-t-white/20',
    shadowOffset: '-translate-x-2',
  },
];

export const RoleDeviceCard = React.memo(function RoleDeviceCard({
  category,
  isSelected,
  index,
  onSelect,
}: RoleDeviceCardProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Resolve presentation metadata
  const slug = 'slug' in category ? category.slug : '';
  const presentation: RolePresentation =
    ROLE_PRESENTATION_MAP[slug] ||
    PRIMARY_ROLE_CARDS[index % PRIMARY_ROLE_CARDS.length];

  // Dynamic overrides from database category if present
  const displayName =
    'name' in category && category.name ? category.name : presentation.badgeLabel;
  const dynamicIconKey =
    'icon' in category && category.icon ? category.icon : presentation.badgeIcon;

  // Pick unique 3D perspective config per phone
  // On mobile (2-column layout): left col tilts inward facing right, right col tilts inward facing left
  // On desktop (4-column layout): 4 fanned angles
  const phone3D = React.useMemo(() => {
    if (isMobile) {
      const isLeft = index % 2 === 0;
      return {
        rotateY: isLeft ? 6.5 : -6.5,
        rotateX: 4.2,
        rotateZ: isLeft ? -2.4 : 2.4,
        perspective: 1000,
        transformOrigin: '50% 100%',
        edgeShadow: isLeft
          ? '-3px 1.5px 0 1px #2f323c, -6px 2.5px 0 1.5px #1c1d24, -12px 10px 24px rgba(0,0,0,0.35)'
          : '3px 1.5px 0 1px #2f323c, 6px 2.5px 0 1.5px #1c1d24, 12px 10px 24px rgba(0,0,0,0.35)',
        rimHighlight: isLeft
          ? 'border-l-[1.5px] border-l-white/30 border-t-[1px] border-t-white/20'
          : 'border-r-[1.5px] border-r-white/30 border-t-[1px] border-t-white/20',
        shadowOffset: isLeft ? 'translate-x-1.5' : '-translate-x-1.5',
      };
    }
    return PHONE_PERSPECTIVES[index % PHONE_PERSPECTIVES.length];
  }, [isMobile, index]);

  // 3D Magnetic Mouse Spring Physics (Subtle interactive responsive tilt)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const mouseXSpring = useSpring(mouseX, { stiffness: 280, damping: 28 });
  const mouseYSpring = useSpring(mouseY, { stiffness: 280, damping: 28 });

  const rotateX = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    [`${phone3D.rotateX + 3}deg`, `${phone3D.rotateX - 3}deg`]
  );
  const rotateY = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    [`${phone3D.rotateY - 4}deg`, `${phone3D.rotateY + 4}deg`]
  );
  const rotateZ = `${phone3D.rotateZ}deg`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only apply mouse spring on devices with fine pointer / desktop to prevent mobile scrolling stutter
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Split headline text into lines
  const headlineLines = presentation.headlineTop.split('\n');

  return (
    <div
      style={{ perspective: `${phone3D.perspective}px` }}
      className="flex flex-col items-center w-full max-w-[145px] xs:max-w-[155px] sm:max-w-[225px] md:max-w-[262px] mx-auto select-none group"
    >
      {/* ── 1. TOP FLOATING ROLE BADGE ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-3.5 z-30 transition-transform duration-300 group-hover:-translate-y-0.5">
        <div
          className={`w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr ${presentation.badgeBg} flex items-center justify-center text-white shadow-md shadow-zinc-900/10 shrink-0`}
        >
          <RoleBadgeIcon iconName={dynamicIconKey} size={10} className="sm:w-3.5 sm:h-3.5" />
        </div>
        <span className="text-[9.5px] sm:text-xs md:text-sm font-black text-zinc-900 tracking-tight whitespace-nowrap">
          {displayName}
        </span>
      </div>

      {/* ── 2. 3D SMARTPHONE DEVICE CHASSIS (One unified 3D object) ────────── */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          rotateZ,
          transformStyle: 'preserve-3d',
          transformOrigin: phone3D.transformOrigin,
          aspectRatio: '9 / 19',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onSelect}
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`relative w-full cursor-pointer transition-all duration-300 ${
          isSelected ? 'z-30' : 'z-10'
        }`}
      >
        {/* Selected Ambient Glow Halo */}
        {isSelected && (
          <motion.div
            layoutId="role-selected-ring"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -inset-2 sm:-inset-3 rounded-[2.5rem] sm:rounded-[3rem] bg-gradient-to-tr from-purple-500/25 via-blue-500/20 to-pink-500/25 blur-lg sm:blur-xl -z-10 pointer-events-none"
          />
        )}

        {/* Selected Floating Top Pill */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.8 }}
              animate={{ opacity: 1, y: -16, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.8 }}
              className="absolute left-1/2 -translate-x-1/2 -top-1 z-50 bg-zinc-950 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full flex items-center gap-1 sm:gap-1.5 shadow-xl border border-zinc-700/70 whitespace-nowrap text-[8.5px] sm:text-[11px] font-bold"
            >
              <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" strokeWidth={3.5} />
              </div>
              <span>Selected</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PHONE 3D BODY & DIMENSIONAL BEZEL THICKNESS ───────────────────── */}
        <div
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: phone3D.edgeShadow,
          }}
          className={`relative w-full h-full rounded-[1.6rem] sm:rounded-[2.4rem] md:rounded-[2.8rem] p-[3px] sm:p-[5.5px] md:p-[6.5px] transition-all duration-300 bg-gradient-to-b from-[#2b2d35] via-[#16171d] to-[#0d0e12] ${phone3D.rimHighlight} ${
            isSelected
              ? 'ring-2 sm:ring-3 ring-zinc-950/90 shadow-[0_20px_50px_rgba(0,0,0,0.35)]'
              : 'ring-1 ring-white/15 group-hover:ring-white/25'
          }`}
        >
          {/* Physical Hardware Buttons with Realistic Metallic Glint */}
          {/* Left Buttons (Volume & Mute) */}
          <div className="absolute top-10 sm:top-16 -left-[2px] sm:-left-[2.5px] w-[2px] sm:w-[2.5px] h-3.5 sm:h-6 bg-gradient-to-r from-zinc-700 to-zinc-500 rounded-l-[1px] shadow-xs" />
          <div className="absolute top-18 sm:top-26 -left-[2px] sm:-left-[2.5px] w-[2px] sm:w-[2.5px] h-6 sm:h-10 bg-gradient-to-r from-zinc-700 to-zinc-500 rounded-l-[1px] shadow-xs" />
          <div className="absolute top-27 sm:top-38 -left-[2px] sm:-left-[2.5px] w-[2px] sm:w-[2.5px] h-6 sm:h-10 bg-gradient-to-r from-zinc-700 to-zinc-500 rounded-l-[1px] shadow-xs" />
          {/* Right Button (Power Lock) */}
          <div className="absolute top-16 sm:top-24 -right-[2px] sm:-right-[2.5px] w-[2px] sm:w-[2.5px] h-7 sm:h-12 bg-gradient-to-l from-zinc-700 to-zinc-500 rounded-r-[1px] shadow-xs" />

          {/* ── INNER SCREEN (Firmly attached to phone 3D plane) ─────────────── */}
          <div
            style={{ transformStyle: 'preserve-3d' }}
            className="relative w-full h-full rounded-[1.45rem] sm:rounded-[2.1rem] md:rounded-[2.5rem] overflow-hidden bg-zinc-950 border-[1.5px] sm:border-[2px] border-black/60 flex flex-col justify-between"
          >
            {/* Background Wallpaper Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={presentation.bgImage}
                alt={presentation.name}
                className="w-full h-full object-cover brightness-[0.93] contrast-[1.05]"
              />
              {/* Top Readability Gradient */}
              <div className="absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-white/95 via-white/80 to-transparent pointer-events-none" />
              {/* Bottom Vignette for UI Contrast */}
              <div className="absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none" />
            </div>

            {/* Realistic Diagonal Glass Overlay (Reflections & Glare) */}
            <div
              className="absolute inset-0 z-30 pointer-events-none rounded-[1.45rem] sm:rounded-[2.1rem] md:rounded-[2.5rem]"
              style={{
                background:
                  'linear-gradient(125deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 28%, transparent 58%, rgba(255,255,255,0.02) 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
              }}
            />

            {/* Dynamic Island Notch & Top Status Bar */}
            <div className="relative z-40 w-full pt-1 sm:pt-2 md:pt-2.5 px-2 sm:px-4 flex items-center justify-between text-zinc-900 text-[7px] sm:text-[9.5px] md:text-[10px] font-bold">
              <span>9:41</span>

              {/* Dynamic Island Pill */}
              <div className="w-[26%] sm:w-[30%] h-[10px] sm:h-[16px] md:h-[18px] bg-black rounded-full flex items-center justify-between px-1 sm:px-1.5 shadow-md">
                <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-zinc-900 border border-white/15 ml-0.5" />
                <div className="w-1 h-1 rounded-full bg-emerald-500/40 animate-pulse mr-0.5" />
              </div>

              {/* Status Bar: Signal, Wifi, Battery */}
              <div className="flex items-center gap-0.5 sm:gap-1 opacity-90 text-zinc-900">
                <div className="flex items-end gap-[1px] h-2 sm:h-2.5">
                  <div className="w-[1px] sm:w-[1.5px] h-1 bg-zinc-800 rounded-xs" />
                  <div className="w-[1px] sm:w-[1.5px] h-1.5 bg-zinc-800 rounded-xs" />
                  <div className="w-[1px] sm:w-[1.5px] h-2 bg-zinc-800 rounded-xs" />
                  <div className="w-[1px] sm:w-[1.5px] h-2.5 bg-zinc-800 rounded-xs" />
                </div>
                <Wifi size={7} className="sm:w-2.5 sm:h-2.5" strokeWidth={2.5} />
                <div className="w-2.5 sm:w-4 h-1.5 sm:h-2 rounded-[1px] sm:rounded-[2px] border border-zinc-800 p-[0.5px] sm:p-[1px] flex items-center">
                  <div className="w-[75%] h-full bg-zinc-800 rounded-2xs" />
                </div>
              </div>
            </div>

            {/* Top Screen Headline */}
            <div className="relative z-20 px-2 sm:px-3.5 md:px-4 pt-1.5 sm:pt-4 md:pt-5 select-none text-left">
              <div className="text-[10.5px] sm:text-[16px] md:text-[20px] font-black text-zinc-950 leading-[1.08] tracking-tight">
                {headlineLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
                <div
                  className={`${presentation.highlightColor} font-serif italic font-bold text-[12px] sm:text-[18px] md:text-[24px] tracking-tight mt-0.5`}
                >
                  {presentation.headlineHighlight}
                </div>
              </div>
            </div>

            {/* Mid Screen Floating Pill */}
            {presentation.floatingPill && (
              <div className="relative z-20 px-1.5 sm:px-3 flex justify-end my-auto">
                <div className="bg-black/65 backdrop-blur-md border border-white/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-white text-[6.5px] sm:text-[9px] md:text-[10px] font-medium tracking-wide shadow-md">
                  {presentation.floatingPill.text}
                </div>
              </div>
            )}

            {/* Bottom Floating Component Section */}
            <div className="relative z-20 px-1 sm:px-2.5 md:px-3 pb-2 sm:pb-4 pt-1 sm:pt-2 flex flex-col gap-1 sm:gap-2">
              {/* Creator Stats Pill */}
              {presentation.slug === 'creator' && <CreatorStatsPill />}

              {/* Editor Studio Timeline */}
              {presentation.slug === 'editor' && <EditorTimelinePreview />}

              {/* Brand Logos Pill */}
              {presentation.brandLogos && <BrandLogosRow />}

              {/* Normal User Explore Pill */}
              {presentation.slug === 'user' && (
                <div className="w-full bg-black/60 backdrop-blur-md border border-white/20 px-1 sm:px-2.5 py-0.5 sm:py-1.5 rounded-md sm:rounded-xl text-white text-[6.5px] sm:text-[9px] font-medium shadow-md truncate">
                  ✈️ Explore • Follow • Support
                </div>
              )}

              {/* Generic Stats Pill for other categories */}
              {presentation.statsPill && presentation.slug !== 'creator' && (
                <div className="w-full bg-white/85 backdrop-blur-md border border-white/60 shadow-md rounded-md sm:rounded-xl p-0.5 sm:p-2 flex items-center justify-around text-zinc-900 text-[7px] sm:text-[10px] font-bold">
                  <span>
                    {presentation.statsPill.leftValue} {presentation.statsPill.leftLabel}
                  </span>
                  <span className="w-[1px] h-2 sm:h-3 bg-zinc-300" />
                  <span>
                    {presentation.statsPill.rightValue} {presentation.statsPill.rightLabel}
                  </span>
                </div>
              )}

              {/* Home Indicator Bar */}
              <div className="w-10 sm:w-20 h-0.5 sm:h-1 bg-white/70 rounded-full mx-auto mt-0.5 sm:mt-1" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 3. REALISTIC SOFT CONTACT SHADOW ON REFLECTIVE DESK ─────────────── */}
      <div
        className={`w-[85%] h-2.5 sm:h-4 rounded-[100%] bg-zinc-950/25 blur-md -mt-1 transition-all duration-300 pointer-events-none ${phone3D.shadowOffset} ${
          isSelected ? 'opacity-45 scale-105' : 'opacity-22 group-hover:opacity-35'
        }`}
      />
    </div>
  );
});


