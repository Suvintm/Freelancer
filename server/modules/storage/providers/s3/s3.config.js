import { S3Client } from "@aws-sdk/client-s3";
import logger from "../../../../utils/logger.js";

/**
 * 🛰️ AWS S3 CONFIGURATION (PRODUCTION READY)
 * 
 * Uses SDK v3 for modular performance.
 * Validates credentials and region from .env.
 */

const AWS_REGION = process.env.AWS_REGION || "ap-south-1";

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  logger.error("❌ [S3] AWS Credentials missing from environment!");
}

export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

logger.info(`📦 [S3] Client initialized for region: ${AWS_REGION}`);

export default s3Client;
