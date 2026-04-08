import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import crypto from "crypto";
import prisma from "./prisma.js";
import logger from "../utils/logger.js";

// Load environment variables
dotenv.config();

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";

console.log("Google OAuth Config Check (Prisma):", {
    hasClientId: !!GOOGLE_CLIENT_ID,
    hasClientSecret: !!GOOGLE_CLIENT_SECRET,
    callbackUrl: GOOGLE_CALLBACK_URL,
});

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                callbackURL: GOOGLE_CALLBACK_URL,
                state: false, 
                scope: ["profile", "email"],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Extract user info from Google profile
                    const googleId = profile.id;
                    const email = profile.emails?.[0]?.value?.toLowerCase();
                    const profilePicture = profile.photos?.[0]?.value || "";

                    logger.debug("[OAuth] Profile received:", { 
                        id: profile.id, 
                        email, 
                        displayName: profile.displayName 
                    });

                    if (!email) {
                        return done(new Error("No email provided by Google"), null);
                    }

                    // 1. Check if user already exists with this Google ID 
                    let user = await prisma.user.findUnique({
                        where: { google_id: googleId },
                        include: { profile: true }
                    });

                    if (user) {
                        logger.info(`[OAuth] Google login (Postgres): ${email}`);
                        return done(null, user);
                    }

                    // 2. Check if user exists with same email (link account)
                    user = await prisma.user.findUnique({
                        where: { email },
                        include: { profile: true }
                    });

                    if (user) {
                        // Link Google account to existing user
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                google_id: googleId,
                                auth_provider: "google",
                                is_verified: true
                            },
                            include: { profile: true }
                        });
                        logger.info(`[OAuth] Linked Google account to existing user in Postgres: ${email}`);
                        return done(null, user);
                    }

                    // 3. NEW USER REGISTRATION via Google
                    // Smart Name Generation
                    let baseName = profile.displayName || profile.name?.givenName || "User";
                    let finalName = baseName.trim();
                    let finalUsername = finalName.toLowerCase().replace(/\s+/g, '_') + `_${crypto.randomBytes(3).toString('hex')}`;

                    // Atomic Creation (Auth + Profile)
                    user = await prisma.$transaction(async (tx) => {
                        const newUser = await tx.user.create({
                            data: {
                                email,
                                google_id: googleId,
                                password_hash: `OAUTH_USER_${crypto.randomBytes(8).toString("hex")}`,
                                role: "suvix_user", 
                                auth_provider: "google",
                                is_verified: true,
                                is_onboarded: false,
                            }
                        });

                        await tx.userProfile.create({
                            data: {
                                userId: newUser.id,
                                username: finalUsername,
                                name: finalName,
                                display_name: finalName,
                                profile_picture: profilePicture,
                                auth_provider: "google",
                            }
                        });

                        return await tx.user.findUnique({
                            where: { id: newUser.id },
                            include: { profile: true }
                        });
                    });

                    logger.info(`[OAuth] New user registered via Google: ${email}`);
                    return done(null, user);
                } catch (error) {
                    console.error("Google OAuth error:", error);
                    return done(error, null);
                }
            }
        )
    );
    console.log("✅ Google OAuth strategy (Prisma) initialized successfully");
} else {
    console.log("⚠️ Google OAuth credentials not found - Google login disabled");
}

export default passport;
