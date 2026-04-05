import "dotenv/config";
import pg from 'pg';

import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import logger from "../utils/logger.js";

// Use the standard PostgreSQL pool
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
});

// Configure Prisma to use the Driver Adapter (Fixes Prisma 7 engine errors)
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const connectPostgres = async () => {
  try {
    // With adapters, we just test the pool connectivity
    await pool.query('SELECT 1');
    logger.info("[PostgreSQL] Connected to Neon DB via Adapter ✅");
    return true;
  } catch (error) {
    logger.error("[PostgreSQL] Connection failed:", error.message);
    return false;
  }
};

export default prisma;
