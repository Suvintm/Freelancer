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

export const processVideo = async (rawBuffer, userId, mediaId, folder = STORAGE_FOLDERS.VIDEOS) => {
  const tempDir = path.join(os.tmpdir(), "suvix-media");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const inputPath = path.join(tempDir, `${mediaId}-raw.mp4`);
  const outputPath = path.join(tempDir, `${mediaId}-optimized.mp4`);
  const thumbPath = path.join(tempDir, `${mediaId}-thumb.jpg`);

  try {
    logger.info(`🎥 [VIDEO-PROCESSOR] Starting: ${mediaId}`);
    
    // 1. Write buffer to disk (FFmpeg needs a file path)
    logger.info(`💾 [VIDEO] Buffering raw stream to disk... Size: ${rawBuffer.length} bytes`);
    fs.writeFileSync(inputPath, rawBuffer);
    logger.info(`📝 [DISK] Raw file written to: ${inputPath}`);

    // 3. Transcode & Compress & Generate Thumbnail & HLS (Parallel)
    logger.info(`🔥 [FFMPEG] Starting Transcode Engine (MP4 + HLS Chunks)...`);
    
    // Create HLS temp directory
    const hlsDir = path.join(tempDir, `${mediaId}-hls`);
    if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir);

    const compressionPromise = new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .size("720x?") 
        .videoBitrate("2000k")
        .outputOptions("-crf 23")
        .outputOptions("-preset fast")
        .outputOptions("-movflags +faststart") // Enable "Fast Start" for immediate MP4 play
        .on("start", (cmd) => logger.debug(`   🚀 [FFMPEG-MP4] Command: ${cmd}`))
        .on("end", () => {
          logger.info(`   🎬 [FFMPEG] MP4 Optimization complete.`);
          resolve();
        })
        .on("error", (err) => {
           logger.error(`   ❌ [FFMPEG-MP4] Error: ${err.message}`);
           reject(err);
        })
        .run();
    });

    const hlsPromise = new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .output(path.join(hlsDir, "master.m3u8"))
          .videoCodec("libx264")
          .audioCodec("aac")
          .addOptions([
            "-profile:v baseline",
            "-level 3.0",
            "-start_number 0",
            "-hls_time 4", // 4 second chunks
            "-hls_list_size 0",
            "-f hls",
            "-hls_segment_filename", path.join(hlsDir, "seg%d.ts")
          ])
          .on("start", (cmd) => logger.debug(`   🚀 [FFMPEG-HLS] Command: ${cmd}`))
          .on("end", () => {
            logger.info(`   📡 [FFMPEG] HLS Segmenting complete.`);
            resolve();
          })
          .on("error", (err) => {
            logger.error(`   ❌ [FFMPEG-HLS] Error: ${err.message}`);
            reject(err);
          })
          .run();
      });

    const thumbnailPromise = new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .screenshots({
            timestamps: ["1"], 
            filename: path.basename(thumbPath),
            folder: path.dirname(thumbPath),
            size: "720x1280", 
          })
          .on("start", (cmd) => logger.debug(`   🚀 [FFMPEG-THUMB] Command: ${cmd}`))
          .on("end", () => {
            if (fs.existsSync(thumbPath)) {
               logger.info(`   📸 [FFMPEG] Thumbnail captured successfully: ${thumbPath}`);
               resolve();
            } else {
               logger.warn(`   ⚠️ [FFMPEG] Thumbnail process finished but file not found!`);
               reject(new Error("Thumbnail file not found"));
            }
          })
          .on("error", (err) => {
            logger.error(`   ❌ [FFMPEG-THUMB] Error: ${err.message}`);
            reject(err);
          });
      });

    await Promise.all([compressionPromise, hlsPromise, thumbnailPromise]);

    // 4. Extract Metadata
    logger.info(`📡 [FFPROBE] Probing final deliverables...`);
    const metadataPromise = new Promise((resolve) => {
      ffmpeg.ffprobe(outputPath, (err, metadata) => {
        if (err) {
          logger.warn(`⚠️ [VIDEO-METADATA] Failed to probe: ${err.message}`);
          resolve({});
        } else {
          const stream = metadata.streams.find(s => s.codec_type === "video");
          const result = {
            width: stream?.width,
            height: stream?.height,
            duration: Math.round(metadata.format.duration || 0),
            size: fs.statSync(outputPath).size
          };
          logger.info(`📊 [METADATA] Probed: ${result.width}x${result.height}, ${result.duration}s`);
          resolve(result);
        }
      });
    });

    const metadata = await metadataPromise;

    // 5. Upload to S3
    const videoKey = buildS3Key("optimized", folder, userId, mediaId);
    const thumbKey = buildS3Key("thumbnail", folder, userId, mediaId, null, "webp");
    // const hlsMasterKey = buildS3Key("master", `${folder}/${userId}/${mediaId}/hls`, null, null, null, "m3u8");

    logger.info(`📦 [S3-UPLOAD] Storing final variants...`);
    logger.info(`   📤 [VIDEO] Key: ${videoKey}`);
    logger.info(`   📤 [THUMB] Key: ${thumbKey}`);
    
    // Upload standard files
    await Promise.all([
      storage.uploadObject(fs.readFileSync(outputPath), videoKey, { contentType: "video/mp4" }),
      storage.uploadObject(fs.readFileSync(thumbPath), thumbKey, { contentType: "image/webp" })
    ]);

    // Upload HLS segments
    const hlsFiles = fs.readdirSync(hlsDir);
    logger.info(`📦 [S3-HLS] Uploading ${hlsFiles.length} HLS files...`);
    const hlsUploadPromises = hlsFiles.map(file => {
      const fileKey = `${folder}/${userId}/${mediaId}/hls/${file}`;
      const contentType = file.endsWith(".m3u8") ? "application/x-mpegURL" : "video/MP2T";
      return storage.uploadObject(fs.readFileSync(path.join(hlsDir, file)), fileKey, { contentType });
    });
    
    await Promise.all(hlsUploadPromises);

    logger.info(`✅ [VIDEO-PROCESSOR] Pipeline finished for Media: ${mediaId}`);

    return {
      variants: {
        video: videoKey,
        hls: `${folder}/${userId}/${mediaId}/hls/master.m3u8`,
        thumb: thumbKey
      },
      ...metadata
    };
  } catch (error) {
    logger.error(`❌ [VIDEO-PROCESSOR] failure: ${error.stack}`);
    throw error;
  } finally {
    // 4. CLEANUP (Always delete temp files)
    logger.info(`🧹 [CLEANUP] Removing temp files for: ${mediaId}`);
    [inputPath, outputPath, thumbPath].forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
    if (fs.existsSync(path.join(tempDir, `${mediaId}-hls`))) {
       fs.rmSync(path.join(tempDir, `${mediaId}-hls`), { recursive: true, force: true });
    }
  }
};

export default { processVideo };
