import { useState, useEffect, useCallback } from 'react';
import type { CreatorInfo, ProfileBlock } from '../types/profile.types';
import type { ResolvedTheme } from '../types/template.types';

const STORAGE_KEY_PREFIX = 'suvix_linkinbio_draft_';

export interface DraftData {
  templateSlug: string;
  themeConfig: ResolvedTheme;
  creator: CreatorInfo;
  blocks: ProfileBlock[];
  updatedAt: string;
}

export function useDraftPersistence(userId: string | undefined) {
  const storageKey = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}guest`;

  const loadDraft = useCallback((): DraftData | null => {
    try {
      const item = localStorage.getItem(storageKey);
      if (item) {
        return JSON.parse(item);
      }
    } catch (e) {
      console.warn('Failed to load draft from localStorage', e);
    }
    return null;
  }, [storageKey]);

  const saveDraft = useCallback((data: Omit<DraftData, 'updatedAt'>) => {
    try {
      const full: DraftData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(full));
    } catch (e) {
      console.warn('Failed to save draft to localStorage', e);
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Failed to clear draft', e);
    }
  }, [storageKey]);

  return { loadDraft, saveDraft, clearDraft };
}

export default useDraftPersistence;
