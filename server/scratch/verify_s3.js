import "dotenv/config";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import s3Client from "../modules/storage/providers/s3/s3.config.js";
import { S3_BUCKET_NAME } from "../modules/storage/providers/s3/s3.constants.js";

async function verifyMedia() {
  const userId = "830a8987-0f3e-49f6-8b6f-203de3263c8e";
  const prefix = `uploads/processed/images/${userId}/`;

  console.log(`🔍 Checking S3 Bucket: ${S3_BUCKET_NAME}`);
  console.log(`🔍 Prefix: ${prefix}`);

  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      console.log("❌ NO FILES FOUND in that folder!");
    } else {
      console.log(`✅ FOUND ${response.Contents.length} files:`);
      response.Contents.forEach(obj => {
        console.log(`   - ${obj.Key} (${obj.Size} bytes)`);
      });
    }
  } catch (err) {
    console.error("❌ ERROR checking S3:", err.message);
  }
}

verifyMedia();
