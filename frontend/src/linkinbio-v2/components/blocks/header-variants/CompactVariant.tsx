import React from 'react';
import type { ProfileVariantProps } from './CenteredVariant';
import { ProfileAvatar, ProfileNameBadge } from './ProfileHeaderAtoms';
import { BlockContainer } from '../../common/BlockContainer';

export const CompactVariant: React.FC<ProfileVariantProps> = ({ config, theme }) => {
  const displayName = config.title || config.displayName || 'Your Name';
  const imageUrl = config.imageUrl || config.avatarUrl || '';
  const badgeText = config.badgeText || '';

  const textColor = theme?.colors?.text || '#ffffff';

  return (
    <BlockContainer
      taxonomy="fixed-ratio"
      containerName="header"
      aspectRatio="16/3"
      className="rounded-full bg-white/10 dark:bg-black/20 border border-[max(1px,calc(0.35*var(--du)))] border-white/20 backdrop-blur-md shadow-sm transition-all flex items-center justify-between"
      style={{
        padding: `calc(1.8*var(--du)) calc(3.5*var(--du))`,
        gap: `calc(2.5*var(--du))`,
      }}
    >
      <div
        className="flex items-center min-w-0"
        style={{
          gap: `calc(2.2*var(--du))`,
        }}
      >
        <ProfileAvatar
          imageUrl={imageUrl}
          name={displayName}
          shape="circle"
          du={9}
          showVerifiedBadge={false}
        />

        <ProfileNameBadge
          name={displayName}
          textColor={textColor}
          showVerifiedBadge={config.showVerifiedBadge !== false}
          du={4.0}
        />
      </div>

      {badgeText && (
        <span
          className="font-bold rounded-full bg-white/20 text-white shrink-0"
          style={{
            fontSize: `calc(2.5*var(--du))`,
            padding: `calc(0.5*var(--du)) calc(1.8*var(--du))`,
          }}
        >
          {badgeText}
        </span>
      )}
    </BlockContainer>
  );
};

export default CompactVariant;
