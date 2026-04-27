/**
 * searchFeedbackProcessor.js — Weekly Search Ranking Recalibration
 *
 * This job runs every Sunday at 02:00 and:
 * 1. Boosts rank_score on videos that users clicked from search results
 * 2. Recomputes authority_score on all channels from current subs/views
 * 3. Rebuilds the Redis suggestion index from top search dictionary terms
 * 4. Seeds suggestion index with recent video titles for cold-start coverage
 *
 * This is the feedback loop that makes SuviX search smarter over time.
 * The more users interact, the better the rankings become — automatically.
 */

import logger from "../../../utils/logger.js";
import prisma from "../../../config/prisma.js";
import YouTubeSearchEvent from "../../youtube-creator/models/YouTubeSearchEvent.js";

const searchFeedbackProcessor = async (job) => {
  logger.info("[SEARCH-FEEDBACK] 🔄 Starting weekly search ranking recalibration...");

  const summary = { videosBoosted: 0, channelsRecalibrated: 0, suggestionsIndexed: 0 };

  // ── Step 1: Boost rank_score for frequently clicked search results ──────────
  // Videos that users clicked from search → should rank higher next week
  logger.info("[SEARCH-FEEDBACK] Step 1/4: Analyzing click-through data (last 7 days from MongoDB)...");

  const topClicked = await YouTubeSearchEvent.aggregate([
    {
      $match: {
        clickedVideoId: { $ne: null },
        createdAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: "$clickedVideoId",
        click_count: { $sum: 1 }
      }
    },
    { $sort: { click_count: -1 } },
    { $limit: 500 }
  ]);

  for (const row of topClicked) {
    const boost = Math.min(parseFloat(row.click_count) * 0.01, 0.5); // max +0.5 per week
    await prisma.youTubeVideo.update({
      where: { id: row._id },
      data:  { rank_score: { increment: boost } },
    });
    summary.videosBoosted++;
  }

  logger.info(`[SEARCH-FEEDBACK] ✅ Boosted ${summary.videosBoosted} videos from click data.`);

  // ── Step 2: Recompute authority_score for all channels ─────────────────────
  // Channels gain/lose subscribers over time — recalibrate weekly
  logger.info("[SEARCH-FEEDBACK] Step 2/4: Recomputing channel authority scores...");

  const channelCount = await prisma.$executeRaw`
    UPDATE youtube_profiles SET
      authority_score = (
        LOG10(GREATEST(COALESCE(subscriber_count, 0)::float, 1) + 1) * 0.6 +
        LOG10(GREATEST(COALESCE(view_count, 0)::float, 1) + 1) * 0.4
      )
    WHERE subscriber_count IS NOT NULL OR view_count IS NOT NULL
  `;
  summary.channelsRecalibrated = Number(channelCount);

  logger.info(`[SEARCH-FEEDBACK] ✅ Recalibrated ${summary.channelsRecalibrated} channel authority scores.`);

  // ── Step 3: Rebuild Redis suggestion index ─────────────────────────────────
  // Pulls top 10,000 terms from dictionary, indexed for ZRANGEBYLEX prefix search
  logger.info("[SEARCH-FEEDBACK] Step 3/4: Rebuilding Redis suggestion index...");

  let r = null;
  try {
    const { redis } = await import("../../../config/redisClient.js");
    r = redis;
  } catch {
    logger.warn("[SEARCH-FEEDBACK] Redis unavailable — skipping suggestion index rebuild.");
  }

  if (r) {
    const topTerms = await prisma.youTubeSearchDictionary.findMany({
      where:   { popularity_score: { gt: 0 } },
      orderBy: { popularity_score: 'desc' },
      take:    10_000,
      select:  { term: true, popularity_score: true, click_score: true },
    });

    if (topTerms.length > 0) {
      // Rebuild index in batches to avoid Redis pipeline overflow
      const BATCH = 500;
      for (let i = 0; i < topTerms.length; i += BATCH) {
        const batch = topTerms.slice(i, i + BATCH);
        const pipe  = r.pipeline();
        for (const entry of batch) {
          pipe.zadd('yt:suggestions:index', 0, entry.term.toLowerCase());
          pipe.zadd('yt:suggestions:popularity', entry.popularity_score + entry.click_score * 5, entry.term.toLowerCase());
        }
        await pipe.exec();
      }
      summary.suggestionsIndexed += topTerms.length;
    }

    // ── Step 4: Seed suggestion index with recent video titles ───────────────
    // Ensures new videos appear in suggestions even before anyone searches them
    logger.info("[SEARCH-FEEDBACK] Step 4/4: Seeding suggestion index with recent video titles...");

    const recentTitles = await prisma.youTubeVideo.findMany({
      select:  { title: true },
      where:   { title: { not: '' } },
      orderBy: { published_at: 'desc' },
      take:    20_000,
    });

    const BATCH = 500;
    for (let i = 0; i < recentTitles.length; i += BATCH) {
      const batch = recentTitles.slice(i, i + BATCH);
      const pipe  = r.pipeline();
      for (const v of batch) {
        const normalized = v.title.toLowerCase().trim().slice(0, 100);
        if (normalized.length >= 2) {
          pipe.zadd('yt:suggestions:index', 0, normalized);
          // Title-based entries get a baseline popularity score of 1
          pipe.zadd('yt:suggestions:popularity', 'NX', 1, normalized);
        }
      }
      await pipe.exec();
      summary.suggestionsIndexed++;
    }

    logger.info(`[SEARCH-FEEDBACK] ✅ Indexed ${summary.suggestionsIndexed} terms into Redis.`);
  }

  // ── Step 5: Dictionary Pruning (Production Cleanup) ────────────────────────
  // Removes terms that are:
  // 1. Stale (not used in 90 days) AND
  // 2. Unpopular (popularity_score < 5)
  // This keeps the dictionary table small and high-quality.
  logger.info("[SEARCH-FEEDBACK] Step 5/5: Pruning stale dictionary terms...");
  
  const pruned = await prisma.youTubeSearchDictionary.deleteMany({
    where: {
      AND: [
        { last_used_at: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        { popularity_score: { lt: 5 } },
        { click_score: { lt: 2 } }
      ]
    }
  });
  summary.termsPruned = pruned.count;
  logger.info(`[SEARCH-FEEDBACK] 🧹 Pruned ${pruned.count} stale terms from dictionary.`);

  logger.info(`[SEARCH-FEEDBACK] 🏁 Recalibration complete.`, summary);
  return summary;
};


export default searchFeedbackProcessor;
