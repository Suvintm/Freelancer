import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Search, Compass, MapPin, PlaySquare, Briefcase, PlusSquare, Settings, User,
  LogOut, Plus, Moon, MoreVertical, X, Youtube, MessageSquare
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useLogout } from '../../mutations/useLogout';
import { useTheme } from '../../hooks/useTheme';
import defaultProfile from '../../assets/defaultprofile.png';
import { AccountSwitcher } from '../profile/AccountSwitcher';

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

  const NAV_ITEMS = [
    { icon: Home,       label: 'Feed',      path: '/home'    },
    { icon: Search,     label: 'Explore',   path: '/explore' },
    { icon: Compass,    label: 'Discover',  path: '/discover'},
    { icon: MapPin,     label: 'Nearby',    path: '/nearby'  },
    { icon: PlaySquare, label: 'Reels',     path: '/reels'   },
    { icon: Briefcase,  label: 'Jobs',      path: '/jobs'    },
    { icon: MessageSquare, label: 'Chats',  path: '/communication-hub' },
    { icon: PlusSquare, label: 'Upload Portal', path: '/upload-portal' },
    { icon: Settings,   label: 'Settings',  path: '/settings'},
    { icon: User,       label: 'Profile',   path: '/profile' }
  ];

  const hasYoutube = user?.primaryRole?.category === 'yt_influencer' && user?.youtubeProfile && user.youtubeProfile.length > 0;

  const menuItems = useMemo(() => {
    const items = [...NAV_ITEMS];
    if (hasYoutube) {
      const settingsIndex = items.findIndex(item => item.path === '/settings');
      if (settingsIndex !== -1) {
        items.splice(settingsIndex, 0, { icon: Youtube, label: 'YT Dashboard', path: '/youtube-dashboard' });
      } else {
        items.push({ icon: Youtube, label: 'YT Dashboard', path: '/youtube-dashboard' });
      }
    }
    return items;
  }, [hasYoutube]);

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
            <div className="px-6 py-2">
              <button
                onClick={() => handleNavigate('/upload-portal')} // Navigate to Upload Portal
                className={`w-full flex items-center justify-center gap-2 h-[48px] rounded-xl font-bold text-sm tracking-wide shadow-sm active:scale-[0.98] transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-white text-zinc-950 hover:bg-zinc-100' 
                    : 'bg-zinc-950 text-white hover:bg-zinc-900'
                }`}
              >
                <Plus size={16} strokeWidth={3} />
                <span>Add New</span>
              </button>
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
                    <item.icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[14px] flex-1 text-left font-semibold">
                      {item.label}
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
