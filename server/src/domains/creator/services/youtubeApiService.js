import axios from "axios";
import { ApiError } from "../../../shared/kernel/errors.js";
;
import logger from "../../../infrastructure/monitoring/logger.js";
import quotaManager from "./youtubeQuotaManager.js";

/**
 * PRODUCTION-GRADE YOUTUBE API SERVICE
 * Handles all direct communication with Google YouTube Data API v3.
 *
 * Quota usage per creator onboard:
 *   Call 1 — channels.list          → 1 unit  (full channel data incl. topicDetails, status)
 *   Call 2 — playlistItems.list     → 1 unit  (up to 50 video IDs)
 *   Call 3 — videos.list            → 1 unit  (full stats for those 50 video IDs)
 *   TOTAL                           → 3 units per creator
 */

// ─── Helper: parse ISO 8601 duration → seconds ────────────────────────────────
// e.g. "PT5M30S" → 330,  "PT1H2M3S" → 3723,  "PT45S" → 45
const parseDuration = (iso) => {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  return (
    (parseInt(m[1] || 0) * 3600) +
    (parseInt(m[2] || 0) * 60) +
    parseInt(m[3] || 0)
  );
};

// ─── Helper: hydrate basic video list with full stats via videos.list ──────────
// Takes the basic video array (from playlistItems) and merges in:
// viewCount, likeCount, commentCount, durationSecs, categoryId, tags, madeForKids
// videos.list supports up to 50 IDs per call = 1 unit
const hydrateVideosWithStats = async (basicVideos, authParams) => {
  if (!basicVideos || basicVideos.length === 0) return basicVideos;

  try {
    // 1 unit for up to 50 video IDs in a single call
    await quotaManager.consume(1);

    const ids = basicVideos.map((v) => v.id).join(",");

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,statistics,contentDetails,status",
          id: ids,
          ...authParams.params,
        },
        headers: authParams.headers || {},
      }
    );

    // Build lookup map keyed by video ID
    const statsMap = {};
    (response.data.items || []).forEach((v) => {
      statsMap[v.id] = v;
    });

    logger.info(
      `📊 [YT-API] videos.list returned stats for ${Object.keys(statsMap).length}/${basicVideos.length} videos.`
    );

    // Merge stats into each basic video object
    return basicVideos.map((v) => {
      const s = statsMap[v.id];
      if (!s) return v; // API didn't return this video — keep basic data

      return {
        ...v,
        // Override title/description/thumbnail with higher-quality data from videos.list
        title:       s.snippet?.title       || v.title,
        description: s.snippet?.description || v.description,
        thumbnail:
          s.snippet?.thumbnails?.maxres?.url ||
          s.snippet?.thumbnails?.high?.url   ||
          s.snippet?.thumbnails?.medium?.url ||
          v.thumbnail,
        // NEW fields from videos.list
        viewCount:    String(s.statistics?.viewCount    || "0"),
        likeCount:    String(s.statistics?.likeCount    || "0"),
        commentCount: String(s.statistics?.commentCount || "0"),
        durationSecs: parseDuration(s.contentDetails?.duration),
        categoryId:   s.snippet?.categoryId  || null,
        tags:         s.snippet?.tags         || [],
        madeForKids:  s.status?.madeForKids   || false,
        definition:   s.contentDetails?.definition || null, // "hd" or "sd"
      };
    });

  } catch (err) {
    logger.warn(
      `⚠️ [YT-API] videos.list hydration failed (${err.message}). Storing basic data without stats.`
    );
    return basicVideos; // Degrade gracefully — basic info is still stored
  }
};

// ─── discoverChannels ─────────────────────────────────────────────────────────
/**
 * Discover channels associated with the provided Google Access Token.
 * Quota: 1 (channels.list) + 1 (playlistItems.list) + 1 (videos.list) = 3 units per channel
 * @param {string} accessToken - OAuth2 Access Token
 * @returns {Promise<Array>} - List of fully hydrated channel data
 */
