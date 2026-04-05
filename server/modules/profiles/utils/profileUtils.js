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
  let completion = 0;
  
  const requiredItems = [
    {
      // 1. Profile Photo (20%)
      complete: !!(user?.profile_picture && !user.profile_picture.includes("flaticon")),
    },
    {
      // 2. Professional Bio (20%)
      complete: !!(profile?.about && profile.about.length >= 10),
    },
    {
      // 3. Skills (3+) (20%)
      complete: !!(profile?.skills && profile.skills.length >= 3),
    },
    {
      // 4. Portfolio (2+) (20%)
      complete: !!(portfolioCount >= 2 || (profile?.portfolio && profile.portfolio.length >= 2)),
    },
    {
      // 5. Software & Tools (1+) (20%)
      complete: !!(profile?.softwares && profile.softwares.length >= 1),
    },
  ];

  const completedCount = requiredItems.filter(i => i.complete).length;
  completion = completedCount * 20;

  return Math.round(completion);
};
