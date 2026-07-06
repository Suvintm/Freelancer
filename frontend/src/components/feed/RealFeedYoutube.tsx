import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { MoreHorizontal, Volume2, VolumeX, Heart, MessageCircle, Share2, Bookmark, Play } from 'lucide-react';
import defaultProfile from '../../assets/defaultprofile.png';
import { useLottie } from 'lottie-react';
import youtubeLottieData from '../../assets/lottie/youtube_animation.json';
import watchFullVideoLottieData from '../../assets/lottie/WatchFullVideoCTA.json';
import type { RealPost } from './types';

export function RealFeedYoutube({ 
  post, 
  isDarkMode, 
  isActive, 
  isMuted = true, 
  onToggleMute 
}: { 
  post: RealPost; 
  isDarkMode: boolean;
  isActive?: boolean;
  isMuted?: boolean;
  onToggleMute?: (e: React.MouseEvent) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoUrl = resolveMediaUrl(post.media?.[0]?.urls?.video || post.media?.[0]?.urls?.fallback || '');
  const userName = post.youtube_channel?.channel_name || post.user?.profile?.name || post.user?.username || 'User';
  const avatarSrc = resolveMediaUrl(post.youtube_channel?.thumbnail_url) || resolveMediaUrl(post.user?.profile?.profile_picture) || defaultProfile;
  const location = 'YouTube';

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

  const lottieContainerRef = useRef(null);
  const isInView = useInView(lottieContainerRef, { margin: "50px" });
  const { View: LottieView, play, pause } = useLottie({
    animationData: youtubeLottieData,
    loop: true,
    autoplay: true,
  });

  useEffect(() => {
    if (isInView) play(); else pause();
  }, [isInView, play, pause]);

  const ctaContainerRef = useRef(null);
  const isCtaInView = useInView(ctaContainerRef, { margin: "50px" });
  const { View: CtaLottieView, play: playCta, pause: pauseCta } = useLottie({
    animationData: watchFullVideoLottieData,
    loop: true,
    autoplay: true,
  });

  useEffect(() => {
    if (isCtaInView) playCta(); else pauseCta();
  }, [isCtaInView, playCta, pauseCta]);

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

  return (
    <motion.article 
      data-post-id={post.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => { if (post.youtube_link) window.open(post.youtube_link, '_blank'); }}
      className={`relative w-full rounded-[28px] overflow-hidden group transition-all duration-500 mb-8 border cursor-pointer ${
        isDarkMode 
          ? 'bg-zinc-950/80 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-white/20 hover:shadow-[0_8px_32px_rgba(229,9,20,0.15)]' 
          : 'bg-white border-zinc-200 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]'
      }`}
    >
      {/* Video Container (16:9 Aspect Ratio) */}
      <div 
        className="relative w-full aspect-video bg-black cursor-pointer overflow-hidden rounded-t-[28px]"
        onClick={(e) => { e.stopPropagation(); if (isPlaying) pauseMedia(); else playMedia(); }}
      >
        <video 
          ref={videoRef}
          src={videoUrl}
          loop
          playsInline
          onLoadedMetadata={() => {
            if (videoRef.current) videoRef.current.muted = true;
          }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
        />

        {/* Top Gradient Overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />

        {/* Video Header: User Info & YT Lottie */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/30 p-[1.5px] bg-black/40 backdrop-blur-md overflow-hidden shadow-lg pointer-events-auto">
              <img src={avatarSrc} alt={userName} className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="flex flex-col drop-shadow-md">
              <h4 className="text-[14px] font-bold text-white tracking-wide leading-tight flex items-center gap-2">
                {userName}
                <div ref={lottieContainerRef} className="w-12 h-6 flex items-center justify-center -ml-1 scale-[1.75] transform origin-left">
                  {LottieView}
                </div>
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-white/90 font-medium tracking-wide">{location}</p>
                {isPlaying && !isMuted && (
                  <div className="flex items-end gap-[1.5px] h-2">
                    <span className="w-[1.5px] bg-red-500 rounded-full visualizer-bar animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <span className="w-[1.5px] bg-red-500 rounded-full visualizer-bar animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <span className="w-[1.5px] bg-red-500 rounded-full visualizer-bar animate-pulse" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Top Right Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button 
              onClick={handleMuteClick}
              className="p-2 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md transition-all border border-white/20 hover:scale-105 active:scale-95 shadow-lg"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-red-400 animate-pulse" />}
            </button>
            <button className="p-2 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md transition-all border border-white/20 hover:scale-105 active:scale-95 shadow-lg">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Play/Pause Center Indicator (Fades out) */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 z-10 ${isPlaying ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}>
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl pl-1">
            <Play size={28} className="fill-white" />
          </div>
        </div>

        {/* Bottom Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
      </div>

      {/* Content Section Below Video */}
      <div className="p-5 lg:p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Title / Comment */}
            <h3 className={`text-base font-semibold leading-snug line-clamp-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {post.caption}
            </h3>
            
            {/* Tags could be extracted from caption if needed */}
          </div>

          {/* YT CTA Lottie (Watch Full Video) */}
          {post.youtube_link && (
            <div 
              ref={ctaContainerRef}
              onClick={(e) => { e.stopPropagation(); window.open(post.youtube_link, '_blank'); }}
              className="cursor-pointer hover:scale-105 active:scale-95 transition-transform w-[120px] flex-shrink-0 flex items-center justify-center drop-shadow-md bg-white/5 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden p-1"
            >
              {CtaLottieView}
            </div>
          )}
        </div>

        {/* Bottom Interaction Bar */}
        <div 
          className={`flex items-center justify-between pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-zinc-100'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4">
            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-600'}`}>
              <Heart size={20} className="hover:text-red-500 transition-colors" />
              <span className="text-[13px] font-semibold">{post.like_count?.toLocaleString() || 0}</span>
            </button>
            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-600'}`}>
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
