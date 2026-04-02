import cloudinary from "../config/cloudinary.js";
import fs from "fs-extra";
import path from "path";
import os from "os";

/**
 * ✅ Upload file to Cloudinary using Chunked Upload (Fixes 413 Payload Too Large)
 * Supports buffers by writing to a temporary file first.
 * Now supports an onProgress callback to notify the caller of activity.
 */
export const uploadToCloudinary = async (fileBuffer, folder = "profiles", options = {}, onProgress = null) => {
  const tempPath = path.join(os.tmpdir(), `suvix_upload_${Date.now()}`);
  
  try {
    // 1. Write buffer to temporary file
    await fs.writeFile(tempPath, fileBuffer);
    const stats = await fs.stat(tempPath);
    const fileSize = stats.size;

    console.log(`📦 [Cloudinary] Starting chunked upload for ${fileSize} bytes...`);
    if (onProgress) onProgress(10); // Start at 10%

    // 2. Upload using v2.uploader.upload with chunk_size
    // We simulate progress steps because the SDK doesn't expose real-time XHR-style progress in Node.js
    const progressInterval = setInterval(() => {
      // Simulate progress up to 90%
      if (onProgress) {
        onProgress((prev) => (prev < 90 ? prev + 5 : prev));
      }
    }, 2000);

    const result = await cloudinary.v2.uploader.upload(tempPath, {
      folder,
      resource_type: "auto",
      access_mode: "public",
      chunk_size: 6000000, // 6MB chunks
      timeout: 600000,    // 10 minutes
      ...options,
    });

    clearInterval(progressInterval);
    if (onProgress) onProgress(100);

    if (!result || (!result.secure_url && !result.url)) {
      throw new Error("Cloudinary upload succeeded but no URL was returned.");
    }

    console.log(`✅ [Cloudinary] Chunked upload success: ${result.secure_url}`);
    
    // 3. Clean up temp file
    await fs.remove(tempPath);
    
    return result;
  } catch (error) {
    console.error("❌ [Cloudinary] Chunked upload error:", error);
    if (await fs.pathExists(tempPath)) {
      await fs.remove(tempPath).catch(e => console.error("Temp cleanup failed:", e));
    }
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * ✅ Delete file from Cloudinary (any type)
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.v2.uploader.destroy(publicId, {
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    console.error("❌ Cloudinary deletion error:", error);
    throw new Error("Failed to delete file from Cloudinary");
  }
};
