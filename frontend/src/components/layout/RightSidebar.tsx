import { ReactLenis }    from 'lenis/react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Search, PlaySquare, Briefcase,
  Settings, LogOut, Compass,
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home,       label: 'Feed',      path: '/home'    },
  { icon: Search,     label: 'Explore',   path: '/explore' },
  { icon: Compass,    label: 'Discover',  path: '/discover'},
  { icon: PlaySquare, label: 'Reels',     path: '/reels'   },
  { icon: Briefcase,  label: 'Jobs',      path: '/jobs'    },
  { icon: Settings,   label: 'Settings',  path: '/settings'},
];

export const RightSidebar = () => {
  const location = useLocation();

  return (
    <ReactLenis className="w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
      <div className="flex flex-col flex-1 px-3 py-5">

        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.1em] px-3 mb-3">
          Navigation
        </p>

        <nav className="space-y-0.5 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all',
                  isActive
                    ? 'bg-text-main text-container font-semibold'
                    : 'text-text-muted hover:bg-border-secondary hover:text-text-main',
                ].join(' ')}
              >
                <item.icon
                  size={16}
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 pt-4 border-t border-border-main">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-rose-500 hover:bg-rose-500/8 transition-colors w-full">
            <LogOut size={16} strokeWidth={1.75} />
            Log out
          </button>
        </div>
      </div>
    </ReactLenis>
  );
};