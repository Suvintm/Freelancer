import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/whitebglogo.png';
import LottieComponent from 'lottie-react';
import welcomeAnimation from '../assets/lottie/welcome_lottie.json';
import { CreatorShowcaseCollage } from '../components/shared/CreatorShowcaseCollage';
import {
  CreatorMetricsTicker,
  ViewsGrowthWidget,
  AudienceReachWidget,
} from '../components/shared/CreatorMetricsTicker';

const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

// ─────────────────────────────────────────────────────────────────────────────
// SUVIX WELCOME — High-Performance Production Onboarding
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

// GPU Spring transition
const EASE = { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

// ── Floating "Mind Voice" Bubbles (Isolated from Main Page Re-renders) ─────
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

const FloatingThoughts = React.memo(function FloatingThoughts() {
  const [bubbles, setBubbles] = useState<Array<{ id: number; text: string; side: 'left' | 'right'; top: number }>>([]);
  const countRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const text = THOUGHTS[Math.floor(Math.random() * THOUGHTS.length)];
      const side = (Math.random() > 0.5 ? 'left' : 'right') as 'left' | 'right';
      const top = 6 + Math.random() * 38;
      const newId = ++countRef.current;

      setBubbles((prev) => {
        const next = [...prev, { id: newId, text, side, top }];
        if (next.length > 4) return next.slice(next.length - 4);
        return next;
      });

      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== newId));
      }, 7200);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden block gpu-layer">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`absolute px-3 py-1.5 md:px-5 md:py-2.5 bg-white text-zinc-900 shadow-xl font-bold text-[10px] sm:text-xs md:text-sm whitespace-nowrap drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] animate-thought-bubble gpu-layer
            ${
              bubble.side === 'left'
                ? 'left-[2%] md:left-[4%] xl:left-[6%] rounded-[12px] md:rounded-[18px] rounded-bl-[2px]'
                : 'right-[2%] md:right-[4%] xl:right-[6%] rounded-[12px] md:rounded-[18px] rounded-br-[2px]'
            }`}
          style={{ top: `${bubble.top}%` }}
        >
          {bubble.text}
        </div>
      ))}
    </div>
  );
});

export default function Welcome() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [lastSlideImageIndex, setLastSlideImageIndex] = useState(0);

  const isLast = active === SLIDES.length - 1;

  // 🚀 Background Image Preloader for instant smooth image transitions
  useEffect(() => {
    const allImages = [...SLIDES.map((s) => s.image), ...LAST_SLIDE_IMAGES];
    allImages.forEach((imgUrl) => {
      const img = new Image();
      img.src = imgUrl;
    });
  }, []);

  const goNext = useCallback(() => {
    setDirection(1);
    setActive((p) => Math.min(p + 1, SLIDES.length - 1));
  }, []);

  // Auto-advance every 5 seconds
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
  useEffect(() => {
    if (!isLast) return;
    const t = setInterval(() => {
      setLastSlideImageIndex((prev) => (prev + 1) % LAST_SLIDE_IMAGES.length);
    }, 3800);
    return () => clearInterval(t);
  }, [isLast]);

  const slide = useMemo(() => SLIDES[active], [active]);
  const currentBgImage = useMemo(
    () => (isLast ? LAST_SLIDE_IMAGES[lastSlideImageIndex] : slide.image),
    [isLast, lastSlideImageIndex, slide.image]
  );

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black text-white flex flex-col justify-between gpu-layer">
      {/* ── FULLSCREEN BACKGROUND IMAGE (GPU Accelerated Transition) ──────── */}
      <AnimatePresence initial={false}>
        <motion.img
          key={isLast ? `last-${lastSlideImageIndex}` : active}
          src={currentBgImage}
          alt=""
          loading="eager"
          decoding="async"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'linear' }}
          className="absolute inset-0 h-full w-full object-cover gpu-layer"
        />
      </AnimatePresence>

      {/* ── TOP REGION BLACK GRADIENT OVERLAY (Top to Bottom) ─────────────── */}
      <div className="absolute top-0 left-0 right-0 h-36 md:h-48 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />

      {/* ── BOTTOM REGION BLACK GRADIENT OVERLAY (Bottom to Top) ──────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-44 md:h-64 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-10 pointer-events-none" />

      {/* ── FLOATING THOUGHTS ─────────────────────────────────────────────── */}
      <FloatingThoughts />

      {/* ── ABSOLUTE TOP HEADER / LOGO (Top-Left Absolute with Z-50 & Margins) ── */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, ...EASE }}
        className="absolute top-0 left-0 right-0 z-50 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex items-center justify-between pointer-events-none"
      >
        <img
          src={logo}
          alt="SuviX"
          className="h-8.5 xs:h-9.5 sm:h-11 md:h-13 lg:h-14 w-auto pointer-events-auto ml-1 sm:ml-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
        />

        {/* Desktop pill badge */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold text-white/80 mr-1 sm:mr-2">
          <Sparkles size={13} className="text-amber-400" />
          <span>Creator Growth &amp; Collaboration Platform</span>
        </div>
      </motion.header>

      {/* ── MAIN CONTENT: 2-COLUMN ON DESKTOP ─────────────────────────────── */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-3 sm:px-6 md:px-10 py-1 sm:py-3 lg:py-5 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-6 lg:gap-10 items-center">

          {/* ╔════════════════════════════════════════════════════════════════╗
              ║  LEFT COLUMN: Compact 3D Creator Collage + Motion Graphics    ║
              ╚════════════════════════════════════════════════════════════════╝ */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex lg:col-span-5 flex-col items-center justify-center relative w-full gap-1 xl:gap-2"
          >
            {/* 3D Floating Creator Showcase (Desktop) */}
            <CreatorShowcaseCollage theme="dark" className="scale-[0.80] xl:scale-[0.88] origin-center -mb-2" />

            {/* Enterprise Social Media Motion Graphics (Views & Audience Reach Ticker) */}
            <CreatorMetricsTicker className="scale-[0.90] xl:scale-95 origin-top" />
          </motion.div>

          {/* ╔════════════════════════════════════════════════════════════════╗
              ║  RIGHT COLUMN: Presentation Card & CTAs (7 Cols on lg)       ║
              ╚════════════════════════════════════════════════════════════════╝ */}
          <div className="lg:col-span-7 flex flex-col items-center w-full">
            {/* ── Mobile 3D Creator Collage ── */}
            <div className="lg:hidden w-full flex flex-col items-center pointer-events-none -mt-6 -mb-6 xs:-mt-4 xs:-mb-4 sm:-my-2 overflow-visible">
              <CreatorShowcaseCollage theme="dark" className="scale-[0.70] xs:scale-[0.76] sm:scale-[0.88] origin-center" />
            </div>

            {/* Slide Presentation Card */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, ...EASE }}
              className="relative overflow-visible w-full bg-black/85 rounded-[22px] xs:rounded-[26px] sm:rounded-[32px] p-4 xs:p-5 sm:p-7 md:p-9 max-w-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] gpu-layer"
            >
              {/* ── TOP INTEGRATED HEADER: Views Growth + Lottie Welcome Pill + Audience Reach ── */}
              <div className="w-full flex items-center justify-between sm:justify-center gap-2 xs:gap-3 mb-3.5 sm:mb-5">
                {/* Left Flank: Views Growth (Mobile Only) */}
                <div className="lg:hidden flex-1 max-w-[6.2rem] xs:max-w-[7.2rem] sm:max-w-[8.2rem] pointer-events-auto">
                  <ViewsGrowthWidget variant="mobile-flank" />
                </div>

                {/* Center: Lottie Welcome Pill */}
                <div className="flex items-center justify-center bg-white/95 backdrop-blur-md rounded-full px-2.5 py-1 sm:px-5 sm:py-2 shadow-lg border border-white/30 shrink-0 mx-auto">
                  <Lottie
                    animationData={welcomeAnimation}
                    loop={true}
                    rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
                    className="w-14 h-4 xs:w-16 xs:h-4.5 sm:w-24 sm:h-7 gpu-layer"
                  />
                </div>

                {/* Right Flank: Audience Reach (Mobile Only) */}
                <div className="lg:hidden flex-1 max-w-[6.2rem] xs:max-w-[7.2rem] sm:max-w-[8.2rem] pointer-events-auto">
                  <AudienceReachWidget variant="mobile-flank" />
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="flex gap-2 mb-3 sm:mb-4">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Slide ${i + 1}`}
                    className="h-[2.5px] sm:h-[3.5px] rounded-full transition-all duration-300 cursor-pointer"
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
                  initial={{ opacity: 0, x: direction * 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -18 }}
                  transition={EASE}
                  className="gpu-layer"
                >
                  {/* Subtitle label */}
                  <p className="font-label text-[9px] xs:text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase mb-1 sm:mb-1.5 md:text-xs">
                    {slide.subtitle}
                  </p>

                  {/* Main headline - High clarity bold */}
                  <h1 className="font-welcome text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-white whitespace-pre-line leading-[1.12] tracking-tight mb-1.5 sm:mb-2.5 md:mb-3">
                    {slide.title}
                  </h1>

                  {/* Description */}
                  <p className="font-sans text-[10.5px] xs:text-[11.5px] sm:text-[13px] md:text-[14px] text-white/65 leading-relaxed max-w-lg">
                    {slide.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* ── Integrations Badge (Google & YouTube) ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, ...EASE }}
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
                      className="flex-1 flex items-center justify-center h-10 xs:h-11 sm:h-12 px-3 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl sm:rounded-2xl font-sans font-bold text-[12px] xs:text-[13px] sm:text-[14px] transition-all shadow-md text-center whitespace-nowrap active:scale-[0.98]"
                    >
                      Sign In
                    </Link>

                    <button
                      onClick={goNext}
                      className="flex-[1.2] flex items-center justify-between gap-2 h-10 xs:h-11 sm:h-12 pl-4 pr-1.5 sm:pl-5 sm:pr-2 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl sm:rounded-2xl font-sans font-bold text-[12px] xs:text-[13px] sm:text-[14px] active:scale-[0.97] transition-all shadow-md whitespace-nowrap cursor-pointer"
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
                      className="flex-1 flex items-center justify-center h-10.5 xs:h-11.5 sm:h-12 px-3 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl sm:rounded-2xl font-sans font-bold text-[12px] xs:text-[13px] sm:text-[14px] transition-all shadow-md text-center whitespace-nowrap active:scale-[0.98]"
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