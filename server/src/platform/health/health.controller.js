import express from 'express';
import mongoose from 'mongoose';
import prisma from '../../infrastructure/database/postgres.js';

const router = express.Router();


router.get("/health", async (req, res) => {
  let postgresStatus = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    postgresStatus = "connected";
  } catch {
    // stays disconnected
  }

  res.status(200).json({
    status: "ok",
    database: {
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      postgres: postgresStatus
    }
  });
});

router.get("/maintenance-status", (req, res) => {
  res.status(200).json({
    success: true,
    maintenance: false,
    message: "System is operational"
  });
});

export const healthRouter = router;
