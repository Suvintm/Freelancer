import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import defaultProfile from '../assets/defaultprofile.png';
import { FeatureGallery } from '../components/home/FeatureGallery';
import { UnifiedBanner } from '../components/home/UnifiedBanner';
import { useTheme } from '../hooks/useTheme';
import darkLogo from '../assets/darklogo.png';
import lightLogo from '../assets/lightlogo.png';
import { api } from '../api/client';
import { FeedPost } from '../components/temp-feed/FeedPost';
import { FeedReel } from '../components/temp-feed/FeedReel';
import { FeedYoutube } from '../components/temp-feed/FeedYoutube';

interface Story {
  _id: string;
  username: string;
  avatar: string;
  hasActive: boolean;
  isUser?: boolean;
  verifiedColor?: string;
  isSeen?: boolean;
}

const SUVIX_INDUSTRY_STORIES: Story[] = [
  {
    _id: '1_yt_creator',
    username: 'SuviX',
    avatar: 'https://images.unsplash.com/photo-1516280440502-a2ce893ce71d?auto=format&fit=crop&q=80&w=200',
    isSeen: false,
    verifiedColor: '#EF4444', // Red for YT Creator
    hasActive: true,
  },
  {
    _id: '2_fitness_influencer',
    username: 'SuviX',
    avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200',
    isSeen: false,
    verifiedColor: '#22C55E', // Green for Fitness
    hasActive: true,
  },
  {
    _id: '4_editor',
    username: 'SuviX',
    avatar: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=200',
    isSeen: true,
    verifiedColor: '#3B82F6', // Blue for Editor
    hasActive: true,
  },
  {
    _id: '5_client',
    username: 'SuviX',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    isSeen: true,
    verifiedColor: '#A855F7', // Purple for Client
    hasActive: true,
  }
];

// STORIES array moved inside Home component to support dynamic user state.
 
interface Post {
  id: string | number;
  user: string;
  location: string;
  img: string;
  likes: string | number;
  comment: string;
  commentsCount: number;
  musicUrl?: string;
  videoUrl?: string;
  isVideo?: boolean;
  isYtVideo?: boolean;
  images?: string[];
  type?: string;
}

