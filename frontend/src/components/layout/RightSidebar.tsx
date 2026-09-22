import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Home,
  Search,
  PlaySquare,
  Briefcase,
  Settings,
  LogOut,
  Compass,
  User,
  MapPin,
  PlusSquare,
  MessageSquare,
  Link as LinkIcon,
  Check,
  Crown,
  ArrowRight,
  ChevronsDown,
  Layers
} from 'lucide-react';
import { FaYoutube, FaInstagram, FaMeta } from 'react-icons/fa6';
import { useUserRole } from '../../hooks/useUserRole';
import { useTheme } from '../../hooks/useTheme';
import defaultProfile from '../../assets/defaultprofile.png';
import { useLogout } from '../../mutations/useLogout';

const NAV_ITEMS = [
  { icon: Home,         label: 'Feed',        path: '/home' },
  { icon: Search,       label: 'Explore',     path: '/explore' },
  { icon: FaYoutube,    label: 'YouTube',     path: '/youtube-dashboard', company: 'Google' },
  { icon: FaInstagram,  label: 'Instagram',   path: '/reels',             company: 'Meta' },
  { icon: Compass,      label: 'Discover',    path: '/discover' },
  { icon: MapPin,       label: 'Nearby',      path: '/nearby' },
  { icon: PlaySquare,   label: 'Reels',       path: '/reels' },
  { icon: Briefcase,    label: 'Jobs',        path: '/jobs' },
  { icon: MessageSquare,label: 'Chats',       path: '/communication-hub' },
  { icon: PlusSquare,   label: 'Create',      path: '/create' },
  { icon: Settings,     label: 'Settings',    path: '/settings' },
  { icon: User,         label: 'Profile',     path: '/profile' }
];

