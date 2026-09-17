import React, { useState, useEffect } from 'react';
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
  AlertCircle, 
  CheckCircle2,
  Users
} from 'lucide-react';
import lightLogo from '../assets/lightlogo.png';
import logoDefault from '../assets/blackbglogo.png';
import cloudflareLogo from '../assets/cloudflare.png';
import loginMobileBg from '../assets/loginmobilebg.png';
import { Turnstile } from '@marsidev/react-turnstile';
import { useDispatch } from 'react-redux';
import { clearTempSignupData, resetYoutubeDiscovery, setTempSignupData } from '../store/slices/onboardingSlice';
import { useLogin } from '../mutations/useLogin';
import { isAccessAllowed, RESTRICTED_ACCESS_MESSAGE } from '../config/accessControl.config';

// Fluid animation easing curve
const EASE = [0.16, 1, 0.3, 1] as const;

// Dynamically resolve loginbg.png if it exists on disk, falling back to white background if not yet created
const desktopBgModules = import.meta.glob<{ default: string }>('../assets/loginbg.png', { eager: true });
const loginBg = desktopBgModules['../assets/loginbg.png']?.default || null;

// Dynamically resolve blacklogo.png if added, fallback to lightLogo/logoDefault
const blackLogoModules = import.meta.glob<{ default: string }>('../assets/blacklogo.png', { eager: true });
const logo = blackLogoModules['../assets/blacklogo.png']?.default || lightLogo || logoDefault;

// Maps OAuth error codes returned from /oauth-success to human-readable messages
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  no_code:                'Google sign-in was cancelled. Please try again.',
  exchange_failed:        'Google authentication failed. Please try again.',
  server_error:           'A server error occurred. Please try again later.',
  no_account:             'No account found for this Google profile. Please sign up first.',
  server_busy:            'Server busy! Please try again later or contact SuviX team.',
  maintenance_restricted: RESTRICTED_ACCESS_MESSAGE,
};

