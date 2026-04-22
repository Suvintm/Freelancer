// ExploreAdBanner.jsx - Compact horizontal ad banner for Explore page
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaGlobe, FaInstagram, FaAd } from "react-icons/fa";
import { HiArrowRight } from "react-icons/hi2";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

const ExploreAdBanner = () => {
  const { backendURL } = useAppContext();
  const [ad, setAd] = useState(null);
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/ads?location=explore_page`);
        const ads = res.data.ads || [];
        if (ads.length > 0) {
          // Pick a random ad from available ones
          setAd(ads[Math.floor(Math.random() * ads.length)]);
        }
      } catch {}
    };
    fetchAd();
  }, [backendURL]);

  useEffect(() => {
    if (ad?._id && !tracked) {
      axios.post(`${backendURL}/api/ads/${ad._id}/view`, { location: "explore_page" }).catch(() => {});
      setTracked(true);
    }
  }, [ad?._id]);

  const handleClick = () => {
    if (ad?._id) {
      axios.post(`${backendURL}/api/ads/${ad._id}/click`).catch(() => {});
    }
    const url = ad?.websiteUrl || ad?.instagramUrl;
    if (url) window.open(url, "_blank");
  };

  if (!ad) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full rounded-2xl overflow-hidden my-4 group cursor-pointer"
      onClick={handleClick}
    >
      {/* Background Media */}
      <div className="absolute inset-0">
        {ad.mediaType === "video" ? (
          <video src={ad.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        ) : (
          <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative flex items-center gap-4 px-5 py-4 md:py-5">
        {/* Ad Icon / Thumbnail */}
        {ad.thumbnailUrl && (
          <img
            src={ad.thumbnailUrl}
            alt=""
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-white/20"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-1.5 py-0.5 bg-amber-500/80 rounded text-[8px] font-black text-white uppercase tracking-wider flex items-center gap-1">
              <FaAd className="text-[8px]" /> {ad.badge || "SPONSORED"}
            </span>
            {ad.companyName && <span className="text-[10px] text-zinc-400 font-medium">{ad.companyName}</span>}
          </div>
          <h3 className="text-sm md:text-base font-black text-white leading-tight truncate">{ad.title}</h3>
          {ad.tagline && (
            <p className="text-[11px] text-zinc-400 truncate mt-0.5 hidden md:block">{ad.tagline}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {ad.websiteUrl && (
            <button className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-full text-xs font-bold hover:bg-zinc-200 transition-all">
              {ad.ctaText || "Visit"} <HiArrowRight className="text-xs" />
            </button>
          )}
          {ad.instagramUrl && !ad.websiteUrl && (
            <button
              onClick={(e) => { e.stopPropagation(); window.open(ad.instagramUrl, "_blank"); }}
              className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full text-white"
            >
              <FaInstagram className="text-sm" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ExploreAdBanner;
