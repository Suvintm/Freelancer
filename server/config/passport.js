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

                    // Check if user already exists with this Google ID in PostgreSQL
                    let user = await prisma.user.findUnique({
                        where: { google_id: googleId }
                    });

                    if (user) {
                        // User exists with Google ID
                        if (profilePicture && !user.profile_picture) {
                            await prisma.user.update({
                                where: { id: user.id },
                                data: { profile_picture: profilePicture }
                            });
                        }
                        logger.info(`[OAuth] Google login (Postgres): ${email}`);
                        return done(null, user);
                    }

                    // Check if user exists with same email (registered via email/password)
                    user = await prisma.user.findUnique({
                        where: { email }
                    });

                    if (user) {
                        // Link Google account to existing user in PostgreSQL
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                google_id: googleId,
                                auth_provider: "google",
                                is_verified: true
                            }
                        });
                        logger.info(`[OAuth] Linked Google account to existing user in Postgres: ${email}`);
                        return done(null, user);
                    }

                    // NEW USER REGISTRATION via Google
                    // Smart Name Generation
                    let baseName = profile.displayName || profile.name?.givenName || "User";
                    baseName = baseName.trim();
                    let finalName = baseName;
                    
                    // Check if name is taken (Case-insensitive check in Postgres)
                    const nameExists = await prisma.user.findFirst({
                        where: { name: { equals: finalName, mode: 'insensitive' } }
                    });

                    if (nameExists) {
                        finalName = `${baseName}${Math.floor(1000 + Math.random() * 9000)}`;
                    }

                    const newUser = await prisma.user.create({
                        data: {
                            name: finalName,
                            email,
                            google_id: googleId,
                            profile_picture: "",
                            password_hash: `OAUTH_USER_${crypto.randomBytes(8).toString("hex")}`,
                            role: "pending", // Force role selection flow for truly new users
                            auth_provider: "google",
                            is_verified: true,
                            profile_completed: false,
                        }
                    });

                    // Create user profile
                    await prisma.userProfile.create({
                        data: {
                            user_id: newUser.id,
                            about: "",
                            skills: [],
                            languages: [],
                            experience: "",
                        }
                    });

                    logger.info(`[OAuth] New user registered via Google in Postgres: ${email} (Name: ${finalName})`);
                    return done(null, newUser);
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
