import React from 'react';
import type { ProfileHeaderConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { PROFILE_VARIANTS, CenteredVariant } from './header-variants';

interface ProfileHeaderBlockProps {
  config: ProfileHeaderConfig;
  theme?: Theme;
}

export const ProfileHeaderBlock: React.FC<ProfileHeaderBlockProps> = ({ config, theme }) => {
  // Safe registry lookup with fallback to prevent public profile rendering crashes
  const VariantComponent = (config?.variant && PROFILE_VARIANTS[config.variant]) || CenteredVariant;

  return <VariantComponent config={config} theme={theme} />;
};

export default ProfileHeaderBlock;
