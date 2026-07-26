import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info,
  Check,
  ArrowRight,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AuthBackground } from '../components/auth/AuthBackground';
import { useDispatch } from 'react-redux';
import { clearTempSignupData, setTempSignupData } from '../store/slices/onboardingSlice';
import { useCategories } from '../queries/useCategories';
import type { RoleCategory } from '../api/services/category.service';
import logo from '../assets/lightlogo.png';
import LottieComponent from "lottie-react";
// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;
import loaderAnimation from "../assets/lottie/loader.json";
// Import assets for high-fidelity thumbnails
import youtubeThumb from '../assets/categories/youtube.jpg';
import youtubeIcon from '../assets/categories/youtubeicon.png';
import clientThumb from '../assets/categories/client.jpg';
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
import videographerThumb from '../assets/categories/videographer.jpg';
import musicianThumb from '../assets/categories/musician.jpg';
import actorThumb from '../assets/categories/actor.jpg';

const CATEGORY_ORDER = [
  'direct_client',    // Normal User
  'yt_influencer',    // YouTube
  'fitness_expert',   // Gym / Fitness Pro
  'singer',           // Singer
  'dancer',           // Dance
  'social_promoter',  // Ads & Promotions
  'video_editor',
  'rent_service',
  'photographer',
  'videographer',
  'musician',
  'actor'
];

