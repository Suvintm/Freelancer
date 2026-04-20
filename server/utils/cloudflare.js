import axios from 'axios';
import logger from './logger.js';

/**
 * 🛰️ CLOUDFLARE CACHE PURGER
 * 
 * Production-level utility to force CDN cache invalidation.
 * Ensures that deleted/expired stories are instantly removed from the edge.
 */

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

/**
 * Purges specific URLs from the Cloudflare cache.
 * @param {string[]} urls - List of absolute URLs to purge (e.g. https://cdn.suvix.in/...)
 */
export const purgeUrlsFromCache = async (urls) => {
  if (!ZONE_ID || !API_TOKEN) {
    logger.warn('⚠️ [CLOUDFLARE] Cache purge skipped — Credentials missing in .env');
    return false;
  }

  if (!urls || urls.length === 0) return true;

  try {
    logger.info(`🛰️ [CLOUDFLARE] Purging ${urls.length} URLs from CDN cache...`);
    
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
      { files: urls },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      logger.info('✅ [CLOUDFLARE] Cache purge successful.');
      return true;
    } else {
      logger.error(`❌ [CLOUDFLARE] Cache purge failed: ${JSON.stringify(response.data.errors)}`);
      return false;
    }
  } catch (error) {
    logger.error(`❌ [CLOUDFLARE] Cache purge error: ${error.message}`);
    return false;
  }
};

/**
 * Purges everything in the cache (USE WITH CAUTION).
 */
export const purgeEverything = async () => {
  if (!ZONE_ID || !API_TOKEN) return false;

  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
      { purge_everything: true },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.success;
  } catch (error) {
    logger.error(`❌ [CLOUDFLARE] Full purge error: ${error.message}`);
    return false;
  }
};

export default { purgeUrlsFromCache, purgeEverything };