const POSTS: Post[] = [
  { 
    id: 1, 
    user: 'Sonya Leena', 
    location: 'Dubai, UAE', 
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800', 
    likes: '360', 
    comment: 'You can never dull my sparkle ✨', 
    commentsCount: 12,
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  { 
    id: 2, 
    user: 'Adam Addisin', 
    location: 'Oklahoma, US', 
    img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800', 
    likes: '1,240', 
    comment: 'In photography, there is a reality so subtle that it becomes more real than reality.', 
    commentsCount: 45,
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 3,
    user: 'Chloe Bennett',
    location: 'Tokyo, Japan',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800',
    likes: '942',
    comment: 'Neon lights and late night walks 🌃',
    commentsCount: 22,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    isVideo: true
  },
  { 
    id: 4, 
    user: 'Liam Vance', 
    location: 'London, UK', 
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800', 
    likes: '820', 
    comment: 'Exploring the classic streets of London.', 
    commentsCount: 18,
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 5,
    user: 'Emily Watson',
    location: 'Paris, France',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    likes: '2,110',
    comment: 'Bonjour Paris! 🥖✨',
    commentsCount: 56,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    isVideo: true
  },
  { 
    id: 6, 
    user: 'Sarah Jenkins', 
    location: 'New York, US', 
    img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800', 
    likes: '1,560', 
    comment: 'Concrete jungle where dreams are made of.', 
    commentsCount: 38,
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  { 
    id: 7, 
    user: 'David Miller', 
    location: 'Rio de Janeiro, Brazil', 
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800', 
    likes: '710', 
    comment: 'Samba, sun, and beautiful beaches 🏖️', 
    commentsCount: 15,
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 8,
    user: 'Maya Lin',
    location: 'Sydney, Australia',
    img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800',
    likes: '1,890',
    comment: 'Golden hour at the harbor 🌅',
    commentsCount: 30,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    isVideo: true
  },
  { 
    id: 9, 
    user: 'Lucas Silva', 
    location: 'Berlin, Germany', 
    img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800', 
    likes: '640', 
    comment: 'Berlin Wall history and urban vibes.', 
    commentsCount: 11,
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  { 
    id: 10, 
    user: 'Elena Petrova', 
    location: 'Rome, Italy', 
    img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800', 
    likes: '3,050', 
    comment: 'La dolce vita 🍝🇮🇹', 
    commentsCount: 89,
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    id: 11,
    user: 'Sophia Loren',
    location: 'San Francisco, US',
    img: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=800',
    likes: '1,420',
    comment: 'Foggy mornings and bridge views.',
    commentsCount: 42,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    isVideo: true
  },
  { 
    id: 12, 
    user: 'Kenji Sato', 
    location: 'Toronto, Canada', 
    img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800', 
    likes: '990', 
    comment: 'CN Tower view from my balcony!', 
    commentsCount: 20,
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  { 
    id: 13, 
    user: 'Clara Oswald', 
    location: 'Cape Town, South Africa', 
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800', 
    likes: '2,500', 
    comment: 'Standing on top of Table Mountain ⛰️', 
    commentsCount: 71,
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  },
  {
    id: 14,
    user: 'Arthur Dent',
    location: 'Singapore',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
    likes: '1,120',
    comment: 'Gardens by the bay is futuristic!',
    commentsCount: 29,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    isVideo: true
  },
  { 
    id: 15, 
    user: 'Bruce Wayne', 
    location: 'Mumbai, India', 
    img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800', 
    likes: '4,200', 
    comment: 'Monsoon in Mumbai is magical.', 
    commentsCount: 110,
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'
  },
  { 
    id: 16, 
    user: 'Selina Kyle', 
    location: 'Seoul, South Korea', 
    img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800', 
    likes: '1,980', 
    comment: 'Street food and cherry blossoms 🌸', 
    commentsCount: 54,
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3'
  },
  {
    id: 17,
    user: 'Clark Kent',
    location: 'Amsterdam, Netherlands',
    img: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=800',
    likes: '2,670',
    comment: 'Biking along the canals.',
    commentsCount: 63,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    isVideo: true
  },
  { 
    id: 18, 
    user: 'Diana Prince', 
    location: 'Reykjavik, Iceland', 
    img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800', 
    likes: '3,890', 
    comment: 'Chasing the Northern Lights 🌌', 
    commentsCount: 95,
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'
  },
  { 
    id: 19, 
    user: 'Tony Stark', 
    location: 'Cairo, Egypt', 
    img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800', 
    likes: '5,300', 
    comment: 'Standing in front of the Pyramids ⏳', 
    commentsCount: 142,
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3'
  },
  {
    id: 20,
    user: 'Bruce Banner',
    location: 'Kyoto, Japan',
    img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800',
    likes: '1,450',
    comment: 'Peaceful zen gardens 🎋',
    commentsCount: 37,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    isVideo: true
  }
];

interface DbFeedItem {
  _id: string;
  user: string;
  location?: string;
  images?: string[];
  likes: string | number;
  comment: string;
  commentsCount: number;
  videoUrl?: string;
  type: string;
}

export default function Home() {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isDarkMode } = useTheme();
  const user = useSelector(selectUser);
  const userAvatar = user?.profilePicture || defaultProfile;

  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [globalMuted, setGlobalMuted] = useState(true);
  const [activePostId, setActivePostId] = useState<string | number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      // For mobile: focus on the middle of the screen (center 10% of viewport)
      // For desktop: require 60% visibility of the element
      rootMargin: isMobile ? '-45% 0px -45% 0px' : '0px',
      threshold: isMobile ? 0 : 0.6
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const postId = entry.target.getAttribute('data-post-id');
        if (postId) {
          const id = isNaN(Number(postId)) ? postId : Number(postId);
          if (entry.isIntersecting) {
            setActivePostId(id);
          } else {
            setActivePostId((prevActiveId) => {
              if (prevActiveId === id) {
                return null;
              }
              return prevActiveId;
            });
          }
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('[data-post-id]');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [feedPosts, isMobile]); // Re-run when feedPosts or mobile layout status changes

  useEffect(() => {
    const fetchFeed = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/temp-feed');
        if (response.data.success && response.data.data.length > 0) {
          const dbPosts: Post[] = response.data.data.map((item: DbFeedItem) => ({
            id: item._id,
            user: item.user,
            location: item.location || 'Unknown Location',
            img: item.images?.[0] || '',
            images: item.images || [],
            likes: item.likes,
            comment: item.comment,
            commentsCount: item.commentsCount,
            videoUrl: item.videoUrl || '',
            isVideo: item.type === 'reel' || item.type === 'yt_video',
            isYtVideo: item.type === 'yt_video',
            type: item.type
          }));
          
          // Shuffling dynamically on page refresh to show fresh content
          const shuffled = [...dbPosts].sort(() => Math.random() - 0.5);
          setFeedPosts(shuffled);
        } else {
          setFeedPosts(POSTS);
        }
      } catch (error) {
        console.error('Error fetching temp feed:', error);
        setFeedPosts(POSTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const stories: Story[] = [
    { _id: 'me', username: 'Your Story', avatar: userAvatar, isUser: true, hasActive: false },
    ...SUVIX_INDUSTRY_STORIES,
  ];

  useEffect(() => {
    const scrollContainer = document.querySelector('main')?.closest('.overflow-y-auto') || document.querySelector('main');
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-4 lg:space-y-10 pb-20">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes soundwave-bar {
          0%, 100% { transform: scaleY(0.2); }
          50% { transform: scaleY(1); }
        }
        .visualizer-bar {
          transform-origin: bottom;
          animation: soundwave-bar 0.8s ease-in-out infinite;
        }
      ` }} />
      
      {/* ─── DESKTOP TOP VIEW LAYOUT ─── */}
      <div className="hidden lg:flex flex-col gap-10">
        <div className="flex flex-col lg:flex-row-reverse gap-6 lg:items-center">
          {/* 1. Banner Section */}
          <section className="lg:w-1/2 px-6 lg:px-0">
            <UnifiedBanner />
          </section>

          {/* 2. Stories Section */}
          <section className="lg:w-1/2 -mx-4 lg:mx-0">
            <div className="hidden lg:block mb-8 px-1">
              <img 
                src={isDarkMode ? darkLogo : lightLogo} 
                alt="SuviX" 
                className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity" 
              />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-6 lg:px-0">
              {stories.map((story) => (
                <div key={story._id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group relative">
                  <div className="relative w-[60px] h-[60px] lg:w-[68px] lg:h-[68px] flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-0 group-hover:opacity-60 transition-opacity duration-500 scale-110 group-hover:scale-100">
                      <circle cx="50%" cy="50%" r="48%" className={`fill-none stroke-current stroke-1 ${isDarkMode ? 'text-white' : 'text-black'}`} strokeDasharray="4 8" strokeLinecap="round" />
                    </svg>
                    <div className={`absolute inset-0 rounded-full p-[2px] transition-transform duration-500 group-active:scale-95 ${story.hasActive || story.isUser ? 'bg-black' : 'bg-black/20'}`}>
                      <div className="w-full h-full rounded-full bg-container p-[2px]">
                        <img src={story.avatar} alt={story.username} className="w-full h-full rounded-full object-cover bg-border-secondary shadow-inner" />
                      </div>
                    </div>
                    {story.isUser && !story.hasActive && (
                      <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full border-2 border-container p-0.5 shadow-lg">
                        <Plus size={8} className="text-white" strokeWidth={4} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 max-w-[60px] lg:max-w-[68px]">
                    <span className={`text-[9px] font-bold truncate ${story.hasActive ? 'text-text-main' : 'text-text-muted'}`}>{story.username}</span>
                    {story.verifiedColor && <VerifiedDecagram size={10} color={story.verifiedColor} className="flex-shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Feature Gallery */}
        <section className="-mx-4 lg:mx-0 -mt-2 lg:mt-0">
          <FeatureGallery paused={isScrolling} />
        </section>
      </div>

      {/* ─── MOBILE SPLIT LAYOUT ─── */}
      <div className="flex lg:hidden gap-3 items-start -mr-4 flex-row-reverse">
        
        {/* Right Column: Vertical Stories Sidebar (Instagram style) */}
        <div className="relative flex-shrink-0">
          <div className={`
            w-[84px] h-[310px] flex flex-col items-center py-4 px-1 rounded-l-[40px] rounded-r-none overflow-y-auto scrollbar-hide gap-4.5   overscroll-y-contain touch-pan-y will-change-scroll
            ${isDarkMode ? 'bg-[#242526]' : 'bg-[#C8CBD0]'}
          `}>
            {stories.map((story) => (
              <motion.div 
                key={story._id} 
                whileTap={{ scale: 0.92, rotate: story.isUser ? 0 : [0, -3, 3, 0] }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group relative"
              >
                <div className="relative w-[56px] h-[56px] flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-0 group-hover:opacity-60 transition-opacity duration-500 scale-110 group-hover:scale-100">
                    <circle cx="50%" cy="50%" r="48%" className={`fill-none stroke-current stroke-1 ${isDarkMode ? 'text-white' : 'text-black'}`} strokeDasharray="4 8" strokeLinecap="round" />
                  </svg>
                  <div className={`absolute inset-0 rounded-full p-[2px] transition-transform duration-500 group-active:scale-95 ${story.hasActive || story.isUser ? 'bg-black' : 'bg-black/20'}`}>
                    <div className="w-full h-full rounded-full bg-container p-[2px]">
                      <img src={story.avatar} alt={story.username} className="w-full h-full rounded-full object-cover bg-border-secondary shadow-inner" />
                    </div>
                  </div>
                  {story.isUser && !story.hasActive && (
                    <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full border-2 border-container p-0.5 shadow-lg">
                      <Plus size={8} className="text-white" strokeWidth={4} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 max-w-[56px]">
                  <span className={`text-[8.5px] font-bold truncate ${story.hasActive ? 'text-text-main' : 'text-text-muted'}`}>{story.username}</span>
                  {story.verifiedColor && <VerifiedDecagram size={9} color={story.verifiedColor} className="flex-shrink-0" />}
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Floating Rotated Plus Icon */}
          <div className="absolute -top-3 left-3 transform -rotate-12 z-10 pointer-events-none">
            <Plus 
              size={24} 
              strokeWidth={3.5} 
              className={`${isDarkMode ? 'text-white/90' : 'text-zinc-500/80'} drop-shadow-sm`} 
            />
          </div>
        </div>

        {/* Left Column: Stacked Banner & Features Gallery */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="w-full h-[226px]">
            <UnifiedBanner className="h-full" />
          </div>
          <div className="w-full">
            <FeatureGallery paused={isScrolling} isMobileLayout={true} />
          </div>
        </div>
      </div>

      {/* 4. Unified Feed */}
      <section className="-mx-4 lg:mx-0 -mt-2 lg:mt-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={32} className="animate-spin text-accent-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {feedPosts.map((post) => {
              const isActive = activePostId === post.id;
              if (post.type === 'reel') return <FeedReel key={post.id} post={post} isDarkMode={isDarkMode} isActive={isActive} isMuted={globalMuted} onToggleMute={() => setGlobalMuted(!globalMuted)} />;
              if (post.type === 'yt_video') return <FeedYoutube key={post.id} post={post} isDarkMode={isDarkMode} isActive={isActive} isMuted={globalMuted} onToggleMute={() => setGlobalMuted(!globalMuted)} />;
              return <FeedPost key={post.id} post={post} isDarkMode={isDarkMode} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
}



function VerifiedDecagram({ size, color, className }: { size: number, color: string, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M23,12L20.56,9.22L20.9,5.54L17.29,4.72L15.4,1.54L12,3L8.6,1.54L6.71,4.72L3.1,5.53L3.44,9.21L1,12L3.44,14.78L3.1,18.47L6.71,19.29L8.6,22.47L12,21L15.4,22.46L17.29,19.28L20.9,18.46L20.56,14.79L23,12M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z" />
    </svg>
  );
}
