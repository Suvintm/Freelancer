import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Info,
  Check,
  ArrowRight,
  X,
  Play,
  Briefcase,
  Star,
  Layers,
  Sparkles,
  Flame,
  Zap,
  Award,
  Film,
  Music,
  Mail,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useDispatch } from 'react-redux';
import { clearTempSignupData, setTempSignupData } from '../store/slices/onboardingSlice';
import { useCategories } from '../queries/useCategories';
import type { RoleCategory } from '../api/services/category.service';
import logo from '../assets/lightlogo.png';
import LottieComponent from 'lottie-react';
import loaderAnimation from '../assets/lottie/loader.json';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

// ── HIGH-FIDELITY THUMBNAILS & OVERLAY ASSETS ──────────────────────────────
import youtubeThumb from '../assets/categories/youtube.jpg';
import youtubeIcon from '../assets/categories/youtubeicon.png';
import clientThumb from '../assets/categories/client.jpg';
import normalUserIcon from '../assets/categories/normaluser.png';
import fitnessThumb from '../assets/categories/fitness.jpg';
import fitnessIcon from '../assets/categories/fitnessicon.png';
import dancerThumb from '../assets/categories/dancer.jpg';
import dancerIcon from '../assets/categories/danceicon.png';
import singerThumb from '../assets/categories/singer.jpg';
import singerIcon from '../assets/categories/singericon.png';
import promotionsThumb from '../assets/categories/promotions.jpg';
import adsIcon from '../assets/categories/ads.png';
import editorThumb from '../assets/categories/editor.jpg';
import editingIcon from '../assets/categories/editing.png';
import rentalsThumb from '../assets/categories/rentals.jpg';
import rentalIcon from '../assets/categories/rental.png';
import photographerThumb from '../assets/categories/photographer.jpg';
import photographerIcon from '../assets/categories/photographer copy.png';
import videographerThumb from '../assets/categories/videographer.jpg';
import musicianThumb from '../assets/categories/musician.jpg';
import actorThumb from '../assets/categories/actor.jpg';
import actorsIcon from '../assets/categories/actors.png';

// Priority ordering for roles
const CATEGORY_ORDER = [
  'creator',          // YouTube Creator
  'editor',           // Video Editor
  'brand',            // Brand & Sponsor
  'user',             // Normal User / Client
  'direct_client',    // Legacy Normal User
  'yt_influencer',    // Legacy YouTube
  'video_editor',     // Legacy Video Editor
  'social_promoter',  // Legacy Ads & Promotions
  'photographer',
  'videographer',
  'musician',
  'actor',
  'singer',
  'dancer',
  'fitness_expert',
  'rent_service',
];

interface RolePerksInfo {
  tagline: string;
  badge: string;
  badgeIcon: 'viral' | 'growth' | 'verified' | 'award' | 'film' | 'music' | 'star';
  perks: string[];
  group: 'creator' | 'business' | 'talent' | 'all';
}

