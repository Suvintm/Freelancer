/**
 * PRODUCTION-GRADE MEDIA CONFIGURATION
 * Logic for Cloudinary, HLS Adaptive bitrates, and image optimizations.
 */

export const MediaConfig = {
  // Cloudinary Base URL if needed
  CLOUDINARY_BASE: 'https://res.cloudinary.com/suvix/video/upload/',

  // Quality settings for mobile (optimized for data usage/performance)
  VIDEO_TRANSFORMS: {
    LOW_RESL: 'q_auto:eco,f_auto,w_480',
    MEDIUM_RESL: 'q_auto:good,f_auto,w_720',
    HIGH_RESL: 'q_auto,f_auto',
    HLS: 'sp_hls_m3u8', // Production ready HLS adaptation
  },

  /**
   * Universal HLS Resolver
   * Converts any raw Cloudinary URL into an HLS adaptive stream.
   * Based on the "Millions of users" requirement for instant playback.
   */
  toAdaptiveStream: (rawUrl: string): string => {
    if (!rawUrl || !rawUrl.includes('cloudinary.com')) return rawUrl;
    
    // Ensure the player knows its an HLS stream by adding the m3u8 extension
    // Logic: replace /upload/ with /upload/sp_hls_m3u8/ and append .m3u8
    const base = rawUrl.split('/upload/').join('/upload/sp_auto:hls/');
    return base.endsWith('.m3u8') ? base : `${base.split('.')[0]}.m3u8`;
  },

  /**
   * Image Optimization for Thumbnails
   */
  toOptimizedImage: (rawUrl: string, width: number = 500): string => {
    if (!rawUrl || !rawUrl.includes('cloudinary.com')) return rawUrl;
    return rawUrl.replace('/upload/', `/upload/c_fill,g_auto,w_${width},q_auto,f_auto/`);
  }
};
