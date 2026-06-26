import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "suvix_dev_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "suvix_refresh_secret";
const REDIS_SECRET = process.env.REDIS_SECRET || JWT_SECRET;

// Access token: Short-lived (15 minutes) for security
const ACCESS_TOKEN_EXPIRES = "15m";
// Refresh token: Long-lived (30 days) for multi-account session persistence
const REFRESH_TOKEN_EXPIRES = "30d";

// Redis TTL constants (seconds) — exported for use in controllers
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 min in ms (for client-side expiry tracking)
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * PRODUCTION-GRADE SECURITY: Token Hashing
 * Prevents raw refresh tokens from being stored as keys.
 */
export const hashToken = (token) => {
    return crypto.createHmac("sha256", REDIS_SECRET).update(token).digest("hex");
};

/**
 * Generates a short-lived Access Token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
};

/**
 * Generates a long-lived Refresh Token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
};

/**
 * Verifies an Access Token
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Verifies a Refresh Token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};
