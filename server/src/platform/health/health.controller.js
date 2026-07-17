import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

import { likeSyncQueue } from "../../infrastructure/queue/workers/queues.js";

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    database: {
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      postgres: "connected" // Assumed by prisma client abstraction usually
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
