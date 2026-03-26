// server/utils/cloudflareService.js
import axios from 'axios';
import logger from './logger.js';

/**
 * Purge specific URLs from Cloudflare Edge Cache
 * @param {string[]} urls - List of full URLs to purge
 */
export const purgeCloudflareCache = async (urls) => {
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!zoneId || !apiToken) {
        // Silently skip if not configured (e.g., in local dev)
        return;
    }

    try {
        const response = await axios.post(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
            { files: urls },
            {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.success) {
            logger.info(`[Cloudflare] Successfully purged ${urls.length} URLs from edge cache.`);
        } else {
            logger.error(`[Cloudflare] Purge failed: ${JSON.stringify(response.data.errors)}`);
        }
    } catch (error) {
        logger.error(`[Cloudflare] Cache purge error: ${error.message}`);
    }
};

/**
 * Specifically purge the Reels Feed API for the production domain
 */
export const purgeReelsFeedCache = async () => {
    const productionUrl = "https://api.suvix.in/api/reels/feed";
    await purgeCloudflareCache([productionUrl]);
};
