/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Edit3, Check, Upload, Sparkles } from 'lucide-react';
import { updateUser } from '../../../../../store/slices/authSlice';
import { api } from '../../../../../api/client';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatorCoverBannerProps {
  user: any;
}

export const CreatorCoverBanner: React.FC<CreatorCoverBannerProps> = ({ user }) => {
  const dispatch = useDispatch();
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const selectedBanner = user?.coverBanner || null;
  const youtubeProfiles = user?.youtubeProfile || [];
  
  const availableBanners = youtubeProfiles
    .filter((p: any) => p.banner_url)
    .map((p: any) => ({ id: p.channelId || p.channel_name, name: p.channel_name, url: p.banner_url || '' }));

  const handleBannerSelect = async (bannerUrl: string | null) => {
    const previousBanner = user?.coverBanner || null;
    try {
      dispatch(updateUser({ coverBanner: bannerUrl }));
      setShowBannerModal(false);
      await api.put('/user/me/cover-banner', { bannerUrl });
    } catch (err) {
      console.error('Failed to update cover banner:', err);
      dispatch(updateUser({ coverBanner: previousBanner }));
    }
  };

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('coverBanner', file);
      const res = await api.post('/user/me/cover-banner-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.coverBanner) {
        dispatch(updateUser({ coverBanner: res.data.coverBanner }));
        setShowBannerModal(false);
      }
    } catch (err) {
      console.error('Upload failed, using local preview:', err);
      const localUrl = URL.createObjectURL(file);
      dispatch(updateUser({ coverBanner: localUrl }));
      setShowBannerModal(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative w-full h-44 sm:h-48 lg:h-52 rounded-2xl overflow-hidden shadow-xs select-none group border border-zinc-250/70 dark:border-zinc-800">
      {/* ── Background Image or Exact Reference Graphic ── */}
      {selectedBanner ? (
        <img
          src={selectedBanner}
          alt="Cover Banner"
          className="w-full h-full object-cover object-center"
        />
      ) : (
        /* The Exact Reference Silhouette & Typography Banner */
        <div className="relative w-full h-full bg-[#0a0a0c] overflow-hidden flex items-center justify-between px-6 sm:px-10 lg:px-12 text-white">
          {/* Subtle City Skyline & Moody Gradients */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity filter contrast-125"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=1600')`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent z-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-0" />

          {/* Left Hero Typography */}
          <div className="relative z-10 flex flex-col justify-center max-w-sm">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-[1.08] text-white">
              Create
              <br />
              Collaborate
              <br />
              Grow
            </h1>

            {/* Accent Line & Subline */}
            <div className="flex items-center gap-2.5 mt-2.5 pt-0.5">
              <div className="h-[2px] w-9 bg-white/40 rounded-full" />
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <div className="h-[2px] w-6 bg-white/20 rounded-full" />
              <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-[0.2em] text-zinc-300">
                Ideas · People · Opportunities
              </span>
            </div>
          </div>

          {/* Center / Right Hoodie Silhouette Graphic & Quotes */}
          <div className="hidden md:flex items-center gap-5 relative z-10 mr-6 lg:mr-10">
            {/* Creator Hoodie Artwork */}
            <div className="relative flex flex-col items-center">
              <div className="w-32 sm:w-36 aspect-[3/4] relative overflow-hidden rounded-xl flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=500"
                  alt="Creator silhouette"
                  className="w-full h-full object-cover opacity-85 filter grayscale contrast-125"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                
                {/* Back of Hoodie Tagline */}
                <div className="absolute bottom-4 inset-x-2 text-center">
                  <p className="text-[9.5px] sm:text-[10.5px] font-bold leading-tight tracking-wide text-zinc-200 drop-shadow-md">
                    Better Creators
                    <br />
                    A Brighter Tomorrow.
                  </p>
                </div>
              </div>
            </div>

            {/* Handwritten / Cursive Quote */}
            <div className="hidden lg:block max-w-[120px] text-right">
              <p className="font-serif italic text-xs sm:text-[13px] text-zinc-300/90 leading-tight">
                Same People
                <br />
                Bigger Possibilities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Right: Edit Cover Button (Matches Reference) ── */}
      <div className="absolute top-3 right-3 z-20">
        <button
          type="button"
          onClick={() => setShowBannerModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Edit3 size={11} strokeWidth={2.2} />
          <span>Edit Cover</span>
        </button>
      </div>

      {/* ── Cover Picker Modal ── */}
      <AnimatePresence>
        {showBannerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-purple-500" />
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Choose Cover Banner</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Upload Custom File */}
              <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-purple-500 transition-colors">
                <Upload size={18} className="text-zinc-400 mb-1" />
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {isUploading ? 'Uploading...' : 'Upload Custom Image'}
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Recommended 1600x400 (4:1 ratio)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              {/* Preset / Default SuviX Artwork */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Presets</p>
                <button
                  type="button"
                  onClick={() => handleBannerSelect(null)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                    !selectedBanner 
                      ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20' 
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-7 rounded-lg bg-black flex items-center justify-center text-[9px] text-white font-bold">
                      SuviX
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">SuviX Original Artwork</p>
                      <p className="text-[10px] text-zinc-400">Create · Collaborate · Grow</p>
                    </div>
                  </div>
                  {!selectedBanner && <Check size={14} className="text-purple-600" />}
                </button>

                {availableBanners.map((b: any) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleBannerSelect(b.url)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                      selectedBanner === b.url 
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20' 
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={b.url} alt={b.name} className="w-9 h-7 rounded-lg object-cover" />
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[180px]">{b.name}</p>
                        <p className="text-[10px] text-zinc-400">Synced Channel Banner</p>
                      </div>
                    </div>
                    {selectedBanner === b.url && <Check size={14} className="text-purple-600" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
