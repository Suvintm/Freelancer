import express from "express";
import passport from "../../../config/passport.js";
import jwt from "jsonwebtoken";
import prisma from "../../../config/prisma.js";
import logger from "../../../utils/logger.js";
import axios from "axios";
import crypto from "crypto";
import { authLimiter, redis } from "../../../middleware/rateLimiter.js";
import { OAuth2Client } from "google-auth-library";
import { generateAccessToken, generateRefreshToken, hashToken } from "../utils/jwt.js";
import { checkAccountLockout } from "../../../middleware/lockoutMiddleware.js";
import youtubeSyncService from "../../youtube-creator/services/youtubeSyncService.js";
import { 
    USER_INCLUDE, 
    formatAuthResponse, 
    generateUserTokens 
} from "../utils/authHelpers.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * HELPER: Generate a One-Time Code (OTC)
 * Used to securely hand off tokens to the frontend/mobile via a POST exchange.
 * Prevents "Token-in-URL" leaks.
 */
const generateOTC = async (data) => {
    const code = crypto.randomBytes(32).toString("hex");
    // Store in Redis for 120 seconds
    await redis.set(`otc:${code}`, JSON.stringify(data), "EX", 120);
    return code;
};

// ============ GOOGLE OAUTH ============

// Initiate Google OAuth (Web)
router.get(
    "/google",
    authLimiter,
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
        session: false,
    })
);

// Initiate Google OAuth for YouTube (Web)
router.get(
    "/google/youtube",
    authLimiter,
    passport.authenticate("google", {
        scope: ["profile", "email", "https://www.googleapis.com/auth/youtube.readonly"],
        prompt: "select_account",
        session: false,
    })
);

// Google OAuth callback (Web)
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

            // PRODUCTION-GRADE: NEVER EXPOSE TOKENS IN URLS
            const otc = await generateOTC({ 
                userId: user.id,
                role: user.role,
                isOnboarded: user.is_onboarded,
                isVerified: user.is_verified,
                accessToken: user.accessToken
            });

            // Redirect with a short-lived exchange code
            res.redirect(`${FRONTEND_URL}/oauth-success?code=${otc}`);
        } catch (error) {
            logger.error("Google callback error:", error);
            res.redirect(`${FRONTEND_URL}/login?error=callback_failed`);
        }
    }
);

// ============ ONE-TIME CODE EXCHANGE (Secure POST) ============

/**
 * PRODUCTION-GRADE EXCHANGE SYSTEM
 * Replaces insecure URL-based token delivery.
 * One-time use, 120-second TTL.
 */
router.post("/exchange-code", authLimiter, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ success: false, message: "Exchange code required" });

        const redisKey = `otc:${code}`;
        const storedData = await redis.get(redisKey);

        if (!storedData) {
            return res.status(401).json({ success: false, message: "Invalid or expired exchange code" });
        }

        // Atomically consume the code (prevent replay attacks)
        await redis.del(redisKey);

        const { userId, accessToken: googleAccessToken } = JSON.parse(storedData);

        // Fetch user with full profile context
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { 
              profile: {
                include: { roles: { include: { subCategory: { include: { category: true } } } } }
              },
              youtubeProfiles: true 
            }
        });

        if (!user) throw new Error("User associated with code no longer exists");

        // Generate production-grade JWTs
        const familyId = crypto.randomUUID();
        const accessToken = generateAccessToken({ id: user.id, role: user.role });
        const refreshToken = generateRefreshToken({ id: user.id, familyId });
        const hashedToken = hashToken(refreshToken);

        // CAPTURE METADATA
        const userAgent = req.headers["user-agent"] || "OAuth Client";
        const ip = req.ip || req.connection.remoteAddress;

        const sessionData = JSON.stringify({
            userId: user.id,
            familyId,
            metadata: { userAgent, ip, lastActive: new Date().toISOString() }
        });

        // ATOMIC SESSION STORAGE (1 Hit)
        // 🛡️ [RESILIENCE] Skip Redis session if limit is hit
        try {
            await redis.pipeline()
                .set(`refresh_token:${hashedToken}`, sessionData, "EX", 7 * 24 * 60 * 60)
                .sadd(`token_family:${familyId}`, hashedToken)
                .expire(`token_family:${familyId}`, 7 * 24 * 60 * 60)
                .exec();
        } catch (err) {
            logger.error(`⚠️ [REDIS-FAILURE] Session storage skipped in exchange-code: ${err.message}`);
        }

        logger.info(`[SECURITY] OTC Exchange Success: User ${user.id} - New family: ${familyId}`);

        res.status(200).json({
            success: true,
            token: accessToken,
            refreshToken,
            googleAccessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.profile?.name,
                username: user.profile?.username,
                isOnboarded: user.is_onboarded,
                isVerified: user.is_verified,
                createdAt: user.created_at,
                role: user.role,
                profilePicture: user.profile?.profile_picture,
                youtubeProfile: user.youtubeProfiles
            }
        });
    } catch (error) {
        logger.error("OTC Exchange fail:", error);
        res.status(500).json({ success: false, message: "Security handoff failed" });
    }
});

