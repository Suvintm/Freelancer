'use client';

import { 
  Users, 
  Activity, 
  ShieldCheck, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    { name: 'Active Admins', value: '4', change: '+1', status: 'up', icon: Users },
    { name: 'Security Events', value: '12', change: '-24%', status: 'down', icon: ShieldCheck },
    { name: 'System Uptime', value: '99.98%', change: 'Stable', status: 'neutral', icon: Activity },
    { name: 'Blocked IPs', value: '1,248', change: '+82', status: 'up', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Welcome Section */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-500 mb-1">System Overview</h2>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{user?.email?.split('@')[0]}</span>
        </h1>
        <p className="text-slate-400 mt-2 max-w-2xl">
          Your administrative session is secure. Performance and security metrics are healthy across all nodes.
        </p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="premium-card p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <stat.icon className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex items-center gap-1">
                {stat.status === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                ) : stat.status === 'down' ? (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-500" />
                )}
                <span className={`text-xs font-bold ${
                  stat.status === 'up' ? 'text-emerald-500' : 
                  stat.status === 'down' ? 'text-red-500' : 'text-slate-500'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.name}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-white">Recent Audit Logs</h3>
            <button className="text-sm font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
              View All <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          
          <div className="premium-card overflow-hidden">
            <div className="divide-y divide-slate-800/50">
              {[
                { event: 'Super Admin Login', user: 'admin@suvix.com', time: '2 mins ago', ip: '127.0.0.1' },
                { event: 'MFA Activated', user: 'moderator@suvix.com', time: '45 mins ago', ip: '192.168.1.5' },
                { event: 'IP Whitelist Updated', user: 'admin@suvix.com', time: '2 hours ago', ip: '127.0.0.1' },
                { event: 'New Role Created', user: 'manager@suvix.com', time: '5 hours ago', ip: '103.45.12.9' },
              ].map((log, i) => (
                <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center font-bold text-blue-500">
                      {log.event[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{log.event}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{log.user}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-400">{log.time}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600 mt-1 font-bold">{log.ip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Summary Card */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white px-2">Identity Guard</h3>
          <div className="premium-card p-8 bg-gradient-to-br from-slate-900 to-blue-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 border-l border-b border-blue-500/20 rounded-bl-3xl bg-blue-600/10">
              <ShieldCheck className="w-8 h-8 text-blue-500" />
            </div>
            
            <h4 className="text-lg font-bold text-white mb-2">MFA Status</h4>
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              FULLY PROTECTED
            </div>
            
            <p className="text-sm text-slate-400 leading-relaxed mb-8">
              Your account is currently secured with hardware-based 2FA and RS256 high-security signing. No suspicious activity detected.
            </p>
            
            <button className="btn-primary w-full py-2.5 text-xs">
              View Security Audit
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
