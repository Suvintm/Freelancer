/**
 * Shared utility to calculate profile completion percentage.
 * Total 100% is divided into 5 Required Items (20% each).
 * 
 * @param {Object} user - User document/object
 * @param {Object} profile - Profile document/object
 * @param {Number} portfolioCount - Count of user's portfolio items
 * @returns {Number} - Completion percentage (0-100)
 */
export const calculateProfileCompletion = (user, profile, portfolioCount = 0) => {
  const requiredItems = [
    {
      id: "profilePicture",
      section: "personal",
      label: "Profile Photo",
      weight: 20,
      required: true,
      complete: !!(user?.profile_picture && !user.profile_picture.includes("flaticon")),
    },
    {
      id: "about",
      section: "personal",
      label: "Professional Bio",
      weight: 20,
      required: true,
      complete: !!(profile?.about && profile.about.length >= 10),
    },
    {
      id: "skills",
      section: "skills",
      label: "Skills (3+)",
      weight: 20,
      required: true,
      complete: !!(profile?.skills?.filter(Boolean)?.length >= 3),
    },
    {
      id: "portfolio",
      section: "portfolio",
      label: "Portfolio (2+)",
      weight: 20,
      required: true,
      complete: !!(portfolioCount >= 2 || (profile?.portfolio?.filter(Boolean)?.length >= 2)),
    },
    {
      id: "softwares",
      section: "skills",
      label: "Software & Tools (1+)",
      weight: 20,
      required: true,
      complete: !!(profile?.softwares?.filter(Boolean)?.length >= 1),
    },
  ];

  const completedCount = requiredItems.filter(i => i.complete && i.required).length;
  const currentPercentage = Math.round(completedCount * 20);

  return {
    percent: currentPercentage,
    percentage: currentPercentage, // Compatibility
    breakdown: requiredItems,
    requiredCount: requiredItems.length,
    requiredComplete: completedCount
  };
};