/**
 * MOBILE GOOGLE AUTH: SMART LOGIN / CHECK
 * Logic: 
 * 1. If user exists -> Log them in immediately.
 * 2. If user is new -> Do NOT create record. Returning verified data for Atomic Signup.
 */
router.post("/google/mobile", authLimiter, checkAccountLockout, async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ success: false, message: "idToken is required" });
        }

        // 1. Cryptographically verify token locally
        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: GOOGLE_CLIENT_ID
            });
            payload = ticket.getPayload();
        } catch (err) {
            logger.error("Invalid Google ID Token:", err.message);
            return res.status(401).json({ success: false, message: "Insecure or invalid ID token signature" });
        }

        const { sub: googleId, email, name, picture } = payload;
        const normalizedEmail = email.toLowerCase().trim();
        
        logger.info(`[AUTH] Google Mobile Auth Attempt: ${normalizedEmail}`);

        // 2. [PRODUCTION HARDENING]: Check if user already exists
        // We use mode: 'insensitive' to ensure we capture manual registrations even if
        // the case doesn't match exactly.
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { google_id: googleId },
                    { email: { equals: normalizedEmail, mode: 'insensitive' } }
                ]
            },
            include: USER_INCLUDE
        });

        if (user) {
            logger.info(`[AUTH] Existing user found matching Google email: ${user.id} (${user.email})`);
        } else {
            logger.info(`[AUTH] No existing user found for Google email: ${normalizedEmail}. Proceeding to New User flow.`);
        }

        // 3. CASE A: User Exists -> Log in immediately
        if (user) {
            // PRODUCTION PATTERN: Link Google ID to their account if not already linked.
            // CRITICAL: Do NOT change auth_provider — a local user must still be able
            // to log in with their email + password. We only ADD the google_id.
            if (!user.google_id) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { 
                        google_id: googleId,
                        // is_verified = true is safe: Google confirmed they own this email
                        is_verified: true
                        // auth_provider intentionally NOT changed — preserve local/google/etc.
                    },
                    include: USER_INCLUDE
                });
            }

            // CAPTURE METADATA
            const userAgent = req.headers["user-agent"] || "Mobile App (Google)";
            const ip = req.ip || req.connection.remoteAddress;

            // Generate session context
            const familyId = crypto.randomUUID();
            const { accessToken, refreshToken } = generateUserTokens(user, familyId);
            const hashedToken = hashToken(refreshToken);

            const sessionData = JSON.stringify({
                userId: user.id,
                familyId,
                metadata: { userAgent, ip, lastActive: new Date().toISOString() }
            });

            // ATOMIC SESSION STORAGE (1 Hit)
            // 🛡️ [RESILIENCE] Skip Redis session if limit is hit
            try {
                await redis.pipeline()
                    .set(`refresh_token:${hashedToken}`, sessionData, "EX", 7 * 24 * 60 * 60)
                    .sadd(`token_family:${familyId}`, hashedToken)
                    .expire(`token_family:${familyId}`, 7 * 24 * 60 * 60)
                    .exec();
            } catch (err) {
                logger.error(`⚠️ [REDIS-FAILURE] Session storage skipped in google/mobile: ${err.message}`);
            }

            logger.info(`[SECURITY] Google Mobile Login: User ${user.id} - New family: ${familyId}`);

            return res.status(200).json({
                success: true,
                isNewUser: false,
                token: accessToken,
                refreshToken,
                user: formatAuthResponse(user)
            });
        }

        // 4. CASE B: User is New -> Buffer verified data for Atomic Signup
        // We do NOT create a record in the DB yet to keep it clean.
        return res.status(200).json({
            success: true,
            isNewUser: true,
            socialProfile: {
                email: normalizedEmail,
                name: name,
                picture: picture,
                googleId: googleId
            }
        });

    } catch (error) {
        logger.error("[OAuth Mobile Check Failure]:", error.message);
        res.status(500).json({ success: false, message: "Authentication check failed" });
    }
});

