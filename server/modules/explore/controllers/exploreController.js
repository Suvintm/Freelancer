import { Profile } from "../../profiles/models/Profile.js";
import User from "../../user/models/User.js";
import { asyncHandler } from "../../../../middleware/errorHandler.js";
import { withCache, CacheKey, TTL, hashQuery } from "../../../../utils/cache.js";

// GET /api/explore/editors - Production-level search with filters and sorting
export const getAllEditors = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search = "",
    skills = "",
    languages = "",
    experience = "",
    country = "",
    availability = "", // available, busy, small_only
    sortBy = "relevance", // relevance, experience, newest
  } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // ── Build a cache key from the full query ──────────────────────────────
  const queryHash = hashQuery({ page: pageNum, limit: limitNum, search, skills, languages, experience, country, availability, sortBy });
  const cacheKey = CacheKey.exploreEditors(queryHash);

  // ── Try cache first ────────────────────────────────────────────────────
  const cached = await withCache(cacheKey, TTL.EXPLORE_EDITORS, async () => {
    
    // 1. Get Global Filters Fast! (Cache heavily)
    const globalFilters = await withCache(CacheKey.exploreFilters(), 3600, async () => {
      const dbProfiles = await Profile.find({}, "skills languages location.country").lean();
      const st = new Set(), lt = new Set(), ct = new Set();
      dbProfiles.forEach(p => {
        p.skills?.forEach(s => s && st.add(s.trim()));
        p.languages?.forEach(l => l && lt.add(l.trim()));
        if (p.location?.country) ct.add(p.location.country.trim());
      });
      return {
        skills: [...st].sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); }).slice(0, 50),
        languages: [...lt].sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); }).slice(0, 30),
        countries: [...ct].sort()
      };
    });

    // 2. Build Pipeline
    const pipeline = [];

    // Match Users
    const userMatch = {
      role: "editor",
      isVerified: true,
      profileCompleted: true,
      isBanned: { $ne: true }
    };
    if (availability) {
      userMatch["availability.status"] = { $in: availability.split(',').map(s => s.trim()) };
    }
    pipeline.push({ $match: userMatch });

    // Lookup Profile
    pipeline.push({
      $lookup: {
        from: "profiles",
        localField: "_id",
        foreignField: "user",
        as: "profile"
      }
    });

    // Unwind Profile
    pipeline.push({
      $unwind: { path: "$profile", preserveNullAndEmptyArrays: true }
    });

    // Match Filters
    const matchAnd = [];
    if (skills) {
      const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
      if (skillsArray.length > 0) matchAnd.push({ "profile.skills": { $in: skillsArray.map(s => new RegExp(s, "i")) } });
    }
    if (languages) {
      const langsArray = languages.split(",").map(l => l.trim()).filter(Boolean);
      if (langsArray.length > 0) matchAnd.push({ "profile.languages": { $in: langsArray.map(l => new RegExp(l, "i")) } });
    }
    if (experience) matchAnd.push({ "profile.experience": experience });
    if (country) matchAnd.push({ "profile.location.country": new RegExp(country, "i") });

    let searchTerms = [];
    if (search) {
      searchTerms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
      const searchRegex = new RegExp(searchTerms.join("|"), "i");
      matchAnd.push({
        $or: [
          { name: searchRegex },
          { "profile.skills": searchRegex },
          { "profile.languages": searchRegex },
          { "profile.location.country": searchRegex },
          { "profile.about": searchRegex }
        ]
      });
    }

    if (matchAnd.length > 0) {
      pipeline.push({ $match: { $and: matchAnd } });
    }

    // Structure as Profile > User
    pipeline.push({
      $addFields: {
        "profile.user": {
          _id: "$_id",
          name: "$name",
          email: "$email",
          profilePicture: "$profilePicture",
          role: "$role",
          isVerified: "$isVerified",
          kycStatus: "$kycStatus",
          createdAt: "$createdAt",
          profileCompletionPercent: "$profileCompletionPercent",
          suvixScore: "$suvixScore",
          availability: "$availability"
        }
      }
    });

    pipeline.push({
      $replaceRoot: { newRoot: { $ifNull: ["$profile", { user: "$profile.user" }] } }
    });

    // Ensure array defaults
    pipeline.push({
      $addFields: {
        experience: { $ifNull: ["$experience", "New"] },
        ratingStats: { $ifNull: ["$ratingStats", { averageRating: 0, totalReviews: 0 }] },
        skills: { $ifNull: ["$skills", []] },
        languages: { $ifNull: ["$languages", []] },
        hourlyRate: { $ifNull: ["$hourlyRate", 0] },
        location: { $ifNull: ["$location", {}] }
      }
    });

    // Execute based on sorting requirements
    if (search && sortBy === "relevance") {
      // Memory Scoring Flow (Fast because regex already reduced size)
      let results = await User.aggregate(pipeline);
      
      const searchLower = search.toLowerCase().trim();
      results = results.map(editor => {
        let score = 0;
        const nameLower = (editor.user?.name || "").toLowerCase();
        if (nameLower === searchLower) score += 100;
        else if (nameLower.startsWith(searchLower)) score += 50;
        else if (nameLower.includes(searchLower)) score += 25;
        searchTerms.forEach(term => {
          if (nameLower.includes(term)) score += 10;
          if (editor.skills?.some(s => s.toLowerCase().includes(term))) score += 15;
          if (editor.languages?.some(l => l.toLowerCase().includes(term))) score += 10;
          if (editor.location?.country?.toLowerCase().includes(term)) score += 5;
          if (editor.about?.toLowerCase().includes(term)) score += 3;
        });
        return { ...editor, searchScore: score };
      }).filter(editor => editor.searchScore > 0);
      
      results.sort((a, b) => b.searchScore - a.searchScore);
      
      const total = results.length;
      return {
        editors: results.slice(skip, skip + limitNum),
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
        filters: { ...globalFilters, experience: ["0-6 months", "6-12 months", "1-2 years", "2-3 years", "3-5 years", "5+ years"] }
      };

    } else {
      // DB Sort & Pagination Flow (Massive Scale)
      if (sortBy === "newest") {
        pipeline.push({ $sort: { "user.createdAt": -1 } });
      } else if (sortBy === "experience") {
        pipeline.push({
          $addFields: {
            expWeight: {
              $switch: {
                branches: [
                  { case: { $eq: ["$experience", "5+ years"] }, then: 6 },
                  { case: { $eq: ["$experience", "3-5 years"] }, then: 5 },
                  { case: { $eq: ["$experience", "2-3 years"] }, then: 4 },
                  { case: { $eq: ["$experience", "1-2 years"] }, then: 3 },
                  { case: { $eq: ["$experience", "6-12 months"] }, then: 2 },
                  { case: { $eq: ["$experience", "0-6 months"] }, then: 1 }
                ],
                default: 0
              }
            }
          }
        });
        pipeline.push({ $sort: { expWeight: -1, "user.createdAt": -1 } });
      } else {
        pipeline.push({ $sort: { "ratingStats.averageRating": -1, "user.createdAt": -1 } });
      }

      pipeline.push({
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limitNum }]
        }
      });

      const [aggregationResult] = await User.aggregate(pipeline);
      const total = aggregationResult.metadata[0]?.total || 0;
      
      return {
        editors: aggregationResult.data,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
        filters: { ...globalFilters, experience: ["0-6 months", "6-12 months", "1-2 years", "2-3 years", "3-5 years", "5+ years"] }
      };
    }
  });

  res.status(200).json({ success: true, ...cached });
});

