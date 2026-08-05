import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Target, Users, ShieldCheck, Globe, Linkedin, Instagram, MapPin, UserCheck, HelpCircle, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import darkLogo from '../assets/darklogo.png';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-white text-zinc-900 font-sans antialiased selection:bg-rose-500 selection:text-white">
      {/* ── TOP NAVIGATION HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={darkLogo} 
              alt="SuviX Logo" 
              className="h-8 sm:h-10 w-auto object-contain cursor-pointer"
              onClick={() => navigate('/')}
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <Link
              to="/login"
              className="hidden sm:inline-flex text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-900 px-4 py-2 rounded-full transition-all"
            >
              Sign In
            </Link>

            <Link
              to="/role-selection"
              className="flex items-center gap-1 text-xs sm:text-sm font-bold text-white bg-zinc-900 hover:bg-black px-4 py-2 rounded-full transition-all shadow-sm active:scale-95"
            >
              <span>Get Started</span>
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">
        
        {/* ── HERO BANNER ── */}
        <section className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-rose-500" />
            <span>Corporate Overview</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 leading-[1.08]">
            About <span className="text-rose-600">SuviX</span>
          </h1>

          <p className="text-lg sm:text-xl font-medium text-zinc-600 leading-relaxed">
            The AI-powered creator growth platform connecting YouTubers, digital creators, video editors, singers, and creative professionals.
          </p>
        </section>

        {/* ── MISSION & PURPOSE ── */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-zinc-50 border border-zinc-200/90 rounded-3xl p-6 sm:p-10 space-y-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600">
              <Target size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Our Mission</h2>
          </div>

          <p className="text-sm sm:text-base text-zinc-700 leading-relaxed font-medium">
            SuviX (<a href="https://suvix.in" className="text-rose-600 font-bold hover:underline">suvix.in</a>) is engineered to solve the core challenges of the creator economy. By uniting AI-driven talent matching, milestone escrow protection, freelance workflow management, and equipment rentals into one unified platform, SuviX empowers creators to scale their content while ensuring editors and creative professionals get paid fairly and predictably.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-zinc-200">
            <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 w-fit">
                <Users size={18} />
              </div>
              <h3 className="font-bold text-sm text-zinc-900">Vetted Matching</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Matches YouTubers directly with specialized editors, thumbnail artists, and production crews.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 w-fit">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-bold text-sm text-zinc-900">Milestone Escrow</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Secure financial contracts guaranteeing creators receive high-quality work and editors receive payments.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-2">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 w-fit">
                <Zap size={18} />
              </div>
              <h3 className="font-bold text-sm text-zinc-900">AI Creator Tools</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Intelligent analytics and workflow tools tailored specifically for modern video production teams.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── VERIFIED CORPORATE PROFILE & IDENTITY ── */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 space-y-8 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <UserCheck size={22} className="text-rose-600" />
                Verified Entity Profile
              </h2>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">Corporate Identity &amp; Governance</p>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
              <CheckCircle2 size={14} />
              Verified Brand Entity
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-left">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Founder &amp; CEO</p>
              <p className="text-base font-bold text-zinc-900 mt-1">Suvin T M</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Headquarters</p>
              <p className="text-base font-bold text-zinc-900 mt-1 flex items-center gap-1.5">
                <MapPin size={15} className="text-rose-600 shrink-0" />
                Bengaluru, India
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Official Portal</p>
              <a href="https://suvix.in" className="text-base font-bold text-rose-600 hover:underline mt-1 flex items-center gap-1.5">
                <Globe size={15} className="shrink-0" />
                suvix.in
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Status</p>
              <p className="text-base font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Active Platform
              </p>
            </div>
          </div>

          {/* ── OFFICIAL BRAND CHANNELS & OFFICIAL STORE BUTTONS ── */}
          <div className="pt-6 border-t border-zinc-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Official Channels &amp; Mobile Applications
            </h3>

            <div className="flex flex-wrap gap-3">
              {/* LinkedIn */}
              <a 
                href="https://www.linkedin.com/company/suvix/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-zinc-100 hover:bg-blue-50 border border-zinc-200 hover:border-blue-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-zinc-800 hover:text-blue-600 transition-all shadow-xs group cursor-pointer"
              >
                <Linkedin size={17} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <span>LinkedIn</span>
              </a>

              {/* Instagram */}
              <a 
                href="https://www.instagram.com/suvix_official?igsh=eTJnamYzdzRra3Fv"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-zinc-100 hover:bg-pink-50 border border-zinc-200 hover:border-pink-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-zinc-800 hover:text-pink-600 transition-all shadow-xs group cursor-pointer"
              >
                <Instagram size={17} className="text-pink-600 group-hover:scale-110 transition-transform" />
                <span>Instagram</span>
              </a>

              {/* Twitter / X */}
              <a 
                href="https://x.com/suvix_official"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-zinc-800 transition-all shadow-xs group cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current text-zinc-900 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>X (@suvix_official)</span>
              </a>

              {/* Official Apple App Store Button */}
              <a 
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-zinc-900 hover:bg-black px-4 py-2 rounded-2xl text-white transition-all shadow-md cursor-pointer group"
              >
                <svg className="w-5 h-5 fill-current text-white group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.66-.8 1.11-1.92.99-3.04-.96.04-2.13.64-2.82 1.44-.61.71-1.14 1.86-1 2.98 1.07.08 2.16-.57 2.83-1.38z"/>
                </svg>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[8px] font-medium text-zinc-400 uppercase tracking-tight">Download on the</span>
                  <span className="text-xs font-bold text-white tracking-tight">App Store</span>
                </div>
              </a>

              {/* Official Google Play Store Button */}
              <a 
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-zinc-900 hover:bg-black px-4 py-2 rounded-2xl text-white transition-all shadow-md cursor-pointer group"
              >
                <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24" fill="none">
                  <path d="M3.609 1.814L15.392 12 3.609 22.186A1.85 1.85 0 0 1 3 20.8V3.2a1.85 1.85 0 0 1 .609-1.386z" fill="#00E676"/>
                  <path d="M16.792 13.2l3.41-2.951a1.2 1.2 0 0 1 0 1.902L16.792 13.2z" fill="#FFD600"/>
                  <path d="M17.492 10.8L5.358 0.3a1.5 1.5 0 0 0-1.749.1L17.492 10.8z" fill="#FF3D00"/>
                  <path d="M5.358 23.7l12.134-10.5-13.883 10.4a1.5 1.5 0 0 0 1.749.4z" fill="#00B0FF"/>
                </svg>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[8px] font-medium text-zinc-400 uppercase tracking-tight">GET IT ON</span>
                  <span className="text-xs font-bold text-white tracking-tight">Google Play</span>
                </div>
              </a>
            </div>
          </div>
        </motion.section>

        {/* ── BRAND DISAMBIGUATION & FAQ SECTION ── */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-zinc-50 border border-zinc-200/90 rounded-3xl p-6 sm:p-10 space-y-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600">
              <HelpCircle size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6 divide-y divide-zinc-200 text-sm">
            <div className="pt-4 first:pt-0 space-y-1.5">
              <h3 className="font-bold text-base text-zinc-900">What is SuviX?</h3>
              <p className="text-zinc-600 leading-relaxed">
                SuviX (<a href="https://suvix.in" className="text-rose-600 font-semibold hover:underline">suvix.in</a>) is an AI creator growth platform founded by Suvin T M in Bengaluru, Karnataka, India. It provides matching tools for YouTubers, singers, editors, and digital professionals.
              </p>
            </div>

            <div className="pt-4 space-y-1.5">
              <h3 className="font-bold text-base text-zinc-900">Is SuviX affiliated with Suvix Technology Private Limited?</h3>
              <p className="text-zinc-600 leading-relaxed">
                No. SuviX (<a href="https://suvix.in" className="text-rose-600 font-semibold hover:underline">suvix.in</a>) is an independent AI creator growth platform headquartered in Bengaluru, Karnataka, India, and is distinct from any separate entities.
              </p>
            </div>
          </div>
        </motion.section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-200 bg-zinc-50 py-8 px-4 text-center text-xs text-zinc-500 space-y-2">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SuviX (suvix.in). All rights reserved. Founded by Suvin T M, Bengaluru, Karnataka, India.</p>
          <div className="flex items-center gap-4 font-medium text-zinc-600">
            <Link to="/privacy" className="hover:text-zinc-900">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-zinc-900">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
