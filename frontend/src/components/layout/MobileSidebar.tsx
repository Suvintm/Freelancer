import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Compass, MessageSquare, Briefcase, 
  Users, User, LogOut, Plus, Moon, MoreVertical, X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useLogout } from '../../mutations/useLogout';
import { useTheme } from '../../hooks/useTheme';
import defaultProfile from '../../assets/defaultprofile.png';

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

  const NAV_ITEMS = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/home' },
    { icon: Compass, label: 'Project', path: '/projects' },
    { icon: MessageSquare, label: 'Chat', path: '/chats' },
    { icon: Briefcase, label: 'Services', path: '/services' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: User, label: 'Account', path: '/profile' },
  ];

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
                onClick={() => handleNavigate('/projects')} // Custom action for Add New, e.g., create a project
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
              {NAV_ITEMS.map((item) => {
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
              <div className={`flex items-center gap-3 p-2 rounded-2xl ${
                isDarkMode ? 'hover:bg-zinc-900/50' : 'hover:bg-zinc-50'
              }`}>
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
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
