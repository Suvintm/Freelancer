import prisma from "../config/prisma.js";

/**
 * Attaches PostgreSQL user metadata to MongoDB documents.
 * @param {Array} documents - Array of MongoDB lean objects.
 * @param {String} userField - The field name in the document that contains the User UUID.
 * @param {String} outField - The property name to attach the user info to.
 * @returns {Promise<Array>} - Documents enriched with user metadata.
 */
export const attachUserMetadata = async (documents, userField = 'user', outField = 'userInfo') => {
    if (!documents || documents.length === 0) return [];

    // Extract unique user IDs from the documents
    const userIds = [...new Set(documents.map(doc => {
        const value = doc[userField];
        // Handle cases where the field might be nested or an object
        return typeof value === 'string' ? value : value?.toString();
    }))].filter(Boolean);

    if (userIds.length === 0) return documents;

    // Fetch user metadata from PostgreSQL (Prisma)
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
            id: true,
            name: true,
            email: true,
            profile_picture: true,
            role: true,
            is_verified: true,
            kyc_status: true
        }
    });

    // Create a lookup map for efficiency
    const userMap = new Map(users.map(u => [u.id, {
        id: u.id,
        name: u.name,
        email: u.email,
        profilePicture: u.profile_picture,
        role: u.role,
        isVerified: u.is_verified,
        kycStatus: u.kyc_status
    }]));

    // Attach metadata to each document
    return documents.map(doc => {
        const uid = typeof doc[userField] === 'string' ? doc[userField] : doc[userField]?.toString();
        return {
            ...doc,
            [outField]: userMap.get(uid) || null
        };
    });
};