export default function RoleSelection() {
  const [selected, setSelected] = useState<string | null>(null);
  const [infoCategory, setInfoCategory] = useState<RoleCategory | null>(null);
  const navigate = useNavigate();
  
  const dispatch = useDispatch();
  const { categories, isLoading, error, refetch } = useCategories();
  const selectedCategory = categories.find(c => c.id === selected);

  // 🔐 PRODUCTION: Clear ALL stale onboarding data when landing on role selection.
  // This prevents the stale-state contamination bug where a previous session's
  // tempSignupData (e.g. yt_influencer role) corrupts a new login attempt.
  useEffect(() => {
    dispatch(clearTempSignupData());
  }, [dispatch]);

  const getCategoryAssets = (slug: string) => {
    switch(slug) {
      case 'yt_influencer': return { thumb: youtubeThumb, overlay: youtubeIcon };
      case 'direct_client': return { thumb: clientThumb, overlay: null };
      case 'fitness_expert': return { thumb: fitnessThumb, overlay: fitnessIcon };
      case 'dancer': return { thumb: dancerThumb, overlay: dancerIcon };
      case 'singer': return { thumb: singerThumb, overlay: singerIcon };
      case 'social_promoter': return { thumb: promotionsThumb, overlay: adsIcon };
      case 'video_editor': return { thumb: editorThumb, overlay: editingIcon };
      case 'rent_service': return { thumb: rentalsThumb, overlay: rentalIcon };
      case 'photographer': return { thumb: photographerThumb, overlay: null };
      case 'videographer': return { thumb: videographerThumb, overlay: null };
      case 'musician': return { thumb: musicianThumb, overlay: null };
      case 'actor': return { thumb: actorThumb, overlay: null };
      default: return { thumb: editorThumb, overlay: null };
    }
  };

  /**
   * PRODUCTION: User chose Email signup.
   * Sets role + step + authMethod in tempSignupData, then navigates to the correct next step.
   */
  const handleEmailSignup = () => {
    if (!selected || !selectedCategory) return;

    dispatch(setTempSignupData({
      categoryId: selected,
      categorySlug: selectedCategory.slug,
      roleGroup: selectedCategory.roleGroup,
      roleName: selectedCategory.name,
      intent: 'register',
      authMethod: 'email',
      onboardingStep: 'role',
    }));

    if (selectedCategory.slug === 'direct_client') {
      // Clients don't need subcategory — go straight to signup form
      navigate('/signup');
    } else if (selectedCategory.slug === 'yt_influencer') {
      // YouTube creators connect their channel before filling personal details
      navigate('/youtube-connect');
    } else {
      // All other creators pick their niches first
      navigate('/subcategory-selection');
    }
  };

  /**
   * PRODUCTION: User chose Google signup.
   * Sets role + intent + authMethod in tempSignupData BEFORE triggering OAuth.
   * This is the ONLY correct place to trigger Google OAuth for new users.
   * The intent='register' + categorySlug allows OAuthSuccess to route correctly
   * without relying on stale localStorage data.
   */
  const handleGoogleSignup = () => {
    if (!selected || !selectedCategory) return;

    // Save role context BEFORE redirect (Zustand persist = survives page reload)
    dispatch(setTempSignupData({
      categoryId: selected,
      categorySlug: selectedCategory.slug,
      roleGroup: selectedCategory.roleGroup,
      roleName: selectedCategory.name,
      intent: 'register',
      authMethod: 'google',
      onboardingStep: 'role',
    }));

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';

    if (selectedCategory.slug === 'yt_influencer') {
      // YouTube flow: request YouTube-scoped OAuth
      window.location.href = `${apiUrl}/auth/google/youtube`;
    } else {
      // Standard profile-scoped OAuth for all other roles
      window.location.href = `${apiUrl}/auth/google`;
    }
  };

  const sortedCategories = CATEGORY_ORDER.map(slug => categories.find(c => c.slug === slug)).filter((c): c is RoleCategory => !!c);
  const remainingCategories = categories.filter(c => !CATEGORY_ORDER.includes(c.slug));
  const finalDisplayCategories = [...sortedCategories, ...remainingCategories];

  console.log("Lottie:", Lottie);
  console.log("Loader:", loaderAnimation);

  return (
    <div className="flex h-[100dvh] w-full bg-gray-50 font-sans overflow-hidden relative text-gray-900">
      {/* Visual Side (Left) */}
      <div className="hidden lg:flex lg:w-[40%] p-8 bg-white overflow-hidden relative">
        <AuthBackground />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-gray-50 to-transparent z-10" />
      </div>

      {/* Mobile Background */}
      <div className="lg:hidden absolute inset-0 z-0 bg-gray-50">
        <AuthBackground />
        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gray-50 z-10" />
        <div className="absolute inset-x-0 bottom-[60%] h-48 bg-gradient-to-t from-gray-50 to-transparent z-10" />
      </div>

      {/* Content Side (Right) */}
      <div 
        className="flex-1 lg:flex-none lg:w-[60%] flex flex-col h-full overflow-hidden z-20 bg-gray-50 relative"
      >
        {/* Header */}
        <div className="sticky top-0 z-50 pt-6 pb-8 md:pt-8 md:pb-12 px-6 md:px-12 lg:px-16 flex flex-col lg:flex-row lg:items-start justify-between pointer-events-none">
          {/* Blurred Background with Fade-out Mask */}
          <div 
             className="absolute inset-0 bg-white/60 backdrop-blur-md -z-10 pointer-events-none"
             style={{ 
               maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)', 
               WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' 
             }}
          />
          
          <div className="space-y-3 pointer-events-auto w-full">
            {/* Top Row: Logo & Mobile Sign In */}
            <div className="flex justify-between items-start w-full">
              <img src={logo} alt="SuviX" className="h-8 md:h-9 lg:h-10 w-auto opacity-95" />
              
              {/* Mobile Sign In (Top Right) */}
              <div className="flex lg:hidden flex-col items-end gap-1">
                <span className="text-[10px] text-gray-500 font-medium leading-none">Already a member?</span>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-1.5 rounded-lg bg-black text-white text-[11px] font-bold shadow-sm"
                >
                  Sign In
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight">
                Start your <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-600 to-gray-400">new chapter.</span>
              </h1>
              <p className="text-gray-500 text-xs md:text-sm max-w-lg leading-relaxed font-medium">
                Choose your role first. Everything else follows.
              </p>
            </div>
          </div>
          {/* Link to Login for returning users */}
          <div className="hidden lg:flex items-center gap-2 mt-2 lg:mt-0 pointer-events-auto">
            <span className="text-xs text-gray-500 font-medium">Already a member?</span>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-xl bg-black text-white text-[11px] font-bold hover:bg-gray-900 transition-colors shadow-sm"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-20 pb-48 lg:pb-40 scroll-smooth custom-scrollbar">
          <div className="max-w-6xl mx-auto py-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24">
               <Lottie
                animationData={loaderAnimation}
                loop
                className="w-44 h-44"
              />
                <p className="text-gray-500 font-bold tracking-widest uppercase text-[10px]">Loading Roles...</p>
              </div>
            ) : error || finalDisplayCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 max-w-md mx-auto text-center bg-white border border-gray-200 rounded-[32px] p-8 lg:p-10 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mb-6">
                  <Info className="w-7 h-7 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Connection Delayed</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  We are having trouble loading the workspace roles from the server. Please check your network connection or try reloading.
                </p>
                <button 
                  onClick={() => refetch()}
                  className="px-6 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-3 md:px-0 md:gap-6 lg:gap-8">
                {finalDisplayCategories.map((item) => {
                  const isSelected = selected === item.id;
                  const assets = getCategoryAssets(item.slug);
                  
                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelected(item.id)}
                      className={`relative group cursor-pointer aspect-[1/1.1] rounded-2xl overflow-hidden border transition-all duration-300 ${
                        isSelected 
                          ? 'border-black ring-4 ring-black/5 shadow-xl' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {/* Background Image */}
                      <img 
                        src={assets.thumb} 
                        alt={item.name} 
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                          isSelected ? 'scale-105' : 'group-hover:scale-105'
                        }`} 
                      />

                      {/* Info Icon - Top Right */}
                      <button 
                        className="absolute top-3 right-3 z-20 bg-white/60 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center border border-white hover:bg-white transition-colors"
                        onClick={(e) => { e.stopPropagation(); setInfoCategory(item); }}
                      >
                        <Info size={16} className="text-gray-700" />
                      </button>

                      {/* Absolute Icon Overlay */}
                      {assets.overlay && (
                        <img 
                          src={assets.overlay} 
                          alt="" 
                          className="absolute -bottom-2 -left-4 w-32 h-32 object-contain z-10 pointer-events-none drop-shadow-lg" 
                        />
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 z-0 pointer-events-none" />

                      {/* Label */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5 flex items-center justify-between z-20">
                        <span className="text-xs lg:text-[15px] font-semibold tracking-tight text-white drop-shadow-md">
                          {item.name}
                        </span>
                        {isSelected && (
                          <div className="bg-white p-1 rounded-full shadow-lg">
                            <Check size={10} strokeWidth={3} className="text-black" />
                          </div>
                        )}
                      </div>

                      {/* Selection State Tint */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Bar — PRODUCTION: Dual CTA (Email + Google) */}
        <div className="absolute bottom-0 left-0 right-0 pt-20 pb-8 px-6 lg:px-12 z-50 pointer-events-none">
          <div 
             className="absolute inset-0 bg-white/70 backdrop-blur-md -z-10 pointer-events-none"
             style={{ 
               maskImage: 'linear-gradient(to top, black 50%, transparent 100%)', 
               WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)' 
             }}
          />
          <div className="max-w-4xl mx-auto pointer-events-auto relative">
            {/* Status indicator */}
            <div className="flex items-center justify-center mb-4">
              {selectedCategory ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-gray-500">
                    Ready to proceed as <span className="text-gray-900 font-extrabold">{selectedCategory.name}</span>
                  </span>
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  <span className="text-xs font-semibold text-gray-400">
                    Select a role above to continue
                  </span>
                </div>
              )}
            </div>

            {/* Auth Method CTAs */}
            <AnimatePresence mode="wait">
              {selectedCategory ? (
                <motion.div
                  key="cta-active"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col sm:flex-row gap-4 sm:gap-5"
                >
                  {/* Google Signup */}
                  <Button
                    onClick={handleGoogleSignup}
                    className="flex-1 h-12 rounded-xl bg-white border border-gray-300 text-gray-900 font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-[0.98] cursor-pointer shadow-sm"
                  >
                    <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
                    Continue with Google
                  </Button>

                  {/* Email Signup — Primary CTA */}
                  <Button
                    onClick={handleEmailSignup}
                    className="flex-1 h-12 rounded-xl bg-black text-white font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl shadow-black/10 cursor-pointer group"
                  >
                    Continue with Email
                    <ArrowRight size={16} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1 duration-200" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="cta-disabled"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    disabled
                    className="w-full h-13 rounded-2xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed opacity-70 border border-gray-200"
                  >
                    Select a Role to Continue
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>


          </div>
        </div>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {infoCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInfoCategory(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white border border-gray-100 rounded-[32px] p-8 lg:p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">About Role</span>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">{infoCategory.name}</h2>
                </div>
                <button 
                  onClick={() => setInfoCategory(null)}
                  className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full text-gray-500 hover:text-gray-900 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-gray-600 text-sm lg:text-base leading-relaxed mb-8">
                {infoCategory.description || infoCategory.info || "Discover opportunities tailored for your professional growth."}
              </p>

              <Button 
                onClick={() => setInfoCategory(null)}
                className="w-full h-12 bg-black text-white font-extrabold text-sm rounded-2xl hover:bg-gray-900 active:scale-[0.98] transition-all"
              >
                Got it
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
