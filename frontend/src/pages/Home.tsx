import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Plus, CheckCircle2 } from 'lucide-react';
import auth1 from '../assets/auth/auth_1.png';
import auth2 from '../assets/auth/auth_2.png';
import { FeatureGallery } from '../components/home/FeatureGallery';
import { UnifiedBanner } from '../components/home/UnifiedBanner';
import { useTheme } from '../hooks/useTheme';

const STORIES = [
  { id: 1, name: 'Your Story', img: auth1, isUser: true, hasActive: false },
  { id: 2, name: 'sonya.xp', img: auth2, isLive: true, isVerified: true },
  { id: 3, name: 'adam_dev', img: auth1, hasActive: true },
  { id: 4, name: 'andrew.studio', img: auth2, hasActive: true, isVerified: true },
  { id: 5, name: 'nicole_art', img: auth1, hasActive: true },
  { id: 6, name: 'ashley_vlogs', img: auth2, hasActive: true },
  { id: 7, name: 'mike_peaks', img: auth1, hasActive: true },
  { id: 8, name: 'damian_lens', img: auth2, hasActive: true },
];

const POSTS = [
  { id: 1, user: 'Sonya Leena', location: 'Dubai, UAE', img: auth2, likes: '360', comment: 'You can never dull my sparkle ✨', commentsCount: 12 },
  { id: 2, user: 'Adam Addisin', location: 'Oklahoma, US', img: auth1, likes: '1,240', comment: 'In photography, there is a reality so subtle that it becomes more real than reality.', commentsCount: 45 },
  { id: 3, user: 'Andrew Dewitt', location: 'Overland Park, KS', img: auth2, likes: '890', comment: 'The unexpected moment is always sweeter!', commentsCount: 8 },
  { id: 4, user: 'Nicole Segall', location: 'New Delhi, India', img: auth1, likes: '450', comment: 'City lights and late nights.', commentsCount: 15 },
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
    <div className="max-w-6xl mx-auto space-y-8 lg:space-y-10">
      {/* 1. Unified Banner (Top Section) */}
      <section className="-mt-4 lg:mt-0 -mx-4 lg:mx-0">
        <UnifiedBanner />
      </section>

      {/* 2. Premium Story Bar (App Style with Black/White Circles) */}
      <section className="-mx-4 lg:mx-0">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-6 lg:px-0">
          {STORIES.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-3 flex-shrink-0 cursor-pointer group relative">
              <div className="relative w-[72px] h-[72px] lg:w-[84px] lg:h-[84px] flex items-center justify-center">
                
                {/* Dashed Wave Animation (App Style SVG) */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-0 group-hover:opacity-60 transition-opacity duration-500 scale-110 group-hover:scale-100">
                  <circle 
                    cx="50%" cy="50%" r="48%" 
                    className={`fill-none stroke-current stroke-1 ${isDarkMode ? 'text-white' : 'text-black'}`}
                    strokeDasharray="4 8"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Main Gradient Border (Black/White Theme) */}
                <div className={`absolute inset-0 rounded-full p-[2.5px] transition-transform duration-500 group-active:scale-90 ${
                  story.isLive || story.hasActive || story.isUser
                    ? (isDarkMode ? 'bg-gradient-to-tr from-white to-zinc-500' : 'bg-gradient-to-tr from-black to-zinc-400')
                    : 'bg-border-main opacity-40'
                }`}>
                  <div className="w-full h-full rounded-full bg-container p-[2px]">
                    <img 
                      src={story.img} 
                      alt={story.name} 
                      className="w-full h-full rounded-full object-cover bg-border-secondary" 
                    />
                  </div>
                </div>

                {/* App-Style Badges */}
                {story.isUser && !story.hasActive && (
                  <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full border-2 border-container p-0.5 shadow-lg">
                    <Plus size={12} className="text-white" strokeWidth={4} />
                  </div>
                )}
                {story.isLive && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-rose-500 text-[8px] font-black px-2 py-0.5 rounded-md text-white uppercase tracking-tighter ring-2 ring-container shadow-lg shadow-rose-500/20">
                    Live
                  </div>
                )}
              </div>

              {/* Username with Verification */}
              <div className="flex items-center gap-1 max-w-[72px] lg:max-w-[84px]">
                <span className={`text-[10px] lg:text-[11px] font-bold truncate ${story.hasActive || story.isLive ? 'text-text-main' : 'text-text-muted'}`}>
                  {story.name}
                </span>
                {story.isVerified && <CheckCircle2 size={10} className="text-blue-500 fill-blue-500/10 flex-shrink-0" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Feature Gallery (Discover SuviX) */}
      <section className="-mx-4 lg:mx-0">
        <FeatureGallery paused={isScrolling} />
      </section>

      {/* 4. Unified Feed */}
      <section className="-mx-4 lg:mx-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {POSTS.map((post) => (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="bg-container lg:border lg:border-border-main lg:rounded-[40px] overflow-hidden group lg:shadow-xl dark:lg:shadow-none border-b border-border-main lg:border-b-0 pb-8 lg:pb-0"
            >
              {/* Post Header */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-border-main p-0.5">
                    <img src={post.img} alt={post.user} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black text-text-main leading-none mb-1">{post.user}</h4>
                    <p className="text-[11px] text-text-muted font-bold">{post.location}</p>
                  </div>
                </div>
                <button className="text-text-muted hover:text-text-main transition-colors p-2">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Post Image (Native 4:5 Aspect Ratio) */}
              <div className="aspect-[4/5] lg:aspect-square relative overflow-hidden bg-border-secondary">
                <img 
                  src={post.img} 
                  alt="Post content" 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Post Actions */}
              <div className="p-5 lg:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button className="text-text-main hover:text-rose-500 transition-colors transform active:scale-90">
                      <Heart size={26} />
                    </button>
                    <button className="text-text-main hover:text-text-main transition-colors transform active:scale-90">
                      <MessageCircle size={26} />
                    </button>
                    <button className="text-text-main hover:text-text-main transition-colors transform active:scale-90">
                      <Share2 size={26} />
                    </button>
                  </div>
                  <button className="text-text-main hover:text-text-main transition-colors transform active:scale-90">
                    <Bookmark size={26} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[14px] text-text-main font-black">
                    {post.likes} likes
                  </p>
                  <p className="text-[14px] text-text-main leading-relaxed">
                    <span className="font-black mr-2 uppercase tracking-tight text-[12px]">{post.user.split(' ')[0]}</span>
                    <span className="text-text-muted dark:text-zinc-400 font-medium">{post.comment}</span>
                  </p>
                  <button className="text-[13px] text-text-muted font-bold mt-2 opacity-60 hover:opacity-100 transition-opacity">
                    View all {post.commentsCount} comments
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}
