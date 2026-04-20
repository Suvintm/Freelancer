import storage from "../../storage/storage.service.js";
import { STORAGE_FOLDERS } from "../../storage/providers/s3/s3.constants.js";
import crypto from "crypto";

/**
 * 📦 STORY STORAGE MANAGER (MICROSERVICE LAYER)
 * 
 * Specifically handles storage logic for Stories.
 * Encapsulates pathing, naming conventions, and storage calls.
 * 
 * NOTE: Currently configured to use the main storage provider (Default: S3).
 * Will switch to R2 automatically when STORAGE_PROVIDER="r2" is set.
 */

/**
 * Generate a pre-signed URL for a Story upload
 * @param {string} userId - ID of the creator
 * @param {string} mimeType - e.g., 'image/jpeg' or 'video/mp4'
 */
export const getStoryUploadUrl = async (userId, mimeType) => {
  const fileId = crypto.randomUUID();
  const ext = mimeType.split("/")[1]?.split("+")[0] || "jpg";
  
  // Naming: uploads/stories/{userId}/{uuid}.{ext}
  const key = `${STORAGE_FOLDERS.STORIES}/${userId}/${fileId}.${ext}`;

  // Generate PUT URL for direct upload
  const uploadUrl = await storage.getSignedUrl(key, { 
    type: "PUT", 
    expiresIn: 3600 // 1 hour to upload
  });

  return { uploadUrl, storageKey: key };
};

/**
 * Specifically remove story media
 * @param {string} storageKey - The storage key
 */
export const deleteStoryMedia = async (storageKey) => {
  return await storage.deleteObjects(storageKey);
};

export default { getStoryUploadUrl, deleteStoryMedia };
