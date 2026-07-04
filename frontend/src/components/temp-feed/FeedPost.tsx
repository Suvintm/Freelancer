import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, Bookmark, Youtube } from 'lucide-react';
import defaultProfile from '../../assets/defaultprofile.png';

interface Post {
  id: string | number;
  user: string;
  location: string;
  img: string;
  likes: string | number;
  comment: string;
  commentsCount: number;
  images?: string[];
  type?: string;
  tags?: string[];
  likedByAvatars?: string[];
  watchOnYtLink?: string;
  mediaWidth?: number;
  mediaHeight?: number;
}

const MIN_RATIO = 4 / 5;
const MAX_RATIO = 1.91;

function getClampedRatio(width?: number, height?: number): number {
  if (!width || !height) return 1;
  const raw = width / height;
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, raw));
}

export function FeedPost({ post, isDarkMode }: { post: Post; isDarkMode: boolean }) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && post.images && currentImgIndex < post.images.length - 1) {
      setCurrentImgIndex((prev) => prev + 1);
    } else if (isRightSwipe && currentImgIndex > 0) {
      setCurrentImgIndex((prev) => prev - 1);
    }
  };

  const isDynamicPost = typeof post.id === 'string';
  const avatarSrc = isDynamicPost ? defaultProfile : post.img;

  return (
    <motion.article 
      className={`lg:border lg:border-border-main lg:rounded-[40px] overflow-hidden group lg:shadow-xl mb-6 lg:mb-0 pb-4 lg:pb-0 relative ${
        isDarkMode ? 'bg-black lg:bg-[#0a0a0a]' : 'bg-white shadow-sm lg:shadow-2xl'
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-border-main p-0.5">
            <img src={avatarSrc} alt={post.user} className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-text-main leading-none mb-1">{post.user}</h4>
            <p className="text-[10px] text-text-muted font-medium">{post.location}</p>
          </div>
        </div>
        <button className={`p-2 transition-colors ${isDarkMode ? 'text-white hover:text-zinc-300' : 'text-zinc-950 hover:text-zinc-600'}`}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div 
        className="w-full relative overflow-hidden flex items-center justify-center bg-black"
        style={{ 
          aspectRatio: getClampedRatio(post.mediaWidth, post.mediaHeight),
          maxHeight: 'min(75vh, 580px)'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {post.images && post.images.length > 0 ? (
          <div className="w-full h-full relative group flex items-center">
            {/* Images wrapper */}
            <div 
              className="flex w-full h-full transition-transform duration-500 ease-out items-center"
              style={{ transform: `translateX(-${currentImgIndex * 100}%)` }}
            >
              {post.images.map((img, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0 flex items-center justify-center relative">
                  <img 
                    src={img} 
                    alt={`Slide ${idx + 1}`} 
                    className="absolute inset-0 w-full h-full object-contain" 
                  />
                </div>
              ))}
            </div>

            {/* Left arrow */}
            {currentImgIndex > 0 && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImgIndex((prev) => prev - 1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            {/* Right arrow */}
            {currentImgIndex < post.images.length - 1 && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImgIndex((prev) => prev + 1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            )}

            {/* Pagination dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
              {post.images.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentImgIndex ? 'bg-white scale-125' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <img src={post.img} alt="Post content" className="absolute inset-0 w-full h-full object-contain" />
        )}

        {/* Watch on YT Button */}
        {post.watchOnYtLink && (
          <button 
            onClick={(e) => { e.stopPropagation(); window.open(post.watchOnYtLink, '_blank'); }}
            className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md hover:bg-black/80 px-3 py-1.5 rounded-full flex items-center gap-2 text-white text-[11px] font-semibold tracking-wide border border-white/20 transition-all z-20 shadow-lg cursor-pointer"
          >
            <Youtube size={14} className="text-red-500" />
            Watch full video on YT
          </button>
        )}
      </div>

      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button className={`transition-colors transform active:scale-90 hover:text-rose-500 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><Heart size={24} /></button>
            <button className={`transition-colors transform active:scale-90 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><MessageCircle size={24} /></button>
            <button className={`transition-colors transform active:scale-90 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><Share2 size={24} /></button>
          </div>
          <button className={`transition-colors transform active:scale-90 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><Bookmark size={24} /></button>
        </div>

        <div className="space-y-2">
          {/* Liked By Section */}
          <div className="flex items-center gap-2">
            {post.likedByAvatars && post.likedByAvatars.length > 0 && (
              <div className="flex -space-x-1.5">
                {post.likedByAvatars.map((avatar, idx) => (
                  <img key={idx} src={avatar} alt="Liked by" className={`w-[22px] h-[22px] rounded-full border-[1.5px] object-cover ${isDarkMode ? 'border-black' : 'border-white'}`} style={{ zIndex: 3 - idx }} />
                ))}
              </div>
            )}
            <p className="text-[13px] text-text-main font-medium">
              Liked by <span className="font-semibold">Jane</span>, <span className="font-semibold">Alex</span> and <span className="font-semibold">{typeof post.likes === 'number' ? post.likes.toLocaleString() : post.likes} others</span>
            </p>
          </div>

          {/* Caption */}
          <p className="text-[13px] text-text-main leading-relaxed">
            <span className="font-semibold mr-2 uppercase tracking-tight text-[11px]">{post.user.split(' ')[0]}</span>
            <span className="text-text-muted dark:text-zinc-400 font-medium">{post.comment}</span>
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {post.tags.map((tag, idx) => (
                <span key={idx} className="text-[12px] font-medium text-blue-500 hover:text-blue-600 transition-colors cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <button className="text-[12px] text-text-muted font-medium mt-2 opacity-60 hover:opacity-100 transition-opacity">View all {post.commentsCount} comments</button>
        </div>
      </div>
    </motion.article>
  );
}
