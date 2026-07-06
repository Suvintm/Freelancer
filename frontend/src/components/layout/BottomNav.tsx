import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  MapPin, 
  PlusCircle,
  X
} from 'lucide-react';
import { 
  MdOutlineVideoCameraBack, 
  MdOutlineImage, 
  MdOutlinePlayCircle, 
  MdOutlinePoll 
} from 'react-icons/md';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import defaultProfile from '../../assets/defaultprofile.png';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { name: 'home', icon: Home, label: 'Home', path: '/home' },
  { name: 'explore', icon: Search, label: 'Explore', path: '/explore' },
  { name: 'upload', icon: PlusCircle, label: 'Upload', path: '/create', isUpload: true },
  { name: 'nearby', icon: MapPin, label: 'Nearby', path: '/nearby' },
  { name: 'profile', icon: null, label: 'Profile', path: '/profile', isProfile: true },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const profileAvatar = user?.profilePicture || defaultProfile;

  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to hide/show logic & Inactivity Timer
  useEffect(() => {
    let ticking = false;

    const startInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        // Auto-hide after 3 seconds if not at top and upload sheet isn't open
        if (lastScrollY.current > 15 && !isUploadSheetOpen) {
          setIsVisible(false);
        }
      }, 3000);
    };

    const handleInteraction = () => {
      startInactivityTimer();
    };

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document | Window;
      
      // Ignore scroll events from elements that are not block-scroll containers or are horizontal scroll areas
      if (target instanceof HTMLElement) {
        if (target.scrollWidth > target.clientWidth && target.scrollHeight <= target.clientHeight) {
          return;
        }
      }

      const getScrollTop = () => {
        if (target === document || target === window || target === document.documentElement || target === document.body) {
          return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
        }
        return (target as HTMLElement).scrollTop || 0;
      };

      const currentScrollY = getScrollTop();
      const diff = currentScrollY - lastScrollY.current;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (currentScrollY <= 15) {
            // Always show at the very top of the page
            setIsVisible(true);
          } else if (diff > 12) {
            // Scrolling down significantly
            setIsVisible(false);
          } else if (diff < -12) {
            // Scrolling up significantly
            setIsVisible(true);
          }
          lastScrollY.current = currentScrollY;
          ticking = false;
          
          startInactivityTimer();
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('click', handleInteraction, { passive: true });
    
    startInactivityTimer();

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isUploadSheetOpen]);

  const isClientCategory = ['social_promoter', 'direct_client'].includes(user?.primaryRole?.category || '');
  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (isClientCategory) {
      return !item.isUpload;
    }
    return true;
  });

  const uploadOptions = [
    {
      title: 'Upload Reel',
      subtitle: 'Share short-form videos',
      url: '/upload-portal?type=reel',
      icon: <MdOutlineVideoCameraBack size={20} className="text-pink-500" />
    },
    {
      title: 'Upload Post',
      subtitle: 'Post updates, text or images',
      url: '/upload-portal?type=post',
      icon: <MdOutlineImage size={20} className="text-blue-500" />
    },
    {
      title: 'Upload YT Videos',
      subtitle: 'Link or sync YouTube videos',
      url: '/upload-portal?type=yt_video',
      icon: <MdOutlinePlayCircle size={20} className="text-red-500" />
    },
    {
      title: 'Create Polls',
      subtitle: 'Gather feedback from audience',
      url: '/upload-portal?type=post',
      icon: <MdOutlinePoll size={20} className="text-emerald-500" />
    }
  ];

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="lg:hidden fixed bottom-6 left-4 right-4 z-[60] flex justify-center pb-safe"
          >
            <nav className="h-[64px] w-full max-w-md bg-black rounded-[32px] shadow-2xl flex items-center justify-between px-2 sm:px-4 border border-zinc-800/40">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <Link 
                    key={item.path}
                    to={item.path}
                    onClick={(e) => {
                      if (item.isUpload) {
                        e.preventDefault();
                        setIsUploadSheetOpen(true);
                      }
                    }}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Bottom Sheet Modal */}
      <AnimatePresence>
        {isUploadSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadSheetOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d10] border-t border-zinc-800 rounded-t-[32px] p-6 z-[80] shadow-2xl pb-safe"
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white tracking-wide">Create Content</h3>
                <button
                  onClick={() => setIsUploadSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {uploadOptions.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => {
                      setIsUploadSheetOpen(false);
                      navigate(item.url);
                    }}
                    className="flex items-center gap-4 w-full text-left p-3.5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800/80 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-800/80 shrink-0 flex items-center justify-center transition-all group-hover:scale-105">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{item.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{item.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
