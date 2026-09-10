import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  BarChart3,
  Share2,
  Star,
  Film,
  Zap,
  Sparkles,
  Rocket,
  Target,
  Camera,
  Mic,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import onboarding4 from '../../assets/images/onboarding/onboarding_4.jpg';
import onboarding5 from '../../assets/images/onboarding/onboarding_5.png';
import onboarding6 from '../../assets/images/onboarding/onboarding_6.png';
import onboarding9 from '../../assets/images/onboarding/onboarding_9.png';

const EASE = { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

export interface PresentationFeature {
  iconName:
    | 'users'
    | 'chart'
    | 'share'
    | 'star'
    | 'film'
    | 'zap'
    | 'sparkles'
    | 'rocket'
    | 'target'
    | 'camera'
    | 'mic'
    | 'shield'
    | 'trending';
  title: string;
  subtitle: string;
}

export interface PresentationSlide {
  id: string;
  category: string;
  title: string;
  description: string;
  image: string;
  features: PresentationFeature[];
}

export const PRESENTATION_SLIDES: PresentationSlide[] = [
  {
    id: 'slide-scale',
    category: 'High-Fidelity Visuals',
    title: 'Scale Your\nContent',
    description: 'Join our elite network of professional video editors and blow up your brand with cinematic content.',
    image: onboarding5,
    features: [
      {
        iconName: 'film',
        title: 'Elite Editors',
        subtitle: 'Vetted cinema-grade editors',
      },
      {
        iconName: 'zap',
        title: 'Fast Delivery',
        subtitle: '48-hour delivery on all formats',
      },
      {
        iconName: 'sparkles',
        title: 'Color & Sound',
        subtitle: 'Studio grading & SFX design',
      },
      {
        iconName: 'trending',
        title: 'Retention AI',
        subtitle: 'Optimized for watch time',
      },
    ],
  },
  {
    id: 'slide-promote',
    category: 'Creative Advertising',
    title: 'Promote with\nPower',
    description: 'Run high-impact social media ads and grow your reach with top-tier creators and promoters.',
    image: onboarding6,
    features: [
      {
        iconName: 'rocket',
        title: 'Viral Campaigns',
        subtitle: 'Reach millions on TikTok, IG, YT',
      },
      {
        iconName: 'target',
        title: 'Influencers',
        subtitle: 'Niche-specific verified creators',
      },
      {
        iconName: 'chart',
        title: 'Live Analytics',
        subtitle: 'Real-time viewer & ROI tracking',
      },
      {
        iconName: 'star',
        title: 'Brand Deals',
        subtitle: 'Direct high-paying sponsorships',
      },
    ],
  },
  {
    id: 'slide-rentals',
    category: 'Professional Rentals',
    title: 'Premium Gear\n& Services',
    description: 'Rent top-tier professional equipment or provide specialized services to scale your creative business.',
    image: onboarding9,
    features: [
      {
        iconName: 'camera',
        title: 'Cinema Gear',
        subtitle: 'Rent 4K/8K cameras & lighting',
      },
      {
        iconName: 'mic',
        title: 'Studio Spaces',
        subtitle: 'Book recording & podcast studios',
      },
      {
        iconName: 'shield',
        title: '100% Insured',
        subtitle: 'Full equipment protection',
      },
      {
        iconName: 'zap',
        title: 'Fast Pickup',
        subtitle: 'Verified local handoff & delivery',
      },
    ],
  },
  {
    id: 'slide-ecosystem',
    category: 'Elite Creator Network',
    title: 'More\nThan a Platform',
    description: 'From ideas to impact — SuviX gives you the tools, audience, and opportunities to grow without limits.',
    image: onboarding4,
    features: [
      {
        iconName: 'users',
        title: 'Connect',
        subtitle: 'Build your audience worldwide',
      },
      {
        iconName: 'chart',
        title: 'Create',
        subtitle: 'Powerful and simple tools',
      },
      {
        iconName: 'share',
        title: 'Collaborate',
        subtitle: 'Partner with brands & creators',
      },
      {
        iconName: 'star',
        title: 'Grow',
        subtitle: 'Turn passion into opportunities',
      },
    ],
  },
];

interface HeroPresentationCardProps {
  active: number;
  direction: number;
  isLast: boolean;
  lastSlideImageIndex: number;
  currentBgImage: string;
}

export function HeroPresentationCard({
  active,
  direction,
  isLast,
  lastSlideImageIndex,
  currentBgImage,
}: HeroPresentationCardProps) {
  const currentSlide = PRESENTATION_SLIDES[active % PRESENTATION_SLIDES.length];

  const renderFeatureIcon = (name: PresentationFeature['iconName']) => {
    switch (name) {
      case 'users':
        return <Users size={16} className="text-white shrink-0" />;
      case 'chart':
        return <BarChart3 size={16} className="text-white shrink-0" />;
      case 'share':
        return <Share2 size={16} className="text-white shrink-0" />;
      case 'star':
        return <Star size={16} className="text-white fill-white shrink-0" />;
      case 'film':
        return <Film size={16} className="text-white shrink-0" />;
      case 'zap':
        return <Zap size={16} className="text-white fill-white shrink-0" />;
      case 'sparkles':
        return <Sparkles size={16} className="text-white shrink-0" />;
      case 'rocket':
        return <Rocket size={16} className="text-white shrink-0" />;
      case 'target':
        return <Target size={16} className="text-white shrink-0" />;
      case 'camera':
        return <Camera size={16} className="text-white shrink-0" />;
      case 'mic':
        return <Mic size={16} className="text-white shrink-0" />;
      case 'shield':
        return <ShieldCheck size={16} className="text-white shrink-0" />;
      case 'trending':
        return <TrendingUp size={16} className="text-white shrink-0" />;
      default:
        return <Sparkles size={16} className="text-white shrink-0" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, ...EASE }}
      className="relative overflow-hidden w-full rounded-[22px] sm:rounded-[28px] p-3.5 xs:p-4.5 sm:p-6 max-w-full lg:max-w-[440px] xl:max-w-[460px] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.7)] border border-white/15 text-white flex flex-col justify-between select-none"
    >
      {/* ── DYNAMIC BACKGROUND IMAGE CONTAINER ── */}
      <div className="absolute inset-0 -z-0 overflow-hidden rounded-[inherit]">
        <AnimatePresence initial={false}>
          <motion.img
            key={isLast ? `card-bg-last-${lastSlideImageIndex}` : `card-bg-${active}`}
            src={currentBgImage}
            alt=""
            loading="eager"
            decoding="async"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
          />
        </AnimatePresence>

        {/* Balanced elegant dark overlay: lets the background image show through clearly */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/35 pointer-events-none" />
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />
      </div>

      {/* ── CARD CONTENT ── */}
      <div className="relative z-10 w-full flex flex-col justify-between h-full">
        {/* Top Header Row */}
        <div className="w-full flex items-center justify-between gap-2 mb-2 sm:mb-2.5 flex-wrap">
          {/* Eyebrow label */}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 sm:w-4 h-[1.5px] bg-white/60 inline-block" />
            <span className="text-[7.5px] sm:text-[9.5px] font-black tracking-[0.2em] text-white/80 uppercase">
              A Global Creator Community
            </span>
          </div>

          {/* Top Right: Exact Apple App Store & Google Play Store Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Apple App Store */}
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download on the App Store"
              className="flex items-center gap-1 bg-black/60 hover:bg-black/90 border border-white/25 hover:border-white/50 rounded-lg px-2 py-1 transition-all shadow-xs shrink-0 cursor-pointer group"
            >
              <svg className="w-3 h-3 text-white fill-current group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.66-.8 1.11-1.92.99-3.04-.96.04-2.13.64-2.82 1.44-.61.71-1.14 1.86-1 2.98 1.07.08 2.16-.57 2.83-1.38z"/>
              </svg>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[5.5px] sm:text-[6px] font-medium text-white/50 uppercase tracking-tight">Download on the</span>
                <span className="text-[7.5px] sm:text-[8.5px] font-bold text-white tracking-tight">App Store</span>
              </div>
            </a>

            {/* Google Play Store */}
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get it on Google Play"
              className="flex items-center gap-1 bg-black/60 hover:bg-black/90 border border-white/25 hover:border-white/50 rounded-lg px-2 py-1 transition-all shadow-xs shrink-0 cursor-pointer group"
            >
              <svg className="w-3 h-3 group-hover:scale-105 transition-transform" viewBox="0 0 24 24" fill="none">
                <path d="M3.609 1.814L15.392 12 3.609 22.186A1.85 1.85 0 0 1 3 20.8V3.2a1.85 1.85 0 0 1 .609-1.386z" fill="#00E676"/>
                <path d="M16.792 13.2l3.41-2.951a1.2 1.2 0 0 1 0 1.902L16.792 13.2z" fill="#FFD600"/>
                <path d="M17.492 10.8L5.358 0.3a1.5 1.5 0 0 0-1.749.1L17.492 10.8z" fill="#FF3D00"/>
                <path d="M5.358 23.7l12.134-10.5-13.883 10.4a1.5 1.5 0 0 0 1.749.4z" fill="#00B0FF"/>
              </svg>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[5.5px] sm:text-[6px] font-medium text-white/50 uppercase tracking-tight">GET IT ON</span>
                <span className="text-[7.5px] sm:text-[8.5px] font-bold text-white tracking-tight">Google Play</span>
              </div>
            </a>
          </div>
        </div>

        {/* ── DYNAMIC HEADLINE & DESCRIPTION (Animated on slide change) ── */}
        <div className="mt-1 mb-2 text-left min-h-[58px] sm:min-h-[66px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`slide-text-${active}`}
              initial={{ opacity: 0, y: direction * 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction * -10 }}
              transition={EASE}
            >
              <h2 className="text-lg sm:text-2xl xl:text-[25px] font-black text-white leading-[1.08] tracking-tight whitespace-pre-line">
                {currentSlide.title}
              </h2>
              <p className="text-[10px] sm:text-[11.5px] text-white/70 leading-relaxed max-w-sm mt-1 font-normal">
                {currentSlide.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── 4 DYNAMIC FEATURE ROWS (4 in row on mobile & tablet, vertical on desktop) ── */}
        <div className="my-1.5 sm:my-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={`features-group-${active}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-2 xs:grid-cols-4 lg:grid-cols-1 gap-1.5 sm:gap-2"
            >
              {currentSlide.features.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 backdrop-blur-sm transition-all text-left group min-w-0"
                >
                  <div className="w-5.5 h-5.5 sm:w-7.5 sm:h-7.5 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    {renderFeatureIcon(item.iconName)}
                  </div>
                  <div className="flex flex-col leading-tight min-w-0 overflow-hidden">
                    <span className="text-[10px] sm:text-[12.5px] font-bold text-white tracking-tight truncate">
                      {item.title}
                    </span>
                    <span className="text-[7.5px] sm:text-[9.5px] text-white/60 truncate mt-0.5">
                      {item.subtitle}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── PRIMARY CTA BUTTON ── */}
        <Link
          to="/signup"
          className="w-full h-10 sm:h-11 bg-white hover:bg-zinc-100 text-zinc-950 rounded-full font-bold text-xs sm:text-[13.5px] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] group cursor-pointer mt-1"
        >
          <span>Create your account</span>
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* ── SECONDARY SIGN IN ROW + HANDWRITTEN DOODLE ── */}
        <div className="flex items-center justify-center lg:justify-between mt-2 px-0.5 relative">
          <p className="text-[10px] sm:text-[11px] text-white/70 text-center lg:text-left">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-white font-bold underline hover:text-white/80 transition-colors ml-0.5"
            >
              Sign in
            </Link>
          </p>

          {/* Hand-drawn Caveat cursive annotation (Visible on desktop) */}
          <div className="hidden lg:block pointer-events-none -rotate-6 text-right shrink-0">
            <span className="font-['Caveat',cursive] text-white/75 font-bold text-[10.5px] sm:text-xs leading-none">
              A brighter creative tomorrow
            </span>
            <svg
              viewBox="0 0 90 8"
              className="w-14 sm:w-16 text-white/65 fill-none stroke-current stroke-[1.8] stroke-linecap-round ml-auto mt-0.5"
            >
              <path d="M2 3 Q 45 7, 88 2" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
