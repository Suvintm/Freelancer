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
  const [isReady, setIsReady] = useState(false);
  const isStalledRef = useRef(false);

  // Use the unified Product-Grade utility from urlHelper
  const streamUrl = useMemo(() => toHlsUrl(src), [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    // ── SLIDING WINDOW RESOURCE MANAGEMENT ──
    // Only initialize HLS if the reel is active or in the preloading range.
    // This prevents background tabs/hidden reels from wasting GPU/CPU threads.
    if (!isActive && !isPreloading) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
        setIsReady(false);
      }
      return;
    }

    if (streamUrl.includes('.m3u8') && Hls.isSupported()) {
      /**
       * HLS.js Advance Configuration (Performance Tuning)
       */
      const hls = new Hls({
        startLevel: -1, // Startup in ABR mode
        capLevelToPlayerSize: true, 
        
        // ── Web Worker (Offload heavy lifting) ──
        enableWorker: true, 
        
        // ── Sliding Window Buffer (DSA Concept: Dynamic Capping) ──
        // Only buffer 1.5s for neighbors (isPreloading) to save bandwidth/GPU.
        // Buffer up to 20s for the active reel for smooth playback.
        maxBufferLength: isActive ? 20 : (isPreloading ? 1.5 : 0), 
        maxMaxBufferLength: isActive ? 35 : (isPreloading ? 3 : 0),
        maxBufferSize: isActive ? 60 * 1000 * 1000 : (isPreloading ? 2 * 1000 * 1000 : 0), 
        
        // Initial buffer target
        backBufferLength: 0, // Quickly evict past fragments from memory        
        // ── ABR (Adaptive Bitrate) Algorithm Tuning ──
        abrEwmaDefaultEstimate: 10000000, // 10Mbps initial guess for 4K/HD starts
        abrBandwidthUpFactor: 0.8,      // Be conservative about upgrading
        abrBandwidthDownFactor: 0.9,    // Fast downgrade for stability
        
        // ── Resilience ──
        fragLoadingMaxRetry: 4,
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
        lowLatencyMode: true,           // Faster fragment selection
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsReady(true);
        if (onQualityChange) onQualityChange("Auto");
        const heights = hls.levels.map(l => l.height).filter(Boolean);
        const uniqueHeights = [...new Set(heights)].sort((a,b) => b - a);
        if (onAvailableQualities) onAvailableQualities(uniqueHeights);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (v, data) => {
        const h = hls.levels[data.level]?.height;
        if (h && onQualityChange) onQualityChange(`${h}p`);
      });

      // Monitor for stalling to provide intelligent recovery
      hls.on(Hls.Events.ERROR, (v, data) => {
        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          isStalledRef.current = true;
        }
      });
    } 
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsReady(true);
        if (onQualityChange) onQualityChange("Auto");
      });
    } 
    else {
      video.src = src;
      setIsReady(true);
    }

    return () => hlsRef.current?.destroy();
  }, [streamUrl, isPreloading, isActive, onQualityChange, onAvailableQualities, src]);

  // Unified Playback Controller
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    if (isActive && autoPlay) {
      if (video.paused) {
        const p = video.play();
        if (p !== undefined) p.catch(e => { if (e.name !== 'AbortError') console.warn(e); });
      }
    } else if (!isActive) {
      video.pause();
    }
  }, [isActive, autoPlay, isReady]);

  // Fast Quality Switching Logic
  useEffect(() => {
    if (!hlsRef.current || !isReady) return;
    const hls = hlsRef.current;

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

      /**
       * DSA PERFORMANCE CONCEPT: Hybrid Switching
       * If currently stalling, we force immediate switch (currentLevel) to recover.
       * If playing normally, we use nextLevel for zero-glitch seamless transition.
       */
      if (isStalledRef.current || videoRef.current?.paused) {
        hls.currentLevel = idx;
        isStalledRef.current = false;
      } else {
        hls.nextLevel = idx;
      }
    }
  }, [preferredQuality, isReady]);

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
      {(!isReady || !isActive) && poster && (
        <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover z-0 filter blur-sm transition-opacity duration-300 pointer-events-none" style={{ opacity: isReady ? 0 : 1 }} />
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
