import logger from "../monitoring/logger.js";

/**
 * Validates critical environment variables before the server boots.
 * If any required variable is missing, it will log a clear error and terminate the process.
 */
export const validateEnv = () => {
  // ✅ Skip strict validation in test environments (CI/CD has no .env file)
  if (process.env.NODE_ENV === "test") {
    logger.info("[CONFIG] Test mode detected — skipping strict env validation.");
    return;
  }

  const requiredVariables = [
    "PORT",
    "DATABASE_URL",
    "MONGO_URI",
    "REDIS_URL",
    "JWT_SECRET",
    "FRONTEND_URL"
  ];

  const missingVariables = requiredVariables.filter((key) => !process.env[key]);

  if (missingVariables.length > 0) {
    logger.error(`[CONFIG ERROR] Missing Required Environment Variables: ${missingVariables.join(", ")}`);
    console.error(`\n❌ CRITICAL: The server cannot boot because the following required .env variables are missing:\n   👉 ${missingVariables.join(", ")}\n`);
    process.exit(1);
  }

  // Set default fallbacks for optional variables
  process.env.NODE_ENV = process.env.NODE_ENV || "development";
  process.env.PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "RAZORPAY";

  logger.info("✅ Environment variables validated successfully.");
};
