import { Search, Bell, Plus, Sun, Moon, Menu } from 'lucide-react';
import { useTheme }  from '../../hooks/useTheme';
import { useAuthStore } from '../../store/useAuthStore';
import darkLogo  from '../../assets/darklogo.png';
import lightLogo from '../../assets/lightlogo.png';
import auth1     from '../../assets/auth/auth_1.png';

export const GlobalHeader = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuthStore();

  const userData = {
    name: user?.name || 'User',
    username: user?.username || 'user',
    avatar: user?.profilePicture || auth1,
  };

  return (
    <header className="h-14 w-full shrink-0 bg-nav border-b border-border-main flex items-center px-4 lg:px-6 z-50 relative">

      {/* ── Mobile layout ─────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between w-full gap-3">
        {/* Hamburger */}
        <button className="p-1.5 rounded-lg text-text-muted hover:bg-border-secondary hover:text-text-main transition-colors" aria-label="Menu">
          <Menu size={20} />
        </button>

        {/* Centred logo */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <img
            src={isDarkMode ? darkLogo : lightLogo}
            alt="SuviX"
            className="h-7 w-auto"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-text-muted hover:bg-border-secondary hover:text-text-main transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="p-1.5 rounded-lg text-text-muted hover:bg-border-secondary hover:text-text-main transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-nav" />
          </button>

          <div className="w-7 h-7 rounded-full border border-border-main overflow-hidden ml-1 cursor-pointer">
            <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* ── Desktop layout ─────────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[296px_1fr_232px] items-center w-full">

        {/* 1. Logo — aligns with left sidebar */}
        <div className="flex items-center pl-2">
          <img
            src={isDarkMode ? darkLogo : lightLogo}
            alt="SuviX"
            className="h-8 w-auto"
          />
        </div>

        {/* 2. Search bar with Power-User Hint */}
        <div className="flex items-center gap-4 px-6">
          <div className="relative w-full max-w-md group">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-text-main transition-colors"
            />
            <input
              type="text"
              placeholder="Search creators, jobs, or inspiration…"
              className="
                w-full h-9 bg-border-secondary border border-border-main rounded-full
                pl-9 pr-12 text-[13px] text-text-main placeholder:text-text-muted
                focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary/40
                transition-all
              "
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border-main bg-container opacity-40 group-focus-within:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-text-muted">⌘</span>
              <span className="text-[10px] font-bold text-text-muted">K</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Live Status */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/5 border border-green-500/10 mr-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live</span>
            </div>

            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-border-secondary hover:text-text-main transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-border-secondary hover:text-text-main transition-colors relative"
              aria-label="Notifications"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full border-2 border-nav" />
            </button>
          </div>

          <div className="h-5 w-px bg-border-main shrink-0" />

          {/* Wallet / Earnings Summary */}
          <div className="flex flex-col items-end px-2 group cursor-pointer">
            <p className="text-[11px] font-black text-text-main leading-tight tracking-tight group-hover:text-blue-500 transition-colors">$0.00</p>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider opacity-60">Balance</p>
          </div>

          <button className="
            inline-flex items-center gap-1.5 h-8 px-4 rounded-full
            bg-gradient-to-r from-orange-500 to-rose-500
            hover:from-orange-600 hover:to-rose-600
            text-white text-[12px] font-semibold
            shadow-sm active:scale-[0.98] transition-all shrink-0
          ">
            <Plus size={13} strokeWidth={2.5} />
            Create post
          </button>
        </div>

        {/* 3. Right identity — aligns with right sidebar */}
        <div className="flex items-center justify-end gap-3 pr-4">
          <div className="text-right hidden xl:block">
            <p className="text-[12px] font-semibold text-text-main leading-tight">{userData.name}</p>
            <p className="text-[11px] text-text-muted leading-tight">@{userData.username}</p>
          </div>
          <div className="w-8 h-8 rounded-full border border-border-main overflow-hidden cursor-pointer hover:ring-2 hover:ring-border-main transition-all">
            <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};