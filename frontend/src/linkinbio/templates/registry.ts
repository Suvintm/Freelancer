// ─────────────────────────────────────────────────────────────────────────────
// registry.ts
// The central registry mapping template slugs to their component, config, and validator.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import type { TemplateDefinition } from '../types/template.types';

// ── Template 1: Elegance & Beauty Flora ──────────────────────────────────────
import { eleganceFloraV1Config } from './elegance-flora-v1/config';
import { eleganceFloraV1Validator } from './elegance-flora-v1/validators';

export const templateRegistry: Record<string, TemplateDefinition> = {
  'elegance-flora-v1': {
    config: eleganceFloraV1Config,
    validator: eleganceFloraV1Validator,
    component: React.lazy(() => import('./elegance-flora-v1/index')),
    editor: React.lazy(() => import('./elegance-flora-v1/editor')),
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the template definition for a given slug, falling back to elegance-flora-v1 */
export function getTemplate(slug: string): TemplateDefinition {
  return templateRegistry[slug] ?? templateRegistry['elegance-flora-v1'];
}

/** Returns all template configs in display order for the gallery */
export function getAllTemplateConfigs() {
  return Object.values(templateRegistry).map((t) => t.config);
}

/** The default template slug */
export const DEFAULT_TEMPLATE_SLUG = 'elegance-flora-v1';

export type TemplateSlug = keyof typeof templateRegistry;
