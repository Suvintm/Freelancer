import "../config/env.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import { Reel } from "../modules/reels/models/Reel.js";
import logger from "../utils/logger.js";

/**
 * migrateHls.js
 * trigger eager HLS transformations for all legacy video reels.
 */
const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info("Connected to MongoDB ✅");

        const legacyReels = await Reel.find({
            mediaType: "video",
            $or: [{ hlsUrl: "" }, { hlsUrl: { $exists: false } }, { hlsUrl: null }]
        });

        logger.info(`Found ${legacyReels.length} legacy video reels to migrate.`);

        for (const reel of legacyReels) {
            // Extract public_id from mediaUrl if not stored
            const parts = reel.mediaUrl.split("/");
            const filename = parts[parts.length - 1];
            const folder = parts[parts.length - 2];
            const publicId = reel.cloudinaryPublicId || `${folder}/${filename.split(".")[0]}`;

            logger.info(`Migrating Reel: ${reel._id} (Public ID: ${publicId})`);

            try {
                // Trigger eager transformation without re-uploading
                await cloudinary.uploader.explicit(publicId, {
                    type: "upload",
                    resource_type: "video",
                    eager: [
                        { streaming_profile: "auto", format: "m3u8" },
                        { width: 600, aspect_ratio: "9:16", crop: "fill", format: "jpg" }
                    ],
                    eager_async: true,
                    eager_notification_url: `${process.env.BACKEND_URL}/api/reels/webhooks/cloudinary`
                });

                await Reel.findByIdAndUpdate(reel._id, { 
                    processingStatus: "processing",
                    cloudinaryPublicId: publicId 
                });
                
                logger.info(`Successfully triggered migration for ${reel._id}`);
            } catch (err) {
                logger.error(`Failed to trigger migration for ${reel._id}: ${err.message}`);
            }
        }

        logger.info("Migration trigger complete! Cloudinary will process HLS asynchronously.");
        process.exit(0);
    } catch (err) {
        logger.error(`CRITICAL: Migration failed: ${err.message}`);
        process.exit(1);
    }
};

migrate();
