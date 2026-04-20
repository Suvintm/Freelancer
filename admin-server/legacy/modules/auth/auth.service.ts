import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/db.js";
import AuditLog from "../../models/AuditLog.model.js";
import { AuthPayload } from "../../types/auth.types.js";

interface LoginParams {
    email: string;
    password: string;
    ip: string;
    userAgent?: string;
}

class AuthService {
    /**
     * Generate JWT
     */
    static generateToken(payload: AuthPayload): string {
        return jwt.sign(payload, process.env.JWT_SECRET as string, {
            expiresIn: "12h"
        });
    }

    /**
     * Handle Admin Login
     */
    static async login({ email, password, ip, userAgent }: LoginParams) {
        // 1. Resolve Identity (SuperAdmin vs AdminMember)
        let admin: any = await prisma.superAdmin.findUnique({ where: { email } });
        let isSuperAdmin = !!admin;

        if (!admin) {
            admin = await prisma.adminMember.findUnique({ 
                where: { email },
                include: { role: true }
            });
        }

        if (!admin) {
            throw new Error("Invalid credentials");
        }

        // 2. Validate Status
        if (!admin.is_active) {
            throw new Error("Account is currently inactive. Please contact support.");
        }

        // 3. Verify Password
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            // Increment failed attempts for security tracking
            if (!isSuperAdmin) {
                await prisma.adminMember.update({
                    where: { id: admin.id },
                    data: { login_attempts: { increment: 1 } }
                });
            }
            throw new Error("Invalid credentials");
        }

        // 4. Finalize Session
        const role = isSuperAdmin ? "superadmin" : (admin.role_value || "admin");
        const token = this.generateToken({
            id: admin.id,
            email: admin.email,
            role,
            permissions: admin.permissions || (isSuperAdmin ? { all: true } : {})
        });

        // 5. Update DB State
        const updateData: any = {
            last_login: new Date(),
            last_login_ip: ip,
            current_session_token: token,
            login_attempts: 0 // Reset attempts
        };

        if (isSuperAdmin) {
            await prisma.superAdmin.update({ where: { id: admin.id }, data: updateData });
        } else {
            await prisma.adminMember.update({ where: { id: admin.id }, data: updateData });
        }

        // 6. Audit Log (MongoDB)
        await AuditLog.create({
            adminId: admin.id,
            email: admin.email,
            action: "LOGIN",
            module: "AUTH",
            details: { role },
            ip,
            userAgent
        });

        return { admin, token };
    }

    /**
     * Invalidate Session
     */
    static async logout(adminId: string, role: string): Promise<void> {
        if (role === "superadmin") {
            await prisma.superAdmin.update({ where: { id: adminId }, data: { current_session_token: null } });
        } else {
            await prisma.adminMember.update({ where: { id: adminId }, data: { current_session_token: null } });
        }
    }
}

export default AuthService;
