// ─────────────────────────────────────────────────────────────────────────────
// studio.types.ts
// All studio-level state types: device mode, active section, studio state
// ─────────────────────────────────────────────────────────────────────────────

export type DeviceType = 'mobile' | 'laptop';

export type StudioTab = 'templates' | 'theme' | 'profile' | 'blocks';

export interface ActiveSection {
  /** The data-region-id of the clicked section, e.g. "header", "links", "social" */
  regionId: string;
  /** The block id if a specific block was clicked (for block editing) */
  blockId?: string;
}

export interface StudioState {
  /** Slug of currently selected template */
  templateSlug: string;
  /** Which device preview is active */
  device: DeviceType;
  /** Which section in the preview the user last clicked */
  activeSection: ActiveSection | null;
  /** Which top-level tab is open in the left panel */
  activeTab: StudioTab;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Whether publish is in progress */
  isPublishing: boolean;
}
