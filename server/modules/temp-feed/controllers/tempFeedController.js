import { TempFeed } from "../models/TempFeed.js";
import cloudinary from "../../../config/cloudinary.js";
import logger from "../../../utils/logger.js";
import fs from "fs";
import { withCache } from "../../../utils/cache.js";

/**
 * Upload a file path to Cloudinary
 */
const uploadToCloudinary = (filePath, resourceType = "auto", folder = "temp_feed") => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: resourceType,
      folder: folder,
    };

    // Force standard web-compatible H.264/AAC MP4 format for all video uploads eagerly
    // This prevents mobile HEVC/HDR videos from showing a black screen on laptops.
    if (resourceType === "video") {
      uploadOptions.eager = [
        { format: "mp4", video_codec: "h264", audio_codec: "aac", quality: "auto" }
      ];
      uploadOptions.eager_async = true;
    }

    cloudinary.uploader.upload(filePath, uploadOptions, (error, result) => {
      if (error) {
        logger.error(`❌ [CLOUDINARY] Upload failed: ${error.message}`);
        return reject(error);
      }
      resolve(result);
    });
  });
};

/**
 * Delete an asset from Cloudinary
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info(`🗑️ [CLOUDINARY] Deleted asset: ${publicId}, result: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    logger.error(`❌ [CLOUDINARY] Deletion failed for ${publicId}: ${error.message}`);
    return null;
  }
};

/**
 * Create a new temporary feed item
 */
