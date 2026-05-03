import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Loader2,
  ArrowRight,
  PlusCircle,
  Check,
  Users,
  Video,
  ChevronDown,
  TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { api } from '../api/client';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import { SuccessOverlay } from '../components/shared/SuccessOverlay';
import logo from '../assets/darklogo.png';
import ytIcon from '../assets/youtubeicon.png';

export default function YouTubeConnect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    tempSignupData, 
    setTempSignupData, 
    youtubeDiscovery, 
    addDiscoveredChannels, 
    toggleYoutubeChannelSelection, 
    setYoutubeChannelCategory,
    resetYoutubeDiscovery 
  } = useAuthStore();
  const { categories, isLoading: categoriesLoading } = useCategoryStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pickerExpandedFor, setPickerExpandedFor] = useState<string | null>(null);

  const categoryId = tempSignupData?.categoryId;
  const youtubeCategory = categories.find(c => c.slug === 'yt_influencer');
  const googleAccessToken = location.state?.googleAccessToken;
  const connected = youtubeDiscovery.channels.length > 0;

  const handleConnect = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
    window.location.href = `${apiUrl}/auth/google/youtube`;
  };

  const fetchChannels = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/youtube/channels', { accessToken: token });
      if (res.data.success) {
        addDiscoveredChannels(res.data.channels);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      console.error('Error connecting to YouTube:', error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  }, [addDiscoveredChannels]);

  useEffect(() => {
    if (!categoryId) {
      navigate('/role-selection');
      return;
    }

    if (!googleAccessToken && youtubeDiscovery.channels.length > 0) {
      resetYoutubeDiscovery();
    }

    if (googleAccessToken) {
      Promise.resolve().then(() => fetchChannels(googleAccessToken));
    }
  }, [googleAccessToken, categoryId, navigate, resetYoutubeDiscovery, youtubeDiscovery.channels.length, fetchChannels]);

  const allSelectedChannelsTagged = useMemo(() => {
    if (youtubeDiscovery.selectedChannelIds.length === 0) return false;
    return youtubeDiscovery.selectedChannelIds.every(id => !!youtubeDiscovery.categorizations[id]);
  }, [youtubeDiscovery.selectedChannelIds, youtubeDiscovery.categorizations]);

  const handleContinue = () => {
    if (youtubeDiscovery.selectedChannelIds.length === 0 || !allSelectedChannelsTagged) return;

    const youtubeChannels = youtubeDiscovery.selectedChannelIds.map(id => {
      const channel = youtubeDiscovery.channels.find(c => c.channelId === id);
      return {
        ...channel,
        subCategoryId: youtubeDiscovery.categorizations[id]
      };
    });

    setTempSignupData({ youtubeChannels });
    setIsLoading(true); // Re-use isLoading for transition
    setTimeout(() => {
      setIsLoading(false);
      navigate('/signup');
    }, 1800);
  };

  if (categoriesLoading) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Initializing Sync...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black flex flex-col relative overflow-x-hidden">
      {/* 🎬 Global Overlays */}
      <LoadingOverlay isVisible={isLoading} theme="youtube" message="Verifying..." />
      <SuccessOverlay isVisible={showSuccess} type="youtube" title="Linked" message="Identity synced successfully." />

      {/* 💎 Premium Header Layer (Compact Navigation) */}
      <div className="absolute top-0 inset-x-0 z-[100] p-4 md:p-8 lg:p-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <img src={logo} alt="SuviX" className="h-6 md:h-8 lg:h-10" />
        </div>
        <button 
          onClick={() => navigate('/role-selection')}
          className="w-8 h-8 md:w-11 md:h-11 rounded-lg border border-zinc-800 flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-auto group active:scale-95"
        >
          <ChevronLeft size={16} className="text-zinc-400 group-hover:text-white" />
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center p-4 pt-20 md:pt-24 relative">
        <div className="w-full max-w-[80rem] mx-auto relative z-10 flex flex-col items-center">
          {!connected ? (
            /* --- STATE 1: INITIAL DISCONNECTED (Compact Portal) --- */
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center w-full max-w-[48rem] py-4 md:py-8"
            >
              <div className="space-y-2 mb-6">
                <h1 className="text-[clamp(1.75rem,7vw,4rem)] font-bold text-white tracking-tight leading-[1.1]">
                  Connect your <br />
                  <span className="text-zinc-600">digital identity.</span>
                </h1>
                <p className="text-xs md:text-lg text-zinc-500 font-medium max-w-[24rem] mx-auto">
                  Synchronize your professional presence.
                </p>
              </div>

              <div className="w-full max-w-[20rem] space-y-4 mb-10">
                <Button 
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full h-12 md:h-16 !bg-red-600 !text-white rounded-xl font-bold text-sm md:text-lg flex items-center justify-center gap-2 border-none active:scale-[0.98] transition-transform"
                >
                  Sync with YouTube
                  <ArrowRight size={16} />
                </Button>
              </div>

              {/* 🎬 CREATOR MARQUEE (Elite Social Proof) */}
              <div className="w-full relative overflow-hidden mb-16 py-4">
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
                
                <motion.div 
                  className="flex gap-4 w-max px-4"
                  animate={{ x: [0, -1200] }}
                  transition={{ 
                    duration: 35, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                >
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                      {[
                        { name: "MrBeast", sub: "245M", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop" },
                        { name: "MKBHD", sub: "18.5M", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" },
                        { name: "Casey Neistat", sub: "12.6M", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop" },
                        { name: "Peter McKinnon", sub: "5.9M", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop" },
                        { name: "Ali Abdaal", sub: "5.2M", img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop" },
                        { name: "Lofi Girl", sub: "14.1M", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop" },
                        { name: "Veritasium", sub: "14.8M", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop" }
                      ].map((creator, idx) => (
                        <div 
                          key={idx}
                          className="relative flex flex-col items-center p-4 rounded-[1.5rem] bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-md group hover:border-zinc-700 transition-all duration-300 w-36"
                        >
                          {/* Profile Image */}
                          <div className="relative mb-3">
                            <img 
                              src={creator.img} 
                              alt="" 
                              className="w-16 h-16 rounded-full object-cover border-2 border-zinc-800 shadow-xl relative z-10 group-hover:scale-105 transition-transform duration-300" 
                            />
                            {/* Instagram-style Red Verified Badge (Smaller) */}
                            <div className="absolute -bottom-1 -right-1 z-20">
                              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-red-600 drop-shadow-[0_0_4px_rgba(220,38,38,0.4)]">
                                <path d="M22.5 12.5c0-1.58-.811-3.029-2.126-3.882l.144-1.618a2.5 2.5 0 00-2.483-2.722l-1.614.076a4.522 4.522 0 00-3.321-2.13L12.5 1.5l-.6-.05c-1.58 0-3.029.811-3.882 2.126l-1.618-.144a2.5 2.5 0 00-2.722 2.483l.076 1.614a4.522 4.522 0 00-2.13 3.321L1.5 11.5l-.05.6c0 1.58.811 3.029 2.126 3.882l-.144 1.618a2.5 2.5 0 002.483 2.722l1.614-.076a4.522 4.522 0 003.321 2.13L11.5 22.5l.6.05c1.58 0 3.029-.811 3.882-2.126l1.618.144a2.5 2.5 0 002.722-2.483l-.076-1.614a4.522 4.522 0 002.13-3.321L22.5 12.5l.05-.6z" />
                                <path d="M10.5 15.5l-3.5-3.5 1.414-1.414L10.5 12.672l5.586-5.586L17.5 8.5z" fill="white" />
                              </svg>
                            </div>
                          </div>
                          
                          <div className="text-center space-y-1 relative z-10 w-full">
                            <h4 className="text-sm font-bold text-white truncate font-display tracking-tight">{creator.name}</h4>
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest font-label bg-red-600/10 px-2 py-0.5 rounded-md">
                                {creator.sub}
                              </span>
                              <span className="text-[7px] font-semibold text-zinc-600 uppercase tracking-[0.2em] font-label">Verified Identity</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Benefits Hero Card (Compacted) */}
              <div className="w-full max-w-xl bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 text-left relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Video size={80} className="text-zinc-500" />
                </div>
                
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[9px] font-bold uppercase tracking-widest">
                    Creator Benefits
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight leading-tight">Unlock Your Creator Identity</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
                    Sync your channel to display verified metrics, gain access to exclusive brand deals, and boost your profile credibility.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
                    {[
                      { icon: <Users size={14} />, text: "Verified Stats" },
                      { icon: <TrendingUp size={14} />, text: "Engagement" },
                      { icon: <Check size={14} />, text: "Search Priority" },
                      { icon: <Video size={14} />, text: "Brand Verified" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-zinc-300 text-[10px] font-bold uppercase tracking-tight">
                        <div className="p-1 rounded-lg bg-white/5 border border-white/10 text-red-500">
                          {item.icon}
                        </div>
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* --- STATE 2: CONNECTED (Production-Grade Compact Grid) --- */
            <div className="w-full py-12 md:py-24 space-y-8 md:space-y-12">
              <div className="text-center space-y-2 md:space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Identity Discovery Active</span>
                </div>
                <h2 className="text-[clamp(1.75rem,5vw,3.5rem)] font-bold text-white tracking-tighter">Select Identities.</h2>
                <p className="text-zinc-500 text-[clamp(0.875rem,1.5vw,1.125rem)] font-medium max-w-[32rem] mx-auto">Link your professional YouTube presence to your SuviX workspace.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 w-full max-w-4xl mx-auto">
                {/* Add Account (Compact Horizontal Action) */}
                <button 
                  onClick={handleConnect}
                  className="group relative flex items-center justify-between p-5 md:p-6 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/30 transition-all active:scale-[0.99] overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PlusCircle size={20} className="text-zinc-500 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-bold text-sm md:text-base">Add another account</p>
                      <p className="text-zinc-600 text-[10px] md:text-xs">Link a new channel to your profile</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-zinc-800 group-hover:text-zinc-400 transition-colors" />
                </button>

                {youtubeDiscovery.channels.map((channel) => {
                  const isSelected = youtubeDiscovery.selectedChannelIds.includes(channel.channelId);
                  const activeSubCategoryId = youtubeDiscovery.categorizations[channel.channelId];
                  const activeSubCategoryName = youtubeCategory?.subCategories?.find(s => s.id === activeSubCategoryId)?.name;
                  const isPickerOpen = pickerExpandedFor === channel.channelId;
                  const isClaimed = channel.isClaimed;

                  return (
                    <motion.div
                      layout
                      key={channel.channelId}
                      className={`relative group rounded-2xl md:rounded-[2rem] border transition-all duration-300 ${
                        isSelected 
                          ? 'border-white bg-zinc-900 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-20' 
                          : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                      } ${isClaimed ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={() => !isClaimed && toggleYoutubeChannelSelection(channel.channelId)}
                    >
                      <div className="p-5 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5 flex-1 min-w-0">
                          <div className="relative flex-shrink-0">
                            <img src={channel.thumbnailUrl} alt="" className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl object-cover border border-zinc-800" />
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-xl border-4 border-zinc-900">
                                <Check size={14} strokeWidth={4} className="text-black" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-base md:text-lg font-bold text-white truncate tracking-tight">{channel.channelName}</h4>
                              {isClaimed && (
                                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Linked</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-zinc-500">
                              <div className="flex items-center gap-1.5">
                                <Users size={14} className="text-zinc-600" />
                                <span className="text-[11px] md:text-xs font-bold">{parseInt(String(channel.subscriberCount)).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Video size={14} className="text-zinc-600" />
                                <span className="text-[11px] md:text-xs font-bold">{channel.videoCount}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 md:w-64">
                          {isSelected ? (
                            <div className="w-full relative">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setPickerExpandedFor(isPickerOpen ? null : channel.channelId); }}
                                className={`w-full h-12 px-4 rounded-xl flex items-center justify-between transition-all border ${
                                  activeSubCategoryId 
                                    ? 'bg-zinc-800 border-zinc-700 text-white' 
                                    : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                }`}
                              >
                                <span className="text-xs font-bold truncate">
                                  {activeSubCategoryName || 'Assign Specialty'}
                                </span>
                                <ChevronDown size={16} className={`transition-transform duration-300 ${isPickerOpen ? 'rotate-180' : ''}`} />
                              </button>

                              <AnimatePresence>
                                {isPickerOpen && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute bottom-full mb-3 left-0 right-0 z-[100] bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl overflow-hidden grid grid-cols-2 gap-1.5 backdrop-blur-xl"
                                  >
                                    {youtubeCategory?.subCategories?.map((sub) => (
                                      <button
                                        key={sub.id}
                                        onClick={(e) => { e.stopPropagation(); setYoutubeChannelCategory(channel.channelId, sub.id); setPickerExpandedFor(null); }}
                                        className={`px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all text-center ${
                                          activeSubCategoryId === sub.id 
                                            ? 'bg-white border-white text-black' 
                                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'
                                        }`}
                                      >
                                        {sub.name}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ) : (
                            <div className="hidden md:flex items-center justify-end w-full pr-2">
                              <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight size={14} className="text-zinc-600" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- STICKY ACTION BAR (Production-Level HUD) --- */}
      {connected && (
        <div className="fixed bottom-6 inset-x-4 md:bottom-10 z-[100] flex justify-center pointer-events-none">
          <div className="w-full max-w-[42rem] bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800 p-3 md:p-4 rounded-[2rem] flex items-center justify-between gap-6 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4 pl-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <div className={`w-2.5 h-2.5 rounded-full ${youtubeDiscovery.selectedChannelIds.length > 0 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-zinc-700'}`} />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">Status</p>
                <p className="text-sm font-bold text-white leading-none">
                  {youtubeDiscovery.selectedChannelIds.length} Selected
                </p>
              </div>
            </div>

            <Button 
              size="lg" 
              disabled={youtubeDiscovery.selectedChannelIds.length === 0 || !allSelectedChannelsTagged}
              onClick={handleContinue}
              className={`h-12 md:h-14 px-8 md:px-10 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 border-none ${
                allSelectedChannelsTagged 
                  ? 'bg-white text-black hover:opacity-90 active:scale-[0.98]' 
                  : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {allSelectedChannelsTagged ? 'Confirm Selection' : 'Assign Speciality'}
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
