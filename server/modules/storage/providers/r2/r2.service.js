/**
 * ☁️ CLOUDFLARE R2 STORAGE SERVICE
 *
 * Exposes the same API surface as s3.service.js so storageProvider.js
 * can swap between them with a single env variable.
 *
 * TODO (Phase 5): Implement using S3Client pointed at R2 endpoint.
 */

export const uploadObject = async (body, key, options = {}) => {
  // TODO: Implement PutObjectCommand for R2
};

export const getSignedUrl = async (key, expiresIn = 3600) => {
  // TODO: Implement getSignedUrl for R2 (identical to S3 — same SDK)
};

export const deleteObjects = async (keys) => {
  // TODO: Implement DeleteObjectsCommand for R2
};

export default { uploadObject, getSignedUrl, deleteObjects };
