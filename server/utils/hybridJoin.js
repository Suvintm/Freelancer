import prisma from "../config/prisma.js";
import logger from "./logger.js";

/**
 * Attaches user metadata (from PostgreSQL) to a list of MongoDB documents.
 * @param {Array} documents - The Mongoose documents (or lean results).
 * @param {String} userIdKey - The field in the document that contains the user UUID (e.g., 'user', 'editor').
 * @param {String} targetKey - The field to attach the fetched user data to (e.g., 'userInfo').
 * @returns {Promise<Array>} - The documents with attached user info.
 */
export const attachUserMetadata = async (documents, userIdKey = 'user', targetKey = 'userInfo') => {
  if (!documents || documents.length === 0) return documents;

  // Extract and validate user IDs (Must be valid UUIDs for PostgreSQL)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const userIds = [...new Set(documents.map(doc => {
      const id = doc[userIdKey];
      return typeof id === 'object' ? id.toString() : id;
  }))].filter(id => id && uuidRegex.test(id));

  if (userIds.length === 0) {
      logger.warn(`No valid UUIDs found for key ${userIdKey} in hybrid join. Data might be legacy MongoDB ObjectIds.`);
      return documents;
  }

  try {
    // Fetch users from PostgreSQL
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        role: true,
        profile: {
          select: {
            name: true,
            username: true,
            profile_picture: true,
          }
        }
      }
    });

    // Create a lookup map (Flatten profile data back to the root for compatibility)
    const userMap = users.reduce((acc, user) => {
      acc[user.id] = {
        id: user.id,
        role: user.role,
        name: user.profile?.name || 'User',
        username: user.profile?.username || 'user',
        profile_picture: user.profile?.profile_picture || null,
        // placeholders for missing legacy fields to avoid frontend crashes
        is_verified: false,
        is_banned: false
      };
      return acc;
    }, {});

    // Attach to documents
    return documents.map(doc => {
      const d = doc.toObject ? doc.toObject() : doc;
      const userId = d[userIdKey]?.toString() || d[userIdKey];
      return {
        ...d,
        [targetKey]: userMap[userId] || null
      };
    });
  } catch (error) {
    logger.error("Hybrid Join Error:", error);
    return documents; // Return original docs if join fails
  }
};

export default attachUserMetadata;
