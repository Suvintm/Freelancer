import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AtSign,
  Phone,
  Globe,
  Shield,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  User,
  Briefcase,
  Tag,
  Mail,
  Camera,
  X,
  Building2,
} from 'lucide-react';
import logo from '../assets/lightlogo.png';
import { useDispatch, useSelector } from 'react-redux';
import { setAuth } from '../store/slices/authSlice';
import type { RootState } from '../store';
import { clearTempSignupData } from '../store/slices/onboardingSlice';
import { useCategories } from '../queries/useCategories';
import { authService } from '../api/services/auth.service';
import { api } from '../api/client';
import { OnboardingSyncOverlay } from '../components/onboarding/OnboardingSyncOverlay';
import { Turnstile } from '@marsidev/react-turnstile';

const EASE = [0.16, 1, 0.3, 1] as const;
const LANGUAGES = ['English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi'];
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'United Arab Emirates', 'Saudi Arabia', 'Singapore'];

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

  const [form, setForm] = useState({
    fullName: socialProfile?.name || '',
    username: '',
    phone: '',
    motherTongue: 'English',
    country: 'India',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userStatus, setUserStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(socialProfile?.picture || null);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveCustomPicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(socialProfile?.picture || null);
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

  const handleUsernameBlur = async () => {
    if (!form.username || form.username.length < 3) return;
    setUserStatus('checking');
    try {
      const available = await authService.checkUsername(form.username);
      setUserStatus(available ? 'available' : 'taken');
    } catch { setUserStatus('idle'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userStatus === 'taken') { setError('This username is already taken.'); return; }
    if (!form.username || form.username.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (!form.phone) { setError('Phone number is required.'); return; }

    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/validate-signup', {
        email: socialProfile!.email,
        username: form.username,
      });

      let payload: Record<string, unknown> | FormData;

      if (profilePicture) {
        const formData = new FormData();
        formData.append('fullName', form.fullName.trim() || socialProfile!.name);
        formData.append('username', form.username);
        formData.append('email', socialProfile!.email);
        formData.append('phone', form.phone);
        formData.append('motherTongue', form.motherTongue);
        formData.append('country', form.country);
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
        // Mark onboarding as complete before clearing (for any analytics/logging)
        dispatch(setAuth({ user: res.data.user, token: res.data.token, refreshToken: res.data.refreshToken }));
        
        const userRole = (res.data.user?.role || tempSignupData?.role || '').toLowerCase();
        const categorySlug = (tempSignupData?.categorySlug || res.data.user?.primaryRole?.category || '').toLowerCase();
        const isBrand = userRole === 'brand' || categorySlug === 'brand' || categorySlug === 'social_promoter';
        const isCreator = userRole === 'creator' || categorySlug === 'creator' || categorySlug === 'yt_influencer' || categorySlug === 'youtube creator';
        const hasChannels = (tempSignupData?.youtubeChannels?.length ?? 0) > 0 || (res.data.user?.youtubeChannels?.length ?? 0) > 0;

        // Show blocking overlay ONLY for YouTube creators with connected channels
        if (isCreator && hasChannels) {
          setShowSyncOverlay(true);
        } else {
          dispatch(clearTempSignupData());
          try { sessionStorage.removeItem('suvix_temp_signup_data'); } catch { /* ignore */ }
          // Brand: skip preferences, go straight to home
          // All others (Editor, Normal User): go to preferences
          navigate(isBrand ? '/home' : '/onboarding/preferences');
        }
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(apiErr.response?.data?.message || apiErr.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!socialProfile) return null;

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] text-zinc-900 flex flex-col relative selection:bg-zinc-900 selection:text-white font-sans">
      {showSyncOverlay && <OnboardingSyncOverlay nextRoute="/onboarding/preferences" />}

      {/* ── SUBTLE ENTERPRISE GRID PATTERN ─────────────────────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(228, 228, 231, 0.6) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(228, 228, 231, 0.6) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ── TOP HEADER / NAVIGATION BAR ────────────────────────────────────── */}
      <header className="relative z-50 w-full px-4 py-3.5 sm:px-8 sm:py-4.5 md:px-12 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="SuviX"
            className="h-7 sm:h-8 md:h-8.5 w-auto object-contain cursor-pointer"
            onClick={() => navigate('/')}
          />
        </div>

        {/* Step Indicator & Back Button */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 shadow-2xs text-xs font-medium text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
            <span>Step 3 of 3 • Complete Profile</span>
          </div>

          <button
            onClick={() => {
              const isEditor = selectedCategory?.slug === 'editor' || selectedCategory?.slug === 'video_editor';
              const isCreator = selectedCategory?.slug === 'creator' || selectedCategory?.slug === 'yt_influencer';
              const isBrand = selectedCategory?.slug === 'brand' || selectedCategory?.slug === 'social_promoter';
              if (isCreator) navigate('/connect-socials');
              else if (isEditor) navigate('/editor-specialization');
              else if (isBrand) navigate('/brand-details');
              else navigate('/role-selection');
            }}
            className="group relative h-9 sm:h-10 pl-1.5 pr-3 sm:pr-4 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200/80 text-zinc-600 hover:text-zinc-900 text-[10px] sm:text-xs font-bold shadow-sm transition-all duration-300 flex items-center gap-2 active:scale-95 cursor-pointer overflow-hidden inline-flex"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-100 group-hover:bg-white shadow-inner flex items-center justify-center border border-zinc-200/50 group-hover:shadow-sm transition-all duration-300">
                <ArrowLeft size={14} strokeWidth={2.5} className="text-zinc-500 group-hover:text-zinc-900 group-hover:-translate-x-0.5 transition-transform duration-300" />
              </div>
              <span className="tracking-wide uppercase sm:normal-case font-black sm:font-bold">Back</span>
            </div>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT: 2-COLUMN DESKTOP SPLIT ───────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 pt-2 sm:pt-4 pb-28 relative z-10">
        {/* Mobile Header */}
        <div className="lg:hidden mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-semibold uppercase tracking-wider mb-2">
            Final Step
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            Finalize Your Profile
          </h1>
          <p className="text-zinc-600 text-xs sm:text-sm font-medium mt-1">
            Review your verified credentials and setup your handle.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* ── LEFT COLUMN: STICKY OVERVIEW & SUMMARY (5 Cols) ───────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="lg:col-span-5 flex flex-col gap-5 sticky top-8"
          >
            {/* Desktop Headline */}
            <div className="hidden lg:block space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold uppercase tracking-wider">
                Final Step
              </span>
              <h1 className="text-3xl lg:text-4xl font-black text-zinc-950 tracking-tight leading-tight">
                Finalize Your Profile
              </h1>
              <p className="text-zinc-600 text-sm font-medium leading-relaxed">
                Almost there! Review your linked accounts, verified credentials, and finalize your identity on SuviX.
              </p>
            </div>

            {/* Google Identity Card */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 font-bold shrink-0">
                {socialProfile.name ? socialProfile.name.charAt(0).toUpperCase() : <User size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-950 font-bold text-sm truncate">{socialProfile.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Mail size={11} className="text-zinc-400 shrink-0" />
                  <p className="text-zinc-500 text-xs font-medium truncate">{socialProfile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 shrink-0">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Verified</span>
              </div>
            </div>

            {/* Role & Details Summary Card */}
            {selectedCategory && (
              <div className="rounded-2xl border border-zinc-200/90 bg-white overflow-hidden shadow-sm">
                {/* Role Row */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                      <Briefcase size={14} className="text-zinc-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Selected Role</p>
                      <p className="text-zinc-950 text-sm font-bold truncate">{selectedCategory.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const isEditor = selectedCategory.slug === 'editor' || selectedCategory.slug === 'video_editor';
                      const isCreator = selectedCategory.slug === 'creator' || selectedCategory.slug === 'yt_influencer';
                      const isBrand = selectedCategory.slug === 'brand' || selectedCategory.slug === 'social_promoter';
                      if (isCreator) navigate('/connect-socials');
                      else if (isEditor) navigate('/editor-specialization');
                      else if (isBrand) navigate('/brand-details');
                      else navigate('/role-selection');
                    }}
                    className="text-[11px] font-bold text-zinc-600 hover:text-zinc-950 px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-all cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Company Details */}
                {tempSignupData?.companyName && (
                  <div className="p-4 border-b border-zinc-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 size={14} className="text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Company</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-950">{tempSignupData.companyName}</span>
                        {tempSignupData.industry && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[10px] font-semibold text-blue-700">
                            {tempSignupData.industry}
                          </span>
                        )}
                        {tempSignupData.companySize && (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-[10px] text-zinc-600">
                            {tempSignupData.companySize}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Specializations */}
                {((tempSignupData?.specializations && tempSignupData.specializations.length > 0) || selectedSubCategories.length > 0) && (
                  <div className="p-4 border-b border-zinc-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Tag size={14} className="text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Specializations</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(tempSignupData?.specializations ?? selectedSubCategories.map(s => s.name)).map(name => (
                          <span
                            key={name}
                            className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[10px] font-bold text-purple-700"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Software / Tools */}
                {tempSignupData?.softwareUsed && tempSignupData.softwareUsed.length > 0 && (
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Briefcase size={14} className="text-zinc-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Software &amp; Tools</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tempSignupData.softwareUsed.map(name => (
                          <span
                            key={name}
                            className="px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-semibold text-zinc-700"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* YouTube Channels Preview */}
            {hasYouTubeChannels && (
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm space-y-2.5">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Linked Channel</p>
                {youtubeChannels!.map((ch) => (
                  <div
                    key={ch.channelId as string}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50/70"
                  >
                    {ch.thumbnailUrl && (
                      <img src={ch.thumbnailUrl as string} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-zinc-200 shadow-2xs" />
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-zinc-950 text-xs font-bold truncate">{ch.channelName as string}</p>
                      <p className="text-zinc-500 text-[10px] font-medium">
                        {Number(ch.subscriberCount || 0).toLocaleString()} subscribers
                      </p>
                    </div>
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── RIGHT COLUMN: INTERACTIVE FORM (7 Cols) ────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            className="lg:col-span-7 w-full flex flex-col gap-6"
          >
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              
              {/* Profile Picture Upload Section */}
              <div className="flex items-center gap-4 pb-6 border-b border-zinc-100">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shadow-sm">
                    {profilePicturePreview ? (
                      <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-zinc-400" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center cursor-pointer shadow-md transition-transform active:scale-90">
                    <Camera size={13} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-950 tracking-tight">Profile Photo</p>
                  {profilePicture ? (
                    <button
                      type="button"
                      onClick={handleRemoveCustomPicture}
                      className="text-[11px] text-red-600 font-bold hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                    >
                      <X size={11} /> Revert to Google avatar
                    </button>
                  ) : (
                    <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Google avatar synced. Upload a new photo to change.</p>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
                  {error}
                </div>
              )}

              {/* The Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-800 tracking-wide uppercase flex items-center justify-between">
                    <span>Full Name</span>
                    <span className="text-[10px] font-semibold text-zinc-400">Synced from Google</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      name="fullName"
                      placeholder="Your full name"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      className="w-full h-11 sm:h-12 pl-10 pr-4 bg-zinc-50/70 border border-zinc-200 rounded-xl text-zinc-950 text-sm font-semibold placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-800 tracking-wide uppercase flex items-center justify-between">
                    <span>Choose a Handle</span>
                    <span className="text-[10px] font-semibold text-zinc-400 lowercase">@handle</span>
                  </label>
                  <div className="relative">
                    <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      name="username"
                      placeholder="your_handle"
                      value={form.username}
                      onChange={handleChange}
                      onBlur={handleUsernameBlur}
                      required
                      autoComplete="username"
                      className={`w-full h-11 sm:h-12 pl-10 pr-16 bg-zinc-50/70 border rounded-xl text-zinc-950 text-sm font-semibold placeholder:text-zinc-400 focus:bg-white focus:outline-none transition-all shadow-2xs ${
                        userStatus === 'available' ? 'border-emerald-500 ring-2 ring-emerald-500/10' :
                        userStatus === 'taken'     ? 'border-red-500 ring-2 ring-red-500/10' :
                                                    'border-zinc-200 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5'
                      }`}
                    />
                    {userStatus !== 'idle' && (
                      <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-black uppercase tracking-wider ${
                        userStatus === 'checking'  ? 'text-zinc-400' :
                        userStatus === 'available' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {userStatus === 'checking' ? 'Checking...' : userStatus === 'available' ? '✓ Free' : '✗ Taken'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-800 tracking-wide uppercase">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+91 99999 99999"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className="w-full h-11 sm:h-12 pl-10 pr-4 bg-zinc-50/70 border border-zinc-200 rounded-xl text-zinc-950 text-sm font-semibold placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Language & Country Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Language */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-zinc-800 tracking-wide uppercase">
                      Primary Language
                    </label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <select
                        name="motherTongue"
                        value={form.motherTongue}
                        onChange={handleChange}
                        className="w-full h-11 sm:h-12 pl-10 pr-8 bg-zinc-50/70 border border-zinc-200 rounded-xl text-zinc-950 text-sm font-semibold focus:bg-white focus:outline-none focus:border-zinc-950 transition-all cursor-pointer appearance-none shadow-2xs"
                      >
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400">
                        <Globe size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Country */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-zinc-800 tracking-wide uppercase">
                      Country
                    </label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <select
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        className="w-full h-11 sm:h-12 pl-10 pr-8 bg-zinc-50/70 border border-zinc-200 rounded-xl text-zinc-950 text-sm font-semibold focus:bg-white focus:outline-none focus:border-zinc-950 transition-all cursor-pointer appearance-none shadow-2xs"
                      >
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400">
                        <Globe size={13} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Note */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-left">
                  <Shield size={15} className="text-zinc-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                    Your account is secured via Google OAuth. No password is required.
                  </p>
                </div>

                {/* Turnstile Security Widget */}
                <div className="flex justify-center pt-2">
                  <Turnstile
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}
                    onSuccess={(token) => setTurnstileToken(token)}
                    onError={() => setError('Security check failed. Please refresh and try again.')}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || userStatus === 'taken' || !turnstileToken}
                  className="w-full h-12 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer mt-2"
                >
                  {isLoading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <><span>Complete Profile &amp; Continue</span><ArrowRight size={16} strokeWidth={2.5} /></>
                  }
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
