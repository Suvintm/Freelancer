import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Camera,
  X,
} from 'lucide-react';
import logo from '../../assets/lightlogo.png';
import { useDispatch, useSelector } from 'react-redux';
import { setAuth } from '../../store/slices/authSlice';
import type { RootState } from '../../store';
import { clearTempSignupData } from '../../store/slices/onboardingSlice';
import { useCategories } from '../../queries/useCategories';
import { authService } from '../../api/services/auth.service';
import { api } from '../../api/client';
import { OnboardingSyncOverlay } from '../../components/onboarding/OnboardingSyncOverlay';
import { Turnstile } from '@marsidev/react-turnstile';
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
        const hasInstagram = (tempSignupData?.instagramAccounts?.length ?? 0) > 0 || (res.data.user?.instagramAccounts?.length ?? 0) > 0;

        const targetRoute = isBrand ? '/home' : '/onboarding/preferences';

        // Check sync mode for creators with connected channels or accounts
        if (isCreator && (hasChannels || hasInstagram)) {
          const syncMode = res.data.syncMode || res.data.ytSyncMode || res.data.instaSyncMode || 'foreground';
          if (syncMode === 'background') {
            // Trigger sync in background, do not block with overlay
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
            // Foreground sync: show full-screen overlay with live progress
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
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 pt-2 sm:pt-4 pb-36 relative z-10">
        
        {/* Mobile Header */}
        <div className="lg:hidden mb-5 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-semibold uppercase tracking-wider mb-2">
            Final Step
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
            Finalize Your Profile
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-md mx-auto">
            Review your verified credentials and setup your handle to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ╔════════════════════════════════════════════════════════════════╗
              ║  LEFT COLUMN: Live Profile Preview & Verified Data (lg:5)      ║
              ╚════════════════════════════════════════════════════════════════╝ */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-24">
            
            {/* Desktop Section Header */}
            <div className="hidden lg:block">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-2.5">
                Final Step
              </span>
              <h1 className="text-3xl font-bold text-zinc-950 tracking-tight leading-tight">
                Finalize Your Profile
              </h1>
              <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
                Almost there! Review your linked credentials, choose your handle, and customize your profile to start connecting.
              </p>
            </div>

            {/* ── LIVE IDENTITY PREVIEW CARD ─────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-5 shadow-xs">
              {/* Header with Avatar & Name */}
              <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {profilePicturePreview ? (
                      <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-zinc-700" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-zinc-950 truncate">
                      {form.fullName || socialProfile.name || 'User Identity'}
                    </h2>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {form.username ? `@${form.username}` : socialProfile.email}
                    </p>
                  </div>
                </div>

                {/* Google Verified Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 shrink-0">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Verified</span>
                </div>
              </div>

              {/* Data Specifications Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/60 text-xs mb-3.5">
                <div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Selected Role
                  </span>
                  <span className="font-semibold text-zinc-900 block mt-0.5 truncate">
                    {selectedCategory?.name || 'Standard Account'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Security
                  </span>
                  <span className="font-semibold text-zinc-900 block mt-0.5 truncate">
                    Google OAuth 2.0
                  </span>
                </div>
              </div>

              {/* Role Details / Specializations Tag Preview */}
              {((tempSignupData?.specializations && tempSignupData.specializations.length > 0) || selectedSubCategories.length > 0) && (
                <div className="mb-3.5">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Specializations
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(tempSignupData?.specializations ?? selectedSubCategories.map(s => s.name)).map(name => (
                      <span
                        key={name}
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 text-xs font-medium border border-zinc-200/70"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Software Tools Tag Preview */}
              {tempSignupData?.softwareUsed && tempSignupData.softwareUsed.length > 0 && (
                <div className="mb-3.5">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Software &amp; Tools
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tempSignupData.softwareUsed.map(name => (
                      <span
                        key={name}
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 text-xs font-medium border border-zinc-200/70"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube Channel Preview */}
              {hasYouTubeChannels && (
                <div className="pt-3 border-t border-zinc-100 space-y-2">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Linked YouTube Channel
                  </span>
                  {youtubeChannels!.map((ch) => (
                    <div
                      key={ch.channelId as string}
                      className="p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/60 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {ch.thumbnailUrl ? (
                          <img src={ch.thumbnailUrl as string} alt="" className="w-8 h-8 rounded-full object-cover border border-zinc-200 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold shrink-0">YT</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 truncate">{ch.channelName as string}</p>
                          <p className="text-[10px] text-zinc-500">
                            {Number(ch.subscriberCount || 0).toLocaleString()} subscribers
                          </p>
                        </div>
                      </div>
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ╔════════════════════════════════════════════════════════════════╗
              ║  RIGHT COLUMN: Interactive Setup Form Sections (lg:7)          ║
              ╚════════════════════════════════════════════════════════════════╝ */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            
            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* ── SECTION 1: PROFILE PHOTO & PUBLIC IDENTITY ────────────── */}
              <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-800" />
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
                      1. Profile Identity
                    </h2>
                  </div>
                  <span className="text-[11px] text-zinc-400">Public details</span>
                </div>

                {/* Profile Photo Row */}
                <div className="flex items-center gap-4 py-1">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shadow-2xs">
                      {profilePicturePreview ? (
                        <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-zinc-400" />
                      )}
                    </div>
                    <label className="absolute -bottom-1.5 -right-1.5 w-6.5 h-6.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center cursor-pointer shadow-sm transition-transform active:scale-90">
                      <Camera size={12} />
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-zinc-900">Profile Photo</p>
                    {profilePicture ? (
                      <button
                        type="button"
                        onClick={handleRemoveCustomPicture}
                        className="text-[11px] text-red-600 font-semibold hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                      >
                        <X size={11} /> Revert to Google avatar
                      </button>
                    ) : (
                      <p className="text-[11px] text-zinc-500 mt-0.5">Google avatar synced. Upload to change.</p>
                    )}
                  </div>
                </div>

                {/* Full Name Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700">Full Name</label>
                    <span className="text-[11px] text-zinc-400">Synced from Google</span>
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Alex Rivera"
                      required
                      autoComplete="name"
                      className="w-full bg-white border border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Username Handle Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700">Choose Handle</label>
                    <span className="text-[11px] text-zinc-400 lowercase">@your_handle</span>
                  </div>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      onBlur={handleUsernameBlur}
                      placeholder="your_handle"
                      required
                      autoComplete="username"
                      className={`w-full bg-white border rounded-xl pl-10 pr-20 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all ${
                        userStatus === 'available' ? 'border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' :
                        userStatus === 'taken'     ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' :
                                                    'border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950'
                      }`}
                    />
                    {userStatus !== 'idle' && (
                      <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider ${
                        userStatus === 'checking'  ? 'text-zinc-400' :
                        userStatus === 'available' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {userStatus === 'checking' ? 'Checking...' : userStatus === 'available' ? '✓ Free' : '✗ Taken'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: CONTACT & REGIONAL SETTINGS ─────────────────── */}
              <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-zinc-800" />
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
                      2. Contact &amp; Region
                    </h2>
                  </div>
                  <span className="text-[11px] text-zinc-400">Communication preferences</span>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 99999 99999"
                      required
                      className="w-full bg-white border border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Language & Country Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Language */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700">Primary Language</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        name="motherTongue"
                        value={form.motherTongue}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-xl pl-10 pr-8 py-2.5 text-sm text-zinc-900 focus:outline-none transition-all cursor-pointer appearance-none"
                      >
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400">
                        <Globe size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Country */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700">Country</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-xl pl-10 pr-8 py-2.5 text-sm text-zinc-900 focus:outline-none transition-all cursor-pointer appearance-none"
                      >
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400">
                        <Globe size={13} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 3: SECURITY VERIFICATION ───────────────────────── */}
              <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-6 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-100">
                  <Shield className="w-4 h-4 text-zinc-800" />
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
                    3. Security &amp; Confirmation
                  </h2>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/60">
                  <Shield size={14} className="text-zinc-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Your account is authenticated with Google OAuth. You can log in securely anytime with 1 click.
                  </p>
                </div>

                {/* Turnstile Widget */}
                <div className="flex justify-center pt-1">
                  <Turnstile
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}
                    onSuccess={(token) => setTurnstileToken(token)}
                    onError={() => setError('Security check failed. Please refresh and try again.')}
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading || userStatus === 'taken' || !turnstileToken}
                className={`!h-11 sm:!h-11.5 !px-6 sm:!px-8 !text-xs sm:!text-sm !font-semibold !tracking-wide flex items-center justify-center gap-2 rounded-xl transition-all w-full cursor-pointer ${
                  !isLoading && userStatus !== 'taken' && turnstileToken
                    ? '!bg-zinc-950 hover:!bg-zinc-800 !text-white shadow-xs active:scale-[0.98]'
                    : '!bg-zinc-100 !text-zinc-400 cursor-not-allowed border border-zinc-200'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Completing Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Profile &amp; Continue</span>
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

          </div>

        </div>
      </main>
    </div>
  );
}
