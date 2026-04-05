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

            // Check if user needs to select role (new OAuth user)
            if (user.role === "pending") {
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
        const { token, role, phone, country } = req.body;

        if (!token || !role || !phone || !country) {
            return res.status(400).json({
                success: false,
                message: "Role, phone and country are required",
            });
        }

        if (!["editor", "client"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role. Must be 'editor' or 'client'",
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

        // Update user role and production defaults in PostgreSQL
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const currencyMap = { IN: "INR", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD" };
        const currency = currencyMap[country] || "INR";
        const paymentGateway = country === "IN" ? "razorpay" : "none";

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                role,
                phone,
                country,
                currency,
                payment_gateway: paymentGateway,
                is_verified: true,
            }
        });

        // Create profile for the user in PostgreSQL
        const existingProfile = await prisma.userProfile.findUnique({ where: { user_id: user.id } });
        if (!existingProfile) {
            await prisma.userProfile.create({
                data: {
                    user_id: user.id,
                    about: "",
                    skills: [],
                    languages: [],
                    experience: "",
                    contact_email: updatedUser.email,
                    location_country: country,
                }
            });
        } else {
            await prisma.userProfile.update({
                where: { user_id: user.id },
                data: {
                    contact_email: updatedUser.email,
                    location_country: country,
                }
            });
        }

        // Generate full token
        const authToken = generateToken(updatedUser);

        logger.info(`[OAuth] Finalized registration (Postgres): ${updatedUser.email} as ${role}`);

        res.status(200).json({
            success: true,
            message: "Registration completed successfully",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                profileCompleted: updatedUser.profile_completed,
                profilePicture: updatedUser.profile_picture,
                isVerified: updatedUser.is_verified,
                kycStatus: updatedUser.kyc_status,
                profileCompletionPercent: updatedUser.profile_completion_percent,
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
            }
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
                    }
                });
                logger.info(`[OAuth Mobile] Linked Google account to existing user (Postgres): ${normalizedEmail}`);
            } else {
                logger.info(`[OAuth Mobile] Login (Postgres): ${normalizedEmail}`);
            }
        } else {
            // 3. New User Registration in PostgreSQL
            let finalName = name || "User";
            const nameExists = await prisma.user.findFirst({
                where: { name: { equals: finalName, mode: 'insensitive' } }
            });
            if (nameExists) {
                finalName = `${finalName}${Math.floor(1000 + Math.random() * 9000)}`;
            }

            user = await prisma.user.create({
                data: {
                    name: finalName,
                    email: normalizedEmail,
                    google_id: googleId,
                    auth_provider: "google",
                    is_verified: true,
                    role: "pending",
                    password_hash: `OAUTH_MOBILE_${crypto.randomBytes(8).toString("hex")}`,
                }
            });

            // Create Profile
            await prisma.userProfile.create({
                data: {
                    user_id: user.id,
                    contact_email: user.email,
                    location_country: "IN", 
                }
            });

            logger.info(`[OAuth Mobile] New user registered (Postgres): ${normalizedEmail}`);
        }

        // 4. Handle Pending Role
        if (user.role === "pending") {
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
                    name: user.name,
                    role: user.role
                }
            });
        }

        // 5. Success - generate full token
        const token = generateToken(user);
        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profile_picture || picture,
            }
        });

    } catch (error) {
        logger.error("[OAuth Mobile] Error (Postgres):", error.response?.data || error.message);
        res.status(401).json({ success: false, message: "Google authentication failed" });
    }
});

export default router;






