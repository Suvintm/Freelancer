import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle
} from 'lucide-react';
import logo from '../assets/lightlogo.png';
import { AuthBackground } from '../components/auth/AuthBackground';
import { MobileAuthHeader } from '../components/auth/MobileAuthHeader';
import { useDispatch } from 'react-redux';
import { clearTempSignupData, resetYoutubeDiscovery, setTempSignupData } from '../store/slices/onboardingSlice';
import { useLogin } from '../mutations/useLogin';

const EASE = [0.16, 1, 0.3, 1] as const;

// Maps OAuth error codes returned from /oauth-success to human-readable messages
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  no_code:         'Google sign-in was cancelled. Please try again.',
  exchange_failed: 'Google authentication failed. Please try again.',
  server_error:    'A server error occurred. Please try again later.',
  no_account:      'No account found for this Google profile. Please sign up first.',
  server_busy:     'Server busy ! Please try again later or contact SuviX team.',
};

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const { mutateAsync: login, isPending: isLoading } = useLogin();
  const [error, setError] = useState<string | null>(() => {
    const oauthError = new URLSearchParams(window.location.search).get('error');
    return oauthError ? (OAUTH_ERROR_MESSAGES[oauthError] || 'Authentication failed. Please try again.') : null;
  });
  const navigate = useNavigate();

  // 🔐 PRODUCTION: On Login mount, wipe ALL stale onboarding data.
  // This is the definitive fix for the stale-state contamination bug where
  // a previous registration session's yt_influencer tempSignupData would
  // cause Google Login to redirect to YouTube Connect instead of Home.
  React.useEffect(() => {
    dispatch(clearTempSignupData());
    dispatch(resetYoutubeDiscovery());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // SECURITY RESTRICTION: Block unauthorized emails during DEV phase
    const allowedEmails = ['suvintm19@gmail.com', 'suvintm19@gamil.com', 'suvintm1515@gmail.com','suvineditography@gmail.com','uber@company.com'];
    if (!allowedEmails.includes(form.email.toLowerCase().trim()) && !form.email.toLowerCase().trim().endsWith('@suvix.in')) {
      setError('Server busy ! Please try again later or contact SuviX team.');
      return;
    }

    try {
      await login({ email: form.email, password: form.password });
      navigate('/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  /**
   * PRODUCTION: Google on Login = LOGIN ONLY.
   * We clear all stale data and set intent='login' in tempSignupData BEFORE
   * redirecting to Google. When OAuthSuccess reads intent='login', it will:
   *  - Existing user → log in and go to /home ✅
   *  - New user → redirect to /login?error=no_account (NOT create an account) ✅
   */
  const handleGoogleLogin = () => {
    // Step 1: Nuke all stale data
    dispatch(clearTempSignupData());
    dispatch(resetYoutubeDiscovery());

    // Step 2: Set login intent so OAuthSuccess routes correctly
    dispatch(setTempSignupData({ intent: 'login' }));

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="relative h-screen w-full bg-white lg:bg-black flex flex-col overflow-hidden font-sans">
      
      {/* Full Screen Background (Laptop only) */}
      <div className="hidden lg:block absolute inset-0 z-0">
        <AuthBackground />
      </div>

      {/* Foreground Container */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row h-full w-full">
        
        {/* Top Left Global Redirect Button */}
        <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-50">
          <Link 
            to="/"
            className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-black rounded-full text-black text-xs lg:text-sm font-bold transition-all shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Create Account</span>
          </Link>
        </div>

        {/* Mobile Visual Header */}
        <div className="lg:hidden flex-none">
          <MobileAuthHeader 
            title="Welcome Back" 
            subtitle="Please enter your details below to login."
            actionLabel="Join Now"
            actionLink="/"
          />
        </div>

        {/* Left Side (30% approx) - Invisible, just lets the AuthBackground text show through */}
        <div className="hidden lg:block lg:w-[40%] xl:w-[30%] h-full pointer-events-none"></div>

        {/* Right Side Form Container (70%) */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 h-full lg:w-[60%] xl:w-[70%]">
          
          {/* Floating Rounded Form Card (Laptop) / Flat (Mobile) */}
          <div className="w-full max-w-[600px] bg-white lg:rounded-[2rem] lg:shadow-2xl flex flex-col relative shrink-0 max-h-full overflow-hidden">
            
            {/* Scrollable Inner Content Container */}
            <div className="w-full overflow-y-auto custom-scrollbar p-6 lg:p-12">
              
              {/* Desktop Header */}
              <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="hidden lg:flex relative w-full flex-col items-center pb-8 border-b border-zinc-100 mb-8 shrink-0"
              >
                <img src={logo} alt="SuviX" className="absolute left-0 top-1 h-8 shrink-0" />
                <div className="text-center space-y-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-black leading-[1.1] tracking-tight">
                    Welcome Back.
                  </h1>
                  <p className="text-zinc-500 text-sm font-medium">Log in to continue your creator journey.</p>
                </div>
              </motion.header>

              {/* Content Area */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
                className="w-full shrink-0"
              >
              <div className="space-y-6">
                {/* Google Login — LOGIN ONLY */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-12 flex items-center justify-center gap-3 bg-white border-2 border-black rounded-xl hover:bg-zinc-50 transition-all text-black text-sm font-bold shadow-sm"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="relative flex items-center">
                  <div className="flex-1 h-px bg-zinc-200" />
                  <span className="mx-4 text-[11px] font-label font-bold tracking-widest text-zinc-400 uppercase">
                    or
                  </span>
                  <div className="flex-1 h-px bg-zinc-200" />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email + Password Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="font-label text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        className="suvix-input !pl-12 pr-4 bg-white border-2 border-black transition-all text-black placeholder:text-zinc-400"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-label text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                        Password
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-xs font-bold text-zinc-500 hover:text-black transition-colors"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        className="suvix-input !pl-12 pr-12 bg-white border-2 border-black transition-all text-black placeholder:text-zinc-400"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="suvix-btn-primary w-full h-12 mt-2 !bg-black !text-white hover:opacity-90 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-black/10 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={18} strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Footer */}
              <p className="mt-8 text-center text-sm text-zinc-500 font-medium pb-2">
                Don't have an account?{' '}
                <Link to="/" className="font-bold text-black hover:opacity-70 transition-opacity">
                  Join SuviX
                </Link>
              </p>
            </motion.div>
            </div>
          </div>

          {/* Legal Footer (Laptop only, sits below the floating card) */}
          <div className="hidden lg:block mt-8 text-center text-[11px] text-zinc-400/80 font-bold backdrop-blur-sm px-4 py-1 rounded-full">
            © 2026 SuviX Inc. Powered by professional excellence.
          </div>
          
          {/* Legal Footer (Mobile) */}
          <div className="lg:hidden mt-auto pt-8 pb-4 text-center text-[11px] text-zinc-400 font-bold">
            © 2026 SuviX Inc. Powered by professional excellence.
          </div>

        </div>
      </div>
    </div>
  );
}