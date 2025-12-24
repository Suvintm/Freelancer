/**
 * Cloudinary Storage Utility for Final Output Delivery
 * 
 * Provides functions for:
 * - Uploading large video/photo/audio files
 * - Generating signed download URLs (full quality)
 * - Auto-generating thumbnails
 * - Deleting files after expiry
 * 
 * IMPORTANT: Downloads are FULL QUALITY - no compression!
 */

import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

// Initialize Cloudinary (uses env variables automatically)
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

/**
 * Generate a unique public ID for Cloudinary
 * Format: final-outputs/{orderId}/{type}/{timestamp}_{randomId}_{filename}
 */
export const generatePublicId = (orderId, type, filename) => {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(4).toString("hex");
  // Remove extension for public_id
  const baseName = filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `final-outputs/${orderId}/${type}/${timestamp}_${randomId}_${baseName}`;
};

/**
 * Get resource type for Cloudinary based on file type
 */
const getResourceType = (fileType) => {
  switch (fileType) {
    case "video": return "video";
    case "audio": return "video"; // Cloudinary treats audio as video
    case "photo": return "image";
    default: return "auto";
  }
};

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Local file path or base64 data
 * @param {string} publicId - Cloudinary public ID
 * @param {string} fileType - Type: video, photo, audio
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadToCloudinary = async (filePath, publicId, fileType) => {
  const resourceType = getResourceType(fileType);
  
  const result = await cloudinary.uploader.upload(filePath, {
    public_id: publicId,
    resource_type: resourceType,
    // Keep original quality - NO transformations
    quality: "auto:best",
    // Generate eager transformations for thumbnail
    eager: fileType === "video" ? [
      { width: 400, height: 225, crop: "fill", format: "jpg" }, // Thumbnail
    ] : undefined,
    eager_async: true,
  });

  return result;
};

/**
 * Get upload signature for direct browser upload
 * This allows large files to upload directly to Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} fileType - Type: video, photo, audio
 * @returns {object} Signature data for client-side upload
 */
export const getUploadSignature = (publicId, fileType) => {
  const timestamp = Math.round(Date.now() / 1000);
  const resourceType = getResourceType(fileType);
  
  const paramsToSign = {
    timestamp,
    public_id: publicId,
    folder: publicId.split("/").slice(0, -1).join("/"), // Extract folder from public_id
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    publicId,
    resourceType,
  };
};

/**
 * Generate signed URL for downloading ORIGINAL quality file
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - video, image, raw
 * @param {string} format - File format (mp4, jpg, etc.)
 * @param {number} expiresInSec - URL validity in seconds (default: 24 hours)
 * @returns {string} Signed download URL
 */
export const getDownloadUrl = (publicId, resourceType, format, expiresInSec = 86400) => {
  const expiresAt = Math.round(Date.now() / 1000) + expiresInSec;
  
  // Use fl_attachment to force download instead of streaming
  // Use f_auto to keep original format, q_auto:best for best quality
  const url = cloudinary.url(publicId, {
    resource_type: resourceType || "video",
    format: format,
    flags: "attachment", // Force download
    sign_url: true,
    type: "authenticated",
    expires_at: expiresAt,
    secure: true,
  });

  return url;
};

/**
 * Get streaming/preview URL (slightly compressed for preview)
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - video, image
 * @returns {string} Preview URL
 */
export const getPreviewUrl = (publicId, resourceType) => {
  if (resourceType === "video") {
    return cloudinary.url(publicId, {
      resource_type: "video",
      format: "mp4",
      quality: "auto:good", // Good quality for preview
      fetch_format: "auto",
      secure: true,
    });
  }
  
  return cloudinary.url(publicId, {
    resource_type: "image",
    quality: "auto:good",
    fetch_format: "auto",
    secure: true,
  });
};

/**
 * Get thumbnail URL
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - video, image
 * @returns {string} Thumbnail URL
 */
export const getThumbnailUrl = (publicId, resourceType) => {
  if (resourceType === "video") {
    return cloudinary.url(publicId, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        { width: 400, height: 225, crop: "fill" },
        { quality: "auto:good" },
      ],
      secure: true,
    });
  }
  
  return cloudinary.url(publicId, {
    resource_type: "image",
    transformation: [
      { width: 400, height: 300, crop: "fill" },
      { quality: "auto:good" },
    ],
    secure: true,
  });
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - video, image, raw
 * @returns {Promise<boolean>} Success status
 */
export const deleteFromCloudinary = async (publicId, resourceType = "video") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    return result.result === "ok";
  } catch (error) {
    console.error(`Failed to delete ${publicId}:`, error);
    return false;
  }
};

/**
 * Get file info from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - video, image
 * @returns {Promise<object|null>} File metadata
 */
export const getFileInfo = async (publicId, resourceType = "video") => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
      image_metadata: true,
      media_metadata: true,
    });
    
    return {
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      duration: result.duration, // For video/audio
      bitRate: result.bit_rate,
      frameRate: result.frame_rate,
      codec: result.video?.codec || result.audio?.codec,
      createdAt: result.created_at,
      secureUrl: result.secure_url,
    };
  } catch (error) {
    console.error(`Failed to get info for ${publicId}:`, error);
    return null;
  }
};

/**
 * Get content type based on file extension
 */
export const getContentType = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  const types = {
    // Video
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    webm: "video/webm",
    // Photo
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    tiff: "image/tiff",
    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    flac: "audio/flac",
    aac: "audio/aac",
    m4a: "audio/mp4",
  };
  return types[ext] || "application/octet-stream";
};

/**
 * Get file type category (video, photo, audio)
 */
export const getFileType = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "m4v"];
  const photoExts = ["jpg", "jpeg", "png", "gif", "webp", "tiff", "tif", "bmp", "raw", "psd"];
  const audioExts = ["mp3", "wav", "flac", "aac", "ogg", "m4a"];

  if (videoExts.includes(ext)) return "video";
  if (photoExts.includes(ext)) return "photo";
  if (audioExts.includes(ext)) return "audio";
  return null;
};

/**
 * Get format from filename
 */
export const getFormat = (filename) => {
  return filename.split(".").pop().toLowerCase();
};

export default {
  generatePublicId,
  uploadToCloudinary,
  getUploadSignature,
  getDownloadUrl,
  getPreviewUrl,
  getThumbnailUrl,
  deleteFromCloudinary,
  getFileInfo,
  getContentType,
  getFileType,
  getFormat,
};
