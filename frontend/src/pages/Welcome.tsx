import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/whitebglogo.png';

// ─────────────────────────────────────────────────────────────────────────────
// SUVIX WELCOME — Production Onboarding
// Mobile: Full-screen slides (exact match to React Native app)
// Desktop: Same slides but with background image on full screen
// ─────────────────────────────────────────────────────────────────────────────

import onboarding1 from '../assets/images/onboarding/onboarding_1.jpg';
import onboarding2 from '../assets/images/onboarding/onboarding_2.jpg';
import onboarding3 from '../assets/images/onboarding/onboarding_3.jpg';
import onboarding4 from '../assets/images/onboarding/onboarding_4.jpg';

const SLIDES = [
  {
    title:       'Scale Your\nContent',
    subtitle:    'HIGH-FIDELITY VISUALS',
    description: 'Join our elite network of professional video editors and blow up your brand with cinematic content.',
    image:       onboarding1,
  },
  {
    title:       'Promote with\nPower',
    subtitle:    'CREATIVE ADVERTISING',
    description: 'Run high-impact social media ads and grow your reach with top-tier creators and promoters.',
    image:       onboarding2,
  },
  {
    title:       'Premium Gear\n& Services',
    subtitle:    'PROFESSIONAL RENTALS',
    description: 'Rent top-tier professional equipment or provide specialized services to scale your creative business.',
    image:       onboarding3,
  },
  {
    title:       'Join the\nEcosystem',
    subtitle:    'ELITE CREATOR NETWORK',
    description: 'Unlock the full potential of your talent. Choose your path and start your journey with SuviX today.',
    image:       onboarding4,
  },
];

// Spring transition used throughout
const EASE   = { duration: 0.5, ease: [0.16, 1, 0.3, 1] };

export default function Welcome() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  const isLast = active === SLIDES.length - 1;

  const goNext = useCallback(() => {
    setDirection(1);
    setActive(p => Math.min(p + 1, SLIDES.length - 1));
  }, []);

  // Auto-advance every 5 seconds (only on desktop to mimic app behavior)
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isLast) goNext();
    }, 5000);
    return () => clearTimeout(t);
  }, [active, isLast, goNext]);

  const goTo = useCallback((i: number) => {
    setDirection(i > active ? 1 : -1);
    setActive(i);
  }, [active]);

  const slide = SLIDES[active];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">

      {/* ── FULLSCREEN BACKGROUND IMAGE ───────────────────────────────────── */}
      <AnimatePresence mode="sync">
        <motion.img
          key={active}
          src={slide.image}
          alt=""
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      {/* ── GRADIENT OVERLAY ──────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

      {/* ── LOGO ─────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...EASE }}
        className="absolute top-0 left-0 right-0 z-30 px-6 pt-12 md:px-10 md:pt-14"
      >
        <img src={logo} alt="SuviX" className="h-10 md:h-12 w-auto" />
      </motion.header>

      {/* ── MAIN CONTENT CARD ────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-10 md:px-6 md:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...EASE }}
          className="glass-heavy rounded-[32px] p-7 md:p-10 max-w-4xl mx-auto lg:max-w-2xl"
        >
          {/* Progress Indicators */}
          <div className="flex gap-2.5 mb-7">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="h-[3px] rounded-full transition-all duration-500 cursor-pointer"
                style={{
                  width:           active === i ? 36 : 18,
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
              <p className="font-label text-[11px] font-bold tracking-[0.25em] text-white/50 uppercase mb-3 md:text-xs">
                {slide.subtitle}
              </p>

              {/* Main headline */}
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-white whitespace-pre-line leading-[1.05] tracking-tight mb-4 md:mb-5">
                {slide.title}
              </h1>

              {/* Description */}
              <p className="font-sans text-[15px] md:text-base text-white/60 leading-relaxed max-w-lg">
                {slide.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 lg:flex-row lg:gap-4">
            {!isLast ? (
              <>
                {/* Skip */}
                <Link
                  to="/login"
                  className="order-2 sm:order-1 flex items-center justify-center h-13 px-6 text-white/50 font-sans font-semibold text-[15px] hover:text-white/80 transition-colors"
                >
                  Sign In Instead
                </Link>

                {/* Continue */}
                <button
                  onClick={goNext}
                  className="order-1 sm:order-2 sm:ml-auto flex items-center justify-between gap-3 h-14 pl-7 pr-2 bg-white text-black rounded-2xl font-sans font-black text-[15px] hover:opacity-90 active:scale-[0.97] transition-all"
                >
                  <span>Continue</span>
                  <span className="flex items-center justify-center w-10 h-10 bg-black text-white rounded-xl">
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </span>
                </button>
              </>
            ) : (
              <>
                {/* Get Started */}
                <Link
                  to="/role-selection"
                  className="flex items-center justify-between gap-3 h-14 pl-7 pr-2 bg-white text-black rounded-2xl font-sans font-black text-[15px] hover:opacity-90 active:scale-[0.97] transition-all"
                  style={{ flex: 1 }}
                >
                  <span>Get Started</span>
                  <span className="flex items-center justify-center w-10 h-10 bg-black text-white rounded-xl">
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </span>
                </Link>

                {/* Sign In */}
                <Link
                  to="/login"
                  className="flex items-center justify-center h-14 px-7 border border-white/15 rounded-2xl font-sans font-bold text-[15px] text-white hover:bg-white/10 transition-all"
                  style={{ flex: 1 }}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── SUBTLE GRID OVERLAY ──────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.025]"
        style={{
          backgroundImage:  'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize:   '28px 28px',
        }}
      />
    </div>
  );
}