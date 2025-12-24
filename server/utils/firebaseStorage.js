/**
 * Firebase Storage Utility
 * 
 * Provides functions for:
 * - Generating signed upload URLs
 * - Generating signed download URLs  
 * - Deleting files from Firebase Storage
 * 
 * Used for Final Output delivery (video/photo/audio)
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import crypto from "crypto";

// Initialize Firebase Admin (only once)
let firebaseApp = null;
let bucket = null;

const initFirebase = () => {
  if (firebaseApp) return bucket;

  // Check if already initialized
  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
  } else {
    // Check for credentials
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_STORAGE_BUCKET) {
      console.warn("⚠️ Firebase Storage not configured. Final output uploads will not work.");
      console.warn("   Set FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, and FIREBASE_PRIVATE_KEY");
      return null;
    }

    try {
      // Initialize with service account credentials
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });

      console.log("✅ Firebase Storage initialized");
    } catch (error) {
      console.error("❌ Firebase initialization failed:", error.message);
      return null;
    }
  }

  bucket = getStorage(firebaseApp).bucket();
  return bucket;
};

/**
 * Generate a unique key for storage
 * Format: final-outputs/{orderId}/{type}/{timestamp}_{randomId}_{filename}
 */
export const generateStorageKey = (orderId, type, filename) => {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(4).toString("hex");
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `final-outputs/${orderId}/${type}/${timestamp}_${randomId}_${safeName}`;
};

/**
 * Generate a signed URL for uploading a file
 * @param {string} key - Storage path/key
 * @param {string} contentType - MIME type
 * @param {number} expiresInMs - URL validity in milliseconds (default: 1 hour)
 * @returns {Promise<string>} Signed upload URL
 */
export const getUploadUrl = async (key, contentType, expiresInMs = 3600000) => {
  const storageBucket = initFirebase();
  if (!storageBucket) throw new Error("Firebase Storage not configured");

  const file = storageBucket.file(key);
  
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + expiresInMs,
    contentType: contentType,
  });

  return url;
};

/**
 * Generate a signed URL for downloading a file
 * @param {string} key - Storage path/key
 * @param {number} expiresInMs - URL validity in milliseconds (default: 24 hours)
 * @returns {Promise<string>} Signed download URL
 */
export const getDownloadUrl = async (key, expiresInMs = 86400000) => {
  const storageBucket = initFirebase();
  if (!storageBucket) throw new Error("Firebase Storage not configured");

  const file = storageBucket.file(key);
  
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + expiresInMs,
  });

  return url;
};

/**
 * Delete a file from Firebase Storage
 * @param {string} key - Storage path/key
 * @returns {Promise<boolean>} Success status
 */
export const deleteFromStorage = async (key) => {
  const storageBucket = initFirebase();
  if (!storageBucket) throw new Error("Firebase Storage not configured");

  try {
    const file = storageBucket.file(key);
    await file.delete();
    return true;
  } catch (error) {
    if (error.code === 404) {
      console.log(`File already deleted or not found: ${key}`);
      return true;
    }
    console.error(`Failed to delete ${key}:`, error);
    return false;
  }
};

/**
 * Check if a file exists in Firebase Storage
 * @param {string} key - Storage path/key
 * @returns {Promise<boolean>} Exists status
 */
export const fileExists = async (key) => {
  const storageBucket = initFirebase();
  if (!storageBucket) return false;

  try {
    const file = storageBucket.file(key);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    return false;
  }
};

/**
 * Get file metadata from Firebase Storage
 * @param {string} key - Storage path/key
 * @returns {Promise<object|null>} File metadata or null
 */
export const getFileMetadata = async (key) => {
  const storageBucket = initFirebase();
  if (!storageBucket) return null;

  try {
    const file = storageBucket.file(key);
    const [metadata] = await file.getMetadata();
    return {
      contentType: metadata.contentType,
      size: parseInt(metadata.size),
      created: metadata.timeCreated,
      updated: metadata.updated,
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
  generateStorageKey,
  getUploadUrl,
  getDownloadUrl,
  deleteFromStorage,
  fileExists,
  getFileMetadata,
  getContentType,
  getFileType,
};
