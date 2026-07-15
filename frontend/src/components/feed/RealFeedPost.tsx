import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, Bookmark, Youtube } from 'lucide-react';
import defaultProfile from '../../assets/defaultprofile.png';
import LottieComponent from 'lottie-react';
import imageErrorAnimation from '../../assets/lottie/image-error.json';
import type { RealPost } from './types';
import { formatTimeAgo } from '../../utils/dateFormatter';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { useLike } from '../../hooks/useLike';
import { CommentsModal } from '../../features/comments/components/CommentsModal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Lottie = ((LottieComponent as any).default || LottieComponent) as any;

const MIN_RATIO = 9 / 16; // 0.5625, allows full vertical 9:16 height
const MAX_RATIO = 1.91;

function getClampedRatio(width?: number, height?: number): number {
  if (!width || !height) return 1;
  const raw = width / height;
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, raw));
}

export function RealFeedPost({ post, isDarkMode }: { post: RealPost; isDarkMode: boolean }) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  
  // Extract images and dimensions from media
  const images = post.media?.filter(m => m.urls.post || m.urls.full).map(m => resolveMediaUrl(m.urls.post || m.urls.full)) || [];
  const mediaDims = post.media?.[0]?.metadata || { width: 0, height: 0 };
  const [dimensions, setDimensions] = useState({ width: mediaDims.width, height: mediaDims.height });
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  
  const { likedByMe, likeCount, isAnimating, toggleLike, triggerLike } = useLike({
    postId: post.id,
    contentType: post.contentType,
    initialLiked: post.isLiked || false,
    initialCount: post.like_count || 0
  });

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

    if (isLeftSwipe && currentImgIndex < images.length - 1) {
      setCurrentImgIndex((prev) => prev + 1);
    } else if (isRightSwipe && currentImgIndex > 0) {
      setCurrentImgIndex((prev) => prev - 1);
    }
  };

  const userName = post.youtube_channel?.channel_name || post.user?.profile?.name || post.user?.username || 'User';
  const avatarSrc = resolveMediaUrl(post.youtube_channel?.thumbnail_url) || resolveMediaUrl(post.user?.profile?.profile_picture) || defaultProfile;

  const isTallMedia = (dimensions.width && dimensions.height && (dimensions.width / dimensions.height) <= 1.0);
  const objectFitClass = !isTallMedia ? 'object-contain' : 'object-cover';

  return (
    <motion.article 
      className={`lg:border lg:border-border-main lg:rounded-[40px] overflow-hidden group lg:shadow-xl mb-6 lg:mb-0 pb-4 lg:pb-0 relative ${
        isDarkMode ? 'bg-black lg:bg-[#0a0a0a]' : 'bg-white shadow-sm lg:shadow-2xl'
      }`}
    >
      <AnimatePresence>
        {isAnimating && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 0.9, 1], opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <Heart size={100} fill="#ef4444" stroke="#ef4444" className="drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-border-main p-0.5">
            <img src={avatarSrc} alt={userName} className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-text-main leading-none mb-1 flex items-center gap-1.5">
              {userName}
              <VerifiedBadge isVerified={post.user?.is_verified} role={post.user?.role} />
              {post.created_at && (
                <>
                  <span className="text-zinc-500 dark:text-zinc-400 font-normal text-[11px]">•</span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-normal text-[13px]">{formatTimeAgo(post.created_at)}</span>
                </>
              )}
            </h4>
          </div>
        </div>
        <button className={`p-2 transition-colors ${isDarkMode ? 'text-white hover:text-zinc-300' : 'text-zinc-950 hover:text-zinc-600'}`}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div 
        className="w-full relative overflow-hidden flex items-center justify-center bg-black cursor-pointer"
        style={{ 
          aspectRatio: getClampedRatio(dimensions.width, dimensions.height),
          maxHeight: 'min(80vh, 650px)'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={(e) => {
          e.stopPropagation();
          triggerLike();
        }}
      >
        {images && images.length > 0 ? (
          <div className="w-full h-full relative group flex items-center">
            {/* Images wrapper */}
            <div 
              className="flex w-full h-full transition-transform duration-500 ease-out items-center"
              style={{ transform: `translateX(-${currentImgIndex * 100}%)` }}
            >
              {images.map((img, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0 flex items-center justify-center relative">
                  {failedImages.has(idx) ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/10">
                      <Lottie animationData={imageErrorAnimation} loop={true} className="w-1/2 h-1/2 max-w-[200px]" />
                    </div>
                  ) : (
                    <img 
                      src={img as string} 
                      alt={`Slide ${idx + 1}`} 
                      onLoad={(e) => {
                        if (!dimensions.width || !dimensions.height) {
                          setDimensions({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight });
                        }
                      }}
                      onError={() => {
                        setFailedImages(prev => {
                          const next = new Set(prev);
                          next.add(idx);
                          return next;
                        });
                      }}
                      className={`absolute inset-0 w-full h-full ${objectFitClass}`} 
                    />
                  )}
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
            {currentImgIndex < images.length - 1 && (
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
              {images.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentImgIndex ? 'bg-white scale-125' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Action Buttons Overlay for Tall Media */}
        {isTallMedia && (
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div 
              className="flex items-center gap-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <button onClick={(e) => { e.stopPropagation(); toggleLike(); }} className={`text-white drop-shadow-md transition-colors transform active:scale-90 hover:text-rose-500`}><Heart size={26} fill={likedByMe ? "#ef4444" : "rgba(0,0,0,0.2)"} stroke={likedByMe ? "#ef4444" : "currentColor"} /></button>
              <button onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(true); }} className="text-white drop-shadow-md transition-colors transform active:scale-90"><MessageCircle size={26} fill="rgba(0,0,0,0.2)" /></button>
              <button className="text-white drop-shadow-md transition-colors transform active:scale-90"><Share2 size={26} fill="rgba(0,0,0,0.2)" /></button>
            </div>
            <button 
              className="text-white drop-shadow-md transition-colors transform active:scale-90 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <Bookmark size={26} fill="rgba(0,0,0,0.2)" />
            </button>
          </div>
        )}

        {/* Watch on YT Button */}
        {post.youtube_link && (
          <button 
            onClick={(e) => { e.stopPropagation(); window.open(post.youtube_link, '_blank'); }}
            className={`absolute right-3 bg-black/60 backdrop-blur-md hover:bg-black/80 px-3 py-1.5 rounded-full flex items-center gap-2 text-white text-[11px] font-semibold tracking-wide border border-white/20 transition-all z-20 shadow-lg cursor-pointer ${isTallMedia ? 'bottom-16' : 'bottom-3'}`}
          >
            <Youtube size={14} className="text-red-500" />
            Watch full video on YT
          </button>
        )}
      </div>

      <div className="p-4 lg:p-6 space-y-4">
        {!isTallMedia && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={(e) => { e.stopPropagation(); toggleLike(); }} className={`transition-colors transform active:scale-90 hover:text-rose-500 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><Heart size={24} fill={likedByMe ? "#ef4444" : "none"} stroke={likedByMe ? "#ef4444" : "currentColor"} /></button>
              <button onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(true); }} className={`transition-colors transform active:scale-90 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><MessageCircle size={24} /></button>
              <button className={`transition-colors transform active:scale-90 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><Share2 size={24} /></button>
            </div>
            <button className={`transition-colors transform active:scale-90 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><Bookmark size={24} /></button>
          </div>
        )}

        <div className="space-y-2">
          {/* Liked By Section */}
          <div className="flex items-center gap-2">
            <p className="text-[13px] text-text-main font-medium">
              Liked by <span className="font-semibold">{likeCount.toLocaleString()}</span> others
            </p>
          </div>

          {/* Caption */}
          <p className="text-[13px] text-text-main leading-relaxed">
            <span className="font-semibold mr-2 uppercase tracking-tight text-[11px]">
              {userName.split(' ')[0]}
            </span>
            <span className="text-text-muted dark:text-zinc-400 font-medium">{post.caption}</span>
          </p>

          <button 
            onClick={() => setIsCommentsOpen(true)}
            className="text-[12px] text-text-muted font-medium mt-2 opacity-60 hover:opacity-100 transition-opacity"
          >
            View all {post.comment_count || 0} comments
          </button>
        </div>
      </div>

      <CommentsModal 
        isOpen={isCommentsOpen} 
        onClose={() => setIsCommentsOpen(false)} 
        entityType="POST" 
        entityId={post.id} 
      />
    </motion.article>
  );
}

function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const apiBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5051';
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${apiBase}${cleanUrl}`;
}
