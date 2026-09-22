import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Coins, 
  Crown, 
  CreditCard, 
  ArrowRight, 
  Info, 
  CheckCircle2, 
  Clapperboard, 
  ClipboardList, 
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../store/slices/authSlice';
import { api } from '../../api/client';
import { useTheme } from '../../hooks/useTheme';

export interface AdOffer {
  id: string;
  title: string;
  description: string;
  reward: number;
  duration: number; // in seconds
  icon: 'youtube' | 'app' | 'brand' | 'survey' | 'product';
  partnerName: string;
}

const OFFERS: AdOffer[] = [
  {
    id: 'youtube-1',
    title: 'Watch a YouTube Ad',
    description: 'Watch a 30-second ad',
    reward: 10,
    duration: 5, // Fast demo duration
    icon: 'youtube',
    partnerName: 'YouTube Partner Video',
  },
  {
    id: 'app-1',
    title: 'Explore a New App',
    description: 'Watch an ad and try an app',
    reward: 25,
    duration: 5,
    icon: 'app',
    partnerName: 'Google Play Store App',
  },
  {
    id: 'brand-1',
    title: 'Discover a Brand',
    description: 'Watch an ad to learn more',
    reward: 15,
    duration: 5,
    icon: 'brand',
    partnerName: 'Creator Brand Showcase',
  },
  {
    id: 'survey-1',
    title: 'Complete a Survey',
    description: 'Answer a few questions',
    reward: 20,
    duration: 5,
    icon: 'survey',
    partnerName: 'Quick Creator Opinion Poll',
  },
  {
    id: 'product-1',
    title: 'Explore a Product',
    description: 'Watch an ad and explore',
    reward: 15,
    duration: 5,
    icon: 'product',
    partnerName: 'Featured Tech Gear',
  },
];

interface WatchAdsCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditsEarned?: (amount: number) => void;
  currentCredits?: number;
}

