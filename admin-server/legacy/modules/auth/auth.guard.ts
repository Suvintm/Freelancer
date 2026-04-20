import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { AuthPayload } from "../../types/auth.types.js";

/**
 * Protect Admin Routes
 */
export const protectAdmin = async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return ApiResponse.sendError(res, "Not authorized. No token provided.", 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;

        let admin: any;
        if (decoded.role === "superadmin") {
            admin = await prisma.superAdmin.findUnique({ where: { id: decoded.id } });
        } else {
            admin = await prisma.adminMember.findUnique({ where: { id: decoded.id } });
        }

        if (!admin) {
            return ApiResponse.sendError(res, "Identity not found.", 401);
        }

        if (!admin.is_active) {
            return ApiResponse.sendError(res, "Account deactivated.", 403);
        }

        // Single session enforcement
        if (admin.current_session_token && admin.current_session_token !== token) {
            return ApiResponse.sendError(res, "Session invalidated by another login.", 401);
        }

        req.admin = admin;
        next();
    } catch (error) {
        return ApiResponse.sendError(res, "Session expired or invalid.", 401);
    }
};

/**
 * Role-Based Access Control
 */
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.admin) {
            return ApiResponse.sendError(res, "Authentication required.", 401);
        }
        
        const adminRole = req.admin.role || req.admin.role_value || "admin";
        if (!roles.includes(adminRole)) {
            return ApiResponse.sendError(res, `Forbidden: Role '${adminRole}' lacks required permissions.`, 403);
        }
        next();
    };
};
