import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiArrowLeft,
  HiOutlineGlobeAlt,
  HiOutlineCalendarDays,
  HiOutlineCheckBadge,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineXMark,
  HiOutlineHeart,
  HiOutlineShare,
  HiOutlineRocketLaunch,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineBuildingOffice2,
  HiChevronLeft,
  HiChevronRight,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlinePlay,
} from "react-icons/hi2";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaPlay,
  FaPause,
  FaVolumeMute,
  FaVolumeUp,
  FaForward,
  FaBackward,
  FaExpand,
  FaCompress,
  FaGlobe,
  FaWhatsapp,
  FaChevronRight,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import axios from "axios";

// ─── URL repair ───────────────────────────────────────────────────────────────
const repairUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary") && !url.includes("res_") && !url.includes("_com")) return url;
  let fixed = url;
  fixed = fixed.replace(/^(https?):?\/*_+/gi, "$1://");
  fixed = fixed.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com").replace(/res_cloudinary_com/g, "res.cloudinary.com").replace(/cloudinary_com/g, "cloudinary.com");
  if (fixed.includes("res.cloudinary.com")) {
    fixed = fixed.replace(/res\.cloudinary\.com_+/g, "res.cloudinary.com/");
    fixed = fixed.replace(/image_upload_+/g, "image/upload/").replace(/video_upload_+/g, "video/upload/");
    fixed = fixed.replace(/([/_]?v\d+)_+/g, "$1/");
    fixed = fixed.replace(/advertisements_images_+/g, "advertisements/images/").replace(/advertisements_videos_+/g, "advertisements/videos/");
    fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
  }
  fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1").replace(/_png([/_?#]|$)/gi, ".png$1").replace(/_mp4([/_?#]|$)/gi, ".mp4$1");
  return fixed;
};

const fmt = (s) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

// ─── Video Player ─────────────────────────────────────────────────────────────
const VideoPlayer = ({ src }) => {
  const videoRef    = useRef(null);
  const trackRef    = useRef(null);
  const containerRef = useRef(null);

  const [playing,    setPlaying]    = useState(false);
  const [muted,      setMuted]      = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [duration,   setDuration]   = useState(0);
  const [currentTime,setCurrentTime]= useState(0);
  const [buffered,   setBuffered]   = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [volume,     setVolume]     = useState(1);
  const [jumpLabel,  setJumpLabel]  = useState(null);

  // Pause when scrolled out of view
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause(); setPlaying(false);
      }
    }, { threshold: 0.25 });
    if (containerRef.current) io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setPlaying(true); }
    else { videoRef.current.pause(); setPlaying(false); }
  };

  const skip = (sec) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + sec));
    setJumpLabel(sec > 0 ? `+${sec}s` : `${sec}s`);
    setTimeout(() => setJumpLabel(null), 600);
  };

  const seekTo = (e) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (videoRef.current) videoRef.current.currentTime = pct * duration;
  };

  const onTimeUpdate = () => {
    const v = videoRef.current; if (!v) return;
    setCurrentTime(v.currentTime);
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
    if (v.buffered.length > 0) setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
  };

  const onLoadedMetadata = () => { if (videoRef.current) setDuration(videoRef.current.duration); };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted; setMuted(!muted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { containerRef.current?.requestFullscreen(); setFullscreen(true); }
    else { document.exitFullscreen(); setFullscreen(false); }
  };

  return (
    <div ref={containerRef} className="w-full bg-black overflow-hidden" style={{ borderRadius: "1rem" }}>
      {/* Video */}
      <div className="relative cursor-pointer" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={src}
          style={{ width: "100%", maxHeight: "60vh", objectFit: "contain", display: "block", background: "#000" }}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={() => setPlaying(false)}
          playsInline preload="metadata"
        />
        {/* Jump hint */}
        <AnimatePresence>
          {jumpLabel && (
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/55 backdrop-blur-sm text-white text-sm font-black px-4 py-2 rounded-xl border border-white/10">
                {jumpLabel}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Center play/pause tap indicator */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur border border-white/15 flex items-center justify-center">
              <FaPlay className="text-white text-base ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Controls bar — below video, not on top */}
      <div className="px-4 pt-2.5 pb-3 bg-[#0a0a0a] border-t border-white/6">
        {/* Progress track */}
        <div ref={trackRef} className="relative h-1 bg-white/10 rounded-full cursor-pointer mb-2.5 group" onClick={seekTo}>
          <div className="absolute inset-y-0 left-0 bg-white/20 rounded-full" style={{ width: `${buffered}%` }} />
          <div className="absolute inset-y-0 left-0 bg-white rounded-full" style={{ width: `${progress}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${progress}%` }} />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Skip back */}
            <button onClick={() => skip(-2)} className="text-white/40 hover:text-white transition-colors">
              <FaBackward className="text-xs" />
            </button>
            {/* Play/pause */}
            <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
              {playing ? <FaPause className="text-sm" /> : <FaPlay className="text-sm ml-0.5" />}
            </button>
            {/* Skip forward */}
            <button onClick={() => skip(2)} className="text-white/40 hover:text-white transition-colors">
              <FaForward className="text-xs" />
            </button>
            {/* Time */}
            <span className="text-white/30 text-[10px] font-mono tabular-nums">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mute */}
            <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors">
              {muted || volume === 0 ? <FaVolumeMute className="text-xs" /> : <FaVolumeUp className="text-xs" />}
            </button>
            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white/40 hover:text-white transition-colors">
              {fullscreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Lightbox ─────────────────────────────────────────────────────────────────
const Lightbox = ({ items, startIndex, onClose }) => {
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent(c => (c + 1) % items.length);
      if (e.key === "ArrowLeft")  setCurrent(c => (c - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [items.length, onClose]);

  const item = items[current];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/96 backdrop-blur-2xl flex items-center justify-center"
      onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-xl bg-white/6 border border-white/10 text-white/50 hover:text-white transition-all">
        <HiOutlineXMark className="text-base" />
      </button>
      <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/20 text-[10px] font-bold uppercase tracking-widest">
        {current + 1} / {items.length}
      </span>
      <div className="relative w-full max-w-4xl max-h-[85vh] flex items-center justify-center px-14" onClick={e => e.stopPropagation()}>
        {item.type === "video" ? (
          <video key={current} src={item.url} autoPlay controls style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 12 }} />
        ) : (
          <img src={item.url} alt="" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 12, objectFit: "contain" }} />
        )}
      </div>
      {items.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); setCurrent(c => (c - 1 + items.length) % items.length); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl bg-white/6 border border-white/10 text-white/50 hover:text-white transition-all">
            <HiChevronLeft className="text-base" />
          </button>
          <button onClick={e => { e.stopPropagation(); setCurrent(c => (c + 1) % items.length); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl bg-white/6 border border-white/10 text-white/50 hover:text-white transition-all">
            <HiChevronRight className="text-base" />
          </button>
        </>
      )}
      {items.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {items.map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setCurrent(i); }}
              style={{ width: i === current ? 18 : 5, height: 4, borderRadius: 99, background: i === current ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)", transition: "all 0.2s" }} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ─── Gallery Strip ────────────────────────────────────────────────────────────
const GalleryStrip = ({ items }) => {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  if (!items?.length) return null;

  return (
    <>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">
          Gallery · {items.length} item{items.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {items.map((item, i) => (
            <button key={i} onClick={() => setLightboxIdx(i)}
              className="relative flex-shrink-0 rounded-xl overflow-hidden bg-[#111] border border-white/8 hover:border-white/20 transition-all"
              style={{ width: 120, height: 76 }}>
              {item.type === "video" ? (
                <>
                  <video src={item.url} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onMouseEnter={e => e.target.play()} onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <div className="w-6 h-6 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
                      <FaPlay className="text-white text-[8px] ml-0.5" />
                    </div>
                  </div>
                </>
              ) : (
                <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {lightboxIdx !== null && <Lightbox items={items} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      </AnimatePresence>
    </>
  );
};

// ─── Row item for sidebar details ─────────────────────────────────────────────
const DetailRow = ({ label, value, color = "text-white/60" }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
    <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">{label}</span>
    <span className={`text-xs font-semibold ${color}`}>{value}</span>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const AdDetailsPage = () => {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { backendURL } = useAppContext();

  const [ad,      setAd]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked,   setLiked]   = useState(false);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${backendURL}/api/ads/${id}`);
        if (res.data.success && res.data.ad) {
          const a = res.data.ad;
          const gallery = (a.galleryImages || [])
            .map(repairUrl).filter(Boolean)
            .map(url => ({ url, type: /\.(mp4|mov|m4v|webm)$/i.test(url) ? "video" : "image" }));

          setAd({
            _id:             a._id,
            title:           a.title,
            tagline:         a.tagline || "",
            description:     a.description || a.tagline || "",
            longDescription: a.longDescription || "",
            mediaUrl:        repairUrl(a.mediaUrl),
            mediaType:       a.mediaType,
            badge:           a.badge || "SPONSOR",
            ctaText:         a.ctaText || "Visit Now",
            companyName:     a.companyName || "",
            advertiserName:  a.advertiserName || "",
            advertiserEmail: a.advertiserEmail || "",
            advertiserPhone: a.advertiserPhone || "",
            priority:        a.priority || "medium",
            startDate:       a.startDate,
            endDate:         a.endDate,
            displayLocations: a.displayLocations || [],
            gallery,
            websiteUrl:   a.websiteUrl   || null,
            instagramUrl: a.instagramUrl || null,
            facebookUrl:  a.facebookUrl  || null,
            youtubeUrl:   a.youtubeUrl   || null,
            otherUrl:     a.otherUrl     || null,
            views:        a.views        || null,
            clicks:       a.clicks       || null,
            // From backend later:
            businessCategory: a.businessCategory || null,
            establishedYear:  a.establishedYear  || null,
            teamSize:         a.teamSize         || null,
            location:         a.location         || null,
            highlights:       a.highlights       || [],
            rating:           a.rating           || null,
            reviewCount:      a.reviewCount       || null,
          });

          axios.post(`${backendURL}/api/ads/${a._id}/view`, { location: "ad_details" }).catch(() => {});
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    window.scrollTo(0, 0);
  }, [id, backendURL]);

  const handleCTA = () => {
    if (!ad) return;
    axios.post(`${backendURL}/api/ads/${ad._id}/click`).catch(() => {});
    const url = ad.websiteUrl || ad.instagramUrl || ad.otherUrl;
    if (url) window.open(url, "_blank");
  };

  const handleShare = () => {
    if (navigator.share) { navigator.share({ title: ad?.title, url: window.location.href }).catch(() => {}); return; }
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
          className="w-7 h-7 rounded-full border-2 border-white border-t-transparent" />
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">Loading</p>
      </div>
    </div>
  );

  if (!ad) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white/30">
      <p className="text-sm font-semibold">Ad not found</p>
      <button onClick={() => navigate(-1)} className="text-xs text-white/40 hover:text-white underline transition-colors">Go back</button>
    </div>
  );

  const hasLongDesc   = ad.longDescription?.trim().length > 0;
  const hasGallery    = ad.gallery?.length > 0;
  const hasHighlights = ad.highlights?.length > 0;
  const expiryText    = ad.endDate ? new Date(ad.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No expiry";

  const socialLinks = [
    { label: "Website",   icon: FaGlobe,     href: ad.websiteUrl,   cls: "hover:border-white/25 hover:text-white" },
    { label: "Instagram", icon: FaInstagram, href: ad.instagramUrl, cls: "hover:border-[#E1306C]/40 hover:text-[#E1306C]" },
    { label: "Facebook",  icon: FaFacebook,  href: ad.facebookUrl,  cls: "hover:border-[#1877F2]/40 hover:text-[#1877F2]" },
    { label: "YouTube",   icon: FaYoutube,   href: ad.youtubeUrl,   cls: "hover:border-[#FF0000]/40 hover:text-[#FF0000]" },
    { label: "More Info", icon: HiOutlineArrowTopRightOnSquare, href: ad.otherUrl, cls: "hover:border-white/25 hover:text-white" },
  ].filter(l => l.href);

  const priorityColor = { urgent: "text-red-400", high: "text-orange-400", medium: "text-amber-400", low: "text-white/30" }[ad.priority] || "text-white/30";

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>

      {/* ── NAV ── */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-3" style={{ height: 52 }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-white/35 hover:text-white transition-colors text-sm font-medium">
            <HiArrowLeft className="text-sm" /> Back
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/8 border border-amber-500/15">
            <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400/70">Sponsored</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setLiked(l => !l)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all text-xs ${liked ? "bg-white/5 border-white/15 text-white" : "bg-transparent border-white/8 text-white/25 hover:text-white/60 hover:border-white/15"}`}>
              <HiOutlineHeart />
            </button>
            <button onClick={handleShare}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/8 text-white/25 hover:text-white/60 hover:border-white/15 transition-all text-xs">
              {copied ? <HiOutlineCheckBadge className="text-white/50" /> : <HiOutlineShare />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        <div className="space-y-4">

          {/* ── MEDIA ── */}
          <div className="rounded-2xl overflow-hidden border border-white/8">
            {ad.mediaType === "video"
              ? <VideoPlayer src={ad.mediaUrl} />
              : (
                <div className="bg-black">
                  <img src={ad.mediaUrl} alt={ad.title}
                    style={{ width: "100%", maxHeight: "60vh", objectFit: "contain", display: "block", background: "#000" }} />
                </div>
              )
            }
          </div>

          {/* ── GALLERY ── */}
          {hasGallery && <GalleryStrip items={ad.gallery} />}

          {/* ── MAIN GRID ── */}
          <div className="grid lg:grid-cols-[1fr_280px] gap-4">

            {/* LEFT */}
            <div className="space-y-3">

              {/* Title block */}
              <div className="rounded-2xl bg-[#111] border border-white/8 p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-[9px] font-black uppercase tracking-widest text-white/40">
                      {ad.badge}
                    </span>
                    {ad.businessCategory && (
                      <span className="px-2 py-0.5 rounded-md bg-white/4 border border-white/6 text-[9px] font-semibold text-white/30">
                        {ad.businessCategory}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-white/25 flex-shrink-0">
                    <HiOutlineCheckBadge className="text-xs" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Verified</span>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mb-2">{ad.title}</h1>

                {ad.tagline && ad.tagline !== ad.description && (
                  <p className="text-white/35 text-sm italic mb-2">"{ad.tagline}"</p>
                )}

                {ad.description && (
                  <p className="text-white/40 text-sm leading-relaxed">{ad.description}</p>
                )}

                {/* Stats */}
                {(ad.views || ad.clicks || ad.rating) && (
                  <div className="flex items-center gap-5 mt-4 pt-4 border-t border-white/6">
                    {ad.views && (
                      <div>
                        <p className="text-sm font-black text-white">{ad.views.toLocaleString()}</p>
                        <p className="text-[9px] text-white/25 uppercase tracking-wider">Views</p>
                      </div>
                    )}
                    {ad.clicks && (
                      <div>
                        <p className="text-sm font-black text-white">{ad.clicks.toLocaleString()}</p>
                        <p className="text-[9px] text-white/25 uppercase tracking-wider">Clicks</p>
                      </div>
                    )}
                    {ad.rating && (
                      <div>
                        <p className="text-sm font-black text-white">{ad.rating} ★ {ad.reviewCount ? `(${ad.reviewCount})` : ""}</p>
                        <p className="text-[9px] text-white/25 uppercase tracking-wider">Rating</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Highlights */}
              {hasHighlights && (
                <div className="rounded-2xl bg-[#111] border border-white/8 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Highlights</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ad.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/3 border border-white/6">
                        <HiOutlineCheckCircle className="text-white/25 text-sm flex-shrink-0" />
                        <span className="text-xs text-white/50 font-medium">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Long description */}
              {hasLongDesc && (
                <div className="rounded-2xl bg-[#111] border border-white/8 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">About</p>
                  <div className="text-white/40 text-sm leading-[1.85] whitespace-pre-line">{ad.longDescription}</div>
                </div>
              )}

              {/* Social links */}
              {socialLinks.length > 0 && (
                <div className="rounded-2xl bg-[#111] border border-white/8 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Links</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {socialLinks.map(({ label, icon: Icon, href, cls }) => (
                      <a key={label} href={href} target="_blank" rel="noreferrer"
                        onClick={() => axios.post(`${backendURL}/api/ads/${ad._id}/click`).catch(() => {})}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/3 border border-white/8 text-white/40 text-xs font-semibold transition-all group ${cls}`}>
                        <div className="flex items-center gap-2.5">
                          <Icon className="text-sm" /> {label}
                        </div>
                        <HiOutlineArrowTopRightOnSquare className="text-xs opacity-40 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Advertise CTA */}
              <div className="rounded-2xl bg-[#111] border border-white/8 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <HiOutlineRocketLaunch className="text-white/35 text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white mb-1">Advertise on SuviX</p>
                    <p className="text-xs text-white/30 leading-relaxed mb-3">Reach 10,000+ video creators, editors, and clients. Transparent pricing, no hidden fees.</p>
                    <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-white/6">
                      {[{ v: "10K+", l: "Creators" }, { v: "50K+", l: "Impressions" }, { v: "₹499", l: "Starting" }].map(({ v, l }) => (
                        <div key={l}>
                          <p className="text-sm font-black text-white">{v}</p>
                          <p className="text-[9px] text-white/25 uppercase tracking-wider">{l}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => navigate("/advertise")}
                      className="flex items-center gap-1.5 text-xs font-black text-white/40 hover:text-white transition-colors">
                      Request Ad Placement <HiOutlineArrowRight className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-3">

              {/* CTA */}
              <button onClick={handleCTA}
                className="w-full py-3 rounded-xl font-black text-sm text-black bg-white hover:bg-white/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                {ad.ctaText} <FaChevronRight className="text-xs" />
              </button>

              {/* Ad info */}
              <div className="rounded-2xl bg-[#111] border border-white/8 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-1">Ad Info</p>
                <div>
                  <DetailRow label="Priority" value={ad.priority?.charAt(0).toUpperCase() + ad.priority?.slice(1)} color={priorityColor} />
                  <DetailRow label="Expires" value={expiryText} />
                  {ad.displayLocations?.length > 0 && (
                    <DetailRow label="Placement" value={ad.displayLocations.map(l => l.replace("banners:", "").replace(/_/g, " ")).join(", ")} />
                  )}
                </div>
              </div>

              {/* Advertiser */}
              {(ad.advertiserName || ad.companyName) && (
                <div className="rounded-2xl bg-[#111] border border-white/8 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">Advertiser</p>
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/6">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm text-white/40 flex-shrink-0">
                      {(ad.advertiserName || ad.companyName).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white/80 truncate">{ad.advertiserName || ad.companyName}</p>
                      {ad.companyName && ad.advertiserName && (
                        <p className="text-xs text-white/30 truncate">{ad.companyName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    {ad.location         && <DetailRow label="Location" value={ad.location} />}
                    {ad.establishedYear  && <DetailRow label="Est."     value={ad.establishedYear} />}
                    {ad.teamSize         && <DetailRow label="Team"     value={ad.teamSize} />}
                    {ad.advertiserEmail  && <DetailRow label="Email"    value={ad.advertiserEmail} color="text-white/50" />}
                    {ad.advertiserPhone  && <DetailRow label="Phone"    value={ad.advertiserPhone} color="text-white/50" />}
                  </div>
                </div>
              )}

              {/* Trust signals */}
              <div className="rounded-2xl bg-[#111] border border-white/8 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">Why Trust This?</p>
                {[
                  "Verified advertiser on SuviX",
                  "Ad reviewed by our team",
                  "Real business, real product",
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-2 border-b border-white/5 last:border-0">
                    <HiOutlineCheckCircle className="text-white/20 text-xs flex-shrink-0" />
                    <span className="text-xs text-white/30">{t}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE STICKY CTA ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-2xl border-t border-white/6 px-4 py-3 flex gap-2.5">
        <button onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/35 flex-shrink-0">
          <HiArrowLeft className="text-sm" />
        </button>
        <button onClick={handleCTA}
          className="flex-1 h-11 rounded-xl font-black text-sm text-black bg-white hover:bg-white/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
          {ad.ctaText} <FaChevronRight className="text-xs" />
        </button>
      </div>

      <div className="lg:hidden h-20" />

      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { -webkit-tap-highlight-color: transparent; }
        input[type=range] { -webkit-appearance: none; height: 3px; border-radius: 99px; background: rgba(255,255,255,0.1); cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: white; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default AdDetailsPage;