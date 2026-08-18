import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DeviceType, StudioTab } from '../types/studio.types';
import type { CreatorInfo, ProfileBlock, BlockType } from '../types/profile.types';
import type { ResolvedTheme } from '../types/template.types';
import { getTemplate, DEFAULT_TEMPLATE_SLUG } from '../templates/registry';
import { useDraftPersistence } from './useDraftPersistence';

export function useStudio(initialUser?: any) {
  const { loadDraft, saveDraft } = useDraftPersistence(initialUser?.id);

  // 1. Initial State Resolution
  const draft = useMemo(() => loadDraft(), [loadDraft]);

  const [templateSlug, setTemplateSlug] = useState<string>(
    draft?.templateSlug || DEFAULT_TEMPLATE_SLUG
  );

  const [device, setDevice] = useState<DeviceType>('mobile');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StudioTab>('templates');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // 2. Creator Info
  const [creator, setCreator] = useState<CreatorInfo>(() => {
    if (draft?.creator) return draft.creator;
    return {
      id: initialUser?.id || 'guest',
      username: initialUser?.username || 'nunabeauty',
      displayName: initialUser?.name || 'Nuna Beauty',
      bio: initialUser?.bio || 'Welcome to our link in bio page made on Many.bio!',
      profilePicture: initialUser?.profilePicture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      isVerified: Boolean(initialUser?.is_verified),
    };
  });

  // 3. Blocks List
  const [blocks, setBlocks] = useState<ProfileBlock[]>(() => {
    if (draft?.blocks && draft.blocks.length > 0) return draft.blocks;
    return [
      {
        id: 'block-1',
        type: 'LINK',
        title: 'Women haircuts',
        url: 'https://wa.me',
        orderIndex: 0,
        isVisible: true,
        metadata: {
          subtitle: 'contact by WhatsApp',
          thumbnail: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=120&auto=format&fit=crop&q=80',
        },
      },
      {
        id: 'block-2',
        type: 'LINK',
        title: 'Children haircuts',
        url: 'https://wa.me',
        orderIndex: 1,
        isVisible: true,
        metadata: {
          subtitle: 'contact by WhatsApp',
          thumbnail: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=120&auto=format&fit=crop&q=80',
        },
      },
      {
        id: 'block-3',
        type: 'LINK',
        title: 'Makeup',
        url: 'https://wa.me',
        orderIndex: 2,
        isVisible: true,
        metadata: {
          subtitle: 'contact by WhatsApp',
          thumbnail: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&auto=format&fit=crop&q=80',
        },
      },
      {
        id: 'block-4',
        type: 'LINK',
        title: 'Eyebrows & eyelashes',
        url: 'https://wa.me',
        orderIndex: 3,
        isVisible: true,
        metadata: {
          subtitle: 'contact by WhatsApp',
          thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120&auto=format&fit=crop&q=80',
        },
      },
    ];
  });

  // 4. Current Template definition & Theme Resolution
  const activeTemplateDef = useMemo(() => getTemplate(templateSlug), [templateSlug]);

  const [themeOverrides, setThemeOverrides] = useState<Record<string, any>>(() => {
    if (draft?.themeConfig) return draft.themeConfig;
    return {};
  });

  // Merge template defaults with user overrides
  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    const defaults: Record<string, any> = {};
    for (const [key, control] of Object.entries(activeTemplateDef.config.themeSchema)) {
      defaults[key] = (control as any)?.default;
    }
    return { ...defaults, ...themeOverrides };
  }, [activeTemplateDef, themeOverrides]);

  // 5. Auto-persist to localStorage whenever changes happen
  useEffect(() => {
    saveDraft({
      templateSlug,
      themeConfig: themeOverrides,
      creator,
      blocks,
    });
  }, [templateSlug, themeOverrides, creator, blocks, saveDraft]);

  // 6. Action Handlers
  const handleTemplateSelect = useCallback((slug: string) => {
    setTemplateSlug(slug);
    setIsDirty(true);
    // When switching templates, keep common values, reset section selection
    setActiveSection(null);
  }, []);

  const handleThemeChange = useCallback((key: string, value: any) => {
    setThemeOverrides((prev) => ({
      ...prev,
      [key]: value,
    }));
    setIsDirty(true);
  }, []);

  const handleCreatorChange = useCallback((field: keyof CreatorInfo, value: any) => {
    setCreator((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  }, []);

  const handleBlockAdd = useCallback((type: BlockType) => {
    const newBlock: ProfileBlock = {
      id: `block-${Date.now()}`,
      type,
      title: type === 'YOUTUBE_CHANNEL' ? 'YouTube Channel' : type === 'INSTAGRAM_PROFILE' ? 'Instagram Profile' : 'New Link',
      url: 'https://',
      orderIndex: blocks.length,
      isVisible: true,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setIsDirty(true);
  }, [blocks.length]);

  const handleBlockUpdate = useCallback((id: string, updates: Partial<ProfileBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    setIsDirty(true);
  }, []);

  const handleBlockRemove = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setIsDirty(true);
  }, []);

  const handleBlockReorder = useCallback((id: string, direction: 'up' | 'down') => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(idx, 1);
      updated.splice(targetIdx, 0, moved);
      return updated.map((b, i) => ({ ...b, orderIndex: i }));
    });
    setIsDirty(true);
  }, []);

  const handleSectionClick = useCallback((regionId: string) => {
    setActiveSection(regionId);
    // Switch to editing tab in sidebar
    setActiveTab('theme');
  }, []);

  return {
    templateSlug,
    activeTemplateDef,
    device,
    setDevice,
    activeSection,
    setActiveSection,
    activeTab,
    setActiveTab,
    isDirty,
    setIsDirty,
    creator,
    blocks,
    resolvedTheme,
    handleTemplateSelect,
    handleThemeChange,
    handleCreatorChange,
    handleBlockAdd,
    handleBlockUpdate,
    handleBlockRemove,
    handleBlockReorder,
    handleSectionClick,
  };
}

export default useStudio;
