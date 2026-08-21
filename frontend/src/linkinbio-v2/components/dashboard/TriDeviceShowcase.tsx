import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Instagram, 
  Youtube, 
  Twitter, 
  Linkedin,
  Github,
  Globe, 
  Mail, 
  ArrowUpRight,
  ChevronRight,
  MessageCircle,
  Zap,
} from 'lucide-react';
import photographerImg from '../../../assets/categories/photographer.jpg';
import singerImg from '../../../assets/categories/singer.jpg';
import suviImg from '../../../assets/categories/suvi.png';
import defaultProfile from '../../../assets/defaultprofile.png';
import officialLogo from '../../../assets/officiallogo.png';
import whiteBgLogo from '../../../assets/whitebglogo.png';
import type { BioPageSummary } from '../../types/page.types';

interface TriDeviceShowcaseProps {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  badgeText?: string;
  primaryPage?: BioPageSummary | null;
}

export const TriDeviceShowcase: React.FC<TriDeviceShowcaseProps> = ({
  username = 'creator',
  displayName = 'SuviX Creator',
  avatarUrl,
  bio = 'Building digital products, sharing knowledge and exploring the world of tech.',
  badgeText = 'Creator & Innovator',
  primaryPage,
}) => {
  const [hoveredPhone, setHoveredPhone] = useState<'left' | 'center' | 'right' | null>(null);

  const displayAvatar = avatarUrl || suviImg || defaultProfile;
  const targetUsername = username || 'creator';
  const targetName = displayName || 'SuviX Creator';

  // Check if primaryPage has custom theme/blocks
  const primaryTheme = (primaryPage as any)?.publishedSnapshot?.theme || (primaryPage as any)?.draftTheme;
  const primaryBgColor = primaryTheme?.background?.color || primaryTheme?.background?.value || '#4D6234';

  const rawBlocks = (primaryPage as any)?.publishedSnapshot?.blocks || (primaryPage as any)?.draftBlocks || [];
  const customLinkBlocks = Array.isArray(rawBlocks) 
    ? rawBlocks.filter((b: any) => b.type === 'link-button' && b.isVisible !== false) 
    : [];

  return (
    <div className="w-full flex flex-col items-center justify-center relative py-1 select-none">
      
      {/* Top Heading with Oregano Font */}
      <h3 
        style={{ fontFamily: '"Oregano", cursive, sans-serif', fontWeight: 400 }}
        className="text-xl sm:text-2xl text-slate-800 dark:text-zinc-200 tracking-wide text-center mb-2"
      >
        Live Bio Designs & Templates
      </h3>

      {/* 3D Perspective Phone Stage */}
      <div 
        className="relative w-full max-w-[460px] h-[420px] sm:h-[450px] flex items-center justify-center"
        style={{ perspective: '1200px' }}
      >
        {/* Soft Multi-color Ambient Glow behind phones */}
        <div 
          className="absolute inset-0 -m-8 sm:-m-12 rounded-full pointer-events-none blur-3xl opacity-90 dark:opacity-55 transition-all"
          style={{
            background: 'radial-gradient(ellipse at 40% 45%, rgba(77, 98, 52, 0.6) 0%, rgba(250, 204, 21, 0.45) 40%, rgba(186, 230, 253, 0.35) 75%, rgba(199, 210, 254, 0.2) 100%)'
          }}
        />

        {/* ── 1. LEFT PHONE: Aesthetic Pastel & Editorial ── */}
        <motion.div
          onMouseEnter={() => setHoveredPhone('left')}
          onMouseLeave={() => setHoveredPhone(null)}
          animate={{
            rotateZ: hoveredPhone === 'left' ? -2 : -10,
            rotateY: hoveredPhone === 'left' ? 5 : 12,
            x: hoveredPhone === 'left' ? -75 : -62,
            y: hoveredPhone === 'left' ? -6 : 10,
            scale: hoveredPhone === 'left' ? 0.94 : 0.84,
            zIndex: hoveredPhone === 'left' ? 35 : 10,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="absolute w-[190px] sm:w-[205px] h-[375px] sm:h-[405px] rounded-[30px] bg-slate-950 p-[5px] shadow-[-12px_16px_32px_rgba(0,0,0,0.22)] border-[2.5px] border-zinc-700/80 cursor-pointer overflow-hidden"
        >
          <div className="w-full h-full rounded-[25px] bg-[#FDFBF7] text-slate-900 overflow-hidden flex flex-col relative text-[10px]">
            
            {/* Dynamic Island Notch */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-black rounded-full z-40 flex items-center justify-end px-1">
              <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
            </div>

            {/* Screen Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pt-4 px-2.5 pb-2.5 flex flex-col items-center text-center bg-[#FDFBF7]">
              <div className="relative mt-1 mb-1.5 w-13 h-13 rounded-full overflow-hidden border-2 border-rose-300 shadow-sm">
                <img src={photographerImg} alt="Sarah" className="w-full h-full object-cover" />
              </div>

              <h4 className="font-serif italic text-sm font-bold text-slate-800 tracking-tight">
                Hi! I'm Sarah
              </h4>
              <p className="text-[8px] text-slate-500 max-w-[140px] mt-0.5 leading-tight">
                Inspiration, travel presets, and visual storytelling.
              </p>

              {/* Newsletter Subscribe Capsule */}
              <div className="w-full mt-1.5 p-1.5 rounded-lg bg-rose-100/70 border border-rose-200 text-left">
                <span className="text-[7.5px] font-semibold uppercase tracking-wider text-rose-700 block">
                  Subscribe to Newsletter
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="flex-1 bg-white rounded px-1 py-0.5 text-[7.5px] text-slate-400 border border-rose-200 truncate">
                    email@domain.com
                  </div>
                  <button className="px-1.5 py-0.5 rounded bg-rose-400 text-white text-[7.5px] font-bold">
                    Join
                  </button>
                </div>
              </div>

              <div className="w-full space-y-1 mt-1.5">
                <div className="w-full py-1 px-2 rounded-md bg-rose-300/80 text-rose-950 font-semibold text-[8px] flex items-center justify-between shadow-xs">
                  <span className="truncate">Go to my Website</span>
                  <ArrowUpRight className="w-2.5 h-2.5 opacity-70" />
                </div>
                <div className="w-full py-1 px-2 rounded-md bg-white border border-rose-200 text-slate-700 font-medium text-[8px] flex items-center justify-between shadow-xs">
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="w-2 h-2 text-rose-400" />
                    vanessa@mail.com
                  </span>
                </div>
              </div>

            </div>
          </div>
        </motion.div>


        {/* ── 2. RIGHT PHONE: Bold Business Freedom ── */}
        <motion.div
          onMouseEnter={() => setHoveredPhone('right')}
          onMouseLeave={() => setHoveredPhone(null)}
          animate={{
            rotateZ: hoveredPhone === 'right' ? 2 : 10,
            rotateY: hoveredPhone === 'right' ? -5 : -12,
            x: hoveredPhone === 'right' ? 75 : 62,
            y: hoveredPhone === 'right' ? -6 : 10,
            scale: hoveredPhone === 'right' ? 0.94 : 0.84,
            zIndex: hoveredPhone === 'right' ? 35 : 10,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="absolute w-[190px] sm:w-[205px] h-[375px] sm:h-[405px] rounded-[30px] bg-slate-950 p-[5px] shadow-[12px_16px_32px_rgba(0,0,0,0.22)] border-[2.5px] border-zinc-700/80 cursor-pointer overflow-hidden"
        >
          <div className="w-full h-full rounded-[25px] bg-[#E9E4F5] text-slate-900 overflow-hidden flex flex-col relative text-[10px]">
            
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-black rounded-full z-40 flex items-center justify-end px-1">
              <div className="w-1 h-1 rounded-full bg-amber-500/40" />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pt-4 px-2.5 pb-2.5 flex flex-col items-center text-center">
              <div className="relative mt-1 w-full h-18 rounded-xl overflow-hidden bg-slate-200 shadow-xs border border-purple-200">
                <img src={singerImg} alt="Emily G" className="w-full h-full object-cover" />
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#FEF08A] text-slate-900 flex flex-col items-center justify-center font-black text-[5px] shadow-xs border border-yellow-300">
                  <Zap className="w-2 h-2 fill-slate-900" />
                </div>
                <div className="absolute bottom-0.5 left-1.5 font-serif italic text-white text-[10px] font-bold drop-shadow-sm">
                  by Emily G.
                </div>
              </div>

              <span className="text-[7px] font-bold uppercase tracking-widest text-purple-900 mt-1.5">
                LET ME HELP YOU
              </span>
              <h3 className="font-extrabold uppercase text-[10px] leading-tight text-slate-950 max-w-[140px] mt-0.5 tracking-tight">
                BUILD AN ONLINE BUSINESS FREEDOM
              </h3>

              <div className="w-full space-y-1 mt-1.5">
                <div className="w-full py-1 px-2 rounded-full bg-[#D8CEF6] text-purple-950 font-bold text-[8px] uppercase tracking-wide shadow-xs border border-purple-300">
                  YOUR WEBSITE
                </div>
                <div className="w-full py-1 px-2 rounded-full bg-[#FEF08A] text-slate-950 font-bold text-[8px] uppercase tracking-wide shadow-xs border border-yellow-300">
                  FREEBIES 4U
                </div>
              </div>

              <div className="mt-auto pt-1 flex items-center justify-between w-full border-t border-purple-300/60 text-[7px] font-bold text-purple-950">
                <span>FEMME ⚡ REBELS</span>
                <div className="flex gap-1">
                  <Instagram className="w-2 h-2" />
                  <Youtube className="w-2 h-2" />
                </div>
              </div>

            </div>
          </div>
        </motion.div>


        {/* ── 3. CENTER PHONE: Official SuviX Signature Olive Creator Bio Hub ── */}
        <motion.div
          onMouseEnter={() => setHoveredPhone('center')}
          onMouseLeave={() => setHoveredPhone(null)}
          animate={{
            scale: hoveredPhone === 'center' ? 1.03 : 1,
            y: hoveredPhone === 'center' ? -6 : 0,
            zIndex: 30,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-[210px] sm:w-[225px] h-[400px] sm:h-[430px] rounded-[34px] bg-slate-950 p-[6px] shadow-[0_20px_45px_rgba(0,0,0,0.35)] border-[3px] border-zinc-800 cursor-pointer overflow-hidden z-30 ring-1 ring-white/10"
        >
          {/* Inner Screen with Dynamic Forest Background */}
          <div 
            style={{ backgroundColor: primaryBgColor }}
            className="w-full h-full rounded-[28px] text-white overflow-hidden flex flex-col relative text-[10px]"
          >
            
            {/* Dynamic Island Pill Notch */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-black rounded-full z-40 flex items-center justify-between px-1.5 shadow-sm border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 border border-zinc-700" />
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Top Bar: SuviX White BG Logo Image + "Join SuviX →" */}
            <div className="pt-2 px-3 flex justify-between items-center z-30">
              <img src={whiteBgLogo} alt="SuviX" className="h-4 w-auto object-contain" />
              <div className="px-2 py-0.5 rounded-full bg-white text-slate-900 font-bold text-[7px] shadow-xs flex items-center gap-0.5">
                <span>Join SuviX</span>
                <span className="text-[8px]">→</span>
              </div>
            </div>

            {/* Screen Content: Scrollable Signature Olive Feed */}
            <div className="flex-1 overflow-y-auto no-scrollbar pt-1.5 px-3 pb-3 flex flex-col items-center text-center">
              
              {/* Creator Portrait with Thick White Ring + Verified Badge */}
              <div className="relative mt-1 mb-1">
                <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/90 p-0.5 shadow-md bg-white/20">
                  <img 
                    src={displayAvatar} 
                    alt={targetName} 
                    className="w-full h-full object-cover rounded-full" 
                  />
                </div>
                <div className="absolute -bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#4D6234] border border-white text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-3 h-3 fill-white text-[#4D6234]" />
                </div>
              </div>

              {/* Creator Name with Verified Badge */}
              <h3 className="font-extrabold text-[12px] text-white tracking-tight flex items-center gap-1">
                <span>{targetName}</span>
                <CheckCircle2 className="w-3 h-3 fill-white text-[#4D6234]" />
              </h3>

              {/* Sub-headline */}
              <span className="text-[8px] font-semibold text-[#D4E0C0] mt-0.5">
                {badgeText}
              </span>

              {/* Bio */}
              <p className="text-[7.5px] text-white/90 max-w-[160px] mt-0.5 leading-snug">
                {bio}
              </p>

              {/* Circular Social Icons Row */}
              <div className="flex items-center justify-center gap-1.5 my-2">
                <div className="w-5 h-5 rounded-full bg-white text-[#4D6234] flex items-center justify-center shadow-xs">
                  <Instagram className="w-2.5 h-2.5" />
                </div>
                <div className="w-5 h-5 rounded-full bg-white text-[#4D6234] flex items-center justify-center shadow-xs">
                  <Youtube className="w-2.5 h-2.5" />
                </div>
                <div className="w-5 h-5 rounded-full bg-white text-[#4D6234] flex items-center justify-center shadow-xs">
                  <Twitter className="w-2.5 h-2.5" />
                </div>
                <div className="w-5 h-5 rounded-full bg-white text-[#4D6234] flex items-center justify-center shadow-xs">
                  <Linkedin className="w-2.5 h-2.5" />
                </div>
                <div className="w-5 h-5 rounded-full bg-white text-[#4D6234] flex items-center justify-center shadow-xs">
                  <Github className="w-2.5 h-2.5" />
                </div>
                <div className="w-5 h-5 rounded-full bg-white text-[#4D6234] flex items-center justify-center shadow-xs">
                  <Mail className="w-2.5 h-2.5" />
                </div>
              </div>

              {/* White Floating Link Cards Stack (Render Custom Saved Links or Default) */}
              <div className="w-full space-y-1.5 mt-0.5">
                {customLinkBlocks.length > 0 ? (
                  customLinkBlocks.slice(0, 6).map((b: any, idx: number) => {
                    const cardTitle = b.config?.text || b.config?.title || 'Custom Link';
                    const cardSubtitle = b.config?.subtitle || '';
                    const iconKey = (b.config?.icon || '').toLowerCase();
                    const isIg = iconKey === 'instagram';
                    const isWa = iconKey === 'messagecircle' || iconKey === 'message-circle' || iconKey === 'whatsapp';
                    const isGh = iconKey === 'github';

                    const iconBg = isIg 
                      ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white'
                      : isWa
                      ? 'bg-emerald-500 text-white'
                      : isGh
                      ? 'bg-slate-900 text-white'
                      : 'bg-[#4D6234] text-white';

                    return (
                      <div key={b.id || idx} className="w-full py-1.5 px-2 rounded-xl bg-white text-slate-900 flex items-center justify-between shadow-xs hover:scale-[1.01] transition-all">
                        <div className="flex items-center gap-1.5 text-left min-w-0">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                            {isIg ? <Instagram className="w-3.5 h-3.5" /> : isWa ? <MessageCircle className="w-3.5 h-3.5" /> : isGh ? <Github className="w-3.5 h-3.5" /> : iconKey === 'youtube' ? <Youtube className="w-3.5 h-3.5" /> : iconKey === 'mail' ? <Mail className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[8px] text-slate-900 truncate leading-tight">{cardTitle}</span>
                            {cardSubtitle && <span className="text-[6.5px] text-slate-500 truncate leading-tight">{cardSubtitle}</span>}
                          </div>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                    );
                  })
                ) : (
                  <>
                    {/* Default 6 Cards */}
                    <div className="w-full py-1.5 px-2 rounded-xl bg-white text-slate-900 flex items-center justify-between shadow-xs hover:scale-[1.01] transition-all">
                      <div className="flex items-center gap-1.5 text-left min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-[#4D6234] text-white flex items-center justify-center shrink-0">
                          <Youtube className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[8px] text-slate-900 truncate leading-tight">YouTube Channel</span>
                          <span className="text-[6.5px] text-slate-500 truncate leading-tight">Subscribe to my channel</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>

                    <div className="w-full py-1.5 px-2 rounded-xl bg-white text-slate-900 flex items-center justify-between shadow-xs hover:scale-[1.01] transition-all">
                      <div className="flex items-center gap-1.5 text-left min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                          <Instagram className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[8px] text-slate-900 truncate leading-tight">Instagram</span>
                          <span className="text-[6.5px] text-slate-500 truncate leading-tight">Follow me on Instagram</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>

                    <div className="w-full py-1.5 px-2 rounded-xl bg-white text-slate-900 flex items-center justify-between shadow-xs hover:scale-[1.01] transition-all">
                      <div className="flex items-center gap-1.5 text-left min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-[#4D6234] text-white flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[8px] text-slate-900 truncate leading-tight">Email Me</span>
                          <span className="text-[6.5px] text-slate-500 truncate leading-tight">Let’s work together</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>

                    <div className="w-full py-1.5 px-2 rounded-xl bg-white text-slate-900 flex items-center justify-between shadow-xs hover:scale-[1.01] transition-all">
                      <div className="flex items-center gap-1.5 text-left min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[8px] text-slate-900 truncate leading-tight">WhatsApp</span>
                          <span className="text-[6.5px] text-slate-500 truncate leading-tight">Chat with me on WhatsApp</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>

                    <div className="w-full py-1.5 px-2 rounded-xl bg-white text-slate-900 flex items-center justify-between shadow-xs hover:scale-[1.01] transition-all">
                      <div className="flex items-center gap-1.5 text-left min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                          <Github className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[8px] text-slate-900 truncate leading-tight">GitHub</span>
                          <span className="text-[6.5px] text-slate-500 truncate leading-tight">Check out my projects</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>

                    <div className="w-full py-1.5 px-2 rounded-xl bg-white text-slate-900 flex items-center justify-between shadow-xs hover:scale-[1.01] transition-all">
                      <div className="flex items-center gap-1.5 text-left min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-[#4D6234] text-white flex items-center justify-center shrink-0">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[8px] text-slate-900 truncate leading-tight">My Portfolio</span>
                          <span className="text-[6.5px] text-slate-500 truncate leading-tight">Explore my work & projects</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>
                  </>
                )}
              </div>

              {/* Brand Footer in Phone Screen */}
              <div className="mt-3 pt-2 border-t border-white/20 flex flex-col items-center text-center">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mb-0.5">
                  <img src={officialLogo} alt="SuviX" className="w-3 h-3 object-contain brightness-0 invert" />
                </div>
                <span className="text-[7px] font-bold text-white">Created with SuviX</span>
                <span className="text-[6px] text-white/70">Connect. Collaborate. Grow.</span>
              </div>

              {/* Live URL Pill at bottom */}
              <div className="mt-2 pt-1 flex items-center gap-1 text-[7px] font-mono text-white/80">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>suvix.in/u/{targetUsername}</span>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default TriDeviceShowcase;
