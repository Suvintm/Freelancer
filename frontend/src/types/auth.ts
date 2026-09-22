/**
 * Canonical Application Roles (Single Source of Truth)
 * Matches PostgreSQL schema UserRole enum: admin, user, creator, brand, editor
 */
export type AppRole = 'creator' | 'editor' | 'brand' | 'user' | 'admin';

export const APP_ROLES: readonly AppRole[] = ['creator', 'editor', 'brand', 'user', 'admin'] as const;
