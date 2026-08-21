import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Sparkles, ShieldCheck, Briefcase, Zap } from 'lucide-react';
import { FaYoutube, FaInstagram } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';

export const UnlinkedChannelModal: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { isDarkMode } = useTheme();

  const roleStr = (user?.role || '').toLowerCase();
  const categoryStr = (user?.primaryRole?.category || '').toLowerCase();
  const categorySlugStr = (user?.primaryRole?.categorySlug || '').toLowerCase();

  const isCreator =
    roleStr === 'creator' ||
    roleStr === 'yt_influencer' ||
    categoryStr === 'creator' ||
    categoryStr === 'youtube creator' ||
    categoryStr === 'yt_influencer' ||
    categorySlugStr === 'creator' ||
    categorySlugStr === 'yt_influencer' ||
    Boolean(user?.creatorProfile);

  // Only apply modal to Creators
  if (!user || !isCreator) {
    return null;
  }

  // Check if creator has at least ONE social account linked (YouTube OR Instagram)
  const hasYoutube = Boolean(
    (Array.isArray(user?.youtubeChannels) && user.youtubeChannels.length > 0) ||
    (Array.isArray(user?.youtubeProfile) && user.youtubeProfile.length > 0) ||
    user?.channelLinkStatus === 'LINKED' ||
    user?.channel_link_status === 'LINKED' ||
    Boolean(user?.creatorProfile?.channels && user.creatorProfile.channels.length > 0)
  );

  const hasInstagram = Boolean(
    user?.instagramProfile ||
    (Array.isArray(user?.instagramAccounts) && user.instagramAccounts.length > 0) ||
    Boolean(user?.creatorProfile?.instagramAccounts && user.creatorProfile.instagramAccounts.length > 0)
  );

  // If creator has linked at least one social account, do not show modal
  if (hasYoutube || hasInstagram) {
    return null;
  }

  const handleConnect = () => {
    navigate('/connect-socials');
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* ── PROFESSIONAL DUAL THEMED MODAL CARD (YouTube + Instagram) ── */}
      <div className={`w-full max-w-md rounded-3xl border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden font-sans transition-all ${
        isDarkMode 
          ? 'bg-[#121214] border-white/10 text-white' 
          : 'bg-white border-zinc-200 text-zinc-950'
      }`}>
        
        {/* Top Dual Ambient Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-purple-600 to-pink-500" />

        {/* Dual Platform Icon Hub (YouTube + Instagram) */}
        <div className="relative mb-5 mt-2 flex items-center justify-center">
          <div className="flex items-center -space-x-3">
            {/* YouTube Icon Circle */}
            <div className="w-14 h-14 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500 shadow-md backdrop-blur-md">
              <FaYoutube size={26} />
            </div>

            {/* Instagram Icon Circle */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-purple-600/20 border border-pink-500/30 flex items-center justify-center text-pink-500 shadow-md backdrop-blur-md">
              <FaInstagram size={26} />
            </div>
          </div>

          {/* Verification Lock Badge */}
          <div className="absolute -bottom-1.5 right-6 w-6 h-6 rounded-full bg-zinc-950 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-white shadow-md">
            <Lock size={11} strokeWidth={2.5} />
          </div>
        </div>

        {/* Creator Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-extrabold tracking-wider uppercase mb-3 border shadow-xs ${
          isDarkMode
            ? 'bg-white/5 border-white/10 text-zinc-300'
            : 'bg-zinc-100 border-zinc-200 text-zinc-700'
        }`}>
          <ShieldCheck size={13} className="text-red-500" />
          <span>Creator Profile Required</span>
        </div>

        {/* Header Title */}
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2">
          Connect Your Socials
        </h2>

        {/* Explanatory Body */}
        <p className={`text-xs sm:text-sm font-medium leading-relaxed mb-6 max-w-sm ${
          isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
        }`}>
          To access SuviX creator tools, hire video editors, and receive brand sponsorship deals, connect at least <strong className={isDarkMode ? 'text-white' : 'text-black'}>one YouTube channel or Instagram account</strong>.
        </p>

        {/* Bullet Perks List */}
        <div className={`w-full rounded-2xl p-4 border text-left space-y-2.5 mb-6 ${
          isDarkMode
            ? 'bg-white/[0.03] border-white/10'
            : 'bg-zinc-50 border-zinc-200/80'
        }`}>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="w-5 h-5 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <Sparkles size={11} />
            </div>
            <span className={isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}>
              Unlock Direct Brand Sponsorship Deals
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="w-5 h-5 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
              <Briefcase size={11} />
            </div>
            <span className={isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}>
              Hire Vetted Video Editors & Thumbnail Artists
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Zap size={11} />
            </div>
            <span className={isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}>
              Activate Verified Creator Badge on SuviX
            </span>
          </div>
        </div>

        {/* Primary Action Button (Navigates to /connect-socials) */}
        <button
          onClick={handleConnect}
          className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 hover:from-red-500 hover:via-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <span>Connect Social Profiles</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};
