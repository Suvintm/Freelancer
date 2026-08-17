import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Instagram, 
  Youtube, 
  Twitter, 
  Globe, 
  Mail, 
  Phone, 
  Play, 
  ArrowUpRight,
  ShoppingBag,
  Zap,
  Radio,
} from 'lucide-react';
import photographerImg from '../../../assets/categories/photographer.jpg';
import singerImg from '../../../assets/categories/singer.jpg';
import suviImg from '../../../assets/categories/suvi.png';

export const TriDeviceShowcase: React.FC = () => {
  const [hoveredPhone, setHoveredPhone] = useState<'left' | 'center' | 'right' | null>(null);

  return (
    <div className="w-full flex flex-col items-center justify-center relative py-1 select-none">
      
      {/* Top Heading with Oregano Font without border and icon */}
      <h3 
        style={{ fontFamily: '"Oregano", cursive, sans-serif', fontWeight: 400 }}
        className="text-xl sm:text-2xl text-slate-800 dark:text-zinc-200 tracking-wide text-center mb-2"
      >
        Live Bio Designs & Templates
      </h3>

      {/* 3D Perspective Phone Stage - Scaled Down & Tight Spacing */}
      <div 
        className="relative w-full max-w-[460px] h-[420px] sm:h-[450px] flex items-center justify-center"
        style={{ perspective: '1200px' }}
      >
        {/* Soft Multi-color Rich Yellow & Blue Ambient Overlay behind phones */}
        <div 
          className="absolute inset-0 -m-8 sm:-m-12 rounded-full pointer-events-none blur-3xl opacity-90 dark:opacity-55 transition-all"
          style={{
            background: 'radial-gradient(ellipse at 40% 45%, rgba(250, 204, 21, 0.8) 0%, rgba(254, 240, 138, 0.75) 40%, rgba(186, 230, 253, 0.55) 75%, rgba(199, 210, 254, 0.25) 100%)'
          }}
        />

        {/* ── 1. LEFT PHONE: Aesthetic Pastel & Editorial (Reference #2) ── */}
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
          {/* Outer Screen */}
          <div className="w-full h-full rounded-[25px] bg-[#FDFBF7] text-slate-900 overflow-hidden flex flex-col relative text-[10px]">
            
            {/* Dynamic Island Notch */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-black rounded-full z-40 flex items-center justify-end px-1">
              <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
            </div>

            {/* Screen Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pt-4 px-2.5 pb-2.5 flex flex-col items-center text-center bg-[#FDFBF7]">
              
              {/* Circular Arch Portrait */}
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

              {/* Action Link Pills */}
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
                <div className="w-full py-1 px-2 rounded-md bg-white border border-rose-200 text-slate-700 font-medium text-[8px] flex items-center justify-between shadow-xs">
                  <span className="flex items-center gap-1 truncate">
                    <Phone className="w-2 h-2 text-rose-400" />
                    +1 800 000 000
                  </span>
                </div>
              </div>

            </div>
          </div>
        </motion.div>


        {/* ── 2. RIGHT PHONE: Bold Business Freedom (Reference #1) ── */}
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
          {/* Outer Screen */}
          <div className="w-full h-full rounded-[25px] bg-[#E9E4F5] text-slate-900 overflow-hidden flex flex-col relative text-[10px]">
            
            {/* Dynamic Island Notch */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-black rounded-full z-40 flex items-center justify-end px-1">
              <div className="w-1 h-1 rounded-full bg-amber-500/40" />
            </div>

            {/* Screen Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pt-4 px-2.5 pb-2.5 flex flex-col items-center text-center">
              
              {/* Arch Photo Header with Yellow Badge */}
              <div className="relative mt-1 w-full h-18 rounded-xl overflow-hidden bg-slate-200 shadow-xs border border-purple-200">
                <img src={singerImg} alt="Emily G" className="w-full h-full object-cover" />
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#FEF08A] text-slate-900 flex flex-col items-center justify-center font-black text-[5px] shadow-xs border border-yellow-300">
                  <Zap className="w-2 h-2 fill-slate-900" />
                </div>
                <div className="absolute bottom-0.5 left-1.5 font-serif italic text-white text-[10px] font-bold drop-shadow-sm">
                  by Emily G.
                </div>
              </div>

              {/* Bold Editorial Headline */}
              <span className="text-[7px] font-bold uppercase tracking-widest text-purple-900 mt-1.5">
                LET ME HELP YOU
              </span>
              <h3 className="font-extrabold uppercase text-[10px] leading-tight text-slate-950 max-w-[140px] mt-0.5 tracking-tight">
                BUILD AN ONLINE BUSINESS FREEDOM
              </h3>

              {/* Bold Rounded Pills */}
              <div className="w-full space-y-1 mt-1.5">
                <div className="w-full py-1 px-2 rounded-full bg-[#D8CEF6] text-purple-950 font-bold text-[8px] uppercase tracking-wide shadow-xs border border-purple-300">
                  YOUR WEBSITE
                </div>
                <div className="w-full py-1 px-2 rounded-full bg-[#D8CEF6] text-purple-950 font-bold text-[8px] uppercase tracking-wide shadow-xs border border-purple-300">
                  SIGNATURE WORKSHOP
                </div>
                <div className="w-full py-1 px-2 rounded-full bg-[#FEF08A] text-slate-950 font-bold text-[8px] uppercase tracking-wide shadow-xs border border-yellow-300">
                  FREEBIES 4U
                </div>
              </div>

              {/* Brand Footer */}
              <div className="mt-auto pt-1 flex items-center justify-between w-full border-t border-purple-300/60 text-[7px] font-bold text-purple-950">
                <span>FEMME ⚡ REBELS</span>
                <div className="flex gap-1">
                  <Instagram className="w-2 h-2" />
                  <Youtube className="w-2 h-2" />
                  <Twitter className="w-2 h-2" />
                </div>
              </div>

            </div>
          </div>
        </motion.div>


        {/* ── 3. CENTER PHONE: Modern SuviX Creator Bio Hub (z-30) ── */}
        <motion.div
          onMouseEnter={() => setHoveredPhone('center')}
          onMouseLeave={() => setHoveredPhone(null)}
          animate={{
            scale: hoveredPhone === 'center' ? 1.03 : 1,
            y: hoveredPhone === 'center' ? -6 : 0,
            zIndex: 30,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-[205px] sm:w-[220px] h-[395px] sm:h-[425px] rounded-[34px] bg-slate-950 p-[6px] shadow-[0_20px_45px_rgba(0,0,0,0.3)] border-[3px] border-zinc-800 cursor-pointer overflow-hidden z-30 ring-1 ring-white/10"
        >
          {/* Inner Screen */}
          <div className="w-full h-full rounded-[28px] bg-white dark:bg-black text-slate-900 dark:text-white overflow-hidden flex flex-col relative text-[10px] border border-slate-200 dark:border-zinc-800">
            
            {/* Dynamic Island Pill Notch */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-black rounded-full z-40 flex items-center justify-between px-1.5 shadow-sm border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 border border-zinc-700" />
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Top Status Bar */}
            <div className="pt-1.5 px-4 flex justify-between items-center text-[8px] font-bold text-slate-400 dark:text-zinc-500">
              <span>9:41</span>
              <span>5G</span>
            </div>

            {/* Screen Content - Alex Morgan Bio */}
            <div className="flex-1 overflow-y-auto no-scrollbar pt-2 px-2.5 pb-2.5 flex flex-col items-center text-center">
              
              {/* Creator Avatar & Verified Badge */}
              <div className="relative mt-0.5 mb-1">
                <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-slate-900 dark:ring-white p-0.5 shadow-xs">
                  <img src={suviImg} alt="Creator" className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-sky-500 text-white shadow-xs">
                  <CheckCircle2 className="w-2.5 h-2.5 fill-white text-sky-500" />
                </div>
              </div>

              <h3 className="font-bold text-[11px] text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
                Alex Morgan
              </h3>
              <p className="text-[8px] text-slate-500 dark:text-zinc-400 max-w-[150px] mt-0.5 leading-tight">
                Product Designer & YouTuber. Building for 250k+ creators.
              </p>

              {/* Social Bar */}
              <div className="flex items-center gap-1 my-1.5">
                <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300">
                  <Instagram className="w-2 h-2" />
                </div>
                <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300">
                  <Youtube className="w-2 h-2 text-red-500" />
                </div>
                <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300">
                  <Twitter className="w-2 h-2 text-sky-500" />
                </div>
                <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300">
                  <Globe className="w-2 h-2" />
                </div>
              </div>

              {/* Link Buttons */}
              <div className="w-full space-y-1 mt-0.5">
                <div className="w-full py-1.5 px-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold text-[8px] flex items-center justify-between shadow-xs hover:scale-[1.02] transition-transform">
                  <span className="flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    Creator Academy 2026
                  </span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </div>

                <div className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold text-[8px] flex items-center justify-between shadow-xs">
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-2.5 h-2.5 text-emerald-500" />
                    Lightroom Presets Vol. 2
                  </span>
                  <span className="text-[7.5px] font-mono text-emerald-600 dark:text-emerald-400">$29</span>
                </div>

                <div className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 font-medium text-[8px] flex items-center justify-between shadow-xs">
                  <span className="flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5 text-purple-500" />
                    Listen to Podcast Ep. 42
                  </span>
                  <Play className="w-2 h-2 opacity-60" />
                </div>
              </div>

              {/* Live Status Pill at bottom */}
              <div className="mt-auto pt-1.5 flex items-center gap-1 text-[7.5px] font-mono text-slate-400 dark:text-zinc-500">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                <span>suvix.me/alexmorgan</span>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
