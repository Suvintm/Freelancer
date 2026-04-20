import { Request, Response } from "express";
import AuthService from "./auth.service.js";
import ApiResponse from "../../utils/ApiResponse.js";
import expressAsyncHandler from "express-async-handler";

class AuthController {
    /**
     * @desc    Admin Login
     * @route   POST /api/admin/auth/login
     */
    static login = expressAsyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        if (!email || !password) {
            ApiResponse.sendError(res, "Email and password are required", 400);
            return;
        }

        const ip = (req.ip || req.headers["x-forwarded-for"] || "127.0.0.1") as string;
        const userAgent = req.headers["user-agent"];

        const { admin, token } = await AuthService.login({ email, password, ip, userAgent });

        ApiResponse.sendSuccess(res, {
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role_value || admin.role,
                permissions: admin.permissions
            },
            token
        }, "Authentication successful");
    });

    /**
     * @desc    Admin Logout
     * @route   POST /api/admin/auth/logout
     */
    static logout = expressAsyncHandler(async (req: Request, res: Response) => {
        if (!req.admin) {
             ApiResponse.sendError(res, "Not authenticated", 401);
             return;
        }
        const role = req.admin.role || req.admin.role_value || "admin";
        await AuthService.logout(req.admin.id, role);
        ApiResponse.sendSuccess(res, null, "Logout successful");
    });

    /**
     * @desc    Get Current Session Info
     * @route   GET /api/admin/auth/me
     */
    static getMe = expressAsyncHandler(async (req: Request, res: Response) => {
        if (!req.admin) {
            ApiResponse.sendError(res, "Not authenticated", 401);
            return;
        }
        const admin = req.admin;
        ApiResponse.sendSuccess(res, {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role_value || admin.role,
            permissions: admin.permissions
        });
    });
}

export default AuthController;
