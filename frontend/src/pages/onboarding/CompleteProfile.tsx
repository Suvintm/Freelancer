import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AtSign,
  Globe,
  Shield,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  CheckCircle2,
  User,
  Camera,
  Lock,
  Building2,
} from 'lucide-react';
import lightLogo from '../../assets/lightlogo.png';
import logoDefault from '../../assets/blackbglogo.png';
import cloudflareLogo from '../../assets/cloudflare.png';
import loginMobileBg from '../../assets/loginmobilebg.png';
import { useDispatch, useSelector } from 'react-redux';
import { setAuth } from '../../store/slices/authSlice';
import type { RootState } from '../../store';
import { clearTempSignupData } from '../../store/slices/onboardingSlice';
import { useCategories } from '../../queries/useCategories';
import { authService } from '../../api/services/auth.service';
import { api } from '../../api/client';
import { OnboardingSyncOverlay } from '../../components/onboarding/OnboardingSyncOverlay';
import { Turnstile } from '@marsidev/react-turnstile';
import { PhoneCountryInput } from '../../components/common/PhoneCountryInput';
import { CountrySelect } from '../../components/common/CountrySelect';
import { detectBrowserCountry, findCountryByName, autoDetectCountryAsync } from '../../data/countries';

const EASE = [0.16, 1, 0.3, 1] as const;
const LANGUAGES = ['English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi'];

// Dynamically resolve loginbg.png if it exists on disk, falling back to clean white background if not yet created
const desktopBgModules = import.meta.glob<{ default: string }>('../../assets/loginbg.png', { eager: true });
const loginBg = desktopBgModules['../../assets/loginbg.png']?.default || null;

// Dynamically resolve blacklogo.png if added, fallback to lightLogo/logoDefault
const blackLogoModules = import.meta.glob<{ default: string }>('../../assets/blacklogo.png', { eager: true });
const logo = blackLogoModules['../../assets/blacklogo.png']?.default || lightLogo || logoDefault;

/**
 * WEB EQUIVALENT OF MOBILE'S complete-profile.tsx
 * Shown to NEW users after Google OAuth + role selection.
 * - Displays: Google identity, email, selected role, niches, YT channels
 * - Asks: username + phone + language only (no password for Google users)
 * - Calls: /auth/register-full with googleId, authProvider='google'
 */
