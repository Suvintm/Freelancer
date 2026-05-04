import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Loader2,
  ArrowRight,
  Plus,
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

    const youtubeCategory = categories.find(c => c.slug === 'yt_influencer');

    // Build channel payload matching mobile's SelectedYouTubeChannelPayload exactly
    const youtubeChannels = youtubeDiscovery.selectedChannelIds
      .map((id, index) => {
        const channel = youtubeDiscovery.channels.find(c => c.channelId === id);
        if (!channel) return null;
        const subCategoryId = youtubeDiscovery.categorizations[id];
        const subCategory = youtubeCategory?.subCategories?.find(s => s.id === subCategoryId);
        return {
          channelId: channel.channelId,
          channelName: channel.channelName,
          thumbnailUrl: channel.thumbnailUrl || null,
          subscriberCount: Number(channel.subscriberCount || 0),
          videoCount: Number(channel.videoCount || 0),
          subCategoryId,
          subCategorySlug: subCategory?.slug ?? null,   // ← was missing on web
          isPrimary: index === 0,                        // ← was missing on web
          isVerified: true,                              // ← was missing on web
          videos: (channel as unknown as Record<string, unknown>).videos ?? [],  // ← was missing on web
        };
      })
      .filter(Boolean);

    const uniqueSubCategoryIds = Array.from(
      new Set(youtubeChannels.map(ch => ch!.subCategoryId).filter(Boolean))
    );

    setTempSignupData({
      ...tempSignupData,
      categoryId: tempSignupData?.categoryId ?? categoryId,
      categorySlug: youtubeCategory?.slug ?? 'yt_influencer',
      roleSubCategoryIds: uniqueSubCategoryIds,
      youtubeChannels,
    });

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // If user came via Google OAuth (isSocialSignup), go to CompleteProfile (mobile pattern)
      // Otherwise go to normal Signup form
      const isSocial = useAuthStore.getState().tempSignupData?.isSocialSignup;
      navigate(isSocial ? '/complete-profile' : '/signup');
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
    <div className="min-h-screen w-full bg-black flex flex-col relative overflow-x-hidden selection:bg-red-500 selection:text-white">
      {/* 🌌 HIGH-ADVANCED NEBULA BACKGROUND (High-Energy & High-Intensity) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none h-full w-full">
        {/* Intense Top Header Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[70vh] bg-gradient-to-b from-red-600/[0.12] to-transparent blur-[120px]" />
        
        {/* Neural Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.12]" 
          style={{ 
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} 
        />
        {/* Floating Particle Swarm (High Speed & High Density) */}
        {[...Array(50)].map((_, i) => {
          const isTop = i < 35; 
          return (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: isTop ? (Math.random() * 60 + '%') : (Math.random() * 100 + '%'),
                opacity: Math.random() * 0.8,
                scale: Math.random() * 0.7 + 0.3
              }}
              animate={{ 
                y: [null, '-25%', '25%', '-10%'],
                x: [null, '12%', '-12%', '6%'],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{ 
                duration: Math.random() * 5 + 4, // FASTER: 4-9s instead of 10-25s
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute w-1 h-1 bg-red-500 rounded-full blur-[1px]"
            />
          );
        })}

        {/* Cinematic Background Orbs (High-Motion) */}
        <motion.div 
          animate={{ scale: [1, 1.15, 1], x: ['-4%', '4%', '-4%'], rotate: [0, 45, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[90%] h-[60%] bg-zinc-900/15 rounded-full blur-[140px]"
        />
        <motion.div 
          animate={{ scale: [1.15, 1, 1.15], x: ['4%', '-4%', '4%'], rotate: [0, -45, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[5%] -right-[10%] w-[90%] h-[60%] bg-red-900/[0.08] rounded-full blur-[140px]"
        />
      </div>

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
          {/* 🎭 UNIFIED HEADER SECTION (Always Visible) */}
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

            <div className="w-full max-w-[20rem] space-y-4 mb-6">
              <Button 
                onClick={handleConnect}
                disabled={isLoading}
                className={`w-full h-12 md:h-16 rounded-xl font-bold text-sm md:text-lg flex items-center justify-center gap-3 border-none active:scale-[0.98] transition-all duration-500 ${
                  connected 
                    ? '!bg-zinc-900 !text-zinc-400 border border-zinc-800 hover:!bg-zinc-800 shadow-xl' 
                    : '!bg-red-600 !text-white shadow-lg shadow-red-900/20'
                }`}
              >
                {connected ? (
                  <>
                    <Plus size={20} strokeWidth={3} className="text-zinc-500" />
                    <span>Add another account</span>
                  </>
                ) : (
                  <>
                    Sync with YouTube
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">
                Choose the email linked to your channel
              </p>
            </div>

            {/* 📺 REAL DISCOVERED CHANNELS (Appears here after fetch) */}
            {connected && (
              <div className="w-full max-w-6xl mx-auto mb-16 space-y-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Identities Discovered</span>
                  </div>
                  <div className="max-w-md bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 text-center">
                    <p className="text-[11px] font-medium text-zinc-500 leading-relaxed">
                      Only see one channel? It's okay! Continue with this one for now—you can easily link your other accounts and multiple profiles after completing your signup.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 w-full max-w-4xl">
                  {youtubeDiscovery.channels.map((channel) => {
                    const activeSubCategoryId = youtubeDiscovery.categorizations[channel.channelId];
                    // Logic: A channel is "selected" ONLY if it has a niche assigned
                    const isSelected = !!activeSubCategoryId;
                    const isPickerOpen = pickerExpandedFor === channel.channelId;
                    const isClaimed = channel.isClaimed;

                    return (
                      <motion.div
                        layout
                        key={channel.channelId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`relative group rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
                          isSelected 
                            ? 'border-white bg-zinc-900 shadow-2xl z-20' 
                            : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                        } ${isClaimed ? 'opacity-60 grayscale' : 'cursor-pointer'}`}
                        onClick={() => {
                          if (isClaimed) return;
                          // Clicking card toggles expansion
                          setPickerExpandedFor(isPickerOpen ? null : channel.channelId);
                        }}
                      >
                        <div className="p-5 md:p-8">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            {/* Left Side: Identity */}
                            <div className="flex items-center gap-6 flex-1 w-full">
                              <div className="relative flex-shrink-0">
                                <img 
                                  src={channel.thumbnailUrl} 
                                  alt="" 
                                  className={`w-16 h-16 md:w-20 md:h-20 rounded-[2rem] object-cover border-2 transition-transform duration-500 ${
                                    isSelected ? 'border-white scale-105' : 'border-zinc-800'
                                  }`} 
                                />
                                {isSelected && (
                                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xl z-30">
                                    <Check size={16} strokeWidth={4} className="text-black" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h4 className="text-lg md:text-xl font-bold text-white truncate tracking-tight">{channel.channelName}</h4>
                                  {isClaimed ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Already Linked</span>
                                    </div>
                                  ) : isSelected ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-600/10 border border-green-600/20">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                                      <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Niche Assigned</span>
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex items-center gap-5">
                                  <div className="flex items-center gap-2 text-red-500">
                                    <Users size={14} />
                                    <span className="text-sm font-black tracking-tight">{parseInt(String(channel.subscriberCount)).toLocaleString()}</span>
                                  </div>
                                  <div className="h-4 w-px bg-zinc-800" />
                                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Verified Identity</span>
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0">
                                <motion.div
                                  animate={{ rotate: isPickerOpen ? 180 : 0 }}
                                  className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-white group-hover:border-zinc-600 transition-colors"
                                >
                                  <ChevronDown size={20} />
                                </motion.div>
                              </div>
                            </div>
                          </div>

                          {/* 🔽 EXPANDED NICHE SECTION (Direct Selection) */}
                          <AnimatePresence>
                            {isPickerOpen && !isClaimed && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-8 pt-8 border-t border-zinc-800/50 space-y-5">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Choose Channel Niche</p>
                                    {isSelected && (
                                      <span className="text-[9px] font-bold text-green-500 uppercase flex items-center gap-1">
                                        <Check size={12} /> Assigned
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {youtubeCategory?.subCategories?.map((sub) => (
                                      <button
                                        key={sub.id}
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          setYoutubeChannelCategory(channel.channelId, sub.id);
                                          // Auto-select the channel in the store if it's not already selected
                                          if (!youtubeDiscovery.selectedChannelIds.includes(channel.channelId)) {
                                            toggleYoutubeChannelSelection(channel.channelId);
                                          }
                                          // Collapse after selection for a cleaner look
                                          setTimeout(() => setPickerExpandedFor(null), 300);
                                        }}
                                        className={`px-4 py-3 rounded-2xl text-[10px] font-bold transition-all border flex items-center justify-center text-center leading-tight min-h-[3rem] ${
                                          activeSubCategoryId === sub.id 
                                            ? 'bg-white border-white text-black shadow-[0_10px_20px_rgba(255,255,255,0.1)]' 
                                            : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 active:scale-95'
                                        }`}
                                      >
                                        {sub.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🎬 CREATOR MARQUEE (Hidden when real channels are present) */}
            {!connected && (
              <div className="w-full relative py-8 bg-black/80 backdrop-blur-xl border-y border-zinc-900 mb-16">
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
                
                <div className="overflow-hidden">
                  <motion.div 
                    className="flex gap-4 w-max px-4"
                    animate={{ x: [0, -1200] }}
                    transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                  >
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="flex gap-4">
                        {[
                          { name: "MrBeast", sub: "245M", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop" },
                          { name: "MKBHD", sub: "18.5M", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" },
                          { name: "Casey Neistat", sub: "12.6M", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop" },
                          { name: "Peter McKinnon", sub: "5.9M", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop" },
                          { name: "Ali Abdaal", sub: "5.2M", img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop" },
                          { name: "Lofi Girl", sub: "14.1M", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop" }
                        ].map((creator, idx) => (
                          <div key={idx} className="relative flex flex-col items-center p-4 rounded-[1.5rem] bg-zinc-950/60 border border-zinc-800/50 backdrop-blur-md w-36">
                            <div className="relative mb-3">
                              <img src={creator.img} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-zinc-800" />
                              <div className="absolute -bottom-1 -right-1 z-20">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-red-600">
                                  <path d="M22.5 12.5c0-1.58-.811-3.029-2.126-3.882l.144-1.618a2.5 2.5 0 00-2.483-2.722l-1.614.076a4.522 4.522 0 00-3.321-2.13L12.5 1.5l-.6-.05c-1.58 0-3.029.811-3.882 2.126l-1.618-.144a2.5 2.5 0 00-2.722 2.483l.076 1.614a4.522 4.522 0 00-2.13 3.321L1.5 11.5l-.05.6c0 1.58.811 3.029 2.126 3.882l-.144 1.618a2.5 2.5 0 002.483 2.722l1.614-.076a4.522 4.522 0 003.321 2.13L11.5 22.5l.6.05c1.58 0 3.029-.811 3.882-2.126l1.618.144a2.5 2.5 0 002.722-2.483l-.076-1.614a4.522 4.522 0 002.13-3.321L22.5 12.5l.05-.6z" />
                                  <path d="M10.5 15.5l-3.5-3.5 1.414-1.414L10.5 12.672l5.586-5.586L17.5 8.5z" fill="white" />
                                </svg>
                              </div>
                            </div>
                            <div className="text-center space-y-1">
                              <h4 className="text-sm font-bold text-white truncate">{creator.name}</h4>
                              <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest bg-red-600/10 px-2 py-0.5 rounded-md">{creator.sub}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            )}

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
                  ? 'bg-white text-black hover:opacity-90 active:scale-[0.98] shadow-xl shadow-white/5' 
                  : 'bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-50'
              }`}
            >
              {allSelectedChannelsTagged ? 'Continue' : 'Assign Niche'}
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
