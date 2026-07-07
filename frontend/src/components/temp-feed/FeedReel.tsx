import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Volume2, VolumeX, Heart, MessageCircle, Share2, Bookmark, Youtube, MapPin } from 'lucide-react';
import defaultProfile from '../../assets/defaultprofile.png';

interface Post {
  id: string | number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: string | any;
  location: string;
  img: string;
  likes: string | number;
  comment: string;
  commentsCount: number;
  videoUrl?: string;
  type?: string;
  tags?: string[];
  likedByAvatars?: string[];
  watchOnYtLink?: string;
  mediaWidth?: number;
  mediaHeight?: number;
}

const MIN_RATIO = 9 / 16; // 0.5625, allows full vertical 9:16 height
const MAX_RATIO = 1.91;

function getClampedRatio(width?: number, height?: number): number {
  if (!width || !height) return 1;
  const raw = width / height;
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, raw));
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
  const [mediaDims, setMediaDims] = useState({ width: post.mediaWidth, height: post.mediaHeight });

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

  const isTallMedia = (mediaDims.width && mediaDims.height && (mediaDims.width / mediaDims.height) <= 1.0);
  const objectFitClass = !isTallMedia ? 'object-contain' : 'object-cover';

  return (
    <motion.article 
      data-post-id={post.id}
      className={`rounded-t-[16px] lg:border lg:border-border-main lg:rounded-[24px] overflow-hidden group lg:shadow-xl mb-6 lg:mb-0 pb-4 lg:pb-0 relative ${
        isDarkMode ? 'bg-black lg:bg-[#0a0a0a]' : 'bg-white shadow-sm lg:shadow-2xl'
      }`}
    >
      <div 
        className="w-full relative overflow-hidden flex items-center justify-center cursor-pointer bg-black" 
        style={{ 
          aspectRatio: getClampedRatio(mediaDims.width, mediaDims.height),
          maxHeight: 'min(80vh, 650px)'
        }}
        onClick={() => { if (isPlaying) { pauseMedia(); } else { playMedia(); } }}
      >
        {/* Instagram-style overlaid header (top-left) */}
        <div 
          className="absolute top-4 left-4 flex items-center gap-2.5 z-20 select-none pointer-events-auto" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-8 h-8 rounded-full border border-white/60 p-[1.5px] shadow-[0_2px_8px_rgba(0,0,0,0.3)] bg-black/20 shrink-0">
            <img src={avatarSrc} alt={typeof post.user === 'string' ? post.user : (post.user?.profile?.name || post.user?.username || 'User')} className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <h4 className="text-[13px] font-semibold text-white tracking-wide leading-tight drop-shadow-[0_1px_2.5px_rgba(0,0,0,0.9)] flex items-center gap-1.5">
              {typeof post.user === 'string' ? post.user : (post.user?.profile?.name || post.user?.username || 'User')}
            </h4>
            {post.location && (
              <div className="flex items-center gap-1.5 mt-0.5 leading-none">
                <MapPin size={10} className="text-white/80 animate-pulse drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] shrink-0" />
                <p className="text-[10px] text-white/85 font-medium tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] animate-pulse">{post.location}</p>
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
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="animate-pulse text-green-400" />}
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
          poster={post.img}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={(e) => {
            if (videoRef.current) videoRef.current.muted = true;
            if (!mediaDims.width || !mediaDims.height) {
              setMediaDims({ width: e.currentTarget.videoWidth, height: e.currentTarget.videoHeight });
            }
          }}
          className={`absolute inset-0 w-full h-full ${objectFitClass}`}
        />

        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20 z-10">
            <div 
              className="h-full bg-white transition-all duration-75 origin-left"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {isPlaying && (
          <div className={`absolute left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-full flex items-center gap-2 text-white text-[9px] font-medium tracking-wide border border-white/10 select-none z-15 ${isTallMedia ? 'bottom-16' : 'bottom-3'}`}>
            <div className="flex items-end gap-[2px] h-[10px] w-[14px]">
              <span className="w-[2px] bg-green-400 rounded-full visualizer-bar" style={{ animationDelay: '0.1s' }} />
              <span className="w-[2px] bg-green-400 rounded-full visualizer-bar" style={{ animationDelay: '0.4s' }} />
              <span className="w-[2px] bg-green-400 rounded-full visualizer-bar" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>REEL PLAYING</span>
          </div>
        )}

        {/* Action Buttons Overlay for Tall Media */}
        {isTallMedia && (
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div 
              className="flex items-center gap-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="text-white drop-shadow-md transition-colors transform active:scale-90 hover:text-rose-500"><Heart size={26} fill="rgba(0,0,0,0.2)" /></button>
              <button className="text-white drop-shadow-md transition-colors transform active:scale-90"><MessageCircle size={26} fill="rgba(0,0,0,0.2)" /></button>
              <button className="text-white drop-shadow-md transition-colors transform active:scale-90"><Share2 size={26} fill="rgba(0,0,0,0.2)" /></button>
            </div>
            <button 
              className="text-white drop-shadow-md transition-colors transform active:scale-90 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Bookmark size={26} fill="rgba(0,0,0,0.2)" />
            </button>
          </div>
        )}

        {/* Watch on YT Button */}
        {post.watchOnYtLink && (
          <button 
            onClick={(e) => { e.stopPropagation(); window.open(post.watchOnYtLink, '_blank'); }}
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
              <button className={`transition-colors transform active:scale-90 hover:text-rose-500 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><Heart size={24} /></button>
              <button className={`transition-colors transform active:scale-90 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><MessageCircle size={24} /></button>
              <button className={`transition-colors transform active:scale-90 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><Share2 size={24} /></button>
            </div>
            <button className={`transition-colors transform active:scale-90 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}><Bookmark size={24} /></button>
          </div>
        )}

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
            <span className="font-semibold mr-2 uppercase tracking-tight text-[11px]">
              {typeof post.user === 'string' 
                ? post.user.split(' ')[0] 
                : (post.user?.profile?.name?.split(' ')[0] || post.user?.username?.split(' ')[0] || 'USER')}
            </span>
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