export default function CompleteProfile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const onboarding = useSelector((state: RootState) => state.onboarding);
  const tempSignupData = onboarding.tempSignupData;
  const selectedRole = onboarding.selectedRole;
  const authMethod = onboarding.authMethod || tempSignupData?.authMethod;
  const youtubeDiscovery = onboarding.youtubeDiscovery;
  const { categories } = useCategories();

  const socialProfile = tempSignupData?.socialProfile as Record<string, string> | undefined;
  const isSocialSignup = (authMethod === 'google') || (tempSignupData?.isSocialSignup as boolean | undefined);

  const roleSlug = selectedRole?.slug || tempSignupData?.categorySlug || 'creator';
  const roleName = selectedRole?.name || tempSignupData?.roleName || 'Creator';
  const isBrandClient = roleSlug === 'brand' || roleSlug === 'social_promoter' || tempSignupData?.categorySlug === 'brand';

  const [form, setForm] = useState({
    fullName: socialProfile?.name || tempSignupData?.companyName || '',
    username: '',
    phone: '',
    motherTongue: 'English',
    country: detectBrowserCountry().name,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingCountry, setIsDetectingCountry] = useState(true);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [userStatus, setUserStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Zero-cost auto-detect country via Multi-tier Edge + Browser heuristics
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

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(socialProfile?.picture || null);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
  const [turnstileToken, setTurnstileToken] = useState<string>(() => (!siteKey ? 'dev-bypass' : ''));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const isSubmittedRef = useRef(false);

  // 🔐 PRODUCTION GUARD: Must have social profile + role before reaching this page.
  useEffect(() => {
    if (isSubmittedRef.current) return;
    if (!isSocialSignup || !socialProfile?.email) {
      navigate('/login', { replace: true });
      return;
    }
    if (!selectedRole && !tempSignupData?.categoryId) {
      navigate('/role-selection', { replace: true });
    }
  }, [isSocialSignup, socialProfile, selectedRole, tempSignupData?.categoryId, navigate]);

  // Resolve real category name from store
  const selectedCategory = useMemo(() =>
    categories.find(c => c.id === (selectedRole?.id || tempSignupData?.categoryId as string)),
    [categories, selectedRole, tempSignupData?.categoryId]
  );

  // Resolve real subcategory names from store
  const selectedSubCategories = useMemo(() => {
    if (!selectedCategory || !selectedCategory.subCategories) return [];
    const ids = (tempSignupData?.roleSubCategoryIds as string[]) ?? [];
    return selectedCategory.subCategories.filter(s => ids.includes(s.id));
  }, [selectedCategory, tempSignupData?.roleSubCategoryIds]);

  const youtubeChannels = youtubeDiscovery.channels.length > 0 ? youtubeDiscovery.channels : tempSignupData?.youtubeChannels;
  const hasYouTubeChannels = !!youtubeChannels?.length;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'username') {
      const sanitized = value.toLowerCase().replace(/[^a-z0-9_.]/g, '').replace(/\.\.+/g, '.');
      setForm(prev => ({ ...prev, username: sanitized }));
      setUserStatus('idle');
      return;
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Live debounced username availability validation (1200ms)
  useEffect(() => {
    if (!form.username || form.username.trim().length < 3) {
      setUserStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setUserStatus('checking');
      const startTime = Date.now();
      try {
        const available = await authService.checkUsername(form.username.trim().toLowerCase());
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 300 - elapsed);
        setTimeout(() => {
          setUserStatus(available ? 'available' : 'taken');
        }, remainingDelay);
      } catch {
        setUserStatus('idle');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [form.username]);

  // Validation state
  const isFormValid = Boolean(
    form.fullName.trim() &&
    form.username.trim().length >= 3 &&
    userStatus === 'available' &&
    form.phone.trim() &&
    isPhoneValid &&
    turnstileToken
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userStatus === 'taken') { setError('This username is already taken.'); return; }
    if (!form.username || form.username.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (!form.phone || !isPhoneValid) { setError('Please enter a valid phone number for your selected country.'); return; }

    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/validate-signup', {
        email: socialProfile!.email,
        username: form.username,
      });

      let payload: Record<string, unknown> | FormData;

      const prefCurr = findCountryByName(form.country)?.currency || (form.country === 'India' ? 'INR' : 'USD');

      if (profilePicture) {
        const formData = new FormData();
        formData.append('fullName', form.fullName.trim() || socialProfile!.name);
        formData.append('username', form.username);
        formData.append('email', socialProfile!.email);
        formData.append('phone', form.phone);
        formData.append('motherTongue', form.motherTongue);
        formData.append('country', form.country);
        formData.append('preferredCurrency', prefCurr);
        formData.append('googleId', socialProfile!.googleId);
        formData.append('authProvider', 'google');
        formData.append('categoryId', (tempSignupData?.categoryId as string) || '');
        formData.append('roleSubCategoryIds', JSON.stringify(tempSignupData?.roleSubCategoryIds || []));
        formData.append('specializations', JSON.stringify(tempSignupData?.specializations || []));
        formData.append('softwareUsed', JSON.stringify(tempSignupData?.softwareUsed || []));
        formData.append('skills', JSON.stringify(tempSignupData?.softwareUsed || []));
        if (tempSignupData?.portfolioUrl) formData.append('portfolioUrl', tempSignupData.portfolioUrl);
        if (tempSignupData?.experienceYears !== undefined) formData.append('experienceYears', String(tempSignupData.experienceYears));
        if (tempSignupData?.companyName) formData.append('companyName', tempSignupData.companyName);
        if (tempSignupData?.companyWebsite) formData.append('companyWebsite', tempSignupData.companyWebsite);
        if (tempSignupData?.industry) formData.append('industry', tempSignupData.industry);
        if (tempSignupData?.companySize) formData.append('companySize', tempSignupData.companySize);
        if (tempSignupData?.designation) formData.append('designation', tempSignupData.designation);
        if (tempSignupData?.approxBudget) formData.append('approxBudget', String(tempSignupData.approxBudget));
        formData.append('youtubeChannels', JSON.stringify(tempSignupData?.youtubeChannels || []));
        formData.append('instagramAccounts', JSON.stringify(tempSignupData?.instagramAccounts || []));
        if (tempSignupData?.discoveryToken) {
          formData.append('discoveryToken', tempSignupData.discoveryToken);
        }
        formData.append('profilePicture', profilePicture);
        formData.append('turnstileToken', turnstileToken);
        payload = formData;
      } else {
        payload = {
          fullName: form.fullName.trim() || socialProfile!.name,
          username: form.username,
          email: socialProfile!.email,
          phone: form.phone,
          motherTongue: form.motherTongue,
          country: form.country,
          preferredCurrency: prefCurr,
          googleId: socialProfile!.googleId,
          authProvider: 'google',
          categoryId: tempSignupData?.categoryId ?? null,
          roleSubCategoryIds: tempSignupData?.roleSubCategoryIds ?? [],
          specializations: tempSignupData?.specializations ?? [],
          softwareUsed: tempSignupData?.softwareUsed ?? [],
          skills: tempSignupData?.softwareUsed ?? [],
          portfolioUrl: tempSignupData?.portfolioUrl,
          experienceYears: tempSignupData?.experienceYears,
          companyName: tempSignupData?.companyName,
          companyWebsite: tempSignupData?.companyWebsite,
          industry: tempSignupData?.industry,
          companySize: tempSignupData?.companySize,
          designation: tempSignupData?.designation,
          approxBudget: tempSignupData?.approxBudget ?? undefined,
          youtubeChannels: tempSignupData?.youtubeChannels ?? [],
          instagramAccounts: tempSignupData?.instagramAccounts ?? [],
          discoveryToken: tempSignupData?.discoveryToken ?? null,
          turnstileToken,
        };
      }

      const res = await api.post('/auth/register-full', payload, {
        headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      });
      if (res.data.success) {
        isSubmittedRef.current = true;
        dispatch(setAuth({ user: res.data.user, token: res.data.token, refreshToken: res.data.refreshToken }));
        
        const userRole = (res.data.user?.role || tempSignupData?.role || '').toLowerCase();
        const categorySlug = (tempSignupData?.categorySlug || res.data.user?.primaryRole?.category || '').toLowerCase();
        const isBrand = userRole === 'brand' || categorySlug === 'brand' || categorySlug === 'social_promoter';
        const isCreator = userRole === 'creator' || categorySlug === 'creator' || categorySlug === 'yt_influencer' || categorySlug === 'youtube creator';
        const hasChannels = (tempSignupData?.youtubeChannels?.length ?? 0) > 0 || (res.data.user?.youtubeChannels?.length ?? 0) > 0;
        const hasInstagram = (tempSignupData?.instagramAccounts?.length ?? 0) > 0 || (res.data.user?.instagramAccounts?.length ?? 0) > 0;

        const targetRoute = isBrand ? '/home' : '/onboarding/preferences';

        if (isCreator && (hasChannels || hasInstagram)) {
          const syncMode = res.data.syncMode || res.data.ytSyncMode || res.data.instaSyncMode || 'foreground';
          if (syncMode === 'background') {
            if (hasChannels) {
              api.post('/youtube-creator/channel/sync-manual').catch((err) => {
                console.error('Failed to trigger background YouTube sync:', err);
              });
            }
            if (hasInstagram) {
              api.post('/instagram-creator/sync-manual').catch((err) => {
                console.error('Failed to trigger background Instagram sync:', err);
              });
            }
            dispatch(clearTempSignupData());
            try { sessionStorage.removeItem('suvix_temp_signup_data'); } catch { /* ignore */ }
            setTimeout(() => {
              navigate(targetRoute, { replace: true });
            }, 1200);
          } else {
            setShowSyncOverlay(true);
          }
        } else {
          dispatch(clearTempSignupData());
          try { sessionStorage.removeItem('suvix_temp_signup_data'); } catch { /* ignore */ }
          navigate(targetRoute);
        }
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(apiErr.response?.data?.message || apiErr.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const isEditor = selectedCategory?.slug === 'editor' || selectedCategory?.slug === 'video_editor';
    const isCreator = selectedCategory?.slug === 'creator' || selectedCategory?.slug === 'yt_influencer';
    const isBrand = selectedCategory?.slug === 'brand' || selectedCategory?.slug === 'social_promoter';
    if (isCreator) navigate('/connect-socials');
    else if (isEditor) navigate('/editor-specialization');
    else if (isBrand) navigate('/brand-details');
    else navigate('/role-selection');
  };

  if (!socialProfile) return null;

  return (
    <div className="relative min-h-[100dvh] w-full bg-zinc-900 lg:bg-white flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {showSyncOverlay && <OnboardingSyncOverlay nextRoute="/onboarding/preferences" />}

      {/* ── BACKGROUND LAYER (Exact match to Login and Signup) ── */}
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
        
        {/* MAIN BODY: TOP-LEFT BACK BUTTON & RIGHT PROFILE CARD */}
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

          {/* RIGHT SIDE FLOATING FINALIZE PROFILE CARD */}
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

                {/* Column 2: Finalize Profile Heading (60% width, centered) */}
                <div className="w-[60%] flex flex-col items-center justify-center text-center min-w-0 px-1">
                  <h2 className="text-[17px] sm:text-2xl lg:text-[23px] font-extrabold text-zinc-950 tracking-tight leading-[1.1] flex flex-col items-center">
                    <span>Finalize your</span>
                    <span>Profile</span>
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

              {/* ── ROLE DISPLAY COMPONENT (Opposite corner rounding) ── */}
              <div className="shrink-0 mb-2 sm:mb-2.5 px-3 py-1 sm:py-1.5 rounded-tl-xl rounded-tr-2xl rounded-br-xl rounded-bl-2xl bg-[#F8F9FA] border border-zinc-200/80 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
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
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[9px] sm:text-[10px] font-bold text-emerald-700 shrink-0">
                  <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                  <span>Google Verified</span>
                </div>
              </div>

              {/* Scrollable Form Content */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                <form id="complete-profile-form" onSubmit={handleSubmit} className="space-y-2 sm:space-y-2.5 pt-0.5">
                  
                  {/* ERROR BANNER */}
                  {error && (
                    <div className="p-2 sm:p-2.5 rounded-tl-xl rounded-tr-2xl rounded-br-xl rounded-bl-2xl bg-red-50 border border-red-200/80 text-red-600 text-[10px] sm:text-xs font-semibold flex items-start gap-1.5 sm:gap-2">
                      <span>{error}</span>
                    </div>
                  )}

                  {/* ── SECTION 1: PUBLIC IDENTITY & DETAILS ── */}
                  <div className="space-y-1.5 sm:space-y-2">
                    {/* Username Handle Input */}
                    <div className="space-y-0.5">
                      <div className="relative bg-[#F8F9FA] hover:bg-zinc-100/70 focus-within:bg-white focus-within:border-zinc-400 border border-zinc-200/80 rounded-xl px-2.5 sm:px-3.5 py-1 sm:py-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-2">
                        <AtSign size={14} className="text-zinc-700 shrink-0 stroke-[1.8] sm:w-[15px] sm:h-[15px]" />
                        <div className="flex-1 min-w-0 flex flex-col">
                          <label className="text-[7.5px] sm:text-[9px] text-zinc-400 font-medium leading-none block mb-0.5 select-none uppercase tracking-wider">
                            Choose Handle (Username)
                          </label>
                          <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="your_handle"
                            required
                            autoComplete="username"
                            className="w-full bg-transparent text-xs sm:text-[13px] text-zinc-950 placeholder:text-zinc-400 font-semibold focus:outline-none p-0 leading-tight"
                          />
                        </div>

                        {/* Live availability indicator badge */}
                        {userStatus !== 'idle' && (
                          <div className="shrink-0 flex items-center">
                            {userStatus === 'checking' && (
                              <div className="flex items-center gap-1 text-zinc-600 text-[8.5px] sm:text-[10px] font-bold bg-zinc-200/80 px-1.5 py-0.5 rounded-md">
                                <Loader2 size={10} className="animate-spin" />
                                <span>Checking</span>
                              </div>
                            )}
                            {userStatus === 'available' && (
                              <div className="flex items-center gap-1 text-emerald-700 text-[8.5px] sm:text-[10px] font-bold bg-emerald-100 px-1.5 py-0.5 rounded-md">
                                <Check size={10} strokeWidth={3} />
                                <span>Free</span>
                              </div>
                            )}
                            {userStatus === 'taken' && (
                              <div className="flex items-center gap-1 text-red-700 text-[8.5px] sm:text-[10px] font-bold bg-red-100 px-1.5 py-0.5 rounded-md">
                                <span>Taken</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Full Name / Brand Name Input */}
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
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            placeholder={isBrandClient ? "e.g. Nike / Acme Corp" : "e.g. John Doe"}
                            required
                            autoComplete="name"
                            className="w-full bg-transparent text-xs sm:text-[13px] text-zinc-950 placeholder:text-zinc-400 font-semibold focus:outline-none p-0 leading-tight"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mobile Number Input */}
                    <div className="space-y-0.5">
                      <label className="text-[7.5px] sm:text-[9px] text-zinc-400 font-medium leading-none block pl-1 select-none uppercase tracking-wider">
                        Mobile Number
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
                        placement="bottom"
                      />
                    </div>

                    {/* Primary Language */}
                    <div className="space-y-0.5">
                      <div className="relative bg-[#F8F9FA] hover:bg-zinc-100/70 focus-within:bg-white focus-within:border-zinc-400 border border-zinc-200/80 rounded-xl px-2.5 sm:px-3.5 py-1 sm:py-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-2">
                        <Globe size={14} className="text-zinc-700 shrink-0 stroke-[1.8] sm:w-[15px] sm:h-[15px]" />
                        <div className="flex-1 min-w-0 flex flex-col">
                          <label className="text-[7.5px] sm:text-[9px] text-zinc-400 font-medium leading-none block mb-0.5 select-none uppercase tracking-wider">
                            Primary Language
                          </label>
                          <select
                            name="motherTongue"
                            value={form.motherTongue}
                            onChange={handleChange}
                            className="w-full bg-transparent text-xs sm:text-[13px] text-zinc-950 font-semibold focus:outline-none p-0 leading-tight cursor-pointer appearance-none"
                          >
                            {LANGUAGES.map(l => <option key={l} value={l} className="bg-white text-black font-medium">{l}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Country Selector */}
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

                    {/* YouTube Channel Preview if present */}
                    {hasYouTubeChannels && (
                      <div className="space-y-1 pt-0.5">
                        <h3 className="text-[8px] sm:text-[9px] font-bold tracking-wider text-zinc-400 uppercase ml-1">Linked YouTube Channel</h3>
                        <div className="space-y-1">
                          {youtubeChannels!.map((ch) => (
                            <div
                              key={ch.channelId as string}
                              className="flex items-center gap-2 p-1.5 sm:p-2 rounded-tl-xl rounded-tr-2xl rounded-br-xl rounded-bl-2xl border border-zinc-200/80 bg-[#F8F9FA] hover:bg-zinc-100/70 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                            >
                              {ch.thumbnailUrl ? (
                                <img src={ch.thumbnailUrl as string} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 bg-white border border-zinc-200" />
                              ) : (
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold shrink-0 text-xs">YT</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[11px] sm:text-xs font-bold text-black truncate leading-tight">{ch.channelName as string}</h4>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[9px] sm:text-[10px] text-zinc-500 font-medium">{Number(ch.subscriberCount || 0).toLocaleString()} subscribers</span>
                                </div>
                              </div>
                              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Specializations & Software Tags if present */}
                    {((tempSignupData?.specializations && tempSignupData.specializations.length > 0) || selectedSubCategories.length > 0) && (
                      <div className="space-y-1 pt-0.5">
                        <h3 className="text-[8px] sm:text-[9px] font-bold tracking-wider text-zinc-400 uppercase ml-1">Specializations</h3>
                        <div className="flex flex-wrap gap-1">
                          {(tempSignupData?.specializations ?? selectedSubCategories.map(s => s.name)).map(name => (
                            <span
                              key={name}
                              className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 text-[10px] sm:text-xs font-medium border border-zinc-200/70"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Google OAuth & Security Box (Opposite Corner Rounded) */}
                    <div className="p-2 sm:p-2.5 rounded-tl-xl rounded-tr-2xl rounded-br-xl rounded-bl-2xl bg-[#F8F9FA] border border-zinc-200/80 flex items-start gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      <Shield size={13} className="text-zinc-600 shrink-0 mt-0.5" />
                      <p className="text-[9.5px] sm:text-[11px] text-zinc-600 leading-snug">
                        Authenticated with <span className="font-bold text-black">Google OAuth ({socialProfile?.email})</span>. You can log in securely anytime with 1-click.
                      </p>
                    </div>

                    {/* Cloudflare Turnstile Verification */}
                    {siteKey && (
                      <div className="flex justify-center pt-0.5">
                        <Turnstile
                          siteKey={siteKey}
                          onSuccess={(token) => setTurnstileToken(token)}
                          onError={() => setError('Security check failed. Please refresh and try again.')}
                          onExpire={() => setTurnstileToken('')}
                        />
                      </div>
                    )}

                  </div>
                </form>
              </div>

              {/* ── DESKTOP FIXED FOOTER CTA (ALWAYS FIXED AT CARD BOTTOM WITHOUT SCROLLING) ── */}
              <div className="hidden lg:block shrink-0 pt-2.5 border-t border-zinc-100 bg-white space-y-1.5 mt-auto">
                {/* Cloudflare Security Badge */}
                <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-[9.5px] select-none">
                  <span>Secured by</span>
                  <img src={cloudflareLogo} alt="Cloudflare" className="h-3.5 w-auto object-contain" />
                </div>

                {/* Submit Button (outside scroll area, linked to form id) */}
                <button
                  type="submit"
                  form="complete-profile-form"
                  disabled={isLoading || !isFormValid}
                  className={`w-full py-2.5 sm:py-3 px-4 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                    isFormValid && !isLoading
                      ? 'bg-black text-white hover:bg-zinc-800 cursor-pointer shadow-zinc-900/10'
                      : 'bg-zinc-200 text-zinc-500 cursor-not-allowed opacity-90'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      {!isFormValid ? (
                        <Lock size={15} className="text-zinc-500 shrink-0" />
                      ) : null}
                      <span>Complete Profile &amp; Continue</span>
                      {isFormValid ? (
                        <ArrowRight size={16} strokeWidth={2.5} />
                      ) : null}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── MOBILE FIXED BOTTOM ACTION DOCK (MOBILE ONLY) ── */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-zinc-200/80 rounded-t-[1.75rem] sm:rounded-t-[2.25rem] shadow-[0_-10px_35px_rgba(0,0,0,0.15)] px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          {/* Cloudflare Badge on Mobile */}
          <div className="flex items-center justify-center gap-1 text-zinc-400 text-[9px] select-none">
            <span>Secured by</span>
            <img src={cloudflareLogo} alt="Cloudflare" className="h-3 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Secondary Button: Back */}
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 h-10 sm:h-11 rounded-full bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border border-zinc-200/80 shadow-sm cursor-pointer"
            >
              <ArrowLeft size={14} strokeWidth={2.5} className="text-zinc-600 shrink-0" />
              <span>Back</span>
            </button>

            {/* Primary Button: Complete Profile */}
            <button
              type="submit"
              form="complete-profile-form"
              disabled={isLoading || !isFormValid}
              className={`flex-[2] h-10 sm:h-11 rounded-full font-bold flex items-center justify-center gap-1.5 transition-all shadow-md text-xs sm:text-sm ${
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
                  <span>Complete Profile</span>
                  {isFormValid ? (
                    <ArrowRight size={14} strokeWidth={2.5} />
                  ) : null}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
