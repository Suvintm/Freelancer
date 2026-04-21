'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Smartphone, Lock, Fingerprint, ChevronLeft, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { ThemeToggle } from '@/components/theme-toggle';

export default function MfaPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [user, router]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      if (user) {
        setAuth(user, 'MOCK_ACCESS_TOKEN');
        router.push('/dashboard');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ui-bg relative overflow-hidden transition-colors duration-300">
      
      {/* Decorative background accents */}
      <div className="absolute top-0 right-0 w-full h-[50vh] bg-gradient-to-b from-brand-forest/5 to-transparent opacity-40 pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-forest opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
      
      {/* Theme Toggle */}
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[460px] relative z-10"
      >
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-10">
          <img src="/logo.png" alt="Logo" className="max-h-16 w-auto object-contain mb-8 dark:invert dark:brightness-200" />
          <h2 className="text-[10px] font-bold text-brand-forest uppercase tracking-[0.5em] ml-1">Identity Probe - Protocol 2A</h2>
        </div>

        {/* MFA Card */}
        <div className="bento-card p-12 bg-ui-surface shadow-2xl border-ui-border relative overflow-hidden">
           {/* Progress bar effect */}
           <div className="absolute top-0 left-0 w-full h-1.5 bg-ui-bg">
              <motion.div 
                initial={{ width: '0%' }}
                animate={{ width: otp.filter(Boolean).length * 16.6 + '%' }}
                className="h-full bg-brand-forest"
              />
           </div>

           <div className="mb-10 mt-4 text-center">
              <h1 className="text-3xl font-bold text-ui-text-main tracking-tight">Enter Code</h1>
              <p className="text-sm text-ui-text-dim font-medium mt-3 leading-relaxed">
                 A verification code has been dispatched to your authorized secondary device. 
              </p>
           </div>

           <form onSubmit={handleVerify} className="space-y-12">
              <div className="flex justify-between gap-3">
                 {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black bg-ui-bg border border-ui-border rounded-2xl text-brand-forest focus:border-brand-forest focus:ring-4 focus:ring-brand-forest/5 transition-all outline-none"
                    />
                 ))}
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading || otp.some(d => !d)}
                  className="w-full h-14 bg-brand-forest rounded-2xl flex items-center justify-center gap-3 text-white font-bold uppercase text-[11px] tracking-widest hover:bg-brand-forest-dark transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-500/10"
                >
                  {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <>Finalize Access <Fingerprint size={18} /></>}
                </button>
                
                <button type="button" className="w-full text-[11px] font-bold text-ui-text-dim uppercase tracking-widest hover:text-brand-forest transition-colors">
                  Resend Signal Request
                </button>
              </div>
           </form>

           <div className="mt-14 p-5 rounded-2xl bg-ui-bg border border-ui-border flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-ui-surface border border-ui-border flex items-center justify-center shadow-sm">
                  <Lock size={18} className="text-brand-forest" />
              </div>
              <p className="text-[11px] font-medium text-ui-text-muted leading-tight">
                Operating under **Protocol 2A**. Enhanced session security is active.
              </p>
           </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
           <button 
            onClick={() => router.push('/auth/login')}
            className="flex items-center gap-2 text-[11px] font-bold text-ui-text-dim hover:text-ui-text-main transition-colors uppercase tracking-widest"
           >
              <ChevronLeft size={14} /> Back to Sign In
           </button>
           <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-ui-text-dim/40" />
              <span className="text-[10px] font-bold text-ui-text-dim/40 uppercase tracking-widest italic">Encrypted Session</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}