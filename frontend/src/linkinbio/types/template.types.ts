// ─────────────────────────────────────────────────────────────────────────────
// template.types.ts
// Types for the template engine: configs, schema controls, editable sections
// ─────────────────────────────────────────────────────────────────────────────

import type { BlockType, CreatorInfo, ProfileBlock } from './profile.types';

// ── Theme Control Definitions ─────────────────────────────────────────────────

export interface ColorControl {
  type: 'color';
  label: string;
  default: string;
}

export interface FontControl {
  type: 'font';
  label: string;
  default: string;
  options: string[];
}

export interface RangeControl {
  type: 'range';
  label: string;
  default: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export interface SelectControl {
  type: 'select';
  label: string;
  default: string;
  options: string[];
}

export interface ToggleControl {
  type: 'toggle';
  label: string;
  default: boolean;
}

export type ThemeControl =
  | ColorControl
  | FontControl
  | RangeControl
  | SelectControl
  | ToggleControl;

/** The full theme schema: keys are camelCase property names, values define the UI control */
export type ThemeSchema = Record<string, ThemeControl>;

/** The resolved theme: keys map to actual user values (or defaults) */
export type ResolvedTheme = Record<string, string | number | boolean>;

// ── Editable Sections ─────────────────────────────────────────────────────────

export interface EditableSection {
  /** Must match the data-region-id used in the template's section wrappers */
  id: string;
  label: string;
  /** Lucide icon name to show in section indicator */
  icon: string;
  /** Human-readable description shown in right panel */
  description?: string;
}

// ── Template Supports (feature flags) ────────────────────────────────────────

export interface TemplateSupports {
  /** Can the user upload a background image for this template? */
  bgImage: boolean;
  /** Does this template show a removable logo/watermark? */
  logo: boolean;
  /** Does this template support custom fonts? */
  customFonts: boolean;
  /** Which icon styles this template exposes in its editors */
  iconStyles?: string[];
  /** Max number of blocks allowed */
  maxBlocks: number;
  /** Block types this template renders */
  supportedBlockTypes: BlockType[];
}

// ── Template Config ───────────────────────────────────────────────────────────

export interface TemplateConfig {
  /** Unique slug — must match the key in registry.ts */
  slug: string;
  /** Human-readable name shown in gallery */
  name: string;
  /** Short description shown in gallery card */
  description: string;
  /** Category badge shown in gallery: "clean" | "bold" | "professional" */
  category: string;
  /** Path to static thumbnail image (relative to /public) */
  thumbnail: string;
  /** Feature flags for this template */
  supports: TemplateSupports;
  /** Defines which sections are clickable in preview and what editor they open */
  editableSections: EditableSection[];
  /** Defines the theme controls available for this template */
  themeSchema: ThemeSchema;
}

// ── Template Props (passed to index.tsx + sections) ──────────────────────────

export interface TemplateRenderProps {
  creator: CreatorInfo;
  blocks: ProfileBlock[];
  theme: ResolvedTheme;
  /** True when rendered inside the studio builder preview */
  isEditing?: boolean;
  /** Fired when a section is clicked in editing mode */
  onSectionClick?: (regionId: string) => void;
  /** Which section is currently active (highlight in preview) */
  activeSection?: string | null;
}

// ── Validator ─────────────────────────────────────────────────────────────────

export interface TemplateValidator {
  /** Returns an error message string if invalid, or null if valid */
  validate: (creator: CreatorInfo, blocks: ProfileBlock[], theme: ResolvedTheme) => string | null;
}

// ── Full Template Definition (what registry.ts exports per template) ──────────

export interface TemplateDefinition {
  config: TemplateConfig;
  /** The public-facing render component */
  component: React.ComponentType<TemplateRenderProps>;
  /** The editor UI component shown in the right panel */
  editor: React.ComponentType<TemplateEditorProps>;
  /** Publish-time validation rules */
  validator: TemplateValidator;
}

// ── Editor Props (passed to each template's editor.tsx) ──────────────────────

export interface TemplateEditorProps {
  creator: CreatorInfo;
  blocks: ProfileBlock[];
  theme: ResolvedTheme;
  /** Which section the user clicked in the preview */
  activeSection: string | null;
  onThemeChange: (key: string, value: string | number | boolean) => void;
  onCreatorChange: (field: keyof CreatorInfo, value: string) => void;
  onBlockAdd: (type: BlockType) => void;
  onBlockUpdate: (id: string, data: Partial<ProfileBlock>) => void;
  onBlockRemove: (id: string) => void;
  onBlockReorder: (id: string, direction: 'up' | 'down') => void;
}
