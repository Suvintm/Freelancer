/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Image as ImageIcon, Check } from 'lucide-react';
import { updateUser } from '../../../../../store/slices/authSlice';
import { api } from '../../../../../api/client';
import { motion, AnimatePresence } from 'framer-motion';

interface BannerProps {
  user: any;
}

export const Banner = ({ user }: BannerProps) => {
  const dispatch = useDispatch();
  const [showBannerMenu, setShowBannerMenu] = useState(false);

  const selectedBanner = user?.coverBanner || null;
  const youtubeProfiles = user?.youtubeProfile || [];
  
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
    <div 
      className="relative w-full aspect-[7/2] xl:aspect-[3/1] rounded-[24px]"
      onMouseLeave={() => setShowBannerMenu(false)}
    >
      {/* Banner Image */}
      {selectedBanner ? (
        <img 
          src={selectedBanner}
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover rounded-[24px]"
        />
      ) : (
        <div className="absolute inset-0 bg-[#121212] rounded-[24px] flex items-center justify-center overflow-hidden">
           <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay grayscale" />
           <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
        </div>
      )}

      {/* Edit Cover Overlay & Button - Solid and Clean */}
      {availableBanners.length > 0 && (
        <div className="absolute top-6 right-6 flex flex-col items-end z-20">
          <button 
            onClick={() => setShowBannerMenu(!showBannerMenu)}
            className="bg-card text-text-main text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-sm hover:bg-container transition-colors"
          >
            <ImageIcon size={14} />
            Edit Cover
          </button>

          <AnimatePresence>
            {showBannerMenu && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-2 w-52 bg-card border border-border-main rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 absolute top-full right-0 z-[999]"
              >
                <div className="px-3 py-1.5 border-b border-border-secondary flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Select Cover</span>
                </div>

                <button 
                  onClick={() => { handleBannerChange(null); setShowBannerMenu(false); }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left ${!selectedBanner ? 'bg-page text-text-main' : 'text-text-muted hover:text-text-main hover:bg-page'}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 flex-shrink-0" />
                  <span className="text-xs font-bold flex-1">Default SuviX</span>
                  {!selectedBanner && <Check size={12} className="text-[#FF3040] flex-shrink-0" />}
                </button>
                
                {availableBanners.map((b: any) => (
                  <button 
                    key={b.id}
                    onClick={() => { handleBannerChange(b.url); setShowBannerMenu(false); }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left ${selectedBanner === b.url ? 'bg-page text-text-main' : 'text-text-muted hover:text-text-main hover:bg-page'}`}
                  >
                    <img src={b.url} alt={b.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    <span className="text-xs font-bold flex-1 line-clamp-1">{b.name}</span>
                    {selectedBanner === b.url && <Check size={12} className="text-[#FF3040] flex-shrink-0" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
