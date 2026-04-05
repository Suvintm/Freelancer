import prisma from "../../config/prisma.js";
import logger from "../../utils/logger.js";

/**
 * Mirror a new MongoDB user to PostgreSQL
 * @param {Object} mongoUser - The Mongoose user document
 */
export const shadowCreateUser = async (mongoUser) => {
  try {
    const { _id, name, email, role, bio, phone, country, currency, walletBalance } = mongoUser;

    // 1. Create Core User record
    const postgresUser = await prisma.user.create({
      data: {
        id: _id.toString(), // Keep IDs identical for easy tracing
        name: name,
        email: email,
        role: role === 'admin' ? 'admin' : (role === 'client' ? 'client' : 'editor'),
        bio: bio || "",
        phone: phone || null,
        country: country || "IN",
        currency: currency || "INR",
        username: null, // As requested: don't auto-generate, keep default null
        auth_provider: mongoUser.authProvider || 'local',
        google_id: mongoUser.googleId || null,
      }
    });

    // 2. Initialize Normalized Profile
    await prisma.userProfile.create({
      data: {
        user_id: postgresUser.id,
        bio: bio || "",
        skills: [],
        softwares: [],
      }
    });

    // 3. Initialize Normalized Wallet
    await prisma.userWallet.create({
      data: {
        user_id: postgresUser.id,
        available_balance: walletBalance || 0,
        pending_balance: 0,
        currency: currency || "INR",
      }
    });

    logger.info(`[SHADOW-WRITE] Successfully mirrored user ${email} to PostgreSQL ✅`);
    return true;
  } catch (error) {
    logger.error(`[SHADOW-WRITE] Failed to mirror user ${mongoUser?.email}:`, error.message);
    // CRITICAL: We do NOT throw the error here, as we don't want to break the main registration flow
    return false;
  }
};

/**
 * Update an existing user in PostgreSQL
 * @param {Object} mongoUser - The Mongoose user document
 */
export const shadowUpdateUser = async (mongoUser) => {
    try {
        await prisma.user.update({
            where: { id: mongoUser._id.toString() },
            data: {
                name: mongoUser.name,
                bio: mongoUser.bio,
                phone: mongoUser.phone,
                country: mongoUser.country,
                currency: mongoUser.currency,
            }
        });
        logger.info(`[SHADOW-WRITE] Successfully updated user ${mongoUser.email} in PostgreSQL 🔄`);
    } catch (error) {
        logger.warn(`[SHADOW-WRITE] Update failed for ${mongoUser.email}:`, error.message);
    }
};
