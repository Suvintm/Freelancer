import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Globe,
  AtSign,
  Loader2,
  Youtube,
  CheckCircle2,
  AlertCircle,
  Camera,
  Bell,
  Check,
  Building2
} from 'lucide-react';
import lightLogo from '../assets/lightlogo.png';
import logoDefault from '../assets/blackbglogo.png';
import cloudflareLogo from '../assets/cloudflare.png';
import loginMobileBg from '../assets/loginmobilebg.png';
import { Turnstile } from '@marsidev/react-turnstile';
import { useDispatch, useSelector } from 'react-redux';
import { setTempSignupData, clearTempSignupData } from '../store/slices/onboardingSlice';
import { useSignup } from '../mutations/useSignup';
import type { RootState } from '../store';
import { authService } from '../api/services/auth.service';
import { OnboardingSyncOverlay } from '../components/onboarding/OnboardingSyncOverlay';
import { isAccessAllowed, RESTRICTED_ACCESS_MESSAGE } from '../config/accessControl.config';
import { PhoneCountryInput } from '../components/common/PhoneCountryInput';
import { CountrySelect } from '../components/common/CountrySelect';
import { detectBrowserCountry, findCountryByName, autoDetectCountryAsync } from '../data/countries';

const EASE = [0.16, 1, 0.3, 1] as const;
const LANGUAGES = ['English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi'];

// Dynamically resolve loginbg.png if it exists on disk, falling back to clean white background if not yet created
const desktopBgModules = import.meta.glob<{ default: string }>('../assets/loginbg.png', { eager: true });
const loginBg = desktopBgModules['../assets/loginbg.png']?.default || null;

// Dynamically resolve blacklogo.png if added, fallback to lightLogo/logoDefault
const blackLogoModules = import.meta.glob<{ default: string }>('../assets/blacklogo.png', { eager: true });
const logo = blackLogoModules['../assets/blacklogo.png']?.default || lightLogo || logoDefault;

