import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { MoreHorizontal, Volume2, VolumeX, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import defaultProfile from '../../assets/defaultprofile.png';
import { useLottie } from 'lottie-react';
import youtubeLottieData from '../../assets/lottie/youtube_animation.json';
import watchFullVideoLottieData from '../../assets/lottie/WatchFullVideoCTA.json';

interface Post {
  id: string | number;
  user: string;
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const playMedia = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
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
    if (isInView) {
      play();
    } else {
      pause();
    }
  }, [isInView, play, pause]);

  const ctaContainerRef = useRef(null);
  const isCtaInView = useInView(ctaContainerRef, { margin: "50px" });
  const { View: CtaLottieView, play: playCta, pause: pauseCta } = useLottie({
    animationData: watchFullVideoLottieData,
    loop: true,
    autoplay: true,
  });

  useEffect(() => {
    if (isCtaInView) {
      playCta();
    } else {
      pauseCta();
    }
  }, [isCtaInView, playCta, pauseCta]);

  const pauseMedia = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      playMedia();
    } else {
      pauseMedia();
    }
  }, [isActive, playMedia, pauseMedia]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    if (!isMuted) {
      video.volume = 1;
    }
  }, [isMuted]);

  // Direct DOM manipulation on click (real user gesture = browser allows audio)
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

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const target = e.currentTarget;
    if (target.duration) {
      setProgress((target.currentTime / target.duration) * 100);
    }
  };


  const isDynamicPost = typeof post.id === 'string';
  const avatarSrc = isDynamicPost ? defaultProfile : post.img;

  return (
    <motion.article 
      data-post-id={post.id}
      className={`lg:border lg:border-border-main lg:rounded-[40px] overflow-hidden group lg:shadow-xl mb-6 lg:mb-0 pb-4 lg:pb-0 relative ${
        isDarkMode ? 'bg-black lg:bg-[#0a0a0a]' : 'bg-white shadow-sm lg:shadow-2xl'
      }`}
    >
      <div 
        className={`w-full max-h-[min(75vh,580px)] relative overflow-hidden flex items-center justify-center cursor-pointer ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}
        onClick={() => { if (isPlaying) { pauseMedia(); } else { playMedia(); } }}
      >
        {/* Instagram-style overlaid header (top-left) */}
        <div 
          className="absolute top-4 left-4 flex items-center gap-2.5 z-20 select-none pointer-events-auto" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-8 h-8 rounded-full border border-white/60 p-[1.5px] shadow-[0_2px_8px_rgba(0,0,0,0.3)] bg-black/20 shrink-0">
            <img src={avatarSrc} alt={post.user} className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <h4 className="text-[13px] font-semibold text-white tracking-wide leading-tight drop-shadow-[0_1px_2.5px_rgba(0,0,0,0.9)] flex items-center gap-1.5">
              {post.user}
              <div ref={lottieContainerRef} className="w-12 h-6 flex items-center justify-center -ml-1 scale-150 transform origin-left">
                {LottieView}
              </div>
            </h4>
            {post.location && (
              <div className="flex items-center gap-1.5 mt-0.5 leading-none">
                <p className="text-[10px] text-white/85 font-medium tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{post.location}</p>
                {isPlaying && !isMuted && (
                  <div className="flex items-end gap-[1px] h-[7px] w-[8px]">
                    <span className="w-[1.2px] bg-white rounded-full visualizer-bar" style={{ animationDelay: '0.1s' }} />
                    <span className="w-[1.2px] bg-white rounded-full visualizer-bar" style={{ animationDelay: '0.4s' }} />
                    <span className="w-[1.2px] bg-white rounded-full visualizer-bar" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls overlaid (top-right) */}
        <div 
          className="absolute top-4 right-4 flex items-center gap-2.5 z-20 pointer-events-auto" 
          onClick={(e) => e.stopPropagation()}
        >
          {isPlaying && (
            <button 
              onClick={handleMuteClick}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all border border-white/10 hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            >
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="animate-pulse text-red-400" />}
            </button>
          )}
          <button className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all border border-white/10 hover:scale-105 active:scale-95 shadow-md cursor-pointer">
            <MoreHorizontal size={16} />
          </button>
        </div>

        <video 
          ref={videoRef}
          src={post.videoUrl}
          loop
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) videoRef.current.muted = true;
          }}
          className="w-full h-auto max-h-[min(75vh,580px)] object-contain"
        />

        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20 z-10">
            <div 
              className="h-full bg-white transition-all duration-75 origin-left"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Watch on YT Button */}
        {post.watchOnYtLink && (
          <div 
            ref={ctaContainerRef}
            onClick={(e) => { e.stopPropagation(); window.open(post.watchOnYtLink, '_blank'); }}
            className="absolute bottom-3 right-3 z-20 cursor-pointer hover:scale-105 active:scale-95 transition-transform w-[140px] flex items-center justify-center drop-shadow-lg"
          >
            {CtaLottieView}
          </div>
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
