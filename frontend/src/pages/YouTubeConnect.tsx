import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Youtube, 
  ChevronLeft, 
  AlertCircle,
  Loader2,
  ArrowRight,
  PlusCircle,
  Check
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AuthBackground } from '../components/auth/AuthBackground';
import { useAuthStore } from '../store/useAuthStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { api } from '../api/client';
import logo from '../assets/whitebglogo.png';

export default function YouTubeConnect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tempSignupData, setTempSignupData, youtubeDiscovery, addDiscoveredChannels, toggleYoutubeChannelSelection, setYoutubeChannelCategory } = useAuthStore();
  const { categories, isLoading: categoriesLoading } = useCategoryStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigningNicheFor, setAssigningNicheFor] = useState<string | null>(null);

  const categoryId = tempSignupData?.categoryId;
  const youtubeCategory = categories.find(c => c.slug === 'yt_influencer');
  const googleAccessToken = location.state?.googleAccessToken;

  useEffect(() => {
    if (!categoryId) {
      navigate('/role-selection');
      return;
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
    setError(null);
    try {
      const res = await api.post('/auth/youtube/channels', { accessToken: token });
      if (res.data.success) {
        addDiscoveredChannels(res.data.channels);
      } else {
        setError(res.data.message || 'Failed to fetch channels');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error connecting to YouTube');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (youtubeDiscovery.selectedChannelIds.length === 0) return;

    // Validate that all selected channels have a niche assigned
    const unassigned = youtubeDiscovery.selectedChannelIds.find(id => !youtubeDiscovery.categorizations[id]);
    if (unassigned) {
      setError('Please assign a niche to all selected channels');
      return;
    }

    // Format data for signup
    const youtubeChannels = youtubeDiscovery.selectedChannelIds.map(id => {
      const channel = youtubeDiscovery.channels.find(c => c.id === id);
      return {
        ...channel,
        subCategoryId: youtubeDiscovery.categorizations[id]
      };
    });

    setTempSignupData({ youtubeChannels });
    navigate('/signup');
  };

  if (categoriesLoading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-black font-sans overflow-hidden relative text-white">
      {/* Desktop Left Panel */}
      <div className="hidden lg:flex lg:w-[40%] p-8 bg-zinc-950 overflow-hidden relative border-r border-zinc-900">
        <AuthBackground />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />
      </div>

      {/* Mobile Background */}
      <div className="lg:hidden absolute inset-0 z-0 bg-black">
        <AuthBackground />
        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-black z-10" />
        <div className="absolute inset-x-0 bottom-[60%] h-48 bg-gradient-to-t from-black to-transparent z-10" />
      </div>

      <div className="flex-1 lg:flex-none lg:w-[60%] flex flex-col h-full overflow-hidden bg-transparent lg:bg-black z-20">
        
        {/* Header */}
        <header className="flex-none p-6 lg:p-10 flex items-center justify-between">
          <button 
            onClick={() => navigate('/role-selection')}
            className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition-all"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm uppercase tracking-widest">Back</span>
          </button>
          <img src={logo} alt="SuviX" className="h-8 lg:h-10 w-auto brightness-0 invert" />
          <div className="w-20" />
        </header>

        <div className="flex-1 overflow-y-auto px-6 lg:px-20 pb-40 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] bg-red-500/10 border border-red-500/20 mb-6"
              >
                <Youtube size={40} className="text-red-500" />
              </motion.div>
              
              <h1 className="text-3xl lg:text-5xl font-black tracking-tight mb-4">
                Verify Your <span className="text-red-500">Identity</span>
              </h1>
              <p className="text-zinc-400 text-xs lg:text-base max-w-2xl mx-auto leading-relaxed">
                Connect your YouTube channel to import your metrics and prove your influence to top-tier brands on SuviX.
              </p>
            </div>

            {error && (
              <div className="max-w-md mx-auto mb-10 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500">
                <AlertCircle size={20} />
                <p className="font-bold text-sm">{error}</p>
              </div>
            )}

            {!youtubeDiscovery.channels.length ? (
              <div className="flex flex-col items-center">
                <Button 
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="h-16 px-10 rounded-2xl bg-white text-black font-black text-xl hover:scale-105 transition-transform flex items-center gap-3"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <Youtube size={24} />}
                  Connect YouTube
                </Button>
                <p className="mt-6 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                  Secure OAuth 2.0 Verification
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black uppercase tracking-widest text-zinc-500">Discovered Channels</h3>
                  <p className="text-xs font-bold text-zinc-400">{youtubeDiscovery.channels.length} found</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {youtubeDiscovery.channels.map((channel) => {
                    const isSelected = youtubeDiscovery.selectedChannelIds.includes(channel.id);
                    const assignedNicheId = youtubeDiscovery.categorizations[channel.id];
                    const assignedNiche = youtubeCategory?.subCategories?.find(s => s.id === assignedNicheId);

                    return (
                      <motion.div
                        key={channel.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative p-5 rounded-[24px] border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-white/5 border-white shadow-2xl' 
                            : 'bg-zinc-900/30 border-white/5 hover:border-white/10'
                        }`}
                        onClick={() => toggleYoutubeChannelSelection(channel.id)}
                      >
                        <div className="flex items-center gap-4">
                          <img 
                            src={channel.thumbnails.medium.url} 
                            alt="" 
                            className="w-14 h-14 rounded-xl object-cover border border-white/10"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-black truncate">{channel.title}</h4>
                            <p className="text-zinc-500 text-xs font-bold">
                              {parseInt(channel.statistics.subscriberCount).toLocaleString()} Subscribers
                            </p>
                          </div>
                          {isSelected ? (
                            <div className="bg-white p-1.5 rounded-full">
                              <Check size={14} strokeWidth={4} className="text-black" />
                            </div>
                          ) : (
                            <PlusCircle size={20} className="text-zinc-700" />
                          )}
                        </div>

                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            {assignedNiche ? (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setAssigningNicheFor(channel.id); }}
                                className="flex items-center justify-between w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                  <span className="text-xs font-black uppercase tracking-tight">{assignedNiche.name}</span>
                                </div>
                                <span className="text-[10px] font-black text-zinc-500 uppercase">Change</span>
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setAssigningNicheFor(channel.id); }}
                                className="w-full py-3 bg-red-500/20 text-red-500 border border-red-500/20 font-black rounded-xl text-xs hover:bg-red-500 hover:text-white transition-all"
                              >
                                Assign Channel Niche
                              </button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="absolute inset-x-0 bottom-0 z-50 p-6 lg:p-12 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto flex justify-center pointer-events-auto">
            <Button 
              size="lg" 
              disabled={youtubeDiscovery.selectedChannelIds.length === 0}
              onClick={handleContinue}
              className={`w-full lg:w-96 h-16 rounded-[24px] font-black text-xl transition-all duration-500 flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${
                youtubeDiscovery.selectedChannelIds.length > 0 
                  ? 'bg-white text-black hover:scale-[1.02]' 
                  : 'bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-50'
              }`}
            >
              Finalize & Continue
              <ArrowRight size={24} strokeWidth={3} />
            </Button>
          </div>
        </div>
      </div>

      {/* Niche Assignment Modal */}
      <AnimatePresence>
        {assigningNicheFor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssigningNicheFor(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[32px] p-8 lg:p-12 max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-black mb-2">Assign Niche</h2>
                <p className="text-zinc-500 text-sm">What type of content does this channel primarily focus on?</p>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                  {youtubeCategory?.subCategories?.map((sub) => {
                    const isSelected = youtubeDiscovery.categorizations[assigningNicheFor] === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setYoutubeChannelCategory(assigningNicheFor, sub.id);
                          setAssigningNicheFor(null);
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected 
                            ? 'bg-white text-black border-white' 
                            : 'bg-white/5 border-white/5 hover:border-white/10 text-zinc-400'
                        }`}
                      >
                        <span className="font-black uppercase tracking-tight text-xs">{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button 
                onClick={() => setAssigningNicheFor(null)}
                className="mt-8 w-full h-14 bg-white/5 text-white font-bold rounded-xl"
              >
                Close
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
