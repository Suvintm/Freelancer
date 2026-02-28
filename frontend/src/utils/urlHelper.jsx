/**
 * repairUrl - Repairs mangled Cloudinary URLs from backend sanitization
 */
export const repairUrl = (url) => {
    if (!url || typeof url !== "string") return url;
    if (!url.includes("cloudinary") && !url.includes("res_") && !url.includes("_com")) return url;
  
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
        fixed = fixed.replace(/_([a-z0-9\-_]+\.(webp|jpg|jpeg|png|mp4|mov|m4v|json))/gi, "/$1");
        fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
    }

    fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1");
    return fixed;
};
