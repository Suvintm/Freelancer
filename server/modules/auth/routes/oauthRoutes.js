import express from "express";
import passport from "../../../config/passport.js";
import jwt from "jsonwebtoken";
import User from "../../user/models/User.js";
import { Profile } from "../../profiles/models/Profile.js";
import logger from "../../../utils/logger.js";
import axios from "axios";
import crypto from "crypto";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// ============ GOOGLE OAUTH ============

// Initiate Google OAuth
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account", // Always show account selector
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
                    { id: user._id, type: "role_selection" },
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

router.post("/select-role", async (req, res) => {
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

        // Update user role and production defaults
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const currencyMap = { IN: "INR", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD" };
        const currency = currencyMap[country] || "INR";
        const paymentGateway = country === "IN" ? "razorpay" : "none";

        user.role = role;
        user.phone = phone;
        user.country = country;
        user.currency = currency;
        user.paymentGateway = paymentGateway;
        user.isVerified = true; // OAuth users are verified
        await user.save();

        // Create profile for the user with full consistency
        const existingProfile = await Profile.findOne({ user: user._id });
        if (!existingProfile) {
            await Profile.create({
                user: user._id,
                about: "",
                portfolio: [],
                skills: [],
                languages: [],
                experience: "",
                certifications: [],
                contactEmail: user.email,
                location: { country: country },
            });
        } else {
            // Update existing profile with new country/email if necessary
            existingProfile.contactEmail = user.email;
            existingProfile.location = { country: country };
            await existingProfile.save();
        }

        // Generate full token
        const authToken = generateToken(user);

        logger.info(`[OAuth] Finalized registration: ${user.email} as ${role}`);

        res.status(200).json({
            success: true,
            message: "Registration completed successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileCompleted: user.profileCompleted,
                profilePicture: user.profilePicture,
                isVerified: user.isVerified,
                kycStatus: user.kycStatus,
                profileCompletionPercent: user.profileCompletionPercent,
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

        // 2. Check if user already exists
        let user = await User.findOne({ $or: [{ googleId }, { email: normalizedEmail }] });

        if (user) {
            // Already exists - link googleId if missing
            if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = "google";
                user.isVerified = true;
                await user.save();
                logger.info(`[OAuth Mobile] Linked Google account to existing user: ${normalizedEmail}`);
            } else {
                logger.info(`[OAuth Mobile] Login: ${normalizedEmail}`);
            }
        } else {
            // 3. New User Registration
            // Handle name collision
            let finalName = name || "User";
            const nameExists = await User.findOne({ name: { $regex: new RegExp(`^${finalName}$`, "i") } });
            if (nameExists) {
                finalName = `${finalName}${Math.floor(1000 + Math.random() * 9000)}`;
            }

            user = await User.create({
                name: finalName,
                email: normalizedEmail,
                googleId,
                authProvider: "google",
                isVerified: true,
                role: "pending",
                password: `OAUTH_MOBILE_${crypto.randomBytes(8).toString("hex")}`,
            });

            // Create Profile
            await Profile.create({
                user: user._id,
                contactEmail: user.email,
                location: { country: "IN" }, // Default
            });

            logger.info(`[OAuth Mobile] New user registered: ${normalizedEmail}`);
        }

        // 4. Handle Pending Role (consistent with Web flow)
        if (user.role === "pending") {
            const tempToken = jwt.sign(
                { id: user._id, type: "role_selection" },
                JWT_SECRET,
                { expiresIn: "15m" }
            );
            return res.status(200).json({
                success: true,
                requiresRoleSelection: true,
                token: tempToken,
                user: {
                    id: user._id,
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
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture || picture,
            }
        });

    } catch (error) {
        logger.error("[OAuth Mobile] Error:", error.response?.data || error.message);
        res.status(401).json({ success: false, message: "Google authentication failed" });
    }
});

export default router;






