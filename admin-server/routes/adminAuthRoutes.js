import express from "express";
import jwt from "jsonwebtoken";
import AdminMember from "../models/AdminMember.js";
import SuperAdmin from "../models/SuperAdmin.js";
import AdminRole from "../models/AdminRole.js";
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

// ============ GET AVAILABLE ROLES ============
// This endpoint helps the login page show only existing roles
router.get("/roles", async (req, res) => {
  try {
    const roles = await AdminRole.find({ isActive: true }).select("name value color memberCount");
    
    // Always ensure superadmin is in the list, and at the top
    let uniqueRoles = roles.map(r => r.value);
    
    let roleObjects = roles.map(r => ({
      id: r.value,
      label: r.name,
      color: r.color || "#1d4ed8",
      memberCount: r.memberCount || 0
    }));

    if (!uniqueRoles.includes("superadmin")) {
      roleObjects.unshift({
        id: "superadmin",
        label: "Superadmin",
        color: "#7e22ce",
        memberCount: 1
      });
      uniqueRoles.unshift("superadmin");
    }

    res.status(200).json({
      success: true,
      roles: roleObjects.map(r => r),
      roleDetails: roleObjects
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch roles" });
  }
});

router.post("/login", adminLoginLimiter, async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, password and role",
      });
    }

    const masterEmail = process.env.SUPER_ADMIN_EMAIL;
    const masterPass = process.env.SUPER_ADMIN_PASSWORD;

    if (email === masterEmail && role === "superadmin") {
      // Find if this superadmin exists in DB
      let admin = await SuperAdmin.findOne({ email }).select("+password");

      // Seed if not exists using .env
      if (!admin) {
        if (password !== masterPass) {
          return res.status(401).json({ success: false, message: "Invalid master credentials" });
        }
        admin = await SuperAdmin.create({
          name: "Master Super Admin",
          email: masterEmail,
          password: masterPass,
          role: "superadmin"
        });
      } else {
        // Compare with DB
        const isMatch = await admin.correctPassword(password, admin.password);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: "Invalid master credentials" });
        }
      }

      const token = generateAdminToken(admin);
      // Fallback variables for SuperAdmin tracking
      admin.currentSessionToken = token;
      admin.lastLogin = new Date();
      admin.lastLoginIP = ip;
      await admin.save();

      return res.status(200).json({
        success: true,
        message: "Master Login successful",
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: { users: true, orders: true, gigs: true, analytics: true, settings: true },
          lastLogin: admin.lastLogin,
        },
      });
    }

    // 2. Standard DB Login if not master
    const admin = await AdminMember.findOne({ email }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Validate Selected Role
    if (admin.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Unauthorized. Your account does not have ${role} privileges.`,
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
    await admin.logActivity("LOGIN", `Admin logged in as ${role.toUpperCase()}`, ip);

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
        notificationPrefs: req.admin.notificationPrefs,
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
    
    // Log activity if AdminMember
    if (req.admin.role !== "superadmin" && typeof req.admin.logActivity === 'function') {
      await req.admin.logActivity("LOGOUT", "Admin logged out", ip);
    }

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

    let ModelClass = req.admin.role === "superadmin" ? SuperAdmin : AdminMember;
    const admin = await ModelClass.findById(req.admin._id).select("+password");

    // Verify current password
    let isMatch = false;
    if (req.admin.role === "superadmin") {
        isMatch = await admin.correctPassword(currentPassword, admin.password);
    } else {
        isMatch = await admin.comparePassword(currentPassword);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    admin.password = newPassword;
    if (admin.currentSessionToken) admin.currentSessionToken = null; // Force re-login
    await admin.save();

    // Log activity if AdminMember
    if (req.admin.role !== "superadmin" && typeof admin.logActivity === 'function') {
       await admin.logActivity("PASSWORD_CHANGE", "Password changed", ip);
    }

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

// ============ UPDATE NOTIFICATION PREFS ============
// ============ GET SESSIONS ============
router.get("/sessions", protectAdmin, async (req, res) => {
  try {
    const sessions = [];
    
    // We only track the single active session for now
    if (req.admin.currentSessionToken) {
      sessions.push({
        id: "current",
        isActive: true,
        ip: req.admin.lastLoginIP || "Unknown",
        lastActive: req.admin.lastLogin || new Date(),
        device: "Current Device",
        location: "Current Location"
      });
    } else {
      // If we are here, we are using the current valid token
      sessions.push({
        id: "current",
        isActive: true,
        ip: req.ip || "Unknown",
        lastActive: new Date(),
        device: "Current Device",
        location: "Current Location"
      });
    }

    res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch sessions" });
  }
});

// ============ REVOKE SESSION ============
router.delete("/sessions/:id", protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === "current") {
      req.admin.currentSessionToken = null;
      await req.admin.save();
      return res.status(200).json({ success: true, message: "Session revoked successfully" });
    }

    res.status(404).json({ success: false, message: "Session not found" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to revoke session" });
  }
});

router.patch("/notifications", protectAdmin, async (req, res) => {
  try {
    const { prefs } = req.body;
    
    if (!prefs) {
      return res.status(400).json({ success: false, message: "No preferences provided" });
    }

    let ModelClass = req.admin.role === "superadmin" ? SuperAdmin : AdminMember;

    const admin = await ModelClass.findByIdAndUpdate(
      req.admin._id,
      { $set: { notificationPrefs: prefs } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      prefs: admin.notificationPrefs,
      message: "Notification preferences updated"
    });

  } catch (error) {
    console.error("Update notification prefs error:", error);
    res.status(500).json({ success: false, message: "Failed to update notification preferences" });
  }
});

export default router;
