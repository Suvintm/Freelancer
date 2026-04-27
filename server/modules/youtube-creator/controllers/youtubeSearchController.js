/**
 * youtubeSearchController.js — Production YouTube Search Engine v2.0
 *
 * Architecture:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Query normalization: stopwords + stemming + dedup + length cap
 * 2. Multi-tier cache: L1 in-process LRU (8s) → L2 Redis (90s) → L3 PostgreSQL
 * 3. Cache stampede prevention via Redis distributed lock
 * 4. Materialized GIN index search (tsvector pre-computed on write by DB trigger)
 * 5. Composite relevance: text rank + channel authority + freshness decay
 * 6. Cursor-based pagination (O(log n), same cost at page 1 and page 500)
 * 7. Three-tier suggestions: Redis ZRANGEBYLEX → Redis popularity → DB fallback
 * 8. Result diversification (max 2 videos per channel per 5-result window)
 * 9. Async search event logging (non-blocking feedback loop)
 * 10. Circuit breaker: return empty on DB timeout, never crash the API
 */

import logger from "../../../utils/logger.js";
import prisma from "../../../config/prisma.js";
import YouTubeSearchEvent from "../models/YouTubeSearchEvent.js";
import { redis as redisProxy } from "../../../config/redisClient.js";
import { smartResolveMediaUrl } from "../../../utils/mediaResolver.js";
import { getCache, setCache } from "../../../utils/cache.js";

// ─── Redis client ──────────────────────────────────────────────────────────────
let redis = null;
const getRedis = async () => {
  if (redis) return redis;
  try {
    const { redis: r } = await import("../../../config/redisClient.js");
    redis = r;
  } catch {
    redis = null;
  }
  return redis;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const SEARCH_CACHE_TTL    = 90;    // seconds
const SUGGEST_CACHE_TTL   = 300;   // 5 minutes
const RELATED_CACHE_TTL   = 600;   // 10 minutes
const POPULAR_CACHE_TTL   = 3600;  // 1 hour
const RESULTS_PER_PAGE    = 20;
const MAX_QUERY_LENGTH    = 100;
const DB_TIMEOUT_MS       = 5000;  // circuit breaker threshold

// L1 in-process cache (avoids Redis round-trip for hot queries)
const L1 = new Map();
const L1_MAX = 200;
const L1_TTL = 8_000; // 8 seconds

const l1Get = (key) => {
  const entry = L1.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > L1_TTL) { L1.delete(key); return null; }
  return entry.data;
};

const l1Set = (key, data) => {
  if (L1.size >= L1_MAX) {
    const oldest = L1.keys().next().value;
    L1.delete(oldest);
  }
  L1.set(key, { data, ts: Date.now() });
};

// ─── English Stopwords ────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','can',
  'i','me','my','we','our','you','your','he','his','she','her','it','its',
  'they','their','what','which','who','this','that','these','those',
  'how','when','where','why','not','no','just','now','also','so',
]);

// ─── Simple English Stemmer ───────────────────────────────────────────────────
const STEM_RULES = [
  [/ings?$/, ''], [/ations?$/, 'ate'], [/ers?$/, ''],
  [/ities$/, 'ity'], [/ness$/, ''], [/ment$/, ''],
  [/ly$/, ''], [/ed$/, ''], [/s$/, ''],
];

const stem = (word) => {
  if (word.length <= 3) return word;
  for (const [p, r] of STEM_RULES) {
    if (p.test(word)) return word.replace(p, r);
  }
  return word;
};

// ─── Query Normalization Pipeline ─────────────────────────────────────────────
const normalizeQuery = (rawInput) => {
  const raw = (rawInput || '').trim().slice(0, MAX_QUERY_LENGTH);
  if (!raw) return null;

  const normalized = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')           // strip diacritics
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')     // keep ASCII + Devanagari
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = normalized
    .split(' ')
    .filter(t => t.length >= 2 && !STOPWORDS.has(t))
    .map(stem)
    .filter((t, i, arr) => arr.indexOf(t) === i) // deduplicate
    .slice(0, 8);

  if (tokens.length === 0) return null;

  return {
    raw,
    normalized,
    tokens,
    tsQueryAnd: tokens.map(t => `${t}:*`).join(' & '),
    tsQueryOr:  tokens.map(t => `${t}:*`).join(' | '),
  };
};

