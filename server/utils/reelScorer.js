/**
 * reelScorer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DSA-Level feed ranking utilities used by top companies (TikTok, Reddit, YouTube).
 *
 * Algorithms:
 *  1. Wilson Score Interval   — Bayesian confidence ranking (beats raw engagement counts)
 *  2. Weighted Reservoir Sampling (A-Chao) — O(N log K) diversity-aware sampling
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Algorithm 1: Wilson Score Interval ───────────────────────────────────────
// Used by: Reddit, Pinterest, Instagram
//
// The Wilson Score accounts for STATISTICAL CONFIDENCE in engagement rates.
// A reel with 1 like and 5 views has a 20% engagement rate, but this is 
// statistically uncertain. A reel with 1000 likes and 5000 views has a proven
// 20% engagement rate. Wilson Score corrects for this.
//
// Math: Lower bound of a 95% confidence interval for a Bernoulli proportion.
// z = 1.96 (for 95% confidence), z^2 = 3.8416
const Z     = 1.96;
const Z_SQ  = Z * Z; // 3.8416

/**
 * Computes the Wilson Score for a reel.
 * @param {number} likes       - number of positive interactions
 * @param {number} impressions - total views/exposures (acts as sample size)
 * @returns {number} score in range [0, 1]
 */
export const wilsonScore = (likes, impressions) => {
    if (!impressions || impressions === 0) return 0;

    // Clamp to avoid negative values on edge cases
    const p = Math.max(0, Math.min(1, likes / impressions));
    const n = impressions;

    // Wilson lower-bound formula
    const numerator   = p + (Z_SQ / (2 * n)) - Z * Math.sqrt((p * (1 - p) + Z_SQ / (4 * n)) / n);
    const denominator = 1 + (Z_SQ / n);

    return Math.max(0, numerator / denominator);
};

// ── Freshness Decay ───────────────────────────────────────────────────────────
// Exponential decay: score halves every HALF_LIFE_DAYS days.
// TikTok uses ~1 day, YouTube uses ~7 days. We use 2 days for a mix.
const HALF_LIFE_DAYS = 2;
const DECAY_RATE     = Math.LN2 / HALF_LIFE_DAYS; // λ = ln(2) / half-life

/**
 * Freshness multiplier using exponential decay.
 * Returns 1.0 for brand new content, decays toward 0 over time.
 * @param {Date|string} createdAt
 * @returns {number} multiplier in range (0, 1]
 */
export const freshnessDecay = (createdAt) => {
    if (!createdAt) return 0.5;
    const ageMs   = Date.now() - new Date(createdAt).getTime();
    const ageDays = ageMs / 86_400_000;
    return Math.exp(-DECAY_RATE * ageDays);
};

// ── Composite Score ───────────────────────────────────────────────────────────
/**
 * Composite ranking score combining Wilson + Freshness + Randomness.
 * Weights tuned to match Instagram Reels behavior:
 *   - 40% quality (Wilson)
 *   - 30% freshness (decay)
 *   - 30% randomness (exploration factor)
 *
 * @param {object} reel - reel document from MongoDB
 * @returns {number} final score
 */
export const compositeScore = (reel) => {
    const likes   = reel.likesCount   || 0;
    const views   = reel.viewsCount   || 0;
    const comments = reel.commentsCount || 0;

    // Weighted interactions: comments have more intentionality than likes
    const weightedLikes = likes + (comments * 3);
    const impressions   = Math.max(views, likes + comments);

    const quality   = wilsonScore(weightedLikes, impressions);
    const freshness = freshnessDecay(reel.createdAt);
    const random    = Math.random(); // Exploration factor

    return (quality * 0.40) + (freshness * 0.30) + (random * 0.30);
};

// ── Algorithm 2: Weighted Reservoir Sampling (Vitter + A-Chao) ───────────────
// Used by: YouTube (candidate selection), Spotify shuffle, Netflix sampling
//
// Standard reservoir sampling selects K items from N with equal probability.
// A-Chao's weighted extension assigns each item a random key:
//   key(i) = U^(1/w_i)   where U ~ Uniform(0,1) and w_i is item weight
// The K items with the LARGEST keys are selected.
//
// This efficiently produces diversity while still preferring high-scored items.
// Time:  O(N log K)  — N iterations, log K for Min-Heap operations
// Space: O(K)        — only the reservoir in memory

/**
 * Min-Heap implementation for O(log K) insert/extract.
 * Stores items as [key, item] pairs, ordered by key ascending.
 */
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
            const parent = (i - 1) >> 1;
            if (this.data[parent][0] <= this.data[i][0]) break;
            [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
            i = parent;
        }
    }

    _siftDown(i) {
        const n = this.data.length;
        while (true) {
            let smallest = i;
            const l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && this.data[l][0] < this.data[smallest][0]) smallest = l;
            if (r < n && this.data[r][0] < this.data[smallest][0]) smallest = r;
            if (smallest === i) break;
            [this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]];
            i = smallest;
        }
    }
}

/**
 * Weighted Reservoir Sampling (A-Chao algorithm).
 * Selects K diverse items from an array, weighted by composite score.
 *
 * @param {Array}    items    - full candidate pool
 * @param {number}   k        - number of items to select
 * @param {Function} scoreFn  - function(item) → weight (higher = more likely to appear)
 * @returns {Array}  selected items of length min(k, items.length)
 */
export const weightedReservoirSample = (items, k, scoreFn = compositeScore) => {
    if (!items || items.length === 0) return [];
    if (items.length <= k) return [...items].sort(() => Math.random() - 0.5);

    const heap = new MinHeap();

    for (const item of items) {
        const weight = Math.max(0.001, scoreFn(item)); // Avoid 0-weight items
        // A-Chao key: U^(1/weight) — items with higher weight get statistically larger keys
        const key = Math.pow(Math.random(), 1 / weight);

        if (heap.size < k) {
            heap.push([key, item]);
        } else if (key > heap.peek()[0]) {
            // New item has a higher key than the smallest in the reservoir — swap it in
            heap.pop();
            heap.push([key, item]);
        }
    }

    // Extract and shuffle (heap order is not meaningful for presentation)
    const result = heap.data.map(([, item]) => item);
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};
