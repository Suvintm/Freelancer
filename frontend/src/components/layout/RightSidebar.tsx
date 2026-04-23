import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  PlaySquare, 
  Settings, 
  LogOut,
  Briefcase
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home, label: 'Feed', path: '/home' },
  { icon: Search, label: 'Explore', path: '/explore' },
  { icon: PlaySquare, label: 'Reels', path: '/reels' },
  { icon: Briefcase, label: 'Jobs', path: '/jobs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const RightSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 h-full bg-sidebar flex flex-col py-8 px-6 overflow-y-auto scrollbar-hide border-l border-border-main">
      <nav className="space-y-2 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-5 py-4 rounded-3xl transition-all font-bold text-[13px] ${
                isActive 
                  ? 'bg-text-main text-container shadow-lg shadow-text-main/5' 
                  : 'text-text-muted hover:bg-border-secondary hover:text-text-main'
              }`}
            >
              <item.icon size={18} strokeWidth={isActive ? 3 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button className="flex items-center gap-4 px-5 py-4 rounded-3xl text-rose-500 hover:bg-rose-500/10 transition-all font-bold text-[13px] w-full mt-10">
        <LogOut size={18} />
        Logout
      </button>

      {/* Extra Space for Bottom curve */}
      <div className="h-20" />
    </aside>
  );
};
