import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AtSign,
  Phone,
  Globe,
  Shield,
  ArrowRight,
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

  const [form, setForm] = useState({ username: '', phone: '', motherTongue: 'English', country: 'India' });
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
        formData.append('fullName', socialProfile!.name);
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
          fullName: socialProfile!.name,
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
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-4 py-12 font-sans relative overflow-hidden">
      {showSyncOverlay && <OnboardingSyncOverlay nextRoute="/onboarding/preferences" />}
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] bg-white/[0.03] blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="SuviX" className="h-9 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Finalize Your Profile</h1>
          <p className="text-zinc-500 text-sm font-medium">Almost there — just a couple more details.</p>
        </div>

        {/* ── Google Identity Card ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
          className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm mb-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{socialProfile.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Mail size={11} className="text-zinc-500 flex-shrink-0" />
              <p className="text-zinc-400 text-xs font-medium truncate">{socialProfile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 flex-shrink-0">
            <CheckCircle2 size={12} className="text-green-500" />
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Google Verified</span>
          </div>
        </motion.div>

        {/* ── Profile Picture Upload ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
          className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm mb-3"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
              {profilePicturePreview ? (
                <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-zinc-600" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition-transform">
              <Camera size={14} className="text-black" />
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white tracking-tight">Profile Picture</p>
            {profilePicture ? (
              <button
                type="button"
                onClick={handleRemoveCustomPicture}
                className="text-[10px] text-red-400 font-bold hover:text-red-300 flex items-center gap-1 mt-0.5 cursor-pointer"
              >
                <X size={10} /> Revert to Google avatar
              </button>
            ) : (
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Google avatar synced. Upload to change.</p>
            )}
          </div>
        </motion.div>

        {/* ── Role & Niche Summary Card ── */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.14 }}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden mb-3"
          >
            {/* Role row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/60">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <Briefcase size={13} className="text-zinc-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">Role</p>
                <p className="text-white text-sm font-bold truncate">{selectedCategory.name}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const isEditor = selectedCategory.slug === 'editor' || selectedCategory.slug === 'video_editor';
                  const isCreator = selectedCategory.slug === 'creator' || selectedCategory.slug === 'yt_influencer';
                  const isBrand = selectedCategory.slug === 'brand' || selectedCategory.slug === 'social_promoter';
                  if (isCreator) navigate('/youtube-niche');
                  else if (isEditor) navigate('/editor-specialization');
                  else if (isBrand) navigate('/brand-details');
                  else navigate('/role-selection');
                }}
                className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors px-2 py-1 rounded-md bg-white/5 border border-zinc-800"
              >
                Change
              </button>
            </div>

            {/* Brand Details row */}
            {tempSignupData?.companyName && (
              <div className="flex items-start gap-3 px-4 py-3.5 border-b border-zinc-800/40">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 size={13} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                    Company & Industry
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {tempSignupData.companyName}
                    </span>
                    {tempSignupData.industry && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-950/50 border border-blue-500/30 text-[11px] font-semibold text-blue-300">
                        {tempSignupData.industry}
                      </span>
                    )}
                    {tempSignupData.companySize && (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">
                        {tempSignupData.companySize}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Editor Specializations row */}
            {((tempSignupData?.specializations && tempSignupData.specializations.length > 0) || selectedSubCategories.length > 0) && (
              <div className="flex items-start gap-3 px-4 py-3.5 border-b border-zinc-800/40">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Tag size={13} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    Specializations
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(tempSignupData?.specializations ?? selectedSubCategories.map(s => s.name)).map(name => (
                      <span
                        key={name}
                        className="px-2.5 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-[11px] font-semibold text-purple-300"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Editor Software Tools row */}
            {tempSignupData?.softwareUsed && tempSignupData.softwareUsed.length > 0 && (
              <div className="flex items-start gap-3 px-4 py-3.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Briefcase size={13} className="text-zinc-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    Software & Tools
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tempSignupData.softwareUsed.map(name => (
                      <span
                        key={name}
                        className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-semibold text-zinc-300"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── YouTube Channels (YT Creator flow only) ── */}
        {hasYouTubeChannels && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.2 }}
            className="mb-3 space-y-2"
          >
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] px-1">Linked Channel</p>
            {youtubeChannels!.map((ch) => (
              <div
                key={ch.channelId as string}
                className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/40"
              >
                {ch.thumbnailUrl && (
                  <img src={ch.thumbnailUrl as string} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{ch.channelName as string}</p>
                  <p className="text-zinc-500 text-[10px] font-medium">
                    {Number(ch.subscriberCount || 0).toLocaleString()} subscribers
                    {Boolean((ch as unknown as Record<string, string>).subCategorySlug) && (
                      <span className="ml-2 text-zinc-600">
                        · {String((ch as unknown as Record<string, string>).subCategorySlug).replace(/_/g, ' ')}
                      </span>
                    )}
                  </p>
                </div>
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Error ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center"
          >
            {error}
          </motion.div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">Choose a Handle</label>
            <div className="relative">
              <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                name="username"
                placeholder="your_handle"
                value={form.username}
                onChange={handleChange}
                onBlur={handleUsernameBlur}
                required
                autoComplete="username"
                className={`w-full h-12 pl-10 pr-16 bg-zinc-900 border rounded-xl text-white text-sm font-medium placeholder:text-zinc-600 focus:outline-none transition-colors ${
                  userStatus === 'available' ? 'border-green-500/50 focus:border-green-500' :
                  userStatus === 'taken'     ? 'border-red-500/50 focus:border-red-500' :
                                              'border-zinc-800 focus:border-zinc-600'
                }`}
              />
              {userStatus !== 'idle' && (
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold ${
                  userStatus === 'checking'  ? 'text-zinc-500' :
                  userStatus === 'available' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {userStatus === 'checking' ? '...' : userStatus === 'available' ? '✓ free' : '✗ taken'}
                </span>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">Mobile Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                name="phone"
                type="tel"
                placeholder="+91 99999 99999"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full h-12 pl-10 pr-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm font-medium placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">Primary Language</label>
            <div className="relative">
              <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <select
                name="motherTongue"
                value={form.motherTongue}
                onChange={handleChange}
                className="w-full h-12 pl-10 pr-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-zinc-600 transition-colors appearance-none"
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">Country</label>
            <div className="relative">
              <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                className="w-full h-12 pl-10 pr-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-zinc-600 transition-colors appearance-none"
              >
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <Shield size={14} className="text-zinc-600 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-zinc-600 font-medium leading-relaxed">
              Your account is secured via Google. No password needed.
            </p>
          </div>

          {/* Turnstile Security Widget */}
          <div className="flex justify-center my-2">
            <Turnstile
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setError('Security check failed. Please refresh and try again.')}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || userStatus === 'taken' || !turnstileToken}
            className="w-full h-12 bg-white text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-white/10"
          >
            {isLoading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <><span>Create Account</span><ArrowRight size={18} strokeWidth={2.5} /></>
            }
          </button>
        </form>

        <p className="text-center text-[10px] text-zinc-600 font-medium mt-8">© 2026 SuviX Inc. All rights reserved.</p>
      </motion.div>
    </div>
  );
}
