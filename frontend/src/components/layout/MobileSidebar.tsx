import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Search, Compass, MapPin, PlaySquare, Briefcase, PlusSquare, Settings, User,
  LogOut, Plus, Moon, X, MessageSquare, BarChart3, Check
} from 'lucide-react';
import { FaYoutube, FaInstagram, FaMeta } from 'react-icons/fa6';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useLogout } from '../../mutations/useLogout';
import { useTheme } from '../../hooks/useTheme';
import defaultProfile from '../../assets/defaultprofile.png';
import { AccountSwitcher } from '../profile/AccountSwitcher';

const NAV_ITEMS = [
  { icon: Home,         label: 'Feed',        path: '/home'    },
  { icon: Search,       label: 'Explore',     path: '/explore' },
  { icon: FaYoutube,    label: 'YouTube',     path: '/youtube-dashboard', company: 'Google' },
  { icon: FaInstagram,  label: 'Instagram',   path: '/reels',             company: 'Meta' },
  { icon: Compass,      label: 'Discover',    path: '/discover'},
  { icon: MapPin,       label: 'Nearby',      path: '/nearby'  },
  { icon: PlaySquare,   label: 'Reels',       path: '/reels'   },
  { icon: Briefcase,    label: 'Jobs',        path: '/jobs'    },
  { icon: MessageSquare,label: 'Chats',       path: '/communication-hub' },
  { icon: PlusSquare,   label: 'Create',      path: '/create' },
  { icon: Settings,     label: 'Settings',    path: '/settings'},
  { icon: User,         label: 'Profile',     path: '/profile' }
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar = ({ isOpen, onClose }: MobileSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const { mutateAsync: logout } = useLogout();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const hasYoutube = Boolean(
    (Array.isArray(user?.youtubeChannels) && user.youtubeChannels.length > 0) ||
    (Array.isArray(user?.youtubeProfile) && user.youtubeProfile.length > 0) ||
    user?.channelLinkStatus === 'LINKED' ||
    Boolean(user?.creatorProfile?.channels && user.creatorProfile.channels.length > 0)
  );

  const hasInstagram = Boolean(
    user?.instagramProfile ||
    (Array.isArray(user?.instagramAccounts) && user.instagramAccounts.length > 0)
  );

  const menuItems = useMemo(() => {
    return [...NAV_ITEMS];
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 🌑 ADAPTIVE BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
          />

          {/* 💎 ELITE PANE */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed inset-y-0 left-0 z-[101] w-[82%] max-w-[320px] shadow-2xl flex flex-col lg:hidden transition-colors duration-300 ${
              isDarkMode ? 'bg-[#121214] text-zinc-100' : 'bg-white text-zinc-900'
            }`}
          >
            {/* Header / Logo */}
            <div className="flex items-center justify-between px-6 pt-8 pb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full border-[2px] flex items-center justify-center ${isDarkMode ? 'border-zinc-400' : 'border-zinc-900'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-zinc-400' : 'bg-zinc-900'}`} />
                </div>
                <span className="font-bold text-lg tracking-tight font-display">Rahi</span>
              </div>
              <button 
                onClick={onClose} 
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Add New Button */}
            <div className="px-6 py-2 flex flex-col gap-2.5">
              <button
                onClick={() => handleNavigate('/upload-portal')}
                className={`w-full flex items-center justify-center gap-2 h-[48px] rounded-xl font-bold text-sm tracking-wide shadow-sm active:scale-[0.98] transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-white text-zinc-950 hover:bg-zinc-100' 
                    : 'bg-zinc-950 text-white hover:bg-zinc-900'
                }`}
              >
                <Plus size={16} strokeWidth={3} />
                <span>Add New</span>
              </button>

              {hasYoutube && (
                <button
                  onClick={() => handleNavigate('/polls/create')}
                  className={`w-full flex items-center justify-center gap-2 h-[48px] rounded-xl font-black text-sm tracking-tight shadow-sm active:scale-[0.98] transition-all duration-200 border-2 border-dashed ${
                    isDarkMode 
                      ? 'border-rose-500/30 bg-rose-500/10 text-white hover:bg-rose-500/20 hover:border-rose-500' 
                      : 'border-rose-400/40 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-500'
                  }`}
                >
                  <BarChart3 size={18} strokeWidth={2.5} />
                  <span>Create poll for the growth</span>
                </button>
              )}
            </div>

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-hide">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigate(item.path)}
                    className={`
                      w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-150 active:scale-[0.98]
                      ${isActive 
                        ? (isDarkMode 
                            ? 'bg-zinc-800/60 text-white font-bold' 
                            : 'bg-[#E8F6F6] text-[#008080] font-bold') 
                        : (isDarkMode 
                            ? 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200' 
                            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')
                      }
                    `}
                  >
                    {item.label === 'YouTube' ? (
                      <div className="relative w-[19px] h-[19px] flex items-center justify-center">
                        <FaYoutube className="text-[#FF0000] text-[19px]" />
                        {hasYoutube ? (
                          <div 
                            title="YouTube Connected" 
                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-1 ring-white dark:ring-[#121214] shadow-2xs"
                          >
                            <Check size={5.5} strokeWidth={4} />
                          </div>
                        ) : (
                          <div 
                            title="YouTube Not Connected" 
                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 text-black font-black text-[7px] flex items-center justify-center ring-1 ring-white dark:ring-[#121214] shadow-2xs leading-none"
                          >
                            !
                          </div>
                        )}
                      </div>
                    ) : item.label === 'Instagram' ? (
                      <div className="relative w-[19px] h-[19px] rounded-[5px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center p-0.5 shadow-sm">
                        <FaInstagram className="text-white text-[12px]" />
                        {hasInstagram ? (
                          <div 
                            title="Instagram Connected" 
                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-1 ring-white dark:ring-[#121214] shadow-2xs"
                          >
                            <Check size={5.5} strokeWidth={4} />
                          </div>
                        ) : (
                          <div 
                            title="Instagram Not Connected" 
                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 text-black font-black text-[7px] flex items-center justify-center ring-1 ring-white dark:ring-[#121214] shadow-2xs leading-none"
                          >
                            !
                          </div>
                        )}
                      </div>
                    ) : (
                      <item.icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                    )}
                    <span className="text-[14px] flex-1 text-left font-semibold flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {item.label === 'YouTube' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                          </svg>
                          <span className="text-[8.5px] font-bold text-zinc-500 dark:text-zinc-400">Google</span>
                        </span>
                      )}
                      {item.label === 'Instagram' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                          <FaMeta className="text-[#0081FB] text-[10px]" />
                          <span className="text-[8.5px] font-bold text-zinc-500 dark:text-zinc-400">Meta</span>
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}

              {/* Log Out as an inline item like in the screenshot */}
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-150 active:scale-[0.98] ${
                  isDarkMode 
                    ? 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200' 
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <LogOut size={19} strokeWidth={2} />
                <span className="text-[14px] flex-1 text-left font-semibold">
                  Log Out
                </span>
              </button>

              {/* Legal Links for AdSense / Mobile */}
              <div className="pt-4 pb-2 px-2 border-t border-zinc-200/25 dark:border-zinc-800/25 flex items-center justify-between text-[11px] text-zinc-500 font-semibold select-none">
                <button onClick={() => handleNavigate('/about')} className="hover:text-rose-500 transition-colors cursor-pointer">About Us</button>
                <span className="w-1 h-1 rounded-full bg-zinc-500/50" />
                <button onClick={() => handleNavigate('/privacy')} className="hover:text-rose-500 transition-colors cursor-pointer">Privacy Policy</button>
                <span className="w-1 h-1 rounded-full bg-zinc-500/50" />
                <button onClick={() => handleNavigate('/terms')} className="hover:text-rose-500 transition-colors cursor-pointer">Terms & Conditions</button>
              </div>
            </div>

            {/* Bottom Section with Divider, Toggle, and Profile */}
            <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-4">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <Moon size={18} className={isDarkMode ? 'text-zinc-300' : 'text-zinc-600'} />
                  <span className={`text-[13px] font-bold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    Dark Mode
                  </span>
                </div>
                {/* Custom Toggle Switch */}
                <button
                  onClick={toggleTheme}
                  className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 cursor-pointer outline-none ${
                    isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'
                  }`}
                  aria-label="Toggle Theme"
                >
                  <div
                    className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                      isDarkMode ? 'translate-x-4 bg-blue-500' : 'bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* User Profile Card */}
              <div 
                className={`flex items-center gap-3 p-2 rounded-2xl cursor-pointer transition-colors ${
                  isDarkMode ? 'hover:bg-zinc-900/50' : 'hover:bg-zinc-50'
                }`}
                onClick={() => setIsSwitcherOpen(true)}
              >
                <img
                  src={user?.profilePicture || defaultProfile}
                  alt={user?.name || 'Rana'}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h4 className={`text-[13px] font-bold truncate ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    {user?.name || 'Rana'}
                  </h4>
                  <p className={`text-[11px] truncate ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
                <button 
                  className={`p-1 rounded-lg transition-colors ${
                    isDarkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSwitcherOpen(true);
                  }}
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
          
          <AccountSwitcher 
            isOpen={isSwitcherOpen} 
            onClose={() => setIsSwitcherOpen(false)} 
          />
        </>
      )}
    </AnimatePresence>
  );
};
