import { useState, useCallback } from 'react';
import type { CreatorInfo, ProfileBlock } from '../types/profile.types';
import type { ResolvedTheme, TemplateDefinition } from '../types/template.types';

interface PublishParams {
  userId?: string;
  templateDef: TemplateDefinition;
  creator: CreatorInfo;
  blocks: ProfileBlock[];
  theme: ResolvedTheme;
}

export function usePublish() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const publish = useCallback(async ({
    userId,
    templateDef,
    creator,
    blocks,
    theme,
  }: PublishParams): Promise<boolean> => {
    setError(null);
    setIsPublishing(true);

    try {
      // 1. Run template-specific publish validator
      const validationError = templateDef.validator.validate(creator, blocks, theme);
      if (validationError) {
        setError(validationError);
        setIsPublishing(false);
        return false;
      }

      // 2. Prepare payload
      const payload = {
        templateSlug: templateDef.config.slug,
        themeConfig: theme,
        creator,
        blocks,
        isActive: true,
        updatedAt: new Date().toISOString(),
      };

      // 3. Save to localStorage (and in Phase 8 to profile.api.ts)
      const storageKey = userId ? `suvix_link_in_bio_config_${userId}` : 'suvix_link_in_bio_config_default';
      localStorage.setItem(storageKey, JSON.stringify(payload));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setIsPublishing(false);
      return true;
    } catch (e: any) {
      setError(e?.message || 'Failed to publish profile. Please try again.');
      setIsPublishing(false);
      return false;
    }
  }, []);

  return { publish, isPublishing, error, success };
}

export default usePublish;
