import { useState, useEffect, useRef, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, updateUser } from '../store/slices/authSlice';
import { MdStar, MdChevronRight, MdCheckCircle } from 'react-icons/md';
import defaultProfile from '../assets/defaultprofile.png';
import { FeatureGallery } from '../components/home/FeatureGallery';
import { UnifiedBanner } from '../components/home/UnifiedBanner';
import { useTheme } from '../hooks/useTheme';
import darkLogo from '../assets/darklogo.png';
import lightLogo from '../assets/lightlogo.png';
import ytDarkTheme from '../assets/banners/yt dark theme.png';
import ytLightTheme from '../assets/banners/yt light theme.png';
import { api } from '../api/client';
import { FeedPost } from '../components/temp-feed/FeedPost';
import { FeedReel } from '../components/temp-feed/FeedReel';
import { FeedYoutube } from '../components/temp-feed/FeedYoutube';
import { FeedThumbnailVote } from '../components/temp-feed/FeedThumbnailVote';
import { FeedPoll } from '../components/temp-feed/FeedPoll';

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
    username: 'ChaiAurCode',
    avatar: 'https://i.ytimg.com/vi/TZDbe_8raSA/maxresdefault.jpg',
    isSeen: false,
    verifiedColor: '#EF4444', // Red for YT Creator
    hasActive: true,
  },
  {
    _id: '2_fitness_influencer',
    username: 'Sam Sameer',
    avatar: 'https://tse1.explicit.bing.net/th/id/OIP.PMTNrFgQOWBq5Yxr63Bv6QAAAA?rs=1&pid=ImgDetMain&o=7&rm=3',
    isSeen: false,
    verifiedColor: '#22C55E', // Green for Fitness
    hasActive: true,
  },
  {
    _id: '4_editor',
    username: 'SuviX',
    avatar: 'https://media.istockphoto.com/id/1277971635/photo/portrait-of-a-smiling-man-of-indian-ethnicity.jpg?s=1024x1024&w=is&k=20&c=Ve_FZ5p_gO5Kd3gkW6nVicgiwAi5I0lXcW_L4MGKLEY=',
    isSeen: true,
    verifiedColor: '#3B82F6', // Blue for Editor
    hasActive: true,
  },
  {
    _id: '5_client',
    username: 'SuviX',
    avatar: 'https://media.istockphoto.com/id/1541953395/photo/young-happy-indian-parents-holding-cute-baby-boy-while-standing-at-home-asian-mom-and-dad.jpg?s=1024x1024&w=is&k=20&c=vBycraqLaqkFZreZRVCoKUrwmZHMLsdiVuasZ7I7Fsc=',
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
  tags?: string[];
  watchOnYtLink?: string;
  votes?: number[];
}

const POSTS: Post[] = [
  {
    id: 'mock_thumb_vote',
    type: 'thumbnail_vote',
    user: 'SuviX Official',
    location: 'Global',
    img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=800'
    ],
    likes: '12,400',
    comment: 'Help me choose the thumbnail for my next UI/UX redesign tutorial! Which one grabs your attention?',
    commentsCount: 342,
    tags: ['UIUX', 'Design', 'YouTubeGrowth']
  },
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
  watchOnYtLink?: string;
  votes?: number[];
}


