import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Youtube, AlertTriangle, ArrowRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';

export const UnlinkedChannelBanner: React.FC = () => {
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

  if (!user || !isCreator) {
    return null;
  }

  const isUnlinked =
    user.channelLinkStatus === 'UNLINKED' ||
    (user as any)?.channel_link_status === 'UNLINKED' ||
    (!user.youtubeChannels?.length && !user.youtubeProfile?.length);

  if (!isUnlinked) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 border-b border-amber-300/40 py-3.5 px-4 sm:px-6 relative z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700">Action Required</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                Unlinked Profile
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-800 mt-0.5">
              Link your YouTube Channel to unlock your Verified Creator badge, live analytics, and brand sponsorship requests.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/youtube-connect')}
          className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
        >
          <Youtube size={15} />
          <span>Connect Channel</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
