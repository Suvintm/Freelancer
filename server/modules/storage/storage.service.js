import logger from "../../utils/logger.js";
import * as s3Provider from "./providers/s3/s3.service.js";
import * as r2Provider from "./providers/r2/r2.service.js";

/**
 * ⭐ STORAGE SERVICE — THE BRAIN
 * 
 * This is the ONLY file the rest of the app should import.
 * Decides which provider to use based on the STORAGE_PROVIDER environment variable.
 */

const PROVIDER_TYPE = process.env.STORAGE_PROVIDER || "s3";

/**
 * Pick the provider based on ENV
 */
const getProvider = () => {
  switch (PROVIDER_TYPE.toLowerCase()) {
    case "s3":
      return s3Provider;
    case "r2":
      return r2Provider;
    default:
      logger.warn(`⚠️ [STORAGE] Unknown provider "${PROVIDER_TYPE}", defaulting to S3`);
      return s3Provider;
  }
};

const provider = getProvider();

logger.info(`🏗️ [STORAGE] Active Provider: ${PROVIDER_TYPE.toUpperCase()}`);

// Export the active provider's API
export const {
  uploadObject,
  getSignedUrl,
  deleteObjects,
  deleteFolder,
  getObject,
  mirrorRemoteUrl
} = provider;

export default {
  uploadObject,
  getSignedUrl,
  deleteObjects,
  deleteFolder,
  getObject,
  mirrorRemoteUrl
};