const ROLE_METADATA: Record<string, RolePerksInfo> = {
  creator: {
    tagline: 'Supercharge your YouTube channel with AI SEO, verified brand sponsorships, and elite video editors.',
    badge: 'YouTube Certified',
    badgeIcon: 'verified',
    perks: ['YouTube API Channel Sync', 'Direct Brand Deal Matching', 'Vetted Video Editor Network', 'Viral Title & SEO Generator'],
    group: 'creator',
  },
  yt_influencer: {
    tagline: 'Supercharge your YouTube channel with AI SEO, verified brand sponsorships, and elite video editors.',
    badge: 'YouTube Certified',
    badgeIcon: 'verified',
    perks: ['YouTube API Channel Sync', 'Direct Brand Deal Matching', 'Vetted Video Editor Network', 'Viral Title & SEO Generator'],
    group: 'creator',
  },
  editor: {
    tagline: 'Edit for top YouTube creators, secure long-term monthly retainers, and receive guaranteed escrow payouts.',
    badge: 'High Demand',
    badgeIcon: 'growth',
    perks: ['Direct Creator Contracts', 'Escrow Milestone Protection', 'Portfolio Showcase', 'Project Collaboration Hub'],
    group: 'creator',
  },
  video_editor: {
    tagline: 'Edit for top YouTube creators, secure long-term monthly retainers, and receive guaranteed escrow payouts.',
    badge: 'High Demand',
    badgeIcon: 'growth',
    perks: ['Direct Creator Contracts', 'Escrow Milestone Protection', 'Portfolio Showcase', 'Project Collaboration Hub'],
    group: 'creator',
  },
  brand: {
    tagline: 'Launch high-converting influencer campaigns with YouTube creators and track transparent ROI analytics.',
    badge: 'Enterprise',
    badgeIcon: 'award',
    perks: ['Verified Creator Marketplace', 'Custom Campaign Bidding', 'Automated Escrow Contracts', 'Real-time Conversion Analytics'],
    group: 'business',
  },
  social_promoter: {
    tagline: 'Launch high-converting influencer campaigns with YouTube creators and track transparent ROI analytics.',
    badge: 'Enterprise',
    badgeIcon: 'award',
    perks: ['Verified Creator Marketplace', 'Custom Campaign Bidding', 'Automated Escrow Contracts', 'Real-time Conversion Analytics'],
    group: 'business',
  },
  user: {
    tagline: 'Hire top-tier creative talent, editors, photographers, and studios for your custom projects.',
    badge: 'Client & Hirer',
    badgeIcon: 'star',
    perks: ['10,000+ Vetted Creatives', 'Milestone-based Payments', 'Fast Turnaround Delivery', '24/7 Dedicated Support'],
    group: 'business',
  },
  direct_client: {
    tagline: 'Hire top-tier creative talent, editors, photographers, and studios for your custom projects.',
    badge: 'Client & Hirer',
    badgeIcon: 'star',
    perks: ['10,000+ Vetted Creatives', 'Milestone-based Payments', 'Fast Turnaround Delivery', '24/7 Dedicated Support'],
    group: 'business',
  },
  photographer: {
    tagline: 'Showcase your photography portfolio, book high-value commercial shoots, and collaborate with brands.',
    badge: 'Photography',
    badgeIcon: 'award',
    perks: ['Visual Portfolio Gallery', 'Client Booking Calendar', 'Secure Deposit Protection', 'Commercial Licensing Tools'],
    group: 'talent',
  },
  videographer: {
    tagline: 'Get booked for music videos, brand commercials, YouTube productions, and documentary shoots.',
    badge: 'Production',
    badgeIcon: 'film',
    perks: ['Production Reel Showcase', 'Crew & Gear Collaboration', 'Milestone Escrow Contracts', 'Direct Client Bidding'],
    group: 'talent',
  },
  musician: {
    tagline: 'License original tracks, compose for creators and films, and book live studio sessions.',
    badge: 'Music & Audio',
    badgeIcon: 'music',
    perks: ['Audio Track Licensing', 'Custom Beat Bidding', 'Creator Collaboration', 'Royalty Management'],
    group: 'talent',
  },
  actor: {
    tagline: 'Audition for commercial spots, digital series, brand ads, and creator film projects.',
    badge: 'Screen Talent',
    badgeIcon: 'film',
    perks: ['Headshot & Reel Profile', 'Verified Casting Calls', 'Direct Director Contact', 'Fast-track Booking'],
    group: 'talent',
  },
  singer: {
    tagline: 'Connect with producers, vocal projects, and brand campaigns for commercial voice & music.',
    badge: 'Vocal Artist',
    badgeIcon: 'music',
    perks: ['Vocal Sample Showcase', 'Commercial Voice Bids', 'Studio Session Bookings', 'Escrow Payments'],
    group: 'talent',
  },
  dancer: {
    tagline: 'Book music video appearances, choreograph for brands, and collaborate on viral creator content.',
    badge: 'Dance & Motion',
    badgeIcon: 'viral',
    perks: ['Choreography Reels', 'Viral Campaign Auditions', 'Direct Booking Flow', 'Instant Deposits'],
    group: 'talent',
  },
  fitness_expert: {
    tagline: 'Offer online coaching, partner with nutrition brands, and build your digital wellness business.',
    badge: 'Fitness Pro',
    badgeIcon: 'growth',
    perks: ['Coaching Client Manager', 'Brand Sponsorship Hub', 'Custom Program Delivery', 'Direct Subscription Pay'],
    group: 'talent',
  },
  rent_service: {
    tagline: 'List your camera gear, studio spaces, and production rentals to verified creators.',
    badge: 'Studio & Gear',
    badgeIcon: 'award',
    perks: ['Gear Inventory Manager', 'Deposit Security & Insurance', 'Instant Booking Requests', 'Verified Renter IDs'],
    group: 'talent',
  },
};

