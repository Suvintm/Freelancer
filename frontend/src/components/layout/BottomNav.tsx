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
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import defaultProfile from '../../assets/defaultprofile.png';

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
  const user = useSelector(selectUser);
  const profileAvatar = user?.profilePicture || defaultProfile;

  return (
    <div className="lg:hidden fixed bottom-6 left-4 right-4 z-[60] flex justify-center pb-safe">
      <nav className="h-[64px] w-full max-w-md bg-black rounded-[32px] shadow-2xl flex items-center justify-between px-2 sm:px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link 
              key={item.path}
              to={item.path}
              className={`
                relative flex items-center justify-center h-12 transition-all duration-300 ease-out overflow-hidden
                ${isActive ? 'bg-[#2A2A2A] px-4 rounded-full gap-2.5 flex-shrink-0' : 'w-12 rounded-full flex-shrink-0 hover:bg-white/5'}
              `}
            >
              <div className="flex items-center justify-center shrink-0">
                {item.isProfile ? (
                  <div className={`w-6 h-6 rounded-full overflow-hidden transition-all ${isActive ? 'ring-2 ring-white' : 'opacity-70'}`}>
                    <img src={profileAvatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : item.icon && (
                  <item.icon 
                    size={isActive ? 20 : 22} 
                    className={`transition-colors ${isActive ? 'text-white' : 'text-[#888888]'}`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                )}
              </div>
              
              {isActive && (
                <span className="text-[13px] font-bold text-white tracking-wide whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