// Google Multicolor "G" Logo
const GoogleIcon = () => (
  <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
  const [turnstileToken, setTurnstileToken] = useState<string>(() => (!siteKey ? 'dev-bypass' : ''));
  const [, setTurnstileStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>(
    () => (!siteKey ? 'success' : 'verifying')
  );
  const dispatch = useDispatch();
  const { mutateAsync: login, isPending: isLoading } = useLogin();
  const [error, setError] = useState<string | null>(() => {
    const oauthError = new URLSearchParams(window.location.search).get('error');
    return oauthError ? (OAUTH_ERROR_MESSAGES[oauthError] || 'Authentication failed. Please try again.') : null;
  });
  const navigate = useNavigate();

  // On Login mount, clear stale registration/OAuth state
  useEffect(() => {
    dispatch(clearTempSignupData());
    dispatch(resetYoutubeDiscovery());
    try {
      sessionStorage.removeItem('suvix_temp_signup_data');
    } catch {
      // ignore
    }

    if (window.location.search.includes('error=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [dispatch]);

  const isValidEmail = form.email.includes('@') && form.email.includes('.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAccessAllowed(form.email)) {
      setError(RESTRICTED_ACCESS_MESSAGE);
      return;
    }

    if (!turnstileToken) {
      setError('Please complete the security check.');
      return;
    }

    try {
      await login({ email: form.email, password: form.password, turnstileToken });
      navigate('/home');
    } catch (err: unknown) {
      const axiosError = err as { 
        response?: { 
          data?: { requiresVerification?: boolean; email?: string; message?: string }; 
          status?: number 
        }; 
        message?: string 
      };
      const responseData = axiosError?.response?.data;
      if (axiosError?.response?.status === 403 && responseData?.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(responseData.email || form.email)}`);
        return;
      }
      setError(responseData?.message || axiosError.message || String(err));
    }
  };

  /**
   * Google Sign-in Handler
   */
  const handleGoogleLogin = () => {
    setError(null);
    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    dispatch(clearTempSignupData());
    dispatch(resetYoutubeDiscovery());
    dispatch(setTempSignupData({ intent: 'login' }));

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-zinc-900 lg:bg-white flex flex-col justify-between overflow-x-hidden select-none font-sans">
      
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
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-14 pt-4 sm:pt-7 lg:pt-9 pb-28 sm:pb-32 lg:pb-12 flex-1 flex flex-col justify-between">
        
        {/* MAIN BODY: TOP-LEFT BACK BUTTON & RIGHT LOGIN CARD */}
        <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 lg:gap-12 flex-1">
          
          {/* TOP-LEFT BACK BUTTON TO WELCOME PAGE */}
          <motion.div 
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex items-center self-start"
          >
            <Link 
              to="/"
              className="group flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-white/95 hover:bg-white border border-zinc-200/80 text-zinc-900 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={15} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </Link>
          </motion.div>

          {/* RIGHT SIDE FLOATING LOGIN CARD (~40% OF TOTAL SCREEN WIDTH) */}
          <motion.div 
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, ease: EASE, delay: 0.15 }}
            className="w-full lg:w-[42vw] xl:w-[40vw] 2xl:w-[38vw] flex justify-center lg:justify-end shrink-0"
          >
            {/* White Login Card: ~40% viewport width with compact mobile sizing */}
            <div className="light-card relative w-full max-w-[480px] sm:max-w-[600px] lg:max-w-none bg-white rounded-tl-[1.5rem] sm:rounded-tl-[1.75rem] rounded-tr-[3rem] sm:rounded-tr-[4.5rem] rounded-br-[1.5rem] sm:rounded-br-[1.75rem] rounded-bl-[3rem] sm:rounded-bl-[4.5rem] px-4 py-3.5 sm:px-10 sm:py-6 lg:px-12 xl:px-14 lg:py-7 shadow-[0_22px_65px_-15px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04)] border border-zinc-100 overflow-hidden" style={{ colorScheme: 'light' }}>
              
              {/* ── CARD HEADER: 2-COLUMN SIDE-BY-SIDE (LOGO & WELCOME TEXT) ── */}
              <div className="flex items-start gap-3 sm:gap-4 mb-2 sm:mb-3">
                {/* Column 1: SuviX Logo (Top-Left aligned, reduced size) */}
                <div className="shrink-0 flex items-start justify-start self-start pt-0.5">
                  <Link to="/" className="inline-block transition-transform hover:scale-102">
                    <img src={logo} alt="SuviX" className="h-5.5 sm:h-7 lg:h-8 w-auto object-contain" />
                  </Link>
                </div>

                {/* Column 2: Welcome Back Heading & Subtitle */}
                <div className="min-w-0 flex-1">
                  <h2 className="text-[19px] sm:text-2xl lg:text-[25px] font-bold text-zinc-950 tracking-tight leading-tight">
                    Welcome Back.
                  </h2>
                  <p className="text-zinc-500 text-[10px] sm:text-xs font-normal leading-snug">
                    Log in to continue your creator journey on SuviX.
                  </p>
                </div>
              </div>

              {/* GOOGLE CONTINUE BUTTON (REDUCED WIDTH & CENTERED) */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full max-w-[250px] sm:max-w-[290px] py-1.5 sm:py-2 px-3 sm:px-4 bg-white hover:bg-zinc-50/90 active:bg-zinc-100 border border-zinc-200/90 hover:border-zinc-300 rounded-full flex items-center justify-center gap-2 sm:gap-2.5 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-zinc-800 text-[11px] sm:text-xs font-semibold cursor-pointer group"
                >
                  <GoogleIcon />
                  <span className="font-semibold text-zinc-900 group-hover:text-black">Continue with Google</span>
                </button>
              </div>

              {/* OR DIVIDER */}
              <div className="relative flex items-center justify-center my-1.5 sm:my-3.5">
                <div className="flex-1 h-px bg-zinc-200/80" />
                <span className="mx-2 text-[8px] sm:text-[11px] font-bold tracking-widest text-zinc-400 uppercase bg-white px-1.5 sm:px-2">
                  OR
                </span>
                <div className="flex-1 h-px bg-zinc-200/80" />
              </div>

              {/* ERROR BANNER */}
              {error && (
                <div className="mb-2 p-2 sm:p-2.5 rounded-xl bg-red-50 border border-red-200/80 text-red-600 text-[10px] sm:text-xs font-semibold flex items-start gap-1.5 sm:gap-2">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* LOGIN FORM */}
              <form id="login-form" onSubmit={handleSubmit} className="space-y-1.5 sm:space-y-3">
                
                {/* EMAIL ADDRESS INPUT */}
                <div className="space-y-0.5">
                  <div className="relative bg-[#F8F9FA] hover:bg-zinc-100/70 focus-within:bg-white focus-within:border-zinc-400 border border-zinc-200/80 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2.5 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-2 sm:gap-3">
                    <Mail size={15} className="text-zinc-700 shrink-0 stroke-[1.8] sm:w-[18px] sm:h-[18px]" />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <label className="text-[8px] sm:text-[10px] text-zinc-400 font-medium leading-none block mb-0.5 select-none">
                        Email address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        style={{ colorScheme: 'light', backgroundColor: 'transparent' }}
                        className="w-full text-[11px] sm:text-sm font-semibold text-zinc-950 !bg-transparent outline-none placeholder:text-zinc-400 placeholder:font-normal focus:bg-transparent selection:bg-zinc-200 selection:text-black leading-tight"
                      />
                    </div>
                    {/* Green checkmark indicator when email is valid */}
                    {isValidEmail && (
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0 sm:w-[18px] sm:h-[18px]" />
                    )}
                  </div>
                </div>

                {/* PASSWORD INPUT */}
                <div className="space-y-0.5">
                  <div className="relative bg-[#F8F9FA] hover:bg-zinc-100/70 focus-within:bg-white focus-within:border-zinc-400 border border-zinc-200/80 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2.5 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-2 sm:gap-3">
                    <Lock size={15} className="text-zinc-700 shrink-0 stroke-[1.8] sm:w-[18px] sm:h-[18px]" />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <label className="text-[8px] sm:text-[10px] text-zinc-400 font-medium leading-none block mb-0.5 select-none">
                        Password
                      </label>
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        style={{ colorScheme: 'light', backgroundColor: 'transparent' }}
                        className="w-full text-[11px] sm:text-sm font-semibold text-zinc-950 !bg-transparent outline-none placeholder:text-zinc-400 placeholder:font-normal tracking-wide focus:bg-transparent selection:bg-zinc-200 selection:text-black leading-tight"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="text-zinc-600 hover:text-black transition-colors p-0.5 cursor-pointer shrink-0"
                      aria-label="Toggle password visibility"
                    >
                      {showPass ? <EyeOff size={15} className="sm:w-[18px] sm:h-[18px]" /> : <Eye size={15} className="sm:w-[18px] sm:h-[18px]" />}
                    </button>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="flex justify-end pt-0.5">
                    <Link
                      to="/forgot-password"
                      className="text-[9px] sm:text-xs font-semibold text-zinc-800 hover:text-black hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {/* ── CLOUDFLARE SECURITY STATUS (ABOVE SIGN IN BUTTON) ── */}
                <div className="w-full pt-1.5 sm:pt-2.5 pb-0.5 sm:pb-1 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 select-none overflow-hidden">
                  {/* Cloudflare Logo at top on mobile */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <img 
                      src={cloudflareLogo} 
                      alt="Cloudflare" 
                      className="h-3 sm:h-4 w-auto object-contain shrink-0" 
                    />
                  </div>

                  {/* Turnstile / Checkbox render below logo on mobile */}
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

                {/* LOG IN BUTTON & CREATE ACCOUNT LINK (DESKTOP IN-CARD ONLY) */}
                <div className="hidden lg:block pt-1 space-y-2.5">
                  <button
                    type="submit"
                    disabled={isLoading || !turnstileToken}
                    className={`w-full h-11 sm:h-12 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-md text-xs sm:text-sm bg-black text-white ${
                      !isLoading && turnstileToken
                        ? 'hover:bg-zinc-800 active:scale-98 cursor-pointer'
                        : 'opacity-90 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Log In</span>
                        <ArrowRight size={16} strokeWidth={2.5} />
                      </>
                    )}
                  </button>

                  <div className="text-center text-xs text-zinc-500 font-medium pt-0.5">
                    <span>Don&apos;t have an account? </span>
                    <Link to="/role-selection" className="font-bold text-black hover:underline inline-flex items-center gap-0.5">
                      Create an Account <ArrowRight size={12} className="inline ml-0.5" />
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── MOBILE FIXED BOTTOM ACTION DOCK (MOBILE ONLY) ── */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-zinc-200/80 rounded-t-[1.75rem] sm:rounded-t-[2.25rem] shadow-[0_-10px_35px_rgba(0,0,0,0.15)] px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          {/* Helper Text: Don't have an account? */}
          <div className="text-center text-[11px] sm:text-xs text-zinc-500 font-medium">
            <span>Don&apos;t have an account? </span>
            <Link to="/role-selection" className="font-bold text-black hover:underline">
              Join SuviX
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Secondary Button: Sign Up / Join SuviX */}
            <Link
              to="/role-selection"
              className="flex-1 h-10 sm:h-11 rounded-full bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border border-zinc-200/80 shadow-sm"
            >
              <Users size={14} className="text-zinc-600 shrink-0" />
              <span>Join SuviX</span>
            </Link>

            {/* Primary Button: Log In */}
            <button
              type="submit"
              form="login-form"
              disabled={isLoading || !turnstileToken}
              className={`flex-1 h-10 sm:h-11 rounded-full font-bold flex items-center justify-center gap-1.5 transition-all shadow-md text-xs sm:text-sm bg-black text-white ${
                !isLoading && turnstileToken
                  ? 'hover:bg-zinc-800 active:scale-98 cursor-pointer'
                  : 'opacity-90 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight size={14} strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}