import type { TemplateValidator } from '../../types/template.types';
import type { CreatorInfo, ProfileBlock } from '../../types/profile.types';
import type { ResolvedTheme } from '../../types/template.types';

export const eleganceFloraV1Validator: TemplateValidator = {
  validate: (
    creator: CreatorInfo,
    _blocks: ProfileBlock[],
    _theme: ResolvedTheme
  ): string | null => {
    if (!creator.displayName?.trim()) {
      return 'Please enter your brand or business name (e.g. Nuna Beauty).';
    }
    return null;
  },
};
