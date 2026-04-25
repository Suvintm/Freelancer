'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Activity, ShieldCheck, ShieldAlert,
  Settings, LogOut, Bell, Search, Menu, ChevronRight, Mail, HelpCircle, 
  Share2, ChevronDown
} from 'lucide-react';
import AuthGuard from '@/components/auth-guard';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV = [
  {
    section: 'MAIN MENU',
    items: [
      { label: 'Home',        icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Overview',    icon: Activity,        path: '/dashboard/overview' },
      { label: 'Analytics',    icon: ShieldCheck,     path: '/dashboard/analytics' },
      { label: 'Transactions', icon: ShieldAlert,     path: '/dashboard/tx' },
    ],
  },
  {
    section: 'FEATURES',
    items: [
      { label: 'Recurring',     icon: Bell,      path: '/dashboard/recurring' },
      { label: 'Subscriptions', icon: Users,     path: '/dashboard/subs' },
      { label: 'Feedback',      icon: HelpCircle, path: '/dashboard/feedback' },
    ],
  },
  {
    section: 'GENERAL',
    items: [
        { label: 'Settings',  icon: Settings,   path: '/dashboard/settings' },
        { label: 'Help Desk', icon: HelpCircle, path: '/dashboard/help' },
    ],
  },
];

function NavItem({ item, isActive, collapsed, onClick }: {
  item: { label: string; icon: React.ElementType; path: string };
  isActive: boolean; collapsed: boolean; onClick?: () => void;
}) {
  const router = useRouter();
  const Icon   = item.icon;
  
  return (
    <button
      onClick={() => { router.push(item.path); if(onClick) onClick(); }}
      className={`
        relative w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold transition-all duration-200 group
        ${isActive ? 'bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-xl' : 'text-ui-text-muted hover:text-ui-text-main dark:hover:text-zinc-100'}
      `}
    >
      <Icon size={18} className={`shrink-0 transition-colors ${isActive ? 'text-white dark:text-black' : 'text-ui-text-dim group-hover:text-ui-text-main dark:group-hover:text-zinc-300'}`} />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.label === 'Analytics' && (
          <span className="ml-auto text-[10px] text-ui-text-dim">20</span>
      )}
    </button>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); router.push('/auth/login'); };
  const pageTitle = NAV.flatMap((s) => s.items).find((i) => i.path === pathname)?.label ?? 'Dashboard';

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-ui-bg text-ui-text-main transition-colors duration-300">
        
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
            {mobileOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all"
                />
            )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ 
            width: collapsed ? 100 : 280,
            x: mobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0)
          }}
          className={`
            fixed top-0 bottom-0 left-0 z-50 lg:relative flex flex-col bg-ui-surface border-r border-ui-border transition-all
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Brand Logo */}
          <div className="h-24 flex items-center px-8 shrink-0">
            <Image src="/logo.png" alt="Logo" width={120} height={48} className="max-h-12 w-auto object-contain dark:invert dark:brightness-200" />
          </div>

          <nav className="flex-1 py-4 px-5 overflow-y-auto sidebar-scroll space-y-8">
            {NAV.map((section) => (
              <div key={section.section}>
                {!collapsed && (
                    <p className="px-4 mb-3 text-[10px] font-extrabold text-ui-text-dim tracking-wider transition-opacity">{section.section}</p>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavItem 
                        key={item.path} 
                        item={item} 
                        isActive={pathname === item.path} 
                        collapsed={collapsed}
                        onClick={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer Card */}
          {!collapsed && (
              <div className="mx-6 mb-6 p-6 rounded-[1.5rem] bg-ui-bg border border-ui-border shadow-inner">
                  <h4 className="text-[13px] font-bold text-ui-text-main mb-1">Upgrade Pro! 👑</h4>
                  <p className="text-[11px] text-ui-text-muted mb-4 leading-relaxed">Higher productivity with better organization</p>
                  <button className="w-full py-2.5 bg-brand-forest text-white text-[11px] font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-900/10 transition-all flex items-center justify-center gap-2">
                      Upgrade
                  </button>
              </div>
          )}

          <div className="p-6 border-t border-ui-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-semibold text-ui-text-muted hover:text-red-500 transition-all"
            >
              <LogOut size={18} />
              {!collapsed && <span>Log out</span>}
            </button>
          </div>
        </motion.aside>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0 bg-ui-bg relative overflow-y-auto">
          
          {/* Modern Top Header */}
          <header className="h-24 flex items-center justify-between px-8 z-30 shrink-0 sticky top-0 bg-ui-bg/80 backdrop-blur-xl border-b border-ui-border">
            <div className="flex items-center gap-6">
                <button 
                    onClick={() => { if(window.innerWidth < 1024) setMobileOpen(true); else setCollapsed(!collapsed); }}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-ui-surface border border-ui-border text-ui-text-dim hover:text-ui-text-main shadow-sm transition-all"
                >
                    <Menu size={18} />
                </button>
                
                {/* Breadcrumbs */}
                <div className="hidden sm:flex items-center gap-3">
                    <div className="flex items-center gap-2 text-ui-text-dim text-sm">
                        <span className="hover:text-ui-text-main cursor-pointer">Finance Hub</span>
                        <ChevronRight size={14} />
                        <span className="text-ui-text-main font-bold">{pageTitle}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Search */}
                <div className="hidden md:flex items-center gap-3 h-12 px-5 rounded-2xl bg-ui-surface border border-ui-border shadow-sm w-72 focus-within:ring-2 focus-within:ring-brand-forest/10 focus-within:border-brand-forest/30 transition-all">
                    <Search size={16} className="text-ui-text-dim" />
                    <input type="text" placeholder="Search..." className="bg-transparent outline-none text-xs font-semibold w-full placeholder:text-ui-text-dim text-ui-text-main" />
                    <kbd className="text-[10px] font-bold text-ui-text-dim bg-ui-bg px-1.5 py-0.5 rounded border border-ui-border ml-2">⌘K</kbd>
                </div>

                {/* Utils */}
                <div className="flex items-center gap-4 border-l border-ui-border pl-6">
                    <ThemeToggle />
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-ui-surface border border-ui-border text-ui-text-dim hover:text-ui-text-main transition-all"><HelpCircle size={18} /></button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-ui-surface border border-ui-border text-ui-text-dim hover:text-ui-text-main transition-all"><Mail size={18} /></button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-ui-surface border border-ui-border text-ui-text-dim hover:text-ui-text-main transition-all relative">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-ui-surface rounded-full" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 border-l border-ui-border pl-6">
                    <button className="flex items-center gap-3 hover:bg-ui-surface p-1.5 rounded-2xl transition-all group overflow-hidden border border-transparent hover:border-ui-border">
                        <div className="w-9 h-9 rounded-full bg-ui-bg overflow-hidden border border-ui-border">
                             <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" width={36} height={36} unoptimized />
                        </div>
                        <ChevronDown size={14} className="text-ui-text-dim group-hover:text-ui-text-main transition-colors mr-1" />
                    </button>
                    <button className="hidden sm:flex items-center gap-2 h-11 px-6 rounded-xl bg-brand-forest text-white text-xs font-bold shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <Share2 size={14} /> Share
                    </button>
                </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 px-8 pb-12">
             <div className="max-w-[1600px] mx-auto py-8">
                {children}
             </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}