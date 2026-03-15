/**
 * Cloudflare R2 Storage Utility
 * 
 * Provides functions for:
 * - Generating presigned upload URLs
 * - Generating presigned download URLs  
 * - Deleting files from R2
 * 
 * Uses AWS S3 SDK with R2 endpoint
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

// Initialize R2 Client
const getR2Client = () => {
  if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.warn("⚠️ Cloudflare R2 credentials not configured. File uploads will not work.");
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
};

const R2 = getR2Client();
const BUCKET = process.env.R2_BUCKET || "freelancer-outputs";

/**
 * Generate a unique key for R2 storage
 * Format: outputs/{orderId}/{type}/{timestamp}_{randomId}_{filename}
 */
export const generateR2Key = (orderId, type, filename) => {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(4).toString("hex");
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `outputs/${orderId}/${type}/${timestamp}_${randomId}_${safeName}`;
};

/**
 * Generate a presigned URL for uploading a file to R2
 * @param {string} key - R2 object key
 * @param {string} contentType - MIME type
 * @param {number} expiresIn - URL validity in seconds (default: 1 hour)
 * @returns {Promise<string>} Presigned upload URL
 */
export const getUploadUrl = async (key, contentType, expiresIn = 3600) => {
  if (!R2) throw new Error("R2 not configured");

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(R2, command, { expiresIn });
};

/**
 * Generate a presigned URL for downloading a file from R2
 * @param {string} key - R2 object key
 * @param {number} expiresIn - URL validity in seconds (default: 24 hours)
 * @param {string} downloadFilename - Suggested filename for download (optional)
 * @returns {Promise<string>} Presigned download URL
 */
export const getDownloadUrl = async (key, expiresIn = 86400, downloadFilename = null) => {
  if (!R2) throw new Error("R2 not configured");

  const commandOptions = {
    Bucket: BUCKET,
    Key: key,
  };

  // Add Content-Disposition to suggest filename
  if (downloadFilename) {
    commandOptions.ResponseContentDisposition = `attachment; filename="${downloadFilename}"`;
  }

  const command = new GetObjectCommand(commandOptions);
  return getSignedUrl(R2, command, { expiresIn });
};

/**
 * Delete a file from R2
 * @param {string} key - R2 object key
 * @returns {Promise<boolean>} Success status
 */
export const deleteFromR2 = async (key) => {
  if (!R2) throw new Error("R2 not configured");

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    await R2.send(command);
    return true;
  } catch (error) {
    console.error(`Failed to delete ${key} from R2:`, error);
    return false;
  }
};

/**
 * Check if a file exists in R2
 * @param {string} key - R2 object key
 * @returns {Promise<boolean>} Exists status
 */
export const fileExistsInR2 = async (key) => {
  if (!R2) return false;

  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    await R2.send(command);
    return true;
  } catch (error) {
    if (error.name === "NotFound") return false;
    throw error;
  }
};

/**
 * Get file metadata from R2
 * @param {string} key - R2 object key
 * @returns {Promise<object|null>} File metadata or null
 */
export const getFileMetadata = async (key) => {
  if (!R2) return null;

  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    const response = await R2.send(command);
    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      eTag: response.ETag,
    };
  } catch (error) {
    console.error(`Failed to get metadata for ${key}:`, error);
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
    tif: "image/tiff",
    bmp: "image/bmp",
    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    flac: "audio/flac",
    aac: "audio/aac",
    ogg: "audio/ogg",
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

export default {
  generateR2Key,
  getUploadUrl,
  getDownloadUrl,
  deleteFromR2,
  fileExistsInR2,
  getFileMetadata,
  getContentType,
  getFileType,
};