export const discoverChannels = async (accessToken) => {
  try {
    logger.info("🎬 [YT-API] Fetching channels for user...");

    // ── Call 1: channels.list (1 unit) ────────────────────────────────────────
    // Adding topicDetails + status + brandingSettings costs ZERO extra quota.
    // Parts are free within the same single API call unit.
    await quotaManager.consume(1);

    const channelResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "snippet,statistics,contentDetails,topicDetails,brandingSettings,status",
          mine: true,
          maxResults: 5,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const rawChannels = channelResponse.data.items || [];
    logger.info(
      `🔍 [YT-API] Google returned ${rawChannels.length} channels for this token.`
    );
    rawChannels.forEach((ch, idx) => {
      logger.info(`   [${idx}] Name: ${ch.snippet?.title} | ID: ${ch.id}`);
    });

    // ── Hydrate each channel with its latest 50 videos ────────────────────────
    const hydratedChannels = await Promise.all(
      rawChannels.map(async (item) => {
        const uploadsPlaylistId =
          item.contentDetails?.relatedPlaylists?.uploads;
        let videos = [];

        if (uploadsPlaylistId) {
          try {
            // ── Call 2: playlistItems.list (1 unit) — get 50 video IDs ────────
            await quotaManager.consume(1);

            const videoResponse = await axios.get(
              "https://www.googleapis.com/youtube/v3/playlistItems",
              {
                params: {
                  part: "snippet",
                  playlistId: uploadsPlaylistId,
                  maxResults: 50, // Max allowed per 1 unit — was incorrectly set to 25 before
                },
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            // Build basic video list (title, thumb, publishedAt only at this stage)
            const basicVideos = (videoResponse.data.items || []).map((v) => ({
              id:           v.snippet.resourceId.videoId,
              title:        v.snippet.title,
              description:  v.snippet.description || null,
              thumbnail:
                v.snippet.thumbnails?.maxres?.url  ||
                v.snippet.thumbnails?.high?.url    ||
                v.snippet.thumbnails?.medium?.url  ||
                v.snippet.thumbnails?.default?.url,
              publishedAt:  v.snippet.publishedAt,
              channelTitle: v.snippet.channelTitle || null,
              // Default stats — overwritten by videos.list hydration below
              viewCount:    "0",
              likeCount:    "0",
              commentCount: "0",
              durationSecs: null,
              categoryId:   null,
              tags:         [],
              madeForKids:  false,
            }));

            logger.info(
              `📋 [YT-API] playlistItems returned ${basicVideos.length} videos for channel ${item.id}`
            );

            // ── Call 3: videos.list (1 unit) — hydrate all 50 with full stats ──
            videos = await hydrateVideosWithStats(basicVideos, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });

          } catch (videoError) {
            logger.error(
              `⚠️ [YT-API] Failed to fetch videos for ${item.id}: ${videoError.message}`
            );
          }
        }

        // Resolve language from multiple possible locations in the API response
        const language =
          item.snippet?.defaultLanguage ||
          item.brandingSettings?.channel?.defaultLanguage ||
          null;

        return {
          // ── Identity ──
          channelId:   item.id,
          channelName: item.snippet?.title || "Untitled Channel",
          customUrl:   item.snippet?.customUrl || null,
          description: item.snippet?.description || null,
          publishedAt: item.snippet?.publishedAt || null,
          country:     item.snippet?.country || null,
          language,

          // ── Thumbnails ──
          thumbnailUrl:
            item.snippet?.thumbnails?.high?.url   ||
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            null,

          // ── Statistics ──
          subscriberCount:      Number(item.statistics?.subscriberCount || 0),
          videoCount:           Number(item.statistics?.videoCount      || 0),
          viewCount:            String(item.statistics?.viewCount       || "0"),
          hiddenSubscriberCount: item.statistics?.hiddenSubscriberCount || false,

          // ── Branding ──
          bannerUrl: item.brandingSettings?.image?.bannerExternalUrl || null,
          keywords:  item.brandingSettings?.channel?.keywords        || null,

          // ── Topic / Safety (NEW — was never fetched before) ──
          topicCategories: item.topicDetails?.topicCategories || [],
          madeForKids:     item.status?.madeForKids || false,

          // ── Playlist & Videos ──
          uploadsPlaylistId: uploadsPlaylistId || null,
          videos,
        };
      })
    );

    return hydratedChannels;

  } catch (error) {
    const status = error.response?.status || 500;
    if (status === 401)
      throw new ApiError(401, "Google token expired. Please reconnect YouTube.");
    if (status === 403)
      throw new ApiError(403, "YouTube permission denied. Check OAuth scopes.");

    logger.error(`❌ [YT-API] Channel discovery failed: ${error.message}`);
    throw new ApiError(502, "Failed to fetch YouTube data from Google.");
  }
};

// ─── getChannelPublicData ─────────────────────────────────────────────────────
/**
 * Fetch public channel data using API KEY (1 unit)
 * Supports fetching by ID or by Handle.
 * Now includes topicDetails and status (zero extra quota cost).
 * @param {object} params - { identifier, type: 'id' | 'handle' }
 */
export const getChannelPublicData = async ({ identifier, type }) => {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    throw new ApiError(500, "YouTube API Key is not configured on the server.");
  }

  try {
    logger.info(`📡 [YT-API] Public fetch: ${type}=${identifier}`);

    // 1 unit — same cost regardless of how many parts we request
    await quotaManager.consume(1);

    const queryParams = {
      part: "snippet,statistics,brandingSettings,contentDetails,topicDetails,status",
      key: API_KEY,
    };

    if (type === "handle") {
      queryParams.forHandle = identifier.replace("@", "");
    } else {
      queryParams.id = identifier;
    }

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      { params: queryParams }
    );

    const items = response.data.items || [];
    if (items.length === 0) {
      throw new ApiError(404, `No YouTube channel found for ${identifier}`);
    }

    const channel = items[0];

    const language =
      channel.snippet?.defaultLanguage ||
      channel.brandingSettings?.channel?.defaultLanguage ||
      null;

    return {
      // ── Identity ──
      channelId:   channel.id,
      channelName: channel.snippet.title,
      title:       channel.snippet.title,
      description: channel.snippet.description,
      customUrl:   channel.snippet.customUrl,
      publishedAt: channel.snippet.publishedAt,
      country:     channel.snippet.country || null,
      language,

      // ── Thumbnails ──
      thumbnailUrl:
        channel.snippet.thumbnails?.high?.url    ||
        channel.snippet.thumbnails?.medium?.url  ||
        channel.snippet.thumbnails?.default?.url,

      // ── Statistics ──
      subscriberCount:       parseInt(channel.statistics?.subscriberCount || "0"),
      videoCount:            parseInt(channel.statistics?.videoCount      || "0"),
      viewCount:             String(channel.statistics?.viewCount         || "0"),
      hiddenSubscriberCount: channel.statistics?.hiddenSubscriberCount    || false,

      // ── Branding ──
      bannerUrl: channel.brandingSettings?.image?.bannerExternalUrl || null,
      keywords:  channel.brandingSettings?.channel?.keywords        || null,

      // ── Topic / Safety (NEW) ──
      topicCategories: channel.topicDetails?.topicCategories || [],
      madeForKids:     channel.status?.madeForKids           || false,

      // ── Playlist ──
      uploadsPlaylistId:
        channel.contentDetails?.relatedPlaylists?.uploads || null,
    };

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error(`❌ [YT-API] Public Channel fetch failed: ${error.message}`);
    throw new ApiError(
      error.response?.status || 502,
      "Failed to verify channel directly with YouTube."
    );
  }
};

