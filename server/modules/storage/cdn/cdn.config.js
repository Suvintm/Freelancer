/**
 * 🌐 CDN CONFIGURATION
 *
 * Central configuration for CDN URL building and Cloudflare integration.
 *
 * Strategy:
 * - All media URLs returned from the API use the CDN base URL
 * - S3/R2 origin is NEVER exposed to clients directly
 * - Cache-Control headers set per content type
 *
 * TODO (Phase 5): Add Cloudflare Cache Purge API integration.
 */

export const CDN_BASE_URL = process.env.CDN_BASE_URL || "https://cdn.suvix.in";

/**
 * Cache-Control header presets
 */
export const CACHE_HEADERS = {
  // Versioned assets — cached forever (new upload = new URL)
  IMMUTABLE: "public, max-age=31536000, immutable",
  // Standard media — 24 hours
  DEFAULT: "public, max-age=86400",
  // Stories — 1 hour (they expire anyway)
  STORIES: "public, max-age=3600",
  // Private/signed content — never cache
  PRIVATE: "private, no-cache, no-store, must-revalidate",
};

export default { CDN_BASE_URL, CACHE_HEADERS };
