import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import logo from '../assets/whitebglogo.png';
import { AuthBackground } from '../components/auth/AuthBackground';

const EASE = [0.16, 1, 0.3, 1];

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/role-selection');
    }, 1200);
  };

  const handleGoogleLogin = () => {
    // Logic for Google login
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden font-sans light">
      {/* Visual Side (Left) */}
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden bg-[#F8F9FA] border-r border-zinc-100">
        <AuthBackground />
        {/* Gradient overlays for depth */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#F8F9FA] to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F8F9FA] to-transparent z-10" />
      </div>

      {/* Form Side (Right) */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-white">
        {/* Header (Top-Left Branding) */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex-none flex items-start justify-between px-6 py-8 lg:px-12 lg:py-12"
        >
          <div className="space-y-4">
            <img src={logo} alt="SuviX" className="h-10 lg:h-12 brightness-0" />
            <div className="space-y-1">
              <h1 className="text-2xl lg:text-4xl font-semibold text-zinc-900 leading-[1.1] tracking-tight">
                Elevate your <br /> 
                <span className="text-zinc-400">creator journey.</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span className="hidden sm:inline font-medium">New?</span>
            <Link
              to="/role-selection"
              className="px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 text-[11px] font-semibold hover:bg-zinc-100 transition-colors"
            >
              Join Now
            </Link>
          </div>
        </motion.header>

        {/* Content Area */}
        <div className="flex-1 flex items-start lg:items-center justify-center px-6 pb-12 lg:px-16 lg:-mt-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
            className="w-full max-w-[400px]"
          >
            <div className="space-y-6">
              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="suvix-btn-outline w-full h-12 flex items-center justify-center gap-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all text-zinc-900 text-sm font-semibold shadow-sm"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative flex items-center">
                <div className="flex-1 h-px bg-zinc-100" />
                <span className="mx-4 text-[11px] font-label font-semibold tracking-widest text-zinc-400 uppercase">
                  or
                </span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="font-label text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      className="suvix-input !pl-12 pr-4 bg-zinc-50/50 border-zinc-200 focus:bg-white focus:border-zinc-900 transition-all text-zinc-900"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-label text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
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
                      className="suvix-input !pl-12 pr-12 bg-zinc-50/50 border-zinc-200 focus:bg-white focus:border-zinc-900 transition-all text-zinc-900"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="suvix-btn-primary w-full h-12 mt-2 !bg-black !text-white hover:opacity-90 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-xl shadow-zinc-900/20 active:scale-[0.98]"
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
            <p className="mt-8 text-center lg:text-left text-sm text-zinc-500 font-medium">
              Don't have an account?{' '}
              <Link to="/role-selection" className="font-semibold text-zinc-900 hover:opacity-80 transition-opacity">
                Join SuviX
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Legal Footer */}
        <p className="text-center lg:text-left lg:px-16 text-[11px] text-zinc-400 font-medium pb-8">
          © 2026 SuviX Inc. Powered by professional excellence.
        </p>
      </div>
    </div>
  );
}