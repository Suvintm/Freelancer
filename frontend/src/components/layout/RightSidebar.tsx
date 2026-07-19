import { ReactLenis }    from 'lenis/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import {
  Home, Search, PlaySquare, Briefcase,
  Settings, LogOut, Compass, User, MapPin, PlusSquare, Youtube, MessageSquare, Plus, Heart, ArrowRight
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';
import defaultProfile from '../../assets/defaultprofile.png';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api/client';
import LottieComponent from 'lottie-react';
import sidebarLottieAnimation from '../../assets/lottie/sidebar_lottie.json';
import { OnboardingSyncOverlay } from '../onboarding/OnboardingSyncOverlay';

const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

const NAV_ITEMS = [
  { icon: Home,       label: 'Feed',      path: '/home'    },
  { icon: Search,     label: 'Explore',   path: '/explore' },
  { icon: Compass,    label: 'Discover',  path: '/discover'},
  { icon: MapPin,     label: 'Nearby',    path: '/nearby'  },
  { icon: PlaySquare, label: 'Reels',     path: '/reels'   },
  { icon: Briefcase,  label: 'Jobs',      path: '/jobs'    },
  { icon: MessageSquare, label: 'Chats',   path: '/communication-hub' },
  { icon: PlusSquare, label: 'Create', path: '/create' },
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

interface SidebarConversation {
  user: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  lastMessage: {
    createdAt: string;
    content: string;
  };
}

export const RightSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const user = useSelector(selectUser);
  const avatarUrl = user?.profilePicture || defaultProfile;

  const [conversations, setConversations] = useState<SidebarConversation[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [likedConvs, setLikedConvs] = useState<Record<string, boolean>>({});
  const [showTestSync, setShowTestSync] = useState(false);

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
    let items = [...NAV_ITEMS];
    const isClientCategory = ['social_promoter', 'direct_client'].includes(user?.primaryRole?.category || '');
    if (isClientCategory) {
      items = items.filter(item => item.path !== '/upload-portal' && item.path !== '/reels');
    }
    if (hasYoutube) {
      const settingsIndex = items.findIndex(item => item.path === '/settings');
      if (settingsIndex !== -1) {
        items.splice(settingsIndex, 0, { icon: Youtube, label: 'YT Dashboard', path: '/youtube-dashboard' });
      } else {
        items.push({ icon: Youtube, label: 'YT Dashboard', path: '/youtube-dashboard' });
      }
    }
    return items;
  }, [hasYoutube, user?.primaryRole?.category]);

  const visibleConvs = conversations.slice(activeCardIndex, activeCardIndex + 3);

  return (
    <ReactLenis className="w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
      <div className="flex flex-col flex-1 px-4 py-6 gap-4">

        {/* ── Test Sync Button ── */}
        <button
          onClick={() => setShowTestSync(true)}
          className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Youtube size={14} />
          Test Sync UI
        </button>
        {showTestSync && <OnboardingSyncOverlay nextRoute="/home" />}

        {/* ── Creator Tools Promotion Widget ── */}
        <div 
          onClick={() => navigate('/creator-tools')}
          className={`w-full rounded-2xl overflow-hidden mb-2 flex flex-col cursor-pointer transition-all border ${
            isDarkMode ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="w-full aspect-video flex items-center justify-center p-4">
            <Lottie 
              animationData={sidebarLottieAnimation} 
              loop={true} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          <div className="w-full p-3 pt-0 flex justify-center">
            <button className={`w-full text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5 ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-zinc-200' 
                : 'bg-black text-white hover:bg-zinc-800'
            }`}>
              Explore Tools
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* ── Latest Messages Widget ── */}
        {visibleConvs.length > 0 && (
          <div className="w-full flex flex-col gap-1.5">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.12em] px-1">
              Messages
            </p>
            <div className="relative w-full h-[98px] select-none">
              <AnimatePresence mode="popLayout">
                {visibleConvs.map((conv, idx) => {
                  const isTop = idx === 0;
                  const isLiked = likedConvs[conv.user.id] || false;
                  return (
                    <motion.div
                      key={conv.user.id}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '76px',
                        top: '16px',
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
                      className={`flex items-center gap-3 p-3 rounded-[20px] border shadow-lg cursor-pointer ${
                        isDarkMode
                          ? 'bg-[#0c0c0e] border-white/10 text-white shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
                          : 'bg-white border-zinc-200/80 text-zinc-950 shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
                      }`}
                    >
                      {/* Left: highly rounded profile style avatar */}
                      <img
                        src={conv.user.profilePicture || defaultProfile}
                        alt={conv.user.name}
                        className="w-12 h-12 rounded-[16px] object-cover shadow-sm shrink-0 border dark:border-white/10 border-zinc-200/60"
                      />

                      {/* Middle: text layout */}
                      <div className="min-w-0 flex-1 flex flex-col justify-center h-full">
                        <h4 className={`text-xs font-bold truncate leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                          {conv.user.name}
                        </h4>
                        <p className={`text-[10px] truncate mt-1 leading-tight flex items-center gap-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          <span>{formatTimeAgo(conv.lastMessage.createdAt)} ago</span>
                          <span>•</span>
                          <span className="truncate">{conv.lastMessage.content}</span>
                        </p>
                      </div>

                      {/* Top-Right: Hanging squircle buttons */}
                      {isTop && (
                        <div 
                          className="absolute -top-3.5 right-4 flex items-center gap-1.5 z-40"
                          onClick={(e) => e.stopPropagation()} // Prevent card click navigation
                        >
                          {/* Chat button */}
                          <button
                            onClick={() => navigate(`/communication-hub?userId=${conv.user.id}`)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border ${
                              isDarkMode
                                ? 'bg-[#18181b] border-white/10 text-white hover:bg-zinc-800'
                                : 'bg-white border-zinc-200 text-zinc-950 hover:bg-zinc-50'
                            }`}
                            title="Message"
                          >
                            <MessageSquare size={14} />
                          </button>

                          {/* Heart/Like button */}
                          <button
                            onClick={() => {
                              setLikedConvs(prev => ({ ...prev, [conv.user.id]: !prev[conv.user.id] }));
                            }}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border ${
                              isDarkMode
                                ? 'bg-[#18181b] border-white/10 text-white hover:bg-zinc-800'
                                : 'bg-white border-zinc-200 text-zinc-950 hover:bg-zinc-50'
                            }`}
                            title="Favorite"
                          >
                            <Heart 
                              size={14} 
                              className={isLiked ? "text-rose-500 fill-rose-500 transition-colors" : "text-current transition-colors"} 
                            />
                          </button>
                        </div>
                      )}

                      {/* Top-Left: Dismiss close button */}
                      {isTop && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCardIndex(prev => prev + 1);
                          }}
                          className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-rose-500 text-white shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer z-50 flex items-center justify-center"
                          title="Dismiss"
                        >
                          <Plus size={10} className="rotate-45" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* YouTube Analytics Callout Widget */}
        {user?.primaryRole?.category === 'yt_influencer' && !hasYoutube && (
          <div className={`p-4 rounded-[20px] border flex flex-col gap-2 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-amber-500/10 via-zinc-950/20 to-zinc-950 border-amber-500/20' 
              : 'bg-gradient-to-br from-amber-50/60 via-white to-white border-amber-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-1.5 text-amber-500">
              <Youtube size={14} className="fill-current stroke-none" />
              <p className="text-[10px] font-black uppercase tracking-wider">
                Boost Sponsorships
              </p>
            </div>
            <p className={`text-[11px] font-medium leading-normal ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Connect your YouTube Analytics to display verified stats and **get sponsors 10x faster**!
            </p>
            <button 
              onClick={() => navigate('/youtube-dashboard')}
              className="w-full mt-1.5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-black font-bold text-[11px] rounded-xl transition-all cursor-pointer shadow-sm shadow-amber-500/20 flex items-center justify-center gap-1"
            >
              Connect Now
            </button>
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