import React, { useState } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Bell, 
  Eye, 
  Camera, 
  Globe, 
  LogOut,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function Settings() {
  const [activeCategory, setActiveCategory] = useState('profile');
  const { isDarkMode, toggleTheme } = useTheme();

  const CATEGORIES = [
    { id: 'profile',      label: 'Edit Profile',    icon: User,          description: 'Username, bio, and social links' },
    { id: 'account',      label: 'Account',         icon: SettingsIcon,  description: 'Email, phone, and password' },
    { id: 'security',     label: 'Privacy & Security', icon: ShieldCheck, description: '2FA and login activity' },
    { id: 'notifications', label: 'Notifications',  icon: Bell,          description: 'Push, email, and SMS alerts' },
    { id: 'display',      label: 'Display',         icon: Eye,           description: 'Theme and appearance' },
    { id: 'creator',      label: 'Creator Hub',     icon: Globe,         description: 'Verification and payouts' },
  ];

  return (
    <div className="absolute inset-0 z-[60] bg-container flex flex-col lg:flex-row gap-4 p-2 lg:p-3 overflow-hidden overscroll-none">
      
      {/* 1. Sidebar Navigation (30% Ratio) - FIXED & ISOLATED */}
      <aside className="w-full lg:w-[32%] h-full flex flex-col overflow-hidden bg-border-secondary/20 rounded-[40px] p-4 lg:p-5 border border-border-main/50 relative">
        {/* FIXED HEADER */}
        <div className="shrink-0 mb-6 px-2">
          <h1 className="text-3xl font-medium text-text-main tracking-tighter font-display uppercase">Settings</h1>
        </div>

        {/* INDEPENDENT SCROLLABLE LIST */}
        <div 
          data-lenis-prevent
          className="flex-1 overflow-y-auto scrollbar-thin overscroll-contain touch-pan-y space-y-2 pr-2"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
                activeCategory === cat.id 
                ? 'bg-accent-primary text-white shadow-xl shadow-accent-primary/20 scale-[1.02] ring-1 ring-white/20' 
                : 'text-text-muted hover:bg-border-secondary hover:text-text-main hover:pl-6'
              }`}
            >
              <cat.icon size={20} className={activeCategory === cat.id ? 'text-white' : 'group-hover:text-accent-primary transition-colors'} />
              <div className="text-left">
                <p className="text-[13px] font-medium leading-none mb-1.5 tracking-tight uppercase">{cat.label}</p>
                <p className={`text-[10px] font-medium opacity-50 ${activeCategory === cat.id ? 'text-white/80' : ''}`}>
                  {cat.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* FIXED FOOTER */}
        <div className="shrink-0 pt-4 px-2 mt-auto border-t border-border-main/30">
          <button className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all font-medium text-[13px] uppercase tracking-wider group">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area (70% Ratio) - FIXED & ISOLATED */}
      <main className="flex-1 h-full bg-border-secondary/10 border border-border-main/50 rounded-[40px] shadow-sm relative overflow-hidden flex flex-col min-w-0">
        <div 
          data-lenis-prevent
          className="flex-1 overflow-y-auto scrollbar-thin overscroll-contain touch-pan-y p-6 lg:p-8 relative"
        >
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/[0.04] blur-[150px] pointer-events-none" />

          <div className="max-w-2xl mx-auto">
            {activeCategory === 'profile' && (
              <div className="space-y-12">
                <header className="space-y-2">
                  <h2 className="text-[32px] font-medium text-text-main tracking-tighter uppercase leading-none font-display">Edit Profile</h2>
                  <p className="text-[14px] text-text-muted font-medium">Control your digital identity and public brand identity.</p>
                </header>

                {/* Avatar Section - Premium Focus */}
                <div className="flex flex-col gap-10">
                  <div className="relative group w-40 h-40 mx-auto lg:mx-0">
                    <div className="w-full h-full rounded-full border-4 border-border-secondary bg-border-secondary overflow-hidden shadow-2xl ring-2 ring-white/5 p-1.5 transition-all group-hover:ring-accent-primary/20">
                      <img 
                        src="https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=400" 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-3"
                      />
                    </div>
                    <button className="absolute bottom-2 right-2 w-12 h-12 bg-accent-primary rounded-full border-4 border-container flex items-center justify-center text-white shadow-xl hover:scale-110 hover:rotate-12 active:scale-90 transition-all">
                      <Camera size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-medium text-text-main uppercase tracking-[0.3em] px-1 font-display">Display Name</label>
                      <input 
                        type="text" 
                        defaultValue="SuviX Creator" 
                        className="w-full h-14 bg-border-secondary/40 border border-border-main rounded-2xl px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:bg-border-secondary transition-all text-text-main"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-medium text-text-main uppercase tracking-[0.3em] px-1 font-display">Username</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">@</span>
                        <input 
                          type="text" 
                          defaultValue="suvix.official" 
                          className="w-full h-14 bg-border-secondary/40 border border-border-main rounded-2xl pl-10 pr-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:bg-border-secondary transition-all text-text-main"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-medium text-text-main uppercase tracking-[0.3em] px-1 font-display">Bio</label>
                    <textarea 
                      rows={5}
                      className="w-full bg-border-secondary/40 border border-border-main rounded-2xl p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:bg-border-secondary transition-all resize-none leading-relaxed text-text-main"
                      placeholder="Tell your story..."
                    />
                  </div>

                  <div className="flex justify-end pt-8">
                    <button className="h-14 px-12 rounded-full bg-accent-primary text-white text-[14px] font-medium uppercase tracking-[0.2em] shadow-2xl shadow-accent-primary/30 hover:scale-[1.05] active:scale-95 transition-all font-display">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'display' && (
              <div className="space-y-12">
                <header className="space-y-2">
                  <h2 className="text-[32px] font-medium text-text-main tracking-tighter uppercase leading-none font-display">Appearance</h2>
                  <p className="text-[14px] text-text-muted font-medium">Personalize your SuviX dashboard experience.</p>
                </header>

                <div className="space-y-10">
                  {/* Theme Selector */}
                  <div className="space-y-6">
                    <label className="text-[11px] font-medium text-text-main uppercase tracking-[0.3em] px-1 font-display">Theme Preference</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <button 
                        onClick={() => !isDarkMode && toggleTheme()}
                        className={`flex items-center gap-5 p-6 rounded-[32px] border-2 transition-all ${!isDarkMode ? 'border-accent-primary bg-accent-primary/5 shadow-inner' : 'border-border-main hover:border-text-muted/30'}`}
                      >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${!isDarkMode ? 'bg-accent-primary text-white shadow-xl' : 'bg-border-secondary text-text-muted'}`}>
                          <Sun size={26} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-text-main uppercase tracking-tight font-display">Light Mode</p>
                          <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest mt-1">Daylight mode</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => isDarkMode && toggleTheme()}
                        className={`flex items-center gap-5 p-6 rounded-[32px] border-2 transition-all ${isDarkMode ? 'border-accent-primary bg-accent-primary/5 shadow-inner' : 'border-border-main hover:border-text-muted/30'}`}
                      >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-accent-primary text-white shadow-xl' : 'bg-border-secondary text-text-muted'}`}>
                          <Moon size={26} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-text-main uppercase tracking-tight font-display">Dark Mode</p>
                          <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest mt-1">Midnight mode</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* System Default Toggle */}
                  <div className="flex items-center justify-between p-8 bg-border-secondary/20 border border-border-main rounded-[32px] group cursor-pointer hover:bg-border-secondary/40 transition-all border-dashed text-text-main">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-full bg-border-secondary flex items-center justify-center text-text-muted group-hover:text-accent-primary transition-all group-hover:rotate-6">
                        <Laptop size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-medium uppercase tracking-tight font-display">Sync with system</p>
                        <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest mt-1">Match OS settings</p>
                      </div>
                    </div>
                    <div className="w-14 h-7 rounded-full bg-border-main relative p-1.5 cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCategory !== 'profile' && activeCategory !== 'display' && (
              <div className="h-[500px] flex flex-col items-center justify-center opacity-80 text-center space-y-8">
                <div className="relative">
                  <div className="absolute inset-0 blur-2xl bg-accent-primary/20 scale-150 animate-pulse" />
                  <SettingsIcon size={80} strokeWidth={1} className="relative animate-[spin_15s_linear_infinite] text-text-main" />
                </div>
                <div className="space-y-3">
                  <p className="text-3xl font-medium tracking-[0.4em] uppercase text-text-main font-display">Under Construction</p>
                  <p className="text-[12px] font-medium text-text-muted uppercase tracking-[0.25em] font-display">This section is being precision engineered</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