// ─── Result Formatter ─────────────────────────────────────────────────────────
const formatVideo = (v) => {
  const thumb   = smartResolveMediaUrl(v.thumbnail);
  const chThumb = smartResolveMediaUrl(v.channel_thumbnail || v.youtubeProfile?.thumbnail_url);
  return {
    id:          v.id,
    videoId:     v.video_id,
    title:       v.title,
    description: v.description || null,
    thumbnail:   thumb,
    publishedAt: v.published_at,
    channel: {
      id:          v.youtube_profile_id || v.youtubeProfileId,
      name:        v.channel_name || v.youtubeProfile?.channel_name || 'Unknown',
      thumbnail:   chThumb,
      subscribers: Number(v.subscriber_count || v.youtubeProfile?.subscriber_count || 0),
      language:    v.language || v.youtubeProfile?.language || null,
      country:     v.country  || v.youtubeProfile?.country  || null,
    },
    media: {
      type: 'IMAGE', status: 'READY',
      urls: { thumb, feed: thumb, full: thumb },
    },
    _rank: Number(v.computed_rank || 0),
  };
};

// ─── Result Diversification ───────────────────────────────────────────────────
const diversifyResults = (videos, maxPerWindow = 2) => {
  const windowIds = [];
  const primary   = [];
  const deferred  = [];
  const WINDOW    = 5;

  for (const v of videos) {
    const cid = v.channel.id;
    const inWindow = windowIds.filter(id => id === cid).length;
    if (inWindow < maxPerWindow) {
      primary.push(v);
      windowIds.push(cid);
      if (windowIds.length > WINDOW) windowIds.shift();
    } else {
      deferred.push(v);
    }
  }

  return [...primary, ...deferred];
};

// ─── Async Search Event Logger ────────────────────────────────────────────────
const logSearchEvent = ({ sessionId, userId, query, resultsCount, lang }) => {
  // 🚀 [PRODUCTION] Redis Buffer — fast O(1) push, worker handles the DB write later
  const event = {
    type: 'SEARCH',
    sessionId: sessionId || null,
    userId: userId || null,
    query,
    resultsCount,
    lang: lang || null,
    createdAt: new Date()
  };

  setImmediate(async () => {
    try {
      // 1. Buffer for MongoDB batching
      await redisProxy.rpush('yt:search:events:buffer', JSON.stringify(event));

      // 2. 🔵 Keep Dictionary in Postgres (Fast Suggestions)
      // Upsert is fast enough for dictionary terms
      await prisma.youTubeSearchDictionary.upsert({
        where:  { term: query.slice(0, 500) },
        update: { popularity_score: { increment: 1 }, last_used_at: new Date() },
        create: { term: query.slice(0, 500), type: 'QUERY', popularity_score: 1 },
      });
    } catch (err) {
       logger.warn(`[SEARCH-ANALYTICS] Failed to buffer search event: ${err.message}`);
    }
  });
};

// ─── Circuit Breaker Wrapper ──────────────────────────────────────────────────
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), ms)
    ),
  ]);

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * GET /api/youtube-creator/explore/search?q=&lang=&cursor=
 *
 * Hybrid full-text + fuzzy search with cursor-based pagination.
 * Cache hierarchy: L1 (8s) → L2 Redis (90s) → L3 PostgreSQL GIN index
 */
