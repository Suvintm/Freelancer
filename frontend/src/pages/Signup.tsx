import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight,
  Eye,
  EyeOff,
  Phone,
  Globe,
  AtSign,
  Loader2,
  Youtube,
  CheckCircle2,
  Camera,
  Bell,
  Check,
  ChevronLeft
} from 'lucide-react';
import logo from '../assets/lightlogo.png';
import { AuthBackground } from '../components/auth/AuthBackground';
import { Turnstile } from '@marsidev/react-turnstile';
import { useDispatch, useSelector } from 'react-redux';
import { setTempSignupData, clearTempSignupData } from '../store/slices/onboardingSlice';
import { useSignup } from '../mutations/useSignup';
import type { RootState } from '../store';
import { authService } from '../api/services/auth.service';
import { OnboardingSyncOverlay } from '../components/onboarding/OnboardingSyncOverlay';
import { isAccessAllowed, RESTRICTED_ACCESS_MESSAGE } from '../config/accessControl.config';

const EASE = [0.16, 1, 0.3, 1] as const;
const LANGUAGES = ['English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi'];
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'United Arab Emirates', 'Saudi Arabia', 'Singapore'];

// ── Step progress indicator ───────────────────────────────────────────────────
// Shows user where they are in the registration flow
interface StepBarProps {
  categorySlug?: string;
}