// ─── getPlaylistVideos ────────────────────────────────────────────────────────
/**
 * Fetch latest 50 videos from a public playlist using API KEY.
 * Quota: 1 (playlistItems.list) + 1 (videos.list) = 2 units
 * Returns fully hydrated video objects with stats.
 * @param {string} playlistId
 * @param {number} maxResults - Capped at 50 (1 unit limit for videos.list)
 */
export const getPlaylistVideos = async (playlistId, maxResults = 50) => {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) throw new ApiError(500, "YouTube API Key is missing.");

  try {
    // ── Step 1: playlistItems.list — get video IDs (1 unit) ──────────────────
    await quotaManager.consume(1);

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/playlistItems",
      {
        params: {
          part: "snippet",
          playlistId,
          maxResults: Math.min(maxResults, 50), // Hard cap at 50 — videos.list handles max 50 per call
          key: API_KEY,
        },
      }
    );

    const basicVideos = (response.data.items || []).map((v) => ({
      id:           v.snippet.resourceId.videoId,
      title:        v.snippet.title,
      description:  v.snippet.description || null,
      thumbnail:
        v.snippet.thumbnails?.maxres?.url  ||
        v.snippet.thumbnails?.high?.url    ||
        v.snippet.thumbnails?.medium?.url  ||
        v.snippet.thumbnails?.default?.url,
      publishedAt:  v.snippet.publishedAt,
      channelTitle: v.snippet.channelTitle || null,
      // Stats default — overwritten by hydration below
      viewCount:    "0",
      likeCount:    "0",
      commentCount: "0",
      durationSecs: null,
      categoryId:   null,
      tags:         [],
      madeForKids:  false,
    }));

    // ── Step 2: videos.list — full stats (1 unit for up to 50 IDs) ───────────
    return await hydrateVideosWithStats(basicVideos, {
      params: { key: API_KEY },
    });

  } catch (error) {
    logger.error(`❌ [YT-API] Playlist fetch failed: ${error.message}`);
    return []; // Return empty instead of failing the whole flow
  }
};

export default {
  discoverChannels,
  getChannelPublicData,
  getPlaylistVideos,
};