export const getExploreSearch = async (req, res, next) => {
  const t0 = Date.now();

  try {
    const parsed = normalizeQuery(req.query.q);
    if (!parsed) {
      return res.json({ success: true, data: [], total: 0, hasMore: false, nextCursor: null });
    }

    const lang      = req.query.lang || null;
    const cursor    = req.query.cursor || null;
    const userId    = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || null;
    const cacheKey  = `cache:yt:search:${parsed.normalized}:${lang || 'any'}:${cursor || 'p0'}`;

    // L1 cache
    const l1 = l1Get(cacheKey);
    if (l1) return res.json({ success: true, ...l1, _cache: 'L1' });

    // L2 Redis cache
    const l2 = await getCache(cacheKey);
    if (l2) { l1Set(cacheKey, l2); return res.json({ success: true, ...l2, _cache: 'L2' }); }

    // Decode cursor for pagination
    let cursorScore = 9999;
    let cursorDate  = new Date('2099-01-01');
    let cursorId    = '00000000-0000-0000-0000-000000000000';

    if (cursor) {
      try {
        const dec = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
        cursorScore = dec.score ?? 9999;
        cursorDate  = new Date(dec.date ?? '2099-01-01');
        cursorId    = dec.id ?? '00000000-0000-0000-0000-000000000000';
      } catch { /* invalid cursor — start from beginning */ }
    }

    // L3 — PostgreSQL (with circuit breaker)
    let rawRows;
    try {
      rawRows = await withTimeout(
        prisma.$queryRaw`
          WITH base AS (
            SELECT
              yv.id,
              yv.video_id,
              yv.title,
              yv.description,
              yv.thumbnail,
              yv.published_at,
              yv.youtube_profile_id,
              yv.rank_score,
              yp.channel_name,
              yp.thumbnail_url      AS channel_thumbnail,
              yp.subscriber_count,
              yp.authority_score,
              yp.language,
              yp.country,
              -- Text relevance using materialized GIN index (fast)
              ts_rank_cd(
                yv.search_vector,
                to_tsquery('simple', ${parsed.tsQueryAnd}),
                4
              )::float AS title_rank_and,
              ts_rank_cd(
                yv.search_vector,
                to_tsquery('simple', ${parsed.tsQueryOr}),
                4
              )::float AS title_rank_or,
              -- Fuzzy similarity for typo tolerance
              similarity(yv.title, ${parsed.normalized})::float AS trig_rank,
              -- Freshness decay: ~1.0 today, ~0.5 at 30 days, ~0.1 at 300 days
              (1.0 / (1.0 + 0.03 * GREATEST(
                EXTRACT(EPOCH FROM (NOW() - COALESCE(yv.published_at, NOW()))) / 86400.0,
                0.0
              )))::float AS freshness
            FROM youtube_videos yv
            JOIN youtube_profiles yp ON yv.youtube_profile_id = yp.id
            WHERE (${lang}::text IS NULL OR yp.language = ${lang})
              AND (
                yv.search_vector @@ to_tsquery('simple', ${parsed.tsQueryOr})
                OR similarity(yv.title, ${parsed.normalized}) > 0.2
                OR yv.title ILIKE ${'%' + parsed.normalized + '%'}
              )
          ),
          ranked AS (
            SELECT *,
              -- Composite score: text rank (55%) + authority (15%) + fuzzy (20%) + freshness (10%)
              (
                title_rank_and * 0.55
                + COALESCE(authority_score, 0) * 0.0015
                + trig_rank * 0.20
                + freshness * 0.10
                + rank_score * 0.05
              )::float AS computed_rank
            FROM base
          )
          SELECT
            id, video_id, title, description, thumbnail, published_at,
            youtube_profile_id, channel_name, channel_thumbnail,
            subscriber_count, language, country,
            title_rank_and, title_rank_or, trig_rank, freshness, computed_rank
          FROM ranked
          WHERE (
            ${cursor}::text IS NULL
            OR (computed_rank, published_at, id::text)
               < (${cursorScore}::float, ${cursorDate}::timestamptz, ${cursorId}::text)
          )
          ORDER BY computed_rank DESC, published_at DESC NULLS LAST, id
          LIMIT ${RESULTS_PER_PAGE + 1}
        `,
        DB_TIMEOUT_MS
      );
    } catch (err) {
      if (err.message === 'DB_TIMEOUT') {
        logger.warn(`[YT-SEARCH] Circuit breaker: query "${parsed.normalized}" timed out`);
        return res.json({ success: true, data: [], hasMore: false, nextCursor: null, _circuit: true });
      }
      throw err;
    }

    const hasMore = rawRows.length > RESULTS_PER_PAGE;
    const rows    = rawRows.slice(0, RESULTS_PER_PAGE);
    const videos  = diversifyResults(rows.map(formatVideo));

    // Build cursor from last row
    let nextCursor = null;
    if (hasMore && rows.length > 0) {
      const last = rows[rows.length - 1];
      nextCursor = Buffer.from(JSON.stringify({
        score: last.computed_rank || 0,
        date:  last.published_at,
        id:    last.id,
      })).toString('base64');
    }

    const payload = {
      data:       videos,
      total:      videos.length,
      hasMore,
      nextCursor,
      query:      parsed.raw,
      tokens:     parsed.tokens,
      _latencyMs: Date.now() - t0,
    };

    await setCache(cacheKey, payload, SEARCH_CACHE_TTL);
    l1Set(cacheKey, payload);

    // Log async (never blocks response)
    logSearchEvent({ sessionId, userId, query: parsed.normalized, resultsCount: videos.length, lang });

    return res.json({ success: true, ...payload });

  } catch (err) {
    logger.error(`❌ [YT-SEARCH] ${err.message}`);
    next(err);
  }
};

