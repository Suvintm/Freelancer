import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Building2,
  Globe,
  ShieldCheck,
  Mail,
  ArrowRight,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import blackLogo from '../../assets/blackbglogo.png';
import { CookiePreferencesButton } from '../../features/consent';

// Custom Social SVG icons to precisely match the clean circle badge aesthetic
function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function LinkedinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z"/>
    </svg>
  );
}

function TwitterXIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function DiscordIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

interface WelcomeFooterProps {
  openPreferences?: () => void;
}

export function WelcomeFooter({ openPreferences }: WelcomeFooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 4000);
    }
  };

  return (
    <footer className="w-full bg-white text-zinc-900 border-t border-zinc-200/90 select-none overflow-hidden">
      {/* ── TOP MAIN CONTAINER ──────────────────────────────────────── */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-8 sm:pt-12 md:pt-14 pb-6 sm:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-start">
          
          {/* 1. BRAND COLUMN (Left: ~4 cols on desktop) */}
          <div className="lg:col-span-4 flex flex-col items-start pr-0 lg:pr-4">
            <Link to="/" className="inline-block group mb-3 sm:mb-4">
              <img
                src={blackLogo}
                alt="SuviX"
                className="h-14 sm:h-18 md:h-20 lg:h-22 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            <div className="relative mb-2.5 sm:mb-3.5">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 leading-tight">
                Edit. Create. Deliver. <br />
                <span className="relative inline-block">
                  Grow Together.
                  <svg
                    className="absolute -bottom-1 left-0 w-full h-2 text-zinc-900 overflow-visible"
                    viewBox="0 0 140 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 7C45 2 95 3 138 6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h3>
            </div>

            <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed max-w-sm mb-4 sm:mb-5">
              SuviX empowers creators and editors to turn their passion into a profession.
              More projects. More earnings. A bigger tomorrow.
            </p>

            {/* Social Icons row */}
            <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 hover:scale-105 transition-all shadow-sm"
              >
                <InstagramIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 hover:scale-105 transition-all shadow-sm"
              >
                <YoutubeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 hover:scale-105 transition-all shadow-sm"
              >
                <LinkedinIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X (Twitter)"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 hover:scale-105 transition-all shadow-sm"
              >
                <TwitterXIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Discord"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 hover:scale-105 transition-all shadow-sm"
              >
                <DiscordIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
            </div>

            <p className="text-[11px] sm:text-xs text-zinc-500 font-medium">
              Join 1M+ creators building their future with SuviX.
            </p>
          </div>

          {/* 2. NAVIGATION COLUMNS (Middle: 4 columns, compact in mobile) */}
          {/* On mobile: 2 cols with small height and compact gap to keep height minimal */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-4 lg:gap-5 pt-1 sm:pt-0">
            {/* Column 1: FOR CREATORS */}
            <div className="flex flex-col border-l border-zinc-200/80 pl-3 sm:pl-3.5">
              <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                FOR CREATORS
              </h4>
              <div className="w-5 h-[2px] bg-zinc-300 rounded-full mt-1 mb-2.5 sm:mb-3" />
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-[13px] text-zinc-600 font-medium">
                <li>
                  <Link to="/creator-workspace" className="hover:text-black hover:underline transition-colors">
                    Find Projects
                  </Link>
                </li>
                <li>
                  <Link to="/welcome" className="hover:text-black hover:underline transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/welcome" className="hover:text-black hover:underline transition-colors">
                    Creator Stories
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-black hover:underline transition-colors">
                    Earnings
                  </Link>
                </li>
                <li>
                  <Link to="/creator-tools" className="hover:text-black hover:underline transition-colors">
                    Creator Resources
                  </Link>
                </li>
                <li>
                  <Link to="/welcome" className="hover:text-black hover:underline transition-colors">
                    Download App
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: FOR BRANDS */}
            <div className="flex flex-col border-l border-zinc-200/80 pl-3 sm:pl-3.5">
              <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                FOR BRANDS
              </h4>
              <div className="w-5 h-[2px] bg-zinc-300 rounded-full mt-1 mb-2.5 sm:mb-3" />
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-[13px] text-zinc-600 font-medium">
                <li>
                  <Link to="/login" className="hover:text-black hover:underline transition-colors">
                    Find Creators
                  </Link>
                </li>
                <li>
                  <Link to="/welcome" className="hover:text-black hover:underline transition-colors">
                    Brand Solutions
                  </Link>
                </li>
                <li>
                  <Link to="/welcome" className="hover:text-black hover:underline transition-colors">
                    Success Stories
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-black hover:underline transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/creator-tools" className="hover:text-black hover:underline transition-colors">
                    Resources
                  </Link>
                </li>
                <li>
                  <a href="mailto:contact@suvix.in" className="hover:text-black hover:underline transition-colors">
                    Contact Sales
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: COMPANY */}
            <div className="flex flex-col border-l border-zinc-200/80 pl-3 sm:pl-3.5">
              <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                COMPANY
              </h4>
              <div className="w-5 h-[2px] bg-zinc-300 rounded-full mt-1 mb-2.5 sm:mb-3" />
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-[13px] text-zinc-600 font-medium">
                <li>
                  <Link to="/about" className="hover:text-black hover:underline transition-colors">
                    About Us
                  </Link>
                </li>
                <li className="flex items-center gap-1.5">
                  <Link to="/careers" className="hover:text-black hover:underline transition-colors">
                    Careers
                  </Link>
                  <span className="px-1.5 py-0.5 text-[8.5px] font-bold bg-black text-white rounded-full leading-none">
                    We're Hiring
                  </span>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-black hover:underline transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/press" className="hover:text-black hover:underline transition-colors">
                    Press & Media
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-black hover:underline transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-black hover:underline transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: SUPPORT */}
            <div className="flex flex-col border-l border-zinc-200/80 pl-3 sm:pl-3.5">
              <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                SUPPORT
              </h4>
              <div className="w-5 h-[2px] bg-zinc-300 rounded-full mt-1 mb-2.5 sm:mb-3" />
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-[13px] text-zinc-600 font-medium">
                <li>
                  <Link to="/help" className="hover:text-black hover:underline transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="hover:text-black hover:underline transition-colors">
                    Community
                  </Link>
                </li>
                <li>
                  <Link to="/guides" className="hover:text-black hover:underline transition-colors">
                    Guides
                  </Link>
                </li>
                <li>
                  <Link to="/webinars" className="hover:text-black hover:underline transition-colors">
                    Webinars
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@suvix.in" className="hover:text-black hover:underline transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <Link to="/report" className="hover:text-black hover:underline transition-colors">
                    Report an Issue
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* 3. NEWSLETTER / RIGHT SECTION (Right: ~3 cols on desktop) */}
          <div className="lg:col-span-3 flex flex-col justify-between relative pl-0 lg:pl-3">
            {/* Handwritten corner badge - desktop only */}
            <div className="hidden lg:block absolute -top-4 right-0 text-right pointer-events-none select-none">
              <p className="font-['Caveat',_cursive,_sans-serif] text-2xl font-bold text-zinc-800 leading-[1.05] tracking-tight -rotate-3">
                More<br />
                Creators<br />
                Bigger<br />
                Stories
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                  STAY IN THE LOOP
                </span>
                <span className="w-6 h-[1.5px] bg-zinc-400 inline-block" />
              </div>

              <h4 className="text-base sm:text-lg font-extrabold text-zinc-950 leading-snug tracking-tight">
                Get Opportunities,<br />
                Tips & Creator Stories.
              </h4>
              <p className="text-xs text-zinc-500 mt-1 mb-3 sm:mb-4">
                Straight to your inbox.
              </p>

              {/* Email Subscription Box */}
              <form onSubmit={handleSubscribe} className="w-full max-w-sm">
                <div className="flex items-center rounded-xl border border-zinc-300 bg-white p-1 pl-3 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all shadow-sm">
                  <Mail className="w-4 h-4 text-zinc-400 shrink-0 mr-2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 outline-none pr-2"
                  />
                  <button
                    type="submit"
                    className="bg-black hover:bg-zinc-800 text-white text-xs sm:text-[13px] font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Subscribe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {subscribed && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Thank you for subscribing!
                  </motion.p>
                )}
              </form>
            </div>

            {/* Mobile Handwritten Accent */}
            <div className="lg:hidden mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-medium">Weekly creator digests & opportunities</span>
              <span className="font-['Caveat',_cursive,_sans-serif] text-base font-bold text-zinc-700">
                More Creators • Bigger Stories
              </span>
            </div>
          </div>
        </div>

        {/* ── 4. METRIC HIGHLIGHTS STRIP ─────────────────────────────── */}
        <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-zinc-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Highlights */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-5 sm:gap-x-7 gap-y-2.5 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-700 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-zinc-900">1M+ Creators</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-zinc-300" />

            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-700 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-zinc-900">500+ Brands</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-zinc-300" />

            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-700 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-zinc-900">Global Opportunities</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-zinc-300" />

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-700 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-zinc-900">Secure & Trusted</span>
            </div>
          </div>

          {/* Tagline right */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-zinc-700">
            <span className="hover:text-black transition-colors">EDIT</span>
            <span className="text-zinc-400">›</span>
            <span className="hover:text-black transition-colors">CREATE</span>
            <span className="text-zinc-400">›</span>
            <span className="hover:text-black transition-colors">DELIVER</span>
            <span className="text-zinc-400">›</span>
            <span className="hover:text-black transition-colors">GROW</span>
          </div>
        </div>
      </div>

      {/* ── 5. BOTTOM BAR (Dark Rounded-T Bar) ───────────────────────── */}
      <div className="w-full max-w-[1440px] mx-auto px-2 sm:px-4 md:px-6">
        <div className="w-full bg-black text-white rounded-t-2xl sm:rounded-t-[22px] px-4 sm:px-8 py-3.5 sm:py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3 text-center md:text-left">
            {/* Left Copyright */}
            <p className="text-[11px] sm:text-xs text-zinc-400 font-normal">
              © 2026 SuviX. All rights reserved.
            </p>

            {/* Center Tagline (desktop / tablet) */}
            <p className="hidden md:block text-[10.5px] sm:text-[11.5px] font-bold tracking-widest text-zinc-300 uppercase">
              <span className="text-zinc-500 mr-2">──</span>
              BUILT FOR CREATORS • POWERED BY OPPORTUNITIES
              <span className="text-zinc-500 ml-2">──</span>
            </p>

            {/* Right Team Tag + Cookie Preferences */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-zinc-400 font-medium">
              <span className="flex items-center gap-1 text-zinc-300">
                <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
                Make Creativity a Career.
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-300 font-semibold">#TeamSuviX</span>
              {openPreferences && (
                <>
                  <span className="text-zinc-600">|</span>
                  <CookiePreferencesButton
                    onClick={openPreferences}
                    className="text-zinc-400 hover:text-white transition-colors"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
