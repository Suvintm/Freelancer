import axios from "axios";
import { ApiError } from "../../../middleware/errorHandler.js";
import logger from "../../../utils/logger.js";

/**
 * PRODUCTION-GRADE YOUTUBE API SERVICE
 * Handles all direct communication with Google YouTube Data API v3.
 */

/**
 * Discover channels associated with the provided Google Access Token
 * @param {string} accessToken - OAuth2 Access Token
 * @returns {Promise<Array>} - List of formatted channel data
 */
export const discoverChannels = async (accessToken) => {
  try {
    logger.info("🎬 [YT-API] Fetching channels for user...");
    
    // 1. Fetch Basic Channel Info
    const channelResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "snippet,statistics,contentDetails",
          mine: true,
          maxResults: 5,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const rawChannels = channelResponse.data.items || [];
    logger.info(`🔍 [YT-API] Google returned ${rawChannels.length} channels for this token.`);
    rawChannels.forEach((ch, idx) => {
      logger.info(`   [${idx}] Name: ${ch.snippet?.title} | ID: ${ch.id}`);
    });
    
    // 2. Hydrate each channel with its latest 15 videos
    const hydratedChannels = await Promise.all(
      rawChannels.map(async (item) => {
        const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;
        let videos = [];

        if (uploadsPlaylistId) {
          try {
            const videoResponse = await axios.get(
              "https://www.googleapis.com/youtube/v3/playlistItems",
              {
                params: {
                  part: "snippet",
                  playlistId: uploadsPlaylistId,
                  maxResults: 15,
                },
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            videos = (videoResponse.data.items || []).map((v) => ({
              id: v.snippet.resourceId.videoId,
              title: v.snippet.title,
              thumbnail:
                v.snippet.thumbnails?.high?.url ||
                v.snippet.thumbnails?.medium?.url ||
                v.snippet.thumbnails?.default?.url,
              publishedAt: v.snippet.publishedAt,
            }));
          } catch (videoError) {
            logger.error(`⚠️ [YT-API] Failed to fetch videos for ${item.id}: ${videoError.message}`);
          }
        }

        return {
          channelId: item.id,
          channelName: item.snippet?.title || "Untitled Channel",
          thumbnailUrl:
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            null,
          subscriberCount: Number(item.statistics?.subscriberCount || 0),
          videoCount: Number(item.statistics?.videoCount || 0),
          uploadsPlaylistId: uploadsPlaylistId || null,
          videos,
        };
      })
    );

    return hydratedChannels;
  } catch (error) {
    const status = error.response?.status || 500;
    if (status === 401) throw new ApiError(401, "Google token expired. Please reconnect YouTube.");
    if (status === 403) throw new ApiError(403, "YouTube permission denied. Check OAuth scopes.");
    
    logger.error(`❌ [YT-API] Channel discovery failed: ${error.message}`);
    throw new ApiError(502, "Failed to fetch YouTube data from Google.");
  }
};

export default {
  discoverChannels,
};
