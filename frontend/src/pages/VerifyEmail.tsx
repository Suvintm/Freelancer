import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { AuthBackground } from '../components/auth/AuthBackground';
import logo from '../assets/lightlogo.png';
import { authService } from '../api/services/auth.service';
import { useDispatch } from 'react-redux';
import { setAuth } from '../store/slices/authSlice';
import { useQueryClient } from '@tanstack/react-query';
import { CURRENT_USER_QUERY_KEY } from '../queries/useCurrentUser';
import { clearTempSignupData } from '../store/slices/onboardingSlice';
import { OnboardingSyncOverlay } from '../components/onboarding/OnboardingSyncOverlay';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  const email = searchParams.get('email') || '';
  
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [hasSentOnce, setHasSentOnce] = useState(false);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);
  const [nextRoute, setNextRoute] = useState('/onboarding/preferences');
  
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Cooldown timer for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // If no email query param, go to login
  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  // Handle digit input change
  const handleChange = (index: number, value: string) => {
    // Only accept numeric digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Take the last character typed
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace delete key
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      
      if (!otp[index] && index > 0) {
        // If current index is empty, clear previous index and focus it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current index
        newOtp[index] = '';
        setOtp(newOtp);
      }
      setError(null);
    }
  };

  // Handle paste operation (e.g. user copying a 6-digit code)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return; // verify exactly 6 digits

    const digits = pasteData.split('');
    setOtp(digits);
    setError(null);
    // Focus the last input box
    inputRefs.current[5]?.focus();
  };

  // Verification request submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await authService.verifyEmail(email, fullOtp);
      if (data.success && data.user) {
        setSuccess('Verification successful! Logging you in...');
        
        // Save auth state in Redux
        dispatch(
          setAuth({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
          })
        );
        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, data.user);
        dispatch(clearTempSignupData());

        // Redirect dynamically based on onboarding, sync mode, and preferences state
        const user = data.user;
        const isCreator = user.role === 'creator' || user.role === 'yt_influencer' || user.primaryRole?.category === 'creator';
        const isBrand = user.role === 'brand' || user.primaryRole?.category === 'brand';
        const hasChannels = (user.youtubeChannels?.length ?? 0) > 0 || (user.creatorProfile?.channels?.length ?? 0) > 0 || (user.channels?.length ?? 0) > 0;
        const isForeground = data.ytSyncMode === 'foreground' || (isCreator && hasChannels);

        const targetRoute = user.isOnboarded && user.preferencesCompleted
          ? '/home'
          : (isBrand ? '/home' : '/onboarding/preferences');
        
        setNextRoute(targetRoute);

        if (isForeground) {
          setShowSyncOverlay(true);
        } else {
          setTimeout(() => {
            navigate(targetRoute, { replace: true });
          }, 1200);
        }
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError?.response?.data?.message || axiosError.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP code
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await authService.resendVerificationCode(email);
      setSuccess('Your mail has arrived, check and paste here.');
      setResendCooldown(60); // 60s cooldown limit
      setHasSentOnce(true);
      // Clear inputs
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosError?.response?.data?.message || axiosError.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full bg-black flex flex-col overflow-hidden font-sans">
      {showSyncOverlay && <OnboardingSyncOverlay nextRoute={nextRoute} />}
      
      {/* Full Screen Background */}
      <div className="absolute inset-0 z-0">
        <AuthBackground />
      </div>

      {/* Foreground Container */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row h-full w-full">
        
        {/* Top Left Global Redirect Button */}
        <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-50">
          <Link 
            to="/login"
            className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-white border border-gray-200 lg:border-black rounded-full text-black text-[11px] lg:text-sm font-bold transition-all shadow-md hover:scale-105"
          >
            <ArrowLeft size={14} className="lg:w-4 lg:h-4" />
            <span>Back to Login</span>
          </Link>
        </div>

        {/* Left Side spacer */}
        <div className="hidden lg:block lg:w-[40%] xl:w-[30%] h-full pointer-events-none"></div>

        {/* Right Side Form Card */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20 sm:p-6 lg:p-12 h-full lg:w-[60%] xl:w-[70%]">
          
          <div className="w-full max-w-[520px] bg-white rounded-3xl lg:rounded-[2rem] shadow-2xl flex flex-col relative shrink-0 max-h-full overflow-hidden mt-2 lg:mt-0">
            
            <div className="w-full overflow-y-auto custom-scrollbar p-6 sm:p-8 lg:p-12">
              
              {/* Header */}
              <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="flex relative w-full flex-col items-center pb-4 lg:pb-6 border-b border-zinc-100 mb-6 shrink-0"
              >
                <img src={logo} alt="SuviX Logo" className="h-10 lg:h-12 w-auto mb-3" />
                <h1 className="text-xl lg:text-2xl font-black text-black tracking-tight text-center">
                  Verify your email
                </h1>
                <p className="text-xs lg:text-sm text-zinc-500 text-center max-w-[320px] mt-1.5 leading-relaxed">
                  We sent a 6-digit code to <span className="font-semibold text-black break-all">{email}</span>
                </p>
              </motion.header>

              {/* Status Alert Panels */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 mb-6"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] lg:text-xs text-red-700 leading-normal">{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5 mb-6"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] lg:text-xs text-emerald-800 leading-normal">{success}</p>
                </motion.div>
              )}

              {/* Verification Code inputs */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Send / Cooldown Timer link */}
                <div className="text-center pb-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading || resendCooldown > 0}
                    className={`text-sm font-bold transition-all underline outline-none ${
                      (isLoading || resendCooldown > 0)
                        ? 'text-zinc-400 cursor-not-allowed no-underline' 
                        : 'text-black hover:opacity-75'
                    }`}
                  >
                    {isLoading 
                      ? 'Sending...' 
                      : resendCooldown > 0 
                        ? `Resend code in ${resendCooldown}s` 
                        : !hasSentOnce 
                          ? 'Click here to send verification code'
                          : 'Resend Verification Code'}
                  </button>
                </div>

                <div className="flex justify-between gap-2.5 sm:gap-3 py-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el as HTMLInputElement; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black text-black bg-zinc-50 border-2 border-zinc-200 focus:border-black rounded-xl outline-none transition-all focus:scale-105"
                      autoFocus={index === 0}
                      disabled={isLoading}
                    />
                  ))}
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isLoading || otp.some(d => !d)}
                  className={`suvix-btn-primary w-full h-12 !text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98] ${
                    !isLoading && otp.every(d => d)
                      ? '!bg-black hover:opacity-90 shadow-black/10'
                      : '!bg-zinc-200 shadow-none cursor-not-allowed !text-zinc-400'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>
              </form>

              {/* Legal Footer Info */}
              <div className="w-full text-center text-[10px] text-zinc-400 border-t border-zinc-100 mt-8 pt-4">
                © {new Date().getFullYear()} SuviX Inc. All rights reserved.
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
