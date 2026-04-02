const repairUrl = (url) => {
  if (!url || typeof url !== 'string') return url ?? '';
  if (!url.includes('cloudinary') && !url.includes('res_') && !url.includes('_com')) return url;
  let f = url;
  f = f.replace(/^(https?):?\/*_+/gi, '$1://');
  f = f.replace(/_+res_+cloudinary_+com/g, 'res.cloudinary.com')
       .replace(/res_cloudinary_com/g, 'res.cloudinary.com')
       .replace(/cloudinary_com/g, 'cloudinary.com');
  if (f.includes('res.cloudinary.com')) {
    f = f.replace(/res\.cloudinary\.com_+/g, 'res.cloudinary.com/');
    f = f.replace(/image_upload_+/g, 'image/upload/')
         .replace(/video_upload_+/g, 'video/upload/')
         .replace(/raw_upload_+/g,   'raw/upload/');
    f = f.replace(/([/_]?v\d+)_+/g, '$1/');
    f = f.replace(/(res\.cloudinary\.com\/[^/_]+)_+(image|video|raw|authenticated)_*/g, '$1/$2/');
    f = f.replace(/advertisements_images_+/g,  'advertisements/images/')
         .replace(/advertisements_videos_+/g,  'advertisements/videos/')
         .replace(/advertisements_gallery_+/g, 'advertisements/gallery/');
    f = f.replace(/_+(upload|image|video|v\d+)_+/g, '/$1/');
    
    // Check for trailing extension underscores BEFORE general underscore replacement
    f = f.replace(/_mp4$/i, '.mp4')
         .replace(/_jpg$/i, '.jpg')
         .replace(/_jpeg$/i, '.jpeg')
         .replace(/_png$/i, '.png')
         .replace(/_webp$/i, '.webp');

    f = f.replace(/([^:])\/\/+/g, '$1/');
    
    if (f.includes('res.cloudinary.com') && f.includes('_')) {
        // Only replace underscores if we aren't in the transformation part
        const parts = f.split('/upload/');
        if (parts.length === 2 && !parts[1].startsWith('q_auto')) {
            f = parts[0] + '/upload/' + parts[1].replace(/_+/g, '/');
        } else if (parts.length === 1) {
            f = f.replace(/_+/g, '/');
        }
    }

    // Inject Cloudinary Optimizations
    if (f.includes('/upload/')) {
      const isVideo = f.includes('/video/');
      const opt = isVideo ? 'q_auto,f_auto,vc_h264' : 'q_auto,f_auto';
      if (!f.includes(opt)) {
        f = f.replace('/upload/', `/upload/${opt}/`);
      }
    }
  }
  return f
    .replace(/^http:/, 'https:')
    .replace(/_jpg([/_?#]|$)/gi,  '.jpg$1')
    .replace(/_jpeg([/_?#]|$)/gi, '.jpeg$1')
    .replace(/_png([/_?#]|$)/gi,  '.png$1')
    .replace(/_mp4([/_?#]|$)/gi,  '.mp4$1')
    .replace(/_webp([/_?#]|$)/gi, '.webp$1');
};

const testUrl = "https://res.cloudinary.com/dmc1e7aed/video/upload/advertisements_videos_wl7peiuluruxylfaujdx_mp4";
console.log("Input: ", testUrl);
console.log("Output:", repairUrl(testUrl));
