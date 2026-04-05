import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

// Verify admin JWT token
export const protectAdmin = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's an admin token
      if (!decoded.isAdmin) {
        return res.status(401).json({
          success: false,
          message: "Not authorized - Admin access required",
        });
      }

      // Get admin from database based on role (PostgreSQL)
      let admin = null;
      if (decoded.role === "superadmin") {
        admin = await prisma.superAdmin.findUnique({ where: { id: decoded.id } });
      } else {
        admin = await prisma.adminMember.findUnique({ 
            where: { id: decoded.id },
            include: { role: true } // Include role details for permissions
        });
      }

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Check if admin is active (PostgreSQL field is is_active)
      if (!admin.is_active) {
        return res.status(401).json({
          success: false,
          message: "Admin account has been deactivated",
        });
      }

      // Password verification (check password_changed_at if exists)
      if (admin.password_changed_at) {
        const changedTimestamp = parseInt(admin.password_changed_at.getTime() / 1000, 10);
        if (decoded.iat < changedTimestamp) {
            return res.status(401).json({
              success: false,
              message: "Password was recently changed. Please login again",
            });
        }
      }

      // Verify session token matches (single session enforcement)
      if (admin.current_session_token && admin.current_session_token !== token) {
        return res.status(401).json({
          success: false,
          message: "Session expired. You may have logged in from another device",
        });
      }

      // Attach admin to request
      req.admin = admin;
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired. Please login again",
        });
      }
      throw err;
    }
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// Check specific permissions
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Superadmin has all permissions
    if (req.admin.role === "superadmin") {
      return next();
    }

    // Check specific permission (Prisma role/permissions)
    const permissions = req.admin.permissions || req.admin.role?.permissions || {};
    if (!permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to access ${permission}`,
      });
    }

    next();
  };
};

// Rate limiter for admin login (stricter than regular)
import rateLimit from "express-rate-limit";

export const adminLoginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 minutes
  max: 8, // 5 attempts
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Log admin activity middleware
export const logActivity = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function (body) {
      // Only log successful actions
      if (res.statusCode >= 200 && res.statusCode < 300 && req.admin) {
        const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
        const details = `${req.method} ${req.originalUrl}`;
        
        // Log asynchronously to not block response
        // Note: SuperAdmin doesn't have logActivity yet, so let's check
        /* Activity logging logic moved to centralized service or handled via direct Prisma create */
        prisma.adminActivityLog.create({
            data: {
                admin_id: req.admin.id,
                action: action,
                details: details,
                ip: ip
            }
        }).catch(err => console.error("Activity log error:", err));
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
};
