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

/**
 * Fetch public channel data using API KEY (1 Unit Cost)
 * Supports fetching by ID or by Handle.
 * @param {object} params - { identifier, type: 'id' | 'handle' }
 */
export const getChannelPublicData = async ({ identifier, type }) => {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    throw new ApiError(500, "YouTube API Key is not configured on the server.");
  }

  try {
    logger.info(`📡 [YT-API] Public fetch: ${type}=${identifier}`);
    
    const queryParams = {
      part: "snippet,statistics,brandingSettings,contentDetails",
      key: API_KEY,
    };

    if (type === "handle") {
      queryParams.forHandle = identifier.replace("@", "");
    } else {
      queryParams.id = identifier;
    }

    const response = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
      params: queryParams,
    });

    const items = response.data.items || [];
    if (items.length === 0) {
      throw new ApiError(404, `No YouTube channel found for ${identifier}`);
    }

    const channel = items[0];
    return {
      channelId: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      thumbnailUrl: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(channel.statistics?.subscriberCount || "0"),
      videoCount: parseInt(channel.statistics?.videoCount || "0"),
      uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || null,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error(`❌ [YT-API] Public Channel fetch failed: ${error.message}`);
    throw new ApiError(error.response?.status || 502, "Failed to verify channel directly with YouTube.");
  }
};

export default {
  discoverChannels,
  getChannelPublicData,
};
