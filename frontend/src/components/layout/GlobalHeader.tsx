import { Search, Bell, Plus, Sun, Moon, Sparkles, Crown, Zap, Gem, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme }  from '../../hooks/useTheme';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useSubscription } from '../../hooks/useSubscription';
import { useState, useEffect, useRef } from 'react';
import { SearchDropdown } from './SearchDropdown';
import darkLogo  from '../../assets/darklogo.png';
import lightLogo from '../../assets/lightlogo.png';
import defaultProfile from '../../assets/defaultprofile.png';

export const GlobalHeader = ({ onMenuPress }: { onMenuPress?: () => void }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const user = useSelector(selectUser);
  const { tier, isPremium } = useSubscription();
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Global keydown listeners for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
      // Focus search on forward slash (/) when not focusing inputs
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userData = {
    name: user?.name || 'User',
    username: user?.username || 'user',
    avatar: user?.profilePicture || defaultProfile,
  };

  return (
    <header className={`h-14 w-full shrink-0 border-b border-border-main flex items-center px-4 lg:px-6 z-50 relative ${isDarkMode ? 'bg-black' : 'bg-nav'}`}>

      {/* ── Mobile layout ─────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between w-full gap-3">
        {/* Mobile Search Overlay */}
        {isMobileSearchExpanded && (
          <div className="absolute inset-0 px-4 flex items-center gap-3 bg-page z-50 rounded-lg animate-in fade-in duration-200">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`
                  w-full h-9 rounded-full pl-9 pr-10 text-[13px] focus:outline-none border
                  ${isDarkMode ? 'bg-[#0f0f12] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-955'}
                `}
              />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 animate-in fade-in duration-100"
                >
                  ✕
                </button>
              )}
              
              {/* Inline Search Dropdown for mobile */}
              <SearchDropdown 
                query={query} 
                setQuery={setQuery}
                onClose={() => {
                  setIsMobileSearchExpanded(false);
                  setQuery('');
                }} 
              />
            </div>
            <button 
              onClick={() => {
                setIsMobileSearchExpanded(false);
                setQuery('');
              }}
              className="text-xs font-bold text-zinc-500"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Hamburger */}
        <button 
          onClick={onMenuPress}
          className="p-1.5 rounded-lg text-text-muted hover:bg-border-secondary hover:text-text-main transition-colors flex flex-col gap-[3px]" 
          aria-label="Menu"
        >
          <div className="w-[22px] h-[3px] bg-current rounded-full" />
          <div className="w-[16px] h-[3px] bg-current rounded-full" />
          <span className="text-[8px] font-bold tracking-[0.1em] mt-[1px] leading-none text-current">MENU</span>
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
            onClick={() => setIsMobileSearchExpanded(true)}
            className="p-1.5 rounded-lg text-text-muted hover:bg-border-secondary hover:text-text-main transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-text-muted hover:bg-border-secondary hover:text-text-main transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={() => navigate('/notifications')}
            className="p-1.5 rounded-lg text-text-muted hover:bg-border-secondary hover:text-text-main transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-nav" />
          </button>

          {!isPremium && (
            <button 
              onClick={() => navigate('/subscription')}
              className="p-1.5 ml-1 rounded-lg text-yellow-500 hover:bg-yellow-500/10 transition-colors"
            >
              <div className="relative">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
            </button>
          )}

          {isPremium && (
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ml-1 flex items-center gap-1 border ${
              tier === 'creator' ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border-emerald-500/30 text-emerald-400' :
              tier === 'pro' ? 'bg-gradient-to-r from-indigo-500/15 to-blue-500/15 border-indigo-500/30 text-indigo-400' :
              'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/40 text-yellow-400 shadow-sm'
            }`}>
              {tier === 'creator' && <Sparkles size={8} className="text-emerald-400" />}
              {tier === 'pro' && <Zap size={8} className="text-indigo-400" />}
              {tier === 'elite' && <Gem size={8} className="text-yellow-400 animate-pulse" />}
              <span>{tier}</span>
            </div>
          )}

          <div className="w-7 h-7 rounded-full border border-border-main overflow-hidden ml-1 cursor-pointer relative">
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
          <div ref={searchContainerRef} className="relative w-full max-w-md group">
            <Search
              size={14}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                isDarkMode 
                  ? 'text-text-muted group-focus-within:text-text-main' 
                  : 'text-zinc-500 group-focus-within:text-zinc-700'
              }`}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search creators, jobs, or inspiration…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className={`
                w-full h-9 rounded-full pl-9 pr-12 text-[13px]
                focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500
                transition-all border
                ${isDarkMode 
                  ? 'bg-[#0f0f12] border-zinc-850 text-white placeholder:text-zinc-650 focus:border-zinc-700' 
                  : 'bg-white border-zinc-200 text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-350'
                }
              `}
            />
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border opacity-40 group-focus-within:opacity-100 transition-opacity ${
              isDarkMode 
                ? 'border-zinc-800 bg-zinc-900 text-zinc-400' 
                : 'border-zinc-200 bg-zinc-50 text-zinc-500'
            }`}>
              <span className="text-[10px] font-bold">⌘</span>
              <span className="text-[10px] font-bold">K</span>
            </div>

            {/* Dropdown list exactly below the input */}
            {isSearchFocused && (
              <SearchDropdown 
                query={query} 
                setQuery={setQuery}
                onClose={() => setIsSearchFocused(false)} 
              />
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Subscription Badge */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/subscription');
              }}
              className="relative z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7c42f8] text-white hover:bg-[#6b35e0] transition-all duration-200 active:scale-[0.98] shadow-[0_2px_8px_rgba(124,66,248,0.25)] group shrink-0 mr-2 cursor-pointer pointer-events-auto"
            >
              {tier === 'free' && <Crown size={12} className="text-white fill-white/10" />}
              {tier === 'creator' && <Sparkles size={12} className="text-white fill-white/10" />}
              {tier === 'pro' && <Zap size={12} className="text-white fill-white/10" />}
              {tier === 'elite' && <Gem size={12} className="text-white fill-white/10" />}
              
              <span className="text-[10.5px] font-black uppercase tracking-wider leading-none">
                {tier === 'free' ? 'Upgrade' : `${tier}`}
              </span>
              
              <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors ml-0.5">
                <ChevronRight size={10} className="text-white stroke-[3.5]" />
              </div>
            </button>

            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-border-secondary hover:text-text-main transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={() => navigate('/notifications')}
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
          
          {/* Profile Details */}

          <div className="text-right hidden xl:block">
            <p className="text-[12px] font-semibold text-text-main leading-tight">{userData.name}</p>
            <p className="text-[11px] text-text-muted leading-tight">@{userData.username}</p>
          </div>
          <div className="w-8 h-8 rounded-full border border-border-main overflow-hidden cursor-pointer hover:ring-2 hover:ring-border-main transition-all relative">
            <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};