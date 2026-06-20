import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Volume2, VolumeX, Youtube, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
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
  ytChannelName?: string;
  ytSubscribeLink?: string;
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
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="animate-pulse text-red-500" />}
            </button>
          )}
          <button className="text-text-muted hover:text-text-main transition-colors p-2"><MoreHorizontal size={18} /></button>
        </div>
      </div>

      <div className="w-full aspect-video bg-black relative flex items-center justify-center cursor-pointer" onClick={() => { if (isPlaying) { pauseMedia(); } else { playMedia(); } }}>
        <video 
          ref={videoRef}
          src={post.videoUrl}
          loop
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) videoRef.current.muted = true;
          }}
          className="w-full h-full object-cover"
        />

        <div className="absolute top-3 left-3 bg-red-600 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 text-white text-[9px] font-black tracking-wide border border-white/10 select-none z-15 shadow-md">
          <Youtube size={10} fill="white" />
          <span>YOUTUBE VIDEO</span>
        </div>

        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-10">
            <div 
              className="h-full bg-red-500 transition-all duration-75 origin-left"
              style={{ width: `${progress}%` }}
            />
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

        {/* YT Subscribe Banner */}
        {post.ytChannelName && (
          <div className={`mt-4 p-3 rounded-2xl flex items-center justify-between border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0 shadow-inner">
                <Youtube size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">YouTube Channel</p>
                <p className="text-[13px] font-black text-text-main truncate">{post.ytChannelName}</p>
              </div>
            </div>
            <a 
              href={post.ytSubscribeLink || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold transition-colors shadow-md active:scale-95"
            >
              Subscribe
            </a>
          </div>
        )}
      </div>
    </motion.article>
  );
}
