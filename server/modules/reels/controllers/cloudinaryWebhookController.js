import { Reel } from "../models/Reel.js";
import { Portfolio } from "../../profiles/models/Portfolio.js";
import { asyncHandler } from "../../../middleware/errorHandler.js";
import logger from "../../../utils/logger.js";

/**
 * cloudinaryWebhookController
 * @desc Handles async signals from Cloudinary (HLS completion, focus-point tracking, etc.)
 * @route POST /api/reels/webhooks/cloudinary
 */
export const cloudinaryWebhookController = asyncHandler(async (req, res) => {
    const { notification_type, public_id, eager, duration } = req.body;

    logger.info(`Cloudinary Webhook Received: ${notification_type} for ${public_id}`);

    // We only care about eager transformation completions
    if (notification_type === "eager") {
        const portfolio = await Portfolio.findOne({ cloudinaryPublicId: public_id });
        const reel = await Reel.findOne({ cloudinaryPublicId: public_id });

        if (!portfolio && !reel) {
            logger.warn(`Webhook: No Portfolio or Reel found for public_id: ${public_id}`);
            return res.status(200).json({ success: true, message: "No match found" });
        }

        // Extract the generated URLs from the 'eager' array
        // sp_full_hd generates multiple manifests, eager usually contains them
        const hlsData = eager.find(e => e.transformation.includes("sp_full_hd") || e.format === "m3u8");
        const thumbData = eager.find(e => e.transformation.includes("c_fill,g_auto,h_640,w_360") || e.format === "jpg");

        const updateData = {
            processingStatus: "complete",
            duration: duration || 0,
            ...(hlsData && { hlsUrl: hlsData.secure_url }),
            ...(thumbData && { thumbnailUrl: thumbData.secure_url })
        };

        if (portfolio) {
            await Portfolio.findByIdAndUpdate(portfolio._id, updateData);
            logger.info(`Portfolio ${portfolio._id} media processing complete.`);
        }

        if (reel) {
            await Reel.findByIdAndUpdate(reel._id, updateData);
            logger.info(`Reel ${reel._id} media processing complete.`);
        }
    }

    // Always return 200 to Cloudinary to stop retries
    res.status(200).json({ success: true });
});
