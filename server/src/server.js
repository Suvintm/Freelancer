import dotenv from "dotenv";
dotenv.config();

import "../config/env.js";
import logger from "./infrastructure/monitoring/logger.js";
import { createApp } from "./app.js";
import { connectMongo, disconnectMongo } from "./infrastructure/database/mongo.js";
import { connectPostgres } from "./infrastructure/database/postgres.js";
import prisma from "./infrastructure/database/postgres.js";
import { initSocket } from "./platform/socket/socket.gateway.js";
import { initFirebaseAdmin } from "./infrastructure/push/fcm.admin.js";

// Domain entrypoints
import { youtubeQuotaManager } from "./domains/creator/index.js";
import { initReactionWorker } from "./domains/content/index.js";

const PORT = process.env.PORT || 5000;

const { app, server } = createApp();

const startServer = async () => {
  // Validate required environment variables
  if (process.env.NODE_ENV !== "test") {
    const requiredEnvVars = [
      "MONGO_URI", "JWT_SECRET", "CLOUDINARY_CLOUD_NAME", 
      "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"
    ];
    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
      logger.error(`❌ [STARTUP] Missing required environment variables: ${missingEnvVars.join(", ")}`);
      process.exit(1);
    }
  }

  // 1. Connect Databases
  const mongoConnected = await connectMongo();
  if (!mongoConnected) process.exit(1);
  await connectPostgres();

  // 2. Initialize Platform Services
  initFirebaseAdmin();

  // 3. Initialize Domain Background Services
  try {
    await youtubeQuotaManager.initializeQuota();
    // scheduleQuotaMaintenance(); // Move this to cron.scheduler.js later
  } catch (err) {
    logger.error(`❌ [QUOTA] Failed to initialize: ${err.message}`);
  }

  initReactionWorker(10000); // Flush every 10 seconds

  if (process.env.NODE_ENV !== "production") {
    // import("./infrastructure/queue/workers/index.js"); // To be wired up
  } else {
    logger.warn("⚠️ [WORKER] Background workers disabled in production to preserve Redis quota.");
  }

  // 4. Start HTTP & WebSocket Server
  initSocket(server);

  server.listen(PORT, "0.0.0.0", () => {
    logger.info(`✅ Modular Monolith Server running on port ${PORT} (reachable at http://0.0.0.0:${PORT})`);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    logger.info(`\n[${signal}] Received. Closing connections...`);
    server.close(() => logger.info("HTTP server closed."));
    await disconnectMongo();
    if (prisma) await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

// ─── GLOBAL ERROR HANDLERS (Safety Net) ───────────────────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
  logger.error("🚨 [UNHANDLED REJECTION] at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("🔥 [UNCAUGHT EXCEPTION]:", error.message);
  logger.error(error.stack);
  process.exit(1);
});

if (process.env.NODE_ENV !== "test") startServer();

export { startServer, app, server };
