import { 
  PutObjectCommand, 
  DeleteObjectCommand, 
  DeleteObjectsCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getPresignedUrl } from "@aws-sdk/s3-request-presigner";
import axios from "axios";
import crypto from "crypto";
import r2Client from "./r2.config.js";
import { R2_BUCKET_NAME } from "./r2.constants.js";
import logger from "../../../../utils/logger.js";

/**
 * ☁️ CLOUDFLARE R2 STORAGE SERVICE
 * 
 * Production-ready driver for R2. 
 * Mirror of s3.service.js to allow seamless switching via storage.service.js.
 */

/**
 * Upload an object directly to R2
 */
export const uploadObject = async (body, key, options = {}) => {
  try {
    const { 
      contentType = "application/octet-stream", 
      cacheControl = "public, max-age=31536000, immutable" 
    } = options;

    logger.info(`🛰️ [R2-PUT] Uploading ${key} (${body.length} bytes)`);
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    });

    const result = await r2Client.send(command);
    logger.info(`✅ [R2-PUT] Success: ${key} (ETag: ${result.ETag})`);
    return { key, etag: result.ETag };
  } catch (error) {
    logger.error(`❌ [R2-PUT] Failure: ${key}. Error: ${error.stack}`);
    throw error;
  }
};

/**
 * Generate a pre-signed URL for Cloudflare R2
 */
export const getSignedUrl = async (key, options = {}) => {
  try {
    const { type = "GET", expiresIn = 3600 } = options;
    logger.info(`🛰️ [R2-SIGN] Generating ${type} URL for: ${key}`);
    
    // R2 uses standard S3 Command classes
    const CommandClass = type === "GET" ? GetObjectCommand : PutObjectCommand;
    const command = new CommandClass({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const url = await getPresignedUrl(r2Client, command, { expiresIn });
    return url;
  } catch (error) {
    logger.error(`❌ [R2-SIGN] Failure: ${key}. Error: ${error.stack}`);
    throw error;
  }
};

/**
 * Delete one or more objects from R2
 */
export const deleteObjects = async (keys) => {
  try {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    
    if (keyArray.length === 1) {
      const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: keyArray[0],
      });
      await r2Client.send(command);
    } else {
      const command = new DeleteObjectsCommand({
        Bucket: R2_BUCKET_NAME,
        Delete: {
          Objects: keyArray.map(k => ({ Key: k })),
          Quiet: true,
        },
      });
      await r2Client.send(command);
    }
    
    logger.info(`🗑️ [R2] Deleted ${keyArray.length} objects`);
    return true;
  } catch (error) {
    logger.error(`❌ [R2] Deletion failure: ${error.message}`);
    return false;
  }
};

/**
 * Fetch an object as a Buffer
 */
export const getObject = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);
    const streamToBuffer = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", (err) => reject(err));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
      });

    return await streamToBuffer(response.Body);
  } catch (error) {
    logger.error(`❌ [R2-GET] Failure: ${key}. Error: ${error.stack}`);
    throw error;
  }
};

/**
 * Mirror an external URL to R2
 */
export const mirrorRemoteUrl = async (url, folder = "general") => {
  try {
    if (!url) throw new Error("URL is required");

    const response = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
    const buffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"] || "image/jpeg";
    const ext = contentType.split("/")[1]?.split("+")[0] || "jpg";
    const hash = crypto.createHash("md5").update(url).digest("hex");
    const key = `${folder}/${hash}.${ext}`;

    await uploadObject(buffer, key, { contentType });
    return key;
  } catch (error) {
    logger.error(`❌ [R2-MIRROR] Failed: ${url}. Error: ${error.message}`);
    throw error;
  }
};

export default {
  uploadObject,
  getSignedUrl,
  deleteObjects,
  getObject,
  mirrorRemoteUrl,
};
