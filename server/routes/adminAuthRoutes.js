import express from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { adminLoginLimiter, protectAdmin, logActivity } from "../middleware/adminAuth.js";

const router = express.Router();

// Generate JWT token for admin
const generateAdminToken = (admin) => {
  return jwt.sign(
    { 
      id: admin._id, 
      email: admin.email,
      role: admin.role,
      isAdmin: true,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" } // Shorter expiry for admin tokens
  );
};

// ============ ADMIN LOGIN ============
router.post("/login", adminLoginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find admin with password
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (admin.isLocked()) {
      const lockTime = Math.ceil((admin.lockedUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${lockTime} minutes`,
        lockedUntil: admin.lockedUntil,
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated. Contact superadmin",
      });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      // Increment failed attempts
      await admin.incLoginAttempts();
      
      const remainingAttempts = 5 - admin.loginAttempts - 1;
      
      return res.status(401).json({
        success: false,
        message: remainingAttempts > 0 
          ? `Invalid credentials. ${remainingAttempts} attempts remaining`
          : "Account locked due to too many failed attempts",
      });
    }

    // Reset login attempts on success
    await admin.resetLoginAttempts();

    // Generate token
    const token = generateAdminToken(admin);

    // Store session token (invalidates previous sessions)
    admin.currentSessionToken = token;
    admin.lastLogin = new Date();
    admin.lastLoginIP = ip;
    await admin.save();

    // Log the login activity
    await admin.logActivity("LOGIN", "Admin logged in successfully", ip);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
      },
    });

  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again",
    });
  }
});

// ============ VERIFY TOKEN ============
router.get("/verify", protectAdmin, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
        permissions: req.admin.permissions,
        lastLogin: req.admin.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
});

// ============ LOGOUT ============
router.post("/logout", protectAdmin, logActivity("LOGOUT"), async (req, res) => {
  try {
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    
    // Invalidate session
    req.admin.currentSessionToken = null;
    await req.admin.save();
    
    // Log activity
    await req.admin.logActivity("LOGOUT", "Admin logged out", ip);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
});

// ============ CHANGE PASSWORD ============
router.post("/change-password", protectAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    // Get admin with password
    const admin = await Admin.findById(req.admin._id).select("+password");

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    admin.password = newPassword;
    admin.currentSessionToken = null; // Force re-login
    await admin.save();

    // Log activity
    await admin.logActivity("PASSWORD_CHANGE", "Password changed", ip);

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again",
    });

  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
});

export default router;
