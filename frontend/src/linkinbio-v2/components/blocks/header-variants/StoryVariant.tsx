import React from 'react';
import type { ProfileVariantProps } from './CenteredVariant';
import { ProfileAvatar, ProfileNameBadge, ProfileBioBadge } from './ProfileHeaderAtoms';
import { BlockContainer } from '../../common/BlockContainer';

export const StoryVariant: React.FC<ProfileVariantProps> = ({ config, theme }) => {
  const displayName = config.title || config.displayName || 'Your Name';
  const bio = config.subtitle || config.bio || '';
  const badgeText = config.badgeText || 'LIVE';
  const imageUrl = config.imageUrl || config.avatarUrl || '';
  const alignment = config.alignment || 'center';

  const alignClass =
    alignment === 'left' ? 'text-left items-start' : alignment === 'right' ? 'text-right items-end' : 'text-center items-center';

  const textColor = theme?.colors?.text || '#ffffff';
  const textMutedColor = theme?.colors?.textMuted || '#e2e8f0';

  return (
    <BlockContainer
      taxonomy="content-flow"
      containerName="header"
      className={`w-full flex flex-col ${alignClass} select-none transition-all`}
      style={{
        paddingTop: `calc(1.5*var(--du))`,
        paddingBottom: `calc(1.5*var(--du))`,
        gap: `calc(1.2*var(--du))`,
      }}
    >
      {/* Story Glow Aura Ring */}
      <ProfileAvatar
        imageUrl={imageUrl}
        name={displayName}
        shape={config.avatarShape || 'circle'}
        du={18}
        showVerifiedBadge={config.showVerifiedBadge !== false}
        isStoryGlow={true}
      />

      <div
        className="flex items-center justify-center"
        style={{
          gap: `calc(1.2*var(--du))`,
        }}
      >
        <ProfileNameBadge
          name={displayName}
          textColor={textColor}
          showVerifiedBadge={false}
          du={4.8}
        />
        {badgeText && (
          <span
            className="font-black rounded-md bg-rose-500 text-white shadow-xs tracking-wider animate-pulse"
            style={{
              fontSize: `calc(2.2*var(--du))`,
              padding: `calc(0.4*var(--du)) calc(1.4*var(--du))`,
            }}
          >
            {badgeText}
          </span>
        )}
      </div>

      <ProfileBioBadge
        bio={bio}
        textMutedColor={textMutedColor}
        du={3.2}
      />
    </BlockContainer>
  );
};

export default StoryVariant;