export default function Home() {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const userAvatar = user?.profilePicture || defaultProfile;

  const [globalMuted, setGlobalMuted] = useState(true);
  const [activePostId, setActivePostId] = useState<string | number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { data: feedPosts = POSTS, isLoading } = useQuery({
    queryKey: ['temp-feed'],
    queryFn: async () => {
      try {
        const [tempFeedRes, pollsRes] = await Promise.all([
          api.get('/temp-feed').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/polls').catch(() => ({ data: { success: false, data: [] } }))
        ]);

        let dbPosts: any[] = [];

        if (tempFeedRes.data?.success && tempFeedRes.data.data?.length > 0) {
          dbPosts = tempFeedRes.data.data.map((item: DbFeedItem) => ({
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
            type: item.type,
            watchOnYtLink: item.watchOnYtLink || '',
            votes: item.votes || [],
          }));
        }

        if (pollsRes.data?.success && pollsRes.data.data?.length > 0) {
          const pollPosts = pollsRes.data.data.map((p: any) => ({
            id: p.id,
            user: {
              username: p.user?.username || 'Creator',
              profile: {
                name: p.user?.profile?.name || '',
                profile_picture: p.user?.profile?.profile_picture || ''
              }
            },
            type: p.type, // Should be "POLL"
            poll: {
              ...p.poll,
              totalVotes: p.poll?._count?.responses || 0,
              hasVoted: Array.isArray(p.poll?.responses) && p.poll.responses.length > 0,
              userResponse: p.poll?.responses?.[0] || null
            }
          }));
          dbPosts = [...dbPosts, ...pollPosts];
        }

        if (dbPosts.length > 0) {
          return dbPosts.sort(() => Math.random() - 0.5);
        }

        return POSTS;
      } catch (err) {
        console.error("Failed to fetch feeds:", err);
        return POSTS;
      }
    }
  });

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





  const isSocialPromoter = user?.primaryRole?.category === 'social_promoter';

  if (isSocialPromoter) {
    const bgImage = isDarkMode ? ytDarkTheme : ytLightTheme;
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-4 lg:py-6 flex flex-col gap-6 lg:gap-8 font-sans bg-transparent">
        
        {/* Top Hero Banner (Mockup Background Banner for Header elements only) */}
        <div className="relative w-full rounded-[24px] lg:rounded-[32px] overflow-hidden border border-border-main/50 shadow-md">
          {/* Background Image Layer */}
          <div 
            className="absolute inset-0 bg-cover bg-right bg-no-repeat z-0 transition-all duration-500"
            style={{ 
              backgroundImage: `url("${bgImage}")`,
            }}
          />
          
          {/* Readability Gradient Overlay */}
          <div className={`absolute inset-0 z-10 transition-all duration-500 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-[#000000] via-[#000000]/95 to-transparent md:from-[#000000] md:via-[#000000]/80 md:to-transparent/30' 
              : 'bg-gradient-to-r from-white via-white/95 to-transparent md:from-white md:via-white/85 md:to-transparent/30'
          }`} />
          
          {/* Banner Content Wrapper */}
          <div className="w-full px-6 py-8 lg:px-10 lg:py-14 flex flex-col relative z-20">
            {/* Logo Section */}
            <div className="w-full flex items-center justify-between mb-8 lg:mb-12">
              <img 
                src={isDarkMode ? darkLogo : lightLogo} 
                alt="SuviX Official Logo" 
                className="h-8 w-auto opacity-95 hover:opacity-100 transition-opacity" 
              />
              <span className="text-[10px] font-bold text-text-muted bg-border-secondary/40 border border-border-main/60 px-2.5 py-1 rounded-full uppercase tracking-wider select-none">Beta</span>
            </div>

            {/* Hero Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full text-center md:text-left space-y-6 md:max-w-xl flex flex-col items-center md:items-start"
            >
              {/* Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold tracking-wider uppercase select-none ${
                isDarkMode 
                  ? 'border-purple-500/30 bg-purple-500/10 text-purple-400' 
                  : 'border-purple-200 bg-purple-50 text-purple-600'
              }`}>
                Sponsorship Hub
              </div>

              {/* Heading */}
              <h1 className={`text-4xl lg:text-5xl font-black tracking-tight leading-tight ${
                isDarkMode 
                  ? 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]' 
                  : 'text-zinc-950'
              }`}>
                Powering Creator<br/>
                <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">Sponsorships.</span>
              </h1>

              {/* Subheading */}
              <p className={`text-sm lg:text-base font-medium leading-relaxed max-w-lg ${
                isDarkMode ? 'text-zinc-300 drop-shadow-[0_1px_5px_rgba(0,0,0,0.5)]' : 'text-zinc-700'
              }`}>
                Welcome to the SuviX Sponsor Portal. Discover top YouTube influencers, manage brand promotions, collaborate directly with content creators, and scale your brand reach.
              </p>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto">
                <button 
                  onClick={() => navigate('/explore')}
                  className={`w-full sm:w-auto h-12 px-8 rounded-xl font-bold text-sm transition-all active:scale-[0.98] cursor-pointer shadow-lg hover:shadow-xl ${
                    isDarkMode 
                      ? 'bg-white text-black hover:bg-zinc-200' 
                      : 'bg-zinc-950 text-white hover:bg-zinc-900'
                  }`}
                >
                  Explore Creators
                </button>
                <button 
                  onClick={() => navigate('/communication-hub')}
                  className={`w-full sm:w-auto h-12 px-8 rounded-xl border font-bold text-sm transition-all active:scale-[0.98] cursor-pointer backdrop-blur-md ${
                    isDarkMode 
                      ? 'border-zinc-800 bg-zinc-900/40 text-white hover:bg-zinc-800/60' 
                      : 'border-zinc-200 bg-zinc-50/40 text-zinc-700 hover:bg-zinc-100/60'
                  }`}
                >
                  Open Conversations
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 3-Column Info Cards (Rendered outside the background banner) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 pb-4 text-left">
          <div className={`p-6 rounded-2xl border space-y-3 transition-all hover:scale-[1.02] duration-300 ${
            isDarkMode 
              ? 'border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950/60' 
              : 'border-zinc-200 bg-zinc-50/50 hover:bg-white shadow-[0_2px_12px_rgba(0,0,0,0.01)] hover:shadow-md'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold">
              01
            </div>
            <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>Targeted Discovery</h3>
            <p className={`text-xs font-medium leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-zinc-550'}`}>
              Filter verified YouTube creators by subscriber counts, target language, category niche, and audience locations.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border space-y-3 transition-all hover:scale-[1.02] duration-300 ${
            isDarkMode 
              ? 'border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950/60' 
              : 'border-zinc-200 bg-zinc-50/50 hover:bg-white shadow-[0_2px_12px_rgba(0,0,0,0.01)] hover:shadow-md'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold">
              02
            </div>
            <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>Direct Partnerships</h3>
            <p className={`text-xs font-medium leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-zinc-550'}`}>
              Cut out agency middlemen. Message creators directly, negotiate sponsorship rates, and coordinate product placements.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border space-y-3 transition-all hover:scale-[1.02] duration-300 ${
            isDarkMode 
              ? 'border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950/60' 
              : 'border-zinc-200 bg-zinc-50/50 hover:bg-white shadow-[0_2px_12px_rgba(0,0,0,0.01)] hover:shadow-md'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold">
              03
            </div>
            <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>Full Campaign Tracking</h3>
            <p className={`text-xs font-medium leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-zinc-550'}`}>
              Manage all current integrations in one place, sync video analytics, and track total campaign performance metrics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 lg:space-y-10 pb-20 pt-1 lg:pt-4">
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
      <div className="hidden lg:flex flex-col gap-8 pb-4">
        {/* Logo, Widget, & Banner Container Group (To bypass parent gap-8 and remove whitespace) */}
        <div className="flex flex-col gap-0 w-full">
          {/* Logo Section */}
          <div className="w-full px-2 mt-0 mb-1 flex items-center justify-between relative z-30">
            <img 
              src={isDarkMode ? darkLogo : lightLogo} 
              alt="SuviX Official Logo" 
              className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity" 
            />
            <span className="text-[10px] font-bold text-text-muted bg-border-secondary/40 border border-border-main/60 px-2.5 py-1 rounded-full uppercase tracking-wider select-none">Beta</span>
          </div>

          {/* 1. Banner Section (Full Width Stacked) */}
          <section className="w-full">
            <UnifiedBanner />
          </section>
        </div>

        {/* 2 & 3. Stories and Feature Gallery (Side by Side) */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-center w-full">
          {/* Stories Section (60%) */}
          <section className="w-full lg:w-[60%]">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {stories.map((story) => (
                <div key={story._id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group relative">
                  <div className="relative w-[60px] h-[60px] lg:w-[68px] lg:h-[68px] flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-0 group-hover:opacity-60 transition-opacity duration-500 scale-110 group-hover:scale-100">
                      <circle cx="50%" cy="50%" r="48%" className={`fill-none stroke-current stroke-1 ${isDarkMode ? 'text-white' : 'text-black'}`} strokeDasharray="4 8" strokeLinecap="round" />
                    </svg>
                    <div className={`absolute inset-0 rounded-full p-[2px] transition-transform duration-500 group-active:scale-95 ${story.hasActive || story.isUser ? (isDarkMode ? 'bg-white' : 'bg-black') : (isDarkMode ? 'bg-white/20' : 'bg-black/20')}`}>
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
                    <span className={`text-[10px] font-medium truncate ${story.hasActive ? 'text-text-main' : 'text-text-muted'}`}>{story.username}</span>
                    {story.verifiedColor && <VerifiedDecagram size={10} color={story.verifiedColor} className="flex-shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Feature Gallery (40%) */}
          <section className="w-full lg:w-[40%] -mt-2 lg:mt-0">
            <FeatureGallery paused={isScrolling} />
          </section>
        </div>
      </div>

      {/* ─── MOBILE SPLIT LAYOUT ─── */}
      <div className="relative lg:hidden -mt-3 lg:mt-0 min-h-[310px]">
        
        {/* Left Column: Stacked Banner & Feature Gallery (Full width, behind the stories sidebar) */}
        <div className="w-full flex flex-col gap-1">
          <div className="w-full px-4 pr-[88px] mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">Featured</span>
            <span className="text-[9px] font-bold text-text-muted bg-border-secondary/40 border border-border-main/60 px-2 py-0.5 rounded uppercase tracking-wider select-none">Beta</span>
          </div>

          <div className="w-full h-[226px] pr-[84px]">
            <UnifiedBanner className="h-full" />
          </div>
          <div className="w-full">
            <FeatureGallery paused={isScrolling} isMobileLayout={true} />
          </div>
        </div>

        {/* Floating Right Column: Vertical Stories Sidebar (Instagram style) */}
        <div className="absolute right-0 top-0 z-20 flex-shrink-0">
          <div className={`
            w-[84px] h-[310px] flex flex-col items-center py-4 px-1 rounded-l-[40px] rounded-r-none overflow-y-auto scrollbar-hide gap-4.5 overscroll-y-contain touch-pan-y will-change-scroll shadow-lg
            ${isDarkMode ? 'bg-[#242526]/90 backdrop-blur-md' : 'bg-[#C8CBD0]/90 backdrop-blur-md'}
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
                  <div className={`absolute inset-0 rounded-full p-[2px] transition-transform duration-500 group-active:scale-95 ${story.hasActive || story.isUser ? (isDarkMode ? 'bg-white' : 'bg-black') : (isDarkMode ? 'bg-white/20' : 'bg-black/20')}`}>
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
                  <span className={`text-[8.5px] font-medium truncate ${story.hasActive ? 'text-text-main' : 'text-text-muted'}`}>{story.username}</span>
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
      </div>

      {/* 4. Unified Feed */}
      <section className="w-full lg:mx-auto -mt-2 lg:mt-0 lg:max-w-[470px]">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={32} className="animate-spin text-accent-primary" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:gap-8 w-full">
            {feedPosts.map((post, idx) => {
              const isActive = activePostId === post.id;
              let postEl = null;
              if (post.type === 'reel') {
                postEl = <FeedReel key={post.id} post={post} isDarkMode={isDarkMode} isActive={isActive} isMuted={globalMuted} onToggleMute={() => setGlobalMuted(!globalMuted)} />;
              } else if (post.type === 'yt_video') {
                postEl = <FeedYoutube key={post.id} post={post} isDarkMode={isDarkMode} isActive={isActive} isMuted={globalMuted} onToggleMute={() => setGlobalMuted(!globalMuted)} />;
              } else if (post.type === 'thumbnail_vote') {
                postEl = <FeedThumbnailVote key={post.id} post={post} isDarkMode={isDarkMode} />;
              } else if (post.type === 'POLL' || post.type === 'poll') {
                postEl = <FeedPoll key={post.id} post={post} isDarkMode={isDarkMode} />;
              } else {
                postEl = <FeedPost key={post.id} post={post} isDarkMode={isDarkMode} />;
              }

              return (
                <Fragment key={post.id}>
                  {postEl}
                  {idx === 0 && <SuggestedEditorsCarousel index={idx} />}
                </Fragment>
              );
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

// Mock list of professional editors with monochrome style cards
const MOCK_SUGGESTED_EDITORS = [
  {
    id: 'ed-1',
    name: 'Alex Rivers',
    role: 'VFX Specialist',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    rating: '4.9',
    reviews: '82'
  },
  {
    id: 'ed-2',
    name: 'Elena Rostova',
    role: 'Cinematic Colorist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    rating: '5.0',
    reviews: '120'
  },
  {
    id: 'ed-3',
    name: 'Marcus Chen',
    role: 'Shorts Specialist',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    rating: '4.8',
    reviews: '95'
  },
  {
    id: 'ed-4',
    name: 'Sarah Jenkins',
    role: 'Documentary Editor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    rating: '5.0',
    reviews: '43'
  },
  {
    id: 'ed-5',
    name: 'Damilola Adebayo',
    role: 'Gaming Video Editor',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150',
    rating: '4.7',
    reviews: '74'
  },
  {
    id: 'ed-6',
    name: 'Chloe Miller',
    role: 'Motion Graphics Designer',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    rating: '4.9',
    reviews: '56'
  }
];

const MOCK_SUGGESTED_CREATORS = [
  {
    id: 'cr-1',
    name: 'Naveen Kumar',
    role: 'Tech Reviews',
    avatar: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=150',
    rating: '4.9',
    reviews: '124'
  },
  {
    id: 'cr-2',
    name: 'Sneha Gowda',
    role: 'Cooking & Lifestyle Vlog',
    avatar: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=150',
    rating: '4.8',
    reviews: '92'
  },
  {
    id: 'cr-3',
    name: 'Rakshith Shetty',
    role: 'Travel Vlog',
    avatar: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=150',
    rating: '5.0',
    reviews: '215'
  },
  {
    id: 'cr-4',
    name: 'Puneeth Raj',
    role: 'Gaming Streamer',
    avatar: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=150',
    rating: '4.7',
    reviews: '88'
  },
  {
    id: 'cr-5',
    name: 'Shruthi Hegde',
    role: 'Educational Content',
    avatar: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=150',
    rating: '4.9',
    reviews: '106'
  }
];

function SuggestedEditorsCarousel({ index }: { index: number }) {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isEditor = user?.primaryRole?.category === 'video_editor';

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user) return;
    const isFollowing = user.followingIds?.includes(targetUserId);

    // Optimistic Update
    const currentFollowingIds = user.followingIds || [];
    const newFollowingIds = isFollowing
      ? currentFollowingIds.filter(id => id !== targetUserId)
      : [...currentFollowingIds, targetUserId];

    dispatch(updateUser({ followingIds: newFollowingIds }));

    try {
      const endpoint = isFollowing ? '/user/unfollow' : '/user/follow';
      const response = await api.post(endpoint, { targetUserId });
      if (response.data?.success) {
        dispatch(updateUser({ followingIds: response.data.followingIds }));
      }
    } catch (err) {
      console.error('Failed to toggle follow status:', err);
      // Revert on error
      dispatch(updateUser({ followingIds: currentFollowingIds }));
    }
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      try {
        const slug = isEditor ? 'yt_influencer' : 'video_editor';
        const response = await api.get(`/profile/category/${slug}`);
        if (response.data?.success && response.data.data?.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped = response.data.data.map((p: any, idx: number) => ({
            id: p.userId || p.id,
            name: p.name,
            role: (p.roles && p.roles[0]) || p.category || (isEditor ? 'YouTube Creator' : 'Video Editor'),
            avatar: p.profilePicture || defaultProfile,
            rating: (4.6 + (idx % 5) * 0.1).toFixed(1),
            reviews: String(45 + (idx % 10) * 12)
          }));
          setProfiles(mapped);
        } else {
          setProfiles(isEditor ? MOCK_SUGGESTED_CREATORS : MOCK_SUGGESTED_EDITORS);
        }
      } catch (err) {
        console.error('Failed to fetch suggested profiles:', err);
        setProfiles(isEditor ? MOCK_SUGGESTED_CREATORS : MOCK_SUGGESTED_EDITORS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfiles();
  }, [isEditor]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="animate-spin text-[#7c42f8]" size={28} />
      </div>
    );
  }

  // Shift items so each post has a different set of suggested editors
  const offset = (index * 2) % (profiles.length || 1);
  const shiftedProfiles = [
    ...profiles.slice(offset),
    ...profiles.slice(0, offset)
  ].slice(0, 5); // Show up to 5 profiles in the scrollable view

  if (shiftedProfiles.length === 0) return null;

  return (
    <div className={`w-full lg:-mx-8 lg:w-[calc(100%+4rem)] rounded-[32px] border p-6 space-y-5 my-4 transition-all duration-300 ${
      isDarkMode 
        ? 'bg-[#0d0d10] border-zinc-850 text-zinc-300' 
        : 'bg-white border-zinc-200/60 shadow-[0_2px_16px_rgba(0,0,0,0.03)] text-zinc-800'
    }`}>
      {/* Title Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] opacity-95 text-text-main">
            {isEditor ? '✨ Suggested Creators for you' : '✨ Suggested Editors for you'}
          </h4>
          <p className="text-[10px] text-text-muted mt-0.5">
            {isEditor ? 'Top-rated YouTube creators ready to collaborate' : 'Top-rated video editors ready to collaborate'}
          </p>
        </div>
        <button 
          onClick={() => navigate('/explore')}
          className={`flex items-center gap-0.5 text-[10.5px] font-bold cursor-pointer transition-colors ${
            isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-950'
          }`}
        >
          <span>See All</span>
          <MdChevronRight size={15} />
        </button>
      </div>

      {/* Horizontal List Scrollable container */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2.5 pt-1 scrollbar-hide snap-x px-1">
        {shiftedProfiles.map((profileItem) => (
          <div
            key={profileItem.id}
            className={`w-[155px] shrink-0 rounded-[22px] border p-4 flex flex-col items-center justify-between snap-center transition-all ${
              isDarkMode 
                ? 'bg-[#15151a]/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-[#15151a]/60' 
                : 'bg-zinc-50 border-zinc-150 hover:bg-white hover:shadow-md'
            }`}
          >
            {/* Creator Avatar with mini verification tick */}
            <div className="relative">
              <img
                src={profileItem.avatar || defaultProfile}
                alt={profileItem.name}
                className={`w-14 h-14 rounded-full object-cover border-2 ${
                  isDarkMode ? 'border-zinc-800' : 'border-white shadow-sm'
                }`}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-[#7c42f8] rounded-full flex items-center justify-center border-2 border-container text-white">
                <MdCheckCircle size={11} className="text-white fill-white" />
              </span>
            </div>

            {/* Profile Info */}
            <div className="text-center mt-3.5 w-full min-w-0">
              <p className="text-[12.5px] font-bold text-text-main leading-tight truncate">
                {profileItem.name}
              </p>
              <p className="text-[9.5px] text-text-muted mt-1 leading-tight truncate">
                {profileItem.role}
              </p>
            </div>

            {/* Ratings */}
            <div className="flex items-center justify-center gap-0.5 mt-2.5">
              <MdStar size={12} className="text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-bold text-text-main leading-none">{profileItem.rating}</span>
              <span className="text-[9px] text-text-muted leading-none">({profileItem.reviews})</span>
            </div>

            <button
              onClick={() => handleFollowToggle(profileItem.id)}
              className={`w-full h-8 rounded-xl text-[10px] font-bold mt-4 active:scale-[0.98] transition-all cursor-pointer ${
                user?.followingIds?.includes(profileItem.id)
                  ? isDarkMode
                    ? 'bg-zinc-800/80 border border-zinc-700/80 text-zinc-400 hover:bg-zinc-850'
                    : 'bg-zinc-200 border border-zinc-300 text-zinc-650 hover:bg-zinc-250'
                  : isDarkMode 
                    ? 'bg-white text-black hover:bg-zinc-100' 
                    : 'bg-zinc-950 text-white hover:bg-zinc-900'
              }`}
            >
              {user?.followingIds?.includes(profileItem.id) ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

