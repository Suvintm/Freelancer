import express, { Router, Request, Response } from "express";
import authRoutes from "./auth/auth.routes.js";

const router: Router = express.Router();

/**
 * Modular Route Aggregator
 * All domain-specific modules are registered here.
 */

// 1. Auth & Identity Module
router.use("/auth", authRoutes);

// 2. Health Check
router.get("/health", (req: Request, res: Response) => {
    res.json({
        success: true,
        status: "operational",
        uptime: process.uptime(),
        timestamp: new Date()
    });
});

export default router;