function StepBar({ categorySlug }: StepBarProps) {
  const isCreator = categorySlug === 'creator' || categorySlug === 'yt_influencer';
  const isEditor = categorySlug === 'editor' || categorySlug === 'video_editor';

  const steps = isCreator
    ? ['Role', 'YouTube', 'Details']
    : isEditor
    ? ['Role', 'Specialization', 'Details']
    : ['Role', 'Details'];

  const activeIndex = steps.length - 1; // Always on last step (Details) in this page

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3 mb-1 lg:mb-3">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div
              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-black transition-all ${
                i < activeIndex
                  ? 'bg-emerald-500 text-white'
                  : i === activeIndex
                  ? 'bg-black text-white shadow-md'
                  : 'bg-zinc-200 text-zinc-500'
              }`}
            >
              {i < activeIndex ? <Check size={8} strokeWidth={3.5} /> : i + 1}
            </div>
            <span
              className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wider ${
                i === activeIndex ? 'text-black' : i < activeIndex ? 'text-emerald-500' : 'text-zinc-400'
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 sm:w-16 lg:w-20 h-px ${i < activeIndex ? 'bg-emerald-500/40' : 'bg-zinc-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

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
    country: 'India',
    website: tempSignupData?.companyWebsite || ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userStatus, setUserStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(socialProfile?.picture || null);
  const [enableNotifications, setEnableNotifications] = useState(false);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  const navigate = useNavigate();
  const isBrandClient = roleSlug === 'brand' || roleSlug === 'social_promoter' || tempSignupData?.categorySlug === 'brand';
  const isSocialUser = authMethod === 'google' && !!socialProfile;

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

  // Auto-validates username/handle while typing, debounced to 2000ms (2 seconds) to protect DB costs
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
        
        // Enforce a minimum display time of 400ms for the loading spinner to prevent instant flashes
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

  const isFormValid = Boolean(
    form.fullName.trim() &&
    form.username.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    (isSocialUser || form.password.trim()) &&
    (!isBrandClient || form.website.trim()) &&
    userStatus === 'available' &&
    turnstileToken
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side completeness check before hitting the backend
    if (!isAccessAllowed(form.email)) { setError(RESTRICTED_ACCESS_MESSAGE); return; }
    if (userStatus === 'taken') { setError('This username is already taken.'); return; }
    if (!form.username || form.username.length < 3) { setError('Username must be at least 3 characters.'); return; }

    if (!isSocialUser && !form.password) { setError('Password is required.'); return; }

    setIsLoading(true);
    setError(null);

    try {
      // Pre-validate email + username uniqueness before full registration
      await import('../api/client').then(({ api }) =>
        api.post('/auth/validate-signup', {
          email: form.email.trim().toLowerCase(),
          username: form.username.trim().toLowerCase(),
        })
      );

      // Build complete registration payload from tempSignupData + form data
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
    <div className="relative h-[100dvh] w-full bg-black flex flex-col overflow-hidden font-sans">
      {showSyncOverlay && <OnboardingSyncOverlay nextRoute="/home" />}
      
      {/* Full Screen Background */}
      <div className="absolute inset-0 z-0">
        <AuthBackground />
      </div>

      {/* Foreground Container */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row h-full w-full">
        
        {/* Top Left Global Back Button */}
        <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-50">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-white border border-gray-200 lg:border-black rounded-full text-black text-[11px] lg:text-sm font-bold transition-all shadow-md hover:scale-105"
          >
            <ChevronLeft size={14} className="lg:w-4 lg:h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Left Side (30% approx) - Spacer */}
        <div className="hidden lg:block lg:w-[40%] xl:w-[30%] h-full pointer-events-none"></div>

        {/* Right Side Form Container (70%) */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20 sm:p-6 lg:p-12 h-full lg:w-[60%] xl:w-[70%]">
          
          {/* Floating Rounded Form Card */}
          <div className="w-full max-w-[600px] bg-white rounded-3xl lg:rounded-[2rem] shadow-2xl flex flex-col relative shrink-0 max-h-full overflow-hidden mt-2 lg:mt-0">
            
            {/* Fixed Header Container */}
            <div className="w-full shrink-0 px-5 pt-5 pb-1 z-10 bg-white">
              
              {/* Unified Header */}
              <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="flex relative w-full flex-col items-center pb-3 border-b border-zinc-100 mb-2 shrink-0 space-y-2 lg:space-y-0"
              >
                <img src={logo} alt="SuviX" className="lg:absolute lg:left-0 lg:top-1.5 h-6 lg:h-8 shrink-0" />
                <div className="text-center space-y-0.5">
                  <h1 className="text-xl lg:text-2xl font-bold text-black leading-[1.1] tracking-tight">
                    Create your account.
                  </h1>
                  <p className="text-zinc-500 text-[10px] lg:text-xs font-medium">
                    As <span className="text-black font-bold">{roleName}</span> — enter your details.
                  </p>
                </div>
              </motion.header>
            </div>

            {/* Content Area (Animation Wrapper) */}
            <motion.form 
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 24 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, ease: EASE, delay: 0.1 }} 
              className="w-full flex-1 flex flex-col min-h-0"
            >
              
              {/* Fixed Step Bar Container */}
              <div className="w-full px-5 shrink-0 bg-white z-10">
                <StepBar categorySlug={tempSignupData?.categorySlug} />
              </div>

              {/* Scrollable Form Content */}
              <ReactLenis className="w-full flex-1 overflow-y-auto custom-scrollbar px-5 lg:px-8 pb-8 lg:pb-12">
                <div className="space-y-3.5 mt-1 lg:mt-4">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-semibold">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3.5">
                {/* Profile Picture Upload */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center overflow-hidden">
                      {profilePicturePreview ? (
                        <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-zinc-400" />
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-black flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition-transform">
                      <Camera size={14} className="text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-black tracking-tight">
                      {isBrandClient ? "Brand Logo" : "Profile Picture"}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Recommended: Square, under 5MB</p>
                  </div>
                </div>

                {/* Name + Handle */}
                <div className="grid grid-cols-2 gap-4">
                  <InputField 
                    label={isBrandClient ? "Company / Brand Name" : "Full Name"} 
                    name="fullName" 
                    placeholder={isBrandClient ? "e.g. Nike" : "John Doe"} 
                    icon={<User size={16} />} 
                    value={form.fullName} 
                    onChange={handleChange} 
                    required 
                  />

                  <div className="space-y-1">
                    <label className="font-label text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                      {isBrandClient ? "Brand Handle" : "Handle"}
                    </label>
                    <div className="relative">
                      <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        name="username"
                        placeholder={isBrandClient ? "brandhandle" : "handle"}
                        value={form.username}
                        onChange={handleChange}
                        required
                        className={`suvix-input !h-10 !pl-11 pr-12 !text-[13px] bg-white !border-2 text-black transition-all placeholder:text-zinc-400 ${
                          userStatus === 'available' ? '!border-green-500' :
                          userStatus === 'taken'     ? '!border-red-500'   : '!border-black'
                        }`}
                      />
                      {userStatus !== 'idle' && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                          {userStatus === 'checking' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                          ) : (
                            <span className={`text-[10px] font-black tracking-wide uppercase ${
                              userStatus === 'available' ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {userStatus === 'available' ? '✓ free' : '✗ taken'}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <InputField 
                    label={isBrandClient ? "Work Email Address" : "Email Address"} 
                    name="email" 
                    type="email" 
                    placeholder={isBrandClient ? "partnerships@company.com" : "name@example.com"} 
                    icon={<Mail size={16} />} 
                    value={form.email} 
                    onChange={handleChange} 
                    required 
                    helperText={socialProfile?.email ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <Check size={11} strokeWidth={3} /> Auto-filled
                      </span>
                    ) : undefined}
                  />
                  {socialProfile?.email && (
                    <p className="mt-1 text-[10px] text-zinc-400 font-medium pl-1 flex items-center gap-1">
                      <span>💡 Pre-filled from Google. You can change this to your preferred business email.</span>
                    </p>
                  )}
                </div>

                {/* Phone + Language/Website */}
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Phone" name="phone" placeholder="+91..." icon={<Phone size={16} />} value={form.phone} onChange={handleChange} required />

                  {isBrandClient ? (
                    <InputField 
                      label="Website / URL" 
                      name="website" 
                      placeholder="https://company.com" 
                      icon={<Globe size={16} />} 
                      value={form.website} 
                      onChange={handleChange} 
                      required 
                    />
                  ) : (
                    <div className="space-y-1">
                      <label className="font-label text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Language</label>
                      <div className="relative">
                        <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <select
                          name="motherTongue"
                          value={form.motherTongue}
                          onChange={handleChange}
                          className="suvix-input !h-10 !pl-11 pr-4 !text-[13px] bg-white !border-2 !border-black text-black transition-all placeholder:text-zinc-400 appearance-none"
                        >
                          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <label className="font-label text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Country</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <select
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      className="suvix-input !h-10 !pl-11 pr-4 !text-[13px] bg-white !border-2 !border-black text-black transition-all placeholder:text-zinc-400 appearance-none"
                    >
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* YouTube Channel Preview (yt_influencer only) */}
                {selectedChannels.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase ml-1">Linked Identity</h3>
                    <div className="space-y-2">
                      {selectedChannels.map((ch) => (
                        <div key={ch?.channelId} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-zinc-50 backdrop-blur-sm">
                          {ch?.thumbnailUrl && (
                            <img src={ch.thumbnailUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-white" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-black truncate">{ch?.channelName}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Youtube size={12} className="text-[#FF0000]" />
                              <span className="text-[11px] font-semibold text-zinc-400">
                                {Number(ch?.subscriberCount || 0).toLocaleString()} subscribers
                                {ch?.subCategorySlug && ` • ${ch.subCategorySlug.replace(/_/g, ' ')}`}
                              </span>
                            </div>
                          </div>
                          <CheckCircle2 size={18} className="text-[#00C853] shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Password (email signup only) / Security note (Google signup) */}
                {!isSocialUser ? (
                  <div className="space-y-1">
                    <label className="font-label text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        name="password"
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        required={!isSocialUser}
                        className="suvix-input !h-10 !pl-11 pr-12 !text-[13px] bg-white !border-2 !border-black text-black transition-all placeholder:text-zinc-400"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Lock size={16} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-black uppercase tracking-wider">Secured via Google</p>
                      <p className="text-[11px] text-zinc-500 font-medium">No password needed — Google handles your login.</p>
                    </div>
                  </div>
                )}

                {/* Notifications Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 bg-zinc-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center">
                      <Bell size={16} className="text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black">Enable Notifications</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Get updates on your creator journey</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setEnableNotifications(!enableNotifications)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${enableNotifications ? 'bg-green-500' : 'bg-zinc-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute transition-transform shadow-sm ${enableNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                </div>
              </div>
            </ReactLenis>
              {/* Fixed Bottom Action Area */}
              <div className="w-full shrink-0 bg-white border-t border-zinc-100 px-6 lg:px-10 py-3 lg:py-5 mt-auto">
                <div className="flex justify-center mb-2.5 scale-85 sm:scale-100 origin-center my-0.5">
                  <Turnstile
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}
                    onSuccess={(token) => setTurnstileToken(token)}
                    onError={() => setError('Security check failed. Please refresh and try again.')}
                  />
                </div>
                {/* Submit */}
                <button 
                  type="submit" 
                  disabled={isLoading || !isFormValid} 
                  className={`suvix-btn-primary w-full h-9 lg:h-10 !text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98] !text-[11px] lg:!text-[13px] ${
                    isFormValid 
                      ? '!bg-black hover:opacity-90 shadow-black/10' 
                      : '!bg-zinc-200 shadow-none cursor-not-allowed !text-zinc-400'
                  }`}
                >
                  {isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><span>Create Account</span><ArrowRight size={14} strokeWidth={2.5} /></>
                  }
                </button>

                <p className="mt-4 text-center text-[13px] text-zinc-500 font-medium">
                  Already a member?{' '}
                  <Link to="/login" className="font-bold text-black hover:opacity-70 transition-opacity">Sign In</Link>
                </p>
              </div>
            </motion.form> {/* Closes Content Area Animation Wrapper */}
        </div> {/* Closes Floating Card */}
          
        {/* Legal Footer (Laptop only, sits below the floating card) */}
        <div className="hidden lg:block mt-8 text-center text-[11px] text-zinc-400/80 font-bold backdrop-blur-sm px-4 py-1 rounded-full">
          © 2026 SuviX Inc. All rights reserved.
        </div>
        
        {/* Legal Footer (Mobile) */}
        <div className="lg:hidden mt-auto pt-8 pb-4 text-center text-[11px] text-zinc-400 font-bold">
          © 2026 SuviX Inc. All rights reserved.
        </div>

      </div>
    </div>
  </div>
);
}

// ── Shared Input Field Component ──────────────────────────────────────────────
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
  helperText?: React.ReactNode;
}

function InputField({ label, icon, helperText, ...props }: InputFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="font-label text-[10px] font-bold tracking-wider text-zinc-500 uppercase">{label}</label>
        {helperText}
      </div>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">{icon}</span>
        <input
          {...props}
          className={`suvix-input !h-10 !pl-11 pr-4 !text-[13px] bg-white !border-2 !border-black text-black transition-all placeholder:text-zinc-400 ${props.className ?? ''}`}
        />
      </div>
    </div>
  );
}