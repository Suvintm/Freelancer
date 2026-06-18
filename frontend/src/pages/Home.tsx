import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Plus, Volume2, VolumeX } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import defaultProfile from '../assets/defaultprofile.png';
import { FeatureGallery } from '../components/home/FeatureGallery';
import { UnifiedBanner } from '../components/home/UnifiedBanner';
import { useTheme } from '../hooks/useTheme';
import darkLogo from '../assets/darklogo.png';
import lightLogo from '../assets/lightlogo.png';

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
  id: number;
  user: string;
  location: string;
  img: string;
  likes: string;
  comment: string;
  commentsCount: number;
  musicUrl?: string;
  videoUrl?: string;
  isVideo?: boolean;
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

export default function Home() {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isDarkMode } = useTheme();
  const user = useSelector(selectUser);
  const userAvatar = user?.profilePicture || defaultProfile;

  const stories: Story[] = [
    { _id: 'me', username: 'Your Story', avatar: userAvatar, isUser: true, hasActive: false },
    ...SUVIX_INDUSTRY_STORIES,
  ];

  useEffect(() => {
    const mainContainer = document.querySelector('main');
    if (!mainContainer) return;

    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);
    };

    mainContainer.addEventListener('scroll', handleScroll);
    return () => {
      mainContainer.removeEventListener('scroll', handleScroll);
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
                    <div className={`absolute inset-0 rounded-full p-[2px] transition-transform duration-500 group-active:scale-95 ${story.hasActive || story.isUser ? (isDarkMode ? 'bg-gradient-to-tr from-white to-zinc-500' : 'bg-gradient-to-tr from-black to-zinc-400') : 'bg-border-main opacity-40'}`}>
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
                  <div className={`absolute inset-0 rounded-full p-[2px] transition-transform duration-500 group-active:scale-95 ${story.hasActive || story.isUser ? (isDarkMode ? 'bg-gradient-to-tr from-white to-zinc-500' : 'bg-gradient-to-tr from-black to-zinc-400') : 'bg-border-main opacity-40'}`}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {POSTS.map((post) => (
            <PostCard key={post.id} post={post} isDarkMode={isDarkMode} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PostCard({ post, isDarkMode }: { post: Post; isDarkMode: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Default to unmuted so music is heard immediately on hover
  const [isMobile, setIsMobile] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const target = e.currentTarget;
    if (target.duration) {
      setProgress((target.currentTime / target.duration) * 100);
    }
  };

  const playMedia = () => {
    if (post.isVideo) {
      if (videoRef.current) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.log('Video autoplay blocked or interrupted:', err);
        });
      }
    } else {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.log('Audio autoplay blocked or interrupted:', err);
        });
      }
    }
  };

  const pauseMedia = () => {
    if (post.isVideo) {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Hover play for laptop/desktop
  const handleMouseEnter = () => {
    if (!isMobile) {
      playMedia();
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      pauseMedia();
    }
  };

  // Viewport scroll play for mobile view
  const handleViewportEnter = () => {
    if (isMobile) {
      playMedia();
    }
  };

  const handleViewportLeave = () => {
    if (isMobile) {
      pauseMedia();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.isVideo) {
      if (videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.muted = !audioRef.current.muted;
        setIsMuted(audioRef.current.muted);
      }
    }
  };

  return (
    <motion.article 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      onViewportEnter={handleViewportEnter}
      onViewportLeave={handleViewportLeave}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`lg:border lg:border-border-main lg:rounded-[40px] overflow-hidden group lg:shadow-xl border-b border-border-main lg:border-b-0 pb-8 lg:pb-0 relative ${
        isDarkMode ? 'bg-black' : 'bg-white shadow-2xl'
      }`}
    >
      {post.isVideo ? (
        <video 
          ref={videoRef}
          src={post.videoUrl}
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          className="hidden" // Just holding reference, layout renders it in image container
        />
      ) : (
        <audio 
          ref={audioRef} 
          src={post.musicUrl} 
          loop 
          muted={isMuted}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
        />
      )}

      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-border-main p-0.5">
            <img src={post.img} alt={post.user} className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <h4 className="text-[13px] font-black text-text-main leading-none mb-1">{post.user}</h4>
            <p className="text-[10px] text-text-muted font-bold">{post.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPlaying && (
            <button 
              onClick={toggleMute}
              className={`p-1.5 rounded-full transition-colors ${
                isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="animate-pulse text-green-500" />}
            </button>
          )}
          <button className="text-text-muted hover:text-text-main transition-colors p-2"><MoreHorizontal size={18} /></button>
        </div>
      </div>

      <div className="aspect-[4/5] lg:aspect-square relative overflow-hidden bg-border-secondary">
        {post.isVideo ? (
          <video 
            ref={videoRef}
            src={post.videoUrl}
            loop
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={post.img} alt="Post content" className="w-full h-full object-cover" />
        )}
        
        {/* Sleek bottom progress bar overlay */}
        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-10">
            <div 
              className="h-full bg-green-500 transition-all duration-75 origin-left"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Play/Music indicator overlay with animated soundwave visualizer */}
        {isPlaying && (
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-full flex items-center gap-2 text-white text-[9px] font-bold tracking-wide border border-white/10 select-none z-15">
            {/* Animated sound wave bars */}
            <div className="flex items-end gap-[2px] h-[10px] w-[14px]">
              <span className="w-[2px] bg-green-400 rounded-full visualizer-bar" style={{ animationDelay: '0.1s' }} />
              <span className="w-[2px] bg-green-400 rounded-full visualizer-bar" style={{ animationDelay: '0.4s' }} />
              <span className="w-[2px] bg-green-400 rounded-full visualizer-bar" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>{post.isVideo ? 'VIDEO PLAYING' : 'MUSIC PLAYING'}</span>
          </div>
        )}
      </div>

      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button className="text-text-main hover:text-rose-500 transition-colors transform active:scale-90"><Heart size={24} /></button>
            <button className="text-text-main hover:text-text-main transition-colors transform active:scale-90"><MessageCircle size={24} /></button>
            <button className="text-text-main hover:text-text-main transition-colors transform active:scale-90"><Share2 size={24} /></button>
          </div>
          <button className="text-text-main hover:text-text-main transition-colors transform active:scale-90"><Bookmark size={24} /></button>
        </div>

        <div className="space-y-1.5">
          <p className="text-[13px] text-text-main font-black">{post.likes} likes</p>
          <p className="text-[13px] text-text-main leading-relaxed">
            <span className="font-black mr-2 uppercase tracking-tight text-[11px]">{post.user.split(' ')[0]}</span>
            <span className="text-text-muted dark:text-zinc-400 font-medium">{post.comment}</span>
          </p>
          <button className="text-[12px] text-text-muted font-bold mt-2 opacity-60 hover:opacity-100 transition-opacity">View all {post.commentsCount} comments</button>
        </div>
      </div>
    </motion.article>
  );
}

function VerifiedDecagram({ size, color, className }: { size: number, color: string, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M23,12L20.56,9.22L20.9,5.54L17.29,4.72L15.4,1.54L12,3L8.6,1.54L6.71,4.72L3.1,5.53L3.44,9.21L1,12L3.44,14.78L3.1,18.47L6.71,19.29L8.6,22.47L12,21L15.4,22.46L17.29,19.28L20.9,18.46L20.56,14.79L23,12M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z" />
    </svg>
  );
}
