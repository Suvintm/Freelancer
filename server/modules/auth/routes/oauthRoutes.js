import express from "express";
import passport from "../../../config/passport.js";
import jwt from "jsonwebtoken";
import prisma from "../../../config/prisma.js";
import logger from "../../../utils/logger.js";
import axios from "axios";
import crypto from "crypto";
import { authLimiter } from "../../../middleware/rateLimiter.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Generate JWT token (Postgres/Prisma)
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// ============ GOOGLE OAUTH ============

// Initiate Google OAuth
router.get(
    "/google",
    authLimiter,
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
        session: false,
    })
);

// Google OAuth callback
router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`,
        session: false,
    }),
    async (req, res) => {
        try {
            const user = req.user;

            if (!user) {
                return res.redirect(`${FRONTEND_URL}/login?error=no_user`);
            }

            // Check if user needs onboarding (new OAuth user)
            if (!user.is_onboarded) {
                // Generate a temporary token for role selection
                const tempToken = jwt.sign(
                    { id: user.id, type: "role_selection" },
                    JWT_SECRET,
                    { expiresIn: "10m" }
                );
                return res.redirect(`${FRONTEND_URL}/select-role?token=${tempToken}`);
            }

            // User has role - generate full token
            const token = generateToken(user);

            // Redirect to frontend with token
            res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
        } catch (error) {
            logger.error("Google callback error:", error);
            res.redirect(`${FRONTEND_URL}/login?error=callback_failed`);
        }
    }
);

// ============ ROLE SELECTION (for new OAuth users) ============

router.post("/select-role", authLimiter, async (req, res) => {
    try {
        const { token, phone, country, categoryId, roleSubCategoryIds } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Onboarding token is required",
            });
        }

        // Verify temp token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        if (decoded.type !== "role_selection") {
            return res.status(401).json({
                success: false,
                message: "Invalid token type",
            });
        }

        let parsedSubIds = roleSubCategoryIds;
        if (typeof roleSubCategoryIds === "string" && roleSubCategoryIds) {
            try { parsedSubIds = JSON.parse(roleSubCategoryIds); } catch (e) { parsedSubIds = []; }
        }
        const finalSubIds = Array.isArray(parsedSubIds) ? parsedSubIds : [];

        // Update user onboarding atomically
        const updatedUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id: decoded.id },
                data: {
                    is_onboarded: true,
                    is_verified: true,
                }
            });

            const profile = await tx.userProfile.findUnique({
                where: { userId: user.id },
                select: { id: true }
            });

            if (profile) {
                await tx.userProfile.update({
                    where: { userId: user.id },
                    data: {
                        ...(country ? { location_country: country } : {}),
                        ...(phone ? { phone } : {}),
                        ...(categoryId ? { categoryId } : {}),
                    }
                });

                if (finalSubIds.length > 0) {
                    await tx.userRoleMapping.createMany({
                        data: finalSubIds.map((subId, index) => ({
                            profileId: profile.id,
                            roleSubCategoryId: subId,
                            isPrimary: index === 0,
                        })),
                        skipDuplicates: true,
                    });
                }
            }

            return user;
        });

        // Generate full token
        const authToken = jwt.sign(
            { id: updatedUser.id, role: updatedUser.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        logger.info(`[OAuth] Finalized onboarding (Postgres): ${updatedUser.id}`);

        res.status(200).json({
            success: true,
            message: "Registration completed successfully",
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
            },
            token: authToken,
        });
    } catch (error) {
        logger.error("Role selection error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to set role",
        });
    }
});

// ============ MOBILE GOOGLE AUTH (Token Exchange) ============

router.post("/google/mobile", async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ success: false, message: "idToken is required" });
        }

        // 1. Verify token with Google
        const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        const { sub: googleId, email, name, picture } = response.data;

        if (!email) {
            return res.status(400).json({ success: false, message: "Invalid token data" });
        }

        const normalizedEmail = email.toLowerCase();

        // 2. Check if user already exists in PostgreSQL
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { google_id: googleId },
                    { email: normalizedEmail }
                ]
            },
            include: { profile: true }
        });

        if (user) {
            // Already exists - link googleId if missing
            if (!user.google_id) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        google_id: googleId,
                        auth_provider: "google",
                        is_verified: true
                    },
                    include: { profile: true }
                });
                logger.info(`[OAuth Mobile] Linked Google account to existing user: ${normalizedEmail}`);
            } else {
                logger.info(`[OAuth Mobile] Login: ${normalizedEmail}`);
            }
        } else {
            // 3. New User Registration via Transaction
            let finalName = name || "User";
            let finalUsername = finalName.toLowerCase().replace(/\s+/g, '_') + `_${crypto.randomBytes(3).toString('hex')}`;

            user = await prisma.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: {
                        email: normalizedEmail,
                        google_id: googleId,
                        auth_provider: "google",
                        is_verified: true,
                        role: "suvix_user",
                        is_onboarded: false,
                        password_hash: `OAUTH_MOBILE_${crypto.randomBytes(8).toString("hex")}`,
                    }
                });

                await tx.userProfile.create({
                    data: {
                        userId: newUser.id,
                        username: finalUsername,
                        name: finalName,
                        display_name: finalName,
                        profile_picture: picture,
                        location_country: "IN", 
                    }
                });

                return await tx.user.findUnique({
                    where: { id: newUser.id },
                    include: { profile: true }
                });
            });

            logger.info(`[OAuth Mobile] New user registered: ${normalizedEmail}`);
        }

        // 4. Handle pending onboarding
        if (!user.is_onboarded) {
            const tempToken = jwt.sign(
                { id: user.id, type: "role_selection" },
                JWT_SECRET,
                { expiresIn: "15m" }
            );
            return res.status(200).json({
                success: true,
                requiresRoleSelection: true,
                token: tempToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.profile?.name,
                    displayName: user.profile?.display_name || user.profile?.name,
                    role: user.role
                }
            });
        }

        // 5. Success - generate full token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.profile?.name,
                displayName: user.profile?.display_name || user.profile?.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profile?.profile_picture || picture,
            }
        });

    } catch (error) {
        logger.error("[OAuth Mobile] Error (Postgres):", error.response?.data || error.message);
        res.status(401).json({ success: false, message: "Google authentication failed" });
    }
});

export default router;






