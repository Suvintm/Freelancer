import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { ChevronRight, Star, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/whitebglogo.png';
import creatorChar from '../assets/3d.png';
import LottieComponent from 'lottie-react';
import welcomeAnimation from '../assets/lottie/welcome_lottie.json';
import { CreatorShowcaseCollage } from '../components/shared/CreatorShowcaseCollage';

const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

// ─────────────────────────────────────────────────────────────────────────────
// SUVIX WELCOME — Production Onboarding
// Left: 3D Floating Creator Showcase Collage
// Right: Dynamic Presentation Slides & Onboarding CTAs
// ─────────────────────────────────────────────────────────────────────────────

import onboarding1 from '../assets/images/onboarding/onboarding_1.jpg';
import onboarding2 from '../assets/images/onboarding/onboarding_2.jpg';
import onboarding3 from '../assets/images/onboarding/onboarding_3.jpg';
import onboarding4 from '../assets/images/onboarding/onboarding_4.jpg';
import onboarding5 from '../assets/images/onboarding/onboarding_5.png';
import onboarding6 from '../assets/images/onboarding/onboarding_6.png';
import onboarding7 from '../assets/images/onboarding/onboarding_7.png';
import onboarding8 from '../assets/images/onboarding/onboarding_8.png';
import onboarding9 from '../assets/images/onboarding/onboarding_9.png';

const SLIDES = [
  {
    title: 'Scale Your\nContent',
    subtitle: 'HIGH-FIDELITY VISUALS',
    description: 'Join our elite network of professional video editors and blow up your brand with cinematic content.',
    image: onboarding5,
  },
  {
    title: 'Promote with\nPower',
    subtitle: 'CREATIVE ADVERTISING',
    description: 'Run high-impact social media ads and grow your reach with top-tier creators and promoters.',
    image: onboarding6,
  },
  {
    title: 'Premium Gear\n& Services',
    subtitle: 'PROFESSIONAL RENTALS',
    description: 'Rent top-tier professional equipment or provide specialized services to scale your creative business.',
    image: onboarding9,
  },
  {
    title: 'Join the\nEcosystem',
    subtitle: 'ELITE CREATOR NETWORK',
    description: 'Unlock the full potential of your talent. Choose your path and start your journey with SuviX today.',
    image: onboarding4,
  },
];

const LAST_SLIDE_IMAGES = [
  onboarding8,
  onboarding9,
  onboarding4,
  onboarding1,
  onboarding5,
  onboarding7,
  onboarding6,
  onboarding2,
  onboarding3,
];

// Spring transition used throughout
const EASE = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

// ── Sparkle particles around the character ──────────────────────────────────
const SPARKLES = [
  { id: 1, x: '72%', y: '12%', size: 16, delay: 0.0, color: '#FF0000' },
  { id: 2, x: '85%', y: '28%', size: 12, delay: 0.4, color: '#ffffff' },
  { id: 3, x: '60%', y: '20%', size: 10, delay: 0.8, color: '#FFD700' },
  { id: 4, x: '90%', y: '45%', size: 14, delay: 1.2, color: '#ffffff' },
  { id: 5, x: '65%', y: '55%', size: 8, delay: 0.6, color: '#FF0000' },
  { id: 6, x: '80%', y: '60%', size: 10, delay: 1.5, color: '#FFD700' },
];

// ── Animated 3D Creator Character ───────────────────────────────────────────
function CreatorCharacter() {
  const controls = useAnimationControls();
  const [dancePhase, setDancePhase] = useState(0);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sequence: fly-in → idle float → dance wiggle → idle float → repeat
  useEffect(() => {
    let cancelled = false;

    async function runSequence() {
      // 1. Fly in from right with spring
      await controls.start({
        x: 0,
        opacity: 1,
        rotate: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 90, damping: 14, delay: 0.6 },
      });

      if (cancelled) return;

      // 2. Idle float loop — run for 6 seconds
      await controls.start({
        y: [0, -18, 0],
        rotate: [-1, 1.5, -1],
        transition: { duration: 2.8, repeat: 2, ease: 'easeInOut' },
      });

      if (cancelled) return;

      // 3. Dance wiggle!
      setDancePhase(1);
      await controls.start({
        rotate: [-8, 10, -10, 8, -6, 6, -4, 0],
        y: [0, -10, 0, -14, 0, -8, 0, 0],
        scale: [1, 1.04, 1, 1.06, 1, 1.03, 1, 1],
        transition: { duration: 2.4, ease: 'easeInOut' },
      });

      if (cancelled) return;

      setDancePhase(0);

      // 4. Bow
      await controls.start({
        rotate: [0, 12, 0],
        y: [0, 8, 0],
        transition: { duration: 0.8, ease: 'easeInOut' },
      });

      if (cancelled) return;

      // 5. Walk off to the right
      await controls.start({
        x: 340,
        opacity: 0,
        rotate: 5,
        transition: { duration: 0.7, ease: [0.4, 0, 1, 1] },
      });

      if (cancelled) return;

      // 6. Pause then re-enter
      cycleRef.current = setTimeout(() => {
        if (!cancelled) {
          controls.set({ x: 340, opacity: 0, y: 0, rotate: 0, scale: 1 });
          runSequence();
        }
      }, 4000);
    }

    controls.set({ x: 340, opacity: 0, y: 0, rotate: 0, scale: 1 });
    runSequence();

    return () => {
      cancelled = true;
      if (cycleRef.current) clearTimeout(cycleRef.current);
      controls.stop();
    };
  }, [controls]);

  return (
    <div className="relative z-30 pointer-events-none select-none hidden sm:flex flex-col items-center justify-end">
      {/* Sparkle particles */}
      {SPARKLES.map((sp) => (
        <motion.div
          key={sp.id}
          className="absolute"
          style={{ left: sp.x, top: sp.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0.6, 1, 0],
            scale: [0, 1.2, 0.8, 1.2, 0],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: sp.delay,
            ease: 'easeInOut',
          }}
        >
          <Star size={sp.size} fill={sp.color} color={sp.color} className="drop-shadow-lg" />
        </motion.div>
      ))}

      {/* Glow ring behind character */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,0,0,0.18) 0%, rgba(255,200,0,0.10) 50%, transparent 70%)',
          filter: 'blur(18px)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* The character itself */}
      <motion.div animate={controls} style={{ originX: 0.5, originY: 1 }} className="relative flex flex-col items-center">
        {/* Dance burst ring — only during dance */}
        <AnimatePresence>
          {dancePhase === 1 && (
            <motion.div
              key="burst"
              className="absolute inset-0 rounded-full border-4 border-red-500/60"
              initial={{ scale: 0.6, opacity: 1 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', repeat: Infinity }}
            />
          )}
        </AnimatePresence>

        {/* Character image */}
        <img
          src={creatorChar}
          alt="Creator"
          className="w-24 sm:w-28 md:w-36 lg:w-40 xl:w-44"
          style={{
            filter:
              dancePhase === 1
                ? 'drop-shadow(0px 0px 24px rgba(255, 50, 50, 0.95)) brightness(1.15)'
                : 'drop-shadow(0px 8px 32px rgba(0, 0, 0, 0.6))',
            transition: 'filter 0.3s ease',
          }}
        />

        {/* Ground shadow */}
        <motion.div
          className="w-16 sm:w-20 md:w-28 h-2.5 md:h-3 rounded-full mt-[-4px] md:mt-[-8px]"
          style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.45) 0%, transparent 75%)' }}
          animate={{ scaleX: [1, 0.85, 1], opacity: [0.7, 0.4, 0.7] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}

// ── Floating "Mind Voice" Bubbles ──────────────────────────────────────────
const THOUGHTS = [
  'How to get more views?',
  'Is the algorithm changing again?',
  'Still a beginner...',
  "What's the best time to post?",
  'How to get my first 1,000 subs?',
  'My retention is dropping 😭',
  'Need better thumbnails...',
  'Should I start a second channel?',
  'How to grow fast?',
  'Why did my video flop?',
  'How to get sponsored?',
  'Am I shadowbanned?',
];

function FloatingThoughts() {
  const [bubbles, setBubbles] = useState<Array<{ id: number; text: string; side: 'left' | 'right'; top: number }>>([]);

  useEffect(() => {
    let idCounter = 0;

    const interval = setInterval(() => {
      const text = THOUGHTS[Math.floor(Math.random() * THOUGHTS.length)];
      const side = (Math.random() > 0.5 ? 'left' : 'right') as 'left' | 'right';
      const top = 5 + Math.random() * 40;

      const newBubble = {
        id: idCounter++,
        text,
        side,
        top,
      };

      setBubbles((prev) => {
        const next = [...prev, newBubble];
        if (next.length > 5) return next.slice(next.length - 5);
        return next;
      });

      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
      }, 7000);
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden block">
      <AnimatePresence>
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -100,
              scale: 1,
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 7, ease: 'easeOut' }}
            className={`absolute px-3 py-1.5 md:px-5 md:py-3 bg-white text-zinc-900 shadow-2xl font-bold text-[10px] sm:text-xs md:text-sm whitespace-nowrap drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]
              ${
                bubble.side === 'left'
                  ? 'left-[2%] md:left-[4%] xl:left-[6%] rounded-[12px] md:rounded-[20px] rounded-bl-[2px]'
                  : 'right-[2%] md:right-[4%] xl:right-[6%] rounded-[12px] md:rounded-[20px] rounded-br-[2px]'
              }`}
            style={{ top: `${bubble.top}%` }}
          >
            {bubble.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function Welcome() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  const isLast = active === SLIDES.length - 1;

  const goNext = useCallback(() => {
    setDirection(1);
    setActive((p) => Math.min(p + 1, SLIDES.length - 1));
  }, []);

  // Auto-advance every 5 seconds (only on desktop to mimic app behavior)
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isLast) goNext();
    }, 5000);
    return () => clearTimeout(t);
  }, [active, isLast, goNext]);

  const goTo = useCallback(
    (i: number) => {
      setDirection(i > active ? 1 : -1);
      setActive(i);
    },
    [active]
  );

  // Cycle images on the last slide
  const [lastSlideImageIndex, setLastSlideImageIndex] = useState(0);

  useEffect(() => {
    if (!isLast) {
      return;
    }
    const t = setInterval(() => {
      setLastSlideImageIndex((prev) => (prev + 1) % LAST_SLIDE_IMAGES.length);
    }, 3500);
    return () => clearInterval(t);
  }, [isLast]);

  const slide = SLIDES[active];

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black text-white flex flex-col justify-between">
      {/* ── FULLSCREEN BACKGROUND IMAGE (Clear & Vivid) ─────────────────── */}
      <AnimatePresence>
        <motion.img
          key={isLast ? `last-${lastSlideImageIndex}` : active}
          src={isLast ? LAST_SLIDE_IMAGES[lastSlideImageIndex] : slide.image}
          alt=""
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      {/* ── TOP REGION BLACK GRADIENT OVERLAY (Top to Bottom) ─────────────── */}
      <div className="absolute top-0 left-0 right-0 h-36 md:h-48 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />

      {/* ── BOTTOM REGION BLACK GRADIENT OVERLAY (Bottom to Top) ──────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-44 md:h-64 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-10 pointer-events-none" />

      {/* ── FLOATING THOUGHTS ─────────────────────────────────────────────── */}
      <FloatingThoughts />

      {/* ── TOP HEADER ────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...EASE }}
        className="relative z-30 px-5 pt-5 pb-1 sm:px-8 sm:pt-8 md:px-12 md:pt-10 max-w-7xl mx-auto w-full flex items-center justify-between pointer-events-none"
      >
        <img src={logo} alt="SuviX" className="h-7 sm:h-9 md:h-11 lg:h-12 w-auto pointer-events-auto" />

        {/* Desktop pill badge */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold text-white/80">
          <Sparkles size={13} className="text-amber-400" />
          <span>Creator Growth &amp; Collaboration Platform</span>
        </div>
      </motion.header>

      {/* ── MAIN CONTENT: 2-COLUMN ON DESKTOP ─────────────────────────────── */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-3 sm:px-6 md:px-10 py-0 sm:py-3 lg:py-5 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-10 items-center">

          {/* ╔════════════════════════════════════════════════════════════════╗
              ║  LEFT COLUMN: Compact 3D Creator Collage (5 Cols on lg)       ║
              ╚════════════════════════════════════════════════════════════════╝ */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex lg:col-span-5 flex-col items-center justify-center relative w-full"
          >
            {/* 3D Floating Creator Showcase (Desktop) */}
            <CreatorShowcaseCollage theme="dark" className="scale-[0.85] xl:scale-95 origin-center" />
          </motion.div>

          {/* ╔════════════════════════════════════════════════════════════════╗
              ║  RIGHT COLUMN: Presentation Card & CTAs (7 Cols on lg)       ║
              ╚════════════════════════════════════════════════════════════════╝ */}
          <div className="lg:col-span-7 flex flex-col items-center w-full">
            {/* ── Mobile 3D Creator Collage (Identical 5-Card 3D Collage Scaled to Fit) ── */}
            <div className="lg:hidden w-full flex flex-col items-center pointer-events-none -mt-18 -mb-12 xs:-mt-16 xs:-mb-10 sm:-my-4 overflow-visible">
              <CreatorShowcaseCollage theme="dark" className="scale-[0.48] xs:scale-[0.55] sm:scale-[0.78] origin-center" />
            </div>

            {/* Floating Lottie Component Above the Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, ...EASE }}
              className="mb-1.5 sm:mb-3 pointer-events-auto"
            >
              <div className="flex items-center justify-center bg-white/95 backdrop-blur-lg rounded-full px-3 py-1 sm:px-6 sm:py-2.5 shadow-2xl border border-white/30">
                <Lottie animationData={welcomeAnimation} loop className="w-15 h-4 sm:w-28 sm:h-8" />
              </div>
            </motion.div>

            {/* Slide Presentation Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ...EASE }}
              className="relative overflow-visible w-full bg-black/85 rounded-[22px] xs:rounded-[26px] sm:rounded-[32px] p-4 xs:p-5 sm:p-7 md:p-9 max-w-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            >
              {/* ── CREATOR CHARACTER inside card top-right ── */}
              <div className="absolute -top-5 right-2 md:-right-2 z-40 pointer-events-none select-none scale-90 sm:scale-100 origin-top-right">
                <CreatorCharacter />
              </div>

              {/* Progress Indicators */}
              <div className="flex gap-2 mb-3 sm:mb-5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="h-[2.5px] sm:h-[3.5px] rounded-full transition-all duration-500 cursor-pointer"
                    style={{
                      width: active === i ? 26 : 14,
                      backgroundColor: active === i ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
                    }}
                  />
                ))}
              </div>

              {/* Text Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -24 }}
                  transition={EASE}
                >
                  {/* Subtitle label */}
                  <p className="font-label text-[9px] xs:text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase mb-1 sm:mb-1.5 md:text-xs">
                    {slide.subtitle}
                  </p>

                  {/* Main headline - Increased size, refined semi-bold / bold weight */}
                  <h1 className="font-welcome text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-white whitespace-pre-line leading-[1.12] tracking-tight mb-1.5 sm:mb-2.5 md:mb-3">
                    {slide.title}
                  </h1>

                  {/* Description - Reduced size */}
                  <p className="font-sans text-[10.5px] xs:text-[11.5px] sm:text-[13px] md:text-[14px] text-white/65 leading-relaxed max-w-lg">
                    {slide.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* ── Integrations Badge (Google & YouTube) ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, ...EASE }}
                className="mt-2.5 xs:mt-3.5 sm:mt-4 flex items-center gap-1.5 sm:gap-2.5 flex-wrap"
              >
                <span className="text-[8px] xs:text-[8.5px] sm:text-[9.5px] font-bold text-white/40 uppercase tracking-[0.18em] pr-0.5 shrink-0">
                  Compatible with
                </span>

                <div className="flex items-center gap-1 bg-white/10 border border-white/10 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-sm shrink-0">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 sm:w-3.5 sm:h-3.5" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-white text-[9px] sm:text-[10.5px] font-semibold tracking-tight">Google</span>
                </div>

                <div className="flex items-center gap-1 bg-white/10 border border-white/10 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-sm shrink-0">
                  <svg viewBox="0 0 28 20" className="w-3.5 h-2.5 sm:w-4 sm:h-3" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z"
                      fill="#FF0000"
                    />
                    <path d="M11.4253 14.2854L18.8485 10.0004L11.4253 5.71533V14.2854Z" fill="white" />
                  </svg>
                  <span className="text-white text-[9px] sm:text-[10.5px] font-semibold tracking-tight">YouTube</span>
                </div>
              </motion.div>

              {/* ── CTA Buttons (Side by Side & White Background) ── */}
              <div className="mt-3 xs:mt-4 sm:mt-6 flex flex-row items-center gap-2 sm:gap-3 w-full">
                {!isLast ? (
                  <>
                    <Link
                      to="/login"
                      className="flex-1 flex items-center justify-center h-10 xs:h-11 sm:h-12 px-3 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl sm:rounded-2xl font-sans font-bold text-[12px] xs:text-[13px] sm:text-[14px] transition-all shadow-md text-center whitespace-nowrap"
                    >
                      Sign In
                    </Link>

                    <button
                      onClick={goNext}
                      className="flex-[1.2] flex items-center justify-between gap-2 h-10 xs:h-11 sm:h-12 pl-4 pr-1.5 sm:pl-5 sm:pr-2 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl sm:rounded-2xl font-sans font-bold text-[12px] xs:text-[13px] sm:text-[14px] active:scale-[0.97] transition-all shadow-md whitespace-nowrap"
                    >
                      <span>Continue</span>
                      <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-black text-white rounded-lg sm:rounded-xl shrink-0">
                        <ChevronRight size={16} strokeWidth={2.5} />
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex-1 flex items-center justify-center h-10.5 xs:h-11.5 sm:h-12 px-3 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl sm:rounded-2xl font-sans font-bold text-[12px] xs:text-[13px] sm:text-[14px] transition-all shadow-md text-center whitespace-nowrap"
                    >
                      Sign In
                    </Link>

                    <Link
                      to="/role-selection"
                      className="flex-[1.2] flex items-center justify-between gap-2 h-10.5 xs:h-11.5 sm:h-12 pl-4 pr-1.5 sm:pl-5 sm:pr-2 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl sm:rounded-2xl font-sans font-bold text-[12px] xs:text-[13px] sm:text-[14px] active:scale-[0.97] transition-all shadow-md whitespace-nowrap"
                    >
                      <span>Get Started</span>
                      <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-black text-white rounded-lg sm:rounded-xl shrink-0">
                        <ChevronRight size={16} strokeWidth={2.5} />
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* ── LEGAL DISCLAIMER FOOTER ───────────────────────────────────────── */}
      <footer className="relative z-20 pb-2 sm:pb-4 text-center px-4">
        <p className="text-[7.5px] sm:text-[9.5px] text-white/35 font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
          SuviX is an independent creator platform connecting creators, video editors, and brands. Google and YouTube are trademarks of Google LLC.
        </p>
      </footer>
    </div>
  );
}