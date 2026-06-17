import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import logo from '../assets/darklogo.png';
import { AuthBackground } from '../components/auth/AuthBackground';
import { useAuthStore } from '../store/useAuthStore';

const EASE = [0.16, 1, 0.3, 1] as const;
const LANGUAGES = ['English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi'];

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
    <div className="flex items-center gap-2 mb-8">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                i < activeIndex
                  ? 'bg-emerald-500 text-black'
                  : i === activeIndex
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-600'
              }`}
            >
              {i < activeIndex ? <Check size={10} strokeWidth={3} /> : i + 1}
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                i === activeIndex ? 'text-white' : i < activeIndex ? 'text-emerald-500' : 'text-zinc-600'
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px ${i < activeIndex ? 'bg-emerald-500/40' : 'bg-zinc-800'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main Signup Page ──────────────────────────────────────────────────────────
export default function Signup() {
  const [showPass, setShowPass] = useState(false);
  const { signup, tempSignupData, youtubeDiscovery, clearTempSignupData, checkUsername } = useAuthStore();
  const socialProfile = tempSignupData?.socialProfile as Record<string, string> | undefined;

  const [form, setForm] = useState({
    fullName: socialProfile?.name || '',
    username: '',
    email: socialProfile?.email || '',
    phone: '',
    password: '',
    motherTongue: 'English'
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userStatus, setUserStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(socialProfile?.picture || null);
  const [enableNotifications, setEnableNotifications] = useState(false);

  const navigate = useNavigate();

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
      const available = await checkUsername(form.username.trim().toLowerCase());
      setUserStatus(available ? 'available' : 'taken');
    } catch {
      setUserStatus('idle');
    }
  };

  const selectedChannels = youtubeDiscovery.selectedChannelIds.map(id => {
    const channel = youtubeDiscovery.channels.find(c => c.channelId === id);
    const categorization = youtubeDiscovery.categorizations[id];
    return { ...channel, subCategoryId: categorization };
  }).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side completeness check before hitting the backend
    if (userStatus === 'taken') { setError('This username is already taken.'); return; }
    if (!form.username || form.username.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (!form.phone) { setError('Phone number is required.'); return; }
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
      await signup({
        ...form,
        categoryId: tempSignupData?.categoryId,
        roleSubCategoryIds: tempSignupData?.roleSubCategoryIds,
        youtubeChannels: selectedChannels,
        googleId: socialProfile?.googleId,
        authProvider: socialProfile ? 'google' : 'local',
        profilePicture,
        pushToken: enableNotifications ? 'web_push_token_placeholder' : undefined
      });

      // Clear ALL onboarding state after successful registration
      clearTempSignupData();
      navigate('/home');
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
    <div className="h-screen w-full bg-black flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Visual Side (Left) */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden bg-zinc-950 border-r border-zinc-800">
        <AuthBackground />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-zinc-950 to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent z-10" />
      </div>

      {/* Form Side (Right) */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-black">
        {/* Desktop Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: EASE }} 
          className="flex-none flex items-center justify-between px-6 py-6 lg:px-12 lg:py-10 border-b border-zinc-900/60"
        >
          {/* Back button */}
          <button
            onClick={handleBack}
            className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-semibold text-[10px] uppercase tracking-wider">Back</span>
          </button>

          <img src={logo} alt="SuviX" className="h-8 lg:h-10" />

          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="hidden sm:inline text-xs font-medium">Member?</span>
            <Link to="/login" className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-[11px] font-semibold hover:bg-zinc-800 transition-colors">
              Sign In
            </Link>
          </div>
        </motion.header>

        {/* Form Area */}
        <div className="flex-1 flex items-start justify-center px-6 pb-12 lg:px-16 pt-8">
          <motion.div 
            initial={{ opacity: 0, y: 24 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }} 
            className="w-full max-w-[440px]"
          >
            {/* Step Progress Bar */}
            <StepBar categorySlug={tempSignupData?.categorySlug} />

            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight">
                Create your <span className="text-zinc-500">account.</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium mt-1">
                As <span className="text-zinc-300 font-semibold">{tempSignupData?.roleName || 'Creator'}</span> — enter your details below.
              </p>
            </div>

            <div className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Profile Picture Upload */}
                <div className="flex items-center gap-4 mb-2">
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
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Recommended: Square, under 5MB</p>
                  </div>
                </div>

                {/* Name + Handle */}
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Full Name" name="fullName" placeholder="John Doe" icon={<User size={16} />} value={form.fullName} onChange={handleChange} required />

                  <div className="space-y-1.5">
                    <label className="font-label text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Handle</label>
                    <div className="relative">
                      <AtSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        name="username"
                        placeholder="handle"
                        value={form.username}
                        onChange={handleChange}
                        onBlur={handleUsernameBlur}
                        required
                        className={`suvix-input !pl-12 pr-4 bg-zinc-900 border-zinc-800 focus:border-white text-sm ${
                          userStatus === 'available' ? 'border-green-500/50' :
                          userStatus === 'taken'     ? 'border-red-500/50'   : ''
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
                <InputField label="Email Address" name="email" type="email" placeholder="name@example.com" icon={<Mail size={16} />} value={form.email} onChange={handleChange} required />

                {/* Phone + Language */}
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Phone" name="phone" placeholder="+91..." icon={<Phone size={16} />} value={form.phone} onChange={handleChange} required />

                  <div className="space-y-1.5">
                    <label className="font-label text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Language</label>
                    <div className="relative">
                      <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <select
                        name="motherTongue"
                        value={form.motherTongue}
                        onChange={handleChange}
                        className="suvix-input !pl-12 bg-zinc-900 border-zinc-800 focus:border-white text-sm appearance-none"
                      >
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* YouTube Channel Preview (yt_influencer only) */}
                {selectedChannels.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase ml-1">Linked Identity</h3>
                    <div className="space-y-2">
                      {selectedChannels.map(ch => (
                        <div key={ch?.channelId} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
                          <img src={ch?.thumbnailUrl} alt={ch?.channelName} className="w-10 h-10 rounded-full bg-zinc-800" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{ch?.channelName}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Youtube size={12} className="text-[#FF0000]" />
                              <span className="text-[11px] font-semibold text-zinc-400">
                                {Number(ch?.subscriberCount || 0).toLocaleString()} • {ch?.subCategoryId || 'Creator'}
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
                        className="suvix-input !pl-12 pr-12 bg-zinc-900 border-zinc-800 focus:border-white"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Lock size={16} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider">Secured via Google</p>
                      <p className="text-[11px] text-zinc-400 font-medium">No password needed — Google handles your login.</p>
                    </div>
                  </div>
                )}

                {/* Notifications Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                      <Bell size={16} className="text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Enable Notifications</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Get updates on your creator journey</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setEnableNotifications(!enableNotifications)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${enableNotifications ? 'bg-green-500' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${enableNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Submit */}
                <button 
                  type="submit" 
                  disabled={isLoading || userStatus === 'taken'} 
                  className="suvix-btn-primary w-full h-12 mt-2 !bg-white !text-black hover:opacity-90 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-zinc-900/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <><span>Create Account</span><ArrowRight size={18} strokeWidth={2.5} /></>
                  }
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-sm text-zinc-400 font-medium">
              Already a member?{' '}
              <Link to="/login" className="font-semibold text-white hover:opacity-80 transition-opacity">Sign In</Link>
            </p>
          </motion.div>
        </div>

        <p className="text-center lg:px-16 text-[10px] text-zinc-600 font-medium pb-8">
          © 2026 SuviX Inc. All rights reserved.
        </p>
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
          className={`suvix-input !pl-12 bg-zinc-900 border-zinc-800 focus:border-white text-sm ${props.className ?? ''}`}
        />
      </div>
    </div>
  );
}