/**
 * ATOMIC SOCIAL REGISTRATION
 * Creates the entire user identity in a single database transaction. 
 * Prevents "Zombie" or incomplete social accounts.
 */
router.post("/google/register-atomic", authLimiter, checkAccountLockout, async (req, res) => {
    try {
        const { idToken, username, phone, categoryId, roleSubCategoryIds, youtubeChannels } = req.body;

        if (!idToken || !username || !phone) {
            return res.status(400).json({ success: false, message: "Missing mandatory registration data" });
        }

        // 1. Re-verify Google Token (Security Guard)
        let payload;
        try {
            const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
            payload = ticket.getPayload();
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid social authentication" });
        }

        const { sub: googleId, email, name, picture } = payload;
        const normalizedEmail = email.toLowerCase();
        const normalizedUsername = username.toLowerCase().trim();

        // 2. Final Conflict Check — Smart Auto-Login instead of hard rejection
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email: normalizedEmail }, { google_id: googleId }] },
            include: USER_INCLUDE
        });

        if (existing) {
            // PRODUCTION PATTERN: Don't reject. Silently log them in to their existing account.
            logger.info(`[SECURITY] register-atomic: Email ${normalizedEmail} already exists. Auto-logging in.`);

            // Link google_id if they originally registered manually.
            // CRITICAL: Preserve auth_provider — do NOT overwrite it.
            let finalUser = existing;
            if (!existing.google_id) {
                finalUser = await prisma.user.update({
                    where: { id: existing.id },
                    data: { google_id: googleId, is_verified: true },
                    include: USER_INCLUDE
                });
            }

            const userAgent = req.headers["user-agent"] || "Mobile App";
            const ip = req.ip || req.connection.remoteAddress;
            const familyId = crypto.randomUUID();
            const { accessToken, refreshToken } = generateUserTokens(finalUser, familyId);
            const hashedToken = hashToken(refreshToken);

            // 🛡️ [RESILIENCE] Skip Redis session if limit is hit
            try {
                await redis.pipeline()
                    .set(`refresh_token:${hashedToken}`, JSON.stringify({ userId: finalUser.id, familyId, metadata: { userAgent, ip, lastActive: new Date().toISOString() } }), "EX", 7 * 24 * 60 * 60)
                    .sadd(`token_family:${familyId}`, hashedToken)
                    .expire(`token_family:${familyId}`, 7 * 24 * 60 * 60)
                    .exec();
            } catch (err) {
                logger.error(`⚠️ [REDIS-FAILURE] Session storage skipped in register-atomic (existing): ${err.message}`);
            }

            return res.status(200).json({
                success: true,
                isNewUser: false,
                alreadyLoggedIn: true,
                token: accessToken,
                refreshToken,
                user: formatAuthResponse(finalUser)
            });
        }

        const usernameTaken = await prisma.userProfile.findUnique({ where: { username: normalizedUsername } });
        if (usernameTaken) return res.status(409).json({ success: false, message: "Handle already taken" });

        // UUID Guard: Ensure we don't pass empty strings to Uuid fields in Prisma
        const validCategoryId = categoryId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoryId) 
            ? categoryId 
            : null;
        
        const validRoleSubIds = (roleSubCategoryIds || []).filter(id => 
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
        );

        // 3. ATOMIC TRANSACTION: Create Everything
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: normalizedEmail,
                    google_id: googleId,
                    auth_provider: "google",
                    is_verified: true,
                    role: "suvix_user",
                    is_onboarded: true, // Atomic!
                    password_hash: `OAUTH_ATOMIC_${crypto.randomBytes(8).toString("hex")}`,
                }
            });

            const profile = await tx.userProfile.create({
                data: {
                    userId: newUser.id,
                    username: normalizedUsername,
                    name: name || "User",
                    profile_picture: null, // Ignore Google photo, use SuviX default
                    phone: phone.trim(),
                    location_country: "IN",
                    ...(validCategoryId ? { categoryId: validCategoryId } : {}),
                }
            });

            // Initialize Stats (Production Requirement)
            await tx.userStats.create({
                data: { userId: newUser.id }
            });

            if (validRoleSubIds.length > 0) {
                await tx.userRoleMapping.createMany({
                    data: validRoleSubIds.map((subId, index) => ({
                        profileId: profile.id,
                        roleSubCategoryId: subId,
                        isPrimary: index === 0,
                    }))
                });
            }

            // Removed manual YouTube Profile insertion.
            // This is now fully deferred to the BullMQ background worker to securely process
            // Cloudinary thumbnails and 15 related videos without blocking DB performance.

            return await tx.user.findUnique({
                where: { id: newUser.id },
                include: USER_INCLUDE
            });
        });

        // CAPTURE METADATA
        const userAgent = req.headers["user-agent"] || "Mobile App (Google Register)";
        const ip = req.ip || req.connection.remoteAddress;

        // Generate session context
        const familyId = crypto.randomUUID();
        const { accessToken, refreshToken } = generateUserTokens(user, familyId);
        const hashedToken = hashToken(refreshToken);

        const sessionData = JSON.stringify({
            userId: user.id,
            familyId,
            metadata: { userAgent, ip, lastActive: new Date().toISOString() }
        });

        // ATOMIC SESSION STORAGE (1 Hit)
        // 🛡️ [RESILIENCE] Skip Redis session if limit is hit
        try {
            await redis.pipeline()
                .set(`refresh_token:${hashedToken}`, sessionData, "EX", 7 * 24 * 60 * 60)
                .sadd(`token_family:${familyId}`, hashedToken)
                .expire(`token_family:${familyId}`, 7 * 24 * 60 * 60)
                .exec();
        } catch (err) {
            logger.error(`⚠️ [REDIS-FAILURE] Session storage skipped in register-atomic (new): ${err.message}`);
        }

        logger.info(`[SECURITY] Atomic Social Register Success: User ${user.id} - New family: ${familyId}`);

        // 🚀 DIRECT SYNC: Hand over YouTube processing to immediate service instead of background queue
        if (youtubeChannels && Array.isArray(youtubeChannels) && youtubeChannels.length > 0) {
            logger.info(`✨ [OAUTH-SYNC] Triggering direct sync for user ${user.id}`);
            (async () => {
                for (const channel of youtubeChannels) {
                    try {
                        await youtubeSyncService.persistYouTubeContent(user.id, channel);
                        logger.info(`✅ [OAUTH-SYNC] Successfully synced channel ${channel.channelId || channel.id} for user ${user.id}`);
                    } catch (syncError) {
                        logger.error(`❌ [OAUTH-SYNC] Direct sync failed for channel ${channel.channelId || channel.id}: ${syncError.message}`);
                    }
                }
            })();
        }

        res.status(201).json({
            success: true,
            token: accessToken,
            refreshToken,
            user: formatAuthResponse(user)
        });

    } catch (error) {
        console.error("❌ [Atomic Social Register Failure]:", error);
        res.status(500).json({ success: false, message: "Failed to finalize registration" });
    }
});

