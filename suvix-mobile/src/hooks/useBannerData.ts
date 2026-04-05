import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// For mobile, we use the local dev IP or the production URL from our store
const DEFAULT_BACKEND = 'https://suvix-server.onrender.com';

/**
 * URL Repair logic mirrored exactly from web to ensure Cloudinary assets load correctly.
 */
const repairUrl = (url: string) => {
    if (!url || typeof url !== "string") return url;
    if (!url.includes("cloudinary") && !url.includes("res_") && !url.includes("_com")) return url;
    let fixed = url;
    fixed = fixed.replace(/^(https?):?\/*_+/gi, "$1://");
    fixed = fixed.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com").replace(/res_cloudinary_com/g, "res.cloudinary.com").replace(/cloudinary_com/g, "cloudinary.com");
    if (fixed.includes("res.cloudinary.com")) {
        fixed = fixed.replace(/res\.cloudinary\.com_+/g, "res.cloudinary.com/");
        fixed = fixed.replace(/image_upload_+/g, "image/upload/").replace(/video_upload_+/g, "video/upload/").replace(/raw_upload_+/g, "raw/upload/");
        fixed = fixed.replace(/([/_]?v\d+)_+/g, "$1/");
        fixed = fixed.replace(/(res\.cloudinary\.com\/[^/_]+)_+(image|video|raw|authenticated)_*/g, "$1/$2/");
        fixed = fixed.replace(/advertisements_images_+/g, "advertisements/images/").replace(/advertisements_videos_+/g, "advertisements/videos/").replace(/advertisements_gallery_+/g, "advertisements/gallery/");
        fixed = fixed.replace(/_+(upload|image|video|v\d+)_+/g, "/$1/");
        fixed = fixed.replace(/_([a-z0-9\-_]+\.(webp|jpg|jpeg|png|mp4|mov|m4v|json))/gi, "/$1");
        fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
    }
    return fixed;
};

// Professional Monochrome Fallbacks
const DEFAULT_BANNERS = [
    {
        _id: 'default_1',
        title: 'Welcome to SuviX',
        description: 'Discover the world\'s most talented video editors and creators.',
        mediaUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1200', // Elite Professional Studio
        mediaType: 'image',
        ctaText: 'START EXPLORING',
        badge: 'FEATURED',
        layoutConfig: {},
        buttonStyle: {},
        buttonLinkType: 'internal',
        buttonLink: '/(tabs)/explore',
    }
];

export const useBannerData = (pageName: 'home' | 'editors' | 'gigs' | 'jobs' | 'explore' = 'home') => {

  return useQuery({
    queryKey: ['ads', pageName],
    queryFn: async () => {
        try {
            let locations = "banners:home_0";
            if (pageName === "home")    locations = "banners:home_0,banners:home_1,banners:home_2";
            if (pageName === "editors") locations = "banners:editors";
            if (pageName === "gigs")    locations = "banners:gigs";
            if (pageName === "jobs")    locations = "banners:jobs";
            if (pageName === "explore") locations = "banners:explore";

            const { data } = await axios.get(`${DEFAULT_BACKEND}/api/ads?location=${locations}`);
            
            const ads = (data.ads || []).map((ad: any) => ({
                _id:            ad._id,
                title:          ad.title,
                description:    ad.description || ad.tagline || "",
                mediaUrl:       repairUrl(ad.mediaUrl),
                mediaType:      ad.mediaType,
                ctaText:        ad.ctaText || "Learn More",
                badge:          ad.badge || "PROMO",
                layoutConfig:   ad.layoutConfig || {},
                buttonStyle:    ad.buttonStyle  || {},
                buttonLinkType: ad.buttonLinkType || "ad_details",
                buttonLink:     ad.buttonLink || "",
            }));

            // If no ads found in DB, return professional defaults
            return ads.length > 0 ? ads : DEFAULT_BANNERS;
        } catch (error) {
            console.error('❌ [API] Banner Fetch Failed — Using Fallbacks:', error);
            return DEFAULT_BANNERS;
        }
    },
    staleTime: 600000, 
  });
};
