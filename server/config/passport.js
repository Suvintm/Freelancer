import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import crypto from "crypto";

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
                state: false, 
                scope: ["profile", "email"],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    await loadDependencies();

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

                    // Check if user already exists with this Google ID
                    let user = await User.findOne({ googleId });

                    if (user) {
                        // User exists with Google ID - ONLY set Google picture if user has NO picture
                        // Never overwrite a custom picture the user has uploaded
                        if (profilePicture && !user.profilePicture) {
                            user.profilePicture = profilePicture;
                            await user.save();
                        }
                        logger.info(`[OAuth] Google login: ${email}`);
                        return done(null, user);
                    }

                    // Check if user exists with same email (registered via email/password)
                    user = await User.findOne({ email });

                    if (user) {
                        // Link Google account to existing user
                        user.googleId = googleId;
                        user.authProvider = "google";
                        // Do not update profilePicture from Google anymore
                        // Google emails are considered verified
                        user.isVerified = true; 
                        
                        await user.save();
                        logger.info(`[OAuth] Linked Google account to existing user: ${email}`);
                        return done(null, user);
                    }

                    // NEW USER REGISTRATION via Google
                    // Smart Name Generation: Handle unique name requirement
                    let baseName = profile.displayName || profile.name?.givenName || "User";
                    baseName = baseName.trim();
                    let finalName = baseName;
                    
                    // Check if name is taken
                    const nameExists = await User.findOne({ name: { $regex: new RegExp(`^${finalName}$`, "i") } });
                    if (nameExists) {
                        // Append a random 4-digit number if name is taken
                        finalName = `${baseName}${Math.floor(1000 + Math.random() * 9000)}`;
                    }

                    const newUser = await User.create({
                        name: finalName,
                        email,
                        googleId,
                        profilePicture: "", // Force platform default
                        password: `OAUTH_USER_${crypto.randomBytes(8).toString("hex")}`,
                        role: "pending", // Force role selection flow
                        authProvider: "google",
                        isVerified: true, // Google verified the email
                        profileCompleted: false,
                    });

                    logger.info(`[OAuth] New user registered via Google: ${email} (Name: ${finalName})`);
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
