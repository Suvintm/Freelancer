import React from 'react';
import type { ProfileVariantProps } from './CenteredVariant';
import { ProfileAvatar, ProfileNameBadge, ProfileBioBadge } from './ProfileHeaderAtoms';
import { BlockContainer } from '../../common/BlockContainer';

export const SplitVariant: React.FC<ProfileVariantProps> = ({ config, theme }) => {
  const displayName = config.title || config.displayName || 'Your Name';
  const bio = config.subtitle || config.bio || '';
  const badgeText = config.badgeText || '• Available';
  const imageUrl = config.imageUrl || config.avatarUrl || '';

  const textColor = theme?.colors?.text || '#ffffff';
  const textMutedColor = theme?.colors?.textMuted || '#e2e8f0';

  return (
    <BlockContainer
      taxonomy="hybrid"
      containerName="header"
      className="rounded-[calc(3.5*var(--du))] bg-white/10 dark:bg-black/20 border border-[max(1px,calc(0.35*var(--du)))] border-white/20 backdrop-blur-md shadow-md transition-all flex items-center"
      style={{
        padding: `calc(3*var(--du)) calc(3.5*var(--du))`,
        gap: `calc(3.5*var(--du))`,
      }}
    >
      {/* Left Avatar */}
      <ProfileAvatar
        imageUrl={imageUrl}
        name={displayName}
        shape={config.avatarShape || 'squircle'}
        du={14}
        showVerifiedBadge={false}
      />

      {/* Right Details */}
      <div className="flex-1 min-w-0 text-left">
        <ProfileNameBadge
          name={displayName}
          textColor={textColor}
          showVerifiedBadge={config.showVerifiedBadge !== false}
          du={4.4}
          className="mb-0"
        />

        <ProfileBioBadge
          bio={bio}
          badgeText={badgeText}
          textMutedColor={textMutedColor}
          du={3.0}
        />
      </div>
    </BlockContainer>
  );
};

export default SplitVariant;
