import { 
  PutObjectCommand, 
  DeleteObjectCommand, 
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";
import { getSignedUrl as getPresignedUrl } from "@aws-sdk/s3-request-presigner";
import axios from "axios";
import crypto from "crypto";
import s3Client from "./s3.config.js";
import { S3_BUCKET_NAME, S3_REGION } from "./s3.constants.js";
import logger from "../../../../utils/logger.js";

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
      // 🚀 PRODUCTION STRATEGY: Default to 1 year immutable. 
      // Stories should override this to 12 hours (43200s).
      cacheControl = "public, max-age=31536000, immutable" 
    } = options;

    logger.info(`🛰️ [S3-PUT] Uploading ${key} (${body.length} bytes, ${contentType})`);
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    });

    const result = await s3Client.send(command);
    logger.info(`✅ [S3-PUT] Success: ${key} (ETag: ${result.ETag})`);
    return { key, etag: result.ETag };
  } catch (error) {
    logger.error(`❌ [S3-PUT] Failure: ${key}. Error: ${error.stack}`);
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
    logger.info(`🛰️ [S3-SIGN] Generating ${type} URL for: ${key} (Expires: ${expiresIn}s)`);
    
    const CommandClass = type === "GET" ? GetObjectCommand : PutObjectCommand;
    const command = new CommandClass({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const url = await getPresignedUrl(s3Client, command, { expiresIn });
    logger.info(`🔗 [S3-URL] Generated: ${url.substring(0, 50)}...`);
    return url;
  } catch (error) {
    logger.error(`❌ [S3-SIGN] Failure: ${key}. Error: ${error.stack}`);
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
 * Delete an entire "folder" (all objects with a prefix)
 * Handles pagination for folders containing more than 1,000 files.
 * @param {string} prefix - The folder path/prefix to delete
 */
export const deleteFolder = async (prefix) => {
  try {
    if (!prefix) return;

    const folderPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
    let continuationToken = null;
    let totalDeleted = 0;

    do {
      // 1. List objects with continuation token support
      const listCommand = new ListObjectsV2Command({
        Bucket: S3_BUCKET_NAME,
        Prefix: folderPrefix,
        ContinuationToken: continuationToken,
      });

      const listResponse = await s3Client.send(listCommand);
      
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        break; 
      }

      // 2. Batch delete the current page of results (max 1,000)
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: S3_BUCKET_NAME,
        Delete: {
          Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key })),
          Quiet: true,
        },
      });

      await s3Client.send(deleteCommand);
      totalDeleted += listResponse.Contents.length;

      // 3. Check if more pages exist
      continuationToken = listResponse.IsTruncated ? listResponse.NextContinuationToken : null;
    } while (continuationToken);

    if (totalDeleted > 0) {
      logger.info(`🗑️ [S3] Recursive Deletion Success: ${folderPrefix} (${totalDeleted} files)`);
    }
    
    return true;
  } catch (error) {
    logger.error(`❌ [S3] Recursive Deletion Failure: ${error.message}`);
    return false;
  }
};

/**
 * Fetch an object from S3 as a Buffer
 * @param {string} key - S3 object key
 */
export const getObject = async (key) => {
  try {
    logger.info(`🛰️ [S3-GET] Fetching object: ${key}`);
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    const streamToBuffer = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", (err) => {
           logger.error(`❌ [S3-STREAM] Error reading stream: ${err.stack}`);
           reject(err);
        });
        stream.on("end", () => resolve(Buffer.concat(chunks)));
      });

    const buffer = await streamToBuffer(response.Body);
    logger.info(`✅ [S3-GET] Success. Received ${buffer.length} bytes for: ${key}`);
    return buffer;
  } catch (error) {
    logger.error(`❌ [S3-GET] Failure: ${key}. Error: ${error.stack}`);
    throw error;
  }
};

/**
 * Mirror an external URL to S3
 * @param {string} url - Remote image URL
 * @param {string} folder - Destination folder under 'uploads/mirrored'
 */
export const mirrorRemoteUrl = async (url, folder = "general") => {
  try {
    if (!url) throw new Error("URL is required for mirroring");

    logger.info(`🛰️ [S3-MIRROR] Fetching remote asset: ${url}`);
    
    // 1. Download the asset
    const response = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
    const buffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"] || "image/jpeg";
    
    // 2. Determine extension
    const ext = contentType.split("/")[1]?.split("+")[0] || "jpg";
    
    // 3. Generate unique key (Aligned with Cloudflare Proxy whitelists)
    const hash = crypto.createHash("md5").update(url).digest("hex");
    const key = `${folder}/${hash}.${ext}`;

    // 4. Upload to S3
    await uploadObject(buffer, key, { contentType });

    // 5. Build storage key (Return relative key for central resolution via cdn.suvix.in)
    return key;
  } catch (error) {
    logger.error(`❌ [S3-MIRROR] Failed to mirror ${url}. Error: ${error.message}`);
    throw error;
  }
};

export default {
  uploadObject,
  getSignedUrl,
  deleteObjects,
  deleteFolder,
  getObject,
  mirrorRemoteUrl,
};
