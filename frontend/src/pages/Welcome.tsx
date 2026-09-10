import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WelcomeNavbar } from '../components/common/WelcomeNavbar';
import reelsCardBg from '../assets/reelscardbg1.png';
import { HeroReelsFanShowcase } from '../components/shared/HeroReelsFanShowcase';
import { HeroPresentationCard } from '../components/shared/HeroPresentationCard';
import { HeroBrandsRow } from '../components/shared/HeroBrandsRow';
import { HeroStatsBar } from '../components/shared/HeroStatsBar';
import { CreatorMetricsTicker } from '../components/shared/CreatorMetricsTicker';

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

export default function Welcome() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [lastSlideImageIndex, setLastSlideImageIndex] = useState(0);

  const isLast = active === SLIDES.length - 1;

  // Background Image Preloader for instant smooth image transitions
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
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-white text-zinc-900 flex flex-col justify-between pt-16 sm:pt-20">
      {/* TOP SOLID WHITE NAVBAR */}
      <WelcomeNavbar />

      {/* ── DESKTOP MAIN VIEW (lg:flex) ── */}
      <div className="hidden lg:block relative z-20 w-full flex-1 lg:h-[calc(100dvh-6.5rem)] lg:min-h-[560px] lg:max-h-[calc(100dvh-6.5rem)] overflow-hidden">
        {/* UNIFIED BACKGROUND IMAGE */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none select-none z-0">
          <img
            src={reelsCardBg}
            alt=""
            aria-hidden="true"
            className="h-full w-full max-w-[70vw] xl:max-w-[68vw] object-contain object-center pointer-events-none select-none opacity-100"
          />
        </div>

        {/* 3-COLUMN GRID CONTENT */}
        <div className="relative z-10 w-full h-full grid grid-cols-[33%_37%_30%] p-0 m-0 items-center bg-transparent">
          {/* COLUMN 1 (33%): Hero Headline, Description & CTAs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full lg:h-[calc(100dvh-6.5rem)] lg:min-h-[560px] lg:max-h-[calc(100dvh-6.5rem)] flex flex-col justify-start items-start text-left pl-10 xl:pl-14 pr-3 pt-9 xl:pt-12 z-20 bg-transparent"
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
              <span className="w-6 sm:w-8 h-[2px] bg-zinc-500 inline-block" />
              <span className="text-[11px] sm:text-[12.5px] font-bold tracking-[0.24em] text-zinc-600 uppercase">
                Creators <span className="text-zinc-400 font-normal">×</span> Brands <span className="text-zinc-400 font-normal">×</span> Opportunities
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-[46px] xl:text-[58px] 2xl:text-[68px] font-black text-zinc-950 tracking-[-0.035em] leading-[1.04]">
              Turn Your<br />
              Ideas Into<br />
              <span className="relative inline-block font-['Instrument_Serif',Playfair_Display,Georgia,serif] italic font-normal text-zinc-950 tracking-normal text-[1.10em]">
                Impact
                {/* Hand-drawn amber underline stroke */}
                <svg
                  viewBox="0 0 140 18"
                  className="absolute -bottom-1.5 left-0 w-full text-amber-500/80 fill-none stroke-current stroke-[3] stroke-linecap-round pointer-events-none"
                >
                  <path d="M4 10 C 35 15, 95 14, 136 6" />
                  <path d="M20 14 C 55 17, 105 16, 128 11" opacity="0.6" />
                </svg>
              </span>
            </h1>

            {/* Subtitle Description */}
            <p className="text-[14px] xl:text-[15.5px] text-zinc-600 leading-relaxed max-w-[440px] mt-4 sm:mt-5 font-sans font-normal">
              SuviX is the all-in-one platform for creators, brands, and communities to create, share, collaborate, and grow — without limits.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3.5 mt-5 sm:mt-6 flex-wrap">
              <Link
                to="/signup"
                className="flex items-center gap-2.5 px-7 py-3.5 bg-zinc-950 hover:bg-black text-white rounded-full font-bold text-[14px] transition-all shadow-sm hover:shadow-md active:scale-[0.98] group"
              >
                <span>Get started for free</span>
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                type="button"
                className="flex items-center gap-2.5 px-6 py-3.5 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/90 rounded-full font-bold text-[14px] transition-all shadow-xs active:scale-[0.98] cursor-pointer group"
              >
                <span className="w-6 h-6 rounded-full border border-zinc-300 flex items-center justify-center bg-zinc-50 group-hover:bg-zinc-100 transition-colors">
                  <Play size={10} className="fill-zinc-900 text-zinc-900 ml-0.5" />
                </span>
                <span>Watch video</span>
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center mt-8 pt-2">
              <div className="flex -space-x-2.5">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&auto=format&fit=crop&crop=faces&q=80"
                  alt="Creator"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&auto=format&fit=crop&crop=faces&q=80"
                  alt="Creator"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&auto=format&fit=crop&crop=faces&q=80"
                  alt="Creator"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&auto=format&fit=crop&crop=faces&q=80"
                  alt="Creator"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&auto=format&fit=crop&crop=faces&q=80"
                  alt="Creator"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-xs"
                />
              </div>
              <div className="flex flex-col text-left text-zinc-600 text-[13.5px] font-semibold leading-tight ml-3.5">
                <span>Join millions of creators</span>
                <span>worldwide</span>
              </div>
            </div>
          </motion.div>

          {/* COLUMN 2 (37%): Hero Reels Fan Showcase & Widgets */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full lg:h-[calc(100dvh-6.5rem)] lg:min-h-[560px] lg:max-h-[calc(100dvh-6.5rem)] flex flex-col items-center justify-center p-0 m-0 z-10 bg-transparent"
          >
            <div className="relative z-10 w-full flex flex-col items-center justify-center py-2 px-2 gap-7 xl:gap-8">
              <HeroReelsFanShowcase />
              {/* Graphic Design Components: Live Views & Reach Widgets */}
              <div className="w-full max-w-[345px] md:max-w-[375px] xl:max-w-[395px] mx-auto z-30 pt-2">
                <CreatorMetricsTicker />
              </div>
            </div>
          </motion.div>

          {/* COLUMN 3 (30%): Presentation Card */}
          <div className="relative w-full h-full lg:h-[calc(100dvh-6.5rem)] lg:min-h-[560px] lg:max-h-[calc(100dvh-6.5rem)] flex flex-col items-center justify-center p-3 xl:p-6 bg-transparent">
            <HeroPresentationCard
              active={active}
              direction={direction}
              isLast={isLast}
              lastSlideImageIndex={lastSlideImageIndex}
              currentBgImage={currentBgImage}
            />
          </div>
        </div>
      </div>

      {/* ── MOBILE / TABLET DEDICATED VIEW (< lg) Matching Reference Mockup ── */}
      <div className="flex lg:hidden flex-col w-full z-20 gap-2.5 xs:gap-3 sm:gap-4 pb-6 overflow-x-hidden">
        {/* Background ambient image fixed in the center of the mobile screen/viewport */}
        <div className="fixed inset-0 w-full h-[100dvh] flex items-center justify-center pointer-events-none select-none z-0 opacity-85">
          <img
            src={reelsCardBg}
            alt=""
            aria-hidden="true"
            className="w-full max-w-[460px] object-contain object-center pointer-events-none select-none"
          />
        </div>

        {/* 1. TOP HERO SPLIT: Headline & Description on Left, Reels Fan Showcase on Right */}
        <div className="relative z-10 w-full px-4 xs:px-5 sm:px-8 pt-0.5 xs:pt-1">
          <div className="flex items-start justify-between gap-1 xs:gap-2">
            {/* Left Content */}
            <div className="flex-1 flex flex-col text-left max-w-[52%] xs:max-w-[51%] sm:max-w-[50%] shrink-0">
              {/* Eyebrow */}
              <div className="flex items-center gap-1.5 mb-1 xs:mb-1.5">
                <span className="w-3 h-[1.5px] bg-zinc-500 inline-block" />
                <span className="text-[7.5px] xs:text-[8.5px] font-bold tracking-[0.16em] text-zinc-600 uppercase">
                  Creators <span className="text-zinc-400 font-normal">×</span> Brands <span className="text-zinc-400 font-normal">×</span> Opps
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-[26px] xs:text-[30px] sm:text-[38px] font-black text-zinc-950 tracking-[-0.035em] leading-[1.04]">
                Turn Your<br />
                Ideas Into<br />
                <span className="relative inline-block font-['Instrument_Serif',Playfair_Display,Georgia,serif] italic font-normal text-zinc-950 tracking-normal text-[1.10em]">
                  Impact
                  {/* Underline brush */}
                  <svg
                    viewBox="0 0 140 18"
                    className="absolute -bottom-1 left-0 w-full text-amber-500/80 fill-none stroke-current stroke-[3] stroke-linecap-round pointer-events-none"
                  >
                    <path d="M4 10 C 35 15, 95 14, 136 6" />
                    <path d="M20 14 C 55 17, 105 16, 128 11" opacity="0.6" />
                  </svg>
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-[9.5px] xs:text-[10.5px] sm:text-[12px] text-zinc-600 leading-[1.35] mt-1.5 xs:mt-2 font-normal">
                SuviX is the all-in-one platform for creators, brands, and communities to create, share, collaborate, and grow — without limits.
              </p>
            </div>

            {/* Right Reels Fan Showcase */}
            <div className="flex-1 flex justify-end items-center max-w-[48%] xs:max-w-[49%] sm:max-w-[50%] overflow-visible pt-0.5">
              <HeroReelsFanShowcase />
            </div>
          </div>
        </div>

        {/* 2. ACTION BUTTONS ROW (Side-by-side, compact height) */}
        <div className="relative z-20 w-full px-4 xs:px-5 sm:px-8">
          <div className="grid grid-cols-2 gap-2 xs:gap-2.5 w-full">
            <Link
              to="/signup"
              className="flex items-center justify-center gap-1 xs:gap-1.5 h-8.5 xs:h-9 sm:h-10 bg-zinc-950 hover:bg-black text-white rounded-full font-bold text-[11px] xs:text-xs shadow-xs active:scale-[0.98] transition-all"
            >
              <span>Get started for free</span>
              <ArrowRight size={13} />
            </Link>

            <button
              type="button"
              className="flex items-center justify-center gap-1 xs:gap-1.5 h-8.5 xs:h-9 sm:h-10 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/90 rounded-full font-bold text-[11px] xs:text-xs shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full border border-zinc-300 flex items-center justify-center bg-zinc-50">
                <Play size={7} className="fill-zinc-900 text-zinc-900 ml-0.5" />
              </span>
              <span>Watch video</span>
            </button>
          </div>
        </div>

        {/* 3. SOCIAL PROOF ROW (Compact height) */}
        <div className="relative z-20 w-full px-4 xs:px-5 sm:px-8">
          <div className="flex items-center gap-2 xs:gap-2.5">
            <div className="flex -space-x-1.5">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&auto=format&fit=crop&crop=faces&q=80"
                alt="Creator"
                className="w-6 h-6 xs:w-6.5 xs:h-6.5 rounded-full border-2 border-white object-cover shadow-2xs"
              />
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&h=60&auto=format&fit=crop&crop=faces&q=80"
                alt="Creator"
                className="w-6 h-6 xs:w-6.5 xs:h-6.5 rounded-full border-2 border-white object-cover shadow-2xs"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&auto=format&fit=crop&crop=faces&q=80"
                alt="Creator"
                className="w-6 h-6 xs:w-6.5 xs:h-6.5 rounded-full border-2 border-white object-cover shadow-2xs"
              />
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=60&h=60&auto=format&fit=crop&crop=faces&q=80"
                alt="Creator"
                className="w-6 h-6 xs:w-6.5 xs:h-6.5 rounded-full border-2 border-white object-cover shadow-2xs"
              />
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&auto=format&fit=crop&crop=faces&q=80"
                alt="Creator"
                className="w-6 h-6 xs:w-6.5 xs:h-6.5 rounded-full border-2 border-white object-cover shadow-2xs"
              />
            </div>
            <div className="h-4 w-[1px] bg-zinc-200" />
            <span className="text-zinc-600 text-[9.5px] xs:text-[10.5px] font-semibold">
              Join millions of creators worldwide
            </span>
          </div>
        </div>

        {/* 4. FLOATING WHITE STATS CARD (Compact 3 Columns) */}
        <div className="relative z-20 w-full px-4 xs:px-5 sm:px-8">
          <div className="bg-white rounded-xl xs:rounded-2xl border border-zinc-200/90 shadow-[0_6px_20px_rgba(0,0,0,0.03)] py-2 px-2 xs:py-2.5 xs:px-3 grid grid-cols-3 divide-x divide-zinc-200 text-center">
            <div>
              <div className="text-sm xs:text-base font-black text-zinc-950 tracking-tight leading-none">2M+</div>
              <div className="text-[8px] xs:text-[9px] text-zinc-500 font-medium mt-0.5 leading-tight">Active Creators</div>
            </div>
            <div>
              <div className="text-sm xs:text-base font-black text-zinc-950 tracking-tight leading-none">500M+</div>
              <div className="text-[8px] xs:text-[9px] text-zinc-500 font-medium mt-0.5 leading-tight">Pieces of Content</div>
            </div>
            <div>
              <div className="text-sm xs:text-base font-black text-zinc-950 tracking-tight leading-none">150+</div>
              <div className="text-[8px] xs:text-[9px] text-zinc-500 font-medium mt-0.5 leading-tight">Countries</div>
            </div>
          </div>
        </div>

        {/* 5. LANDSCAPE PRESENTATION CARD */}
        <div className="relative z-20 w-full px-4 xs:px-5 sm:px-8">
          <HeroPresentationCard
            active={active}
            direction={direction}
            isLast={isLast}
            lastSlideImageIndex={lastSlideImageIndex}
            currentBgImage={currentBgImage}
          />
        </div>
      </div>

      {/* STATS & TESTIMONIALS BAR (Desktop) */}
      <div className="hidden lg:block">
        <HeroStatsBar />
      </div>

      {/* TRUSTED CREATOR & BRAND PARTNERS ROW */}
      <HeroBrandsRow />

      {/* LEGAL DISCLAIMER FOOTER */}
      <footer className="relative z-20 pb-2 sm:pb-4 text-center px-4">
        <p className="text-[7.5px] sm:text-[9.5px] text-zinc-500 font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
          SuviX is an independent creator platform connecting creators, video editors, and brands. Google and YouTube are trademarks of Google LLC. Meta and Instagram are trademarks of Meta Platforms, Inc.
        </p>
      </footer>
    </div>
  );
}
