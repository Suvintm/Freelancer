import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  PlaySquare, 
  Briefcase,
  User
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Search, label: 'Explore', path: '/explore' },
  { icon: PlaySquare, label: 'Reels', path: '/reels' },
  { icon: Briefcase, label: 'Jobs', path: '/jobs' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-nav/80 backdrop-blur-xl border-t border-border-main flex items-center justify-around px-2 z-50">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              isActive ? 'text-accent-primary' : 'text-text-muted hover:text-text-main'
            }`}
          >
            <item.icon size={22} strokeWidth={isActive ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
