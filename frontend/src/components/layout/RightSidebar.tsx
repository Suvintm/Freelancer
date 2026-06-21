import { ReactLenis }    from 'lenis/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import {
  Home, Search, PlaySquare, Briefcase,
  Settings, LogOut, Compass, User, MapPin, PlusSquare, Youtube, MessageSquare, Plus
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';
import defaultProfile from '../../assets/defaultprofile.png';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api/client';

const NAV_ITEMS = [
  { icon: Home,       label: 'Feed',      path: '/home'    },
  { icon: Search,     label: 'Explore',   path: '/explore' },
  { icon: Compass,    label: 'Discover',  path: '/discover'},
  { icon: MapPin,     label: 'Nearby',    path: '/nearby'  },
  { icon: PlaySquare, label: 'Reels',     path: '/reels'   },
  { icon: Briefcase,  label: 'Jobs',      path: '/jobs'    },
  { icon: MessageSquare, label: 'Chats',   path: '/communication-hub' },
  { icon: PlusSquare, label: 'Upload Portal', path: '/upload-portal' },
  { icon: Settings,   label: 'Settings',  path: '/settings'},
  { icon: User,       label: 'Profile',   path: '/profile' }
];

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export const RightSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const user = useSelector(selectUser);
  const avatarUrl = user?.profilePicture || defaultProfile;

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    const fetchConvs = async () => {
      try {
        const res = await api.get('/messages/conversations');
        if (res.data?.success && res.data.data) {
          setConversations(res.data.data);
        }
      } catch {
        // silently fail
      }
    };
    fetchConvs();
  }, []);

  const hasYoutube = user?.youtubeProfile && user.youtubeProfile.length > 0;

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

  const visibleConvs = conversations.slice(activeCardIndex, activeCardIndex + 3);

  return (
    <ReactLenis className="w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
      <div className="flex flex-col flex-1 px-4 py-6 gap-4">

        {/* ── Latest Messages Widget ── */}
        {visibleConvs.length > 0 && (
          <div className="w-full flex flex-col gap-1.5">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.12em] px-1">
              Messages
            </p>
            <div className="relative w-full h-[82px] select-none">
              <AnimatePresence mode="popLayout">
                {visibleConvs.map((conv, idx) => {
                  const isTop = idx === 0;
                  return (
                    <motion.div
                      key={conv.user.id}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '72px',
                        top: 0,
                        left: 0,
                        pointerEvents: isTop ? 'auto' : 'none',
                      }}
                      initial={{ opacity: 0, scale: 0.9, y: 15 }}
                      animate={{
                        opacity: 1 - idx * 0.25,
                        scale: 1 - idx * 0.04,
                        y: idx * 5,
                        zIndex: 30 - idx,
                      }}
                      exit={{
                        x: 240,
                        opacity: 0,
                        scale: 0.85,
                        transition: { duration: 0.25 },
                      }}
                      transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                      onClick={() => {
                        if (isTop) navigate(`/communication-hub?userId=${conv.user.id}`);
                      }}
                      className={`flex items-center gap-2 p-1.5 rounded-xl border shadow-lg cursor-pointer ${
                        isDarkMode
                          ? 'bg-white border-zinc-200 text-zinc-950 shadow-md'
                          : 'bg-black border-white/15 text-white shadow-[0_4px_20px_rgba(255,255,255,0.05)]'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full p-[1px] ring-2 ring-emerald-500/85">
                          <img
                            src={conv.user.profilePicture || defaultProfile}
                            alt={conv.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 flex flex-col justify-between h-full py-0.5">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold truncate leading-none">{conv.user.name}</h4>
                            <span className={`text-[7.5px] font-semibold shrink-0 leading-none ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              {formatTimeAgo(conv.lastMessage.createdAt)}
                            </span>
                          </div>
                          <p className={`text-[9.5px] truncate mt-0.5 leading-none ${isDarkMode ? 'text-zinc-600' : 'text-zinc-300'}`}>
                            {conv.lastMessage.content}
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-extrabold uppercase tracking-wider ${
                            isDarkMode
                              ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-[0_1.5px_6px_rgba(244,63,94,0.3)]'
                              : 'bg-white text-zinc-950 hover:bg-zinc-100'
                          }`}>
                            View Chat
                          </span>
                        </div>
                      </div>

                      {isTop && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCardIndex(prev => prev + 1);
                          }}
                          className="absolute -top-1 -right-1 p-0.5 rounded-full bg-rose-500 text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer z-50 flex items-center justify-center"
                          title="Dismiss"
                        >
                          <Plus size={8} className="rotate-45" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Navigation Card */}
        <div className={`rounded-[24px] border p-4 transition-all duration-300 ${isDarkMode ? 'bg-black border-border-main' : 'bg-zinc-50/50 border-zinc-950 border-[1.5px] shadow-sm hover:shadow-md'} flex flex-col flex-1`}>
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.12em] px-2 mb-3">
            Navigation
          </p>

          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => {
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