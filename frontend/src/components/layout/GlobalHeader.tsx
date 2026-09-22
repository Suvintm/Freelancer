import { 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Sparkles, 
  MessageSquare, 
  ChevronDown, 
  Wand2, 
  User as UserIcon, 
  Settings, 
  CreditCard, 
  LogOut,
  Plus 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, clearAuth } from '../../store/slices/authSlice';
import { useState, useEffect, useRef } from 'react';
import { SearchDropdown } from './SearchDropdown';
import darkLogo from '../../assets/darklogo.png';
import lightLogo from '../../assets/lightlogo.png';
import defaultProfile from '../../assets/defaultprofile.png';
import { WatchAdsCreditsModal } from './WatchAdsCreditsModal';
import { UserRoleBadge } from './UserRoleBadge';

export const GlobalHeader = ({ onMenuPress }: { onMenuPress?: () => void }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDarkMode, toggleTheme } = useTheme();
  const user = useSelector(selectUser);
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('suvix_user_credits');
    return saved !== null ? parseInt(saved, 10) : (user?.credits ?? 0);
  });

  const handleCreditsEarned = (amount: number) => {
    setCredits((prev) => {
      const next = prev + amount;
      localStorage.setItem('suvix_user_credits', next.toString());
      return next;
    });
  };

  // Dynamically sync credits from user API request (if available) and cache in localStorage
  useEffect(() => {
    const apiCredits = user?.credits ?? user?.credit ?? user?.profile?.credits ?? user?.stats?.credits;
    if (typeof apiCredits === 'number' && !isNaN(apiCredits)) {
      setCredits(apiCredits);
      localStorage.setItem('suvix_user_credits', apiCredits.toString());
    }
  }, [user]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    name: user?.name || 'Suvin T M',
    username: user?.username || 'suvintm',
    avatar: user?.profilePicture || defaultProfile,
  };

  return (
    <header className={`h-16 w-full shrink-0 border-none flex items-center px-4 lg:px-6 z-30 relative transition-colors duration-200 ${
      isDarkMode ? 'bg-black' : 'bg-white'
    }`}>

      {/* ── Mobile layout ─────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between w-full gap-3">
        {/* Mobile Search Overlay */}
        {isMobileSearchExpanded && (
          <div className={`absolute inset-0 px-4 flex items-center gap-3 ${isDarkMode ? 'bg-black' : 'bg-white'} z-50 rounded-lg animate-in fade-in duration-200`}>
            <div className="relative flex-1">
              <Search
                size={16}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDarkMode ? 'text-zinc-400' : 'text-white'
                }`}
              />
              <input
                type="text"
                autoFocus
                placeholder="Search creators, jobs, tools..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`w-full h-9.5 rounded-full pl-9 pr-10 text-[13px] focus:outline-none border ${
                  isDarkMode 
                    ? 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500' 
                    : 'bg-black border-black text-white placeholder:text-zinc-400'
                }`}
              />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  ✕
                </button>
              )}
              
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
              className={`text-xs font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-700'}`}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Hamburger */}
        <button 
          onClick={onMenuPress}
          className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col gap-[3px]" 
          aria-label="Menu"
        >
          <div className="w-[20px] h-[2.5px] bg-current rounded-full" />
          <div className="w-[14px] h-[2.5px] bg-current rounded-full" />
          <span className="text-[8px] font-bold tracking-[0.1em] mt-[1px] leading-none text-current">MENU</span>
        </button>

        {/* Centered logo */}
        <div className="absolute left-1/2 -translate-y-1/2 top-1/2 -translate-x-1/2">
          <Link to="/home">
            <img
              src={isDarkMode ? darkLogo : lightLogo}
              alt="SuviX"
              className="h-7 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Right mobile actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMobileSearchExpanded(true)}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <button
            onClick={() => navigate('/communication-hub')}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Messages"
          >
            <MessageSquare size={18} />
          </button>

          <button
            onClick={() => navigate('/notifications')}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-black" />
          </button>

          <div 
            onClick={() => navigate('/profile')}
            className="w-7 h-7 rounded-full overflow-hidden ml-1 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
          >
            <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* ── Desktop layout (Matches the Reference Image exactly) ───────── */}
      <div className="hidden lg:flex items-center justify-between w-full gap-4">

        {/* Left Side: Logo, Capsule Search Bar & Dynamic Role Badge */}
        <div className="flex items-center flex-1 max-w-[760px] xl:max-w-[860px] gap-2.5 xl:gap-3">
          {/* SuviX Logo */}
          <Link to="/home" className="flex items-center shrink-0 hover:opacity-95 transition-opacity mr-2 xl:mr-4">
            <img
              src={isDarkMode ? darkLogo : lightLogo}
              alt="SuviX"
              className="h-7.5 lg:h-8 w-auto object-contain"
            />
          </Link>

          {/* Capsule Search Bar */}
          <div ref={searchContainerRef} className="relative flex-1 group min-w-[200px]">
            <div className={`relative flex items-center w-full h-10 rounded-full border transition-all ${
              isDarkMode 
                ? 'bg-[#18181B] hover:bg-[#202024] focus-within:bg-[#09090B] border-transparent focus-within:border-zinc-700 shadow-sm' 
                : 'bg-black hover:bg-zinc-900 focus-within:bg-black border-black shadow-sm'
            }`}>
              <Search
                size={15}
                strokeWidth={2}
                className={`absolute left-4 pointer-events-none transition-colors ${
                  isDarkMode ? 'text-zinc-400 group-focus-within:text-zinc-300' : 'text-white group-focus-within:text-white'
                }`}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search creators, jobs, tools, inspirations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full h-full pl-10 pr-16 text-xs sm:text-[13px] font-medium bg-transparent text-white placeholder:text-zinc-400 focus:outline-none"
              />
              <div className={`absolute right-3 hidden sm:flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold select-none pointer-events-none ${
                isDarkMode 
                  ? 'bg-zinc-800 border-zinc-700/60 text-zinc-400' 
                  : 'bg-white/15 border-white/20 text-zinc-300'
              }`}>
                Ctrl K
              </div>
            </div>

            {/* Dropdown list below input */}
            {isSearchFocused && (
              <SearchDropdown 
                query={query} 
                setQuery={setQuery}
                onClose={() => setIsSearchFocused(false)} 
              />
            )}
          </div>

          {/* Dynamic Actual User Role Badge (Positioned directly next to Search Bar, matching reference image) */}
          <div className="shrink-0 hidden md:flex items-center">
            <UserRoleBadge />
          </div>
        </div>

        {/* Right Side: Divider, Notification, Chat, Credits, Creative Tool, Theme Toggle, User Profile */}
        <div className="flex items-center gap-2 xl:gap-2.5 shrink-0 ml-auto">
          {/* Subtle Vertical Divider separating Search+Role and Actions */}
          <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-0.5 hidden xl:block" />

          {/* 1. Notification Bell with Red Badge */}
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-black dark:hover:text-white transition-all cursor-pointer relative"
            title="Notifications"
          >
            <Bell size={19} strokeWidth={1.9} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-black" />
          </button>

          {/* 2. Messages / Chat Bubble */}
          <button
            onClick={() => navigate('/communication-hub')}
            className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-black dark:hover:text-white transition-all cursor-pointer"
            title="Messages"
          >
            <MessageSquare size={19} strokeWidth={1.9} />
          </button>

          {/* 3. SuviX Modern Credits Pill */}
          <div 
            onClick={() => setIsCreditsModalOpen(true)}
            className="flex items-center gap-2 sm:gap-2.5 pl-2.5 pr-1.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/90 dark:hover:bg-zinc-850/80 transition-all cursor-pointer select-none group"
            title={`SuviX Credits: ${credits.toLocaleString()}`}
          >
            {/* Stacked purple coins icon */}
            <svg 
              width="22" 
              height="22" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="shrink-0 group-hover:scale-105 transition-transform"
            >
              {/* Bottom Disc */}
              <g>
                <path d="M4 14.5C4 16.8 7.6 18.5 12 18.5C16.4 18.5 20 16.8 20 14.5V16.5C20 18.8 16.4 20.5 12 20.5C7.6 20.5 4 18.8 4 16.5V14.5Z" fill="#6366F1" />
                <ellipse cx="12" cy="14.5" rx="8" ry="3.2" fill="#7C3AED" />
                <path d="M4 14.5C4 16.5 7.6 18 12 18C16.4 18 20 16.5 20 14.5" stroke="#A78BFA" strokeWidth="0.75" />
              </g>

              {/* Middle Disc */}
              <g>
                <path d="M4 9.5C4 11.8 7.6 13.5 12 13.5C16.4 13.5 20 11.8 20 9.5V11.5C20 13.8 16.4 15.5 12 15.5C7.6 15.5 4 13.8 4 11.5V9.5Z" fill="#7C3AED" />
                <ellipse cx="12" cy="9.5" rx="8" ry="3.2" fill="#8B5CF6" />
                <path d="M4 9.5C4 11.5 7.6 13 12 13C16.4 13 20 11.5 20 9.5" stroke="#C4B5FD" strokeWidth="0.75" />
              </g>

              {/* Top Disc */}
              <g>
                <path d="M4 4.5C4 6.8 7.6 8.5 12 8.5C16.4 8.5 20 6.8 20 4.5V6.5C20 8.8 16.4 10.5 12 10.5C7.6 10.5 4 8.8 4 6.5V4.5Z" fill="#8B5CF6" />
                <ellipse cx="12" cy="4.5" rx="8" ry="3.2" fill="#A855F7" />
                <ellipse cx="12" cy="4.5" rx="7.5" ry="2.9" stroke="#E9D5FF" strokeWidth="0.7" />
                {/* Center hole */}
                <ellipse cx="12" cy="4.5" rx="3" ry="1.3" fill="white" />
              </g>
            </svg>

            {/* Middle text column: Credits / dynamic */}
            <div className="flex flex-col text-left leading-none">
              <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 leading-none">
                Credits
              </span>
              <span className="text-[13px] font-bold text-zinc-900 dark:text-white leading-none mt-0.5 tracking-tight">
                {credits.toLocaleString()}
              </span>
            </div>

            {/* Black + Button on the right */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreditsModalOpen(true);
              }}
              className="w-5.5 h-5.5 rounded-full bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0 ml-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Add credits"
            >
              <Plus size={13} strokeWidth={2.6} />
            </button>
          </div>

          {/* 4. Creativity / Tools Icon */}
          <button
            onClick={() => navigate('/creator-tools')}
            className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-black dark:hover:text-white transition-all cursor-pointer"
            title="Creator Tools"
          >
            <Wand2 size={18} strokeWidth={1.9} />
          </button>

          {/* 5. Theme Toggle (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-black dark:hover:text-white transition-all cursor-pointer"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Moon size={18} strokeWidth={1.9} /> : <Sun size={18} strokeWidth={1.9} />}
          </button>

          {/* 6. User Profile Pill Button with Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-850 border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800 transition-all cursor-pointer"
            >
              {/* Avatar with Online Blue Dot */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-200/90 dark:border-zinc-700 shadow-sm">
                <img src={userData.avatar} alt={userData.name} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white dark:ring-black" />
              </div>

              {/* User Name & Handle */}
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-[12.5px] font-bold text-zinc-900 dark:text-white leading-tight">
                  {userData.name}
                </span>
                <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5">
                  @{userData.username}
                </span>
              </div>

              {/* Chevron Down */}
              <ChevronDown 
                size={14} 
                strokeWidth={2.5} 
                className={`text-zinc-400 shrink-0 ml-0.5 transition-transform duration-200 ${
                  isProfileDropdownOpen ? 'rotate-180 text-zinc-700 dark:text-zinc-200' : ''
                }`} 
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className={`absolute right-0 top-full mt-2 w-52 rounded-2xl border shadow-xl p-1.5 flex flex-col gap-0.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                isDarkMode ? 'bg-[#121215] border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200/90 text-zinc-800'
              }`}>
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{userData.name}</p>
                  <p className="text-[10.5px] font-medium text-zinc-400 truncate">@{userData.username}</p>
                </div>

                <button 
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors text-left cursor-pointer"
                >
                  <UserIcon size={14} className="text-zinc-500" />
                  <span>View Personal Profile</span>
                </button>

                {(user?.role === 'creator' || user?.role === 'editor') && (
                  <button 
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      navigate(`/${user.username}`);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors text-left cursor-pointer"
                  >
                    <Sparkles size={14} className="text-zinc-500" />
                    <span>View Public Profile</span>
                  </button>
                )}

                <button 
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    navigate('/subscription');
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors text-left cursor-pointer"
                >
                  <CreditCard size={14} className="text-zinc-500" />
                  <span>Subscription &amp; Plans</span>
                </button>

                <button 
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors text-left cursor-pointer"
                >
                  <Settings size={14} className="text-zinc-500" />
                  <span>Settings</span>
                </button>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                <button 
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    dispatch(clearAuth());
                    navigate('/login');
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer"
                >
                  <LogOut size={14} className="text-red-500" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Watch Ads & Earn Credits Modal */}
      <WatchAdsCreditsModal 
        isOpen={isCreditsModalOpen} 
        onClose={() => setIsCreditsModalOpen(false)} 
        onCreditsEarned={handleCreditsEarned}
        currentCredits={credits}
      />

    </header>
  );
};