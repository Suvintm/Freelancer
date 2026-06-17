import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Loader2,
  ArrowRight,
  Plus,
  Check,
  Users,
  Video,
  TrendingUp,
  AlertCircle,
  Info,
  Mail,
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { api } from '../api/client';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import { SuccessOverlay } from '../components/shared/SuccessOverlay';
import logo from '../assets/darklogo.png';

const formatCount = (n: number | string): string => {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
};

export default function YouTubeConnect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    tempSignupData, 
    setTempSignupData, 
    youtubeDiscovery, 
    addDiscoveredChannels, 
    resetYoutubeDiscovery 
  } = useAuthStore();
  const { categories, isLoading: categoriesLoading, fetchCategories } = useCategoryStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetchStarted = useRef(false);

  const categoryId = tempSignupData?.categoryId;
  const googleAccessToken = location.state?.googleAccessToken as string | undefined;
  const connected = youtubeDiscovery.channels.length > 0;
  const hasUnclaimedChannel = youtubeDiscovery.channels.some(c => !c.isClaimed);

  // Stable particles
  const particles = useMemo(() => 
    [...Array(50)].map((_, i) => ({
      id: i,
      x: Math.random() * 100 + '%',
      y: (i < 35) ? (Math.random() * 60 + '%') : (Math.random() * 100 + '%'),
      opacity: Math.random() * 0.8,
      scale: Math.random() * 0.7 + 0.3,
      duration: Math.random() * 5 + 4,
    })), []);

  const handleConnect = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
    window.location.href = `${apiUrl}/auth/google/youtube`;
  };

  const fetchChannels = useCallback(async (token: string) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await api.post('/auth/youtube/channels', { accessToken: token });
      if (res.data.success) {
        addDiscoveredChannels(res.data.channels);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        throw new Error(res.data.message || 'Failed to fetch channels');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setFetchError(error.response?.data?.message || error.message || 'Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [addDiscoveredChannels]);

  useEffect(() => {
    if (!categoryId) {
      navigate('/role-selection', { replace: true });
      return;
    }
    fetchCategories();

    if (!googleAccessToken && youtubeDiscovery.channels.length > 0) {
      resetYoutubeDiscovery();
    }

    if (googleAccessToken && youtubeDiscovery.channels.length === 0 && !fetchStarted.current) {
      fetchStarted.current = true;
      fetchChannels(googleAccessToken);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Save channel data (without niche — that comes next) and go to niche selection page.
   */
  const handleNext = () => {
    const ytCat = categories.find(c => c.slug === 'yt_influencer');

    const youtubeChannels = youtubeDiscovery.channels
      .filter(c => !c.isClaimed)
      .map((channel, index) => ({
        channelId:       channel.channelId,
        channelName:     channel.channelName,
        thumbnailUrl:    channel.thumbnailUrl || null,
        subscriberCount: Number(channel.subscriberCount || 0),
        videoCount:      Number(channel.videoCount || 0),
        isPrimary:       index === 0,
        isVerified:      true,
        videos:          channel.videos || [],
      }));

    setTempSignupData({
      ...tempSignupData,
      categorySlug:   ytCat?.slug ?? 'yt_influencer',
      youtubeChannels,
      onboardingStep: 'youtube',
    });

    navigate('/youtube-niche');
  };

  if (categoriesLoading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Initializing Sync...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black flex flex-col relative overflow-x-hidden selection:bg-red-500 selection:text-white">

      {/* ── BACKGROUND ─────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none h-full w-full">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[70vh] bg-gradient-to-b from-red-600/[0.12] to-transparent blur-[120px]" />
        <div 
          className="absolute inset-0 opacity-[0.12]" 
          style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)`, backgroundSize: '32px 32px' }} 
        />
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, opacity: p.opacity, scale: p.scale }}
            animate={{ y: [null, '-25%', '25%', '-10%'], x: [null, '12%', '-12%', '6%'], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: "linear" }}
            className="absolute w-1 h-1 bg-red-500 rounded-full blur-[1px]"
          />
        ))}
        <motion.div animate={{ scale: [1, 1.15, 1], x: ['-4%', '4%', '-4%'], rotate: [0, 45, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute -top-[10%] -left-[10%] w-[90%] h-[60%] bg-zinc-900/15 rounded-full blur-[140px]" />
        <motion.div animate={{ scale: [1.15, 1, 1.15], x: ['4%', '-4%', '4%'], rotate: [0, -45, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="absolute -top-[5%] -right-[10%] w-[90%] h-[60%] bg-red-900/[0.08] rounded-full blur-[140px]" />
      </div>

      <LoadingOverlay isVisible={isLoading} theme="youtube" message="Verifying..." />
      <SuccessOverlay isVisible={showSuccess} type="youtube" title="Channel Found!" message="Identity synced successfully." />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
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

      {/* ── MAIN: Two-column layout ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center p-4 pt-20 md:pt-24 relative pb-32">
        <div className="w-full max-w-[80rem] mx-auto relative z-10 flex flex-col lg:flex-row lg:items-start items-center justify-center gap-8 lg:gap-16">

          {/* LEFT COLUMN */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:w-[40%] max-w-[48rem] py-4 md:py-8 lg:sticky lg:top-24"
          >
            <div className="space-y-2 mb-6 w-full">
              <h1 className="text-[clamp(1.75rem,7vw,4rem)] lg:text-[4rem] font-bold text-white tracking-tight leading-[1.1]">
                Connect your <br />
                <span className="text-zinc-600">digital identity.</span>
              </h1>
              <p className="text-xs md:text-lg text-zinc-500 font-medium max-w-[24rem] mx-auto lg:mx-0">
                Synchronize your professional presence.
              </p>
            </div>

            {/* CTA + guidance */}
            <div className="w-full max-w-[20rem] space-y-3 mb-8">
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
                  <><Plus size={20} strokeWidth={3} className="text-zinc-500" /><span>Add another account</span></>
                ) : (
                  <>Sync with YouTube<ArrowRight size={16} /></>
                )}
              </Button>

              {/* Email guidance */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center lg:text-left flex items-center justify-center lg:justify-start gap-1.5">
                  <Mail size={9} className="text-zinc-600" />
                  Choose the email linked to your channel
                </p>
                <div className="flex items-start gap-2 bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 text-left">
                  <Info size={12} className="text-zinc-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Google lets us read only the <span className="text-zinc-400 font-semibold">primary channel</span> of the account you sign in with. You can link more channels after signup.
                  </p>
                </div>
                {fetchError && (
                  <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-xl p-3 text-left">
                    <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-400 font-semibold leading-relaxed">{fetchError}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Benefits Card (Desktop) */}
            <div className="hidden lg:block w-full max-w-xl bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 text-left relative overflow-hidden group">
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
                      <div className="p-1 rounded-lg bg-white/5 border border-white/10 text-red-500">{item.icon}</div>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center w-full lg:w-[60%] max-w-[48rem] py-4 md:py-8"
          >
            {/* ── CONNECTED: Channel identity cards ─────────────────── */}
            {connected && (
              <div className="w-full max-w-6xl mx-auto mb-16 space-y-6">
                {/* Header */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {youtubeDiscovery.channels.length === 1 ? 'Channel Discovered' : `${youtubeDiscovery.channels.length} Channels Discovered`}
                    </span>
                  </div>
                  <div className="max-w-md bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 text-center">
                    <p className="text-[11px] font-medium text-zinc-500 leading-relaxed">
                      Only see one channel? That's normal — Google returns the channel tied to the account you signed in with.{' '}
                      <span className="text-zinc-400">You can link more after signup.</span>
                    </p>
                  </div>
                </div>

                {/* All claimed warning */}
                {!hasUnclaimedChannel && (
                  <div className="bg-zinc-900/60 border border-orange-500/20 rounded-2xl p-6 text-center space-y-4">
                    <AlertCircle size={32} className="text-orange-400 mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-white mb-1">All found channels are already on SuviX</p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed max-w-sm mx-auto">
                        Try connecting with a different Google account or contact support.
                      </p>
                    </div>
                    <div className="flex justify-center gap-3">
                      <button onClick={handleConnect} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-[10px] font-bold hover:bg-zinc-700 transition-colors uppercase tracking-wider">
                        Try Different Account
                      </button>
                      <a href="mailto:support@suvix.com" className="px-4 py-2 rounded-xl bg-red-600/10 border border-red-600/20 text-red-400 text-[10px] font-bold hover:bg-red-600/15 transition-colors uppercase tracking-wider flex items-center gap-1.5">
                        <ExternalLink size={10} /> Contact Support
                      </a>
                    </div>
                  </div>
                )}

                {/* Channel Cards — display only, no niche picker here */}
                <div className="flex flex-col gap-4 w-full max-w-4xl">
                  {youtubeDiscovery.channels.map((channel) => {
                    const isClaimed = channel.isClaimed;
                    return (
                      <motion.div
                        key={channel.channelId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`relative rounded-3xl border transition-all duration-500 overflow-hidden ${
                          isClaimed
                            ? 'border-orange-500/30 bg-zinc-900/40'
                            : 'border-zinc-700 bg-zinc-900/80 shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
                        }`}
                      >
                        <div className="p-5 md:p-8">
                          <div className="flex items-center gap-6">
                            {/* Thumbnail */}
                            <div className="relative flex-shrink-0">
                              <img 
                                src={channel.thumbnailUrl} 
                                alt={channel.channelName}
                                className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 ${
                                  isClaimed ? 'border-orange-500/30 grayscale' : 'border-zinc-700'
                                }`} 
                              />
                              {!isClaimed && (
                                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center border-2 border-zinc-900">
                                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h4 className="text-lg md:text-xl font-bold text-white truncate tracking-tight">{channel.channelName}</h4>
                                {isClaimed ? (
                                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                                    <AlertCircle size={10} className="text-orange-400" />
                                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Already on SuviX</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-600/10 border border-green-600/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Ready to Link</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2 text-red-500">
                                  <Users size={14} />
                                  <span className="text-sm font-black">{formatCount(channel.subscriberCount)}</span>
                                </div>
                                {channel.videoCount && (
                                  <>
                                    <div className="h-4 w-px bg-zinc-800" />
                                    <div className="flex items-center gap-1.5 text-zinc-500">
                                      <Video size={12} />
                                      <span className="text-xs font-bold">{formatCount(channel.videoCount)} videos</span>
                                    </div>
                                  </>
                                )}
                                <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] hidden sm:block">Verified Identity</span>
                              </div>
                            </div>

                            {/* Tick for unclaimed */}
                            {!isClaimed && (
                              <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                                <Check size={18} className="text-green-400" />
                              </div>
                            )}
                          </div>

                          {/* Claimed explanation */}
                          {isClaimed && (
                            <div className="mt-5 p-4 rounded-2xl bg-orange-950/20 border border-orange-500/15 space-y-2">
                              <p className="text-xs font-bold text-orange-300">This channel is already registered on SuviX</p>
                              <p className="text-[11px] text-zinc-500 leading-relaxed">
                                If this is your channel and you believe this is an error, please contact our support team.
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <a href="mailto:support@suvix.com" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold hover:bg-orange-500/15 transition-colors">
                                  <ExternalLink size={10} /> Contact Support
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <p className="text-center text-[11px] text-zinc-600">
                  Channel not showing?{' '}
                  <button onClick={handleConnect} className="text-zinc-400 font-semibold hover:text-white transition-colors underline underline-offset-2">
                    Try a different Google account
                  </button>
                </p>
              </div>
            )}

            {/* ── PRE-CONNECT: Marquee ──── */}
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
                          { name: "MrBeast",       sub: "245M",  img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop" },
                          { name: "MKBHD",         sub: "18.5M", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" },
                          { name: "Casey Neistat", sub: "12.6M", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop" },
                          { name: "Peter McKinnon",sub: "5.9M",  img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop" },
                          { name: "Ali Abdaal",    sub: "5.2M",  img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop" },
                          { name: "Lofi Girl",     sub: "14.1M", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop" }
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

            {/* Benefits Card (Mobile) */}
            <div className="lg:hidden w-full max-w-xl bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 text-left relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Video size={80} className="text-zinc-500" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[9px] font-bold uppercase tracking-widest">Creator Benefits</div>
                <h3 className="text-xl font-bold text-white tracking-tight leading-tight">Unlock Your Creator Identity</h3>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">Sync your channel to display verified metrics, gain access to exclusive brand deals, and boost your profile credibility.</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
                  {[
                    { icon: <Users size={14} />, text: "Verified Stats" },
                    { icon: <TrendingUp size={14} />, text: "Engagement" },
                    { icon: <Check size={14} />, text: "Search Priority" },
                    { icon: <Video size={14} />, text: "Brand Verified" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-zinc-300 text-[10px] font-bold uppercase tracking-tight">
                      <div className="p-1 rounded-lg bg-white/5 border border-white/10 text-red-500">{item.icon}</div>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ── STICKY BOTTOM HUD ──────────────────────────────────────────────── */}
      {connected && (
        <div className="fixed bottom-6 inset-x-4 md:bottom-10 z-[100] flex justify-center pointer-events-none">
          <div className="w-full max-w-[42rem] bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800 p-3 md:p-4 rounded-[2rem] flex items-center justify-between gap-6 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4 pl-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <div className={`w-2.5 h-2.5 rounded-full ${hasUnclaimedChannel ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-orange-500'}`} />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">Channel Status</p>
                <p className="text-sm font-bold text-white leading-none">
                  {hasUnclaimedChannel
                    ? `${youtubeDiscovery.channels.filter(c => !c.isClaimed).length} ready · click Next to choose your niche`
                    : 'All channels already registered'
                  }
                </p>
              </div>
            </div>

            <Button 
              size="lg" 
              disabled={!hasUnclaimedChannel}
              onClick={handleNext}
              className={`h-12 md:h-14 px-8 md:px-10 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 border-none ${
                hasUnclaimedChannel
                  ? 'bg-white text-black hover:opacity-90 active:scale-[0.98] shadow-xl shadow-white/5' 
                  : 'bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-50'
              }`}
            >
              Next: Choose Niche
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
