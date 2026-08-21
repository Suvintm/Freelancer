import React from 'react';
import type { ProfileHeaderConfig } from '../../../types/block.types';
import type { Theme } from '../../../types/theme.types';
import { ProfileAvatar, ProfileNameBadge, ProfileBioBadge } from './ProfileHeaderAtoms';
import { BlockContainer } from '../../common/BlockContainer';

export interface ProfileVariantProps {
  config: ProfileHeaderConfig;
  theme?: Theme;
}

export const CenteredVariant: React.FC<ProfileVariantProps> = ({ config, theme }) => {
  const displayName = config.title || config.displayName || 'Your Name';
  const bio = config.subtitle || config.bio || '';
  const badgeText = config.badgeText || '';
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
      <ProfileAvatar
        imageUrl={imageUrl}
        name={displayName}
        shape={config.avatarShape}
        du={18}
        showVerifiedBadge={config.showVerifiedBadge !== false}
        className="mb-0"
      />

      <ProfileNameBadge
        name={displayName}
        textColor={textColor}
        showVerifiedBadge={config.showVerifiedBadge !== false}
        du={4.8}
        className="mb-0"
      />

      <ProfileBioBadge
        bio={bio}
        badgeText={badgeText}
        textMutedColor={textMutedColor}
        du={3.2}
      />
    </BlockContainer>
  );
};

export default CenteredVariant;
