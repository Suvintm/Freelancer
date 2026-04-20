'use client';

import { 
  Users, 
  ShieldCheck, 
  Activity, 
  Settings, 
  LogOut, 
  Menu, 
  Bell, 
  Search,
  LayoutDashboard,
  ShieldAlert
} from 'lucide-react';
import { useState } from 'react';
import AuthGuard from '@/components/auth-guard';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Admin Management', icon: Users, path: '/dashboard/admins' },
    { name: 'Audit Logs', icon: Activity, path: '/dashboard/logs' },
    { name: 'Security Settings', icon: ShieldCheck, path: '/dashboard/security' },
    { name: 'System Roles', icon: ShieldAlert, path: '/dashboard/roles' },
    { name: 'Configuration', icon: Settings, path: '/dashboard/settings' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-hidden font-sans">
        
        {/* SIDEBAR */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 280 : 80 }}
          className="glass h-screen sticky top-0 left-0 border-r border-slate-800/50 flex flex-col z-50 overflow-hidden"
        >
          {/* Logo Section */}
          <div className="h-20 flex items-center px-6 gap-4 border-b border-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-bold text-xl tracking-tight text-white whitespace-nowrap"
                >
                  SuviX <span className="text-blue-500">Admin</span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.path)}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative",
                    isActive 
                      ? "bg-blue-600/10 text-blue-400" 
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                    isActive && "text-blue-500"
                  )} />
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-slate-800/50 space-y-2">
             <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {isSidebarOpen && <span className="text-sm font-medium">Log Out</span>}
            </button>
          </div>
        </motion.aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          
          {/* HEADER */}
          <header className="h-20 glass sticky top-0 z-40 border-b border-slate-800/50 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="p-2 mr-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="hidden md:flex items-center bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 w-80 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <Search className="w-4 h-4 text-slate-500 mr-2" />
                <input 
                  type="text" 
                  placeholder="Global Search..." 
                  className="bg-transparent border-none outline-none text-sm w-full text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors group">
                <Bell className="w-6 h-6 text-slate-400 group-hover:text-white" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#020617]" />
              </button>

              <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-white leading-tight">{user?.email}</p>
                  <p className="text-xs text-blue-500 font-medium uppercase tracking-tighter">{user?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-slate-800 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform">
                  {user?.email?.[0].toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className="p-8 pb-12">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
