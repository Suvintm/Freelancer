import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Youtube, 
  ChevronLeft, 
  Loader2,
  ArrowRight,
  PlusCircle,
  Check,
  CheckCircle2,
  Users,
  Video,
  Lock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Info,
  Globe,
  Fingerprint
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { api } from '../api/client';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import { SuccessOverlay } from '../components/shared/SuccessOverlay';
import logo from '../assets/whitebglogo.png';

const EASE = [0.16, 1, 0.3, 1];

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
  const [isLinking, setIsLinking] = useState(false);
  const [pickerExpandedFor, setPickerExpandedFor] = useState<string | null>(null);

  const categoryId = tempSignupData?.categoryId;
  const youtubeCategory = categories.find(c => c.slug === 'yt_influencer');
  const googleAccessToken = location.state?.googleAccessToken;
  const connected = youtubeDiscovery.channels.length > 0;

  useEffect(() => {
    if (!categoryId) {
      navigate('/role-selection');
      return;
    }

    // Reset if we're landing here fresh (not from a Google redirect)
    if (!googleAccessToken && youtubeDiscovery.channels.length > 0) {
      resetYoutubeDiscovery();
    }

    if (googleAccessToken) {
      fetchChannels(googleAccessToken);
    }
  }, [googleAccessToken, categoryId, navigate]);

  const handleConnect = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
    window.location.href = `${apiUrl}/auth/google/youtube`;
  };

  const fetchChannels = async (token: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/youtube/channels', { accessToken: token });
      if (res.data.success) {
        addDiscoveredChannels(res.data.channels);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } catch (err: any) {
      console.error('Error connecting to YouTube:', err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
    setIsLinking(true);
    setTimeout(() => {
      setIsLinking(false);
      navigate('/signup');
    }, 1800);
  };

  if (categoriesLoading) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-[#F8F9FA] overflow-hidden light">
      {/* 🎬 Overlays */}
      <LoadingOverlay isVisible={isLoading} theme="youtube" message="Verifying Identity..." />
      <SuccessOverlay isVisible={showSuccess} type="youtube" title="Identity Linked" message="Accounts discovered successfully." />
      <SuccessOverlay isVisible={isLinking} type="success" title="Finalizing" message="Preparing your profile..." />

      {/* LEFT PANE: Professional Identity Manager (40%) */}
      <aside className="hidden lg:flex lg:w-[40%] flex-col p-12 bg-white border-r border-zinc-100 relative overflow-hidden">
        <div className="relative z-20 h-full flex flex-col">
          <header className="space-y-4">
            <img src={logo} alt="SuviX" className="h-10 brightness-0" />
            <div className="space-y-1">
              <h1 className="text-4xl font-semibold text-zinc-900 leading-[1.1] tracking-tight">
                Connect your <br /> 
                <span className="text-zinc-400">digital identity.</span>
              </h1>
              <p className="text-sm text-zinc-500 font-medium">Link your presence to synchronize with SuviX.</p>
            </div>
          </header>

          <div className="flex-1 flex flex-col justify-center py-12">
            <div className="space-y-6">
              {/* Identity Card */}
              <motion.div 
                layout
                className={`p-1 rounded-[24px] transition-all duration-500 ${connected ? 'bg-green-500/10' : 'bg-zinc-50'}`}
              >
                <div className="bg-white rounded-[22px] border border-zinc-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {connected ? <ShieldCheck size={20} /> : <Youtube size={20} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 tracking-tight uppercase">Primary Source</p>
                        <p className="text-[10px] font-semibold text-zinc-400">Professional Channel Sync</p>
                      </div>
                    </div>
                    {connected && (
                      <div className="px-2.5 py-1 rounded-full bg-green-50 border border-green-100 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-green-700 uppercase tracking-wider">Synced</span>
                      </div>
                    )}
                  </div>

                  {!connected ? (
                    <div className="space-y-4">
                      <Button 
                        onClick={handleConnect}
                        disabled={isLoading}
                        className="w-full h-12 !bg-black !text-white hover:opacity-90 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-zinc-900/10 transition-all active:scale-[0.98]"
                      >
                        Connect YouTube Account
                        <ExternalLink size={14} />
                      </Button>
                      <p className="text-[10px] text-zinc-400 font-medium text-center italic">
                        Tip: Select the Google account linked to your YouTube channel.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-100">
                        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Discovered Accounts</span>
                        <span className="text-sm font-bold text-zinc-900">{youtubeDiscovery.channels.length}</span>
                      </div>
                      <button 
                        onClick={handleConnect}
                        className="w-full h-11 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 font-semibold text-[11px] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"
                      >
                        <PlusCircle size={14} />
                        Add Another Account
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Lock size={14} />, label: "Secure OAuth" },
                  { icon: <Fingerprint size={14} />, label: "Identity Check" },
                  { icon: <Globe size={14} />, label: "Global Sync" },
                  { icon: <ShieldCheck size={14} />, label: "Data Private" }
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-100 bg-zinc-50/50">
                    <span className="text-zinc-400">{badge.icon}</span>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <footer className="pt-8 border-t border-zinc-100">
            <div className="flex items-center gap-2 text-zinc-400">
              <Info size={14} />
              <p className="text-[10px] font-medium">Your data is synchronized using official Google API standards.</p>
            </div>
          </footer>
        </div>

        {/* Decorative background element */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-zinc-50 rounded-full blur-3xl opacity-50 z-0" />
      </aside>

      {/* RIGHT PANE: Channel Inventory (60%) */}
      <main className="flex-1 flex flex-col h-full bg-white relative">
        {/* Sticky Header (Refined Top-Left Branding) */}
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-zinc-100 px-6 py-6 lg:px-12 lg:py-10">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-4">
              <img src={logo} alt="SuviX" className="h-10 lg:hidden brightness-0" />
              <div className="space-y-1">
                <h1 className="text-2xl lg:text-4xl font-semibold text-zinc-900 leading-[1.1] tracking-tight">
                  Select <span className="text-zinc-400">Identities.</span>
                </h1>
                <p className="text-zinc-500 text-[10px] lg:text-sm max-w-lg leading-relaxed">
                  Choose the channels you want to manage and assign their primary niche.
                </p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/role-selection')}
              className="flex-none w-10 h-10 rounded-xl border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors"
            >
              <ChevronLeft size={20} className="text-zinc-900" />
            </button>
          </div>
        </div>

        {/* Scrollable Grid Area */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-12 py-8 lg:py-12 pb-32 scroll-smooth custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {!connected ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-24 flex flex-col items-center justify-center text-center"
              >
                <div className="w-24 h-24 rounded-[32px] bg-zinc-50 border border-dashed border-zinc-200 flex items-center justify-center mb-8 relative">
                  <Youtube size={32} className="text-zinc-200" />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white border border-zinc-100 shadow-sm flex items-center justify-center">
                    <PlusCircle size={20} className="text-zinc-300" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-zinc-900 tracking-tight">Discover your inventory</h3>
                  <p className="text-sm text-zinc-500 font-medium max-w-[320px] leading-relaxed mx-auto">
                    Click <span className="text-zinc-900 font-bold underline decoration-zinc-200">Connect YouTube Account</span> on the left to view and select your professional channels.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
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
                      className={`relative group rounded-3xl border transition-all duration-300 ${
                        isSelected 
                          ? 'border-zinc-900 bg-zinc-50 ring-4 ring-zinc-900/5 shadow-xl shadow-zinc-900/10' 
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      } ${isClaimed ? 'opacity-50 grayscale' : 'cursor-pointer'}`}
                      onClick={() => !isClaimed && toggleYoutubeChannelSelection(channel.channelId)}
                    >
                      {isClaimed && (
                        <div className="absolute top-3 left-3 z-20 px-2 py-1 rounded-full bg-amber-50 border border-amber-100 flex items-center gap-1">
                          <Lock size={10} className="text-amber-600" />
                          <span className="text-[8px] font-bold text-amber-700 uppercase tracking-widest">In Use</span>
                        </div>
                      )}

                      <div className="p-5 space-y-4">
                        <div className="flex items-center gap-4">
                          <img src={channel.thumbnailUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border border-zinc-100" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-zinc-900 truncate tracking-tight">{channel.channelName}</h4>
                            <div className="flex items-center gap-3 mt-1 text-zinc-500">
                              <div className="flex items-center gap-1">
                                <Users size={12} />
                                <span className="text-[10px] font-bold tracking-tight">{parseInt(String(channel.subscriberCount)).toLocaleString()}</span>
                              </div>
                              <div className="w-1 h-1 rounded-full bg-zinc-200" />
                              <div className="flex items-center gap-1">
                                <Video size={12} />
                                <span className="text-[10px] font-bold tracking-tight">{channel.videoCount}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-200'
                          }`}>
                            {isSelected && <Check size={14} strokeWidth={3} className="text-white" />}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="pt-4 border-t border-zinc-200/60">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPickerExpandedFor(isPickerOpen ? null : channel.channelId); }}
                              className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all ${
                                activeSubCategoryId ? 'bg-white border border-zinc-200 shadow-sm' : 'bg-zinc-100/50 hover:bg-zinc-100'
                              }`}
                            >
                              <div className="text-left">
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Primary Niche</p>
                                <p className={`text-[11px] font-bold ${activeSubCategoryId ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                  {activeSubCategoryName || 'Assign Specialty'}
                                </p>
                              </div>
                              {isPickerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            <AnimatePresence>
                              {isPickerOpen && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 grid grid-cols-2 gap-2"
                                >
                                  {youtubeCategory?.subCategories?.map((sub) => (
                                    <button
                                      key={sub.id}
                                      onClick={(e) => { e.stopPropagation(); setYoutubeChannelCategory(channel.channelId, sub.id); setPickerExpandedFor(null); }}
                                      className={`px-3 py-2.5 rounded-xl border text-[10px] font-bold tracking-tight transition-all text-center ${
                                        activeSubCategoryId === sub.id 
                                          ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-900/10' 
                                          : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900'
                                      }`}
                                    >
                                      {sub.name}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="flex-none p-6 lg:p-10 bg-white border-t border-zinc-100 z-50">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                <CheckCircle2 size={18} className={connected ? 'text-green-500' : 'text-zinc-300'} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Final Selection</p>
                <p className="text-xs font-bold text-zinc-900">
                  {youtubeDiscovery.selectedChannelIds.length} Channel{youtubeDiscovery.selectedChannelIds.length !== 1 ? 's' : ''} Linked
                </p>
              </div>
            </div>

            <Button 
              size="lg" 
              disabled={youtubeDiscovery.selectedChannelIds.length === 0 || !allSelectedChannelsTagged}
              onClick={handleContinue}
              className={`w-full sm:w-64 h-12 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                allSelectedChannelsTagged 
                  ? 'bg-black text-white hover:opacity-90 shadow-xl shadow-zinc-900/10' 
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
              }`}
            >
              Confirm Identities
              <ArrowRight size={18} strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