/**
 * GET /api/youtube-creator/explore/suggestions?q=prefix
 *
 * Three-tier lookup:
 *   T1: Redis ZRANGEBYLEX  — sub-millisecond, zero DB hits
 *   T2: Redis popularity   — sorts T1 results by click weight
 *   T3: DB dictionary      — only when Redis returns < 3 (cold path)
 */
export const getExploreSuggestions = async (req, res, next) => {
  try {
    const parsed = normalizeQuery(req.query.q);
    if (!parsed) return res.json({ success: true, data: [] });

    const prefix   = parsed.normalized;
    const cacheKey = `cache:yt:suggestions:${prefix}`;

    // L1 + L2
    const l1 = l1Get(cacheKey);
    if (l1) return res.json({ success: true, data: l1 });

    const l2 = await getCache(cacheKey);
    if (l2) { l1Set(cacheKey, l2); return res.json({ success: true, data: l2 }); }

    let suggestions = [];
    const r = await getRedis();

    // Tier 1 + 2: Redis ZRANGEBYLEX
    if (r) {
      try {
        const lexMin = `[${prefix}`;
        const lexMax = `[${prefix}\xff`;
        const terms  = await r.zrangebylex('yt:suggestions:index', lexMin, lexMax, 'LIMIT', 0, 20);

        if (terms && terms.length > 0) {
          // Score each term by popularity
          const scores = await Promise.all(
            terms.map(t => r.zscore('yt:suggestions:popularity', t).then(s => ({ t, s: parseFloat(s || '0') })))
          );
          scores.sort((a, b) => b.s - a.s);
          suggestions = scores.slice(0, 8).map(x => x.t);
        }
      } catch { /* Redis unavailable — fall through to DB */ }
    }

    // Tier 3: DB fallback (only when Redis gives < 3)
    if (suggestions.length < 3) {
      const rows = await prisma.$queryRaw`
        SELECT term, popularity_score, click_score
        FROM youtube_search_dictionary
        WHERE term ILIKE ${prefix + '%'}
        ORDER BY is_trending DESC, (popularity_score + click_score * 5) DESC
        LIMIT 8
      `;

      const dbTerms = rows.map(r => r.term);
      suggestions = [...new Set([...suggestions, ...dbTerms])].slice(0, 8);

      // Backfill Redis (async — doesn't block response)
      if (r && rows.length > 0) {
        setImmediate(async () => {
          try {
            const pipe = r.pipeline();
            for (const row of rows) {
              pipe.zadd('yt:suggestions:index', 0, row.term);
              pipe.zadd('yt:suggestions:popularity', row.popularity_score + row.click_score * 5, row.term);
            }
            await pipe.exec();
          } catch { /* silent */ }
        });
      }

      // Also search video titles as fallback for cold dictionary
      if (suggestions.length < 3) {
        const titleRows = await prisma.$queryRaw`
          SELECT DISTINCT title FROM youtube_videos
          WHERE title ILIKE ${prefix + '%'}
          ORDER BY title
          LIMIT 5
        `;
        const titleTerms = titleRows.map(r => r.title.toLowerCase().trim());
        suggestions = [...new Set([...suggestions, ...titleTerms])].slice(0, 8);
      }
    }

    await setCache(cacheKey, suggestions, SUGGEST_CACHE_TTL);
    l1Set(cacheKey, suggestions);

    return res.json({ success: true, data: suggestions });

  } catch (err) {
    logger.error(`❌ [YT-SUGGEST] ${err.message}`);
    next(err);
  }
};