/**
 * SELECT ROLE / COMPLETE PROFILE
 * Handlers the Social Data Gap (taking missing mobile/username after Google login).
 */
router.post("/select-role", authLimiter, async (req, res) => {
    try {
        const { token, phone, country, categoryId, roleSubCategoryIds, username } = req.body;

        if (!token) throw new Error("Onboarding token required");

        // Verify onboarding context
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Finalize PostgreSQL Profile
        const updatedUser = await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: decoded.id },
                data: { is_onboarded: true }
            });

            const profile = await tx.userProfile.update({
                where: { userId: decoded.id },
                data: {
                    ...(username ? { username: username.toLowerCase().trim() } : {}),
                    ...(phone ? { phone } : {}),
                    ...(country ? { location_country: country } : {}),
                    ...(categoryId ? { categoryId } : {}),
                }
            });

            // Add Role Mappings (Expertise)
            if (roleSubCategoryIds && Array.isArray(roleSubCategoryIds) && roleSubCategoryIds.length > 0) {
                // Clear existing mappings if any (unlikely for new user but safe)
                await tx.userRoleMapping.deleteMany({
                    where: { profileId: profile.id }
                });

                await tx.userRoleMapping.createMany({
                    data: roleSubCategoryIds.map((subId, index) => ({
                        profileId: profile.id,
                        roleSubCategoryId: subId,
                        isPrimary: index === 0,
                    }))
                });
            }

            return await tx.user.findUnique({
                where: { id: decoded.id },
                include: USER_INCLUDE
            });
        });

        res.status(200).json({
            success: true,
            message: "Onboarding complete",
            user: formatAuthResponse(updatedUser)
        });
    } catch (e) {
        logger.error("❌ [Select-Role Failure]:", e.message);
        res.status(401).json({ success: false, message: "Onboarding failed" });
    }
});

export default router;
