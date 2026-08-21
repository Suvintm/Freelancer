import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { FaYoutube, FaInstagram } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';

export const UnlinkedChannelBanner: React.FC = () => {
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

  if (!user || !isCreator) {
    return null;
  }

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

  // If at least one social account is linked, do not show banner
  if (hasYoutube || hasInstagram) {
    return null;
  }

  return (
    <div className={`w-full border-b py-3 px-4 sm:px-6 relative z-30 backdrop-blur-md transition-colors ${
      isDarkMode 
        ? 'bg-gradient-to-r from-red-950/40 via-purple-950/40 to-pink-950/40 border-white/10' 
        : 'bg-gradient-to-r from-red-50 via-purple-50 to-pink-50 border-purple-200/60'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-500 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Action Required</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/30">
                Unlinked Creator
              </span>
            </div>
            <p className={`text-xs font-semibold mt-0.5 ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
              Connect your YouTube Channel or Instagram Account to unlock your Verified Creator badge, live analytics, and brand deals.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/connect-socials')}
          className="h-9 px-4 rounded-xl bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 hover:from-red-500 hover:via-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-pink-600/20 transition-all flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <FaYoutube size={13} />
            <FaInstagram size={13} />
          </div>
          <span>Connect Socials</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
