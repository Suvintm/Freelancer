import { Search, Bell, Plus, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';
import whiteLogo from '../../assets/whitebglogo.png';
import blackLogo from '../../assets/blackbglogo.png';
import auth1 from '../../assets/auth/auth_1.png';

export const GlobalHeader = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="h-16 lg:h-20 w-full bg-nav border-b border-border-main flex items-center px-4 lg:px-8 z-50 transition-all duration-300 relative">
      {/* ── MOBILE VIEW (Centered Logo Style) ── */}
      <div className="lg:hidden flex items-center justify-between w-full">
        {/* Left: Menu */}
        <button className="p-2 text-text-main">
          <div className="flex flex-col gap-1 w-5">
            <div className="h-0.5 w-full bg-current rounded-full" />
            <div className="h-0.5 w-3/4 bg-current rounded-full" />
            <div className="h-0.5 w-full bg-current rounded-full" />
          </div>
        </button>

        {/* Center: Absolute Logo (Adaptive) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <img 
            src={isDarkMode ? whiteLogo : blackLogo} 
            alt="SuviX" 
            className="h-6 w-auto transition-all duration-500" 
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-2 text-text-muted">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="p-2 text-text-muted relative">
            <Bell size={20} />
            <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-nav" />
          </button>
          <div className="w-8 h-8 rounded-full border border-blue-500/50 p-0.5 ml-1">
            <img src={auth1} alt="Profile" className="w-full h-full rounded-full object-cover" />
          </div>
        </div>
      </div>

      {/* ── DESKTOP VIEW (Standard 3-Section Style) ── */}
      <div className="hidden lg:flex items-center w-full">
        {/* 1. Left Section: Logo (Adaptive) */}
        <div className="w-72 flex items-center">
          <img 
            src={isDarkMode ? whiteLogo : blackLogo} 
            alt="SuviX" 
            className="h-8 w-auto transition-all duration-500" 
          />
        </div>

        {/* 2. Middle Section: Search & Actions */}
        <div className="flex-1 px-8 flex items-center justify-between">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-text-main" size={16} />
              <input 
                type="text" 
                placeholder="Search creators, jobs, or inspiration..."
                className="w-full h-11 bg-border-secondary border border-border-main rounded-[20px] pl-12 pr-4 text-[13px] text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-6">
            <div className="flex items-center gap-1.5">
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-text-muted hover:bg-border-secondary hover:text-text-main transition-all"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button className="w-10 h-10 flex items-center justify-center rounded-xl text-text-muted hover:bg-border-secondary hover:text-text-main transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-nav" />
              </button>
            </div>
            
            <div className="w-px h-6 bg-border-main mx-2" />
            
            <Button className="h-11 px-6 rounded-[20px] bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-black text-[13px] shadow-lg shadow-orange-500/10 gap-2 active:scale-95 transition-all">
              <Plus size={16} strokeWidth={4} />
              Create a post
            </Button>
          </div>
        </div>

        {/* 3. Right Section: Identity Indicator */}
        <div className="w-64 flex items-center justify-end px-4">
          <span className="text-text-muted text-[10px] uppercase font-black tracking-[0.2em]">Navigation</span>
        </div>
      </div>
    </header>
  );
};
