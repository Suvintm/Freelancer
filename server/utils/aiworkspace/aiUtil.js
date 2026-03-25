import { Profile } from "../../modules/profiles/models/Profile.js";
import User from "../../modules/user/models/User.js";
import { Reel } from "../../modules/reels/models/Reel.js"; 
import { AI_CONFIG } from "../../config/aiworkspace/aiConfig.js";

/**
 * Pre-filter editors from MongoDB using extracted keywords.
 * Returns top 15 candidates for final AI ranking.
 *
 * @param {Object} requirements - output from extractKeywords()
 * @returns {Array} - enriched editor objects, scored and sorted
 */
export const findMatchingEditors = async (requirements = {}) => {
  const {
    cities        = [],
    softwares     = [],
    projectTypes  = [],
    vibes         = [],
    rawKeywords   = [],
    budget        = null,
    deadline      = null,
  } = requirements;

  // ── STEP 1: Build base user filter ──────────────────────────
  const userFilter = {
    role:              "editor",
    profileCompleted:  true,
    isBanned:          { $ne: true },
  };

  // Availability constraints
  if (deadline === "urgent") {
    userFilter["availability.status"] = "available";
  } else {
    userFilter["availability.status"] = { $ne: "busy" };
  }

  // ── STEP 2: Find editors via REEL metadata ─────────────────────
  // We search reel titles, descriptions, and hashtags.
  // This helps find editors who ACTUALLY do the work.
  let editorIdsFromReels = [];
  const searchTerms = [...rawKeywords, ...softwares, ...projectTypes, ...vibes].filter(Boolean);

  if (searchTerms.length > 0) {
    const reelRegexes = searchTerms.map(t => new RegExp(t, "i"));
    
    const matchingReels = await Reel.find({
      isPublished: true,
      $or: [
        { title:       { $in: reelRegexes } },
        { description: { $in: reelRegexes } },
        { hashtags:    { $in: reelRegexes } },
      ],
    })
      .select("editor")
      .limit(100)
      .lean();

    // Map counts to editors
    const reelCountMap = {};
    for (const r of matchingReels) {
      if (!r.editor) continue;
      const eid = r.editor.toString();
      reelCountMap[eid] = (reelCountMap[eid] || 0) + 1;
    }

    editorIdsFromReels = Object.entries(reelCountMap)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
  }

  // ── STEP 3: Find editors via PROFILE metadata ──────────────────
  const profileFilter = {};
  const queryParts = [];

  // Software matching
  if (softwares.length > 0) {
    queryParts.push({ softwares: { $in: softwares.map(s => new RegExp(s, "i")) } });
  }

  // Skills & Bio matching (OR logic)
  if (searchTerms.length > 0 || cities.length > 0) {
    const regexes = [...searchTerms, ...cities].map(t => new RegExp(t, "i"));
    queryParts.push({
      $or: [
        { skills: { $in: regexes } },
        { about:  { $in: regexes } },
        { softwares: { $in: regexes } }
      ]
    });
  }

  // Location filter (Country matches city name in many profiles)
  if (cities.length > 0) {
    queryParts.push({ "location.country": { $in: cities.map(c => new RegExp(c, "i")) } });
  }

  // Budget filter
  if (budget && budget > 0) {
    profileFilter["hourlyRate.min"] = { $lte: budget };
  }

  if (queryParts.length > 0) {
    profileFilter.$or = queryParts;
  }

  // ── STEP 4: Run Profile Query ──────────────────────────────────
  let profileCandidates = await Profile.find(profileFilter)
    .populate({
      path: "user",
      match: userFilter,
      select: "name profilePicture bio availability suvixScore ratingStats",
    })
    .select("skills softwares about experience location ratingStats hourlyRate")
    .limit(50)
    .lean();

  // Filter out any populated users that didn't match the userFilter or were null
  profileCandidates = profileCandidates.filter(p => p.user);

  // ── STEP 5: Scoring (JS side) ──────────────────────────────────
  const scored = profileCandidates.map(p => {
    let score = 0;
    const userId = p.user._id.toString();
    const matchReasons = [];

    // Reel Match Bonus
    if (editorIdsFromReels.includes(userId)) {
      score += 35;
      matchReasons.push("Active portfolio reels match your topic");
    }

    // Software Match
    const editorSoftwares = (p.softwares || []).map(s => s.toLowerCase());
    const swMatches = softwares.filter(sw => editorSoftwares.some(es => es.includes(sw.toLowerCase())));
    if (swMatches.length > 0) {
      score += 25;
      matchReasons.push(`Uses ${swMatches.join(", ")}`);
    }

    // City Match
    const bio = (p.user.bio || "").toLowerCase();
    const loc = (p.location?.country || "").toLowerCase();
    const cityMatches = cities.filter(c => bio.includes(c.toLowerCase()) || loc.includes(c.toLowerCase()));

    // Reputation Bonus
    const suvixTotal = p.user.suvixScore?.total || 0;
    score += Math.round((suvixTotal / 100) * 15);

    const rating = p.user.ratingStats?.averageRating || 0;
    score += Math.round(rating * 2);

    return {
      ...p,
      _score: score,
      _reasons: matchReasons,
      _cityMatch: cityMatches.length > 0
    };
  });

  // Sort and truncate
  scored.sort((a, b) => b._score - a._score);
  const top15 = scored.slice(0, 15);

  // Format for AI consumption (lean)
  return top15.map(p => ({
    _id:        p.user._id,
    name:       p.user.name,
    skills:     (p.skills    || []).slice(0, 5),
    softwares:  (p.softwares || []).slice(0, 4),
    about:      (p.about     || "").slice(0, 150),
    experience: p.experience || "Not specified",
    location:   p.location?.country || "",
    rating:     p.ratingStats?.averageRating || 0,
    suvixScore: p.user.suvixScore?.total || 0,
    available:  p.user.availability?.status || "available",
    reelMatch:  p.reelMatch,
    cityMatch:  p._cityMatch, // Crucial for AI reasoning
    matchScore: 0, // Filled by AI
    reason:     p._reasons[0] || "High-quality match based on profile",
    // Frontend-only data
    profilePicture: p.user.profilePicture,
  }));
};