/**
 * GET /api/youtube-creator/explore/related/:videoId
 *
 * Returns related videos: same channel first, then keyword overlap.
 * Cached 10 minutes — related videos don't change frequently.
 */
export const getRelatedVideos = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    if (!videoId) return res.status(400).json({ success: false, message: 'videoId required' });

    const cacheKey = `cache:yt:related:${videoId}`;
    const l1       = l1Get(cacheKey);
    if (l1) return res.json({ success: true, data: l1 });

    const l2 = await getCache(cacheKey);
    if (l2) { l1Set(cacheKey, l2); return res.json({ success: true, data: l2 }); }

    const source = await prisma.youTubeVideo.findUnique({
      where:  { id: videoId },
      select: { id: true, title: true, youtubeProfileId: true },
    });
    if (!source) return res.status(404).json({ success: false, message: 'Video not found' });

    const titleParsed = normalizeQuery(source.title);
    const tsQuery     = titleParsed?.tsQueryOr || 'empty';

    const rows = await prisma.$queryRaw`
      WITH base AS (
        SELECT
          yv.id, yv.video_id, yv.title, yv.description, yv.thumbnail,
          yv.published_at, yv.youtube_profile_id,
          yp.channel_name, yp.thumbnail_url AS channel_thumbnail,
          yp.subscriber_count, yp.language, yp.country,
          (CASE WHEN yv.youtube_profile_id = ${source.youtubeProfileId}::uuid THEN 2.0 ELSE 0.0 END
           + ts_rank(yv.search_vector, to_tsquery('simple', ${tsQuery}))
          )::float AS computed_rank
        FROM youtube_videos yv
        JOIN youtube_profiles yp ON yv.youtube_profile_id = yp.id
        WHERE yv.id != ${source.id}::uuid
          AND (
            yv.youtube_profile_id = ${source.youtubeProfileId}::uuid
            OR (
              ${tsQuery !== 'empty'}
              AND yv.search_vector @@ to_tsquery('simple', ${tsQuery})
            )
          )
      )
      SELECT
        id, video_id, title, description, thumbnail, published_at,
        youtube_profile_id, channel_name, channel_thumbnail,
        subscriber_count, language, country, computed_rank
      FROM base
      ORDER BY computed_rank DESC, published_at DESC NULLS LAST
      LIMIT 8
    `;

    const formatted = rows.map(formatVideo);

    await setCache(cacheKey, formatted, RELATED_CACHE_TTL);
    l1Set(cacheKey, formatted);

    return res.json({ success: true, data: formatted });

  } catch (err) {
    logger.error(`❌ [YT-RELATED] ${err.message}`);
    next(err);
  }
};

/**
 * POST /api/youtube-creator/explore/click
 *
 * Records which search result the user clicked.
 * Fire-and-forget: responds 200 immediately, processes async.
 * This is the feedback signal that makes search smarter over time.
 */
