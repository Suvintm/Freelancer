import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { MoreHorizontal, Volume2, VolumeX, Heart, MessageCircle, Share2, Bookmark, Play, UserCircle } from 'lucide-react';
import defaultProfile from '../../assets/defaultprofile.png';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../../queries/useCurrentUser';

interface Post {
  id: string | number;
  user: string | { username?: string; profile?: { name?: string } };
  location: string;
  img: string;
  likes: string | number;
  comment: string;
  commentsCount: number;
  videoUrl?: string;
  type?: string;
  tags?: string[];
  likedByAvatars?: string[];
  ytChannelName?: string;
  ytSubscribeLink?: string;
  watchOnYtLink?: string;
  userAvatar?: string;
}

export function FeedYoutube({ 
  post, 
  isDarkMode, 
  isActive, 
  isMuted = true, 
  onToggleMute 
}: { 
  post: Post; 
  isDarkMode: boolean;
  isActive?: boolean;
  isMuted?: boolean;
  onToggleMute?: (e: React.MouseEvent) => void;
}) {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const isArticleInView = useInView(articleRef, { margin: "-20%" });

  useEffect(() => {
    if (!isArticleInView && showEmbed) {
      setShowEmbed(false);
    }
  }, [isArticleInView, showEmbed]);

  const playMedia = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, []);

  const pauseMedia = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) playMedia(); else pauseMedia();
  }, [isActive, playMedia, pauseMedia]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    if (!isMuted) video.volume = 1;
  }, [isMuted]);

  const handleMuteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      const newMuted = !video.muted;
      video.muted = newMuted;
      video.volume = 1;
      if (!newMuted) {
        video.pause();
        video.play().catch(() => {});
      }
    }
    onToggleMute?.(e);
  };

  const avatarSrc = post.userAvatar || (typeof post.id === 'string' ? defaultProfile : post.img);

  return (
    <motion.article 
      ref={articleRef}
      data-post-id={post.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => {
        if (!showEmbed && post.watchOnYtLink) {
          setShowEmbed(true);
        }
      }}
      className={`relative w-full rounded-[20px] lg:rounded-[28px] overflow-hidden group transition-all duration-500 mb-4 lg:mb-8 border cursor-pointer ${
        isDarkMode 
          ? 'bg-zinc-950/80 border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)] lg:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-white/20 hover:shadow-[0_8px_32px_rgba(229,9,20,0.15)]' 
          : 'bg-white border-zinc-200 shadow-[0_4px_20px_rgba(0,0,0,0.06)] lg:shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]'
      }`}
    >
      {/* Video Container (16:9 Aspect Ratio) */}
      <div 
        className="w-full relative overflow-hidden flex items-center justify-center bg-black cursor-pointer aspect-video rounded-t-[20px] lg:rounded-t-[28px]"
        onClick={(e) => { 
          if (showEmbed) return;
          e.stopPropagation(); 
          if (isPlaying) pauseMedia(); else playMedia(); 
        }}
      >
        {showEmbed && getYoutubeVideoId(post.watchOnYtLink) ? (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${getYoutubeVideoId(post.watchOnYtLink)}?autoplay=1`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full object-cover z-30 relative"
          />
        ) : (
          <video 
            ref={videoRef}
            src={post.videoUrl}
            loop
            playsInline
            poster={post.img}
            onLoadedMetadata={() => {
              if (videoRef.current) videoRef.current.muted = true;
            }}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          />
        )}

        {/* Top Gradient Overlay */}
        {!showEmbed && <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />}

        {/* Video Header: User Info & YT Lottie */}
        {!showEmbed && <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/30 p-[1.5px] bg-black/40 backdrop-blur-md overflow-hidden shadow-lg pointer-events-auto">
              <img src={avatarSrc} alt={typeof post.user === 'string' ? post.user : (post.user?.profile?.name || post.user?.username || 'User')} className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="flex flex-col drop-shadow-md">
              <h4 className="text-[14px] font-bold text-white tracking-wide leading-tight flex items-center gap-2">
                {typeof post.user === 'string' ? post.user : (post.user?.profile?.name || post.user?.username || 'User')}
              </h4>
              {post.location && (
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-white/90 font-medium tracking-wide">{post.location}</p>
                  {isPlaying && !isMuted && (
                    <div className="flex items-end gap-[1.5px] h-2">
                      <span className="w-[1.5px] bg-red-500 rounded-full visualizer-bar animate-pulse" style={{ animationDelay: '0.1s' }} />
                      <span className="w-[1.5px] bg-red-500 rounded-full visualizer-bar animate-pulse" style={{ animationDelay: '0.3s' }} />
                      <span className="w-[1.5px] bg-red-500 rounded-full visualizer-bar animate-pulse" style={{ animationDelay: '0.2s' }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
        </div>}

        {/* Play/Pause Center Indicator (Fades out) */}
        {!showEmbed && <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 z-10 ${isPlaying ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}>
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl pl-1">
            <Play size={28} className="fill-white" />
          </div>
        </div>}

        {/* Bottom Gradient Overlay */}
        {!showEmbed && <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />}
      </div>

      {/* Content Section Below Video */}
      <div className="p-4 lg:p-6 flex flex-col gap-4 lg:gap-5">
        <div className="flex items-start justify-between gap-3 lg:gap-4">
          <div className="flex-1 space-y-2">
            {/* Title / Comment */}
            {showEmbed ? (
              <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <img src={avatarSrc} alt={typeof post.user === 'string' ? post.user : (post.user?.profile?.name || post.user?.username || 'User')} className={`w-8 h-8 rounded-full object-cover border ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`} />
                  <span className={`font-semibold text-sm ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    {typeof post.user === 'string' ? post.user : (post.user?.profile?.name || post.user?.username || 'User')}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed line-clamp-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {post.comment}
                </p>
              </div>
            ) : (
              <h3 className={`text-base font-semibold leading-snug line-clamp-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                {post.comment}
              </h3>
            )}
            
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag, idx) => (
                  <span key={idx} className="text-[12px] font-medium text-blue-500 hover:text-blue-600 transition-colors cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Profile Redirect Button */}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              const postUserId = typeof post.user === 'string' ? post.user : (post.user as any)?.id;
              
              if (currentUser && currentUser.id === postUserId) {
                navigate('/profile');
              } else {
                navigate(`/creator/${postUserId || ''}`);
              }
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              isDarkMode 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-black/5 text-black hover:bg-black/10'
            }`}
          >
            <UserCircle size={16} />
            View Profile
          </button>
        </div>

        {/* Bottom Interaction Bar */}
        <div 
          className={`flex items-center justify-between pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-zinc-100'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4">
            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-600'}`}>
              <Heart size={20} className="hover:text-red-500 transition-colors" />
              <span className="text-[13px] font-semibold">{typeof post.likes === 'number' ? post.likes.toLocaleString() : post.likes}</span>
            </button>
            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-600'}`}>
              <MessageCircle size={20} />
              <span className="text-[13px] font-semibold">{post.commentsCount}</span>
            </button>
            <button className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-600'}`}>
              <Share2 size={20} />
            </button>
          </div>

          {/* Liked By Avatars (optional, aligned right if few, or Bookmark) */}
          <div className="flex items-center gap-3">
            {post.likedByAvatars && post.likedByAvatars.length > 0 && (
              <div className="flex -space-x-2 mr-2">
                {post.likedByAvatars.slice(0, 3).map((avatar, idx) => (
                  <img key={idx} src={avatar} alt="Liked by" className={`w-6 h-6 rounded-full border-2 object-cover ${isDarkMode ? 'border-zinc-950' : 'border-white'}`} style={{ zIndex: 3 - idx }} />
                ))}
              </div>
            )}
            <button className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-600'}`}>
              <Bookmark size={20} />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function getYoutubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
