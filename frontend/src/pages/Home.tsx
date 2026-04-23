import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Plus } from 'lucide-react';
import auth1 from '../assets/auth/auth_1.png';
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

const STORIES: Story[] = [
  { _id: 'me', username: 'Your Story', avatar: auth1, isUser: true, hasActive: false },
  ...SUVIX_INDUSTRY_STORIES,
];

const POSTS = [
  { id: 1, user: 'Sonya Leena', location: 'Dubai, UAE', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800', likes: '360', comment: 'You can never dull my sparkle ✨', commentsCount: 12 },
  { id: 2, user: 'Adam Addisin', location: 'Oklahoma, US', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800', likes: '1,240', comment: 'In photography, there is a reality so subtle that it becomes more real than reality.', commentsCount: 45 },
];

export default function Home() {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isDarkMode } = useTheme();

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
      {/* ─── DESKTOP SPLIT VIEW (Banner & Stories Swapped for Mobile Parity) ─── */}
      <div className="flex flex-col lg:flex-row-reverse gap-6 lg:items-center">
        
        {/* 1. Banner Section (Top on Mobile, Right on Desktop) */}
        <section className="lg:w-1/2 px-6 lg:px-0">
          <UnifiedBanner />
        </section>

        {/* 2. Stories Section (Bottom on Mobile, Left on Desktop) */}
        <section className="lg:w-1/2 -mx-4 lg:mx-0">
          <div className="hidden lg:block mb-8 px-1">
            <img 
              src={isDarkMode ? darkLogo : lightLogo} 
              alt="SuviX" 
              className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity" 
            />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-6 lg:px-0">
            {STORIES.map((story) => (
              <div key={story._id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group relative">
                <div className="relative w-[60px] h-[60px] lg:w-[68px] lg:h-[68px] flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-0 group-hover:opacity-60 transition-opacity duration-500 scale-110 group-hover:scale-100">
                    <circle cx="50%" cy="50%" r="48%" className={`fill-none stroke-current stroke-1 ${isDarkMode ? 'text-white' : 'text-black'}`} strokeDasharray="4 8" strokeLinecap="round" />
                  </svg>
                  <div className={`absolute inset-0 rounded-full p-[2px] transition-transform duration-500 group-active:scale-90 ${story.hasActive || story.isUser ? (isDarkMode ? 'bg-gradient-to-tr from-white to-zinc-500' : 'bg-gradient-to-tr from-black to-zinc-400') : 'bg-border-main opacity-40'}`}>
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

      {/* 3. Feature Gallery */}
      <section className="-mx-4 lg:mx-0 -mt-2 lg:mt-0">
        <FeatureGallery paused={isScrolling} />
      </section>

      {/* 4. Unified Feed */}
      <section className="-mx-4 lg:mx-0 -mt-2 lg:mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {POSTS.map((post) => (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="bg-container lg:border lg:border-border-main lg:rounded-[40px] overflow-hidden group lg:shadow-xl dark:lg:shadow-none border-b border-border-main lg:border-b-0 pb-8 lg:pb-0"
            >
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
                <button className="text-text-muted hover:text-text-main transition-colors p-2"><MoreHorizontal size={18} /></button>
              </div>

              <div className="aspect-[4/5] lg:aspect-square relative overflow-hidden bg-border-secondary">
                <img src={post.img} alt="Post content" className="w-full h-full object-cover" />
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
          ))}
        </div>
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