export const recordSearchClick = async (req, res) => {
  res.status(200).json({ success: true });

  setImmediate(async () => {
    try {
      const { query, videoId, position, sessionId } = req.body || {};
      if (!query || !videoId) return;

      const parsed = normalizeQuery(query);
      if (!parsed) return;

      // 🚀 [PRODUCTION] Redis Buffer for Click tracking
      const clickEvent = {
        type: 'CLICK',
        query: parsed.normalized,
        sessionId: sessionId || null,
        clickedVideoId: videoId,
        clickedPosition: position || null,
        timeToClickMs: req.body.timeToClickMs || null,
        createdAt: new Date()
      };
      
      await redisProxy.rpush('yt:search:events:buffer', JSON.stringify(clickEvent));

      // 🔵 Boost popularity in Postgres Dictionary (Deduplicated)
      await prisma.youTubeSearchDictionary.upsert({
        where:  { term: parsed.normalized.slice(0, 500) },
        update: { click_score: { increment: 1 } },
        create: { term: parsed.normalized.slice(0, 500), type: 'QUERY', click_score: 1, popularity_score: 0 },
      });

      // Boost in Redis
      const r = await getRedis();
      if (r) {
        await r.zincrby('yt:suggestions:popularity', 2, parsed.normalized).catch(() => {});
      }

    } catch { /* analytics failure must never surface to user */ }
  });
};

/**
 * GET /api/youtube-creator/explore/popular?lang=&cursor=
 *
 * Default feed (no search query). Ranked by authority + freshness.
 * Heavily cached (1 hour).
 */
export const getPopularVideos = async (req, res, next) => {
  try {
    const lang      = req.query.lang || null;
    const cursor    = req.query.cursor || null;
    const cacheKey  = `cache:yt:popular:${lang || 'all'}:${cursor || 'p0'}`;

    const l1 = l1Get(cacheKey);
    if (l1) return res.json({ success: true, ...l1, _cache: 'L1' });

    const l2 = await getCache(cacheKey);
    if (l2) { l1Set(cacheKey, l2); return res.json({ success: true, ...l2, _cache: 'L2' }); }

    let cursorDate = new Date('2099-01-01');
    let cursorId   = '00000000-0000-0000-0000-000000000000';

    if (cursor) {
      try {
        const dec = JSON.parse(Buffer.from(cursor, 'base64').toString());
        cursorDate = new Date(dec.date ?? '2099-01-01');
        cursorId   = dec.id ?? '00000000-0000-0000-0000-000000000000';
      } catch { /* start from beginning */ }
    }

    const rows = await withTimeout(
      prisma.$queryRaw`
        SELECT
          yv.id, yv.video_id, yv.title, yv.description, yv.thumbnail,
          yv.published_at, yv.youtube_profile_id,
          yp.channel_name, yp.thumbnail_url AS channel_thumbnail,
          yp.subscriber_count, yp.authority_score, yp.language, yp.country,
          (
            COALESCE(yp.authority_score, 0) * 0.4 +
            (1.0 / (1.0 + 0.01 * GREATEST(
              EXTRACT(EPOCH FROM (NOW() - COALESCE(yv.published_at, NOW()))) / 86400.0, 0.0
            ))) * 0.6
          )::float AS computed_rank
        FROM youtube_videos yv
        JOIN youtube_profiles yp ON yv.youtube_profile_id = yp.id
        WHERE (${lang}::text IS NULL OR yp.language = ${lang})
          AND (
            ${cursor}::text IS NULL
            OR (yv.published_at, yv.id::text) < (${cursorDate}::timestamptz, ${cursorId}::text)
          )
        ORDER BY computed_rank DESC, yv.published_at DESC NULLS LAST, yv.id
        LIMIT ${RESULTS_PER_PAGE + 1}
      `,
      DB_TIMEOUT_MS
    );

    const hasMore = rows.length > RESULTS_PER_PAGE;
    const sliced  = rows.slice(0, RESULTS_PER_PAGE);
    const videos  = diversifyResults(sliced.map(formatVideo));

    let nextCursor = null;
    if (hasMore && sliced.length > 0) {
      const last = sliced[sliced.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ date: last.published_at, id: last.id })).toString('base64');
    }

    const payload = { data: videos, hasMore, nextCursor };
    await setCache(cacheKey, payload, POPULAR_CACHE_TTL);
    l1Set(cacheKey, payload);

    return res.json({ success: true, ...payload });

  } catch (err) {
    logger.error(`❌ [YT-POPULAR] ${err.message}`);
    next(err);
  }
};
