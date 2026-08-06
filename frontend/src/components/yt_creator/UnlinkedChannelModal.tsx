import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Youtube, Lock, ArrowRight, Sparkles, ShieldCheck, Video, Zap } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';

export const UnlinkedChannelModal: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

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
    !!user?.creatorProfile;

  // Only apply modal to YouTube Creators
  if (!user || !isCreator) {
    return null;
  }

  // Check if channel is unlinked
  const isUnlinked =
    user.channelLinkStatus === 'UNLINKED' ||
    (user as any)?.channel_link_status === 'UNLINKED' ||
    (!user.youtubeChannels?.length && !user.youtubeProfile?.length);

  if (!isUnlinked) {
    return null;
  }

  const handleConnect = () => {
    navigate('/youtube-connect');
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/70 backdrop-blur-md animate-fadeIn">
      {/* ── CLEAN GOOGLE/META INSPIRED DIALOG CARD ──────────────────────────── */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden font-sans">
        
        {/* Subtle Ambient Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />

        {/* Outer Icon Hub */}
        <div className="relative mb-5 mt-2">
          <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-sm">
            <Youtube size={32} strokeWidth={1.5} className="text-red-600" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-900 border-2 border-white flex items-center justify-center text-white">
            <Lock size={12} strokeWidth={2} />
          </div>
        </div>

        {/* Clean Meta-style Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-bold tracking-wider uppercase mb-3">
          <ShieldCheck size={13} className="text-red-600" />
          <span>Creator Verification Required</span>
        </div>

        {/* Header Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight leading-tight mb-2">
          Connect Your YouTube Channel
        </h2>

        {/* Explanatory Body */}
        <p className="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed mb-6">
          To access SuviX creator tools, hire video editors, and receive brand deals, you must link at least one active YouTube channel to verify your account.
        </p>

        {/* Bullet Perks List */}
        <div className="w-full bg-zinc-50/80 rounded-2xl p-4 border border-zinc-100 text-left space-y-2.5 mb-6">
          <div className="flex items-center gap-3 text-xs font-semibold text-zinc-800">
            <div className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Sparkles size={12} />
            </div>
            <span>Unlock Direct Brand Sponsorship Deals</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-zinc-800">
            <div className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Video size={12} />
            </div>
            <span>Hire Vetted Video Editors & Thumbnail Artists</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-zinc-800">
            <div className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Zap size={12} />
            </div>
            <span>Activate Verified Creator Badge on SuviX</span>
          </div>
        </div>

        {/* Primary Action Button (Clean Black & Red Accent) */}
        <button
          onClick={handleConnect}
          className="w-full h-13 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-zinc-950/20 transition-all duration-200 transform active:scale-[0.98] cursor-pointer"
        >
          <Youtube size={18} className="fill-red-500 text-red-500" />
          <span>Connect YouTube Channel Now</span>
          <ArrowRight size={16} strokeWidth={2} />
        </button>

        {/* Footnote Privacy Promise */}
        <p className="text-[11px] text-zinc-400 font-medium mt-4">
          Google Verified OAuth • Read-only Discovery • Instant Sync
        </p>
      </div>
    </div>
  );
};
