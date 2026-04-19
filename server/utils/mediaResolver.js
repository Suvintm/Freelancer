/**
 * 🛰️ SUVIX MEDIA RESOLVER (SINGLE SOURCE OF TRUTH)
 * 
 * Every media URL in the entire SuviX ecosystem must pass through this file.
 */

const CDN_BASE_URL = process.env.CDN_BASE_URL || "";
const S3_BUCKET = process.env.AWS_S3_BUCKET;
const S3_REGION = process.env.AWS_REGION || "ap-south-1";

const S3_BASE_URL = S3_BUCKET 
  ? `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`
  : "";

const BASE_URL = CDN_BASE_URL || S3_BASE_URL;

/**
 * 🖼️ IMAGE RESOLVER
 */
export const resolveImageUrls = (userId, mediaId) => {
  const base = `${BASE_URL}/uploads/processed/images/${userId}/${mediaId}`;
  
  return {
    thumb: `${base}/thumb.webp`,
    feed: `${base}/feed.webp`,
    full: `${base}/full.webp`,
    cdnUsed: !!CDN_BASE_URL
  };
};

/**
 * 🎬 VIDEO RESOLVER
 */
export const resolveVideoUrls = (userId, mediaId) => {
  const base = `${BASE_URL}/uploads/processed/videos/${userId}/${mediaId}`;
  
  return {
    hls: `${base}/hls/master.m3u8`,
    video: `${base}/optimized.mp4`,
    fallback: `${base}/optimized.mp4`,
    thumb: `${base}/thumbnail.webp`,
    cdnUsed: !!CDN_BASE_URL
  };
};

/**
 * 🛰️ SMART MEDIA RESOLVER
 * Converts any S3 path or raw URL into a finalized SuviX Proxy URL (cdn.suvix.in).
 * Handles backward compatibility for full S3 URLs stored in DB.
 */
export const smartResolveMediaUrl = (storageKey) => {
  if (!storageKey) return null;

  // 1. If it's already a clean SuviX CDN URL, return it
  if (CDN_BASE_URL && storageKey.startsWith(CDN_BASE_URL)) return storageKey;

  // 2. If it's a raw S3 URL belonging to our bucket, strip the bucket domain 
  // to force it through the SuviX Proxy (BASE_URL).
  if (S3_BASE_URL && storageKey.startsWith(S3_BASE_URL)) {
    const relativeKey = storageKey.replace(`${S3_BASE_URL}/`, "");
    return `${BASE_URL}/${relativeKey}`;
  }

  // 3. If it's an external URL (not ours), return it as-is
  if (storageKey.startsWith('http')) return storageKey;

  // 4. Standard path: Prefix with BASE_URL
  const cleanKey = storageKey.startsWith('/') ? storageKey.substring(1) : storageKey;
  return `${BASE_URL}/${cleanKey}`;
};

/**
 * 👤 AVATAR RESOLVER
 */
export const resolveAvatarUrl = (userId, filename) => {
  if (!filename) return null;
  // Use smart resolver to handle mirrored YouTube profiles
  return smartResolveMediaUrl(filename.startsWith('http') || filename.includes('/') 
    ? filename 
    : `uploads/avatars/${userId}/${filename}`);
};

/**
 * 📦 MASTER RESOLVER (API PREP)
 * 
 * "Smart Resolution" Bridge:
 * 1. If 'variants' exist (modern post) -> use them with highest priority.
 * 2. If 'variants' missing (legacy post) -> fallback to raw 'storageKey'.
 */
export const resolveMediaForApi = (media) => {
  if (!media) return null;
  const { id, userId, type, status, blurhash, storageKey, variants } = media;
  
  // 🧱 LEGACY & HYBRID CHECK: If we have a key, we can probably show it.
  const hasContent = (variants && Object.keys(variants).length > 0) || !!storageKey;

  if (status !== "READY" && !hasContent) {
    return { id, type, status, urls: null };
  }

  let urls = {};

  if (variants && Object.keys(variants).length > 0) {
    // 🚀 MODERN PATH: Map saved S3 keys to absolute URLs
    urls = {
      hls: variants.hls ? smartResolveMediaUrl(variants.hls) : null,
      video: variants.video ? smartResolveMediaUrl(variants.video) : null,
      thumb: smartResolveMediaUrl(variants.thumb || variants.thumbnail),
      feed: smartResolveMediaUrl(variants.feed || variants.thumbnail),
      full: smartResolveMediaUrl(variants.full || variants.thumbnail),
    };
  } else {
    // 🧱 LEGACY PATH: Use old storageKey logic
    const path = smartResolveMediaUrl(storageKey);
    
    if (type === "VIDEO") {
      urls = {
        hls: null, 
        video: path,
        fallback: path,
        thumb: null
      };
    } else {
      urls = {
        thumb: path,
        feed: path,
        full: path
      };
    }
  }

  return {
    id,
    type,
    status: status === "READY" || hasContent ? "READY" : status, // Normalize status for UI
    blurhash,
    urls,
    thumbnail: {
      id,
      url: urls.thumb,
      blurhash,
      status: status === "READY" || hasContent ? "READY" : status
    },
    thumbnailUrl: urls.thumb
  };
};

export default {
  resolveImageUrls,
  resolveVideoUrls,
  resolveAvatarUrl,
  resolveMediaForApi,
  smartResolveMediaUrl
};
