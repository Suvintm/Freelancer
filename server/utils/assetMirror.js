import axios from "axios";
import { uploadToCloudinary } from "./uploadToCloudinary.js";
import logger from "./logger.js";

/**
 * 📦 SuviX Asset Mirror Engine
 * Downloads external images (YouTube thumbnails, etc.) and mirrors them to Cloudinary.
 * This ensures high-performance, local assets and prevents cross-origin or expiration issues.
 */

const SUVIX_DEFAULT_AVATAR = "https://res.cloudinary.com/suvix/image/upload/v1/assets/default-avatar.png";

export const mirrorExternalImage = async (externalUrl, folder = "creators/mirrors") => {
  if (!externalUrl) {
    logger.warn("No external URL provided to mirror, returning SuviX default.");
    return SUVIX_DEFAULT_AVATAR;
  }

  try {
    logger.info(`🔄 Mirroring external asset: ${externalUrl}`);

    // 1. Fetch the image from the external source
    const response = await axios({
      url: externalUrl,
      method: "GET",
      responseType: "arraybuffer",
      timeout: 5000, // 5s timeout to keep registration snappy
    });

    const buffer = Buffer.from(response.data, "binary");

    // 2. Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(buffer, folder, {
      resource_type: "image",
      format: "webp", // Optimize to Next-Gen format
      quality: "auto",
    });

    logger.info(`✅ Asset mirrored to Cloudinary: ${uploadResult.secure_url}`);
    return uploadResult.secure_url;

  } catch (error) {
    logger.error(`❌ Failed to mirror asset from ${externalUrl}: ${error.message}`);
    // Fallback to official SuviX default so the UI doesn't break
    return SUVIX_DEFAULT_AVATAR;
  }
};
