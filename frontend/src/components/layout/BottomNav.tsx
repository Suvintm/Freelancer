import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  MapPin, 
  Play, 
  Briefcase,
  MessageCircle
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import auth1 from '../../assets/auth/auth_1.png';

const NAV_ITEMS = [
  { name: 'home', icon: Home, label: 'Home', path: '/home' },
  { name: 'explore', icon: Search, label: 'Explore', path: '/explore' },
  { name: 'nearby', icon: MapPin, label: 'Nearby', path: '/nearby' },
  { name: 'reels', icon: Play, label: 'Reels', path: '/reels', isSpecial: true },
  { name: 'jobs', icon: Briefcase, label: 'Jobs', path: '/jobs' },
  { name: 'chats', icon: MessageCircle, label: 'Chats', path: '/chats' },
  { name: 'profile', icon: null, label: 'Profile', path: '/profile', isProfile: true },
];

export const BottomNav = () => {
  const location = useLocation();
  const { isDarkMode } = useTheme();

  const activeColor = isDarkMode ? '#FFFFFF' : '#111111';
  const inactiveColor = isDarkMode ? '#777777' : '#AAAAAA';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-nav border-t-0 shadow-[0_-2px_12px_rgba(0,0,0,0.07)] flex items-center justify-around px-2 z-[60] pb-safe">
      <div className="flex w-full items-center h-full">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const color = isActive ? activeColor : inactiveColor;

          if (item.isSpecial) {
            return (
              <Link 
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center -mt-8"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl transition-transform active:scale-90 ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                  <Play size={20} fill="currentColor" />
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.4px] mt-2 text-[#777777]">
                  Reels
                </span>
              </Link>
            );
          }

          return (
            <Link 
              key={item.path}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full"
            >
              <div className="flex items-center justify-center h-6">
                {item.isProfile ? (
                  <div className={`w-6 h-6 rounded-full p-[1px] border-2 transition-colors ${isActive ? 'border-current' : 'border-transparent'}`} style={{ color }}>
                    <img src={auth1} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  </div>
                ) : item.icon && (
                  <item.icon size={22} color={color} strokeWidth={isActive ? 3 : 2} />
                )}
              </div>
              <span 
                className="text-[8px] font-black uppercase tracking-[0.4px] transition-colors"
                style={{ color, fontWeight: isActive ? '900' : '500' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