// GET /api/explore/suggestions - Fast search for autosuggest
export const getEditorSuggestions = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) {
    return res.json({ success: true, suggestions: [] });
  }

  // console.log(`[SUGGEST] Fetching suggestions for: ${query}`);

  const searchRegex = new RegExp(query, "i");

  // 1. Find matching Editor Names
  const userMatches = await User.find({
    role: "editor",
    isVerified: true,
    profileCompleted: true,
    name: searchRegex,
    isBanned: { $ne: true }
  })
    .select("name")
    .limit(5)
    .lean();

  // console.log(`[SUGGEST] Found ${userMatches.length} user matches`);

  // 2. Find matching skills from Profiles (of verified editors)
  const skillMatches = await Profile.find({
    skills: searchRegex
  })
    .select("skills")
    .limit(10) 
    .lean();

  
  // Extract specific matching skills
  const matchingSkills = new Set();
  skillMatches.forEach(p => {
    p.skills?.forEach(s => {
      if (searchRegex.test(s)) matchingSkills.add(s);
    });
  });

  // Combine results: Names first, then Skills
  const suggestions = [
    ...userMatches.map(u => ({ type: "editor", text: u.name, id: u._id })),
    ...Array.from(matchingSkills).slice(0, 5).map(s => ({ type: "skill", text: s }))
  ].slice(0, 8); // Limit total suggestions

  res.json({
    success: true,
    suggestions
  });
});





