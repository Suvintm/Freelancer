import ffmpeg from "fluent-ffmpeg";
import ffprobe from "ffprobe-static";
import ffmpegStatic from "ffmpeg-static";
import path from "path";
import fs from "fs";
import os from "os";
import { buildS3Key } from "../providers/s3/s3.utils.js";
import { STORAGE_FOLDERS } from "../providers/s3/s3.constants.js";
import storage from "../storage.service.js";
import logger from "../../monitoring/logger.js";

// 🚀 Set the FFmpeg binaries path (Production Ready)
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobe.path);

/**
 * 🎥 VIDEO PROCESSOR
 * Handles Transcoding, Compression, and Thumbnail Extraction.
 */

export const processVideo = async (rawBuffer, userId, mediaId, folder, options = {}) => {
  const { cacheControl } = options;
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

    // 3. Extract original video metadata to determine ABR limits
    logger.info(`📡 [FFPROBE] Probing input video for ABR capabilities...`);
    const inputMetadataPromise = new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject(err);
        const stream = metadata.streams.find(s => s.codec_type === "video");
        resolve(stream);
      });
    });
    const inputMetadata = await inputMetadataPromise;
    const inputHeight = inputMetadata?.height || 720;
    const inputWidth = inputMetadata?.width || 1280;

    // Define ABR variants based on original height (never upscale)
    // NOTE TO DEVELOPER (Suvin): I have aggressively lowered these bitrates to optimize S3 storage costs.
    // If the client demands higher visual fidelity later, upgrade 1080p back to 5000k and 720p to 2800k.
    const abrVariants = [];
    if (inputHeight >= 1080) abrVariants.push({ name: "1080p", height: 1080, bitrate: "3000k" });
    if (inputHeight >= 720) abrVariants.push({ name: "720p", height: 720, bitrate: "1500k" });
    if (inputHeight >= 480) abrVariants.push({ name: "480p", height: 480, bitrate: "1000k" });
    abrVariants.push({ name: "360p", height: 360, bitrate: "800k" });

    logger.info(`🔥 [FFMPEG] Starting Transcode Engine for ${abrVariants.length} qualities...`);

    // Create HLS temp directory
    const hlsDir = path.join(tempDir, `${mediaId}-hls`);
    if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir);

    const compressionPromise = new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .size("?x720") 
        .videoBitrate("2000k")
        .outputOptions("-crf 23")
        .outputOptions("-preset fast")
        .outputOptions("-movflags +faststart")
        .on("start", (cmd) => logger.debug(`   🚀 [FFMPEG-MP4] Command: ${cmd}`))
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    const hlsPromises = abrVariants.map((variant) => {
      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .output(path.join(hlsDir, `${variant.name}.m3u8`))
          .videoCodec("libx264")
          .audioCodec("aac")
          .size(`?x${variant.height}`)
          .videoBitrate(variant.bitrate)
          .addOptions([
            "-profile:v baseline",
            "-level 3.0",
            "-start_number 0",
            "-hls_time 3",
            "-hls_list_size 0",
            "-f hls",
            "-hls_segment_filename", path.join(hlsDir, `${variant.name}_seg%d.ts`)
          ])
          .on("start", (cmd) => logger.debug(`   🚀 [FFMPEG-HLS-${variant.name}] Command: ${cmd}`))
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });
    });

    const thumbnailPromise = new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: ["1"], 
          filename: path.basename(thumbPath),
          folder: path.dirname(thumbPath),
          size: "?x720", 
        })
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });

    await Promise.all([compressionPromise, thumbnailPromise, ...hlsPromises]);
    logger.info(`   🎬 [FFMPEG] All transcode processes complete.`);

    // Generate Master Playlist manually
    let masterContent = "#EXTM3U\n";
    abrVariants.forEach(v => {
      const bw = parseInt(v.bitrate) * 1000 + 128000;
      // Estimate width by maintaining aspect ratio
      const estimatedWidth = Math.round((inputWidth / inputHeight) * v.height);
      masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bw},RESOLUTION=${estimatedWidth}x${v.height}\n`;
      masterContent += `${v.name}.m3u8\n`;
    });
    fs.writeFileSync(path.join(hlsDir, "master.m3u8"), masterContent);
    logger.info(`   📝 [HLS] Master playlist created successfully.`);

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
    const videoKey = buildS3Key("video", folder, userId, mediaId, null, "mp4");
    const thumbKey = buildS3Key("thumbnail", folder, userId, mediaId, null, "webp");

    logger.info(`📦 [S3-UPLOAD] Storing final variants...`);
    logger.info(`   📤 [VIDEO] Key: ${videoKey}`);
    logger.info(`   📤 [THUMB] Key: ${thumbKey}`);
    
    // Upload standard files
    await Promise.all([
      storage.uploadObject(fs.readFileSync(outputPath), videoKey, { 
        contentType: "video/mp4",
        cacheControl: cacheControl // 🚀 Story TTL (12h)
      }),
      storage.uploadObject(fs.readFileSync(thumbPath), thumbKey, { 
        contentType: "image/webp",
        cacheControl: cacheControl // 🚀 Story TTL (12h)
      })
    ]);

    // Upload HLS segments
    const hlsFiles = fs.readdirSync(hlsDir);
    logger.info(`📦 [S3-HLS] Uploading ${hlsFiles.length} HLS files...`);
    const hlsUploadPromises = hlsFiles.map(file => {
      const fileKey = `${folder}/${userId}/${mediaId}/hls/${file}`;
      const isPlaylist = file.endsWith(".m3u8");
      // 🚀 MIME Standardization: application/vnd.apple.mpegurl is the industry standard for HLS playlists.
      const contentType = (isPlaylist ? "application/vnd.apple.mpegurl" : "video/mp2t").trim();
      
      // 🚀 SEGMENT OPTIMIZATION: .ts files are immutable and can be cached for 1 year.
      // .m3u8 playlists should follow the Story TTL (12h).
      // 🚀 CDN OPTIMIZATION:
      // Playlists: max-age 12h (browser), s-maxage 24h (CDN Edge).
      // Segments: max-age 1y (immutable).
      const finalCacheControl = isPlaylist 
        ? cacheControl // 🚀 Stories: 12h, Posts: 1y
        : "public, max-age=31536000, s-maxage=31536000, immutable"; // 🚀 Segments: always immutable

      return storage.uploadObject(fs.readFileSync(path.join(hlsDir, file)), fileKey, { 
        contentType,
        cacheControl: finalCacheControl
      });
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
