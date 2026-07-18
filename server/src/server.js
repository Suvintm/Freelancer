import dotenv from "dotenv";
dotenv.config();

import "./infrastructure/config/env.js";
import logger from "./infrastructure/monitoring/logger.js";
import { createApp } from "./app.js";
import { connectMongo, disconnectMongo } from "./infrastructure/database/mongo.js";
import { connectPostgres } from "./infrastructure/database/postgres.js";
import prisma from "./infrastructure/database/postgres.js";
import { initSocket } from "./platform/socket/socket.gateway.js";
import { initFirebaseAdmin } from "./infrastructure/push/fcm.admin.js";
import { startLikeSyncScheduler } from "./infrastructure/queue/workers/schedulers/likeSync.scheduler.js";
import { startQuotaResetScheduler } from "./infrastructure/queue/workers/schedulers/quotaReset.scheduler.js";
import { startSubscriptionSyncScheduler } from "./infrastructure/queue/workers/schedulers/subscriptionSync.scheduler.js";
// Domain entrypoints
import { youtubeQuotaManager, bootstrapCreator } from "./domains/creator/index.js";
import { initReactionWorker } from "./domains/messaging/index.js";
import { bootstrapNotification } from "./domains/notification/index.js";

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
  } catch (err) {
    logger.error(`❌ [QUOTA] Failed to initialize: ${err.message}`);
  }
  
  bootstrapCreator();
  bootstrapNotification();

  // 4. In-Memory Workers (always active — zero Redis cost)
  initReactionWorker(10000); // Batch-flush reactions to DB every 10 seconds

  // 5. Scheduled Jobs (cron-based, zero-cost — only fires at specific times)
  //    Includes: YouTube quota reset at midnight Pacific (YouTube's actual reset time)
  startLikeSyncScheduler();
  startQuotaResetScheduler();
  startSubscriptionSyncScheduler();

  // 6. BullMQ Background Workers
  //    Controlled by ENABLE_WORKERS env var so you decide when they run.
  //    Set ENABLE_WORKERS=true in .env to activate.
  //
  //    What stops if ENABLE_WORKERS=false:
  //      - YouTube channel auto-sync (manual sync still works via API)
  //      - Async media processing pipeline (upload still works, just synchronous)
  //      - Story expiry cleanup (stories stay visible until next restart)
  //      - Search ranking recalibration (search still works, ranking stays as-is)
  //    What KEEPS working (core app is NOT affected):
  //      - Auth, login, registration
  //      - Posts, stories, feed
  //      - Payments & subscriptions
  //      - Notifications & messaging
  //      - Real-time socket events
  if (process.env.ENABLE_WORKERS === "true") {
  logger.info("🚀 [WORKERS] ENABLE_WORKERS=true — Starting BullMQ Background Workers...");
  // Load workers only when the flag is true. This prevents the module from being parsed/evaluated otherwise.
  const startWorkers = async () => {
    try {
      await import("./infrastructure/queue/workers/index.js");
      logger.info("✅ [WORKERS] Background workers module loaded");
    } catch (err) {
      logger.error(`❌ [WORKERS] Failed to start background workers: ${err.message}`);
    }
  };


  // 7. Start HTTP & WebSocket Server
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
