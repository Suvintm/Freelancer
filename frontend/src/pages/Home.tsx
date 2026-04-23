import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import auth1 from '../assets/auth/auth_1.png';
import auth2 from '../assets/auth/auth_2.png';
import { FeatureGallery } from '../components/home/FeatureGallery';

const STORIES = [
  { id: 1, name: 'Your story', img: auth1, isUser: true },
  { id: 2, name: 'Sonya', img: auth2, isLive: true },
  { id: 3, name: 'Adam', img: auth1 },
  { id: 4, name: 'Andrew', img: auth2 },
  { id: 5, name: 'Nicole', img: auth1 },
  { id: 6, name: 'Ashley', img: auth2 },
  { id: 7, name: 'Michael', img: auth1 },
  { id: 8, name: 'Damian', img: auth2 },
];

const POSTS = [
  { id: 1, user: 'Sonya Leena', location: 'Dubai, UAE', img: auth2, likes: '360', comment: 'You can never dull my sparkle ✨' },
  { id: 2, user: 'Adam Addisin', location: 'Oklahoma, US', img: auth1, likes: '1.2K', comment: 'In photography, there is a reality so subtle that...more' },
  { id: 3, user: 'Andrew Dewitt', location: 'Overland Park, KS', img: auth2, likes: '890', comment: 'The unexpected moment is always sweeter!' },
  { id: 4, user: 'Nicole Segall', location: 'New Delhi, India', img: auth1, likes: '450', comment: 'City lights and late nights.' },
  { id: 5, user: 'Michael Gilmore', location: 'Lawrence, KS', img: auth2, likes: '2.1K', comment: 'Focus on the good.' },
  { id: 6, user: 'Damian Efron', location: 'Birmingham, UK', img: auth1, likes: '150', comment: 'Adventure awaits.' },
];

export default function Home() {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mainContainer = document.querySelector('main');
    if (!mainContainer) return;

    const handleScroll = () => {
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    mainContainer.addEventListener('scroll', handleScroll);
    return () => {
      mainContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Stories Bar */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-xl font-black text-text-main tracking-tight">Stories</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {STORIES.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
              <div className={`relative w-16 h-16 lg:w-20 lg:h-20 rounded-full p-1 border-2 transition-all duration-300 ${
                story.isLive ? 'border-rose-500' : 'border-border-main group-hover:border-text-muted'
              }`}>
                <img src={story.img} alt={story.name} className="w-full h-full rounded-full object-cover" />
                {story.isUser && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full border-4 border-container p-0.5">
                    <PlusCircle size={14} className="text-white" />
                  </div>
                )}
                {story.isLive && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-rose-500 text-[8px] font-black px-1.5 py-0.5 rounded-md text-white uppercase tracking-tighter ring-2 ring-container">
                    Live
                  </div>
                )}
              </div>
              <span className="text-[10px] lg:text-xs font-bold text-text-muted group-hover:text-text-main transition-colors">{story.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Discover / Feature Gallery */}
      <section>
        <FeatureGallery paused={isScrolling} />
      </section>

      {/* Feed Grid */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-xl font-black text-text-main tracking-tight">Feed</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {POSTS.map((post) => (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-container border border-border-main rounded-[32px] overflow-hidden group shadow-sm dark:shadow-none"
            >
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-border-secondary overflow-hidden">
                    <img src={post.img} alt={post.user} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-text-main leading-none mb-1">{post.user}</h4>
                    <p className="text-[10px] text-text-muted font-bold">{post.location}</p>
                  </div>
                </div>
                <button className="text-text-muted hover:text-text-main transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Post Image */}
              <div className="aspect-square relative overflow-hidden bg-border-secondary">
                <img 
                  src={post.img} 
                  alt="Post content" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              </div>

              {/* Post Actions */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="text-text-muted hover:text-rose-500 transition-colors">
                      <Heart size={22} />
                    </button>
                    <button className="text-text-muted hover:text-text-main transition-colors">
                      <MessageCircle size={22} />
                    </button>
                    <button className="text-text-muted hover:text-text-main transition-colors">
                      <Share2 size={22} />
                    </button>
                  </div>
                  <button className="text-text-muted hover:text-text-main transition-colors">
                    <Bookmark size={22} />
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-text-muted font-bold">
                    Liked by <span className="text-text-main font-black">Andrew</span> and <span className="text-text-main font-black">{post.likes} others</span>
                  </p>
                  <p className="text-xs text-text-muted dark:text-zinc-300 leading-relaxed">
                    <span className="font-black text-text-main mr-2">{post.user.split(' ')[0]}</span>
                    {post.comment}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PlusCircle({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
