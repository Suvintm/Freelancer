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
import logo from '../assets/blackbglogo.png';
import { AuthBackground } from '../components/auth/AuthBackground';
import { useDispatch, useSelector } from 'react-redux';
import { clearTempSignupData } from '../store/slices/onboardingSlice';
import { useSignup } from '../mutations/useSignup';
import type { RootState } from '../store';
import { authService } from '../api/services/auth.service';
import { OnboardingSyncOverlay } from '../components/onboarding/OnboardingSyncOverlay';

const EASE = [0.16, 1, 0.3, 1] as const;
const LANGUAGES = ['English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi'];
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'United Arab Emirates', 'Saudi Arabia', 'Singapore'];

// ── Step progress indicator ───────────────────────────────────────────────────
// Shows user where they are in the registration flow
interface StepBarProps {
  categorySlug?: string;
}

function StepBar({ categorySlug }: StepBarProps) {
  // Steps vary by role
  const steps =
    categorySlug === 'direct_client'
      ? ['Role', 'Details']
      : categorySlug === 'yt_influencer'
      ? ['Role', 'YouTube', 'Details']
      : ['Role', 'Niches', 'Details'];

  const activeIndex = steps.length - 1; // Always on last step (Details) in this page

  return (
    <div className="flex items-center justify-center gap-3 mb-2">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                i < activeIndex
                  ? 'bg-emerald-500 text-white'
                  : i === activeIndex
                  ? 'bg-black text-white shadow-md'
                  : 'bg-zinc-200 text-zinc-500'
              }`}
            >
              {i < activeIndex ? <Check size={10} strokeWidth={3} /> : i + 1}
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                i === activeIndex ? 'text-black' : i < activeIndex ? 'text-emerald-500' : 'text-zinc-400'
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-10 sm:w-16 lg:w-20 h-px ${i < activeIndex ? 'bg-emerald-500/40' : 'bg-zinc-200'}`} />
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
  const tempSignupData = useSelector((state: RootState) => state.onboarding.tempSignupData);
  const socialProfile = tempSignupData?.socialProfile as Record<string, string> | undefined;

  const [form, setForm] = useState({
    fullName: socialProfile?.name || '',
    username: '',
    email: socialProfile?.email || '',
    phone: '',
    password: '',
    motherTongue: 'English',
    country: 'India',
    website: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userStatus, setUserStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(socialProfile?.picture || null);
  const [enableNotifications, setEnableNotifications] = useState(false);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);

  const navigate = useNavigate();
  const isBrandClient = tempSignupData?.roleGroup === 'CLIENT' && tempSignupData?.categorySlug !== 'direct_client';

  // 🔐 PRODUCTION GUARD: Signup requires a role to have been selected first.
  // If tempSignupData has no categoryId, the user navigated here without going
  // through role selection — redirect them back.
  useEffect(() => {
    if (!tempSignupData?.categoryId) {
      navigate('/role-selection', { replace: true });
    }
  }, [tempSignupData?.categoryId, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔐 PRODUCTION FIX: Use the REAL checkUsername API, not a mock timer.
  const handleUsernameBlur = async () => {
    if (!form.username || form.username.length < 3) return;
    setUserStatus('checking');
    try {
      const available = await authService.checkUsername(form.username.trim().toLowerCase());
      setUserStatus(available ? 'available' : 'taken');
    } catch {
      setUserStatus('idle');
    }
  };

  const selectedChannels = tempSignupData?.youtubeChannels ?? [];

  const isFormValid = Boolean(
    form.fullName.trim() &&
    form.username.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    (socialProfile || form.password.trim()) &&
    (!isBrandClient || form.website.trim()) &&
    userStatus === 'available'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side completeness check before hitting the backend
    if (userStatus === 'taken') { setError('This username is already taken.'); return; }
    if (!form.username || form.username.length < 3) { setError('Username must be at least 3 characters.'); return; }

    // SECURITY RESTRICTION: Block unauthorized emails during DEV phase
    const allowedEmails = ['suvintm19@gmail.com', 'suvintm19@gamil.com', 'suvintm1515@gmail.com','suvineditography@gmail.com', 'uber@company.com'];
    if (!allowedEmails.includes(form.email.toLowerCase().trim())) {
      setError('Server busy ! Please try again later or contact SuviX team.');
      return;
    }

    if (!socialProfile && !form.password) { setError('Password is required.'); return; }

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
        categoryId: tempSignupData?.categoryId,
        roleSubCategoryIds: tempSignupData?.roleSubCategoryIds,
        youtubeChannels: selectedChannels,
        googleId: socialProfile?.googleId,
        authProvider: socialProfile ? 'google' : 'local',
        profilePicture,
        pushToken: enableNotifications ? 'web_push_token_placeholder' : undefined
      });

      // Show blocking overlay if foreground sync is requested
      if (response?.ytSyncMode === 'foreground' && selectedChannels.length > 0) {
        setShowSyncOverlay(true);
      } else {
        // Clear ALL onboarding state after successful registration
        dispatch(clearTempSignupData());
        navigate('/home');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Determine back navigation based on role
  const handleBack = () => {
    const slug = tempSignupData?.categorySlug;
    if (slug === 'direct_client') navigate('/role-selection');
    else if (slug === 'yt_influencer') navigate('/youtube-connect');
    else navigate('/subcategory-selection');
  };

  return (
    <div className="relative h-screen w-full bg-white lg:bg-black flex flex-col overflow-hidden font-sans">
      {showSyncOverlay && <OnboardingSyncOverlay />}
      
      {/* Full Screen Background (Laptop only) */}
      <div className="hidden lg:block absolute inset-0 z-0">
        <AuthBackground />
      </div>

      {/* Foreground Container */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row h-full w-full">
        
        {/* Top Left Global Back Button */}
        <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-50">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white text-xs lg:text-sm font-bold transition-all border border-white/10 shadow-2xl"
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
        </div>

        {/* Left Side (30% approx) - Invisible, just lets the AuthBackground text show through */}
        <div className="hidden lg:block lg:w-[40%] xl:w-[30%] h-full pointer-events-none"></div>

        {/* Right Side Form Container (70%) */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 h-full lg:w-[60%] xl:w-[70%]">
          
          {/* Floating Rounded Form Card (Laptop) / Flat (Mobile) */}
          <div className="w-full max-w-[600px] bg-white lg:rounded-[2rem] lg:shadow-2xl flex flex-col relative shrink-0 max-h-full overflow-hidden">
            
            {/* Fixed Header Container */}
            <div className="w-full shrink-0 px-4 pt-4 lg:px-5 lg:pt-5 z-10 bg-white">
              
              {/* Desktop Header */}
              <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="hidden lg:flex w-full flex-col pb-2 border-b border-zinc-100 mb-4 shrink-0"
              >
                {/* Logo Top Left */}
                <img src={logo} alt="SuviX" className="h-20 self-start mb-0" />
                
                {/* Title Centered */}
                <div className="text-center space-y-0.5 w-full -mt-6">
                  <h1 className="text-xl lg:text-2xl font-bold text-black leading-[1.1] tracking-tight">
                    Create your account.
                  </h1>
                  <p className="text-zinc-500 text-[13px] font-medium">
                    As <span className="text-black font-bold">{tempSignupData?.roleName || 'Creator'}</span> — enter your details.
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
              
              {/* Fixed Step Bar / Mobile Title */}
              <div className="w-full px-4 lg:px-5 shrink-0 bg-white z-10">
                <StepBar categorySlug={tempSignupData?.categorySlug} />

                {/* Mobile Title */}
                <div className="lg:hidden text-center mt-2">
                  <h1 className="text-2xl font-bold text-black tracking-tight leading-tight">
                    Create your account.
                  </h1>
                  <p className="text-zinc-500 text-sm font-medium mt-1">
                    As <span className="text-black font-bold">{tempSignupData?.roleName || 'Creator'}</span>
                  </p>
                </div>
              </div>

              {/* Scrollable Form Content */}
              <ReactLenis className="w-full flex-1 overflow-y-auto custom-scrollbar px-6 lg:px-10 pb-12 lg:pb-16">
                <div className="space-y-6 mt-4 lg:mt-6">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-semibold">
                      {error}
                    </div>
                  )}

              <div className="space-y-6">
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

                  <div className="space-y-1.5">
                    <label className="font-label text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                      {isBrandClient ? "Brand Handle" : "Handle"}
                    </label>
                    <div className="relative">
                      <AtSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        name="username"
                        placeholder={isBrandClient ? "brandhandle" : "handle"}
                        value={form.username}
                        onChange={handleChange}
                        onBlur={handleUsernameBlur}
                        required
                        className={`suvix-input !pl-12 pr-4 bg-white border-2 border-black text-black placeholder:text-zinc-400 ${
                          userStatus === 'available' ? '!border-green-500' :
                          userStatus === 'taken'     ? '!border-red-500'   : ''
                        }`}
                      />
                      {userStatus !== 'idle' && (
                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold ${
                          userStatus === 'available' ? 'text-green-500' :
                          userStatus === 'taken'     ? 'text-red-500'   :
                          'text-zinc-400'
                        }`}>
                          {userStatus === 'checking' ? '...' : userStatus === 'available' ? '✓ free' : '✗ taken'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <InputField 
                  label={isBrandClient ? "Work Email Address" : "Email Address"} 
                  name="email" 
                  type="email" 
                  placeholder={isBrandClient ? "partnerships@company.com" : "name@example.com"} 
                  icon={<Mail size={16} />} 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                />

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
                    <div className="space-y-1.5">
                      <label className="font-label text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Language</label>
                      <div className="relative">
                        <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <select
                          name="motherTongue"
                          value={form.motherTongue}
                          onChange={handleChange}
                          className="suvix-input !pl-12 bg-white border-2 border-black text-black placeholder:text-zinc-400 appearance-none"
                        >
                          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="font-label text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Country</label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <select
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      className="suvix-input !pl-12 bg-white border-2 border-black text-black placeholder:text-zinc-400 appearance-none"
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
                {!socialProfile ? (
                  <div className="space-y-1.5">
                    <label className="font-label text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        name="password"
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        required={!socialProfile}
                        className="suvix-input !pl-12 pr-12 bg-white border-2 border-black text-black placeholder:text-zinc-400"
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
              <div className="w-full shrink-0 bg-white border-t border-zinc-100 px-6 lg:px-10 py-4 lg:py-6 mt-auto">
                {/* Submit */}
                <button 
                  type="submit" 
                  disabled={isLoading || !isFormValid} 
                  className={`suvix-btn-primary w-full h-12 !text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98] ${
                    isFormValid ? '!bg-black hover:opacity-90 shadow-black/10' : '!bg-zinc-900 shadow-none cursor-not-allowed text-zinc-500'
                  }`}
                >
                  {isLoading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <><span>Create Account</span><ArrowRight size={18} strokeWidth={2.5} /></>
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
}

function InputField({ label, icon, ...props }: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="font-label text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">{icon}</span>
        <input
          {...props}
          className={`suvix-input !pl-12 bg-white border-2 border-black text-black placeholder:text-zinc-400 ${props.className ?? ''}`}
        />
      </div>
    </div>
  );
}