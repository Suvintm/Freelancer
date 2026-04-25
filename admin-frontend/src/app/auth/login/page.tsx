'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Globe, KeyRound, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const { setMfaRequired } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mimic API delay
    setTimeout(() => {
      setMfaRequired('MOCK_MFA_TOKEN', { id: 'SU-49102-X', email, role: 'Security Admin' });
      router.push('/auth/mfa');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ui-bg relative overflow-hidden transition-colors duration-300">
      
      {/* Decorative background accents */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-brand-forest/5 to-transparent opacity-40 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-forest opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
      
      {/* Theme Toggle for Login */}
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[460px] relative z-10"
      >
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-10">
          <Image src="/logo.png" alt="Logo" width={160} height={64} className="max-h-16 w-auto object-contain mb-8 dark:invert dark:brightness-200" />
          <h2 className="text-[10px] font-bold text-brand-forest uppercase tracking-[0.5em] ml-1">Secure Financial Gateway</h2>
        </div>

        {/* Login Form Card */}
        <div className="bento-card p-12 bg-ui-surface shadow-2xl border-ui-border relative">
           <div className="mb-10">
              <h1 className="text-3xl font-bold text-ui-text-main tracking-tight">Welcome back</h1>
              <p className="text-sm text-ui-text-dim font-medium mt-2">Initialize your administrative session.</p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[11px] font-bold text-ui-text-dim uppercase tracking-widest ml-1">Identity UID</label>
                 <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="finance-input w-full h-14 text-sm font-medium focus:finance-input-focus bg-ui-bg/50 border-ui-border"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex items-center justify-between ml-1">
                    <label className="text-[11px] font-bold text-ui-text-dim uppercase tracking-widest">Access Key</label>
                    <button type="button" className="text-[11px] font-bold text-brand-forest hover:underline transition-all">Forgot?</button>
                 </div>
                 <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="finance-input w-full h-14 text-sm font-medium focus:finance-input-focus bg-ui-bg/50 border-ui-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ui-text-dim hover:text-ui-text-main transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                 </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-brand-forest rounded-2xl flex items-center justify-center gap-3 text-white font-bold uppercase text-[11px] tracking-widest hover:bg-brand-forest-dark transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-500/10 mt-8"
              >
                {isLoading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <>
                    Sign In <Shield size={18} />
                  </>
                )}
              </button>
           </form>

           {/* SSO Options */}
           <div className="mt-14 pt-10 border-t border-ui-border">
              <div className="flex items-center gap-4 mb-8">
                 <span className="text-[10px] font-bold text-ui-text-dim uppercase tracking-[0.2em] whitespace-nowrap">Enterprise SSO</span>
                 <div className="h-px flex-1 bg-ui-border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button className="h-12 rounded-xl bg-ui-surface border border-ui-border hover:bg-ui-bg hover:border-ui-text-dim/20 transition-all flex items-center justify-center gap-3 text-[11px] font-bold text-ui-text-muted shadow-sm">
                    <Globe size={16} className="text-ui-text-dim" /> Microsoft
                 </button>
                 <button className="h-12 rounded-xl bg-ui-surface border border-ui-border hover:bg-ui-bg hover:border-ui-text-dim/20 transition-all flex items-center justify-center gap-3 text-[11px] font-bold text-ui-text-muted shadow-sm">
                    <KeyRound size={16} className="text-ui-text-dim" /> Okta
                 </button>
              </div>
           </div>
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-center gap-10 mt-12 pb-6">
           {['Compliance', 'Legal', 'Support'].map(link => (
             <button key={link} className="text-[11px] font-bold text-ui-text-dim hover:text-ui-text-main transition-colors uppercase tracking-widest">
               {link}
             </button>
           ))}
        </div>
      </motion.div>
    </div>
  );
}