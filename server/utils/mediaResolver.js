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
 * 👤 AVATAR RESOLVER
 */
export const resolveAvatarUrl = (userId, filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  return `${CDN_BASE_URL || S3_BASE_URL}/uploads/avatars/${userId}/${filename}`;
};

/**
 * 📦 MASTER RESOLVER (API PREP)
 */
export const resolveMediaForApi = (media) => {
  if (!media) return null;
  const { id, userId, type, status, blurhash } = media;
  
  if (status !== "READY") {
    return { id, type, status, urls: null };
  }

  const urls = type === "VIDEO" 
    ? resolveVideoUrls(userId, id) 
    : resolveImageUrls(userId, id);

  return {
    id,
    type,
    status,
    blurhash,
    urls,
    thumbnail: {
      id,
      url: urls.thumb,
      blurhash
    },
    thumbnailUrl: urls.thumb
  };
};

export default {
  resolveImageUrls,
  resolveVideoUrls,
  resolveAvatarUrl,
  resolveMediaForApi
};
