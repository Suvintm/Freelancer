// ─────────────────────────────────────────────────────────────────────────────
// useTemplateTheme.ts
// Hook: merges template default theme with user's saved overrides
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import type { ThemeSchema, ResolvedTheme } from '../../types/template.types';

/**
 * Produces the fully-resolved theme by:
 * 1. Starting with all defaults from the template's themeSchema
 * 2. Deep-merging the user's saved overrides on top
 *
 * This means missing keys always fall back to the template default —
 * so switching templates never leaves stale keys from a previous template.
 */
export function useTemplateTheme(
  schema: ThemeSchema,
  userOverrides: Record<string, unknown>
): ResolvedTheme {
  return useMemo(() => {
    const defaults: ResolvedTheme = {};
    for (const [key, control] of Object.entries(schema)) {
      defaults[key] = control.default as string | number | boolean;
    }
    return { ...defaults, ...userOverrides } as ResolvedTheme;
  }, [schema, userOverrides]);
}
