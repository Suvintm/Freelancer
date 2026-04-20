import "dotenv/config";
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import mongoose from "mongoose";
import logger from "../utils/logger.js";

// 1. PostgreSQL (Prisma 7 with Adapter)
const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    logger.error('❌ [Admin Server] PostgreSQL Pool Error: ' + err.message);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const connectDB = async (): Promise<void> => {
    try {
        // Test PostgreSQL Connectivity
        await pool.query('SELECT 1');
        logger.info("✅ Admin Server: PostgreSQL (Prisma 7 via Adapter) Connected");

        // 2. MongoDB (Mongoose)
        if (process.env.MONGO_URI) {
            await mongoose.connect(process.env.MONGO_URI);
            logger.info("✅ Admin Server: MongoDB (Mongoose) Connected");
        } else {
            logger.warn("⚠️ Admin Server: MONGO_URI not found");
        }
    } catch (error) {
        logger.error("❌ Admin Server: Database Connection Failure: " + error);
        process.exit(1);
    }
};

export { prisma, connectDB };
export default prisma;
