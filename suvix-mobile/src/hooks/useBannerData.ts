import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// For mobile, we use the local dev IP or the production URL from our store
const DEFAULT_BACKEND = 'https://suvix-server.onrender.com';

/**
 * URL Repair logic mirrored exactly from web to ensure Cloudinary assets load correctly.
 */
const repairUrl = (url: any) => {
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

// Professional Monochrome & Video Defaults
const DEFAULT_BANNERS = [
    // --- LEVEL 0: HOME BANNERS ---
    {
        _id: 'l0_1',
        title: 'Premium Video Editing',
        description: 'Elite editors at your fingertips. Transform your raw footage into cinematic masterpieces.',
        mediaUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1200',
        mediaType: 'image',
        ctaText: 'SEE PORTFOLIO',
        badge: 'ELITE',
        displayLocations: ['banners:home_0'],
        layoutConfig: { slideDuration: 5000 },
        buttonStyle: { variant: 'filled', bgColor: '#ffffff', textColor: '#000' },
    },
    {
        _id: 'l0_2',
        title: 'Cinematic Motion Graphics',
        description: 'High-end visual storytelling with professional-grade motion design.',
        mediaUrl: require('../../assets/images/banners/banner.mp4'),
        thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200',
        mediaType: 'video',
        ctaText: 'LEARN MORE',
        badge: 'FEATURED',
        displayLocations: ['banners:home_0'],
        layoutConfig: { slideDuration: 10000 },
        buttonStyle: { variant: 'outline', borderColor: '#ffffff', textColor: '#fff' },
    },
    {
        _id: 'l0_3',
        title: 'Global Talent Pipeline',
        description: 'Connect with creators from over 50 countries.',
        mediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200',
        mediaType: 'image',
        ctaText: 'DASHBOARD',
        badge: 'GLOBAL',
        displayLocations: ['banners:home_0'],
        layoutConfig: { slideDuration: 4000 },
    },

    // --- LEVEL 1: SPARKS ---
    {
        _id: 'l1_1',
        title: 'Spark Your Creativity',
        description: 'New creative tools added daily to enhance your workflow.',
        mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200',
        mediaType: 'image',
        ctaText: 'TRY TOOLS',
        badge: 'NEW',
        displayLocations: ['banners:home_1'],
        layoutConfig: { slideDuration: 5000 },
    },
    {
        _id: 'l1_2',
        title: 'Vibrant Communities',
        description: 'Join thousands of creators in our exclusive discord community.',
        mediaUrl: require('../../assets/images/banners/banner.mp4'),
        thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200',
        mediaType: 'video',
        ctaText: 'JOIN US',
        badge: 'COMMUNITY',
        displayLocations: ['banners:home_1'],
        layoutConfig: { slideDuration: 8000 },
    },

    // --- LEVEL 2: EXPLORE ---
    {
        _id: 'l2_1',
        title: 'Explore the Marketplace',
        description: 'Find your next big project or the perfect editor for your brand.',
        mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200',
        mediaType: 'image',
        ctaText: 'EXPLORE GIGS',
        badge: 'MARKET',
        displayLocations: ['banners:home_2'],
        layoutConfig: { slideDuration: 6000 },
    },
];

export const useBannerData = (pageName: 'home' | 'editors' | 'gigs' | 'jobs' | 'explore' = 'home') => {

  return useQuery({
    queryKey: ['ads', pageName],
    queryFn: async () => {
        // Return static defaults directly for testing the slice carousel
        return DEFAULT_BANNERS;
    },
    staleTime: 600000, 
  });
};
