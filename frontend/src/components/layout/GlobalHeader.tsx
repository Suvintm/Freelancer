import { Search, Bell, Plus, Sun, Moon, Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';
import logo from '../../assets/whitebglogo.png';

export const GlobalHeader = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="h-16 lg:h-20 w-full bg-nav border-b border-border-main flex items-center px-4 lg:px-8 z-50 transition-all duration-300">
      {/* 1. Left Section: Logo & Mobile Menu */}
      <div className="flex items-center gap-3 w-auto lg:w-72">
        <button className="lg:hidden p-2 text-text-muted hover:text-text-main transition-colors">
          <Menu size={20} />
        </button>
        <img src={logo} alt="SuviX" className="h-6 lg:h-8 w-auto brightness-0 dark:invert" />
      </div>

      {/* 2. Middle Section: Search & Actions */}
      <div className="flex-1 px-2 lg:px-8 flex items-center justify-between">
        <div className="hidden sm:flex flex-1 max-w-xl">
          <div className="relative group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-text-main" size={16} />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full h-10 lg:h-11 bg-border-secondary border border-border-main rounded-full lg:rounded-[20px] pl-12 pr-4 text-[13px] text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 lg:gap-4 ml-auto lg:ml-6">
          <div className="flex items-center gap-0.5 lg:gap-1.5">
            {/* Search Icon for Mobile (since input is hidden) */}
            <button className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:bg-border-secondary transition-all">
              <Search size={18} />
            </button>

            <button 
              onClick={toggleTheme}
              className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl text-text-muted hover:bg-border-secondary transition-all"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button className="hidden xs:flex w-9 h-9 lg:w-10 lg:h-10 items-center justify-center rounded-xl text-text-muted hover:bg-border-secondary relative transition-all">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full border border-nav" />
            </button>
          </div>
          
          <div className="hidden sm:block w-px h-6 bg-border-main mx-1 lg:mx-2" />
          
          <Button className="h-9 lg:h-11 px-3 lg:px-6 rounded-full lg:rounded-[20px] bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-[11px] lg:text-[13px] shadow-lg shadow-orange-500/10 gap-1 lg:gap-2 active:scale-95 transition-all">
            <Plus size={16} strokeWidth={4} />
            <span className="hidden xs:inline">Create</span>
          </Button>
        </div>
      </div>

      {/* 3. Right Section: Navigation Identity (Desktop Only) */}
      <div className="hidden lg:flex w-64 items-center justify-end px-4">
        <span className="text-text-muted text-[10px] uppercase font-black tracking-[0.2em]">Navigation</span>
      </div>
    </header>
  );
};
