import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import Lenis from 'lenis';
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
  Mail,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useDispatch } from 'react-redux';
import { clearTempSignupData, setTempSignupData, selectRoleAction, setAuthMethodAction } from '../../store/slices/onboardingSlice';
import { useCategories } from '../../queries/useCategories';
import type { RoleCategory } from '../../api/services/category.service';
import logo from '../../assets/lightlogo.png';
import LottieComponent from 'lottie-react';
import loaderAnimation from '../../assets/lottie/loader.json';
import { ROLE_SHOWCASE_CONFIG, DEFAULT_ROLE_SHOWCASE } from '../../features/onboarding/data/roleCardData';
// Lazy load the heavy 3D device card
const RoleDeviceCard = lazy(() => import('../../components/onboarding/RoleDeviceCard').then(module => ({ default: module.RoleDeviceCard })));
// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

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

type FilterTab = 'all' | 'creator' | 'business' | 'talent';

// Framer Motion Animation Variants for Staggered Entrance
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12, // Smooth cascading effect
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 220,
    },
  },
};

export default function RoleSelection() {
  const [selected, setSelected] = useState<string | null>(null);
  const [infoCategory, setInfoCategory] = useState<RoleCategory | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { categories, isLoading, error, refetch } = useCategories();

  // Clear ALL stale onboarding state (Redux + sessionStorage) on landing
  useEffect(() => {
    dispatch(clearTempSignupData());
    try {
      sessionStorage.removeItem('suvix_temp_signup_data');
      sessionStorage.removeItem('youtube_access_token');
      sessionStorage.removeItem('oauth_intent');
    } catch {
      // ignore
    }
  }, [dispatch]);

  // Initialize Lenis for HD Smooth Scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selected) || null;
  }, [categories, selected]);

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

    dispatch(selectRoleAction({
      id: selected,
      name: selectedCategory.name,
      slug: selectedCategory.slug,
      roleGroup: selectedCategory.roleGroup,
    }));
    dispatch(setAuthMethodAction('email'));

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
    if (!selected || !selectedCategory) return;

    const roleType = getRoleType(selectedCategory);

    dispatch(selectRoleAction({
      id: selected,
      name: selectedCategory.name,
      slug: selectedCategory.slug,
      roleGroup: selectedCategory.roleGroup,
    }));
    dispatch(setAuthMethodAction('google'));

    const signupData = {
      categoryId: selected,
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
      const slug = cat.slug;
      if (activeFilter === 'creator') {
        return slug === 'creator' || slug === 'yt_influencer' || slug === 'editor' || slug === 'video_editor';
      }
      if (activeFilter === 'business') {
        return slug === 'brand' || slug === 'social_promoter' || slug === 'user' || slug === 'direct_client';
      }
      if (activeFilter === 'talent') {
        return ['photographer', 'videographer', 'musician', 'actor', 'singer', 'dancer', 'fitness_expert', 'rent_service'].includes(slug);
      }
      return true;
    });
  }, [sortedCategories, activeFilter]);

  return (
    <div className="min-h-screen w-full bg-[#f8f9fb] text-zinc-900 flex flex-col relative overflow-x-hidden selection:bg-zinc-900 selection:text-white font-sans">
      {/* ── ARCHITECTURAL LIGHT & GLOW CANVAS ────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Subtle geometric light dot grid */}
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(200, 200, 210, 0.6) 1px, transparent 0)
            `,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Ambient Top & Side Glow Orbs */}
        <div className="absolute -top-[12%] left-1/2 -translate-x-1/2 w-[75rem] h-[32rem] bg-gradient-to-b from-blue-500/10 via-indigo-500/10 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-[15%] w-[45rem] h-[35rem] bg-gradient-to-tr from-purple-500/10 via-rose-500/5 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-[15%] w-[45rem] h-[35rem] bg-gradient-to-bl from-amber-500/10 via-red-500/5 to-transparent rounded-full blur-[140px]" />
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
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 shadow-xs text-xs font-bold text-zinc-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Step 1 of 3: Role Selection</span>
            </div>

            {/* Back Button (Replaces Sign In) */}
            <button
              onClick={() => navigate('/')}
              className="group relative h-9 sm:h-10 pl-2 pr-4 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200/90 text-zinc-700 hover:text-zinc-950 text-xs font-bold shadow-xs transition-all duration-300 flex items-center gap-2 active:scale-95 cursor-pointer overflow-hidden inline-flex"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-100 group-hover:bg-zinc-950 group-hover:text-white flex items-center justify-center transition-colors">
                <ArrowLeft size={13} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
              </div>
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4 pb-44 sm:pb-36 relative z-10 flex flex-col items-center">
        
        {/* Creator Hero Header */}
        <div className="text-center space-y-2.5 mb-8 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-950 leading-[1.15]">
            Choose Your Role on <span className='text-primary'>SuviX</span>
          </h1>

          <p className="text-zinc-500 text-xs sm:text-sm md:text-base leading-relaxed font-medium max-w-lg mx-auto">
            Select how you want to build, collaborate, and monetize on SuviX. Your workspace dashboard and specialized tools will adapt to your choice.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-6 flex items-center justify-center gap-2.5 text-zinc-900 font-extrabold text-xs sm:text-sm bg-white/80 backdrop-blur-sm border border-zinc-200/80 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full mx-auto w-max shadow-[0_4px_14px_rgba(0,0,0,0.03)]"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>
            Tap the device that matches your profession
          </motion.div>
        </div>

        {/* Clean Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-white border border-zinc-200 shadow-sm mb-10 overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-zinc-950 text-white shadow-sm scale-[1.02]'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-white' : 'text-zinc-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 📱 CREATOR SHOWCASE PHONE CARDS GRID ─────────────────────────── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 w-full bg-white border border-zinc-200 rounded-3xl shadow-sm">
            <Lottie animationData={loaderAnimation} loop className="w-32 h-32" />
            <p className="text-zinc-500 font-black tracking-widest uppercase text-xs mt-2">
              Loading Creator Roles...
            </p>
          </div>
        ) : error || filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center w-full bg-white border border-zinc-200 rounded-3xl shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-3">
              <Info className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1">No Roles Found</h3>
            <p className="text-zinc-500 text-xs sm:text-sm max-w-sm mb-5 leading-relaxed">
              Unable to load categories for this filter. Please refresh or try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 rounded-xl bg-zinc-950 text-white font-black text-xs hover:bg-zinc-800 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Reload Roles
            </button>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8 items-center"
          >
            <Suspense fallback={
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-full aspect-[9/19.5] rounded-[2.3rem] bg-zinc-100/50 animate-pulse border border-zinc-200" />
              ))
            }>
              {filteredCategories.map((item, index) => {
              const isSelected = selected === item.id;

              return (
                <motion.div key={item.id} variants={cardVariants} className="flex justify-center">
                  <RoleDeviceCard
                    category={item}
                    index={index}
                    isSelected={isSelected}
                    onSelect={() => setSelected(item.id)}
                  />
                </motion.div>
              );
            })}
            </Suspense>
          </motion.div>
        )}
      </main>

      {/* ── BOTTOM ACTION BAR (Floating Glass Dock) ────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 md:p-5 bg-white/90 backdrop-blur-2xl border-t border-zinc-200/90 shadow-[0_-12px_40px_rgba(0,0,0,0.08)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
          
          {/* Status Label */}
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full transition-all ${
                selectedCategory ? 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse' : 'bg-zinc-300'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-zinc-600">
                {selectedCategory ? (
                  <>
                    Selected Role:{' '}
                    <span className="text-zinc-950 font-black text-sm sm:text-base">{selectedCategory.name}</span>
                  </>
                ) : (
                  'Select any creator card above to proceed'
                )}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline">
                Zero commitment • Switch roles anytime from settings
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Google Signup Button */}
            <Button
              onClick={handleGoogleSignup}
              disabled={!selectedCategory}
              className={`flex-1 sm:flex-none h-11 sm:h-12 px-5 sm:px-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
                selectedCategory
                  ? 'bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-900 shadow-sm active:scale-95 cursor-pointer'
                  : 'bg-zinc-100 border border-zinc-200 text-zinc-400 opacity-60 cursor-not-allowed pointer-events-none'
              }`}
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
              <span>Continue with Google</span>
            </Button>

            {/* Email Signup Button */}
            <Button
              onClick={handleEmailSignup}
              disabled={!selectedCategory}
              className={`flex-1 sm:flex-none h-11 sm:h-12 px-6 sm:px-8 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                selectedCategory
                  ? 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-950/20 active:scale-95 cursor-pointer group'
                  : 'bg-zinc-200 border border-zinc-200 text-zinc-400 opacity-60 cursor-not-allowed pointer-events-none'
              }`}
            >
              <Mail size={16} className="shrink-0" />
              <span>Sign Up with Email</span>
              {selectedCategory && (
                <ArrowRight size={15} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
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
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className="relative w-full max-w-lg bg-white border border-zinc-200/90 rounded-[2rem] p-6 sm:p-8 shadow-2xl overflow-hidden z-10 text-zinc-900"
            >
              {/* Top Row: Title & Close */}
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-[10px] font-black uppercase tracking-wider">
                    <Sparkles size={11} className="text-amber-500" />
                    <span>Role Capabilities</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight leading-tight">
                    {infoCategory.name}
                  </h2>
                </div>

                <button
                  onClick={() => setInfoCategory(null)}
                  className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-950 hover:text-white border border-zinc-200 flex items-center justify-center text-zinc-600 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Description */}
              <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-5">
                {(ROLE_SHOWCASE_CONFIG[infoCategory.slug] || DEFAULT_ROLE_SHOWCASE).heroTagline} —{' '}
                {infoCategory.description ||
                  'Discover tailored opportunities, verified collaborations, and seamless escrow payments on SuviX.'}
              </p>

              {/* Key Features / Perks List */}
              <div className="space-y-2.5 mb-6">
                <span className="text-[10.5px] font-black text-zinc-400 uppercase tracking-widest">
                  Key Workspace Features:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(
                    (ROLE_SHOWCASE_CONFIG[infoCategory.slug] || DEFAULT_ROLE_SHOWCASE).perks
                  ).map((perk: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-bold text-zinc-800"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
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
                className="w-full h-12 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs sm:text-sm rounded-xl active:scale-[0.98] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Select &amp; Continue as {infoCategory.name}</span>
                <ArrowRight size={14} />
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
