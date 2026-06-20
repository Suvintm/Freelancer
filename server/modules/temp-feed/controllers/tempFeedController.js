import { TempFeed } from "../models/TempFeed.js";
import cloudinary from "../../../config/cloudinary.js";
import logger from "../../../utils/logger.js";

/**
 * Upload a file buffer to Cloudinary
 */
const uploadToCloudinary = (fileBuffer, resourceType = "auto", folder = "temp_feed") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: folder,
      },
      (error, result) => {
        if (error) {
          logger.error(`❌ [CLOUDINARY] Upload failed: ${error.message}`);
          return reject(error);
        }
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
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
    const { type, user, location, comment, tags, ytChannelName, ytSubscribeLink } = req.body;

    if (!type || !user) {
      return res.status(400).json({ success: false, message: "Type and User are required fields." });
    }

    if (!["reel", "post", "yt_video"].includes(type)) {
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
    };

    if (type === "reel" || type === "yt_video") {
      // Expect a video file
      const videoFiles = req.files?.video;
      if (!videoFiles || videoFiles.length === 0) {
        return res.status(400).json({ success: false, message: `Video file is required for ${type}.` });
      }

      const videoFile = videoFiles[0];
      logger.info(`🛰️ [TEMP-FEED] Uploading video to Cloudinary for ${type}...`);
      const uploadResult = await uploadToCloudinary(videoFile.buffer, "video", "temp_feed/videos");
      
      feedData.videoUrl = uploadResult.secure_url;
      feedData.videoPublicId = uploadResult.public_id;
    } else if (type === "post") {
      // Expect one or more image files
      const imageFiles = req.files?.images;
      if (!imageFiles || imageFiles.length === 0) {
        return res.status(400).json({ success: false, message: "At least one image is required for a post." });
      }

      logger.info(`🛰️ [TEMP-FEED] Uploading ${imageFiles.length} image(s) to Cloudinary...`);
      const uploadPromises = imageFiles.map((file) =>
        uploadToCloudinary(file.buffer, "image", "temp_feed/images")
      );

      const uploadResults = await Promise.all(uploadPromises);
      feedData.images = uploadResults.map((res) => res.secure_url);
      feedData.imagesPublicIds = uploadResults.map((res) => res.public_id);
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
    const items = await TempFeed.aggregate([{ $sample: { size: 10 } }]);
    return res.status(200).json({ success: true, count: items.length, data: items });
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
