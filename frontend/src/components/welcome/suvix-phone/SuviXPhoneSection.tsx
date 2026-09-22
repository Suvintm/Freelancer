// ─────────────────────────────────────────────────────────────────────────────
// SUVIX PHONE SHOWCASE SECTION — Integrated Interactive 3D Showcase
// Placed right below the Featured Creators Carousel on the Welcome Page
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion';
import { ArrowRight, Zap, Lightbulb, TrendingUp, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SuviXPhoneCanvas, PhoneAngleSwitcher } from './SuviXPhoneCanvas';
import { AskSuvixDemoCard } from './AskSuvixDemoCard';

export function SuviXPhoneSection() {
  return (
    <section className="relative w-full py-12 sm:py-16 lg:py-20 bg-white overflow-hidden border-t border-zinc-100">
      {/* Soft Ambient Radial Background Lighting */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-100/50 via-purple-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 2 Columns Side-by-Side in One Row on Desktop */}
        <div className="flex flex-col lg:flex-row items-start gap-8 w-full">
          
          {/* ── MAIN FIRST COLUMN: Two Sub-Columns (Sub-Col 1: Heading, Text & Features | Sub-Col 2: Phone Ratio Demo UI) ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full min-w-0 z-10"
          >
            {/* Two Columns Grid inside First Main Column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 items-start w-full m-0 p-0">
              
              {/* Sub-Column 1: Eyebrow, Heading, Sub-headline, Description, Features, CTAs & Metrics */}
              <div className="flex flex-col text-left space-y-3 m-0 p-0">
                {/* Pill Eyebrow */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100/80 border border-zinc-200/80 text-zinc-700 text-xs font-bold tracking-wider uppercase self-start">
                  <span className="text-purple-600">✦</span>
                  <span>ASK SUVIX</span>
                </div>

                {/* Main Headline (Increased font size) */}
                <h2 className="text-3xl sm:text-4xl md:text-[40px] lg:text-[44px] xl:text-[50px] font-black text-zinc-950 tracking-tight leading-[1.05] m-0">
                  Answers Today.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-zinc-900">
                    A Bigger Tomorrow.
                  </span>
                </h2>

                {/* Sub-headline (Hidden on mobile, visible on desktop/tablet) */}
                <p className="hidden md:block text-sm sm:text-base lg:text-lg font-bold text-zinc-800 m-0">
                  Your AI co-pilot for the creator economy.
                </p>

                {/* Text Description (Hidden on mobile, visible on desktop/tablet) */}
                <p className="hidden md:block text-zinc-600 text-xs sm:text-[13.5px] leading-relaxed m-0">
                  Ask SuviX anything about content ideas, growth strategies, brand opportunities,
                  earnings, analytics and more — and get instant, actionable insights tailored for you.
                </p>

                {/* 2x2 Feature Grid (Hidden on mobile, visible on desktop/tablet) */}
                <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-2 m-0 p-0">
                  {/* Feature 1 */}
                  <div className="flex items-start gap-2 p-2 sm:p-2.5 rounded-xl bg-zinc-50/80 border border-zinc-100 hover:border-zinc-200 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-white shadow-xs border border-zinc-200/60 flex items-center justify-center text-zinc-900 shrink-0">
                      <Zap size={14} className="fill-zinc-950 text-zinc-950" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-950">Instant Insights</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">Answers in seconds.</p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex items-start gap-2 p-2 sm:p-2.5 rounded-xl bg-zinc-50/80 border border-zinc-100 hover:border-zinc-200 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-white shadow-xs border border-zinc-200/60 flex items-center justify-center text-zinc-900 shrink-0">
                      <Lightbulb size={14} className="fill-zinc-950 text-zinc-950" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-950">Creative Ideas</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">Endless inspiration.</p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex items-start gap-2 p-2 sm:p-2.5 rounded-xl bg-zinc-50/80 border border-zinc-100 hover:border-zinc-200 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-white shadow-xs border border-zinc-200/60 flex items-center justify-center text-zinc-900 shrink-0">
                      <TrendingUp size={14} className="text-zinc-950" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-950">Growth Plans</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">Tailored strategy.</p>
                    </div>
                  </div>

                  {/* Feature 4 */}
                  <div className="flex items-start gap-2 p-2 sm:p-2.5 rounded-xl bg-zinc-50/80 border border-zinc-100 hover:border-zinc-200 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-white shadow-xs border border-zinc-200/60 flex items-center justify-center text-zinc-900 shrink-0">
                      <Briefcase size={14} className="fill-zinc-950 text-zinc-950" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-950">Brand Deals</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">Top collaborations.</p>
                    </div>
                  </div>
                </div>

                {/* CTAs: Sign Up & Log In buttons */}
                <div className="flex items-center gap-3 my-3.5 sm:my-4.5 p-0 flex-wrap">
                  <Link
                    to="/signup"
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-black text-white rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98] group"
                  >
                    <span>Sign Up Free</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-full font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-[0.98]"
                  >
                    <span>Log In</span>
                  </Link>
                </div>

                {/* Quantified Metrics Ticker */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-200/80 m-0">
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-zinc-950">1M+</div>
                    <div className="text-[10px] text-zinc-500 font-medium">Questions</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-zinc-950">2M+</div>
                    <div className="text-[10px] text-zinc-500 font-medium">Creators</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-zinc-950">500+</div>
                    <div className="text-[10px] text-zinc-500 font-medium">Brands</div>
                  </div>
                </div>
              </div>

              {/* Sub-Column 2: Ask SuviX Original UI Demo Component (Phone Aspect Ratio) */}
              <div className="w-full flex justify-center lg:justify-start items-start min-w-0 m-0 p-0">
                <AskSuvixDemoCard />
              </div>
            </div>
          </motion.div>

          {/* ── MAIN SECOND COLUMN: 3D Smartphone Canvas on Pure Bold Black ── */}
          <div className="w-full lg:w-auto shrink-0 flex flex-col items-center self-center lg:self-start">
            {/* Mobile Angle Preset Switcher: Positioned ABOVE the parent black container on mobile */}
            <div className="sm:hidden w-full flex justify-center mb-3">
              <PhoneAngleSwitcher orientation="horizontal" />
            </div>

            {/* Desktop / Laptop Layout: Vertical Angle Toolbar on the SIDE, OUTSIDE the main black div */}
            <div className="flex items-center gap-3 sm:gap-3.5">
              {/* Vertical Angle Preset Switcher: Outside on the Side */}
              <div className="hidden sm:flex shrink-0">
                <PhoneAngleSwitcher orientation="vertical" />
              </div>

              {/* Main Black Parent Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="w-full lg:w-[380px] xl:w-[420px] 2xl:w-[450px] relative flex flex-col items-center justify-center bg-black rounded-3xl p-3 sm:p-5 md:p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-zinc-900/90 overflow-hidden"
              >
              {/* Ambient Radial Spotlight inside Pure Black Stage */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.15),transparent_70%)] pointer-events-none" />

              {/* Playful Editorial Callout (White on Black) */}
              <div className="hidden xl:flex absolute top-4 right-4 flex-col items-center pointer-events-none z-20">
                <span className="text-[12.5px] font-medium text-zinc-300 font-serif italic max-w-[130px] leading-tight text-center">
                  Turn Questions Into Opportunities.
                </span>
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 40 40"
                  className="text-purple-400 fill-none stroke-current stroke-2 mt-0.5"
                >
                  <path d="M 28 4 Q 18 20 8 28" />
                  <polyline points="4,22 8,28 14,26" />
                </svg>
              </div>

              {/* SuviX 3D Phone WebGL Canvas */}
              <SuviXPhoneCanvas />

              {/* Right Tagline Stamp on Black */}
              <div className="hidden xl:flex absolute bottom-6 right-6 flex-col text-left text-[9.5px] font-black tracking-[0.24em] text-zinc-500 uppercase leading-relaxed border-l-2 border-purple-500 pl-2.5">
                <span>SAME</span>
                <span>PEOPLE.</span>
                <span className="text-white">BIGGER</span>
                <span className="text-white">POSSIBILITIES.</span>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  </section>
  );
}