const DEFAULT_METADATA: RolePerksInfo = {
  tagline: 'Discover tailored opportunities, verified collaborations, and seamless escrow payments on SuviX.',
  badge: 'Creative Pro',
  badgeIcon: 'star',
  perks: ['Verified Identity Badge', 'Direct Client Bidding', 'Escrow Payment Protection', '24/7 Priority Support'],
  group: 'all',
};

type FilterTab = 'all' | 'creator' | 'business' | 'talent';

// Framer Motion Animation Variants for Staggered Entrance
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 22,
      stiffness: 280,
    },
  },
};

export default function RoleSelection() {
  // Initial state: NO role pre-selected
  const [selected, setSelected] = useState<string | null>(null);
  const [infoCategory, setInfoCategory] = useState<RoleCategory | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { categories, isLoading, error, refetch } = useCategories();

  // Clear stale onboarding state on landing
  useEffect(() => {
    dispatch(clearTempSignupData());
  }, [dispatch]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selected) || null;
  }, [categories, selected]);

  // Category thumbnail & overlay asset resolver
  const getCategoryAssets = (slug: string) => {
    switch (slug) {
      case 'user':
      case 'direct_client':
        return { thumb: clientThumb, overlay: normalUserIcon };
      case 'creator':
      case 'yt_influencer':
        return { thumb: youtubeThumb, overlay: youtubeIcon };
      case 'editor':
      case 'video_editor':
        return { thumb: editorThumb, overlay: editingIcon };
      case 'brand':
      case 'social_promoter':
        return { thumb: promotionsThumb, overlay: adsIcon };
      case 'fitness_expert':
        return { thumb: fitnessThumb, overlay: fitnessIcon };
      case 'dancer':
        return { thumb: dancerThumb, overlay: dancerIcon };
      case 'singer':
        return { thumb: singerThumb, overlay: singerIcon };
      case 'rent_service':
        return { thumb: rentalsThumb, overlay: rentalIcon };
      case 'photographer':
        return { thumb: photographerThumb, overlay: photographerIcon };
      case 'videographer':
        return { thumb: videographerThumb, overlay: null };
      case 'musician':
        return { thumb: musicianThumb, overlay: null };
      case 'actor':
        return { thumb: actorThumb, overlay: actorsIcon };
      default:
        return { thumb: clientThumb, overlay: null };
    }
  };

  /**
   * Identifies the primary role classification
   */
  const getRoleType = (cat?: RoleCategory | null) => {
    if (!cat) return 'user';
    const slug = cat.slug || '';
    const mapsTo = cat.maps_to_role || '';
    if (slug === 'creator' || slug === 'yt_influencer' || mapsTo === 'creator') return 'creator';
    if (slug === 'editor' || slug === 'video_editor' || mapsTo === 'editor') return 'editor';
    if (slug === 'brand' || slug === 'social_promoter' || mapsTo === 'brand') return 'brand';
    return 'user';
  };

  /**
   * Handle Email Registration Flow
   */
  const handleEmailSignup = () => {
    if (!selected || !selectedCategory) return;

    const roleType = getRoleType(selectedCategory);

    const signupData = {
      categoryId: selected,
      categorySlug: selectedCategory.slug,
      roleGroup: selectedCategory.roleGroup,
      roleName: selectedCategory.name,
      intent: 'register' as const,
      authMethod: 'email' as const,
      onboardingStep: 'role' as const,
    };

    try {
      sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify(signupData));
    } catch {
      // ignore
    }
    dispatch(setTempSignupData(signupData));

    if (roleType === 'creator') {
      navigate('/youtube-connect');
    } else if (roleType === 'editor') {
      navigate('/editor-specialization');
    } else if (roleType === 'brand') {
      navigate('/brand-details');
    } else {
      navigate('/signup');
    }
  };

  /**
   * Handle Google OAuth Registration Flow
   */
  const handleGoogleSignup = () => {
    if (!selected || !selectedCategory) return;

    const roleType = getRoleType(selectedCategory);

    const signupData = {
      categoryId: selected,
      categorySlug: selectedCategory.slug,
      roleGroup: selectedCategory.roleGroup,
      roleName: selectedCategory.name,
      intent: 'register' as const,
      authMethod: 'google' as const,
      onboardingStep: 'role' as const,
    };

    try {
      sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify(signupData));
      if (roleType === 'creator') {
        sessionStorage.setItem('oauth_intent', 'connect_youtube');
      }
    } catch {
      // ignore
    }

    dispatch(setTempSignupData(signupData));

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';

    if (roleType === 'creator') {
      window.location.href = `${apiUrl}/auth/google/youtube`;
    } else {
      window.location.href = `${apiUrl}/auth/google`;
    }
  };

  // Sort and filter categories
  const sortedCategories = useMemo(() => {
    const ordered = CATEGORY_ORDER.map((slug) => categories.find((c) => c.slug === slug)).filter(
      (c): c is RoleCategory => !!c
    );
    const remaining = categories.filter((c) => !CATEGORY_ORDER.includes(c.slug));
    return [...ordered, ...remaining];
  }, [categories]);

  const filteredCategories = useMemo(() => {
    if (activeFilter === 'all') return sortedCategories;
    return sortedCategories.filter((cat) => {
      const meta = ROLE_METADATA[cat.slug] || DEFAULT_METADATA;
      if (activeFilter === 'creator') return meta.group === 'creator';
      if (activeFilter === 'business') return meta.group === 'business';
      if (activeFilter === 'talent') return meta.group === 'talent';
      return true;
    });
  }, [sortedCategories, activeFilter]);

  return (
    <div className="min-h-screen w-full bg-[#fcfcfd] text-zinc-900 flex flex-col relative overflow-x-hidden selection:bg-zinc-900 selection:text-white font-sans">
      {/* ── ARCHITECTURAL LIGHT CANVAS ────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Subtle geometric light grid */}
        <div
          className="absolute inset-0 opacity-[0.38]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(228, 228, 231, 0.7) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(228, 228, 231, 0.7) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Ambient Top Glow */}
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[70rem] h-[28rem] bg-gradient-to-b from-zinc-200/50 via-zinc-100/20 to-transparent rounded-full blur-[130px]" />
      </div>

      {/* ── TOP HEADER / LOGO BAR ─────────────────────────────────────────── */}
      <header className="relative z-50 w-full px-4 sm:px-8 md:px-12 pt-4 pb-2 max-w-7xl mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="SuviX"
              className="h-8 sm:h-9 w-auto object-contain opacity-95 cursor-pointer"
              onClick={() => navigate('/')}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-600">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
              <span>Step 1 of 3</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-xs text-zinc-500 font-medium">Already a member?</span>
              <button
                onClick={() => navigate('/login')}
                className="h-9 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs transition-all active:scale-95 shadow-xs cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        {/* Back Button below logo (Visible on both Mobile & Laptop View) */}
        <div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200/90 text-zinc-700 hover:text-zinc-950 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer group"
          >
            <ArrowLeft size={14} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-2 pb-36 sm:pb-32 relative z-10 flex flex-col items-center">
        
        {/* Clean, Simple Hero Header */}
        <div className="text-center space-y-2 mb-6 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-semibold">
            <span>Account Setup</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-950 leading-tight">
            Choose your role to get started
          </h1>

          <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed font-normal">
            Select how you want to use SuviX. Your workspace tools and dashboard will adapt to your choice.
          </p>
        </div>

        {/* Clean Filter Pills (Scrollbar Hidden) */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-2xl bg-white border border-zinc-200 shadow-xs mb-6 overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {(
            [
              { id: 'all', label: 'All Roles', icon: Layers },
              { id: 'creator', label: 'Creators & Media', icon: Play },
              { id: 'business', label: 'Brands & Business', icon: Briefcase },
              { id: 'talent', label: 'Talent & Services', icon: Star },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-zinc-950 text-white shadow-xs scale-[1.01]'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                <Icon size={12} className={isActive ? 'text-white' : 'text-zinc-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── STAGGERED COMPACT ROLE CARDS (Welcome Page Card Architecture) ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 w-full bg-white border border-zinc-200 rounded-3xl shadow-xs">
            <Lottie animationData={loaderAnimation} loop className="w-28 h-28" />
            <p className="text-zinc-500 font-bold tracking-widest uppercase text-[10px] mt-1">
              Loading Roles...
            </p>
          </div>
        ) : error || filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center w-full bg-white border border-zinc-200 rounded-3xl shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-3">
              <Info className="w-5 h-5 text-rose-500" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 mb-1">No Roles Found</h3>
            <p className="text-zinc-500 text-xs max-w-sm mb-4 leading-relaxed">
              Unable to load categories for this filter. Please refresh or try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 rounded-xl bg-zinc-950 text-white font-bold text-xs hover:bg-zinc-800 active:scale-95 transition-all shadow-xs"
            >
              Reload Roles
            </button>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-3.5 md:gap-4"
          >
            {filteredCategories.map((item) => {
              const isSelected = selected === item.id;
              const assets = getCategoryAssets(item.slug);
              const meta = ROLE_METADATA[item.slug] || DEFAULT_METADATA;

              return (
                <motion.div
                  key={item.id}
                  variants={cardVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(item.id)}
                  className={`group cursor-pointer rounded-2xl sm:rounded-3xl overflow-hidden border p-1.5 sm:p-2 flex flex-col justify-between transition-all duration-200 select-none bg-white ${
                    isSelected
                      ? 'border-zinc-950 ring-2 ring-zinc-950/20 shadow-lg'
                      : 'border-zinc-200/90 hover:border-zinc-400 shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Top Image Container (Welcome Card Visual Style) */}
                  <div className="relative w-full aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-100/80">
                    <img
                      src={assets.thumb}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Subtle Gradient for Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Micro Tag Chip at Top-Left */}
                    <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs border border-white/20 text-white text-[8px] sm:text-[8.5px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      {meta.badgeIcon === 'viral' && <Flame size={8} className="text-amber-400 fill-amber-400" />}
                      {meta.badgeIcon === 'growth' && <Zap size={8} className="text-emerald-400 fill-emerald-400" />}
                      {meta.badgeIcon === 'verified' && <Sparkles size={8} className="text-red-400" />}
                      {meta.badgeIcon === 'award' && <Award size={8} className="text-yellow-400" />}
                      {meta.badgeIcon === 'film' && <Film size={8} className="text-cyan-400" />}
                      {meta.badgeIcon === 'music' && <Music size={8} className="text-pink-400" />}
                      {meta.badgeIcon === 'star' && <Star size={8} className="text-amber-400" />}
                      <span className="truncate max-w-[70px]">{meta.badge}</span>
                    </div>

                    {/* Top-Right Info Trigger */}
                    <button
                      className="absolute top-1.5 right-1.5 z-20 w-5 h-5 rounded-full bg-black/60 hover:bg-black/85 border border-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoCategory(item);
                      }}
                      title="About this role"
                    >
                      <Info size={10} />
                    </button>

                    {/* 3D Floating Overlay Badge */}
                    {assets.overlay && (
                      <img
                        src={assets.overlay}
                        alt=""
                        className="absolute -bottom-1 -left-2 w-14 h-14 sm:w-16 sm:h-16 object-contain z-10 pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
                      />
                    )}

                    {/* ── WHITE TICK ICON ON CENTER UPON SELECTION (NO BLUR) ── */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                        className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                      >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950/95 border-2 border-white flex items-center justify-center shadow-xl">
                          <Check size={18} strokeWidth={3.5} className="text-white" />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Dedicated Bottom Content Panel (Role Name & Subtitle Below Image) */}
                  <div className="pt-2 pb-1 px-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-[13px] font-extrabold text-zinc-950 tracking-tight leading-tight truncate">
                        {item.name}
                      </span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 shrink-0" />
                      )}
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-400 truncate mt-0.5">
                      {meta.tagline}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      {/* ── BOTTOM ACTION BAR (Clean Responsive Dock with Big Laptop Buttons) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 md:p-5 bg-white/95 backdrop-blur-xl border-t border-zinc-200 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-6">
          
          {/* Status Label */}
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                selectedCategory ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'
              }`}
            />
            <span className="text-xs sm:text-sm font-semibold text-zinc-600">
              {selectedCategory ? (
                <>
                  Selected Role: <span className="text-zinc-950 font-black">{selectedCategory.name}</span>
                </>
              ) : (
                'Select a role above to enable signup'
              )}
            </span>
          </div>

          {/* Action CTAs (Always Displayed by Default, Disabled When No Role) */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Google Button */}
            <Button
              onClick={handleGoogleSignup}
              disabled={!selectedCategory}
              className={`flex-1 sm:flex-none h-11 md:h-13 px-4 sm:px-6 md:px-7 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
                selectedCategory
                  ? 'bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-900 shadow-xs active:scale-95 cursor-pointer'
                  : 'bg-zinc-100 border border-zinc-200 text-zinc-400 opacity-60 cursor-not-allowed pointer-events-none'
              }`}
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 md:w-4.5 md:h-4.5" />
              <span>Google</span>
            </Button>

            {/* Email Button */}
            <Button
              onClick={handleEmailSignup}
              disabled={!selectedCategory}
              className={`flex-1 sm:flex-none h-11 md:h-13 px-5 sm:px-7 md:px-8 rounded-xl md:rounded-2xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                selectedCategory
                  ? 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-md active:scale-95 cursor-pointer group'
                  : 'bg-zinc-200 border border-zinc-200 text-zinc-400 opacity-60 cursor-not-allowed pointer-events-none'
              }`}
            >
              <Mail size={16} className="md:w-5 md:h-5 shrink-0" />
              <span>Email</span>
              {selectedCategory && (
                <ArrowRight size={15} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── ROLE PERKS & CAPABILITIES MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {infoCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInfoCategory(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden z-10 text-zinc-900"
            >
              {/* Top Row: Title & Close */}
              <div className="flex justify-between items-start mb-3.5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-[10px] font-bold">
                    <span>Role Overview</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-950 leading-tight">
                    {infoCategory.name}
                  </h2>
                </div>

                <button
                  onClick={() => setInfoCategory(null)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-950 transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Description */}
              <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-4">
                {ROLE_METADATA[infoCategory.slug]?.tagline ||
                  infoCategory.description ||
                  'Discover tailored opportunities, verified collaborations, and seamless escrow payments on SuviX.'}
              </p>

              {/* Key Features / Perks List */}
              <div className="space-y-2 mb-5">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Key Capabilities:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    ROLE_METADATA[infoCategory.slug]?.perks ||
                    DEFAULT_METADATA.perks
                  ).map((perk, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800"
                    >
                      <Check size={13} className="text-emerald-600 shrink-0 stroke-[3]" />
                      <span className="truncate">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmation CTA */}
              <Button
                onClick={() => {
                  setSelected(infoCategory.id);
                  setInfoCategory(null);
                }}
                className="w-full h-11 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs rounded-xl active:scale-[0.98] transition-all shadow-md cursor-pointer"
              >
                Select &amp; Proceed as {infoCategory.name}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
