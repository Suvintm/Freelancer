import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { expressMongoSanitize as mongoSanitize } from "@exortek/express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import logger from "./utils/logger.js";
import { connectDB } from "./config/db.js";
import { app, server } from "./socket.js"; // Standard .js import because it might be untyped or external
import modularRoutes from "./modules/index.js";
import ApiResponse from "./utils/ApiResponse.js";

const PORT = process.env.PORT || 5052;

// ============ DATABASE CONNECTION ============
if (process.env.NODE_ENV !== "test") {
    connectDB();
}

// ============ MIDDLEWARE & SECURITY ============
app.use(helmet());
app.use(cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            process.env.ADMIN_URL,
            "https://suvix.in",
            "https://admin.suvix.in",
            "https://admin-api.suvix.in",
            "https://suvix.vercel.app",
            "https://adminsuvix.vercel.app",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:3000"
        ].filter(Boolean) as string[];
        
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.endsWith(".suvix.in")) {
            return callback(null, true);
        }
        console.warn(`⚠️ CORS: Blocked request from origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());

// ============ MODULAR ROUTES ============
app.use("/api/admin", modularRoutes);

app.get("/", (req: Request, res: Response) => {
    res.json({ message: "SuviX Admin Backend: Production API (TypeScript Modular) is active!" });
});

// ============ ERROR HANDLING ============
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error("Admin Server Exception: " + err.message, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });

    ApiResponse.sendError(
        res,
        err.message || "Internal Server Error",
        err.statusCode || 500,
        process.env.NODE_ENV === "development" ? [err.stack] : []
    );
});

// ============ SERVER LIFECYCLE ============
if (process.env.NODE_ENV !== "test") {
    server.listen(PORT, () => {
        logger.info(`🚀 Admin Server (TypeScript) running on port ${PORT}`);
    });
}

export { app, server };