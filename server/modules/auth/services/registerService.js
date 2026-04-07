import prisma from "../../../config/prisma.js";
import { Profile as MongoProfile } from "../../profiles/models/Profile.js";
import { hashPassword } from "../utils/password.js";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";
import { ApiError } from "../../../middleware/errorHandler.js";
import logger from "../../../utils/logger.js";

/**
 * PRODUCTION-GRADE ATOMIC REGISTRATION (Split Schema)
 * 1. User (Auth) in PostgreSQL
 * 2. UserProfile (Identity) in PostgreSQL
 * 3. UserRoleMapping (Expertise) in PostgreSQL
 * 4. Sync Profile to MongoDB (Discovery)
 */
export const registerFullUser = async (userData) => {
  const {
    fullName,
    username,
    email,
    password,
    phone,
    motherTongue,
    country = "India",
    categoryId, // Required Single Category
    roleSubCategoryIds = [], // Array of UUIDs or Slugs
    profilePictureBuffer,
    authProvider = "local",
    googleId = null,
  } = userData;

  const normalizedEmail = email.toLowerCase();
  const normalizedUsername = username.toLowerCase();

  // 1. Conflict Check: Email or Username
  const existingUser = await prisma.user.findFirst({
    where: { email: normalizedEmail }
  });
  if (existingUser) throw new ApiError(400, "Email already registered. Please login.");

  const existingProfile = await prisma.userProfile.findFirst({
    where: { username: normalizedUsername }
  });
  if (existingProfile) throw new ApiError(400, "Username already taken.");

  // 2. Hash Password (if local)
  const hashedPassword = password ? await hashPassword(password) : null;

  // 3. Image Upload
  let profilePictureUrl = "";
  if (profilePictureBuffer) {
    try {
      const uploadResult = await uploadToCloudinary(profilePictureBuffer, "profiles");
      profilePictureUrl = uploadResult.url;
    } catch (error) {
      logger.error("Cloudinary Upload Failed:", error);
    }
  }

  // 4. Atomic PostgreSQL Transaction
  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      // Step A: Create User (Auth)
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          password_hash: hashedPassword,
          auth_provider: authProvider,
          google_id: googleId,
          role: 'suvix_user', // Standardized Professional Role
          is_onboarded: !!categoryId, // Mark as onboarded if category provided
        },
      });

      // Step B: Create User Profile (Identity)
      const profile = await tx.userProfile.create({
        data: {
          userId: newUser.id,
          username: normalizedUsername,
          name: fullName,
          profile_picture: profilePictureUrl,
          mother_tongue: motherTongue,
          location_country: country,
          phone: phone,
          auth_provider: authProvider,
          categoryId: categoryId, // Locked Primary Category
        },
      });

      // Step C: Map Dynamic Roles (Expertise)
      if (roleSubCategoryIds.length > 0) {
        const mappings = roleSubCategoryIds.map((subId) => ({
          profileId: profile.id,
          roleSubCategoryId: subId,
        }));
        await tx.userRoleMapping.createMany({ data: mappings });
      }

      return {
        ...newUser,
        profile,
      };
    });

    // 5. MongoDB Sync (Discovery & Reels Support)
    try {
        await MongoProfile.findOneAndUpdate(
            { user: user.id },
            {
              $set: {
                username: normalizedUsername,
                name: fullName,
                email: normalizedEmail,
                profile_picture: profilePictureUrl,
                location: { country: country },
                // Note: roleSubCategory names/labels can be synced later for search
              }
            },
            { upsert: true, new: true }
        );
    } catch (mongoError) {
        logger.error("MongoDB Profile Sync Failed (Non-blocking):", mongoError);
        // Non-blocking so registration isn't failed for secondary DB sync issues
    }

    logger.info(`Production Registration Success: ${user.email} (${user.id})`);
    return user;

  } catch (error) {
    logger.error("Registration Critical Failure:", error);
    throw error;
  }
};
