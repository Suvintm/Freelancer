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
export const smartResolveMediaUrl = (storageKey, provider = "S3") => {
  if (!storageKey) return null;

  // 1. If it's already a clean SuviX CDN URL, return it
  if (CDN_BASE_URL && storageKey.startsWith(CDN_BASE_URL)) return storageKey;

  // 2. Determine the correct Base URL based on the Provider
  // Stories use R2 (via CDN), while Posts use S3 (or CDN if configured)
  const providerBase = provider === "R2" ? (CDN_BASE_URL || "") : S3_BASE_URL;
  const activeBase = CDN_BASE_URL || providerBase;

  // 3. If it's a raw S3/R2 URL belonging to our bucket, strip the bucket domain 
  // to force it through the SuviX Proxy (activeBase).
  if (providerBase && storageKey.startsWith(providerBase)) {
    const relativeKey = storageKey.replace(`${providerBase}/`, "");
    return `${activeBase}/${relativeKey}`;
  }

  // 4. If it's an external URL (not ours), return it as-is
  if (storageKey.startsWith('http')) return storageKey;

  // 5. Standard path: Prefix with activeBase
  const cleanKey = storageKey.startsWith('/') ? storageKey.substring(1) : storageKey;
  const finalUrl = `${activeBase}/${cleanKey}`;
  
  const isCdn = !!CDN_BASE_URL;
  console.log(`📡 [RESOLVER] ${isCdn ? '🚀 [CDN]' : '📦 [S3]'} ${cleanKey}`);

  return finalUrl;
};

/**
 * 👤 AVATAR RESOLVER
 */
export const resolveAvatarUrl = (userId, filename) => {
  if (!filename) return null;
  // Use smart resolver to handle mirrored YouTube profiles
  return smartResolveMediaUrl(filename.startsWith('http') || filename.includes('/') 
    ? filename 
    : `uploads/avatars/${userId}/${filename}`, "S3"); // Avatars currently in S3
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
  const { id, userId, type, status, blurhash, storageKey, variants, storage_provider = "S3" } = media;
  
  // 🧱 LEGACY & HYBRID CHECK: If we have a key, we can probably show it.
  const hasContent = (variants && Object.keys(variants).length > 0) || !!storageKey;

  if (status !== "READY" && !hasContent) {
    return { id, type, status, urls: null };
  }

  let urls = {};

  if (variants && Object.keys(variants).length > 0) {
    // 🚀 MODERN PATH: Map saved keys to absolute URLs using the correct provider
    urls = {
      hls: variants.hls ? smartResolveMediaUrl(variants.hls, storage_provider) : null,
      video: variants.video ? smartResolveMediaUrl(variants.video, storage_provider) : null,
      thumb: smartResolveMediaUrl(variants.thumb || variants.thumbnail, storage_provider),
      feed: smartResolveMediaUrl(variants.feed || variants.thumbnail, storage_provider),
      full: smartResolveMediaUrl(variants.full || variants.thumbnail, storage_provider),
    };
  } else {
    // 🧱 LEGACY PATH: Use old storageKey logic
    const path = smartResolveMediaUrl(storageKey, storage_provider);
    
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
