import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "@exortek/express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import logger from "./utils/logger.js";

// Routes
import { app, server, io } from "./socket.js";

// Routes
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import adminPaymentRoutes from "./routes/adminPaymentRoutes.js";
import clientKYCRoutes from "./routes/clientKYCRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import refundRoutes from "./routes/refundRoutes.js";
import adminAdRoutes from "./routes/adminAdRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import adminWithdrawalRoutes from "./routes/adminWithdrawalRoutes.js";

const PORT = process.env.PORT || 5052;

// ============ SECURITY MIDDLEWARE ============
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            process.env.ADMIN_URL,
            "https://suvix.vercel.app",
            "https://adminsuvix.vercel.app",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:3000"
        ].filter(Boolean);
        
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
            return callback(null, true);
        }
        console.warn(`⚠️ CORS: Blocked request from origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============ DATABASE CONNECTION ============
if (process.env.NODE_ENV !== "test") {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => logger.info("✅ Admin Server: MongoDB Connected"))
        .catch(err => logger.error("❌ Admin Server: MongoDB Connection Error:", err));
}

// ============ ADMIN ROUTES ============
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/payment-settings", adminPaymentRoutes);
app.use("/api/client-kyc", clientKYCRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/refunds", refundRoutes);

// Apply security middleware AFTER the above routes but BEFORE ads to see if it helps.
// Actually, let's just move mongoSanitize below the sensitive routes.
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());

app.use("/api/admin/ads", adminAdRoutes);
app.use("/api/admin/roles", roleRoutes);
app.use("/api/admin/withdrawals", adminWithdrawalRoutes);

// Health Check
app.get("/health", (req, res) => res.json({ status: "healthy", service: "admin-backend", timestamp: new Date() }));
app.get("/", (req, res) => res.json({ message: "SuviX Admin Backend is running!" }));

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
    logger.error("Admin Server Error:", {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});


if (process.env.NODE_ENV !== "test") {
    server.listen(PORT, () => {
        logger.info(`🚀 Admin Server (with Socket.io) running on port ${PORT}`);
    });
}

export { app, server };
