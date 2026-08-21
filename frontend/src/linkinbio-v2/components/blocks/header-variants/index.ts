import React from 'react';
import type { ProfileVariant } from '../../../types/block.types';
import type { ProfileVariantProps } from './CenteredVariant';
import { CenteredVariant } from './CenteredVariant';
import { BannerVariant } from './BannerVariant';
import { SplitVariant } from './SplitVariant';
import { CompactVariant } from './CompactVariant';
import { StoryVariant } from './StoryVariant';

export const PROFILE_VARIANTS: Record<ProfileVariant, React.FC<ProfileVariantProps>> = {
  centered: CenteredVariant,
  banner: BannerVariant,
  split: SplitVariant,
  compact: CompactVariant,
  story: StoryVariant,
};

export { CenteredVariant, BannerVariant, SplitVariant, CompactVariant, StoryVariant };
