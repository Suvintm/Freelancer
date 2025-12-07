import express from "express";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { Profile } from "../models/Profile.js";
import logger from "../utils/logger.js";

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
        const { token, role } = req.body;

        if (!token || !role) {
            return res.status(400).json({
                success: false,
                message: "Token and role are required",
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

        // Update user role
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.role = role;
        await user.save();

        // Create profile for the user
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
                location: { country: "" },
            });
        }

        // Generate full token
        const authToken = generateToken(user);

        logger.info(`OAuth user role set: ${user.email} -> ${role}`);

        res.status(200).json({
            success: true,
            message: "Role selected successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileCompleted: user.profileCompleted,
                profilePicture: user.profilePicture,
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

export default router;
