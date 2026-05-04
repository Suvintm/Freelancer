import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import logo from '../assets/darklogo.png';
import { AuthBackground } from '../components/auth/AuthBackground';
import { MobileAuthHeader } from '../components/auth/MobileAuthHeader';
import { useAuthStore } from '../store/useAuthStore';

const EASE = [0.16, 1, 0.3, 1] as const;
const LANGUAGES = ['English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi'];

export default function Signup() {
  const [showPass, setShowPass] = useState(false);
  const { signup, tempSignupData, youtubeDiscovery, clearTempSignupData } = useAuthStore();
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
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUsernameBlur = () => {
    if (!form.username) return;
    setUserStatus('checking');
    setTimeout(() => {
      setUserStatus(form.username.length > 3 ? 'available' : 'taken');
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // MATCHES MOBILE: pre-validate email + username before hitting register-full
      // gives clear error messages without wasting a full registration attempt
      await import('../api/client').then(({ api }) =>
        api.post('/auth/validate-signup', {
          email: form.email.trim().toLowerCase(),
          username: form.username.trim().toLowerCase(),
        })
      );

      // Combine form data with onboarding data
      await signup({
        ...form,
        categoryId: tempSignupData?.categoryId,
        roleSubCategoryIds: tempSignupData?.roleSubCategoryIds,
        youtubeChannels: youtubeDiscovery.selectedChannelIds.map(id => {
          const channel = youtubeDiscovery.channels.find(c => c.channelId === id);
          const categorization = youtubeDiscovery.categorizations[id];
          return {
            ...channel,
            subCategoryId: categorization
          };
        }).filter(Boolean),
        googleId: socialProfile?.googleId,
        authProvider: socialProfile ? 'google' : 'local'
      });

      // MATCHES MOBILE: clear all onboarding state after successful registration
      clearTempSignupData();
      navigate('/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="h-screen w-full bg-black flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Visual Side (Left) */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden bg-zinc-950 border-r border-zinc-800">
        <AuthBackground />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-zinc-950 to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent z-10" />
      </div>

      {/* Mobile Visual Header */}
      <MobileAuthHeader 
        title={<>Create your <br/><span className="text-zinc-500">future today.</span></>}
        actionLabel="Login Here"
        actionLink="/login"
      />

      {/* Form Side (Right) */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-black">
        {/* Desktop Header (Hidden on Mobile) */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: EASE }} 
          className="hidden lg:flex flex-none items-start justify-between px-6 py-8 lg:px-12 lg:py-12"
        >
          <div className="space-y-4">
            <img src={logo} alt="SuviX" className="h-10 lg:h-12" />
            <div className="space-y-1">
              <h1 className="text-2xl lg:text-4xl font-semibold text-white leading-[1.1] tracking-tight">
                Create your <br /> 
                <span className="text-zinc-500">future today.</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span className="hidden sm:inline font-medium">Already a member?</span>
            <Link to="/login" className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-[11px] font-semibold hover:bg-zinc-800 transition-colors">
              Login Here
            </Link>
          </div>
        </motion.header>

        {/* Form Area */}
        <div className="flex-1 flex items-start lg:items-center justify-center px-6 pb-12 lg:px-16 lg:-mt-12">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.2 }} className="w-full max-w-[440px]">
            <div className="space-y-6">
              {/* Google */}
              <button type="button" onClick={handleGoogleLogin} className="suvix-btn-outline w-full h-12 flex items-center justify-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-white text-sm font-semibold shadow-sm">
                <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative flex items-center">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="mx-4 text-[11px] font-label font-semibold tracking-widest text-zinc-500 uppercase">or</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {error && (
                <div className="bg-red-50/50 border border-red-100 text-red-500 px-4 py-3 rounded-xl text-xs font-semibold text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name + Handle grid */}
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
                          userStatus === 'available' ? 'text-green-600' :
                          userStatus === 'taken'     ? 'text-red-500'   :
                          'text-zinc-400'
                        }`}>
                          {userStatus === 'checking' ? '...' : userStatus}
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

                {/* Password */}
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
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Lock size={16} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider">Security Note</p>
                      <p className="text-[11px] text-zinc-400 font-medium">Your account is secured via Google. No password needed.</p>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={isLoading} className="suvix-btn-primary w-full h-12 mt-2 !bg-black !text-white hover:opacity-90 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-xl shadow-zinc-900/20 active:scale-[0.98]">
                  {isLoading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <><span>Create Account</span><ArrowRight size={18} strokeWidth={2.5} /></>
                  }
                </button>
              </form>
            </div>

            <p className="mt-6 text-center lg:text-left text-sm text-zinc-400 font-medium">
              Already a member?{' '}
              <Link to="/login" className="font-semibold text-white hover:opacity-80 transition-opacity">Sign In</Link>
            </p>
          </motion.div>
        </div>

        <p className="text-center lg:text-left lg:px-16 text-[10px] text-zinc-400 font-medium pb-8">
          © 2026 SuviX Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}

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