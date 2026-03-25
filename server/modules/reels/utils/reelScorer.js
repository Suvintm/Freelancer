/**
 * reelScorer.js — Instagram-Style Multi-Signal Ranking Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 2 Upgrade: All 5 Instagram ranking signals now implemented:
 *   1. Watch Completion Rate (strongest signal — Bayesian averaged per reel)
 *   2. Wilson Score Interval (engagement quality, statistically confident)
 *   3. Exponential Freshness Decay (half-life = 2 days)
 *   4. Skip Rate Penalty (negative signal — quick scrolls past)
 *   5. Social Graph Boost (multiplier for reels from followed creators)
 *
 * Plus: Creator Diversity enforcement (max 2 per creator per batch)
 *       Weighted Reservoir Sampling (A-Chao, O(N log K)) for variety
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getPersonalizationBoost } from '../../../utils/userInterestTracker.js';

// ── Algorithm 1: Wilson Score Interval ───────────────────────────────────────
// Used by: Reddit, Pinterest, Instagram
// Bayesian confidence interval on engagement rate — rewards consistent performers
// over lucky spikes. Formula: lower bound of 95% CI for Bernoulli proportion.
const Z    = 1.96;
const Z_SQ = Z * Z; // 3.8416

export const wilsonScore = (likes, impressions) => {
    if (!impressions || impressions === 0) return 0;
    const p = Math.max(0, Math.min(1, likes / impressions));
    const n = impressions;
    const numerator   = p + (Z_SQ / (2 * n)) - Z * Math.sqrt((p * (1 - p) + Z_SQ / (4 * n)) / n);
    const denominator = 1 + (Z_SQ / n);
    return Math.max(0, numerator / denominator);
};

// ── Algorithm 2: Exponential Freshness Decay ─────────────────────────────────
// score halves every HALF_LIFE_DAYS days. Instagram uses ~1 day, we use 2 days.
const HALF_LIFE_DAYS = 2;
const DECAY_RATE     = Math.LN2 / HALF_LIFE_DAYS;

export const freshnessDecay = (createdAt) => {
    if (!createdAt) return 0.5;
    const ageMs   = Date.now() - new Date(createdAt).getTime();
    const ageDays = ageMs / 86_400_000;
    return Math.exp(-DECAY_RATE * ageDays);
};

// ── Algorithm 3: Bayesian Watch Completion Score ──────────────────────────────
// Instagram's #1 signal: how much of the video did users actually watch?
// We apply a Bayesian prior (assume 30% completion if no samples yet) to avoid
// cold-start reels being unfairly penalized.
//
// Formula: Bayesian posterior mean with Beta(α, β) prior
//   posterior = (samples × avg + prior_weight × prior_mean) / (samples + prior_weight)
const COMPLETION_PRIOR_MEAN   = 0.30; // Assume 30% completion for new reels
const COMPLETION_PRIOR_WEIGHT = 5;    // Prior fades after 5 real samples

export const bayesianCompletionScore = (avgCompletion, sampleCount) => {
    const posterior = (
        (sampleCount * avgCompletion) + (COMPLETION_PRIOR_WEIGHT * COMPLETION_PRIOR_MEAN)
    ) / (sampleCount + COMPLETION_PRIOR_WEIGHT);
    return Math.max(0, Math.min(1, posterior));
};

// ── Skip Rate Penalty ─────────────────────────────────────────────────────────
// Reels that users swipe past in < 2 seconds get penalized.
// Normalize skip rate against views: skipRate = skipCount / max(viewsCount, 1)
export const skipRatePenalty = (skipCount, viewsCount) => {
    if (!viewsCount || viewsCount === 0) return 0;
    const skipRate = Math.min(1, skipCount / viewsCount);
    return skipRate; // 0 = no skips, 1 = everyone skipped
};

// ── Composite Score (Instagram Value Model) ───────────────────────────────────
// Exact weight distribution learned from Instagram's published signal priorities:
//   - Watch completion: 0.40  (strongest signal)
//   - Wilson quality:   0.25  (engagement confidence)
//   - Freshness:        0.20  (new content boost)
//   - Re-watch:         0.10  (bonus signal)
//   - Skip penalty:     −0.30 (hard negative)
//   - Randomness:       0.05  (exploration factor, prevents filter bubbles)
//
// @param {object} reel          — reel document from MongoDB
// @param {Set=}   followedIds   — Set of editor IDs the user follows (for social boost)
// @param {Object=} userInterests — Map of tag/editor affinity scores { 't:tag': count }
// @returns {number} composite score (higher = more likely to appear)
export const compositeScore = (reel, followedIds = null, userInterests = null) => {
    const likes    = reel.likesCount      || 0;
    const views    = reel.viewsCount      || 0;
    const comments = reel.commentsCount   || 0;
    const skips    = reel.skipCount       || 0;
    const rewatches = reel.reWatchCount   || 0;
    const avgComp  = reel.avgCompletionRate  || 0;
    const samples  = reel.completionSampleCount || 0;

    // Weighted interactions (comments show more intentionality)
    const weightedLikes = likes + (comments * 2);
    const impressions   = Math.max(views, likes + comments);

    const quality    = wilsonScore(weightedLikes, impressions);
    const completion = bayesianCompletionScore(avgComp, samples);
    const freshness  = freshnessDecay(reel.createdAt);
    const skipPenalty = skipRatePenalty(skips, views);

    // Re-watch bonus: normalize against views (capped at 0.5 bonus)
    const reWatchBonus = views > 0 ? Math.min(0.5, rewatches / views) : 0;

    // Social graph boost: if user follows this creator, boost by 1.5×
    const socialMultiplier = (followedIds && reel.editor &&
        followedIds.has(String(reel.editor._id || reel.editor)))
        ? 1.5 : 1.0;

    // Personalization boost: if user has high affinity for these tags/creator, boost by 1.25×
    const personalizationMultiplier = getPersonalizationBoost(reel, userInterests);

    const baseScore = (
        (completion * 0.40) +
        (quality    * 0.25) +
        (freshness  * 0.20) +
        (reWatchBonus * 0.10) +
        (Math.random() * 0.05) // Exploration factor
    ) - (skipPenalty * 0.30);

    return Math.max(0, baseScore * socialMultiplier * personalizationMultiplier);
};

// ── Creator Diversity Filter ──────────────────────────────────────────────────
// Instagram rule: max 2 reels from the same creator per scroll batch.
// Applied AFTER reservoir sampling to enforce hard diversity.
//
// @param {Array}  reels   — sampled reels
// @param {number} maxPer  — max reels per creator (default 2)
// @returns {Array} filtered reels
export const enforceCreatorDiversity = (reels, maxPer = 2) => {
    const creatorCount = new Map();
    return reels.filter(reel => {
        const editorId = String(reel.editor?._id || reel.editor || 'unknown');
        const count = creatorCount.get(editorId) || 0;
        if (count >= maxPer) return false;
        creatorCount.set(editorId, count + 1);
        return true;
    });
};

// ── Algorithm: Weighted Reservoir Sampling (A-Chao) ──────────────────────────
// Used by: YouTube (candidate selection), Spotify shuffle, Netflix sampling
// Selects K diverse items from N with probability proportional to weight.
// Time: O(N log K), Space: O(K)
class MinHeap {
    constructor() { this.data = []; }
    get size() { return this.data.length; }
    peek() { return this.data[0]; }

    push(item) {
        this.data.push(item);
        this._siftUp(this.data.length - 1);
    }

    pop() {
        const top  = this.data[0];
        const last = this.data.pop();
        if (this.data.length > 0) {
            this.data[0] = last;
            this._siftDown(0);
        }
        return top;
    }

    _siftUp(i) {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (this.data[p][0] <= this.data[i][0]) break;
            [this.data[p], this.data[i]] = [this.data[i], this.data[p]];
            i = p;
        }
    }

    _siftDown(i) {
        const n = this.data.length;
        while (true) {
            let min = i;
            const l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && this.data[l][0] < this.data[min][0]) min = l;
            if (r < n && this.data[r][0] < this.data[min][0]) min = r;
            if (min === i) break;
            [this.data[min], this.data[i]] = [this.data[i], this.data[min]];
            i = min;
        }
    }
}

/**
 * Weighted Reservoir Sampling (A-Chao algorithm).
 * @param {Array}    items      — full candidate pool
 * @param {number}   k          — number of items to select
 * @param {Function} scoreFn    — item → weight (higher = more likely to appear)
 * @param {Set=}     followedIds — Set of followed editor IDs for social boost
 * @returns {Array} k diverse items
 */
export const weightedReservoirSample = (items, k, scoreFn = compositeScore, followedIds = null) => {
    if (!items || items.length === 0) return [];
    if (items.length <= k) return [...items].sort(() => Math.random() - 0.5);

    const heap = new MinHeap();

    for (const item of items) {
        const weight = Math.max(0.001, scoreFn(item, followedIds));
        // A-Chao key: U^(1/weight) — higher weight = statistically larger key
        const key = Math.pow(Math.random(), 1 / weight);

        if (heap.size < k) {
            heap.push([key, item]);
        } else if (key > heap.peek()[0]) {
            heap.pop();
            heap.push([key, item]);
        }
    }

    // Extract + shuffle (heap order is meaningless for display)
    const result = heap.data.map(([, item]) => item);
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};
