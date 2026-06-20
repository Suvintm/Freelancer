import { ReactLenis }    from 'lenis/react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Search, PlaySquare, Briefcase,
  Settings, LogOut, Compass, User,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';
import defaultProfile from '../../assets/defaultprofile.png';

const NAV_ITEMS = [
  { icon: Home,       label: 'Feed',      path: '/home'    },
  { icon: Search,     label: 'Explore',   path: '/explore' },
  { icon: Compass,    label: 'Discover',  path: '/discover'},
  { icon: PlaySquare, label: 'Reels',     path: '/reels'   },
  { icon: Briefcase,  label: 'Jobs',      path: '/jobs'    },
  { icon: Settings,   label: 'Settings',  path: '/settings'},
  { icon: User,       label: 'Profile',   path: '/profile' }
];

export const RightSidebar = () => {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const user = useSelector(selectUser);
  const avatarUrl = user?.profilePicture || defaultProfile;

  return (
    <ReactLenis className="w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
      <div className="flex flex-col flex-1 px-4 py-6">

        {/* Navigation Card */}
        <div className={`rounded-[24px] border p-4 transition-all duration-300 ${isDarkMode ? 'bg-black border-border-main' : 'bg-zinc-50/50 border-zinc-950 border-[1.5px] shadow-sm hover:shadow-md'} flex flex-col flex-1`}>
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.12em] px-2 mb-3">
            Navigation
          </p>

          <nav className="space-y-1 flex-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              const isProfile = item.label === 'Profile';

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all border',
                    isDarkMode
                      ? (isActive 
                          ? 'bg-text-main text-container font-semibold border-transparent' 
                          : 'text-text-muted hover:bg-border-secondary hover:text-text-main border-transparent')
                      : (isActive 
                          ? 'bg-zinc-950 text-white font-semibold border-zinc-950 shadow-sm' 
                          : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-950 border-transparent hover:border-zinc-300')
                  ].join(' ')}
                >
                  {isProfile ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-4 h-4 rounded-full object-cover border border-current"
                    />
                  ) : (
                    <item.icon
                      size={16}
                      strokeWidth={isActive ? 2.5 : 1.75}
                    />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-border-main' : 'border-zinc-200'}`}>
            <button className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-rose-500 hover:bg-rose-500/8 transition-colors w-full border border-transparent ${!isDarkMode && 'hover:border-rose-200 hover:bg-rose-50/50 cursor-pointer'}`}>
              <LogOut size={16} strokeWidth={1.75} />
              Log out
            </button>
          </div>
        </div>

      </div>
    </ReactLenis>
  );
};