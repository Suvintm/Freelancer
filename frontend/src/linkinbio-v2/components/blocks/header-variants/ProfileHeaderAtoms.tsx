import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { AvatarShape } from '../../../types/block.types';
import defaultProfile from '../../../../assets/defaultprofile.png';
import { ScaledIcon } from '../../common/ScaledIcon';

interface ProfileAvatarProps {
  imageUrl?: string;
  name: string;
  shape?: AvatarShape;
  /** Size in Design Units (e.g. 18 = 18 * var(--du)) */
  du?: number;
  showVerifiedBadge?: boolean;
  isStoryGlow?: boolean;
  className?: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  imageUrl,
  name,
  shape = 'circle',
  du = 18,
  showVerifiedBadge = true,
  isStoryGlow = false,
  className = '',
}) => {
  const avatarSrc = imageUrl || defaultProfile;

  // Shape classes
  const shapeClass =
    shape === 'squircle'
      ? 'rounded-[calc(4*var(--du))]'
      : shape === 'square'
      ? 'rounded-[calc(2.5*var(--du))]'
      : 'rounded-full';

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {/* Story Ring Gradient Wrapper */}
      <div
        className={`transition-all ${shapeClass} ${
          isStoryGlow
            ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 animate-pulse shadow-lg shadow-rose-500/30'
            : 'ring-[max(1.5px,calc(0.4*var(--du)))] ring-white/80 shadow-md bg-white/10'
        }`}
        style={{
          padding: `calc(0.4 * var(--du))`,
        }}
      >
        <div
          className={`overflow-hidden ${shapeClass} bg-zinc-800`}
          style={{
            width: `calc(${du} * var(--du))`,
            height: `calc(${du} * var(--du))`,
          }}
        >
          <img
            src={avatarSrc}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>

      {/* Verified Checkmark Badge with Scaled Proportions */}
      {showVerifiedBadge && (
        <div
          className="absolute rounded-full bg-[#4D6234] border border-white text-white flex items-center justify-center z-10 shadow-xs"
          style={{
            width: `calc(${du * 0.28} * var(--du))`,
            height: `calc(${du * 0.28} * var(--du))`,
            bottom: 0,
            right: 0,
            transform: 'translate(10%, 10%)',
          }}
        >
          <ScaledIcon
            icon={CheckCircle2}
            du={du * 0.22}
            color="#4D6234"
            fill="white"
            strokeWidth={2.5}
          />
        </div>
      )}
    </div>
  );
};

interface ProfileNameBadgeProps {
  name: string;
  textColor?: string;
  showVerifiedBadge?: boolean;
  className?: string;
  /** Font size in Design Units (e.g. 4.8 = 4.8 * var(--du)) */
  du?: number;
}

export const ProfileNameBadge: React.FC<ProfileNameBadgeProps> = ({
  name,
  textColor = '#ffffff',
  showVerifiedBadge = true,
  className = '',
  du = 4.8,
}) => {
  const displayName = name?.trim() || 'Your Name';

  return (
    <div className={`flex items-center min-w-0 ${className}`}>
      <h1
        style={{
          color: textColor,
          fontSize: `calc(${du} * var(--du))`,
          gap: `calc(0.8 * var(--du))`,
        }}
        className="font-black tracking-tight truncate flex items-center"
      >
        <span>{displayName}</span>
        {showVerifiedBadge && (
          <ScaledIcon
            icon={CheckCircle2}
            du={du * 0.85}
            color="#4D6234"
            fill="white"
            strokeWidth={2.5}
          />
        )}
      </h1>
    </div>
  );
};

interface ProfileBioBadgeProps {
  bio?: string;
  badgeText?: string;
  textMutedColor?: string;
  className?: string;
  /** Font size in Design Units (e.g. 3.2 = 3.2 * var(--du)) */
  du?: number;
}

export const ProfileBioBadge: React.FC<ProfileBioBadgeProps> = ({
  bio,
  badgeText,
  textMutedColor = '#e2e8f0',
  className = '',
  du = 3.2,
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `calc(0.8 * var(--du))`,
      }}
    >
      {badgeText && (
        <div className="inline-block">
          <span
            className="font-bold rounded-full bg-white/15 text-white/95 border border-white/20 backdrop-blur-xs shadow-2xs"
            style={{
              fontSize: `calc(${du * 0.85} * var(--du))`,
              padding: `calc(0.4 * var(--du)) calc(1.4 * var(--du))`,
            }}
          >
            {badgeText}
          </span>
        </div>
      )}
      {bio && (
        <p
          style={{
            color: textMutedColor,
            fontSize: `calc(${du} * var(--du))`,
            lineHeight: 1.35,
          }}
          className="max-w-sm font-normal text-white/80"
        >
          {bio}
        </p>
      )}
    </div>
  );
};
