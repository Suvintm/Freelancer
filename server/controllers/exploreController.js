import { Profile } from "../models/Profile.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// GET /api/explore/editors - with pagination and search
export const getAllEditors = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 12, 50); // Max 50 per page
  const skip = (page - 1) * limit;
  const search = req.query.search?.trim() || "";

  // Build base query for profiles
  let profileQuery = {};

  // If search term provided, search in skills and languages
  if (search) {
    profileQuery.$or = [
      { skills: { $regex: search, $options: "i" } },
      { languages: { $regex: search, $options: "i" } },
    ];
  }

  // Get profiles with populated user (only completed editor profiles)
  const allProfiles = await Profile.find(profileQuery)
    .populate({
      path: "user",
      match: { role: "editor", profileCompleted: true },
      select: "name email profilePicture role profileCompleted",
    })
    .lean();

  // Filter out profiles where user doesn't match (null after populate match)
  let filteredEditors = allProfiles.filter((p) => p.user !== null);

  // If searching by name, filter here (after populate)
  if (search) {
    filteredEditors = filteredEditors.filter((p) => {
      const nameMatch = p.user.name.toLowerCase().includes(search.toLowerCase());
      const skillsMatch = p.skills?.some((s) =>
        s.toLowerCase().includes(search.toLowerCase())
      );
      const langsMatch = p.languages?.some((l) =>
        l.toLowerCase().includes(search.toLowerCase())
      );
      return nameMatch || skillsMatch || langsMatch;
    });
  }

  // Get total before pagination
  const total = filteredEditors.length;

  // Apply pagination
  const paginatedEditors = filteredEditors.slice(skip, skip + limit);

  res.status(200).json({
    success: true,
    editors: paginatedEditors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
