import { getApiBaseUrl } from '../api/client';

/**
 * PRODUCTION-GRADE MEDIA CONFIGURATION
 * Ported from web urlHelper.jsx to ensure zero "Black Screen" errors.
 * Handles mangled Cloudinary URLs, relative paths, and HLS streaming.
 */

export const MediaConfig = {
  /**
   * repairUrl - Fixes mangled Cloudinary URLs and ensures absolute paths.
   */
  repairUrl: (input: any): string => {
    if (!input) return '';

    let url = "";

    // 1. Extract URL if input is an object
    if (typeof input === "object") {
      url = input.url || input.secure_url || input.profilePicture || input.thumbnail || "";
      if (typeof url === "object") return MediaConfig.repairUrl(url);
    } else {
      url = input;
    }

    if (!url || typeof url !== "string") return url || '';

    // 2. Handle Relative Paths (Prefixed with /) or missing protocols
    if (url.startsWith('/') && !url.startsWith('//')) {
        const base = getApiBaseUrl().replace('/api', ''); 
        return `${base}${url}`;
    }

    // 3. Handle Mangled Cloudinary URLs (res_cloudinary_com etc.)
    if (url.includes("cloudinary") || url.includes("res_") || url.includes("_com")) {
      let fixed = url;
      fixed = fixed.replace(/^(https?):?\/*_+/gi, "$1://");
      fixed = fixed.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com")
                   .replace(/res_cloudinary_com/g, "res.cloudinary.com")
                   .replace(/cloudinary_com/g, "cloudinary.com");

      if (fixed.includes("res.cloudinary.com")) {
          fixed = fixed.replace(/res\.cloudinary\.com_+/g, "res.cloudinary.com/");
          fixed = fixed.replace(/image_upload_+/g, "image/upload/")
                       .replace(/video_upload_+/g, "video/upload/")
                       .replace(/raw_upload_+/g, "raw/upload/");
          fixed = fixed.replace(/([/_]?v\d+)_+/g, "$1/");
          fixed = fixed.replace(/(res\.cloudinary\.com\/[^/_]+)_+(image|video|raw|authenticated)_*/g, "$1/$2/");
          fixed = fixed.replace(/_+(upload|image|video|v\d+)_+/g, "/$1/");
          fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
      }

      fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1")
                   .replace(/_jpeg([/_?#]|$)/gi, ".jpeg$1")
                   .replace(/_png([/_?#]|$)/gi, ".png$1")
                   .replace(/_mp4([/_?#]|$)/gi, ".mp4$1")
                   .replace(/_webp([/_?#]|$)/gi, ".webp$1");

      return fixed;
    }

    return url;
  },

  /**
   * toAdaptiveStream - Converts raw video URL to HLS (m3u8).
   */
  toAdaptiveStream: (rawUrl: string): string => {
    const url = MediaConfig.repairUrl(rawUrl);
    if (!url) return '';
    
    // 1. If it's already HLS, return as is
    if (url.toLowerCase().includes('.m3u8') || url.includes('/sp_')) return url;

    // 2. Only apply Cloudinary logic if it's a Cloudinary URL
    if (url.includes('res.cloudinary.com')) {
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) return url;

        const baseUrl = url.substring(0, uploadIndex + 8);
        let remaining = url.substring(uploadIndex + 8);

        // Strip previous transforms to prevent conflicts
        remaining = remaining.replace(/^(f_auto|q_auto|w_\d+|c_[^/]+|vc_[^/]+),*[^/]*\//i, "");

        let hlsUrl = `${baseUrl}sp_auto/${remaining}`;
        // Extension swap
        const lastDot = hlsUrl.lastIndexOf('.');
        if (lastDot !== -1) {
            hlsUrl = hlsUrl.substring(0, lastDot) + '.m3u8';
        } else {
            hlsUrl += '.m3u8';
        }
        return hlsUrl;
    }

    return url;
  },

  /**
   * getPosterUrl - Safely generates a poster/thumbnail URL from a video URL.
   */
  getPosterUrl: (input: any): string => {
    let url = MediaConfig.repairUrl(input);
    if (!url) return '';

    // If it's Cloudinary, we can force a JPG
    if (url.includes("res.cloudinary.com")) {
        let poster = url.replace(/\.[^./\\]+$/, ".jpg");
        // Strip HLS profile if present
        if (poster.includes("/sp_")) {
            poster = poster.replace(/\/sp_[^/]+\//, "/upload/");
        }
        // Inject optimizations
        if (!poster.includes("/f_auto")) {
            poster = poster.replace("/upload/", "/upload/f_auto,q_auto,w_800,c_scale/");
        }
        return poster;
    }

    return url;
  },

  /**
   * toOptimizedImage - Injects image quality/format flags.
   */
  toOptimizedImage: (rawUrl: string, width: number = 500): string => {
    const url = MediaConfig.repairUrl(rawUrl);
    if (!url || !url.includes('res.cloudinary.com')) return url;
    
    if (url.includes('/upload/')) {
        return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
    }
    return url;
  }
};
