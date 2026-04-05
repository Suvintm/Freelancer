/**
 * media.ts
 * Utility functions for handling media URLs and fixing Cloudinary inconsistencies
 */

/**
 * Ensures a Cloudinary URL exists and has correct transformations for Android playback.
 * For the MP4 fallback, we MUST force H.264 to avoid decoder errors on Android devices.
 * @param url The raw media URL from the backend
 */
export const repairUrl = (url: string | undefined | null): string => {
  if (!url) return '';

  // 1. Ensure it's using HTTPS
  let repaired = url.replace('http://', 'https://');

  // 2. Production Hardening (Cloudinary specific)
  if (repaired.includes('res.cloudinary.com')) {
    // If it's already an HLS (.m3u8), we don't need to force mp4/h264
    if (repaired.endsWith('.m3u8')) {
      return repaired;
    }

    // 🚨 FORCE SAFE CODEC: 
    // We replace f_auto (which can return AV1/WebM) with f_mp4 and vc_h264.
    // This is the ONLY way to ensure 100% Android compatibility.
    if (!repaired.includes('/video/upload/')) {
        repaired = repaired.replace('/upload/', '/upload/f_mp4,vc_h264,q_auto,w_1080,c_limit/');
    } else {
        repaired = repaired.replace('/video/upload/', '/video/upload/f_mp4,vc_h264,q_auto,w_1080,c_limit/');
    }
    
    // Clean up any double transformations
    repaired = repaired.replace(/q_auto,f_auto,w_1080,c_limit\//g, '');
  }

  return repaired;
};