export const createTempFeedItem = async (req, res) => {
  try {
    const { type, user, location, comment, tags, ytChannelName, ytSubscribeLink, watchOnYtLink } = req.body;

    if (!type || !user) {
      return res.status(400).json({ success: false, message: "Type and User are required fields." });
    }

    if (!["reel", "post", "yt_video", "thumbnail_vote"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid feed item type." });
    }

    let parsedTags = [];
    if (tags) {
      parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // Generate 3 random dummy faces for UI
    const dummyFaces = [
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&crop=faces&r=${Math.random()}`,
      `https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&crop=faces&r=${Math.random()}`,
      `https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&crop=faces&r=${Math.random()}`
    ];

    let feedData = {
      type,
      user,
      location: location || "",
      comment: comment || "",
      tags: parsedTags,
      likedByAvatars: dummyFaces,
      ytChannelName: ytChannelName || "",
      ytSubscribeLink: ytSubscribeLink || "",
      watchOnYtLink: watchOnYtLink || "",
    };

    if (type === "reel" || type === "yt_video") {
      // Expect a video file
      const videoFiles = req.files?.video;
      if (!videoFiles || videoFiles.length === 0) {
        return res.status(400).json({ success: false, message: `Video file is required for ${type}.` });
      }

      const videoFile = videoFiles[0];
      logger.info(`🛰️ [TEMP-FEED] Uploading video to Cloudinary for ${type}...`);
      const uploadResult = await uploadToCloudinary(videoFile.path, "video", "temp_feed/videos");
      try { fs.unlinkSync(videoFile.path); } catch (e) { logger.warn(`Failed to cleanup temp file: ${e.message}`); }
      
      // Ensure universal playback across laptops by rewriting URL to specifically request H.264 MP4 format
      const rawUrl = uploadResult.secure_url;
      let safeVideoUrl = rawUrl;
      
      if (rawUrl.includes('/upload/')) {
        const urlParts = rawUrl.split('/upload/');
        let pathPart = urlParts[1];
        
        // Strip out the original extension (e.g. .mov) and force .mp4
        const lastDotIndex = pathPart.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          pathPart = pathPart.substring(0, lastDotIndex) + '.mp4';
        } else {
          pathPart += '.mp4';
        }
        
        // Inject Cloudinary delivery transformations
        safeVideoUrl = `${urlParts[0]}/upload/f_mp4,vc_h264,ac_aac,q_auto/${pathPart}`;
      }

      feedData.videoUrl = safeVideoUrl;
      feedData.videoPublicId = uploadResult.public_id;
    } else if (type === "post" || type === "thumbnail_vote") {
      // Expect one or more image files
      const imageFiles = req.files?.images;
      if (!imageFiles || imageFiles.length === 0) {
        return res.status(400).json({ success: false, message: `At least one image is required for ${type}.` });
      }

      if (type === "thumbnail_vote" && imageFiles.length < 2) {
        return res.status(400).json({ success: false, message: "Please select at least 2 images for a thumbnail vote." });
      }

      logger.info(`🛰️ [TEMP-FEED] Uploading ${imageFiles.length} image(s) to Cloudinary for ${type}...`);
      const uploadPromises = imageFiles.map((file) =>
        uploadToCloudinary(file.path, "image", "temp_feed/images").finally(() => {
          try { fs.unlinkSync(file.path); } catch (e) { logger.warn(`Failed to cleanup temp image file: ${e.message}`); }
        })
      );

      const uploadResults = await Promise.all(uploadPromises);
      feedData.images = uploadResults.map((res) => res.secure_url);
      feedData.imagesPublicIds = uploadResults.map((res) => res.public_id);

      if (type === "thumbnail_vote") {
        feedData.votes = new Array(uploadResults.length).fill(0);
      }
    }

    const newItem = new TempFeed(feedData);
    await newItem.save();

    logger.info(`✅ [TEMP-FEED] Created new temporary feed item: ${newItem._id} (${type})`);
    return res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    logger.error(`❌ [TEMP-FEED] Create item failed: ${error.message}`);
    return res.status(500).json({ success: false, message: "Server error creating feed item." });
  }
};

/**
 * Get all temporary feed items
 */
export const getTempFeed = async (req, res) => {
  try {
    const count = await TempFeed.countDocuments();
    if (count === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Cache random feed for 60 seconds to avoid DB pounding
    const cacheKey = `cache:tempfeed:random`;
    const TTL_SECONDS = 60;

    const data = await withCache(cacheKey, TTL_SECONDS, async () => {
      // Instead of $sample which causes full collection scan, use an offset
      const randomOffset = Math.max(0, Math.floor(Math.random() * count) - 10);
      const items = await TempFeed.find().skip(randomOffset).limit(10);
      
      // Shuffle the result array in memory for true randomness
      return items.sort(() => 0.5 - Math.random());
    });
    
    return res.status(200).json({ success: true, count: data.length, data: data });
  } catch (error) {
    logger.error(`❌ [TEMP-FEED] Fetch feed failed: ${error.message}`);
    return res.status(500).json({ success: false, message: "Server error fetching feed items." });
  }
};

/**
 * Delete a temporary feed item and clean up Cloudinary assets
 */
export const deleteTempFeedItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await TempFeed.findById(id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Feed item not found." });
    }

    logger.info(`🗑️ [TEMP-FEED] Deleting feed item ${id} and cleaning up assets...`);

    // Delete video if exists
    if (item.videoPublicId) {
      await deleteFromCloudinary(item.videoPublicId, "video");
    }

    // Delete images if exist
    if (item.imagesPublicIds && item.imagesPublicIds.length > 0) {
      const deletePromises = item.imagesPublicIds.map((publicId) =>
        deleteFromCloudinary(publicId, "image")
      );
      await Promise.all(deletePromises);
    }

    await TempFeed.findByIdAndDelete(id);

    logger.info(`✅ [TEMP-FEED] Successfully deleted feed item: ${id}`);
    return res.status(200).json({ success: true, message: "Feed item deleted successfully." });
  } catch (error) {
    logger.error(`❌ [TEMP-FEED] Delete item failed: ${error.message}`);
    return res.status(500).json({ success: false, message: "Server error deleting feed item." });
  }
};

/**
 * Register a vote for a specific thumbnail option
 */
export const voteTempFeedItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageIndex, previousImageIndex } = req.body;

    if (imageIndex === undefined || typeof imageIndex !== 'number') {
      return res.status(400).json({ success: false, message: "imageIndex is required and must be a number." });
    }

    const item = await TempFeed.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Feed item not found." });
    }

    if (item.type !== 'thumbnail_vote') {
      return res.status(400).json({ success: false, message: "Only thumbnail_vote items can be voted on." });
    }

    // Initialize votes array if it doesn't exist or is not the correct length
    if (!item.votes || item.votes.length !== item.images.length) {
      const newVotes = new Array(item.images.length).fill(0);
      if (item.votes) {
        for (let i = 0; i < Math.min(item.votes.length, newVotes.length); i++) {
          newVotes[i] = item.votes[i];
        }
      }
      item.votes = newVotes;
    }

    if (imageIndex < 0 || imageIndex >= item.images.length) {
      return res.status(400).json({ success: false, message: "Invalid imageIndex." });
    }

    // Decrement previous vote if provided and positive
    if (previousImageIndex !== undefined && typeof previousImageIndex === 'number') {
      if (previousImageIndex >= 0 && previousImageIndex < item.images.length) {
        if (item.votes[previousImageIndex] > 0) {
          item.votes[previousImageIndex] -= 1;
        }
      }
    }

    item.votes[imageIndex] += 1;
    item.markModified('votes');
    await item.save();

    logger.info(`✅ [TEMP-FEED] Vote registered for item ${id} at image index ${imageIndex} (previous: ${previousImageIndex})`);
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    logger.error(`❌ [TEMP-FEED] Vote failed: ${error.message}`);
    return res.status(500).json({ success: false, message: "Server error registering vote." });
  }
};
