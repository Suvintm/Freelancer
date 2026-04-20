import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma, connectDB } from "../config/db.js";
import logger from "../utils/logger.js";

/**
 * SuperAdmin Seeding Script
 * -----------------------------------------
 * This script ensures the first System Admin exists in the database.
 * Usage: node scripts/seedAdmin.js
 */
const seedAdmin = async (): Promise<void> => {
    try {
        await connectDB();

        const email = process.env.SUPER_ADMIN_EMAIL;
        const password = process.env.SUPER_ADMIN_PASSWORD;

        if (!email || !password) {
            logger.error("❌ Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in .env");
            process.exit(1);
        }

        const existingAdmin = await prisma.superAdmin.findUnique({ where: { email } });

        if (existingAdmin) {
            logger.info("ℹ️ SuperAdmin already exists. Refreshing password...");
            const hashedPassword = await bcrypt.hash(password, 12);
            await prisma.superAdmin.update({
                where: { email },
                data: { password_hash: hashedPassword }
            });
            logger.info("✅ SuperAdmin credentials updated.");
        } else {
            logger.info("🚀 Creating initial SuperAdmin...");
            const hashedPassword = await bcrypt.hash(password, 12);
            await prisma.superAdmin.create({
                data: {
                    name: "System Director",
                    email,
                    password_hash: hashedPassword,
                    role: "superadmin",
                    is_active: true
                }
            });
            logger.info("✅ SuperAdmin created successfully.");
        }

        process.exit(0);
    } catch (error) {
        logger.error("❌ Seeding Error: " + error);
        process.exit(1);
    }
};

seedAdmin();
