import { 
  PutObjectCommand, 
  DeleteObjectCommand, 
  DeleteObjectsCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl as getPresignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "./s3.config.js";
import { S3_BUCKET_NAME } from "./s3.constants.js";
import logger from "../../../utils/logger.js";

/**
 * 🛠️ AWS S3 STORAGE SERVICE (PRODUCTION LOGIC LAYER)
 */

/**
 * Upload an object directly to S3
 * @param {Buffer} body - File buffer
 * @param {string} key - S3 Key (path)
 * @param {Object} options - CacheControl, ContentType, etc.
 */
export const uploadObject = async (body, key, options = {}) => {
  try {
    const { 
      contentType = "application/octet-stream", 
      cacheControl = "public, max-age=31536000, immutable" 
    } = options;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    });

    const result = await s3Client.send(command);
    logger.info(`✅ [S3] Uploaded successfully: ${key}`);
    return { key, etag: result.ETag };
  } catch (error) {
    logger.error(`❌ [S3] Upload failure: ${error.message}`);
    throw error;
  }
};

/**
 * Generate a pre-signed URL for temporary access
 * @param {string} key - S3 object key
 * @param {Object} options - { type: 'GET' | 'PUT', expiresIn: seconds }
 */
export const getSignedUrl = async (key, options = {}) => {
  try {
    const { type = "GET", expiresIn = 3600 } = options;
    
    const CommandClass = type === "GET" ? GetObjectCommand : PutObjectCommand;
    const command = new CommandClass({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    return await getPresignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    logger.error(`❌ [S3] Signed URL generation failed: ${error.message}`);
    throw error;
  }
};

/**
 * Delete one or more objects from S3
 * @param {string|string[]} keys - One or more keys to delete
 */
export const deleteObjects = async (keys) => {
  try {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    
    if (keyArray.length === 1) {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: keyArray[0],
      });
      await s3Client.send(command);
    } else {
      const command = new DeleteObjectsCommand({
        Bucket: S3_BUCKET_NAME,
        Delete: {
          Objects: keyArray.map(k => ({ Key: k })),
          Quiet: true,
        },
      });
      await s3Client.send(command);
    }
    
    logger.info(`🗑️ [S3] Deleted ${keyArray.length} objects`);
    return true;
  } catch (error) {
    logger.error(`❌ [S3] Deletion failure: ${error.message}`);
    return false;
  }
};

/**
 * Fetch an object from S3 as a Buffer
 * @param {string} key - S3 object key
 */
export const getObject = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    const streamToBuffer = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks)));
      });

    return await streamToBuffer(response.Body);
  } catch (error) {
    logger.error(`❌ [S3] GetObject failure: ${error.message}`);
    throw error;
  }
};

export default {
  uploadObject,
  getSignedUrl,
  deleteObjects,
  getObject,
};
