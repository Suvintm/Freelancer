import React, { useEffect, useRef, useState, useMemo } from 'react';
import Hls from 'hls.js';

// Helper to convert standard Cloudinary MP4 URLs to HLS (sp_auto) streams
const getHlsUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  // If already an HLS or has streaming profile, return as is
  if (url.includes('sp_auto') || url.includes('.m3u8')) return url;

  // Expected Cloudinary format: https://res.cloudinary.com/<name>/video/upload/v<version>/<filename>.mp4
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  const baseUrl = url.substring(0, uploadIndex + 8);
  const remainingParams = url.substring(uploadIndex + 8);

  // Insert sp_full_hd to generate up to 1080p streams (sp_hd limits to 720p)
  let hlsUrl = `${baseUrl}sp_full_hd/${remainingParams}`; 
  hlsUrl = hlsUrl.replace(/\.(mp4|webm|mov|avi)$/i, '.m3u8');

  return hlsUrl;
};

const HlsVideoPlayer = React.forwardRef(({
  src,
  poster,
  autoPlay = false,
  muted = true,
  loop = true,
  className = "",
  isActive = true, // Used by IntersectionObserver/Virtualization to pause off-screen
  onPlaying,
  onPause,
  onEnded,
  onQualityChange,
  onAvailableQualities,
  preferredQuality = "Auto",
  isPreloading = false,
  objectFit = "cover"
}, ref) => {
  const internalRef = useRef(null);
  const videoRef = (ref && typeof ref !== 'function') ? ref : internalRef;
  const hlsRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Memoize the optimal URL
  const streamUrl = useMemo(() => getHlsUrl(src), [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    const isHlsUrl = streamUrl.includes('.m3u8');

    // 1. Initialize HLS.js for supported browsers (Chrome, Firefox, Windows Edge)
    if (isHlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        startLevel: -1, 
        capLevelToPlayerSize: true, 
        // INSTAGRAM-STYLE PRELOADING PROFILES
        maxBufferLength: isPreloading ? 2 : 15, 
        maxMaxBufferLength: isPreloading ? 3 : 30,
        maxBufferSize: isPreloading ? 2 * 1000 * 1000 : 20 * 1000 * 1000, // 2MB preload limit vs 20MB active limit
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsReady(true);
        if (onQualityChange) onQualityChange("Auto"); // Initial state

        // Expose all available resolutions
        const heights = hls.levels.map(l => l.height).filter(Boolean);
        const uniqueHeights = [...new Set(heights)].sort((a,b) => b - a);
        if (onAvailableQualities) onAvailableQualities(uniqueHeights);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        if (level && level.height) {
          if (onQualityChange) onQualityChange(`${level.height}p`);
        }
      });
    } 
    // 2. Fallback for Safari (iOS natively supports HLS via the video tag)
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsReady(true);
        if (onQualityChange) onQualityChange("Auto");
      });
    } 
    // 3. Absolute fallback (Standard MP4)
    else {
      video.src = src; // Original source
      setIsReady(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamUrl, isPreloading]);

  // Handle Play/Pause based on 'isActive' prop (Virtualization Hook)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    if (isActive && autoPlay) {
      // Consolidate playback logic here to prevent "double play" glitches
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
              if (e.name !== 'AbortError') console.warn("Auto-play prevented:", e);
          });
        }
      }
    } else if (!isActive) {
      video.pause();
    }
  }, [isActive, autoPlay, isReady]);

  // Handle dynamic quality (level) switching requested by the user
  useEffect(() => {
    if (!hlsRef.current || !isReady) return;
    const hls = hlsRef.current;

    if (preferredQuality === "Auto") {
      hls.currentLevel = -1; // -1 means auto (adaptive)
    } else {
      const targetHeight = parseInt(preferredQuality, 10);
      if (isNaN(targetHeight)) return;

      let bestMatchIndex = -1;
      let minDiff = Infinity;

      // Find the highest available resolution that is <= the requested quality
      hls.levels.forEach((level, index) => {
        if (level.height && level.height <= targetHeight) {
          const diff = targetHeight - level.height;
          if (diff < minDiff) {
            minDiff = diff;
            bestMatchIndex = index;
          }
        }
      });

      // If user requested 720p but only 1080p is available, fallback to the lowest available quality to prevent buffering
      if (bestMatchIndex === -1 && hls.levels.length > 0) {
        let lowestIndex = 0;
        let minHeight = Infinity;
        hls.levels.forEach((l, i) => {
          if (l.height && l.height < minHeight) {
            minHeight = l.height;
            lowestIndex = i;
          }
        });
        bestMatchIndex = lowestIndex;
      }

      // Use nextLevel for smooth transition without buffer flush
      hls.nextLevel = bestMatchIndex !== -1 ? bestMatchIndex : -1;
    }
  }, [preferredQuality, isReady]);

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
      {/* Skeleton / Blur Poster before video is ready */}
      {(!isReady || !isActive) && poster && (
        <img
          src={poster}
          alt="Video Poster"
          className="absolute inset-0 w-full h-full object-cover z-0 filter blur-sm transition-opacity duration-300 pointer-events-none"
          style={{ opacity: isReady ? 0 : 1 }}
        />
      )}

      <video
        ref={(node) => {
            internalRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
        }}
        poster={poster} // Native fallback poster
        className="w-full h-full z-10 relative"
        style={{ objectFit }}
        muted={muted}
        loop={loop}
        playsInline // Crucial for iOS Safari inline playback!
        onPlaying={onPlaying}
        onPause={onPause}
        onEnded={onEnded}
        crossOrigin="anonymous"
        controlsList="nodownload"
      />
    </div>
  );
});

export default React.memo(HlsVideoPlayer);