export const WatchAdsCreditsModal: React.FC<WatchAdsCreditsModalProps> = ({
  isOpen,
  onClose,
  onCreditsEarned,
  currentCredits = 0,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();

  // Active Tab: 'watch' or 'purchase'
  const [activeTab, setActiveTab] = useState<'watch' | 'purchase'>('watch');

  // Active watching ad state
  const [activeAd, setActiveAd] = useState<AdOffer | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedAnimation, setEarnedAnimation] = useState<number | null>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeAd) {
          setActiveAd(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, activeAd, onClose]);

  // Handle Ad Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeAd && countdown > 0 && !isCompleted) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (activeAd && countdown === 0 && !isCompleted) {
      setIsCompleted(true);
      const currentOffer = activeAd;

      // 1. Optimistic UI update
      if (onCreditsEarned) {
        onCreditsEarned(currentOffer.reward);
      }
      setEarnedAnimation(currentOffer.reward);

      // 2. Call backend API to atomically increment in PostgreSQL & sync Redis cache
      api.post('/user/credits/claim', {
        reward: currentOffer.reward,
        offerId: currentOffer.id,
      })
      .then((res) => {
        if (res.data?.credits !== undefined) {
          dispatch(updateUser({ credits: res.data.credits }));
        }
      })
      .catch((err) => {
        // Graceful fallback if offline or local network error
        console.warn('Credits claim API sync info:', err.message);
      });

      setTimeout(() => {
        setEarnedAnimation(null);
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [activeAd, countdown, isCompleted, onCreditsEarned, dispatch]);

  if (!isOpen) return null;

  const handleStartWatchAd = (offer: AdOffer) => {
    setActiveAd(offer);
    setCountdown(offer.duration);
    setIsCompleted(false);
  };

  const handleCloseAdPlayer = () => {
    setActiveAd(null);
    setCountdown(5);
    setIsCompleted(false);
  };

  const renderOfferIcon = (icon: AdOffer['icon']) => {
    switch (icon) {
      case 'youtube':
        return (
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
        );
      case 'app':
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-emerald-400 to-amber-400 flex items-center justify-center shrink-0 shadow-sm p-1.5">
            <div className="w-full h-full bg-white/90 rounded-lg flex items-center justify-center shadow-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M3 3l15 9-15 9V3z" fill="#4285F4" />
                <path d="M18 12L3 21l8-9 7 0z" fill="#34A853" />
                <path d="M18 12L11 3l7 9z" fill="#FBBC05" />
              </svg>
            </div>
          </div>
        );
      case 'brand':
        return (
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-sm text-white">
            <Clapperboard size={18} strokeWidth={2.2} />
          </div>
        );
      case 'survey':
        return (
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-sm text-white">
            <ClipboardList size={18} strokeWidth={2.2} />
          </div>
        );
      case 'product':
        return (
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-sm text-white">
            <ShoppingBag size={18} strokeWidth={2.2} />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Main Modal Container */}
      <div 
        className={`relative w-full max-w-4xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-[28px] sm:rounded-[32px] shadow-2xl transition-all duration-300 z-10 ${
          isDarkMode 
            ? 'bg-[#121214] text-white border border-zinc-800' 
            : 'bg-white text-zinc-900 border border-zinc-200/90'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button at Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4.5 right-4.5 sm:top-6 sm:right-6 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-all cursor-pointer z-30 shadow-xs"
          title="Close modal"
        >
          <X size={17} strokeWidth={2.2} />
        </button>

        {/* Modal Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Hero Banner, Bullets, 3D Cards Graphic     */}
          {/* ======================================================== */}
          <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-transparent to-zinc-50/50 dark:to-zinc-900/30">
            <div>
              {/* Category Pill */}
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-3">
                GET MORE CREDITS
              </span>

              {/* Main Headline */}
              <h2 className="text-3xl sm:text-[38px] font-black tracking-tight leading-[1.08] text-zinc-950 dark:text-white mb-3.5">
                Watch Ads.<br />
                Earn Credits.
              </h2>

              {/* Paragraph Description */}
              <p className="text-[13px] sm:text-[13.5px] leading-relaxed text-zinc-500 dark:text-zinc-400 mb-7">
                Support SuviX and unlock powerful tools, premium features and more — by simply watching short ads.
              </p>

              {/* 3 Feature Bullet Rows */}
              <div className="space-y-4">
                {/* 1. Quick & Easy */}
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-sm">
                    <Play size={13} className="fill-current ml-0.5" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-zinc-900 dark:text-white leading-tight">
                      Quick &amp; Easy
                    </h4>
                    <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5">
                      Watch short ads (15–30 seconds)
                    </p>
                  </div>
                </div>

                {/* 2. Earn Credits */}
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-sm">
                    <Coins size={14} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-zinc-900 dark:text-white leading-tight">
                      Earn Credits
                    </h4>
                    <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5">
                      Get credits instantly
                    </p>
                  </div>
                </div>

                {/* 3. Unlock More */}
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-sm">
                    <Crown size={14} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-zinc-900 dark:text-white leading-tight">
                      Unlock More
                    </h4>
                    <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5">
                      Use credits for premium tools and features
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Graphic: 3D Stacked Cards with Watch & Earn */}
            <div className="relative pt-10 pb-2 flex items-center justify-center select-none">
              {/* Back tilted frosted card 1 */}
              <div className="absolute w-[200px] h-[130px] rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/40 -rotate-12 transform -translate-x-6 translate-y-1 shadow-sm border border-black/5 dark:border-white/5 pointer-events-none" />

              {/* Middle tilted frosted card 2 */}
              <div className="absolute w-[210px] h-[135px] rounded-2xl bg-zinc-300/70 dark:bg-zinc-700/40 -rotate-6 transform -translate-x-3 translate-y-0.5 shadow-md border border-black/5 dark:border-white/5 pointer-events-none" />

              {/* Front Dark Card */}
              <div className="relative w-[225px] h-[142px] rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-4 text-white shadow-xl flex flex-col justify-between border border-zinc-700/60">
                {/* Top left white dot */}
                <div className="w-2.5 h-2.5 rounded-full bg-white/90 shadow-sm" />

                {/* Centered Play Button */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg ring-1 ring-white/30">
                    <Play size={18} className="fill-white text-white ml-0.5" />
                  </div>
                </div>

                {/* Floating "+10 Credits" badge on the top right */}
                <div className="absolute -top-3.5 -right-3 bg-white text-zinc-900 shadow-xl rounded-xl px-2.5 py-1 border border-zinc-100 flex flex-col items-center justify-center animate-bounce-subtle">
                  <span className="text-[13px] font-black leading-none text-zinc-900 tracking-tight">
                    +10
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 leading-none mt-0.5 uppercase tracking-wider">
                    Credits
                  </span>
                </div>

                {/* Bottom Left Label and progress line */}
                <div>
                  <div className="text-[12px] font-bold leading-tight tracking-tight text-white mb-2">
                    Watch<br />&amp; Earn
                  </div>
                  {/* White scrub bar */}
                  <div className="w-20 h-1 rounded-full bg-white/30 overflow-hidden">
                    <div className="w-10 h-full bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Header Tabs, Offers List, Info Banner     */}
          {/* ======================================================== */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800/80">
            <div>
              {/* Top Tabs: Watch Ads (Active) vs Purchase Credits */}
              <div className="flex items-center gap-2.5 pr-10">
                {/* 1. Watch Ads Tab (Active) */}
                <button
                  onClick={() => setActiveTab('watch')}
                  className={`flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-2xl transition-all cursor-pointer ${
                    activeTab === 'watch'
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    activeTab === 'watch'
                      ? 'bg-white dark:bg-black text-black dark:text-white'
                      : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-white'
                  }`}>
                    <Play size={11} className="fill-current ml-0.5" />
                  </div>
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-[12.5px] font-bold leading-tight">
                      Watch Ads
                    </span>
                    <span className={`text-[10.5px] font-medium leading-tight mt-0.5 ${
                      activeTab === 'watch' ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-500'
                    }`}>
                      Free Credits
                    </span>
                  </div>
                </button>

                {/* 2. Purchase Credits Tab */}
                <button
                  onClick={() => {
                    onClose();
                    navigate('/subscription');
                  }}
                  className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-750 text-zinc-900 dark:text-white transition-all cursor-pointer shadow-xs group"
                >
                  <CreditCard size={17} className="text-zinc-600 dark:text-zinc-300 group-hover:scale-105 transition-transform" />
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-[12.5px] font-bold leading-tight">
                      Purchase Credits
                    </span>
                    <span className="text-[10.5px] font-medium text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5">
                      Get More Credits
                    </span>
                  </div>
                </button>
              </div>

              {/* Section Subheading */}
              <div className="mt-5 mb-3.5">
                <h3 className="text-base sm:text-[17px] font-bold text-zinc-900 dark:text-white">
                  Available Offers
                </h3>
                <p className="text-[12px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Watch ads from trusted partners and earn credits instantly.
                </p>
              </div>

              {/* Offers List */}
              <div className="space-y-2.5">
                {OFFERS.map((offer) => (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-200 dark:hover:border-zinc-700 bg-zinc-50/50 hover:bg-zinc-50 dark:bg-zinc-850/40 dark:hover:bg-zinc-850 transition-all group"
                  >
                    {/* Left: Offer Icon & Title */}
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {renderOfferIcon(offer.icon)}
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-bold text-zinc-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {offer.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                          {offer.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Reward Points & Watch Ad Button */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      {/* Reward */}
                      <div className="flex flex-col items-end leading-none">
                        <span className="text-[13.5px] font-black text-zinc-950 dark:text-white tracking-tight leading-none">
                          +{offer.reward}
                        </span>
                        <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 leading-none mt-0.5">
                          Credits
                        </span>
                      </div>

                      {/* Watch Ad Button */}
                      <button
                        onClick={() => handleStartWatchAd(offer)}
                        className="px-3 sm:px-3.5 py-1.5 rounded-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                      >
                        <span>Watch Ad</span>
                        <ArrowRight size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Info Banner */}
            <div className="mt-4 p-3 sm:p-3.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
                  <Info size={12} strokeWidth={2.5} />
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200 block sm:inline">
                    Your credits will be added instantly after completing the ad.
                  </span>{' '}
                  <span>Ads are provided by our trusted partners.</span>
                </div>
              </div>

              {/* Stylized Branding Note */}
              <div className="text-right shrink-0">
                <div className="font-serif italic font-semibold text-[11px] text-zinc-800 dark:text-zinc-200 leading-tight tracking-tight">
                  More Creators<br />
                  <span className="font-bold underline decoration-zinc-400 dark:decoration-zinc-500 underline-offset-2">
                    Bigger Possibilities.
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* SIMULATED AD PLAYER OVERLAY (When user watches an ad)    */}
      {/* ======================================================== */}
      {activeAd && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-white shadow-2xl overflow-hidden flex flex-col items-center text-center">
            
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Partner Ad • {activeAd.partnerName}
                </span>
              </div>
              <button 
                onClick={handleCloseAdPlayer}
                className="text-zinc-400 hover:text-white transition-colors text-xs font-semibold px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
              >
                {isCompleted ? 'Close' : 'Skip Ad ✕'}
              </button>
            </div>

            {/* Video Player Display Container */}
            <div className="w-full my-5 aspect-video rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden group">
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-blue-900/10 to-transparent" />

              {!isCompleted ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-3 ring-2 ring-white/20 animate-pulse">
                    <Play size={24} className="fill-white text-white ml-1" />
                  </div>
                  <p className="text-sm font-bold text-zinc-200">
                    Playing: {activeAd.title}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Reward unlocks in <span className="text-amber-400 font-bold">{countdown}s</span>
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    +{activeAd.reward} Credits Earned!
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Added to your SuviX balance (Total: {(currentCredits + activeAd.reward).toLocaleString()} Credits)
                  </p>
                </div>
              )}

              {/* Progress Bar at bottom */}
              <div className="absolute bottom-0 inset-x-0 h-1.5 bg-zinc-800">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${((activeAd.duration - countdown) / activeAd.duration) * 100}%` }}
                />
              </div>
            </div>

            {/* Bottom Actions */}
            {isCompleted ? (
              <button
                onClick={handleCloseAdPlayer}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg cursor-pointer"
              >
                Claim &amp; Continue
              </button>
            ) : (
              <p className="text-[12px] text-zinc-500">
                Please wait {countdown} seconds to receive your +{activeAd.reward} credits.
              </p>
            )}

          </div>
        </div>
      )}

      {/* Floating Success Celebration Toast */}
      {earnedAnimation && (
        <div className="fixed top-8 right-8 z-[10001] bg-zinc-950 text-white px-5 py-3 rounded-2xl border border-zinc-800 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100">Reward Added!</div>
            <div className="text-[11px] text-emerald-400 font-semibold">+{earnedAnimation} SuviX Credits credited</div>
          </div>
        </div>
      )}

    </div>
  );
};
