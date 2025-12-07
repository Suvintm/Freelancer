import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Lazy load models to avoid circular dependency
let User;
let logger;

const loadDependencies = async () => {
    if (!User) {
        const userModule = await import("../models/User.js");
        User = userModule.default;
    }
    if (!logger) {
        const loggerModule = await import("../utils/logger.js");
        logger = loggerModule.default;
    }
};

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        await loadDependencies();
        const user = await User.findById(id).select("-password");
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";

console.log("Google OAuth Config Check:", {
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
                scope: ["profile", "email"],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    await loadDependencies();

                    // Extract user info from Google profile
                    const googleId = profile.id;
                    const email = profile.emails?.[0]?.value?.toLowerCase();
                    const name = profile.displayName || profile.name?.givenName || "User";
                    const profilePicture = profile.photos?.[0]?.value || "";

                    if (!email) {
                        return done(new Error("No email provided by Google"), null);
                    }

                    // Check if user already exists with this Google ID
                    let user = await User.findOne({ googleId });

                    if (user) {
                        // User exists with Google ID - update profile picture if changed
                        if (profilePicture && user.profilePicture !== profilePicture) {
                            user.profilePicture = profilePicture;
                            await user.save();
                        }
                        logger.info(`Google OAuth login: ${email}`);
                        return done(null, user);
                    }

                    // Check if user exists with same email (registered via email/password)
                    user = await User.findOne({ email });

                    if (user) {
                        // Link Google account to existing user
                        user.googleId = googleId;
                        if (!user.profilePicture || user.profilePicture.includes("flaticon.com")) {
                            user.profilePicture = profilePicture;
                        }
                        await user.save();
                        logger.info(`Google account linked to existing user: ${email}`);
                        return done(null, user);
                    }

                    // Create new user with pending role (will select role after OAuth)
                    const newUser = await User.create({
                        name,
                        email,
                        googleId,
                        profilePicture,
                        password: "OAUTH_USER_NO_PASSWORD",
                        role: "pending",
                        authProvider: "google",
                        profileCompleted: false,
                    });

                    logger.info(`New user registered via Google OAuth: ${email}`);
                    return done(null, newUser);
                } catch (error) {
                    console.error("Google OAuth error:", error);
                    return done(error, null);
                }
            }
        )
    );
    console.log("✅ Google OAuth strategy initialized successfully");
} else {
    console.log("⚠️ Google OAuth credentials not found - Google login disabled");
}

export default passport;
