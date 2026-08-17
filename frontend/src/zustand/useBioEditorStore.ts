import { create } from 'zustand';
import type { BioPage } from '../linkinbio-v2/types/page.types';
import type { Block, BlockType, AnyBlockConfig } from '../linkinbio-v2/types/block.types';
import type { Theme } from '../linkinbio-v2/types/theme.types';
import { createNewBlock } from '../linkinbio-v2/registry/blockRegistry';
import { STARTER_TEMPLATES } from '../linkinbio-v2/registry/templateRegistry';
import { bioApiService } from '../linkinbio-v2/services/bioApiService';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface BioEditorState {
  // Page Data
  page: BioPage | null;
  selectedBlockId: string | null;
  hoveredBlockId: string | null;

  // Canvas / Viewport UI state
  previewDevice: DeviceType;
  isPreviewMode: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: Date | null;

  // History for Undo / Redo
  history: Array<{ blocks: Block[]; theme: Theme }>;
  historyIndex: number;

  // Actions
  initializePage: (pageData?: Partial<BioPage>) => void;
  loadTemplate: (templateId: string, title?: string, slug?: string) => void;
  setSelectedBlockId: (id: string | null) => void;
  setHoveredBlockId: (id: string | null) => void;
  setPreviewDevice: (device: DeviceType) => void;
  setIsPreviewMode: (enabled: boolean) => void;

  // Block Mutations
  updateBlockConfig: (blockId: string, configUpdates: Partial<AnyBlockConfig>) => void;
  addBlock: (type: BlockType, targetIndex?: number) => void;
  removeBlock: (blockId: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  toggleBlockVisibility: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;

  // Theme & Settings Mutations
  updateTheme: (themeUpdates: Partial<Theme>) => void;
  updateSettings: (settingsUpdates: Partial<BioPage['settings']>) => void;
  updatePageMeta: (meta: { title?: string; slug?: string; description?: string }) => void;

  // Undo / Redo Actions
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
  setHasUnsavedChanges: (val: boolean) => void;
  saveToCloud: () => Promise<boolean>;
  publishToCloud: () => Promise<boolean>;
}

export const useBioEditorStore = create<BioEditorState>((set, get) => ({
  page: null,
  selectedBlockId: null,
  hoveredBlockId: null,
  previewDevice: 'mobile',
  isPreviewMode: false,
  isSaving: false,
  hasUnsavedChanges: false,
  lastSavedAt: null,
  history: [],
  historyIndex: -1,

  initializePage: (pageData) => {
    const defaultTemplate = STARTER_TEMPLATES[0];
    const initialPage: BioPage = {
      id: pageData?.id || `bio_${Date.now()}`,
      userId: pageData?.userId || 'user_1',
      slug: pageData?.slug || 'my-links',
      title: pageData?.title || 'My Official Links',
      description: pageData?.description || 'Connect with me across all platforms.',
      status: pageData?.status || 'draft',
      isActive: pageData?.isActive ?? true,
      templateId: pageData?.templateId || defaultTemplate.id,
      templateVersion: pageData?.templateVersion || 1,
      draftBlocks: pageData?.draftBlocks || JSON.parse(JSON.stringify(defaultTemplate.defaultBlocks)),
      draftTheme: pageData?.draftTheme || JSON.parse(JSON.stringify(defaultTemplate.defaultTheme)),
      settings: pageData?.settings || {
        seo: {
          metaTitle: 'My Bio Link',
          metaDescription: 'Find all my links and projects in one place.',
        },
        analytics: {},
        advanced: {
          hideBranding: false,
          utmTracking: true,
        },
      },
      publishedSnapshot: pageData?.publishedSnapshot || null,
      publishedAt: pageData?.publishedAt || null,
      viewCount: pageData?.viewCount || 0,
      clickCount: pageData?.clickCount || 0,
      ctr: pageData?.ctr || 0,
      createdAt: pageData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set({
      page: initialPage,
      selectedBlockId: initialPage.draftBlocks[0]?.id || null,
      history: [{ blocks: JSON.parse(JSON.stringify(initialPage.draftBlocks)), theme: JSON.parse(JSON.stringify(initialPage.draftTheme)) }],
      historyIndex: 0,
      hasUnsavedChanges: false,
    });
  },

  loadTemplate: (templateId: string, title?: string, slug?: string) => {
    const template = STARTER_TEMPLATES.find((t) => t.id === templateId) || STARTER_TEMPLATES[0];
    const current = get().page;

    const clonedBlocks = template.defaultBlocks.map((b, idx) => ({
      ...JSON.parse(JSON.stringify(b)),
      id: `block_${Date.now()}_${idx}`,
      order: idx,
    }));

    const clonedTheme = JSON.parse(JSON.stringify(template.defaultTheme));

    const finalTitle = title || (current?.title ? current.title : `${template.name} Bio`);
    const finalSlug = slug || (current?.slug ? current.slug : template.category === 'creator' ? 'main' : template.category);

    const basePage: BioPage = current ? {
      ...current,
      title: finalTitle,
      slug: finalSlug,
      templateId: template.id,
      templateVersion: template.version,
      draftBlocks: clonedBlocks,
      draftTheme: clonedTheme,
      updatedAt: new Date().toISOString(),
    } : {
      id: `bio_${Date.now()}`,
      userId: 'user_current',
      slug: finalSlug,
      title: finalTitle,
      description: template.description,
      status: 'draft',
      isActive: false,
      isPrimary: false,
      templateId: template.id,
      templateVersion: template.version,
      draftBlocks: clonedBlocks,
      draftTheme: clonedTheme,
      settings: {
        seo: {
          metaTitle: `${finalTitle} • Bio`,
          metaDescription: template.description,
        },
        analytics: {},
        advanced: {
          hideBranding: false,
          utmTracking: true,
        },
      },
      publishedSnapshot: null,
      publishedAt: null,
      viewCount: 0,
      clickCount: 0,
      ctr: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set({
      page: basePage,
      selectedBlockId: clonedBlocks[0]?.id || null,
      history: [{ blocks: JSON.parse(JSON.stringify(clonedBlocks)), theme: JSON.parse(JSON.stringify(clonedTheme)) }],
      historyIndex: 0,
      hasUnsavedChanges: false,
    });
  },

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),
  setHoveredBlockId: (id) => set({ hoveredBlockId: id }),
  setPreviewDevice: (device) => set({ previewDevice: device }),
  setIsPreviewMode: (enabled) => set({ isPreviewMode: enabled }),

  updateBlockConfig: (blockId, configUpdates) => {
    const current = get().page;
    if (!current) return;

    const newBlocks = current.draftBlocks.map((block) => {
      if (block.id !== blockId) return block;
      return {
        ...block,
        config: {
          ...block.config,
          ...configUpdates,
        },
      };
    });

    set({
      page: { ...current, draftBlocks: newBlocks, updatedAt: new Date().toISOString() },
      hasUnsavedChanges: true,
    });
  },

  addBlock: (type, targetIndex) => {
    const current = get().page;
    if (!current) return;

    const insertIndex = targetIndex ?? current.draftBlocks.length;
    const newBlock = createNewBlock(type, insertIndex);

    const updatedBlocks = [...current.draftBlocks];
    updatedBlocks.splice(insertIndex, 0, newBlock);

    const normalizedBlocks = updatedBlocks.map((b, idx) => ({ ...b, order: idx }));

    set({
      page: { ...current, draftBlocks: normalizedBlocks, updatedAt: new Date().toISOString() },
      selectedBlockId: newBlock.id,
      hasUnsavedChanges: true,
    });
  },

  removeBlock: (blockId) => {
    const current = get().page;
    if (!current) return;

    const filtered = current.draftBlocks.filter((b) => b.id !== blockId);
    const normalized = filtered.map((b, idx) => ({ ...b, order: idx }));

    set({
      page: { ...current, draftBlocks: normalized, updatedAt: new Date().toISOString() },
      selectedBlockId: get().selectedBlockId === blockId ? null : get().selectedBlockId,
      hasUnsavedChanges: true,
    });
  },

  moveBlock: (fromIndex, toIndex) => {
    const current = get().page;
    if (!current) return;

    const items = [...current.draftBlocks];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);

    const reordered = items.map((b, idx) => ({ ...b, order: idx }));

    set({
      page: { ...current, draftBlocks: reordered, updatedAt: new Date().toISOString() },
      hasUnsavedChanges: true,
    });
  },

  toggleBlockVisibility: (blockId) => {
    const current = get().page;
    if (!current) return;

    const updated = current.draftBlocks.map((b) =>
      b.id === blockId ? { ...b, isVisible: !b.isVisible } : b
    );

    set({
      page: { ...current, draftBlocks: updated, updatedAt: new Date().toISOString() },
      hasUnsavedChanges: true,
    });
  },

  duplicateBlock: (blockId) => {
    const current = get().page;
    if (!current) return;

    const index = current.draftBlocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;

    const target = current.draftBlocks[index];
    const duplicated: Block = {
      ...JSON.parse(JSON.stringify(target)),
      id: `block_${Date.now()}_dup`,
      order: index + 1,
    };

    const updated = [...current.draftBlocks];
    updated.splice(index + 1, 0, duplicated);
    const normalized = updated.map((b, idx) => ({ ...b, order: idx }));

    set({
      page: { ...current, draftBlocks: normalized, updatedAt: new Date().toISOString() },
      selectedBlockId: duplicated.id,
      hasUnsavedChanges: true,
    });
  },

  updateTheme: (themeUpdates) => {
    const current = get().page;
    if (!current) return;

    const newTheme: Theme = {
      ...current.draftTheme,
      ...themeUpdates,
      background: { ...current.draftTheme.background, ...themeUpdates.background },
      typography: { ...current.draftTheme.typography, ...themeUpdates.typography },
      buttons: { ...current.draftTheme.buttons, ...themeUpdates.buttons },
      spacing: { ...current.draftTheme.spacing, ...themeUpdates.spacing },
      colors: { ...current.draftTheme.colors, ...themeUpdates.colors },
    };

    set({
      page: { ...current, draftTheme: newTheme, updatedAt: new Date().toISOString() },
      hasUnsavedChanges: true,
    });
  },

  updateSettings: (settingsUpdates) => {
    const current = get().page;
    if (!current) return;

    set({
      page: {
        ...current,
        settings: { ...current.settings, ...settingsUpdates },
        updatedAt: new Date().toISOString(),
      },
      hasUnsavedChanges: true,
    });
  },

  updatePageMeta: (meta) => {
    const current = get().page;
    if (!current) return;

    set({
      page: {
        ...current,
        ...meta,
        updatedAt: new Date().toISOString(),
      },
      hasUnsavedChanges: true,
    });
  },

  undo: () => {
    const { history, historyIndex, page } = get();
    if (historyIndex > 0 && page) {
      const prev = history[historyIndex - 1];
      set({
        historyIndex: historyIndex - 1,
        page: {
          ...page,
          draftBlocks: JSON.parse(JSON.stringify(prev.blocks)),
          draftTheme: JSON.parse(JSON.stringify(prev.theme)),
        },
        hasUnsavedChanges: true,
      });
    }
  },

  redo: () => {
    const { history, historyIndex, page } = get();
    if (historyIndex < history.length - 1 && page) {
      const next = history[historyIndex + 1];
      set({
        historyIndex: historyIndex + 1,
        page: {
          ...page,
          draftBlocks: JSON.parse(JSON.stringify(next.blocks)),
          draftTheme: JSON.parse(JSON.stringify(next.theme)),
        },
        hasUnsavedChanges: true,
      });
    }
  },

  markSaved: () => {
    set({
      isSaving: false,
      hasUnsavedChanges: false,
      lastSavedAt: new Date(),
    });
  },

  setHasUnsavedChanges: (val: boolean) => {
    set({ hasUnsavedChanges: val });
  },

  saveToCloud: async () => {
    const { page, isSaving } = get();
    if (!page || isSaving) return false;

    set({ isSaving: true });
    try {
      // If page is stored on backend (valid UUID), call API
      if (page.id && !page.id.startsWith('bio_')) {
        await bioApiService.saveDraft(page.id, {
          title: page.title,
          slug: page.slug,
          description: page.description,
          draftBlocks: page.draftBlocks,
          draftTheme: page.draftTheme,
          settings: page.settings,
        });
      }

      // Always save local mirror backup (100% crash protection)
      try {
        localStorage.setItem(`suvix_bio_draft_${page.slug}`, JSON.stringify(page));
      } catch {
        // localStorage quota ignore
      }

      set({
        isSaving: false,
        hasUnsavedChanges: false,
        lastSavedAt: new Date(),
      });
      return true;
    } catch (err) {
      console.error('[useBioEditorStore] Cloud save failed:', err);
      set({ isSaving: false });
      return false;
    }
  },

  publishToCloud: async () => {
    const { page, isSaving } = get();
    if (!page || isSaving) return false;

    set({ isSaving: true });
    try {
      if (page.id && !page.id.startsWith('bio_')) {
        await bioApiService.publishPage(page.id);
      }

      set({
        isSaving: false,
        hasUnsavedChanges: false,
        lastSavedAt: new Date(),
        page: {
          ...page,
          status: 'published',
          publishedAt: new Date().toISOString(),
        },
      });
      return true;
    } catch (err) {
      console.error('[useBioEditorStore] Cloud publish failed:', err);
      set({ isSaving: false });
      return false;
    }
  },
}));