export const RightSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user, isCreator, isBrand, isUser, hasYouTube: hasYoutube, hasInstagram } = useUserRole();
  const avatarUrl = user?.profilePicture || defaultProfile;
  const { mutateAsync: logout } = useLogout();

  const isClientCategory = isBrand || isUser;

  const menuItems = useMemo(() => {
    let items = [...NAV_ITEMS];
    
    // Insert Link in Bio under Search (Explore)
    const searchIndex = items.findIndex(item => item.path === '/explore');
    if (searchIndex !== -1) {
      items.splice(searchIndex + 1, 0, {
        icon: LinkIcon,
        label: 'Link in Bio',
        path: '/link-in-bio'
      });
    }

    // Insert Connected Apps exclusively for Creators
    if (isCreator) {
      const ytIndex = items.findIndex(item => item.path === '/youtube-dashboard');
      const insertAt = ytIndex !== -1 ? ytIndex + 1 : items.length - 2;
      items.splice(insertAt, 0, {
        icon: Layers,
        label: 'Connected Apps',
        path: '/connected-apps'
      });
    }

    if (isClientCategory) {
      items = items.filter(item => item.path !== '/upload-portal');
    }
    return items;
  }, [isClientCategory, isCreator]);

  const navRef = useRef<HTMLElement>(null);
  const [canScrollMore, setCanScrollMore] = useState(true);

  const checkScroll = () => {
    if (navRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = navRef.current;
      setCanScrollMore(scrollHeight - scrollTop - clientHeight > 12);
    }
  };

  useEffect(() => {
    checkScroll();
    const navEl = navRef.current;
    if (navEl) {
      navEl.addEventListener('scroll', checkScroll);
    }
    window.addEventListener('resize', checkScroll);
    const timer = setTimeout(checkScroll, 300);
    return () => {
      if (navEl) navEl.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [menuItems]);

  return (
    <aside 
      aria-label="Sidebar Navigation"
      className={`w-full h-full flex flex-col justify-between pt-4 pb-3 px-2.5 select-none overflow-hidden rounded-[26px] xl:rounded-[30px] border-none shadow-xs transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-[#18181B] text-white' 
          : 'bg-[#F4F6FB] text-zinc-900'
      }`}
    >
      {/* Primary Navigation List (Scrollable) */}
      <nav ref={navRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col gap-1.5 w-full pb-2">
        {menuItems.map((item) => {
          const isActive =
            item.path === '/home'
              ? location.pathname === '/home' || location.pathname === '/'
              : location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

          const Icon = item.icon;
          const isProfile = item.label === 'Profile';

          return (
            <Link
              key={`${item.label}-${item.path}`}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all duration-150 text-[13px] font-bold ${
                isActive
                  ? isDarkMode
                    ? 'bg-white text-black shadow-sm'
                    : 'bg-[#15171C] text-white shadow-sm'
                  : isDarkMode
                  ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                  : 'text-zinc-600 hover:text-black hover:bg-white/90'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isProfile ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className={`w-5 h-5 rounded-full object-cover shrink-0 border transition-all ${
                      isActive 
                        ? isDarkMode ? 'border-black' : 'border-white'
                        : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  />
                ) : item.label === 'YouTube' ? (
                  <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                    <FaYoutube className="text-[#FF0000] text-[18px]" />
                    {hasYoutube ? (
                      <div 
                        title="YouTube Connected" 
                        className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-1 ring-white dark:ring-black"
                      >
                        <Check size={5} strokeWidth={4} />
                      </div>
                    ) : (
                      <div 
                        title="YouTube Not Connected" 
                        className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 text-black font-black text-[6px] flex items-center justify-center ring-1 ring-white dark:ring-black leading-none"
                      >
                        !
                      </div>
                    )}
                  </div>
                ) : item.label === 'Instagram' ? (
                  <div className="relative w-[18px] h-[18px] rounded-[5px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-xs shrink-0">
                    <FaInstagram className="text-white text-[11px]" />
                    {hasInstagram ? (
                      <div 
                        title="Instagram Connected" 
                        className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-1 ring-white dark:ring-black"
                      >
                        <Check size={5} strokeWidth={4} />
                      </div>
                    ) : (
                      <div 
                        title="Instagram Not Connected" 
                        className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 text-black font-black text-[6px] flex items-center justify-center ring-1 ring-white dark:ring-black leading-none"
                      >
                        !
                      </div>
                    )}
                  </div>
                ) : (
                  <Icon 
                    size={17} 
                    strokeWidth={isActive ? 2.4 : 1.9} 
                    className={`shrink-0 transition-colors ${
                      isActive 
                        ? isDarkMode ? 'text-black' : 'text-white' 
                        : 'text-current'
                    }`} 
                  />
                )}
                <span className="truncate">{item.label}</span>
              </div>

              {/* Company Badges for YouTube / Instagram */}
              {item.company && (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-bold shrink-0 ${
                  isActive 
                    ? isDarkMode 
                      ? 'bg-black/15 text-black' 
                      : 'bg-white/20 text-white' 
                    : isDarkMode 
                    ? 'bg-zinc-850 text-zinc-400' 
                    : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {item.company === 'Meta' && <FaMeta className="text-[#0081FB] text-[8px]" />}
                  <span>{item.company}</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: Upgrade Card + Logout (Fixed at bottom) */}
      <div className="shrink-0 w-full pt-1 space-y-2">
        {/* Continuous Animating Scroll Prompt */}
        {canScrollMore && (
          <button
            type="button"
            onClick={() => {
              navRef.current?.scrollBy({ top: 140, behavior: 'smooth' });
            }}
            className={`w-full py-2 px-3 rounded-2xl flex items-center justify-between transition-all select-none cursor-pointer group shadow-sm border-none ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-zinc-100' 
                : 'bg-[#15171C] text-white hover:bg-black'
            }`}
            title="Scroll to view more navigation options"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isDarkMode ? 'bg-black' : 'bg-white'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isDarkMode ? 'bg-black' : 'bg-white'
                }`}></span>
              </span>
              <span className="text-[11.5px] font-extrabold tracking-tight truncate">
                Scroll for more
              </span>
            </div>
            <ChevronsDown 
              size={15} 
              strokeWidth={2.8} 
              className={`animate-bounce shrink-0 ${
                isDarkMode ? 'text-black' : 'text-white'
              }`} 
            />
          </button>
        )}

        {/* Upgrade to Pro Card */}
        <div className={`p-3 rounded-2xl flex flex-col items-center text-center shadow-xs border transition-colors ${
          isDarkMode 
            ? 'bg-[#27272A] border-zinc-700/60' 
            : 'bg-white/90 border-[#E8ECF5]'
        }`}>
          {/* Crown Badge */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
            isDarkMode ? 'bg-zinc-800' : 'bg-black'
          }`}>
            <Crown size={14} className="text-amber-400 fill-amber-400" />
          </div>

          <h4 className="text-[12px] font-black text-zinc-950 dark:text-white mt-2 leading-tight">
            Upgrade to Pro
          </h4>

          <p className="text-[9.5px] text-zinc-500 dark:text-zinc-400 leading-tight mt-1 mb-2.5 px-0.5">
            Unlock premium tools &amp; opportunities.
          </p>

          <button
            type="button"
            onClick={() => navigate('/subscription')}
            className={`w-full py-1.5 px-2.5 rounded-full font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-black text-white hover:bg-zinc-800'
            }`}
          >
            <span>Upgrade Now</span>
            <ArrowRight size={11} strokeWidth={2.5} />
          </button>
        </div>

        {/* Log out Button */}
        <button
          onClick={() => logout()}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl transition-all duration-150 text-[12.5px] font-bold cursor-pointer text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30`}
        >
          <LogOut size={16} strokeWidth={2} className="shrink-0 text-rose-500" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};