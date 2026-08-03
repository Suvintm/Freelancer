import { motion } from 'framer-motion';
import { Sparkles, Flame, Zap } from 'lucide-react';
import logo from '../../assets/logo.png';

interface CreatorCardData {
  id: string;
  name: string;
  handle: string;
  subscribers: string;
  avatar: string;
  mediaUrl: string;
  mediaType: 'short' | 'video';
  tag?: string;
  badgeIcon?: 'growth' | 'verified' | 'viral';
  positionClass: string;
  rotation: number;
  zIndex: number;
  chipPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  floatDuration: number;
  floatDelay: number;
}

const SHOWCASE_CARDS: CreatorCardData[] = [
  {
    id: 'vanessa-lau',
    name: 'Vanessa Lau',
    handle: '@VanessaLau',
    subscribers: '954K subscribers',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    mediaUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=650&fit=crop',
    mediaType: 'short',
    tag: '⚡ Top Educator',
    badgeIcon: 'verified',
    positionClass: 'w-[42%] sm:w-[38%] aspect-[3/4] top-[0%] left-[2%]',
    rotation: -5,
    zIndex: 20,
    chipPosition: 'bottom-right',
    floatDuration: 5.2,
    floatDelay: 0,
  },
  {
    id: 'jenny-hoyos',
    name: 'Jenny Hoyos',
    handle: '@JennyHoyos',
    subscribers: '9M subscribers',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces',
    mediaUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&h=750&fit=crop',
    mediaType: 'short',
    tag: '🔥 100M+ Monthly Views',
    badgeIcon: 'viral',
    positionClass: 'w-[44%] sm:w-[42%] aspect-[3/4.2] top-[2%] right-[1%]',
    rotation: 5,
    zIndex: 25,
    chipPosition: 'bottom-left',
    floatDuration: 5.8,
    floatDelay: 0.7,
  },
  {
    id: 'saucestache',
    name: 'Sauce Stache',
    handle: '@SauceStache',
    subscribers: '655K subscribers',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
    mediaUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&h=400&fit=crop',
    mediaType: 'video',
    tag: '🍳 Studio Creator',
    badgeIcon: 'growth',
    positionClass: 'w-[46%] sm:w-[42%] aspect-[16/11] bottom-[12%] left-[0%]',
    rotation: -3,
    zIndex: 15,
    chipPosition: 'bottom-right',
    floatDuration: 6.2,
    floatDelay: 1.2,
  },
  {
    id: 'danie-jay',
    name: 'Danie Jay',
    handle: '@DanieJay',
    subscribers: '80K subscribers',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces',
    mediaUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&h=650&fit=crop',
    mediaType: 'short',
    tag: '📈 +310% YoY',
    badgeIcon: 'growth',
    positionClass: 'w-[40%] sm:w-[36%] aspect-[3/4] bottom-[0%] left-[30%]',
    rotation: 2,
    zIndex: 35,
    chipPosition: 'bottom-left',
    floatDuration: 4.8,
    floatDelay: 0.3,
  },
  {
    id: 'devin-supertramp',
    name: 'Devin Super Tramp',
    handle: '@devinsupertramp',
    subscribers: '6.4M subscribers',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
    mediaUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&h=400&fit=crop',
    mediaType: 'video',
    tag: '🎬 4K Action Films',
    badgeIcon: 'verified',
    positionClass: 'w-[46%] sm:w-[44%] aspect-[16/11] bottom-[8%] right-[0%]',
    rotation: 4,
    zIndex: 18,
    chipPosition: 'bottom-left',
    floatDuration: 5.5,
    floatDelay: 1.5,
  },
];

interface CreatorShowcaseCollageProps {
  className?: string;
  theme?: 'dark' | 'light';
}

export function CreatorShowcaseCollage({
  className = '',
  theme = 'dark'
}: CreatorShowcaseCollageProps) {
  const isDark = theme === 'dark';

  // ── FULL 5-CARD 3D CREATOR COLLAGE (Unified for Laptop & Mobile) ─────────
  return (
    <div className={`relative w-full aspect-[16/13] max-w-[28rem] xl:max-w-[31rem] mx-auto select-none ${className}`}>
      {/* Ambient Radial Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-red-600/15 via-amber-500/15 to-rose-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {SHOWCASE_CARDS.map((card) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 30, rotate: card.rotation, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, rotate: card.rotation, scale: 1 }}
          transition={{ duration: 0.8, delay: card.floatDelay * 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ zIndex: card.zIndex }}
          className={`absolute ${card.positionClass}`}
        >
          {/* Continuous Floating Bob Animation */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [card.rotation, card.rotation + (card.rotation > 0 ? 1 : -1), card.rotation],
            }}
            transition={{
              duration: card.floatDuration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: card.floatDelay,
            }}
            className="relative w-full h-full group cursor-pointer"
          >
            {/* Card Frame with 3D Depth */}
            <div
              className={`relative w-full h-full rounded-[1.4rem] sm:rounded-[1.6rem] overflow-hidden border-[3px] shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-all duration-300 group-hover:scale-105 ${
                isDark
                  ? 'border-white/90 bg-zinc-900 group-hover:shadow-[0_24px_55px_rgba(255,255,255,0.12)]'
                  : 'border-white bg-white group-hover:shadow-[0_24px_55px_rgba(0,0,0,0.22)]'
              }`}
            >
              <img
                src={card.mediaUrl}
                alt={card.name}
                className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

              {/* Tag / Micro Badge on Image */}
              {card.tag && (
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  {card.badgeIcon === 'viral' && <Flame size={9} className="text-amber-400 fill-amber-400" />}
                  {card.badgeIcon === 'growth' && <Zap size={9} className="text-emerald-400 fill-emerald-400" />}
                  {card.badgeIcon === 'verified' && <Sparkles size={9} className="text-red-400" />}
                  <span>{card.tag}</span>
                </div>
              )}
            </div>

            {/* Creator Identity Chip (Float Overlay Pill) */}
            <div
              className={`absolute ${
                card.chipPosition === 'bottom-left'
                  ? '-bottom-2.5 -left-2.5 sm:-bottom-3.5 sm:-left-3.5'
                  : '-bottom-2.5 -right-2.5 sm:-bottom-3.5 sm:-right-3.5'
              } z-40 bg-white text-zinc-900 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.3)] border border-zinc-100 pl-1.5 pr-3 py-1 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-transform duration-300 group-hover:scale-105`}
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-900 border border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                <img src={card.avatar} alt={card.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col leading-tight pr-0.5">
                <span className="text-[9.5px] sm:text-[10.5px] font-black text-zinc-900 tracking-tight">
                  {card.handle}
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold text-zinc-500">{card.subscribers}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ))}

      {/* Central Brand Mark / Nexus Center Hub (SuviX Logo) */}
      <motion.div
        initial={{ scale: 0, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 150, damping: 14, delay: 0.4 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex items-center justify-center"
        >
          {/* Pulsing Backlight */}
          <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-60 animate-ping" />

          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-[3px] border-white shadow-[0_14px_35px_rgba(0,0,0,0.4)] flex items-center justify-center p-2.5 overflow-hidden">
            <img src={logo} alt="SuviX" className="w-full h-full object-contain" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

