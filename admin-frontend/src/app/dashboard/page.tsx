'use client';

import { motion } from 'framer-motion';
import { 
  ArrowRight, LayoutDashboard, Settings, ShieldCheck, 
  Sparkles, Zap, Shield, Globe
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const QUICK_ACTIONS = [
    { title: 'Financial Overview', desc: 'Monitor real-time stats and cash flow analytics.', icon: LayoutDashboard, path: '/dashboard/overview', color: 'text-brand-forest', bg: 'bg-emerald-500/5' },
    { title: 'Security Protocols', desc: 'Audit transaction logs and active user sessions.', icon: ShieldCheck, path: '/dashboard/tx', color: 'text-amber-500', bg: 'bg-amber-500/5' },
    { title: 'Console Settings',  desc: 'Configure portal identity and system preferences.', icon: Settings, path: '/dashboard/settings', color: 'text-blue-500', bg: 'bg-blue-500/5' },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-forest opacity-[0.02] dark:opacity-[0.05] rounded-full blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500 opacity-[0.01] dark:opacity-[0.03] rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center text-center max-w-4xl"
      >
        {/* Large Logo - Central Focus */}
        <div className="relative group mb-12">
            <motion.div 
                animate={{ 
                    y: [0, -10, 0],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
            >
                <Image src="/logo.png" alt="SuviX Logo" width={400} height={192} className="max-h-48 w-auto object-contain dark:invert dark:brightness-200 drop-shadow-2xl" priority />
            </motion.div>
            {/* Logo Glow */}
            <div className="absolute inset-0 bg-brand-forest/20 blur-[60px] rounded-full -z-10 group-hover:bg-brand-forest/30 transition-all duration-500 scale-110" />
        </div>

        {/* Welcome Text */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="space-y-4"
        >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-forest/5 dark:bg-brand-forest/10 border border-brand-forest/10 mb-6">
                <Sparkles size={14} className="text-brand-forest" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-forest">Administrative Command Center</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black text-ui-text-main tracking-tighter leading-[1.1]">
                Welcome back, <span className="text-brand-forest"> {user?.email?.split('@')[0] || 'Administrator'}</span>
            </h1>
            <p className="text-lg md:text-xl text-ui-text-muted max-w-2xl mx-auto font-medium leading-relaxed mt-6">
                The SuviX core systems are live and operational. Your secure administrative portal is now fully synchronized with real-time financial protocols.
            </p>
        </motion.div>

        {/* Action Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full"
        >
          {QUICK_ACTIONS.map((action, index) => (
            <button 
              key={index}
              onClick={() => router.push(action.path)}
              className="bento-card group p-8 text-left hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden"
            >
               <div className={`w-12 h-12 rounded-2xl ${action.bg} flex items-center justify-center mb-6 border border-ui-border`}>
                  <action.icon size={22} className={action.color} />
               </div>
               <h3 className="text-lg font-bold text-ui-text-main mb-2 flex items-center gap-2">
                  {action.title}
                  <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-forest" />
               </h3>
               <p className="text-sm text-ui-text-dim font-medium leading-relaxed">{action.desc}</p>
               
               {/* Background Accent */}
               <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${action.bg} opacity-0 group-hover:opacity-100 transition-opacity blur-2xl`} />
            </button>
          ))}
        </motion.div>

        {/* Footer Stats Banner */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.9 }}
           className="mt-20 py-8 border-y border-ui-border w-full flex flex-wrap items-center justify-center gap-12 md:gap-24"
        >
            <div className="flex items-center gap-3">
                <Zap size={18} className="text-brand-forest" />
                <div className="text-left">
                    <p className="text-[10px] font-bold text-ui-text-dim uppercase tracking-widest">System Latency</p>
                    <p className="text-sm font-black text-ui-text-main">0.04ms</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Shield size={18} className="text-brand-forest" />
                <div className="text-left">
                    <p className="text-[10px] font-bold text-ui-text-dim uppercase tracking-widest">Security Level</p>
                    <p className="text-sm font-black text-ui-text-main">Protocol 2A</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Globe size={18} className="text-brand-forest" />
                <div className="text-left">
                    <p className="text-[10px] font-bold text-ui-text-dim uppercase tracking-widest">Global Hubs</p>
                    <p className="text-sm font-black text-ui-text-main">18 Active</p>
                </div>
            </div>
        </motion.div>
      </motion.div>
    </div>
  );
}