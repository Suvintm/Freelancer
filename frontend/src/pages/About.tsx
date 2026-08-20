import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Target, Users, ShieldCheck, Globe, Linkedin, Instagram, MapPin, UserCheck, HelpCircle, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import darkLogo from '../assets/darklogo.png';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-white text-zinc-900 font-sans antialiased selection:bg-rose-500 selection:text-white">
      {/* ── TOP NAVIGATION HEADER- ── */}
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

        {/* ── FOUNDER & LEAD DEVELOPER SPOTLIGHT ── */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white rounded-3xl p-6 sm:p-10 space-y-6 shadow-xl border border-zinc-800"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={14} />
                <span>Founder &amp; Chief Architect</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Suvin T M</h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">Founder, CEO &amp; Lead Developer of SuviX (suvix.in)</p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Founder LinkedIn */}
              <a 
                href="https://www.linkedin.com/in/suvintm/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 group"
              >
                <Linkedin size={16} className="group-hover:scale-110 transition-transform" />
                <span>Founder LinkedIn</span>
              </a>

              {/* Founder Instagram */}
              <a 
                href="https://www.instagram.com/su_vin_tm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-90 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 group"
              >
                <Instagram size={16} className="group-hover:scale-110 transition-transform" />
                <span>Founder Instagram</span>
              </a>
            </div>
          </div>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Suvin T M is the founder and lead software architect behind SuviX (<a href="https://suvix.in" className="text-rose-400 font-bold hover:underline">suvix.in</a>). Headquartered in Bengaluru, Karnataka, India, Suvin engineered SuviX from the ground up to empower YouTubers, singers, editors, and digital creators with AI-driven matching tools, secure milestone contracts, and next-generation collaboration workflows.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium pt-2">
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Role</span>
              <span className="text-white font-bold text-sm">Founder &amp; Developer</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Location</span>
              <span className="text-white font-bold text-sm">Bengaluru, India</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Primary Web Domain</span>
              <span className="text-rose-400 font-bold text-sm">suvix.in</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Platform</span>
              <span className="text-emerald-400 font-bold text-sm">SuviX AI Platform</span>
            </div>
          </div>
        </motion.section>

        {/* ── VERIFIED CORPORATE PROFILE & IDENTITY ── */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 space-y-8 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <UserCheck size={22} className="text-rose-600" />
                Verified Entity Profile
              </h2>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">Corporate Governance &amp; Official Accounts</p>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
              <CheckCircle2 size={14} />
              Verified Brand Entity
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-left">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Founder &amp; Developer</p>
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
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Official Web Domain</p>
              <a href="https://suvix.in" className="text-base font-bold text-rose-600 hover:underline mt-1 flex items-center gap-1.5">
                <Globe size={15} className="shrink-0" />
                suvix.in
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Status</p>
              <p className="text-base font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Active Enterprise
              </p>
            </div>
          </div>

          {/* ── OFFICIAL BRAND CHANNELS ── */}
          <div className="pt-6 border-t border-zinc-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Official SuviX Brand Channels
            </h3>

            <div className="flex flex-wrap gap-3">
              {/* SuviX Official Instagram */}
              <a 
                href="https://www.instagram.com/suvix_official/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-zinc-100 hover:bg-pink-50 border border-zinc-200 hover:border-pink-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-zinc-800 hover:text-pink-600 transition-all shadow-xs group cursor-pointer"
              >
                <Instagram size={17} className="text-pink-600 group-hover:scale-110 transition-transform" />
                <span>SuviX Instagram (@suvix_official)</span>
              </a>

              {/* SuviX Official LinkedIn */}
              <a 
                href="https://www.linkedin.com/company/suvix/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-zinc-100 hover:bg-blue-50 border border-zinc-200 hover:border-blue-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-zinc-800 hover:text-blue-600 transition-all shadow-xs group cursor-pointer"
              >
                <Linkedin size={17} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <span>SuviX LinkedIn Company</span>
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
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Entity Disambiguation &amp; FAQ</h2>
              <p className="text-xs text-zinc-500 font-mono">Google Knowledge Base Disambiguation Statement</p>
            </div>
          </div>

          <div className="space-y-6 divide-y divide-zinc-200 text-sm">
            <div className="pt-4 first:pt-0 space-y-1.5">
              <h3 className="font-bold text-base text-zinc-900">What is SuviX and who created it?</h3>
              <p className="text-zinc-600 leading-relaxed">
                SuviX (<a href="https://suvix.in" className="text-rose-600 font-semibold hover:underline">suvix.in</a>) is an AI creator growth &amp; collaboration platform founded and developed by Suvin T M in Bengaluru, Karnataka, India. It connects YouTubers, singers, editors, and digital creators with talent matching and AI workflow tools.
              </p>
            </div>

            <div className="pt-4 space-y-1.5">
              <h3 className="font-bold text-base text-zinc-900">Who is Suvin T M?</h3>
              <p className="text-zinc-600 leading-relaxed">
                Suvin T M is the Founder, CEO, and Lead Developer of SuviX (<a href="https://suvix.in" className="text-rose-600 font-semibold hover:underline">suvix.in</a>). Official founder profiles: <a href="https://www.linkedin.com/in/suvintm/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">LinkedIn (suvintm)</a> and <a href="https://www.instagram.com/su_vin_tm" target="_blank" rel="noopener noreferrer" className="text-pink-600 font-semibold hover:underline">Instagram (su_vin_tm)</a>.
              </p>
            </div>

            <div className="pt-4 space-y-1.5">
              <h3 className="font-bold text-base text-zinc-900">Is SuviX affiliated with Suvix Technology Private Limited in Tamil Nadu?</h3>
              <p className="text-zinc-600 leading-relaxed">
                No. SuviX (<a href="https://suvix.in" className="text-rose-600 font-semibold hover:underline">suvix.in</a>) is an independent AI creator growth platform headquartered in Bengaluru, Karnataka, India, founded and developed by Suvin T M. It is distinct from and not affiliated with any separate company registrees or legacy entities in Tamil Nadu or other regions.
              </p>
            </div>

            <div className="pt-4 space-y-1.5">
              <h3 className="font-bold text-base text-zinc-900">What are the official links for SuviX?</h3>
              <p className="text-zinc-600 leading-relaxed">
                Official Website: <a href="https://suvix.in" className="text-rose-600 font-semibold hover:underline">https://suvix.in</a><br />
                Official Instagram: <a href="https://www.instagram.com/suvix_official/" target="_blank" rel="noopener noreferrer" className="text-pink-600 font-semibold hover:underline">instagram.com/suvix_official/</a><br />
                Official LinkedIn: <a href="https://www.linkedin.com/company/suvix/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">linkedin.com/company/suvix/</a>
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
