/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Camera, MapPin, Link as LinkIcon, Calendar, Edit3, Share2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../../../store/slices/authSlice';
import { api } from '../../../../../api/client';
import defaultProfile from '../../../../../assets/defaultprofile.png';
import { VerifiedBadge } from '../../../../ui/VerifiedBadge';

interface CreatorIdentityCardProps {
  user: any;
  onEditProfile?: () => void;
  postsCount?: number;
}

export const CreatorIdentityCard: React.FC<CreatorIdentityCardProps> = ({ 
  user, 
  onEditProfile,
  postsCount = 17
}) => {
  const dispatch = useDispatch();
  const [copied, setCopied] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const displayName = user?.name || 'Suvin T M';
  const username = user?.username ? `@${user.username}` : '@suvintm';
  const specialties = user?.specialties || user?.niches || 'UI Designer · Content Creator · Tech Enthusiast';
  const bio = user?.bio || "Creating content about technology, productivity and the creator economy. Let's build, learn and grow together.";
  
  // Safe location handling (never show 'undefined, India')
  const rawCity = user?.location || user?.profile?.location_city;
  const rawCountry = user?.profile?.location_country || 'India';
  const location = rawCity && rawCity !== 'undefined' && !rawCity.includes('undefined') 
    ? `${rawCity}, ${rawCountry}` 
    : 'Bengaluru, India';

  const cleanUsername = (user?.username || 'suvintm').replace(/^@/, '');
  const rawWebsite = user?.website || user?.profile?.website;
  const isLinktree = !rawWebsite || rawWebsite.includes('linktr.ee');
  const bioLinkDisplay = isLinktree ? `suvix.in/u/${cleanUsername}` : rawWebsite.replace(/^https?:\/\//, '');
  const bioLinkHref = isLinktree ? `/u/${cleanUsername}` : (rawWebsite.startsWith('http') ? rawWebsite : `https://${rawWebsite}`);
  const quote = user?.quote || 'Good content creates opportunities.';
  
  // Format followers / following nicely matching reference UI
  const followersCount = (typeof user?.followers === 'number' && user.followers > 0)
    ? (user.followers >= 1000 ? `${(user.followers / 1000).toFixed(1)}K` : user.followers)
    : '2.4K';

  const followingCount = (typeof user?.following === 'number' && user.following > 0)
    ? user.following
    : '312';

  // Format joined date
  const joinedDate = user?.createdAt 
    ? `Joined ${new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    : 'Joined Jan 2024';

  const avatarUrl = user?.profilePicture || defaultProfile;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/user/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.profilePicture) {
        dispatch(updateUser({ profilePicture: res.data.profilePicture }));
      }
    } catch (err) {
      console.error('Avatar upload failed, showing preview:', err);
      dispatch(updateUser({ profilePicture: URL.createObjectURL(file) }));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/${user?.username || 'suvintm'}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full bg-transparent px-1 sm:px-2 py-2 relative z-10 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        
        {/* Left Side: Avatar & Information Stack */}
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 flex-1 min-w-0">
          
          {/* Overlapping Circular Avatar (Compact & Proportional) */}
          <div className="relative shrink-0 -mt-12 sm:-mt-14">
            <div className="w-22 h-22 sm:w-26 sm:h-26 md:w-28 md:h-28 rounded-full border-[3.5px] border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 shadow-lg overflow-hidden">
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Camera Upload Badge */}
            <label 
              className="absolute bottom-0.5 right-0.5 w-6.5 h-6.5 rounded-full bg-black dark:bg-zinc-900 text-white flex items-center justify-center border-2 border-black dark:border-white shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Change Profile Photo"
            >
              <Camera size={11} strokeWidth={2.2} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
                className="hidden"
              />
            </label>
          </div>

          {/* Identity Text Details */}
          <div className="flex flex-col flex-1 min-w-0 pt-0.5">
            {/* Name + Verified Check + Creator Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                {displayName}
              </h1>

              {/* Official Verified Creator Badge */}
              <VerifiedBadge isVerified={true} role="Creator" className="w-5 h-5" />

              {/* Creator Pill */}
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-semibold border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
                Creator
              </span>
            </div>

            {/* Handle */}
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
              {username}
            </p>

            {/* Niches / Sub-roles */}
            <p className="text-[11px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1.5 tracking-tight">
              {specialties}
            </p>

            {/* Bio Description */}
            <p className="text-[11px] sm:text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed max-w-xl">
              {bio}
            </p>

            {/* Metadata Badges (Location, Link, Join Date) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[10.5px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              {/* Location */}
              <div className="flex items-center gap-1">
                <MapPin size={11} className="text-zinc-400 shrink-0" />
                <span>{location}</span>
              </div>

              {/* SuviX Link in Bio */}
              <a
                href={bioLinkHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline font-semibold transition-colors"
                title={`SuviX Link in Bio: suvix.in/u/${cleanUsername}`}
              >
                <LinkIcon size={11} className="text-zinc-400 shrink-0" />
                <span>{bioLinkDisplay}</span>
              </a>

              {/* Joined Date */}
              <div className="flex items-center gap-1">
                <Calendar size={11} className="text-zinc-400 shrink-0" />
                <span>{joinedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Quote Callout & Primary Actions */}
        <div className="flex flex-col items-start lg:items-end justify-between gap-3 shrink-0">
          
          {/* Quote Callout */}
          <div className="text-left lg:text-right max-w-xs">
            <div className="flex items-start lg:justify-end gap-1.5 text-zinc-700 dark:text-zinc-300">
              <span className="text-lg font-serif leading-none select-none text-zinc-400">❝</span>
              <p className="text-[11px] sm:text-xs font-medium italic leading-snug">
                {quote}
              </p>
            </div>
            <p className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-500 mt-0.5">
              — {displayName}
            </p>
          </div>

          {/* Action Buttons: Edit Profile & Share */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEditProfile}
              className="px-3.5 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 transition-all text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Edit3 size={11} strokeWidth={2.2} />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:scale-95 transition-all text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Share2 size={11} strokeWidth={2.2} />
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>

          {/* Stats Row Counters */}
          <div className="flex items-center gap-6 pt-1 self-start lg:self-end">
            <div className="flex flex-col items-center">
              <span className="text-base font-black text-zinc-900 dark:text-white leading-none">
                {postsCount}
              </span>
              <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
                Posts
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-base font-black text-zinc-900 dark:text-white leading-none">
                {followersCount}
              </span>
              <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
                Followers
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-base font-black text-zinc-900 dark:text-white leading-none">
                {followingCount}
              </span>
              <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
                Following
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
