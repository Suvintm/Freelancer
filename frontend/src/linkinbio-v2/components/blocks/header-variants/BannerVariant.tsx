import React from 'react';
import type { ProfileVariantProps } from './CenteredVariant';
import { ProfileAvatar, ProfileNameBadge, ProfileBioBadge } from './ProfileHeaderAtoms';
import { BlockContainer } from '../../common/BlockContainer';
import { ScaledIcon } from '../../common/ScaledIcon';
import { UserPlus } from 'lucide-react';

export const BannerVariant: React.FC<ProfileVariantProps> = ({ config, theme }) => {
  const displayName = config.title || config.displayName || 'Your Name';
  const bio = config.subtitle || config.bio || '';
  const badgeText = config.badgeText || '';
  const imageUrl = config.imageUrl || config.avatarUrl || '';
  const bannerUrl =
    config.bannerUrl ||
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80';

  const textColor = theme?.colors?.text || '#ffffff';
  const textMutedColor = theme?.colors?.textMuted || '#e2e8f0';

  return (
    <BlockContainer
      taxonomy="fixed-ratio"
      containerName="header"
      aspectRatio="16/9"
      className="rounded-[calc(3.5*var(--du))] bg-white/10 dark:bg-black/20 border border-[max(1px,calc(0.35*var(--du)))] border-white/20 backdrop-blur-md shadow-lg"
    >
      {/* 1. Cover Banner: 48% of container height */}
      <div className="h-[48%] w-full overflow-hidden relative bg-zinc-800">
        <img
          src={bannerUrl}
          alt="Profile Banner"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* 2. Overlapping Profile Identity Area: 52% of container height */}
      <div
        className="relative z-10 flex flex-col justify-end"
        style={{
          height: '52%',
          padding: `calc(1.5 * var(--du)) calc(3.5 * var(--du)) calc(3 * var(--du))`,
        }}
      >
        {/* Top row: Overlapping Avatar + Follow Action Badge */}
        <div
          className="flex items-end justify-between"
          style={{
            marginTop: `calc(-5.5 * var(--du))`,
          }}
        >
          {/* Proportional Avatar */}
          <ProfileAvatar
            imageUrl={imageUrl}
            name={displayName}
            shape={config.avatarShape || 'circle'}
            du={17}
            showVerifiedBadge={config.showVerifiedBadge !== false}
            className="shadow-xl ring-[max(1.5px,calc(0.45*var(--du)))] ring-black/40 dark:ring-zinc-900"
          />

          {/* Action Badge */}
          <div
            className="flex items-center"
            style={{
              paddingBottom: `calc(0.8 * var(--du))`,
            }}
          >
            {badgeText ? (
              <span
                className="font-bold rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs"
                style={{
                  fontSize: `calc(2.5 * var(--du))`,
                  padding: `calc(0.8 * var(--du)) calc(2.2 * var(--du))`,
                }}
              >
                {badgeText}
              </span>
            ) : (
              <span
                className="font-bold rounded-full bg-white text-slate-900 shadow-xs flex items-center"
                style={{
                  fontSize: `calc(2.5 * var(--du))`,
                  padding: `calc(0.8 * var(--du)) calc(2.2 * var(--du))`,
                  gap: `calc(0.8 * var(--du))`,
                }}
              >
                <ScaledIcon icon={UserPlus} du={2.8} strokeWidth={2.5} />
                <span>Follow</span>
              </span>
            )}
          </div>
        </div>

        {/* Name & Bio */}
        <div
          className="text-left"
          style={{
            marginTop: `calc(1 * var(--du))`,
          }}
        >
          <ProfileNameBadge
            name={displayName}
            textColor={textColor}
            showVerifiedBadge={false}
            du={4.6}
            className="mb-0"
          />

          <ProfileBioBadge
            bio={bio}
            textMutedColor={textMutedColor}
            du={3.1}
          />
        </div>
      </div>
    </BlockContainer>
  );
};

export default BannerVariant;
