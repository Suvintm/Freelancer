import React, { useEffect, useRef, useState, useMemo } from 'react';
import Hls from 'hls.js';
import { toHlsUrl } from '../utils/urlHelper.jsx';

/**
 * HlsVideoPlayer — Product-Grade Adaptive Streaming Engine.
 * ... (rest of the JSDoc) ...
 */

const HlsVideoPlayer = React.forwardRef(({
  src, poster, autoPlay = false, muted = true, loop = true,
  className = "", isActive = true, onPlaying, onPause, onEnded,
  onQualityChange, onAvailableQualities, preferredQuality = "Auto",
  isPreloading = false, objectFit = "cover"
}, ref) => {
  const internalRef = useRef(null);
  const videoRef = (ref && typeof ref !== 'function') ? ref : internalRef;
  const hlsRef = useRef(null);
  const abortControllerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const isStalledRef = useRef(false);
  const autoplayWarnedRef = useRef(false);
  const lastUrlRef = useRef(""); // To track actual URL change vs. prop re-render

  // Use the unified Product-Grade utility from urlHelper
  const streamUrl = useMemo(() => toHlsUrl(src), [src]);

  // — PRO-LEVEL: Stable Callback Refs —
  // We lock the identity of parent callbacks to prevent UI re-renders from re-triggering the HLS lifecycle.
  const onQualityChangeRef = useRef(onQualityChange);
  const onAvailableQualitiesRef = useRef(onAvailableQualities);

  useEffect(() => {
    onQualityChangeRef.current = onQualityChange;
    onAvailableQualitiesRef.current = onAvailableQualities;
  }, [onQualityChange, onAvailableQualities]);

  // — PRO-LEVEL: Persistent Media Identity Engine —
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    // — STABILITY GUARD: Only "Hard-Reset" if the URL actually changed —
    if (streamUrl === lastUrlRef.current) {
        // Skip re-initialization. The HLS instance is already healthy.
        return;
    }

    // New URL detected! Perform clean tear-down of previous session.
    if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
    }
    setIsReady(false);
    lastUrlRef.current = streamUrl;

    if (streamUrl.includes('.m3u8') && Hls.isSupported()) {
      if (!abortControllerRef.current) abortControllerRef.current = new AbortController();

      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const isSlow = connection && (connection.saveData || connection.effectiveType === '2g' || connection.effectiveType === '3g');

      const hls = new Hls({
        startLevel: preferredQuality === "Auto" ? (isSlow ? 0 : -1) : undefined,
        capLevelToPlayerSize: true, 
        enableWorker: true, 
        maxBufferLength: 5, 
        maxMaxBufferLength: 10,
        backBufferLength: 0, 
        lowLatencyMode: true,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsReady(true);
        if (onQualityChangeRef.current) onQualityChangeRef.current("Auto");
        const heights = hls.levels.map(l => l.height).filter(Boolean);
        const uniqueHeights = [...new Set(heights)].sort((a,b) => b - a);
        if (onAvailableQualitiesRef.current) onAvailableQualitiesRef.current(uniqueHeights);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (v, data) => {
        const h = hls.levels[data.level]?.height;
        if (h && onQualityChangeRef.current) onQualityChangeRef.current(`${h}p`);
      });
    } 
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsReady(true);
        if (onQualityChangeRef.current) onQualityChangeRef.current("Auto");
      });
    } 
    else {
      video.src = src;
      setIsReady(true);
    }

    return () => {
        // — PRO-LEVEL: Safe Cleanup —
        // We only clear the video object if the URL actually changed or component unmounts.
        // We do NOT clear during simple re-renders caused by parent state updates (Likes).
    };
  }, [streamUrl, src]); 

  // Cleanup effect for actual Unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
      }
      const video = videoRef.current;
      if (video) {
        video.pause();
        try {
          video.removeAttribute('src');
          video.load(); 
        } catch (e) {}
      }
      if (abortControllerRef.current) abortControllerRef.current.abort();
      lastUrlRef.current = "";
    };
  }, []);

  // — PRO-LEVEL: Dynamic Promotion Controller —
  // This updates HLS configuration (like buffer depth) without restarting the stream.
  useEffect(() => {
    const hls = hlsRef.current;
    if (!hls) return;

    // — STABILITY: Dynamic Buffer Scaling —
    // Active: High-perf buffer. Preload: Tiny "Hook" buffer to save user bandwidth.
    hls.config.maxBufferLength = isActive ? 30 : (isPreloading ? 2 : 0);
    hls.config.maxMaxBufferLength = isActive ? 60 : (isPreloading ? 5 : 0);
    hls.config.maxBufferSize = isActive ? 100 * 1000 * 1000 : (isPreloading ? 5 * 1000 * 1000 : 0);

    // If it moved out of range entirely, we pause but don't destroy
    if (!isActive && !isPreloading) {
        if (videoRef.current) videoRef.current.pause();
    }
  }, [isActive, isPreloading]);

  // Unified Playback & Visibility Controller
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    const handleVisibility = () => {
      if (document.hidden && !video.paused) {
        video.pause();
      } else if (!document.hidden && isActive && autoPlay && video.paused) {
        video.play().catch(() => {}); // Attempt Resume
      }
    };

    if (isActive && autoPlay) {
      if (video.paused) {
        const p = video.play();
        if (p !== undefined) {
          p.catch(e => {
              if (e.name === 'NotAllowedError' && !autoplayWarnedRef.current) {
                console.info("[HlsVideoPlayer] Autoplay blocked. Retrying muted...");
                autoplayWarnedRef.current = true;
              }
              video.muted = true;
              video.play().catch(() => {});
            });
        }
      }
    } else {
      video.pause();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isActive, autoPlay, isReady]);

  // Fast Quality Switching Logic - FORCED TO AUTO FOR INSTA-SMOOTHNESS
  useEffect(() => {
    if (!hlsRef.current || !isReady) return;
    const hls = hlsRef.current;

    /** 
     * MANUAL OVERRIDE COMMENTED OUT - SWITCHING TO PURE ABR
    if (preferredQuality === "Auto") {
      hls.currentLevel = -1;
    } else {
      const target = parseInt(preferredQuality, 10);
      let idx = -1;
      let diff = Infinity;

      hls.levels.forEach((l, i) => {
        if (l.height && l.height <= target) {
          const d = target - l.height;
          if (d < diff) { diff = d; idx = i; }
        }
      });

      if (idx === -1 && hls.levels.length > 0) idx = 0; // Fallback to min

      if (isStalledRef.current || videoRef.current?.paused) {
        hls.currentLevel = idx;
        isStalledRef.current = false;
      } else {
        hls.nextLevel = idx;
      }
    }
    */

    // Force ABR for all users to ensure maximum stability per Instagram standards
    hls.currentLevel = -1; 
  }, [preferredQuality, isReady]);

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
      {(!isReady || !isActive) && poster && (
        <img 
          src={poster} 
          alt="" 
          className="absolute inset-0 w-full h-full z-0 transition-opacity duration-300 pointer-events-none" 
          style={{ opacity: isReady ? 0 : 1, objectFit: objectFit }} 
        />
      )}
      <video
        ref={node => {
          internalRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        poster={poster}
        className="w-full h-full z-10 relative"
        style={{ objectFit }}
        muted={muted} loop={loop} playsInline crossOrigin="anonymous" controlsList="nodownload"
        onPlaying={onPlaying} onPause={onPause} onEnded={onEnded}
      />
    </div>
  );
});

export default React.memo(HlsVideoPlayer);
