import { Profile } from "../models/Profile.js";
import { asyncHandler } from "../middleware/errorHandler.js";

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
    sortBy = "relevance", // relevance, experience, newest
  } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Build the profile query
  let profileQuery = {};

  // Skills filter (comma-separated)
  if (skills) {
    const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
    if (skillsArray.length > 0) {
      profileQuery.skills = { $in: skillsArray.map(s => new RegExp(s, "i")) };
    }
  }

  // Languages filter (comma-separated)
  if (languages) {
    const langsArray = languages.split(",").map(l => l.trim()).filter(Boolean);
    if (langsArray.length > 0) {
      profileQuery.languages = { $in: langsArray.map(l => new RegExp(l, "i")) };
    }
  }

  // Experience filter
  if (experience) {
    profileQuery.experience = experience;
  }

  // Country filter
  if (country) {
    profileQuery["location.country"] = new RegExp(country, "i");
  }

  // Get all matching profiles with populated user
  // Only show editors who are verified AND have completed KYC
  let allProfiles = await Profile.find(profileQuery)
    .populate({
      path: "user",
      match: { 
        role: "editor", 
        profileCompleted: true,
        isVerified: true,
        kycStatus: "verified"
      },
      select: "name email profilePicture role profileCompleted isVerified kycStatus createdAt",
    })
    .lean();

  // Filter out profiles where user doesn't match
  let filteredEditors = allProfiles.filter((p) => p.user !== null);

  // Apply text search if provided
  if (search) {
    const searchLower = search.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/).filter(Boolean);

    filteredEditors = filteredEditors
      .map((editor) => {
        let score = 0;

        // Name matching (highest priority)
        const nameLower = editor.user.name.toLowerCase();
        if (nameLower === searchLower) {
          score += 100; // Exact match
        } else if (nameLower.startsWith(searchLower)) {
          score += 50; // Starts with
        } else if (nameLower.includes(searchLower)) {
          score += 25; // Contains
        }

        // Check each search term
        searchTerms.forEach((term) => {
          if (nameLower.includes(term)) score += 10;

          // Skills matching
          if (editor.skills?.some((s) => s.toLowerCase().includes(term))) {
            score += 15;
          }

          // Languages matching
          if (editor.languages?.some((l) => l.toLowerCase().includes(term))) {
            score += 10;
          }

          // Location matching
          if (editor.location?.country?.toLowerCase().includes(term)) {
            score += 5;
          }

          // About matching
          if (editor.about?.toLowerCase().includes(term)) {
            score += 3;
          }
        });

        return { ...editor, searchScore: score };
      })
      .filter((editor) => editor.searchScore > 0);

    // Sort by search score for relevance
    if (sortBy === "relevance") {
      filteredEditors.sort((a, b) => b.searchScore - a.searchScore);
    }
  }

  // Apply sorting
  if (sortBy === "newest") {
    filteredEditors.sort((a, b) =>
      new Date(b.user.createdAt) - new Date(a.user.createdAt)
    );
  } else if (sortBy === "experience") {
    const expOrder = {
      "5+ years": 6,
      "3-5 years": 5,
      "2-3 years": 4,
      "1-2 years": 3,
      "6-12 months": 2,
      "0-6 months": 1,
      "": 0,
    };
    filteredEditors.sort((a, b) =>
      (expOrder[b.experience] || 0) - (expOrder[a.experience] || 0)
    );
  }

  // Get total before pagination
  const total = filteredEditors.length;

  // Apply pagination
  const paginatedEditors = filteredEditors.slice(skip, skip + limitNum);

  // Get unique values for filter options
  const allEditorsForFilters = await Profile.find()
    .populate({
      path: "user",
      match: { role: "editor", profileCompleted: true },
      select: "_id",
    })
    .lean();

  const validProfiles = allEditorsForFilters.filter((p) => p.user !== null);

  // Extract unique filter options
  const uniqueSkills = [...new Set(validProfiles.flatMap((p) => p.skills || []))].filter(Boolean).sort();
  const uniqueLanguages = [...new Set(validProfiles.flatMap((p) => p.languages || []))].filter(Boolean).sort();
  const uniqueCountries = [...new Set(validProfiles.map((p) => p.location?.country).filter(Boolean))].sort();
  const experienceOptions = ["0-6 months", "6-12 months", "1-2 years", "2-3 years", "3-5 years", "5+ years"];

  res.status(200).json({
    success: true,
    editors: paginatedEditors,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
    filters: {
      skills: uniqueSkills.slice(0, 50), // Limit to 50 options
      languages: uniqueLanguages.slice(0, 30),
      countries: uniqueCountries,
      experience: experienceOptions,
    },
  });
});
