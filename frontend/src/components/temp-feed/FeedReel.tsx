import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Volume2, VolumeX, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import defaultProfile from '../../assets/defaultprofile.png';

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
}

export function FeedReel({ 
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

  // Called directly on click - this IS a user gesture so browsers allow audio
  const handleMuteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      const newMuted = !video.muted;
      video.muted = newMuted;
      video.volume = newMuted ? 1 : 1;
      if (!newMuted) {
        // Re-play from current position with audio - browser permits this since it's a user gesture
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
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      className={`lg:border lg:border-border-main lg:rounded-[40px] overflow-hidden group lg:shadow-xl border-b border-border-main lg:border-b-0 pb-8 lg:pb-0 relative ${
        isDarkMode ? 'bg-black' : 'bg-white shadow-2xl'
      }`}
    >
      <div className="p-4 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-border-main p-0.5">
            <img src={avatarSrc} alt={post.user} className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <h4 className="text-[13px] font-black text-text-main leading-none mb-1">{post.user}</h4>
            <p className="text-[10px] text-text-muted font-bold">{post.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPlaying && (
            <button 
              onClick={handleMuteClick}
              className={`p-1.5 rounded-full transition-colors ${
                isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
              }`}
            >
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="animate-pulse text-green-500" />}
            </button>
          )}
          <button className="text-text-muted hover:text-text-main transition-colors p-2"><MoreHorizontal size={18} /></button>
        </div>
      </div>

      <div className="w-full max-h-[min(85vh,800px)] aspect-[4/5] lg:aspect-[9/16] relative overflow-hidden bg-black flex items-center justify-center cursor-pointer" onClick={() => { if (isPlaying) { pauseMedia(); } else { playMedia(); } }}>
        <video 
          ref={videoRef}
          src={post.videoUrl}
          loop
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            // Force muted=true at load time because JSX muted prop doesn't work reliably
            if (videoRef.current) videoRef.current.muted = true;
          }}
          className="w-full h-full object-cover"
        />

        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-10">
            <div 
              className="h-full bg-green-500 transition-all duration-75 origin-left"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {isPlaying && (
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-full flex items-center gap-2 text-white text-[9px] font-bold tracking-wide border border-white/10 select-none z-15">
            <div className="flex items-end gap-[2px] h-[10px] w-[14px]">
              <span className="w-[2px] bg-green-400 rounded-full visualizer-bar" style={{ animationDelay: '0.1s' }} />
              <span className="w-[2px] bg-green-400 rounded-full visualizer-bar" style={{ animationDelay: '0.4s' }} />
              <span className="w-[2px] bg-green-400 rounded-full visualizer-bar" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>REEL PLAYING</span>
          </div>
        )}
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
              Liked by <span className="font-black">Jane</span>, <span className="font-black">Alex</span> and <span className="font-black">{typeof post.likes === 'number' ? post.likes.toLocaleString() : post.likes} others</span>
            </p>
          </div>

          {/* Caption */}
          <p className="text-[13px] text-text-main leading-relaxed">
            <span className="font-black mr-2 uppercase tracking-tight text-[11px]">{post.user.split(' ')[0]}</span>
            <span className="text-text-muted dark:text-zinc-400 font-medium">{post.comment}</span>
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {post.tags.map((tag, idx) => (
                <span key={idx} className="text-[12px] font-bold text-blue-500 hover:text-blue-600 transition-colors cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <button className="text-[12px] text-text-muted font-bold mt-2 opacity-60 hover:opacity-100 transition-opacity">View all {post.commentsCount} comments</button>
        </div>
      </div>
    </motion.article>
  );
}
