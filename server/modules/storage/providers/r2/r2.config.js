import { S3Client } from "@aws-sdk/client-s3";
import logger from "../../../../utils/logger.js";

/**
 * ☁️ CLOUDFLARE R2 CONFIGURATION
 * 
 * R2 is S3-compatible. We use the AWS SDK v3 with a custom endpoint.
 * Region must be set to "auto" for Cloudflare.
 */

const CF_R2_ACCESS_KEY_ID = process.env.CF_R2_ACCESS_KEY_ID;
const CF_R2_SECRET_ACCESS_KEY = process.env.CF_R2_SECRET_ACCESS_KEY;
const CF_R2_ENDPOINT = process.env.CF_R2_ENDPOINT;

if (!CF_R2_ACCESS_KEY_ID || !CF_R2_SECRET_ACCESS_KEY || !CF_R2_ENDPOINT) {
  logger.error("❌ [R2] Cloudflare R2 Credentials or Endpoint missing!");
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: CF_R2_ENDPOINT,
  credentials: {
    accessKeyId: CF_R2_ACCESS_KEY_ID,
    secretAccessKey: CF_R2_SECRET_ACCESS_KEY,
  },
});

logger.info("📦 [R2] Client initialized successfully.");

export default r2Client;
