'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Sovereign Portal - Build Version 1.0.2 (Force Cache Clear)
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, BookOpen, LifeBuoy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setMfaRequired = useAuthStore((state) => state.setMfaRequired);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;

      if (data.requiresMfa) {
        setMfaRequired(data.mfaToken, data.admin);
        router.push('/auth/mfa');
      } else {
        setAuth(data.admin, data.accessToken);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unauthorized access. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white soviet-portal-env selection:bg-[#0047ab]/20">
      {/* HEADER (Floating) */}
      <header className="absolute top-0 left-0 w-full flex items-center justify-between px-8 py-6 z-20">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#111827]">Sovereign Admin</span>
        </div>
        <nav className="hidden sm:flex items-center gap-8 text-sm font-medium text-[#6b7280]">
            <a href="#" className="hover:text-[#111827] transition-colors flex items-center gap-2">
                <BookOpen size={16} /> Documentation
            </a>
            <a href="#" className="hover:text-[#111827] transition-colors flex items-center gap-2">
                <LifeBuoy size={16} /> Support
            </a>
        </nav>
      </header>

      {/* LEFT PANE: Branding Hero */}
      <aside className="hidden md:flex w-1/2 bg-[#f3f4f6] relative flex-col justify-center px-16 lg:px-24 overflow-hidden">
         <div className="relative z-10">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h2 className="text-2xl font-bold text-[#111827] leading-tight">
                    Refined Control.<br />
                    <span className="text-[#0047ab]">Sovereign Authority.</span>
                </h2>
                <p className="mt-4 text-[#6b7280] text-lg max-w-sm leading-relaxed">
                    Access your enterprise dashboard with precision and architectural clarity.
                </p>
            </motion.div>
         </div>

         {/* Decorative Image/Element */}
         <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[60%] opacity-40 mix-blend-multiply grayscale">
            <motion.div
                animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 1, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            >
                <Shield className="w-full h-full text-white" strokeWidth={1} />
            </motion.div>
         </div>

         <div className="absolute bottom-12 left-16 flex items-center gap-4">
            <div className="h-[2px] w-12 bg-[#0047ab]" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#6b7280]">Est. 2024</span>
         </div>
      </aside>

      {/* RIGHT PANE: Portal Form */}
      <main className="w-full md:w-1/2 flex items-center justify-center p-8 pt-24 md:pt-8 bg-white">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
        >
            <div className="mb-10">
               <div className="w-12 h-12 bg-blue-50 text-[#0047ab] rounded-xl flex items-center justify-center mb-6">
                  <Shield size={24} fill="currentColor" opacity={0.2} />
               </div>
               <h1 className="text-3xl font-bold text-[#111827]">Welcome back</h1>
               <p className="text-[#6b7280] mt-2">Please enter your credentials to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-[#374151] uppercase tracking-wide">Work Email</label>
                    <div className="sov-input-wrapper">
                        <Mail className="ml-4 text-[#9ca3af]" size={18} />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="sov-input"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-xs font-bold text-[#374151] uppercase tracking-wide">Password</label>
                        <a href="#" className="text-xs font-semibold text-[#0047ab] hover:underline">Forgot password?</a>
                    </div>
                    <div className="sov-input-wrapper">
                        <Lock className="ml-4 text-[#9ca3af]" size={18} />
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="sov-input pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 text-[#9ca3af] hover:text-[#111827]"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-1">
                    <input type="checkbox" className="w-4 h-4 rounded border-[#e5e7eb] text-[#0047ab] focus:ring-[#0047ab]" />
                    <span className="text-sm text-[#6b7280]">Stay signed in for 30 days</span>
                </div>

                <button type="submit" disabled={isLoading} className="sov-btn">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Sign In to Dashboard</span>}
                </button>
            </form>

            <div className="relative my-10 text-center">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#e5e7eb]"></div>
                </div>
                <span className="relative px-4 bg-white text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest leading-none">Or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button className="sov-btn-social">
                    <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="Google" />
                    Google
                </button>
                <button className="sov-btn-social">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-5 h-5" alt="Microsoft" />
                    Microsoft
                </button>
            </div>
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="absolute bottom-0 left-0 w-full px-8 py-8 flex flex-col sm:flex-row items-center justify-between text-[10px] font-medium text-[#9ca3af] tracking-wider uppercase">
         <span className="mb-4 sm:mb-0">© 2024 Sovereign Interface</span>
         <nav className="flex gap-8">
            <a href="#" className="hover:text-[#111827] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#111827] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#111827] transition-colors">Security</a>
         </nav>
      </footer>
    </div>
  );
}
