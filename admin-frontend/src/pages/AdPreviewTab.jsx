import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineCloudArrowUp, HiOutlineArrowPath, HiOutlinePhoto, 
  HiOutlineVideoCamera, HiOutlineCheck, HiOutlineSparkles
} from "react-icons/hi2";
import { FaYoutube } from "react-icons/fa";

const AdPreviewTab = ({ API, authHeader, showToast }) => {
  const [previews, setPreviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState(null);

  const fetchPreviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/admin/ads/preview-media`, { headers: authHeader });
      setPreviews(data.previews);
    } catch (err) {
      showToast("Failed to load previews", "error");
    } finally {
      setLoading(false);
    }
  }, [API, authHeader, showToast]);

  useEffect(() => {
    fetchPreviews();
  }, [fetchPreviews]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("media", file);
    fd.append("type", type);

    setUploadingType(type);
    try {
      await axios.patch(`${API}/admin/ads/preview-media`, fd, {
        headers: { ...authHeader, "Content-Type": "multipart/form-data" }
      });
      showToast(`${type === 'homeAdBanner' ? 'Home Banner' : 'Reel Ad'} updated successfully`);
      fetchPreviews();
    } catch (err) {
      showToast(err.response?.data?.message || "Upload failed", "error");
    } finally {
      setUploadingType(null);
      e.target.value = "";
    }
  };

  // ─── Shared Styles ────────────────────────────────────────────────────────
  const glassStyle = {
    background: "rgba(255, 255, 255, 0.02)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  };

  const premiumCard = {
    background: "#050505",
    border: "1px solid #111111",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <HiOutlineArrowPath className="text-4xl text-white/20" />
      </motion.div>
      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] animate-pulse">
        Synchronising Media Assets
      </span>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto py-8 space-y-16"
    >
      {/* Premium Header */}
      <header className="flex items-end justify-between border-b border-white/5 pb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest text-white/60">Core Engine</span>
            </div>
            <HiOutlineSparkles className="text-white/20 text-sm" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Ad Preview Systems</h2>
          <p className="text-sm text-zinc-500 mt-2 font-medium max-w-md leading-relaxed">
            Configure the global demonstration media used across the ecosystem. 
            Changes propagate to all clients in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Production Environment</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Section 01: Home Banner */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <span className="text-2xl font-black text-white/10 tabular-nums">01</span>
               <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Home Banner Preview</span>
             </div>
             <label className="group relative cursor-pointer">
               <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFileUpload(e, "homeAdBanner")} disabled={!!uploadingType} />
               <motion.div 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-tight transition-all"
               >
                 {uploadingType === 'homeAdBanner' ? (
                   <HiOutlineArrowPath className="animate-spin text-sm" />
                 ) : (
                   <HiOutlineCloudArrowUp className="text-sm" />
                 )}
                 <span>{uploadingType === 'homeAdBanner' ? 'Uploading...' : 'Update Media'}</span>
               </motion.div>
             </label>
          </div>

          <div style={premiumCard} className="group/container relative">
            <div className="relative overflow-hidden" style={{ aspectRatio: "375/192" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={previews?.homeAdBanner?.url}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  {previews?.homeAdBanner?.resourceType === 'video' ? (
                    <video src={previews.homeAdBanner.url} autoPlay loop muted playsInline className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]" />
                  ) : (
                    <img src={previews?.homeAdBanner?.url} className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]" alt="Banner" />
                  )}
                </motion.div>
              </AnimatePresence>
              
              {/* Refined Overlay Mockup */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
              
              <div className="absolute bottom-0 left-0 p-6 w-full z-20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-[0.15em] bg-white/10 backdrop-blur-xl border border-white/20 text-white">SPONSORED CONTENT</span>
                </div>
                <h4 className="text-white text-xl font-black leading-none mb-2 tracking-tight">The Future of Creative Direction</h4>
                <p className="text-white/50 text-[11px] font-medium mb-5 max-w-[85%] leading-relaxed">Join the world's most elite editors and scale your agency today.</p>
                <div className="flex items-center gap-3">
                  <button className="px-5 py-2.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-wider">
                    Explore Now
                  </button>
                  <button className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                    Details
                  </button>
                </div>
              </div>

              {/* Resolution Data */}
              <div className="absolute top-4 right-4 z-30 opacity-0 group-hover/container:opacity-100 transition-all transform translate-y-2 group-hover/container:translate-y-0">
                <div style={glassStyle} className="px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">375 × 192 Standard</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-[#080808] border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">Desktop & Mobile Banner</p>
                <p className="text-[10px] text-zinc-600 mt-1 font-bold uppercase tracking-tight">Placement: Homepage Anchor</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[9px] font-black text-zinc-500 uppercase">Live Status</p>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Active Asset</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                  {previews?.homeAdBanner?.resourceType === 'video' ? <HiOutlineVideoCamera className="text-lg" /> : <HiOutlinePhoto className="text-lg" />}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 02: Reels Feed */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <span className="text-2xl font-black text-white/10 tabular-nums">02</span>
               <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Reels Feed Preview</span>
             </div>
             <label className="group relative cursor-pointer">
               <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFileUpload(e, "reelAd")} disabled={!!uploadingType} />
               <motion.div 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-tight transition-all"
               >
                 {uploadingType === 'reelAd' ? (
                   <HiOutlineArrowPath className="animate-spin text-sm" />
                 ) : (
                   <HiOutlineCloudArrowUp className="text-sm" />
                 )}
                 <span>{uploadingType === 'reelAd' ? 'Uploading...' : 'Update Media'}</span>
               </motion.div>
             </label>
          </div>

          <div style={premiumCard} className="relative group/reel overflow-hidden">
            <div className="flex items-center justify-center py-12 bg-[#080808] relative">
              {/* Ambient Background Blur */}
              <div className="absolute inset-0 opacity-20 blur-[100px] pointer-events-none scale-150">
                 {previews?.reelAd?.resourceType === 'video' ? (
                   <video src={previews.reelAd.url} muted />
                 ) : (
                   <img src={previews?.reelAd?.url} alt="" />
                 )}
              </div>

              {/* High-End Mobile Mockup */}
              <div className="relative rounded-[3rem] p-2 border-[1px] border-white/10 bg-black shadow-[0_0_80px_rgba(0,0,0,0.8)] z-10">
                <div className="relative rounded-[2.8rem] overflow-hidden border border-white/5 bg-black" style={{ width: 180, height: 320 }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={previews?.reelAd?.url}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      {previews?.reelAd?.resourceType === 'video' ? (
                        <video src={previews.reelAd.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={previews?.reelAd?.url} className="w-full h-full object-cover" alt="Reel" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Mockup UI Elements */}
                  <div className="absolute top-5 left-4 bg-black/50 backdrop-blur-xl border border-white/20 rounded-full px-2.5 py-1 z-20">
                    <span className="text-[7px] font-black uppercase text-white tracking-[0.2em]">SPONSORED</span>
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10" />
                  
                  <div className="absolute bottom-6 left-5 right-5 z-20">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-md" />
                       <span className="text-white text-[10px] font-black tracking-tight">CineVibe Global</span>
                    </div>
                    <p className="text-white/60 text-[9px] font-medium mb-4 leading-tight">Elevate your video production with our premium LUTs & Assets.</p>
                    <button className="w-full py-2 rounded-lg bg-white text-black text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      <FaYoutube className="text-zinc-400" /> Subscribe
                    </button>
                  </div>

                  {/* Camera island mockup */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-4 rounded-full bg-[#111] z-30" />
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-[#080808] border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">Vertical Content Stream</p>
                <p className="text-[10px] text-zinc-600 mt-1 font-bold uppercase tracking-tight">Placement: Reels Feed</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                {previews?.reelAd?.resourceType === 'video' ? <HiOutlineVideoCamera className="text-lg" /> : <HiOutlinePhoto className="text-lg" />}
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer System Status */}
      <footer style={premiumCard} className="p-8 flex items-start gap-8 relative overflow-hidden group border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex shrink-0 items-center justify-center text-white">
           <HiOutlineCheck className="text-2xl" />
        </div>
        <div className="relative z-10">
          <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] leading-none mb-4">Infrastructure Integrity</h4>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-3xl font-medium">
            Media assets are handled via <span className="text-white font-bold">Atomic Transactions</span>. 
            When a replacement is initiated, the legacy Cloudinary bucket is purged and the new CDN node 
            is primed for low-latency global delivery. Client-side state is synchronised via our secure 
            Websocket mesh.
          </p>
        </div>
      </footer>
    </motion.div>
  );
};

export default AdPreviewTab;
