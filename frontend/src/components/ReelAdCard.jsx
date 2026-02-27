// ReelAdCard.jsx - Instagram-style full-screen ad card for Reels feed
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiXMark, HiArrowTopRightOnSquare } from "react-icons/hi2";
import { FaInstagram, FaGlobe } from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

const ReelAdCard = ({ ad, onSkip }) => {
  const { backendURL } = useAppContext();
  const videoRef = useRef(null);
  const [canSkip, setCanSkip] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(3);
  const [viewed, setViewed] = useState(false);

  useEffect(() => {
    if (!viewed && ad?._id) {
      axios.post(`${backendURL}/api/ads/${ad._id}/view`, { location: "reels_feed" }).catch(() => {});
      setViewed(true);
    }
  }, [ad?._id]);

  useEffect(() => {
    if (skipCountdown <= 0) {
      setCanSkip(true);
      return;
    }
    const t = setTimeout(() => setSkipCountdown(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [skipCountdown]);

  const handleCTA = () => {
    if (ad?._id) {
      axios.post(`${backendURL}/api/ads/${ad._id}/click`).catch(() => {});
    }
    const url = ad.websiteUrl || ad.instagramUrl;
    if (url) window.open(url, "_blank");
  };

  if (!ad) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full bg-black overflow-hidden"
    >
      {/* Media */}
      {ad.mediaType === "video" ? (
        <video
          ref={videoRef}
          src={ad.mediaUrl}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay muted loop playsInline
        />
      ) : (
        <img src={ad.mediaUrl} alt={ad.title} className="absolute inset-0 w-full h-full object-cover" />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

      {/* SPONSORED badge */}
      <div className="absolute top-4 left-4 z-10">
        <span className="px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-md text-[10px] font-black text-white uppercase tracking-wider">
          {ad.badge || "SPONSORED"}
        </span>
      </div>

      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-10">
        {canSkip ? (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={onSkip}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-bold"
          >
            Skip <HiXMark className="text-sm" />
          </motion.button>
        ) : (
          <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white text-xs font-bold">
            Skip in {skipCountdown}s
          </div>
        )}
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 inset-x-0 p-6 z-10">
        {ad.companyName && (
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mb-1">{ad.companyName}</p>
        )}
        <h2 className="text-xl font-black text-white leading-tight mb-1">{ad.title}</h2>
        {ad.tagline && (
          <p className="text-sm text-zinc-300 mb-4 line-clamp-2">{ad.tagline}</p>
        )}

        <div className="flex items-center gap-3">
          {ad.websiteUrl && (
            <button
              onClick={handleCTA}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-zinc-200 transition-all"
            >
              <FaGlobe className="text-xs" />
              {ad.ctaText || "Learn More"}
            </button>
          )}
          {ad.instagramUrl && (
            <button
              onClick={() => {
                axios.post(`${backendURL}/api/ads/${ad._id}/click`).catch(() => {});
                window.open(ad.instagramUrl, "_blank");
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full font-bold text-sm"
            >
              <FaInstagram />
            </button>
          )}
          <button
            onClick={() => window.open(`/ad-details/${ad._id}`, "_blank")}
            className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white"
          >
            <HiArrowTopRightOnSquare className="text-sm" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReelAdCard;
