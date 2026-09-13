import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Lenis from 'lenis';
import { motion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  Play,
  Briefcase,
  Star,
  Layers,
  Mail,
  ArrowLeft,
  Check,
  Menu,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import {
  clearTempSignupData,
  setTempSignupData,
  selectRoleAction,
  setAuthMethodAction,
} from '../../store/slices/onboardingSlice';
import { useCategories } from '../../queries/useCategories';
import type { RoleCategory } from '../../api/services/category.service';
import logo from '../../assets/blackbglogo.png';
import roleBg from '../../assets/rolebg.png';
import roleMobileBg from '../../assets/rolemobilebg.png';
import LottieComponent from 'lottie-react';
import loaderAnimation from '../../assets/lottie/loader.json';
import {
  PRIMARY_ROLE_CARDS,
} from '../../features/onboarding/data/roleCardData';
import { RoleDeviceCard } from '../../components/onboarding/RoleDeviceCard';

// Handle ESM/CJS interop for lottie-react
const Lottie =
  (LottieComponent as unknown as { default: typeof LottieComponent })?.default ||
  LottieComponent;

type FilterTab = 'all' | 'creator' | 'business' | 'talent';

// Fluid Deceleration Curve for ultra-smooth 60/120fps entrance without stutter
const SMOOTH_EASE = [0.16, 1, 0.3, 1] as const;

// Framer Motion Animation Variants for Staggered Entrance
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.28,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.75,
      ease: SMOOTH_EASE,
    },
  },
};

