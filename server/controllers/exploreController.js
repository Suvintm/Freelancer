import { Profile } from "../models/Profile.js";
import User from "../models/User.js";
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
    availability = "", // available, busy, small_only
    sortBy = "relevance", // relevance, experience, newest
  } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // STEP 1: Find verified editors from User collection
  // Requirements: isVerified + KYC verified + 80%+ profile completion
  const userQuery = {
    role: "editor",
    isVerified: true,
    kycStatus: "verified",
    profileCompletionPercent: { $gte: 80 }, // Must have 80%+ profile
    isBanned: { $ne: true },
  };

  // Get all verified editors
  const verifiedEditors = await User.find(userQuery)
    .select("_id name email profilePicture role isVerified kycStatus createdAt profileCompletionPercent suvixScore availability")
    .lean();

  if (verifiedEditors.length === 0) {
    return res.status(200).json({
      success: true,
      editors: [],
      pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 },
      filters: { skills: [], languages: [], countries: [], experience: [] },
    });
  }

  const verifiedUserIds = verifiedEditors.map(u => u._id);

  // STEP 2: Get profiles for these verified users
  let profileQuery = { user: { $in: verifiedUserIds } };

  // Skills filter
  if (skills) {
    const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
    if (skillsArray.length > 0) {
      profileQuery.skills = { $in: skillsArray.map(s => new RegExp(s, "i")) };
    }
  }

  // Languages filter
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

  // Availability filter logic is applied AFTER fetching user data because it lives on the User model, not Profile.
  // Actually, we can filter `verifiedUserIds` first if we want, but `verifiedEditors` contains the user data including availability.
  // Let's filter `verifiedEditors` first to reduce the set of users we fetch profiles for.
  
  // NOTE: Availability is on the User model.
  let filteredUserIds = verifiedUserIds;
  if (availability) {
      const statusList = availability.split(',').map(s => s.trim());
      filteredUserIds = verifiedEditors
          .filter(u => {
              const uStatus = u.availability?.status || 'available';
              return statusList.includes(uStatus);
          })
          .map(u => u._id);
      
      // Update profile query to only look for these users
      profileQuery.user = { $in: filteredUserIds };
  }

  // Get profiles with user data
  let allProfiles = await Profile.find(profileQuery)
    .populate({
      path: "user",
      select: "name email profilePicture role isVerified kycStatus createdAt profileCompletionPercent suvixScore availability",
    })
    .lean();

  // Create editor list - merge profiles with user data
  let filteredEditors = allProfiles
    .filter(p => p.user !== null)
    .map(profile => ({
      ...profile,
      // Ensure user data is present
      user: profile.user,
    }));

  // STEP 3: Add verified editors without profiles (show them too!)
  const profileUserIds = new Set(allProfiles.map(p => p.user?._id?.toString()).filter(Boolean));
  
  // Only add editors without profiles if there are no filters applied (OR if availability filter is consistent)
  const hasFilters = skills || languages || experience || country;
  
  // If technical filters exist, we generally rely on profile data.
  // But if ONLY availability is set (or no filters), we can show users without profiles if they match.
  if (!hasFilters) {
    verifiedEditors.forEach(editor => {
       // Check availability filter
       if (availability) {
            const statusList = availability.split(',').map(s => s.trim());
            const uStatus = editor.availability?.status || 'available';
            if (!statusList.includes(uStatus)) return;
       }

      if (!profileUserIds.has(editor._id.toString())) {
        // Create a minimal profile for display

    });
  }

  // Apply text search if provided
  if (search) {
    const searchLower = search.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/).filter(Boolean);

    filteredEditors = filteredEditors
      .map((editor) => {
        let score = 0;
        const userName = editor.user?.name || "";
        const nameLower = userName.toLowerCase();

        // Name matching (highest priority)
        if (nameLower === searchLower) {
          score += 100;
        } else if (nameLower.startsWith(searchLower)) {
          score += 50;
        } else if (nameLower.includes(searchLower)) {
          score += 25;
        }

        // Check each search term
        searchTerms.forEach((term) => {
          if (nameLower.includes(term)) score += 10;
          if (editor.skills?.some((s) => s.toLowerCase().includes(term))) score += 15;
          if (editor.languages?.some((l) => l.toLowerCase().includes(term))) score += 10;
          if (editor.location?.country?.toLowerCase().includes(term)) score += 5;
          if (editor.about?.toLowerCase().includes(term)) score += 3;
        });

        return { ...editor, searchScore: score };
      })
      .filter((editor) => editor.searchScore > 0);

    if (sortBy === "relevance") {
      filteredEditors.sort((a, b) => b.searchScore - a.searchScore);
    }
  }

  // Apply sorting
  if (sortBy === "newest") {
    filteredEditors.sort((a, b) =>
      new Date(b.user?.createdAt || 0) - new Date(a.user?.createdAt || 0)
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

  // Get unique values for filter options (from all verified editors)
  const allProfilesForFilters = await Profile.find({ user: { $in: verifiedUserIds } }).lean();

  const uniqueSkills = [...new Set(allProfilesForFilters.flatMap((p) => p.skills || []))].filter(Boolean).sort();
  const uniqueLanguages = [...new Set(allProfilesForFilters.flatMap((p) => p.languages || []))].filter(Boolean).sort();
  const uniqueCountries = [...new Set(allProfilesForFilters.map((p) => p.location?.country).filter(Boolean))].sort();
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
      skills: uniqueSkills.slice(0, 50),
      languages: uniqueLanguages.slice(0, 30),
      countries: uniqueCountries,
      experience: experienceOptions,
    },
  });
});
