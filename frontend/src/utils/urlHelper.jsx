/**
 * repairUrl - Repairs mangled Cloudinary URLs from backend sanitization
 * and applies production-level media optimizations to ALL Cloudinary URLs.
 */

const CLOUDINARY_VIDEO_OPT = "q_auto,vc_h264,w_720,c_limit";
const CLOUDINARY_IMAGE_OPT = "f_auto,q_auto,w_800,c_limit";

/**
 * Injects optimization flags into a clean, already-valid Cloudinary URL
 * if they haven't been applied yet.
 */
const injectOptimizations = (url) => {
    if (!url || !url.includes("res.cloudinary.com")) return url;

    // Don't double-inject
    if (url.includes("/upload/q_auto") || url.includes("/upload/f_auto") || url.includes("/upload/vc_h264")) {
        return url;
    }

    const isVideo = url.includes("/video/upload/");
    const isImage = url.includes("/image/upload/");

    if (isVideo) {
        let fixed = url.replace("/upload/", `/upload/${CLOUDINARY_VIDEO_OPT}/`);
        // Ensure .mp4 extension for H.264
        if (!fixed.toLowerCase().endsWith(".mp4")) {
            fixed = fixed.replace(/\.[^./\\]+$/, ".mp4");
        }
        return fixed;
    } else if (isImage) {
        return url.replace("/upload/", `/upload/${CLOUDINARY_IMAGE_OPT}/`);
    }

    // Generic fallback
    return url.replace("/upload/", "/upload/f_auto,q_auto/");
};

export const repairUrl = (input) => {
    if (!input) return input;

    let url = "";

    // 1. Extract URL if input is an object (handles legacy denormalized data)
    if (typeof input === "object") {
        url = input.url || input.secure_url || input.profilePicture || input.thumbnail || "";
        // If it's still an object (e.g. reel.editor.profilePicture was an object), recurse once
        if (typeof url === "object") return repairUrl(url);
    } else {
        url = input;
    }

    if (!url || typeof url !== "string") return url;

    // 2. If it's already a clean Cloudinary URL, just inject optimizations and return
    if (url.includes("res.cloudinary.com") && !url.includes("res_cloudinary") && !url.includes("cloudinary_com")) {
        return injectOptimizations(url);
    }

    // 3. Only repair if it looks mangled
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

        // Apply optimizations to the newly repaired URL
        return injectOptimizations(fixed);
    }

    return url;
};
