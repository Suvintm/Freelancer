import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useRef, useState, useEffect } from 'react';
import {
  Home, Search, PlaySquare, Briefcase,
  Settings, LogOut, Compass, User, MapPin, PlusSquare, Youtube, MessageSquare, ChevronDown,
  Link as LinkIcon, Check
} from 'lucide-react';
import { FaYoutube, FaInstagram, FaMeta } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';
import defaultProfile from '../../assets/defaultprofile.png';
import { useLogout } from '../../mutations/useLogout';

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
  { icon: PlusSquare,   label: 'Create',      path: '/create'  },
  { icon: Settings,     label: 'Settings',    path: '/settings'},
  { icon: User,         label: 'Profile',     path: '/profile' }
];

export const RightSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const user = useSelector(selectUser);
  const avatarUrl = user?.profilePicture || defaultProfile;
  const { mutateAsync: logout } = useLogout();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

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

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const canScroll = scrollHeight > clientHeight;
      const reachedBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setShowScrollIndicator(canScroll && !reachedBottom);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const roleStr = (user?.role || '').toLowerCase();
  const categoryStr = (user?.primaryRole?.category || '').toLowerCase();
  const categorySlugStr = (user?.primaryRole?.categorySlug || '').toLowerCase();

  const isClientCategory =
    roleStr === 'user' ||
    roleStr === 'brand' ||
    roleStr === 'direct_client' ||
    categoryStr.includes('brand') ||
    categoryStr.includes('user') ||
    categorySlugStr.includes('user') ||
    categorySlugStr.includes('brand');

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

    if (isClientCategory) {
      items = items.filter(item => item.path !== '/upload-portal');
    }
    return items;
  }, [isClientCategory, user?.username]);

  return (
    <div 
      onMouseEnter={checkScroll}
      className={`
        absolute top-0 left-0 h-full w-[80px] hover:w-[280px] 
        group transition-[width,box-shadow] duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width] flex flex-col overflow-hidden 
        border-r shadow-2xl z-[60]
        ${isDarkMode 
          ? 'bg-black border-border-main text-white' 
          : 'bg-white border-zinc-200 text-zinc-900'}
      `}
    >
      {/* 1. Header (Logo / Platform Title) */}
      <div className="h-[80px] flex items-center px-6 flex-shrink-0 relative">
        <div 
          onClick={() => navigate('/home')}
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm cursor-pointer transition-transform duration-200 hover:scale-105
            ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}
          `}
        >
          {/* SuviX Cube Logo */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <div className="ml-4 flex flex-col opacity-0 group-hover:opacity-100 transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] translate-x-2 group-hover:translate-x-0 whitespace-nowrap overflow-hidden">
          <span className="text-[14px] font-black tracking-tight leading-none">SuviX</span>
          <span className="text-[10px] text-text-muted mt-0.5 font-medium uppercase tracking-wider">Untitled UI</span>
        </div>
      </div>

      {/* 2. Primary Navigation List */}
      <div 
        ref={scrollRef}
        className="flex-1 flex flex-col gap-1.5 py-4 overflow-y-auto overflow-x-hidden scrollbar-hide px-4"
      >
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isProfile = item.label === 'Profile';

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center h-11 rounded-xl transition-all duration-200 cursor-pointer flex-shrink-0 relative group/item
                ${isActive 
                  ? (isDarkMode 
                      ? 'bg-white text-black font-semibold' 
                      : 'bg-black text-white font-semibold')
                  : (isDarkMode 
                      ? 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white' 
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950')}
              `}
            >
              {/* Icon Container (Strictly centered inside 48px width) */}
              <div className="w-[48px] h-11 flex items-center justify-center flex-shrink-0">
                {isProfile ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className={`w-6 h-6 rounded-full object-cover border-2 transition-all ${
                      isActive ? 'border-current' : (isDarkMode ? 'border-zinc-800' : 'border-zinc-200')
                    }`}
                  />
                ) : item.label === 'YouTube' ? (
                  <div className="relative w-6 h-6 flex items-center justify-center transition-transform duration-200 group-hover/item:scale-110">
                    <FaYoutube className="text-[#FF0000] text-[21px] drop-shadow-sm" />
                    {hasYoutube ? (
                      <div 
                        title="YouTube Connected" 
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-1 ring-white dark:ring-black shadow-2xs"
                      >
                        <Check size={6} strokeWidth={4} />
                      </div>
                    ) : (
                      <div 
                        title="YouTube Not Connected" 
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 text-black font-black text-[7.5px] flex items-center justify-center ring-1 ring-white dark:ring-black shadow-2xs leading-none"
                      >
                        !
                      </div>
                    )}
                  </div>
                ) : item.label === 'Instagram' ? (
                  <div className="relative w-[22px] h-[22px] rounded-[6px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-sm transition-transform duration-200 group-hover/item:scale-110">
                    <FaInstagram className="text-white text-[13px]" />
                    {hasInstagram ? (
                      <div 
                        title="Instagram Connected" 
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-1 ring-white dark:ring-black shadow-2xs"
                      >
                        <Check size={6} strokeWidth={4} />
                      </div>
                    ) : (
                      <div 
                        title="Instagram Not Connected" 
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 text-black font-black text-[7.5px] flex items-center justify-center ring-1 ring-white dark:ring-black shadow-2xs leading-none"
                      >
                        !
                      </div>
                    )}
                  </div>
                ) : (
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-200 group-hover/item:scale-105" />
                )}
              </div>
              
              {/* Text Label with Parent Company Logo (Hidden until hovered) */}
              <div 
                className={`
                  flex items-center gap-1.5 text-[13px] font-semibold tracking-wide whitespace-nowrap 
                  opacity-0 group-hover:opacity-100 transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)]
                  translate-x-2 group-hover:translate-x-0
                  ${isActive ? 'text-current font-bold' : 'text-text-muted group-hover/item:text-text-main'}
                `}
              >
                <span>{item.label}</span>
                
                {item.label === 'YouTube' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 shadow-2xs">
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
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 shadow-2xs">
                    <FaMeta className="text-[#0081FB] text-[10px]" />
                    <span className="text-[8.5px] font-bold text-zinc-500 dark:text-zinc-400">Meta</span>
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Floating scroll indicator */}
      {showScrollIndicator && (
        <div 
          className="absolute bottom-[84px] left-1/2 -translate-x-1/2 z-[70] pointer-events-none flex flex-col items-center justify-center"
        >
          <div 
            className={`
              p-1.5 rounded-full shadow-lg border animate-bounce flex items-center justify-center
              ${isDarkMode 
                ? 'bg-white border-zinc-200 text-zinc-500 shadow-zinc-200/50' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 shadow-black/80'}
            `}
          >
            <ChevronDown size={12} strokeWidth={3} />
          </div>
        </div>
      )}

      {/* 3. Footer Actions (Logout & Settings / Switch Account) */}
      <div className={`p-4 flex flex-col gap-1.5 mt-auto border-t ${isDarkMode ? 'border-border-main/50' : 'border-zinc-100'}`}>
        <button
          onClick={() => logout()}
          className={`
            flex items-center h-11 rounded-xl transition-all duration-200 cursor-pointer flex-shrink-0 relative group/item
            ${isDarkMode ? 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'}
          `}
        >
          <div className="w-[48px] h-11 flex items-center justify-center flex-shrink-0">
            <LogOut size={20} strokeWidth={2} className="text-rose-500 transition-transform duration-200 group-hover/item:scale-105" />
          </div>
          <span 
            className="
              text-[13px] font-semibold tracking-wide whitespace-nowrap text-rose-500
              opacity-0 group-hover:opacity-100 transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)]
              translate-x-2 group-hover:translate-x-0
            "
          >
            Log out
          </span>
        </button>
      </div>
    </div>
  );
};