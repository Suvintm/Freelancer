'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function MfaPage() {
  const router = useRouter();
  const { mfaToken, user, setAuth, requiresMfa } = useAuthStore();
  
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Security Redirect: If no MFA flow is active, go back to login
  useEffect(() => {
    if (!requiresMfa || !mfaToken) {
      router.replace('/auth/login');
    }
  }, [requiresMfa, mfaToken, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/mfa/verify', { 
        mfaToken, 
        code 
      });
      
      const data = response.data;
      setAuth(data.admin, data.accessToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired MFA code.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!requiresMfa) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <button 
          onClick={() => router.push('/auth/login')}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Back to Login</span>
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 border border-blue-500/20 mb-6">
            <Fingerprint className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Security Check</h1>
          <p className="text-slate-400 mt-2">Enter the digits from your authenticator app</p>
        </div>

        <div className="glass p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          
          <form onSubmit={handleVerify} className="space-y-8">
            <div className="flex justify-center flex-col items-center gap-4">
              <div className="text-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Identity Verified As</span>
                <p className="text-blue-400 font-medium text-sm mt-1">{user?.email}</p>
              </div>

              <div className="w-full">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-2xl text-center text-4xl font-bold tracking-[1rem] py-6 text-white focus:border-blue-500/50 focus:outline-none transition-all placeholder:text-slate-800"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="btn-primary w-full h-14 disabled:opacity-30 disabled:scale-100"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Verify Access
                  <ShieldCheck className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-xs text-slate-500">
              Your session is being monitored for security purposes.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
