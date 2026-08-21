import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import { Heart, MessageCircle, Share2, Bookmark, Play, Lock, UserCircle } from 'lucide-react';
import defaultProfile from '../../assets/defaultprofile.png';
import type { RealPost } from './types';
import { formatTimeAgo } from '../../utils/dateFormatter';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { useLike } from '../../hooks/useLike';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../../queries/useCurrentUser';
import { CommentsModal } from '../../features/comments/components/CommentsModal';
import LottieComponent from 'lottie-react';
import audioWaveLottie from '../../assets/lottie/audio_wave.json';

const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

export function RealFeedYoutube({
  post,
  isDarkMode,
  isActive,
  isMuted = true
}: {
  post: RealPost;
  isDarkMode: boolean;
  isActive?: boolean;
  isMuted?: boolean;
}) {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const isArticleInView = useInView(articleRef, { margin: "-20%" });

  useEffect(() => {
    if (!isArticleInView && showEmbed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowEmbed(false);
    }
  }, [isArticleInView, showEmbed]);

  const mediaUrls = post.media?.[0]?.urls;
  const hlsUrl = resolveMediaUrl(mediaUrls?.hls);
  const mp4Url = resolveMediaUrl(mediaUrls?.video || mediaUrls?.fallback);
  const thumbnailUrl = resolveMediaUrl(post.media?.[0]?.thumbnailUrl || mediaUrls?.thumb);
  const mediaStatus = post.media?.[0]?.status;
  const isProcessing = mediaStatus === 'PROCESSING';
  
  const userName = post.youtube_channel?.channel_name || post.user?.profile?.name || post.user?.username || 'User';
  const avatarSrc = resolveMediaUrl(post.youtube_channel?.thumbnail_url) || resolveMediaUrl(post.user?.profile?.profile_picture) || defaultProfile;
  const location = 'YouTube';

  const { likedByMe, likeCount, isAnimating, isLocked, lockTimeLeft, toggleLike, triggerLike } = useLike({
    postId: post.id,
    contentType: post.contentType || 'YOUTUBE_POST',
    initialLiked: post.isLiked || false,
    initialCount: post.like_count || 0
  });

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
    if (!video || isProcessing) return;
    video.muted = isMuted;
    if (!isMuted) video.volume = 1;
  }, [isMuted, isProcessing]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (hlsUrl && Hls.isSupported()) {
      hls = new Hls({
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
      });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
    } else if (hlsUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
    } else if (mp4Url) {
      video.src = mp4Url;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [hlsUrl, mp4Url]);

  return (
    <motion.article 
      ref={articleRef}
      data-post-id={post.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => {
        if (!showEmbed && post.youtube_link) {
          setShowEmbed(true);
        }
      }}
      className={`relative w-full rounded-[20px] lg:rounded-[28px] overflow-hidden group transition-all duration-500 mb-4 lg:mb-8 border cursor-pointer ${
        isDarkMode 
          ? 'bg-zinc-950/80 border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)] lg:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-white/20 hover:shadow-[0_8px_32px_rgba(229,9,20,0.15)]' 
          : 'bg-white border-zinc-200 shadow-[0_4px_20px_rgba(0,0,0,0.06)] lg:shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]'
      }`}
    >
      <div 
        className="w-full relative overflow-hidden flex items-center justify-center bg-black cursor-pointer aspect-video rounded-[20px] lg:rounded-[28px]"
        onClick={() => {
          if (showEmbed) return;
          if (isPlaying) {
            pauseMedia();
          } else {
            playMedia();
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          triggerLike();
        }}
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
              <Heart size={80} fill="#ef4444" stroke="#ef4444" className="drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>
        {isLocked && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-1 shadow-2xl animate-in fade-in zoom-in duration-300">
              <Lock className="text-rose-500 w-8 h-8 mb-1" />
              <p className="text-white font-semibold text-sm">Action Locked</p>
              <p className="text-white/70 text-[11px] uppercase tracking-widest font-semibold">Wait {lockTimeLeft}s</p>
            </div>
          </div>
        )}
        {isProcessing ? (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-zinc-900/80 backdrop-blur-sm z-10 rounded-[24px]">
            <div className="w-8 h-8 border-4 border-white/20 border-t-red-500 rounded-full animate-spin mb-3" />
            <p className="text-white text-sm font-medium tracking-wide">Processing Video...</p>
          </div>
        ) : showEmbed && getYoutubeVideoId(post.youtube_link) ? (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${getYoutubeVideoId(post.youtube_link)}?autoplay=1`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full object-cover z-30 relative"
          />
        ) : (
          <video 
            ref={videoRef}
            loop
            playsInline
            poster={thumbnailUrl}
            onLoadedMetadata={() => {
              if (videoRef.current) videoRef.current.muted = true;
            }}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          />
        )}

        {!showEmbed && <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />}

        {!showEmbed && <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/30 p-[1.5px] bg-black/40 backdrop-blur-md overflow-hidden shadow-lg pointer-events-auto">
              <img src={avatarSrc} alt={userName} className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="flex flex-col drop-shadow-md">
              <h4 className="text-[14px] font-bold text-white tracking-wide leading-tight flex items-center gap-2">
                {userName}
                <VerifiedBadge isVerified={post.user?.is_verified} role={post.user?.role} />
                {post.created_at && (
                  <>
                    <span className="text-white/70 font-medium text-[11px]">•</span>
                    <span className="text-white/70 font-medium text-[13px]">{formatTimeAgo(post.created_at)}</span>
                  </>
                )}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-white/90 font-medium tracking-wide">{location}</p>
              </div>
            </div>
          </div>
        </div>}

        {!showEmbed && <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 z-10 ${isPlaying ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}>
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl pl-1">
            <Play size={28} className="fill-white" />
          </div>
        </div>}

        {!showEmbed && <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />}
      </div>

      <div className="p-4 lg:p-6 flex flex-col gap-4 lg:gap-5">
        <div className="flex items-start justify-between gap-3 lg:gap-4">
          <div className="flex-1 space-y-2">
            {showEmbed ? (
              <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <img src={avatarSrc} alt={userName} className={`w-8 h-8 rounded-full object-cover border ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`} />
                  <span className={`font-semibold text-sm flex items-center gap-1.5 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    {userName} <VerifiedBadge isVerified={post.user?.is_verified} role={post.user?.role} />
                  </span>
                </div>
                <p className={`text-xs leading-relaxed line-clamp-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {post.caption}
                </p>
              </div>
            ) : (
              <h3 className={`text-base font-semibold leading-snug line-clamp-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                {post.caption}
              </h3>
            )}
          </div>

          <div className="flex flex-col items-stretch gap-2 shrink-0">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                const postUserId = typeof post.user === 'string' ? post.user : post.user?.id;
                
                if (currentUser && currentUser.id === postUserId) {
                  navigate('/profile');
                } else {
                  navigate(`/creator/${postUserId || ''}`);
                }
              }}
              className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-[11px] lg:text-xs font-semibold whitespace-nowrap flex items-center gap-1 lg:gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                isDarkMode 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-black/5 text-black hover:bg-black/10'
              }`}
            >
              <UserCircle size={14} className={isDarkMode ? 'text-white' : 'text-black'} />
              View Profile
            </button>

            <AnimatePresence>
              {(isPlaying || showEmbed) && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.8 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.8 }}
                  className="w-full mt-0.5"
                >
                  <div className="w-full h-[28px] lg:h-[32px] bg-white rounded-full flex items-center justify-center shadow-sm border border-black/5 relative overflow-hidden">
                    <Lottie 
                      animationData={audioWaveLottie} 
                      loop={true} 
                      className="absolute w-10 h-10 lg:w-12 lg:h-12 opacity-90 scale-[1.7]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div 
          className={`flex items-center justify-between pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-zinc-100'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4">
            <button onClick={(e) => { e.stopPropagation(); toggleLike(); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isLocked ? 'cursor-not-allowed opacity-50' : (isDarkMode ? 'hover:bg-white/10 text-zinc-300 hover:text-red-500' : 'hover:bg-zinc-100 text-zinc-600 hover:text-red-500')}`}>
              {isLocked ? <Lock size={20} stroke="currentColor" /> : <Heart size={20} fill={likedByMe ? "#ef4444" : "none"} stroke={likedByMe ? "#ef4444" : "currentColor"} className="transition-colors" />}
              <span className="text-[13px] font-semibold">{likeCount.toLocaleString()}</span>
            </button>
            <button onClick={() => setIsCommentsOpen(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-600'}`}>
              <MessageCircle size={20} />
              <span className="text-[13px] font-semibold">{post.comment_count || 0}</span>
            </button>
            <button className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-600'}`}>
              <Share2 size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-600'}`}>
              <Bookmark size={20} />
            </button>
          </div>
        </div>
      </div>
      
      <CommentsModal 
        isOpen={isCommentsOpen} 
        onClose={() => setIsCommentsOpen(false)} 
        entityType="YOUTUBE_POST" 
        entityId={String(post.id)} 
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

function getYoutubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