// ── Main Signup Page ──────────────────────────────────────────────────────────
export default function Signup() {
  const [showPass, setShowPass] = useState(false);
  const dispatch = useDispatch();
  const { mutateAsync: signupMutation } = useSignup();
  const onboarding = useSelector((state: RootState) => state.onboarding);
  const tempSignupData = onboarding.tempSignupData;
  const selectedRole = onboarding.selectedRole;
  const authMethod = onboarding.authMethod || tempSignupData?.authMethod;
  const socialProfile = tempSignupData?.socialProfile as Record<string, string> | undefined;

  const roleSlug = selectedRole?.slug || tempSignupData?.categorySlug || 'creator';
  const roleName = selectedRole?.name || tempSignupData?.roleName || 'Creator';

  const [form, setForm] = useState({
    fullName: tempSignupData?.companyName || socialProfile?.name || '',
    username: '',
    email: socialProfile?.email || '',
    phone: '',
    password: '',
    motherTongue: 'English',
    country: detectBrowserCountry().name,
    website: tempSignupData?.companyWebsite || ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingCountry, setIsDetectingCountry] = useState(true);
  const [userStatus, setUserStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(socialProfile?.picture || null);
  const [enableNotifications, setEnableNotifications] = useState(false);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
  const [turnstileToken, setTurnstileToken] = useState<string>(() => (!siteKey ? 'dev-bypass' : ''));
  const [, setTurnstileStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>(
    () => (!siteKey ? 'success' : 'verifying')
  );
  const [currentLevel, setCurrentLevel] = useState<1 | 2>(1);
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const navigate = useNavigate();
  const isBrandClient = roleSlug === 'brand' || roleSlug === 'social_promoter' || tempSignupData?.categorySlug === 'brand';
  const isSocialUser = authMethod === 'google' && !!socialProfile;

  // Zero-Cost Multi-tier Country Auto-detection
  useEffect(() => {
    let isMounted = true;
    setIsDetectingCountry(true);
    autoDetectCountryAsync(() => authService.detectCountry())
      .then((detected) => {
        if (isMounted && detected?.name) {
          setForm((prev) => ({
            ...prev,
            country: detected.name,
          }));
        }
      })
      .finally(() => {
        if (isMounted) setIsDetectingCountry(false);
      });
    return () => { isMounted = false; };
  }, []);

  // 🔐 PRODUCTION GUARD: Signup requires a role to have been selected first.
  useEffect(() => {
    if (!selectedRole && !tempSignupData?.categoryId) {
      try {
        const rawBackup = sessionStorage.getItem('suvix_temp_signup_data');
        if (rawBackup) {
          const parsed = JSON.parse(rawBackup);
          if (parsed?.categoryId) {
            dispatch(setTempSignupData(parsed));
            return;
          }
        }
      } catch {
        // ignore
      }
      navigate('/role-selection', { replace: true });
    }
  }, [selectedRole, tempSignupData?.categoryId, dispatch, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'username') {
      setUserStatus('idle');
    }
  };

  // Auto-validates username/handle while typing, debounced to 2000ms
  useEffect(() => {
    if (!form.username || form.username.trim().length < 3) {
      const resetTimer = setTimeout(() => {
        setUserStatus('idle');
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const timer = setTimeout(async () => {
      setUserStatus('checking');
      const startTime = Date.now();
      try {
        const available = await authService.checkUsername(form.username.trim().toLowerCase());
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 400 - elapsed);
        
        setTimeout(() => {
          setUserStatus(available ? 'available' : 'taken');
        }, remainingDelay);
      } catch {
        setUserStatus('idle');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [form.username]);

  const selectedChannels = tempSignupData?.youtubeChannels ?? [];

  // Level 1 Validation: Name, Available Username, Valid Email
  const isLevel1Valid = Boolean(
    form.fullName.trim() &&
    form.username.trim() &&
    form.username.length >= 3 &&
    userStatus === 'available' &&
    form.email.trim() &&
    form.email.includes('@') &&
    form.email.includes('.')
  );

  // Level 2 Validation: Valid Phone, Password (if not social), Website (if brand)
  const isLevel2Valid = Boolean(
    form.phone.trim() &&
    isPhoneValid &&
    (isSocialUser || form.password.trim()) &&
    (!isBrandClient || form.website.trim())
  );

  // Complete Form Validation
  const isFormValid = Boolean(
    isLevel1Valid &&
    isLevel2Valid &&
    turnstileToken
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAccessAllowed(form.email)) { setError(RESTRICTED_ACCESS_MESSAGE); return; }
    if (userStatus === 'taken') { setError('This username is already taken.'); return; }
    if (!form.username || form.username.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (!isPhoneValid) { setError('Please enter a valid phone number for your selected country.'); return; }

    if (!isSocialUser && !form.password) { setError('Password is required.'); return; }

    setIsLoading(true);
    setError(null);

    try {
      await import('../api/client').then(({ api }) =>
        api.post('/auth/validate-signup', {
          email: form.email.trim().toLowerCase(),
          username: form.username.trim().toLowerCase(),
        })
      );

      const response = await signupMutation({
        ...form,
        role: tempSignupData?.role || 'creator',
        categorySlug: tempSignupData?.categorySlug || 'creator',
        categoryId: tempSignupData?.categoryId,
        roleSubCategoryIds: tempSignupData?.roleSubCategoryIds,
        specializations: tempSignupData?.specializations ?? [],
        softwareUsed: tempSignupData?.softwareUsed ?? [],
        skills: tempSignupData?.softwareUsed ?? [],
        portfolioUrl: tempSignupData?.portfolioUrl,
        experienceYears: tempSignupData?.experienceYears,
        companyName: tempSignupData?.companyName || (isBrandClient ? form.fullName : undefined),
        companyWebsite: tempSignupData?.companyWebsite || (isBrandClient ? form.website : undefined),
        industry: tempSignupData?.industry,
        companySize: tempSignupData?.companySize,
        designation: tempSignupData?.designation,
        approxBudget: tempSignupData?.approxBudget,
        youtubeChannels: selectedChannels,
        instagramAccounts: tempSignupData?.instagramAccounts ?? [],
        discoveryToken: tempSignupData?.discoveryToken ?? null,
        googleId: isSocialUser ? socialProfile?.googleId : undefined,
        authProvider: isSocialUser ? 'google' : 'local',
        preferredCurrency: findCountryByName(form.country)?.currency || (form.country === 'India' ? 'INR' : 'USD'),
        profilePicture,
        pushToken: enableNotifications ? 'web_push_token_placeholder' : undefined,
        turnstileToken
      });

      if (response?.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(response.email || form.email)}`);
        return;
      }

      const isCreator = tempSignupData?.categorySlug === 'creator' || tempSignupData?.categorySlug === 'yt_influencer' || tempSignupData?.role === 'creator';
      const hasChannels = selectedChannels.length > 0;
      const hasInstagram = (tempSignupData?.instagramAccounts?.length ?? 0) > 0;

      if (isCreator && (hasChannels || hasInstagram)) {
        setShowSyncOverlay(true);
      } else {
        dispatch(clearTempSignupData());
        try { sessionStorage.removeItem('suvix_temp_signup_data'); } catch { /* ignore */ }
        navigate('/home');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const slug = tempSignupData?.categorySlug;
    if (slug === 'creator' || slug === 'yt_influencer') {
      navigate('/connect-socials');
    } else if (slug === 'editor' || slug === 'video_editor') {
      navigate('/editor-specialization');
    } else {
      navigate('/role-selection');
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-zinc-900 lg:bg-white flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {showSyncOverlay && <OnboardingSyncOverlay nextRoute="/home" />}
      
      {/* ── BACKGROUND LAYER ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-zinc-900 lg:bg-white">
        {/* Mobile Background - Clean & shifted upwards so artwork is visible above the form */}
        <img 
          src={loginMobileBg} 
          alt="SuviX Mobile Background" 
          className="block lg:hidden absolute inset-x-0 -top-14 sm:-top-0 w-full h-[calc(100%+56px)] sm:h-full object-cover object-[center_35%] opacity-100"
        />

        {/* Mobile Bottom-to-Middle Black Gradient Overlay Effect */}
        <div className="block lg:hidden absolute inset-0 bg-gradient-to-t from-black via-black/85 via-40% to-transparent to-70% pointer-events-none" />

        {/* Desktop Background */}
        {loginBg ? (
          <img 
            src={loginBg} 
            alt="SuviX Desktop Background" 
            className="hidden lg:block w-full h-full object-cover object-center opacity-100"
          />
        ) : null}

        {/* Desktop Right-Side Black Gradient Overlay (behind the form card) */}
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent from-25% via-black/45 via-60% to-black/85 pointer-events-none" />
      </div>

      {/* ── MAIN CONTENT LAYER ── */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-14 pt-4 sm:pt-6 lg:pt-8 pb-28 sm:pb-32 lg:pb-10 flex-1 flex flex-col justify-between">
        
        {/* MAIN BODY: TOP-LEFT BACK BUTTON & RIGHT SIGNUP CARD */}
        <div className="w-full flex flex-col lg:flex-row lg:items-start justify-between gap-5 sm:gap-8 lg:gap-10 flex-1">
          
          {/* TOP-LEFT BACK BUTTON */}
          <motion.div 
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex items-center self-start shrink-0"
          >
            <button 
              type="button"
              onClick={handleBack}
              className="group flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-white/95 hover:bg-white border border-zinc-200/80 text-zinc-900 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={15} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>
          </motion.div>

          {/* RIGHT SIDE FLOATING SIGNUP CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, ease: EASE, delay: 0.15 }}
            className="w-full lg:w-[48vw] xl:w-[44vw] 2xl:w-[42vw] max-w-[620px] flex justify-center lg:justify-end shrink-0 mx-auto lg:mx-0"
          >
            {/* White Card with Asymmetric Corners & Smooth Scroll */}
            <div className="light-card relative w-full bg-white rounded-tl-[1.5rem] sm:rounded-tl-[1.75rem] rounded-tr-[3rem] sm:rounded-tr-[4.5rem] rounded-br-[1.5rem] sm:rounded-br-[1.75rem] rounded-bl-[3rem] sm:rounded-bl-[4.5rem] px-4 py-3.5 sm:px-8 sm:py-5 lg:px-9 lg:py-6 shadow-[0_22px_65px_-15px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04)] border border-zinc-100 overflow-hidden flex flex-col max-h-[85dvh] lg:max-h-[88vh]" style={{ colorScheme: 'light' }}>
              
              {/* ── CARD HEADER: 3-COLUMN LAYOUT (20% LOGO | 60% TEXT | 20% PROFILE UPLOAD) ── */}
              <div className="flex items-start justify-between gap-1.5 sm:gap-3 mb-2 shrink-0 w-full">
                {/* Column 1: SuviX Logo (20% width, top-left aligned) */}
                <div className="w-[20%] flex items-start justify-start shrink-0 min-w-0 self-start pt-0.5">
                  <Link to="/" className="flex items-start justify-start transition-transform hover:scale-105">
                    <img src={logo} alt="SuviX" className="h-8 sm:h-9.5 lg:h-11 w-auto max-w-full object-contain" />
                  </Link>
                </div>

                {/* Column 2: Create Account Heading (60% width, centered) */}
                <div className="w-[60%] flex flex-col items-center justify-center text-center min-w-0 px-1">
                  <h2 className="text-[17px] sm:text-2xl lg:text-[23px] font-extrabold text-zinc-950 tracking-tight leading-[1.1] flex flex-col items-center">
                    <span>Create your</span>
                    <span>Account</span>
                  </h2>
                </div>

                {/* Column 3: Modern Circular Profile / Brand Logo Component with Black Add Button (20% width, centered) */}
                <div className="w-[20%] flex flex-col items-center justify-center shrink-0 min-w-0">
                  <label
                    className="relative group cursor-pointer flex flex-col items-center justify-center"
                    title={isBrandClient ? "Upload Brand Logo" : "Upload Profile Picture"}
                  >
                    {/* Enlarged Circular Avatar Preview */}
                    <div className="relative w-11 h-11 sm:w-13 sm:h-13 lg:w-15 lg:h-15 rounded-full bg-[#F8F9FA] group-hover:bg-zinc-100 border-2 border-zinc-200/90 group-hover:border-black shadow-sm flex items-center justify-center overflow-hidden transition-all group-hover:scale-105">
                      {profilePicturePreview ? (
                        <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <User size={20} className="text-zinc-400 group-hover:text-zinc-700 transition-colors sm:w-6 sm:h-6" />
                      )}
                    </div>

                    {/* Black Action Button to Add Profile Image (Enlarged) */}
                    <div className="mt-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-black text-white text-[8.5px] sm:text-[10px] font-bold flex items-center gap-1.5 shadow hover:bg-zinc-800 active:scale-95 transition-all">
                      <Camera size={10} className="text-white shrink-0 sm:w-3 sm:h-3" />
                      <span className="leading-none whitespace-nowrap">{profilePicturePreview ? "Change Photo" : "Add Photo"}</span>
                    </div>

                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              {/* ── ROLE DISPLAY COMPONENT (Above the two tabs) ── */}
              <div className="shrink-0 mb-1.5 sm:mb-2 px-3 py-1 sm:py-1.5 rounded-xl bg-[#F8F9FA] border border-zinc-200/80 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-md bg-zinc-200/90 flex items-center justify-center shrink-0">
                    <User size={12} className="text-black fill-black sm:w-3.5 sm:h-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[8.5px] sm:text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Role</span>
                    <span className="text-zinc-300 text-xs leading-none">/</span>
                    <span className="text-[11px] sm:text-xs font-bold text-zinc-950 truncate">{roleName}</span>
                  </div>
                </div>
                <Link
                  to="/role-selection"
                  className="text-[9px] sm:text-[10.5px] font-bold text-zinc-500 hover:text-black transition-colors underline decoration-zinc-300 hover:decoration-black shrink-0 ml-2 cursor-pointer"
                  title="Change your selected role"
                >
                  Change
                </Link>
              </div>

              {/* ── SUB-LEVEL / STEP SELECTOR TABS ── */}
              <div className="shrink-0 mb-1.5 sm:mb-2">
                <div className="flex items-center justify-between p-1 bg-zinc-100 rounded-xl">
                  {/* Level 1 Tab Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentLevel(1)}
                    className={`flex-1 py-1 px-2 rounded-lg text-[9.5px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      currentLevel === 1
                        ? 'bg-white text-black shadow-sm'
                        : 'text-zinc-500 hover:text-black'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[7.5px] sm:text-[9px] font-black ${
                        isLevel1Valid
                          ? 'bg-emerald-500 text-white'
                          : currentLevel === 1
                          ? 'bg-black text-white'
                          : 'bg-zinc-300 text-zinc-600'
                      }`}
                    >
                      {isLevel1Valid ? <Check size={8} strokeWidth={3.5} /> : '1'}
                    </span>
                    <span>1. Account Info</span>
                  </button>

                  {/* Level 2 Tab Button */}
                  <button
                    type="button"
                    onClick={() => isLevel1Valid && setCurrentLevel(2)}
                    disabled={!isLevel1Valid}
                    className={`flex-1 py-1 px-2 rounded-lg text-[9.5px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      currentLevel === 2
                        ? 'bg-white text-black shadow-sm'
                        : isLevel1Valid
                        ? 'text-zinc-500 hover:text-black cursor-pointer'
                        : 'text-zinc-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[7.5px] sm:text-[9px] font-black ${
                        isFormValid
                          ? 'bg-emerald-500 text-white'
                          : currentLevel === 2
                          ? 'bg-black text-white'
                          : 'bg-zinc-300 text-zinc-600'
                      }`}
                    >
                      {isFormValid ? <Check size={8} strokeWidth={3.5} /> : '2'}
                    </span>
                    <span>2. Security &amp; Region</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Form Content */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                <form id="signup-form" onSubmit={handleSubmit} className="space-y-1.5 sm:space-y-2 pt-0.5">
                  
                  {/* ERROR BANNER */}
                  {error && (
                    <div className="p-2 sm:p-2.5 rounded-xl bg-red-50 border border-red-200/80 text-red-600 text-[10px] sm:text-xs font-semibold flex items-start gap-1.5 sm:gap-2">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* ════════════ LEVEL 1: BASIC ACCOUNT INFO ════════════ */}
                  {currentLevel === 1 && (
                    <div className="space-y-1.5 sm:space-y-2 animate-in fade-in zoom-in-98 duration-150">
                      {/* Full Name / Brand Name */}
                      <div className="space-y-0.5">
                        <div className="relative bg-[#F8F9FA] hover:bg-zinc-100/70 focus-within:bg-white focus-within:border-zinc-400 border border-zinc-200/80 rounded-xl px-2.5 sm:px-3.5 py-1 sm:py-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-2">
                          {isBrandClient ? (
                            <Building2 size={14} className="text-zinc-700 shrink-0 stroke-[1.8] sm:w-[15px] sm:h-[15px]" />
                          ) : (
                            <User size={14} className="text-zinc-700 shrink-0 stroke-[1.8] sm:w-[15px] sm:h-[15px]" />
                          )}
                          <div className="flex-1 min-w-0 flex flex-col">
                            <label className="text-[7.5px] sm:text-[9px] text-zinc-400 font-medium leading-none block mb-0.5 select-none uppercase tracking-wider">
                              {isBrandClient ? "Brand Name" : "Full Name"}
                            </label>
                            <input
                              type="text"
                              required
                              name="fullName"
                              placeholder={isBrandClient ? "e.g. Nike" : "John Doe"}
                              value={form.fullName}
                              onChange={handleChange}
                              style={{ colorScheme: 'light', backgroundColor: 'transparent' }}
                              className="w-full text-[10.5px] sm:text-xs font-semibold text-zinc-950 !bg-transparent outline-none placeholder:text-zinc-400 placeholder:font-normal focus:bg-transparent leading-tight"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Handle / Username */}
                      <div className="space-y-0.5">
                        <div className={`relative bg-[#F8F9FA] hover:bg-zinc-100/70 focus-within:bg-white border rounded-xl px-2.5 sm:px-3.5 py-1 sm:py-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-2 ${
                          userStatus === 'available' ? 'border-emerald-500 focus-within:border-emerald-500' :
                          userStatus === 'taken'     ? 'border-red-500 focus-within:border-red-500' :
                          'border-zinc-200/80 focus-within:border-zinc-400'
                        }`}>
                          <AtSign size={14} className="text-zinc-700 shrink-0 stroke-[1.8] sm:w-[15px] sm:h-[15px]" />
                          <div className="flex-1 min-w-0 flex flex-col">
                            <label className="text-[7.5px] sm:text-[9px] text-zinc-400 font-medium leading-none block mb-0.5 select-none uppercase tracking-wider">
                              {isBrandClient ? "Brand Handle" : "Username"}
                            </label>
                            <input
                              type="text"
                              required
                              name="username"
                              placeholder={isBrandClient ? "brandhandle" : "handle"}
                              value={form.username}
                              onChange={handleChange}
                              style={{ colorScheme: 'light', backgroundColor: 'transparent' }}
                              className="w-full text-[10.5px] sm:text-xs font-semibold text-zinc-950 !bg-transparent outline-none placeholder:text-zinc-400 placeholder:font-normal focus:bg-transparent leading-tight"
                            />
                          </div>
                          {userStatus !== 'idle' && (
                            <div className="shrink-0 flex items-center">
                              {userStatus === 'checking' ? (
                                <Loader2 size={11} className="animate-spin text-zinc-400" />
                              ) : userStatus === 'available' ? (
                                <span className="text-[8.5px] sm:text-[9px] font-bold text-emerald-600">✓ Free</span>
                              ) : (
                                <span className="text-[8.5px] sm:text-[9px] font-bold text-red-500">✗ Taken</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="space-y-0.5">
                        <div className="relative bg-[#F8F9FA] hover:bg-zinc-100/70 focus-within:bg-white focus-within:border-zinc-400 border border-zinc-200/80 rounded-xl px-2.5 sm:px-3.5 py-1 sm:py-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-2">
                          <Mail size={14} className="text-zinc-700 shrink-0 stroke-[1.8] sm:w-[15px] sm:h-[15px]" />
                          <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex items-center justify-between">
                              <label className="text-[7.5px] sm:text-[9px] text-zinc-400 font-medium leading-none block mb-0.5 select-none uppercase tracking-wider">
                                {isBrandClient ? "Work Email Address" : "Email Address"}
                              </label>
                              {socialProfile?.email && (
                                <span className="text-[7.5px] sm:text-[8px] font-bold text-emerald-600 flex items-center gap-0.5">
                                  <Check size={8} strokeWidth={3} /> Auto-filled
                                </span>
                              )}
                            </div>
                            <input
                              type="email"
                              required
                              name="email"
                              placeholder={isBrandClient ? "partnerships@company.com" : "name@example.com"}
                              value={form.email}
                              onChange={handleChange}
                              style={{ colorScheme: 'light', backgroundColor: 'transparent' }}
                              className="w-full text-[10.5px] sm:text-xs font-semibold text-zinc-950 !bg-transparent outline-none placeholder:text-zinc-400 placeholder:font-normal focus:bg-transparent leading-tight"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Continue to Level 2 Next Button */}
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => isLevel1Valid && setCurrentLevel(2)}
                          disabled={!isLevel1Valid}
                          className={`w-full h-9 sm:h-10 rounded-full font-bold flex items-center justify-center gap-1.5 transition-all text-xs sm:text-[13px] ${
                            isLevel1Valid
                              ? 'bg-black text-white hover:bg-zinc-800 active:scale-98 shadow-sm cursor-pointer'
                              : 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          <span>Continue to Security &amp; Region</span>
                          <ArrowRight size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ════════════ LEVEL 2: SECURITY, REGION & DETAILS ════════════ */}
                  {currentLevel === 2 && (
                    <div className="space-y-1.5 sm:space-y-2 animate-in fade-in zoom-in-98 duration-150">
                      {/* Back to Level 1 Link */}
                      <div className="flex items-center justify-between pb-0.5">
                        <button
                          type="button"
                          onClick={() => setCurrentLevel(1)}
                          className="text-[9.5px] sm:text-[11px] font-bold text-zinc-600 hover:text-black flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ArrowLeft size={11} strokeWidth={2.5} />
                          <span>Edit Account Info (Step 1)</span>
                        </button>
                      </div>

                      {/* Phone Number + Language/Website Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                        {/* Phone Input */}
                        <div className="space-y-0.5">
                          <label className="text-[7.5px] sm:text-[9px] text-zinc-400 font-medium leading-none block pl-1 select-none uppercase tracking-wider">
                            Phone Number
                          </label>
                          <PhoneCountryInput
                            value={form.phone}
                            country={form.country}
                            isDetecting={isDetectingCountry}
                            onValidityChange={setIsPhoneValid}
                            onChange={(fullPhone, c, _national, valid) => {
                              setForm((prev) => ({ ...prev, phone: fullPhone, country: c.name }));
                              if (typeof valid === 'boolean') setIsPhoneValid(valid);
                            }}
                            onCountryChange={(c) => {
                              setForm((prev) => ({ ...prev, country: c.name }));
                            }}
                            required
                            variant="suvix-dark"
                            placement="top"
                          />
                        </div>

                        {/* Language or Website */}
                        {isBrandClient ? (
                          <div className="space-y-0.5">
                            <label className="text-[7.5px] sm:text-[9px] text-zinc-400 font-medium leading-none block pl-1 select-none uppercase tracking-wider">
                              Website / URL
                            </label>
                            <div className="relative bg-[#F8F9FA] hover:bg-zinc-100/70 focus-within:bg-white focus-within:border-zinc-400 border border-zinc-200/80 rounded-xl px-2.5 py-1 sm:py-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-2">
                              <Globe size={14} className="text-zinc-700 shrink-0 stroke-[1.8] sm:w-[15px] sm:h-[15px]" />
                              <input
                                type="url"
                                required
                                name="website"
                                placeholder="https://company.com"
                                value={form.website}
                                onChange={handleChange}
                                style={{ colorScheme: 'light', backgroundColor: 'transparent' }}
                                className="w-full text-[10.5px] sm:text-xs font-semibold text-zinc-950 !bg-transparent outline-none placeholder:text-zinc-400 placeholder:font-normal focus:bg-transparent leading-tight"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <label className="text-[7.5px] sm:text-[9px] text-zinc-400 font-medium leading-none block pl-1 select-none uppercase tracking-wider">
                              Language
                            </label>
                            <div className="relative bg-[#F8F9FA] hover:bg-zinc-100/70 focus-within:bg-white focus-within:border-zinc-400 border border-zinc-200/80 rounded-xl px-2.5 py-1 sm:py-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-2">
                              <Globe size={14} className="text-zinc-700 shrink-0 stroke-[1.8] sm:w-[15px] sm:h-[15px]" />
                              <select
                                name="motherTongue"
                                value={form.motherTongue}
                                onChange={handleChange}
                                style={{ colorScheme: 'light', backgroundColor: 'transparent' }}
                                className="w-full text-[10.5px] sm:text-xs font-semibold text-zinc-950 !bg-transparent outline-none cursor-pointer appearance-none leading-tight"
                              >
                                {LANGUAGES.map(l => <option key={l} value={l} className="bg-white text-black font-medium">{l}</option>)}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Country Select */}
                      <div className="space-y-0.5">
                        <label className="text-[7.5px] sm:text-[9px] text-zinc-400 font-medium leading-none block pl-1 select-none uppercase tracking-wider">
                          Your Country (for currency &amp; billing)
                        </label>
                        <CountrySelect
                          value={form.country}
                          isDetecting={isDetectingCountry}
                          onChange={(c) => {
                            setForm((prev) => ({ ...prev, country: c.name }));
                          }}
                          variant="suvix-dark"
                          placement="bottom"
                        />
                      </div>

                      {/* YouTube Channel Preview (yt_influencer only) */}
                      {selectedChannels.length > 0 && (
                        <div className="space-y-1 pt-0.5">
                          <h3 className="text-[8px] sm:text-[9px] font-bold tracking-wider text-zinc-400 uppercase ml-1">Linked YouTube Channel</h3>
                          <div className="space-y-1">
                            {selectedChannels.map((ch) => (
                              <div key={ch?.channelId} className="flex items-center gap-2 p-1.5 sm:p-2 rounded-xl border border-zinc-200/80 bg-[#F8F9FA] hover:bg-zinc-100/70 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                {ch?.thumbnailUrl && (
                                  <img src={ch.thumbnailUrl} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 bg-white" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[11px] sm:text-xs font-bold text-black truncate leading-tight">{ch?.channelName}</h4>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Youtube size={10} className="text-[#FF0000]" />
                                    <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-500">
                                      {Number(ch?.subscriberCount || 0).toLocaleString()} subscribers
                                    </span>
                                  </div>
                                </div>
                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Password Input or Google Security Note */}
                      {!isSocialUser ? (
                        <div className="space-y-0.5">
                          <div className="relative bg-[#F8F9FA] hover:bg-zinc-100/70 focus-within:bg-white focus-within:border-zinc-400 border border-zinc-200/80 rounded-xl px-2.5 sm:px-3.5 py-1 sm:py-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-2">
                            <Lock size={14} className="text-zinc-700 shrink-0 stroke-[1.8] sm:w-[15px] sm:h-[15px]" />
                            <div className="flex-1 min-w-0 flex flex-col">
                              <label className="text-[7.5px] sm:text-[9px] text-zinc-400 font-medium leading-none block mb-0.5 select-none uppercase tracking-wider">
                                Password
                              </label>
                              <input
                                type={showPass ? 'text' : 'password'}
                                required={!isSocialUser}
                                name="password"
                                placeholder="••••••••••••"
                                value={form.password}
                                onChange={handleChange}
                                style={{ colorScheme: 'light', backgroundColor: 'transparent' }}
                                className="w-full text-[10.5px] sm:text-xs font-semibold text-zinc-950 !bg-transparent outline-none placeholder:text-zinc-400 placeholder:font-normal tracking-wide focus:bg-transparent leading-tight"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowPass(!showPass)}
                              className="text-zinc-600 hover:text-black transition-colors p-0.5 cursor-pointer shrink-0"
                              aria-label="Toggle password visibility"
                            >
                              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 sm:p-2.5 rounded-xl border border-zinc-200/80 bg-[#F8F9FA] flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Lock size={12} className="text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-[8.5px] sm:text-[9px] font-bold text-black uppercase tracking-wider">Secured via Google</p>
                            <p className="text-[9.5px] sm:text-[10px] text-zinc-500 font-medium">No password needed — Google manages your authentication.</p>
                          </div>
                        </div>
                      )}

                      {/* Notifications Toggle */}
                      <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-xl border border-zinc-200/80 bg-[#F8F9FA] hover:bg-zinc-100/70 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-zinc-200/80 flex items-center justify-center shrink-0">
                            <Bell size={12} className="text-zinc-600" />
                          </div>
                          <div>
                            <p className="text-[10.5px] sm:text-[11px] font-bold text-black leading-tight">Enable Notifications</p>
                            <p className="text-[8.5px] sm:text-[9px] text-zinc-500 font-medium">Get updates on your creator projects</p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setEnableNotifications(!enableNotifications)}
                          className={`w-8 h-4.5 sm:w-9 sm:h-5 rounded-full transition-colors relative flex items-center ${enableNotifications ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                        >
                          <div className={`w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white rounded-full absolute transition-transform shadow-sm ${enableNotifications ? 'translate-x-3.5 sm:translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* ── FIXED IN-CARD FOOTER (CLOUDFLARE + DESKTOP CREATE ACCOUNT BUTTON) ── */}
              <div className="shrink-0 border-t border-zinc-100 bg-white pt-2 pb-0.5 mt-auto">
                {/* Cloudflare Security Status */}
                <div className="w-full pb-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 select-none overflow-hidden">
                  {/* Cloudflare Logo */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <img 
                      src={cloudflareLogo} 
                      alt="Cloudflare" 
                      className="h-3.5 sm:h-4 w-auto object-contain shrink-0" 
                    />
                  </div>

                  {/* Turnstile / Success Badge */}
                  <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end min-w-0 overflow-hidden">
                    {siteKey ? (
                      <div className="max-w-full overflow-hidden flex justify-center sm:justify-end scale-[0.76] sm:scale-75 origin-center sm:origin-right">
                        <Turnstile
                          siteKey={siteKey}
                          options={{ theme: 'light' }}
                          onSuccess={(token) => {
                            setTurnstileToken(token);
                            setTurnstileStatus('success');
                          }}
                          onError={() => {
                            setTurnstileToken('');
                            setTurnstileStatus('error');
                            setError('Security check failed. Please refresh and try again.');
                          }}
                          onExpire={() => {
                            setTurnstileToken('');
                            setTurnstileStatus('expired');
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[9px] sm:text-[11px] font-bold text-emerald-700 shrink-0">
                        <CheckCircle2 size={11} className="text-emerald-600 shrink-0 sm:w-3 sm:h-3" />
                        <span>Verified & Secured</span>
                        <span className="text-zinc-400 font-normal text-[9px] hidden sm:inline">Privacy · Terms</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── DESKTOP FIXED FOOTER CTA (ALWAYS FIXED AT CARD BOTTOM WITHOUT SCROLLING) ── */}
                <div className="hidden lg:block space-y-1.5 pt-1">
                  {currentLevel === 1 && !isFormValid ? (
                    <button
                      type="button"
                      onClick={() => isLevel1Valid && setCurrentLevel(2)}
                      disabled={!isLevel1Valid}
                      className={`w-full h-10 sm:h-11 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-md text-xs sm:text-sm ${
                        isLevel1Valid
                          ? 'bg-black text-white hover:bg-zinc-800 active:scale-98 cursor-pointer'
                          : 'bg-zinc-200 text-zinc-500 cursor-not-allowed opacity-90'
                      }`}
                    >
                      <span>Next Step: Security &amp; Region</span>
                      <ArrowRight size={15} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      form="signup-form"
                      disabled={isLoading || !isFormValid}
                      className={`w-full h-10 sm:h-11 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-md text-xs sm:text-sm ${
                        isFormValid && !isLoading
                          ? 'bg-black text-white hover:bg-zinc-800 active:scale-98 cursor-pointer'
                          : 'bg-zinc-200 text-zinc-500 cursor-not-allowed opacity-90'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
                      ) : (
                        <>
                          {!isFormValid ? (
                            <Lock size={15} className="text-zinc-500 shrink-0" />
                          ) : null}
                          <span>Create Account</span>
                          {isFormValid ? (
                            <ArrowRight size={16} strokeWidth={2.5} />
                          ) : null}
                        </>
                      )}
                    </button>
                  )}

                  <div className="text-center text-xs text-zinc-500 font-medium pt-0.5">
                    <span>Already have an account? </span>
                    <Link to="/login" className="font-bold text-black hover:underline inline-flex items-center gap-0.5">
                      Log In <ArrowRight size={12} className="inline ml-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── MOBILE FIXED BOTTOM ACTION DOCK (MOBILE ONLY, WITH LOCK REMOVAL ON COMPLETION) ── */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-zinc-200/80 rounded-t-[1.75rem] sm:rounded-t-[2.25rem] shadow-[0_-10px_35px_rgba(0,0,0,0.15)] px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          {/* Helper Text: Already have an account? */}
          <div className="text-center text-[11px] sm:text-xs text-zinc-500 font-medium">
            <span>Already have an account? </span>
            <Link to="/login" className="font-bold text-black hover:underline">
              Log In
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Secondary Button: Log In */}
            <Link
              to="/login"
              className="flex-1 h-10 sm:h-11 rounded-full bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border border-zinc-200/80 shadow-sm"
            >
              <span>Log In</span>
            </Link>

            {/* Primary Button: Create Account (or Next on Mobile if in Level 1) */}
            {currentLevel === 1 && !isFormValid ? (
              <button
                type="button"
                onClick={() => isLevel1Valid && setCurrentLevel(2)}
                disabled={!isLevel1Valid}
                className={`flex-1 h-10 sm:h-11 rounded-full font-bold flex items-center justify-center gap-1.5 transition-all shadow-md text-xs sm:text-sm ${
                  isLevel1Valid
                    ? 'bg-black text-white hover:bg-zinc-800 active:scale-98 cursor-pointer'
                    : 'bg-zinc-200 text-zinc-500 cursor-not-allowed opacity-90'
                }`}
              >
                <span>Next Step</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="submit"
                form="signup-form"
                disabled={isLoading || !isFormValid}
                className={`flex-1 h-10 sm:h-11 rounded-full font-bold flex items-center justify-center gap-1.5 transition-all shadow-md text-xs sm:text-sm ${
                  isFormValid && !isLoading
                    ? 'bg-black text-white hover:bg-zinc-800 active:scale-98 cursor-pointer'
                    : 'bg-zinc-200 text-zinc-500 cursor-not-allowed opacity-90'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
                ) : (
                  <>
                    {!isFormValid ? (
                      <Lock size={14} className="text-zinc-500 shrink-0" />
                    ) : null}
                    <span>Create Account</span>
                    {isFormValid ? (
                      <ArrowRight size={14} strokeWidth={2.5} />
                    ) : null}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}