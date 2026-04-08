import prisma from "../../../config/prisma.js";
import { hashPassword } from "../utils/password.js";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";
import { ApiError } from "../../../middleware/errorHandler.js";
import logger from "../../../utils/logger.js";

/**
 * PRODUCTION-GRADE ATOMIC REGISTRATION (Split Schema)
 * 1. User (Auth) in PostgreSQL
 * 2. UserProfile (Identity) in PostgreSQL
 * 3. UserRoleMapping (Expertise) in PostgreSQL
 * 4. Auth-first onboarding flow (no cross-module sync)
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
    categoryId, // Optional primary category (legacy compatibility)
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
      let resolvedCategoryId = categoryId || null;
      if (!resolvedCategoryId && roleSubCategoryIds.length > 0) {
        const firstSubCategory = await tx.roleSubCategory.findFirst({
          where: { id: roleSubCategoryIds[0] },
          select: { roleCategoryId: true },
        });
        resolvedCategoryId = firstSubCategory?.roleCategoryId || null;
      }

      // Step A: Create User (Auth)
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          password_hash: hashedPassword,
          auth_provider: authProvider,
          google_id: googleId,
          role: 'suvix_user', // Standardized Professional Role
          is_onboarded: !!resolvedCategoryId || roleSubCategoryIds.length > 0,
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
          categoryId: resolvedCategoryId,
        },
      });

      // Step C: Map Dynamic Roles (Expertise)
      if (roleSubCategoryIds.length > 0) {
        const mappings = roleSubCategoryIds.map((subId, index) => ({
          profileId: profile.id,
          roleSubCategoryId: subId,
          isPrimary: index === 0,
        }));
        await tx.userRoleMapping.createMany({ data: mappings });
      }

      return {
        ...newUser,
        profile,
      };
    });

    logger.info(`Production Registration Success: ${user.email} (${user.id})`);
    return user;

  } catch (error) {
    logger.error("Registration Critical Failure:", error);
    throw error;
  }
};
