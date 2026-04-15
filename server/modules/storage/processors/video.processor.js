import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import path from "path";
import fs from "fs";
import os from "os";
import { buildS3Key } from "../providers/s3/s3.utils.js";
import { STORAGE_FOLDERS } from "../providers/s3/s3.constants.js";
import storage from "../storage.service.js";
import logger from "../../../utils/logger.js";

// 🚀 Set the FFmpeg binary path (Production Ready)
ffmpeg.setFfmpegPath(ffmpegStatic);

/**
 * 🎥 VIDEO PROCESSOR
 * Handles Transcoding, Compression, and Thumbnail Extraction.
 */

export const processVideo = async (rawBuffer, userId, mediaId) => {
  const tempDir = path.join(os.tmpdir(), "suvix-media");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const inputPath = path.join(tempDir, `${mediaId}-raw.mp4`);
  const outputPath = path.join(tempDir, `${mediaId}-optimized.mp4`);
  const thumbPath = path.join(tempDir, `${mediaId}-thumb.jpg`);

  try {
    logger.info(`🎥 [VIDEO-PROCESSOR] Starting: ${mediaId}`);
    
    // 1. Write buffer to disk (FFmpeg needs a file path)
    fs.writeFileSync(inputPath, rawBuffer);

    // 2. Transcode & Compress & Generate Thumbnail (Parallel)
    const compressionPromise = new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .size("720x?") // Standard Instagram-style feed size
        .videoBitrate("2000k")
        .outputOptions("-crf 23") // Good balance of quality/size
        .outputOptions("-preset fast")
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    const thumbnailPromise = new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .screenshots({
            timestamps: ["1"], // Grab frame at 1 second
            filename: path.basename(thumbPath),
            folder: path.dirname(thumbPath),
            size: "720x1280", // Vertical Reel format
          })
          .on("end", resolve)
          .on("error", reject);
      });

    await Promise.all([compressionPromise, thumbnailPromise]);

    // 3. Upload to S3
    const videoKey = buildS3Key("optimized.mp4", STORAGE_FOLDERS.VIDEOS, `${userId}/${mediaId}`);
    const thumbKey = buildS3Key("thumbnail.jpg", STORAGE_FOLDERS.VIDEOS, `${userId}/${mediaId}`);

    await Promise.all([
      storage.uploadObject(fs.readFileSync(outputPath), videoKey, { contentType: "video/mp4" }),
      storage.uploadObject(fs.readFileSync(thumbPath), thumbKey, { contentType: "image/jpeg" })
    ]);

    logger.info(`✅ [VIDEO-PROCESSOR] Finished: ${mediaId}`);

    return {
      variants: {
        video: videoKey,
        thumbnail: thumbKey
      }
    };
  } catch (error) {
    logger.error(`❌ [VIDEO-PROCESSOR] failure: ${error.message}`);
    throw error;
  } finally {
    // 4. CLEANUP (Always delete temp files)
    [inputPath, outputPath, thumbPath].forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  }
};

export default { processVideo };