export default function RoleSelection() {
  // By default no role is selected
  const [selected, setSelected] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { categories, isLoading } = useCategories();

  // Clear ALL stale onboarding state (Redux + sessionStorage) on landing
  useEffect(() => {
    dispatch(clearTempSignupData());
    try {
      sessionStorage.removeItem('suvix_temp_signup_data');
      sessionStorage.removeItem('suvix_saved_instagram_accounts');
      sessionStorage.removeItem('suvix_saved_youtube_channels');
      sessionStorage.removeItem('instagram_access_token');
      sessionStorage.removeItem('instagram_oauth_pending');
      sessionStorage.removeItem('youtube_access_token');
      sessionStorage.removeItem('youtube_oauth_pending');
      sessionStorage.removeItem('oauth_intent');
      sessionStorage.removeItem('suvix_oauth_role');
      sessionStorage.removeItem('suvix_oauth_category');
    } catch {
      // ignore
    }
  }, [dispatch]);

  // Always ensure page is scrolled to top on landing
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Initialize Lenis for HD Smooth Scrolling
  useEffect(() => {
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    lenis.scrollTo(0, { immediate: true });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Displayed roles based on filter
  const displayedRoles = useMemo(() => {
    if (categories && categories.length > 0) {
      if (activeFilter === 'all') {
        return categories;
      }

      return categories.filter((cat) => {
        const slug = cat.slug;
        const mapsTo = cat.maps_to_role || '';
        if (activeFilter === 'creator') {
          return (
            mapsTo === 'creator' ||
            mapsTo === 'editor' ||
            slug === 'creator' ||
            slug === 'yt_influencer' ||
            slug === 'editor' ||
            slug === 'video_editor'
          );
        }
        if (activeFilter === 'business') {
          return (
            mapsTo === 'brand' ||
            mapsTo === 'user' ||
            cat.roleGroup === 'CLIENT' ||
            slug === 'brand' ||
            slug === 'social_promoter' ||
            slug === 'user' ||
            slug === 'direct_client' ||
            slug === 'rent_service'
          );
        }
        if (activeFilter === 'talent') {
          return (
            [
              'photographer',
              'videographer',
              'musician',
              'actor',
              'singer',
              'dancer',
              'fitness_expert',
              'rent_service',
            ].includes(slug) ||
            (!['creator', 'editor', 'brand', 'user'].includes(slug) && cat.roleGroup === 'PROVIDER')
          );
        }
        return true;
      });
    }

    // Fallback if categories not loaded yet
    if (activeFilter === 'all') {
      return PRIMARY_ROLE_CARDS;
    }
    return PRIMARY_ROLE_CARDS.filter((cat) => {
      const slug = cat.slug;
      if (activeFilter === 'creator') return slug === 'creator' || slug === 'editor';
      if (activeFilter === 'business') return slug === 'brand' || slug === 'user';
      return true;
    });
  }, [activeFilter, categories]);

  // Selected Category Entity
  const selectedCategory = useMemo(() => {
    if (!selected) return null;
    const fromApi = categories?.find((c) => c.id === selected || c.slug === selected);
    if (fromApi) return fromApi;

    const fallback = PRIMARY_ROLE_CARDS.find(
      (c) => c.id === selected || c.slug === selected
    );
    if (fallback) {
      return {
        id: fallback.id,
        name: fallback.name,
        slug: fallback.slug,
        roleGroup: fallback.roleGroup,
        icon: null,
        description: fallback.description,
        info: null,
      } as RoleCategory;
    }
    return null;
  }, [categories, selected]);

  /**
   * Identifies the primary role classification
   */
  const getRoleType = (cat?: RoleCategory | null) => {
    if (!cat) return 'creator';
    const slug = cat.slug || '';
    const mapsTo = cat.maps_to_role || '';
    if (slug === 'creator' || slug === 'yt_influencer' || mapsTo === 'creator')
      return 'creator';
    if (slug === 'editor' || slug === 'video_editor' || mapsTo === 'editor')
      return 'editor';
    if (slug === 'brand' || slug === 'social_promoter' || mapsTo === 'brand')
      return 'brand';
    return 'user';
  };

  /**
   * Handle Email Registration Flow
   */
  const handleEmailSignup = () => {
    if (!selectedCategory) return;
    const roleType = getRoleType(selectedCategory);

    dispatch(
      selectRoleAction({
        id: selectedCategory.id,
        name: selectedCategory.name,
        slug: selectedCategory.slug,
        roleGroup: selectedCategory.roleGroup,
      })
    );
    dispatch(setAuthMethodAction('email'));

    const signupData = {
      categoryId: selectedCategory.id,
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

    sessionStorage.removeItem('instagram_access_token');
    localStorage.removeItem('instagram_access_token');
    localStorage.removeItem('instagram_oauth_pending');
    sessionStorage.removeItem('youtube_access_token');

    if (roleType === 'creator') {
      navigate('/connect-socials');
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
    if (!selectedCategory) return;
    const roleType = getRoleType(selectedCategory);

    dispatch(
      selectRoleAction({
        id: selectedCategory.id,
        name: selectedCategory.name,
        slug: selectedCategory.slug,
        roleGroup: selectedCategory.roleGroup,
      })
    );
    dispatch(setAuthMethodAction('google'));

    const signupData = {
      categoryId: selectedCategory.id,
      categorySlug: selectedCategory.slug,
      roleGroup: selectedCategory.roleGroup,
      roleName: selectedCategory.name,
      intent: 'register' as const,
      authMethod: 'google' as const,
      onboardingStep: 'role' as const,
    };

    dispatch(setTempSignupData(signupData));
    try {
      sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify(signupData));
    } catch {
      // ignore
    }

    sessionStorage.removeItem('instagram_access_token');
    localStorage.removeItem('instagram_access_token');
    localStorage.removeItem('instagram_oauth_pending');
    sessionStorage.removeItem('youtube_access_token');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';

    if (roleType === 'creator') {
      navigate('/connect-socials');
    } else if (roleType === 'editor') {
      navigate('/editor-specialization');
    } else if (roleType === 'brand') {
      navigate('/brand-details');
    } else {
      window.location.href = `${apiUrl}/auth/google`;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9fc] text-zinc-900 flex flex-col relative overflow-x-hidden selection:bg-zinc-900 selection:text-white font-sans">
      {/* ── BACKGROUND IMAGE CANVAS ─────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Mobile Background (rolemobilebg.png) */}
        <img
          src={roleMobileBg}
          alt="Role Selection Mobile Background"
          className="w-full h-full object-cover object-top sm:hidden"
        />
        {/* Desktop / Tablet Background (rolebg.png) */}
        <img
          src={roleBg}
          alt="Role Selection Background"
          className="hidden sm:block w-full h-full object-cover object-center opacity-95"
        />
      </div>

      {/* ── TOP HEADER / LOGO & STEP BAR ─────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: SMOOTH_EASE }}
        className="relative z-50 w-full px-4 sm:px-8 md:px-12 pt-3 sm:pt-4 pb-2 max-w-7xl mx-auto flex items-center justify-between"
      >
        {/* Left: SuviX Brand Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          <img
            src={logo}
            alt="SuviX"
            className="h-11 xs:h-12 sm:h-18 md:h-20 w-auto object-contain transition-transform group-hover:scale-105 invert sm:invert-0"
          />
        </div>

        {/* Right: Step Indicator & Back Button / Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/95 border border-zinc-200/90 shadow-2xs text-xs font-bold text-zinc-800 select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="sm:hidden">Step 1 of 3</span>
            <span className="hidden sm:inline">Step 1 of 3: Role Selection</span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="group h-8 w-8 sm:h-9 sm:w-auto sm:px-4 rounded-full bg-white/95 hover:bg-zinc-50 border border-zinc-200/90 text-zinc-800 hover:text-zinc-950 text-xs font-bold shadow-2xs transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            aria-label="Navigation"
          >
            <Menu size={16} strokeWidth={2.5} className="sm:hidden" />
            <ArrowLeft size={13} strokeWidth={2.5} className="hidden sm:inline group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back to Home</span>
          </button>
        </div>
      </motion.header>

      {/* ── MAIN CONTENT CONTAINER ────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-2 sm:pt-3 pb-32 sm:pb-36 relative z-20 flex flex-col items-center">
        {/* Hero Title & Subhead Block with Smooth Entrance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08, ease: SMOOTH_EASE }}
          className="w-full flex flex-col items-start sm:items-center text-left sm:text-center px-0.5 sm:px-0"
        >
          {/* Tracked Uppercase Kicker */}
          <div className="text-[8.5px] xs:text-[9.5px] sm:text-[11px] font-bold uppercase tracking-[0.16em] sm:tracking-[0.25em] text-zinc-400 sm:text-zinc-500 text-left sm:text-center mb-1 select-none">
            <span className="sm:hidden">YOUR TALENT. BIGGER OPPORTUNITIES.</span>
            <span className="hidden sm:inline">ONE PLATFORM • EVERY CREATOR • INFINITE POSSIBILITIES</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-[25px] xs:text-[28px] sm:text-4xl md:text-5xl font-black tracking-tight text-white sm:text-zinc-950 text-left sm:text-center leading-[1.12]">
            Choose Your <br className="sm:hidden" />
            Role on{' '}
            <span className="suvix-heading-brand">
              SuviX
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-zinc-300 sm:text-zinc-600 text-[11.5px] xs:text-xs sm:text-sm md:text-base text-left sm:text-center mt-2 max-w-[245px] xs:max-w-[270px] sm:max-w-lg leading-relaxed font-normal sm:font-medium">
            Select how you want to build, collaborate, and monetize on SuviX.
            <br className="hidden sm:inline" /> Your workspace and tools will adapt to your choice.
          </p>
        </motion.div>

        {/* Tap Instruction Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: SMOOTH_EASE }}
          className="self-start sm:self-center mt-3 mb-4 sm:mt-4 sm:mb-6 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-black/60 sm:bg-white/90 backdrop-blur-md border border-white/20 sm:border-zinc-200/90 shadow-2xs text-[10.5px] sm:text-xs font-semibold sm:font-bold text-white sm:text-zinc-800 select-none"
        >
          <span>👆</span>
          <span className="sm:hidden">Tap a device to continue</span>
          <span className="hidden sm:inline">Tap the device that matches your profession</span>
          <ArrowRight size={12} className="sm:hidden text-white/70" />
        </motion.div>

        {/* Role Category Filter Tabs (Visible on tablet & desktop, hidden on mobile per mobile design) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22, ease: SMOOTH_EASE }}
          className="hidden md:flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-full bg-white/90 border border-zinc-200/90 shadow-2xs mb-8 overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {(
            [
              { id: 'all', label: 'All Roles', icon: Layers },
              { id: 'creator', label: 'Creators & Editors', icon: Play },
              { id: 'business', label: 'Brands & Clients', icon: Briefcase },
              { id: 'talent', label: 'Talent & Services', icon: Star },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-white' : 'text-zinc-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* ── 📱 SMARTPHONES GRID: 2-Cols on Mobile, 4-Cols on Desktop ───────── */}
        <div className="w-full relative pb-4">
          {/* Reflective Studio Desk Floor Layer */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-white/40 to-white/90 pointer-events-none rounded-b-3xl -z-10" />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 w-full bg-white/80 rounded-3xl border border-zinc-200 shadow-xs">
              <Lottie animationData={loaderAnimation} loop className="w-28 h-28" />
              <p className="text-zinc-500 font-bold text-xs uppercase tracking-wider mt-2">
                Loading Roles...
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="w-full max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-x-2.5 sm:gap-x-4 lg:gap-x-3.5 gap-y-7 sm:gap-y-12 lg:gap-y-16 items-end justify-items-center"
            >
              {displayedRoles.map((item, index) => {
                const isSelected =
                  selected === item.id || selected === item.slug;

                return (
                  <motion.div
                    key={item.id}
                    variants={cardVariants}
                    className="w-full flex justify-center"
                  >
                    <RoleDeviceCard
                      category={item}
                      index={index}
                      isSelected={isSelected}
                      onSelect={() => setSelected(item.id || item.slug)}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </main>

      {/* ── BOTTOM STICKY ACTION DOCK (Floating Glass Pill) ──────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.38, ease: SMOOTH_EASE }}
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-3 pb-4 sm:p-4 bg-white/95 backdrop-blur-2xl rounded-t-[2rem] sm:rounded-t-3xl border-t border-zinc-200/90 shadow-[0_-12px_40px_rgba(0,0,0,0.08)]"
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-6">
          {/* Left: Selected Role Status (Visible on desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shadow-xs transition-colors duration-200 ${
                selectedCategory
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-200 text-zinc-400'
              }`}
            >
              {selectedCategory ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-zinc-400" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-medium text-zinc-600">
                {selectedCategory ? (
                  <>
                    Selected Role:{' '}
                    <span className="text-zinc-950 font-bold text-sm sm:text-base">
                      {selectedCategory.name}
                    </span>
                  </>
                ) : (
                  <span className="text-zinc-500 font-semibold text-xs sm:text-sm">
                    Select a role card above to proceed
                  </span>
                )}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">
                Zero commitment • Switch roles anytime from settings
              </span>
            </div>
          </div>

          {/* Right: Google OAuth & Email CTAs */}
          <div className="flex flex-col items-center gap-1.5 w-full md:w-auto">
            <div className="flex items-center gap-2 sm:gap-2.5 w-full md:w-auto">
              {/* Google Signup Button */}
              <button
                onClick={handleGoogleSignup}
                disabled={!selectedCategory}
                className={`flex-1 md:flex-none h-10 sm:h-11 px-3 sm:px-5 rounded-full border text-xs sm:text-sm font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                  selectedCategory
                    ? 'bg-white hover:bg-zinc-50 border-zinc-200/90 text-zinc-900 active:scale-95 cursor-pointer opacity-100'
                    : 'bg-zinc-100/80 border-zinc-200/50 text-zinc-400 opacity-45 cursor-not-allowed'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`w-4 h-4 shrink-0 transition-opacity ${
                    !selectedCategory ? 'grayscale opacity-50' : ''
                  }`}
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Email Signup Button */}
              <button
                onClick={handleEmailSignup}
                disabled={!selectedCategory}
                className={`flex-1 md:flex-none h-10 sm:h-11 px-3 sm:px-6 rounded-full text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5 sm:gap-2 group whitespace-nowrap ${
                  selectedCategory
                    ? 'bg-zinc-950 hover:bg-zinc-800 text-white active:scale-95 cursor-pointer opacity-100'
                    : 'bg-zinc-300 text-zinc-500 opacity-45 cursor-not-allowed'
                }`}
              >
                <Mail size={14} className="shrink-0" />
                <span>Sign Up with Email</span>
                <ArrowRight
                  size={13}
                  className={`shrink-0 transition-transform ${
                    selectedCategory ? 'group-hover:translate-x-0.5' : ''
                  }`}
                />
              </button>
            </div>

            {/* Mobile Zero Commitment Helper Text */}
            <p className="text-[10px] text-zinc-400 font-medium text-center md:hidden select-none">
              {selectedCategory
                ? `Selected: ${selectedCategory.name} • Switch anytime`
                : 'Select a role card above to continue'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

