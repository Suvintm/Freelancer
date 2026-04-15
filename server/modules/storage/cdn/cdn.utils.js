/**
 * 🌐 CDN UTILITY HELPERS
 *
 * Functions for building CDN URLs, setting cache headers, and purging cache.
 * All parts of the app that return media URLs should use buildCdnUrl().
 *
 * TODO (Phase 5): Implement Cloudflare cache purge.
 */

import { CDN_BASE_URL } from "./cdn.config.js";

/**
 * Build a full CDN URL from an S3 object key
 * @param {string} key - S3/R2 object key (e.g., "images/user1/post1/720.webp")
 * @returns {string} - Full CDN URL
 */
export const buildCdnUrl = (key) => {
  return `${CDN_BASE_URL}/${key}`;
};

/**
 * Build the full set of CDN URLs for an image post
 * @param {string} userId
 * @param {string} postId
 * @returns {object} - { thumb, feed, full, og, cdnBase }
 */
export const buildImageUrls = (userId, postId) => {
  const base = `images/${userId}/${postId}`;
  return {
    cdnBase: `${CDN_BASE_URL}/${base}`,
    thumb: buildCdnUrl(`${base}/360.webp`),
    feed: buildCdnUrl(`${base}/720.webp`),
    full: buildCdnUrl(`${base}/1080.webp`),
    og: buildCdnUrl(`${base}/thumb.jpg`),
  };
};

/**
 * Build the CDN URLs for a video/reel post
 * @param {string} userId
 * @param {string} postId
 * @returns {object} - { hlsUrl, posterUrl }
 */
export const buildVideoUrls = (userId, postId) => {
  const base = `videos/${userId}/${postId}`;
  return {
    hlsUrl: buildCdnUrl(`${base}/master.m3u8`),
    posterUrl: buildCdnUrl(`${base}/poster.jpg`),
  };
};

/**
 * Purge a CDN cache key (Cloudflare API)
 * TODO (Phase 5): Implement Cloudflare Cache Purge API call
 * @param {string[]} urls - Array of CDN URLs to purge
 */
export const purgeCdnCache = async (urls) => {
  // TODO: POST to Cloudflare API /zones/{zone_id}/purge_cache
};

export default { buildCdnUrl, buildImageUrls, buildVideoUrls, purgeCdnCache };
