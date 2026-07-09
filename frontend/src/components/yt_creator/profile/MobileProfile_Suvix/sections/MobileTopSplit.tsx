import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Image as ImageIcon, Check } from 'lucide-react';
import { updateUser } from '../../../../../store/slices/authSlice';
import { api } from '../../../../../api/client';
import { motion, AnimatePresence } from 'framer-motion';

const formatCount = (num?: number | string) => {
  if (!num) return '0';
  const n = Number(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

export const MobileTopSplit = ({ user }: { user: any }) => {
  const dispatch = useDispatch();
  const [showBannerMenu, setShowBannerMenu] = useState(false);

  const selectedBanner = user?.coverBanner || null;
  const youtubeProfiles = user?.youtubeProfile || [];
  const totalVideos = youtubeProfiles.reduce((acc: number, p: any) => acc + (p.video_count || 0), 0);
  
  const availableBanners = youtubeProfiles
    .filter((p: any) => p.banner_url)
    .map((p: any) => ({ id: p.channelId || p.channel_name, name: p.channel_name, url: p.banner_url || '' }));

  const handleBannerChange = async (bannerUrl: string | null) => {
    const previousBanner = user?.coverBanner || null;
    try {
      dispatch(updateUser({ coverBanner: bannerUrl }));
      await api.put('/user/me/cover-banner', { bannerUrl });
    } catch (err) {
      console.error('Failed to update cover banner:', err);
      dispatch(updateUser({ coverBanner: previousBanner }));
    }
  };

  return (
    <div className="flex w-full bg-card pt-2 pr-2">
      {/* Left: Banner (50%) */}
      <div className="w-[55%] relative">
        <div 
          className="relative w-full aspect-[5/3] rounded-r-[24px] overflow-hidden"
          onClick={() => setShowBannerMenu(!showBannerMenu)}
        >
          {selectedBanner ? (
            <img src={selectedBanner} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[#121212] flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay grayscale" />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
            </div>
          )}

          <div className="absolute top-2 right-2 z-20">
            <button className="bg-card/90 backdrop-blur-md text-text-main text-[10px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-border-main">
              <ImageIcon size={10} />
              Edit Cover
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showBannerMenu && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-10 left-2 w-48 bg-card border border-border-main rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 z-[999]"
            >
              <div className="px-3 py-1.5 border-b border-border-secondary flex items-center justify-between mb-1">
                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Select Cover</span>
              </div>
              <button 
                onClick={() => { handleBannerChange(null); setShowBannerMenu(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-left ${!selectedBanner ? 'bg-page text-text-main' : 'text-text-muted'}`}
              >
                <div className="w-6 h-6 rounded bg-zinc-900 shrink-0" />
                <span className="text-[10px] font-bold flex-1">Default</span>
                {!selectedBanner && <Check size={10} className="text-[#FF3040]" />}
              </button>
              {availableBanners.map((b: any) => (
                <button 
                  key={b.id}
                  onClick={() => { handleBannerChange(b.url); setShowBannerMenu(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-left ${selectedBanner === b.url ? 'bg-page text-text-main' : 'text-text-muted'}`}
                >
                  <img src={b.url} alt={b.name} className="w-6 h-6 rounded object-cover shrink-0" />
                  <span className="text-[10px] font-bold flex-1 line-clamp-1">{b.name}</span>
                  {selectedBanner === b.url && <Check size={10} className="text-[#FF3040]" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Stats (45%) */}
      <div className="w-[45%] flex flex-col justify-center items-center py-2 bg-card">
        <div className="grid grid-cols-2 gap-y-4 gap-x-2 w-full px-2">
          {/* Top Row: Followers, Following */}
          <div className="flex flex-col items-center">
            <span className="text-lg font-semibold text-text-main leading-none">{formatCount(user?.followers)}</span>
            <span className="text-[8px] font-medium text-text-muted uppercase tracking-widest mt-1">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-semibold text-text-main leading-none">{formatCount(user?.following)}</span>
            <span className="text-[8px] font-medium text-text-muted uppercase tracking-widest mt-1">Following</span>
          </div>
          
          {/* Bottom Row: Posts */}
          <div className="col-span-2 flex flex-col items-center mt-2">
            <span className="text-lg font-semibold text-text-main leading-none">{formatCount(totalVideos)}</span>
            <span className="text-[8px] font-medium text-text-muted uppercase tracking-widest mt-1">Posts</span>
          </div>
        </div>
      </div>
    </div>
  );
};
