import maxmind from "maxmind";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../../infrastructure/monitoring/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let geoReader;

// Load MaxMind DB
const loadGeoIP = async () => {
  try {
    const dbPath = path.join(__dirname, "../geoip/GeoLite2-Country.mmdb");
    geoReader = await maxmind.open(dbPath);
    logger.info("✅ GeoIP Database loaded successfully");
  } catch (error) {
    logger.warn("⚠️ GeoIP Database not found at startup. Ensure MAXMIND_LICENSE_KEY is set and build script ran.");
  }
};

loadGeoIP();

/**
 * Get real client IP address correctly across Cloudflare, Nginx Gateway, and Render
 */
export const getClientIP = (req) => {
  // 1. Cloudflare True Client IP
  if (req.headers["cf-connecting-ip"]) {
    return req.headers["cf-connecting-ip"].trim();
  }

  // 2. Direct X-Real-IP set by authoritative Nginx Gateway
  if (req.headers["x-real-ip"]) {
    return req.headers["x-real-ip"].trim();
  }

  // 3. First IP in X-Forwarded-For (Client Origin)
  if (req.headers["x-forwarded-for"]) {
    const ips = req.headers["x-forwarded-for"].split(",").map(ip => ip.trim());
    // Filter out private and gateway IPs to find the true origin
    for (const ip of ips) {
      if (
        ip &&
        ip !== "127.0.0.1" &&
        ip !== "::1" &&
        !ip.startsWith("10.") &&
        !ip.startsWith("192.168.") &&
        !ip.startsWith("172.")
      ) {
        return ip;
      }
    }
    if (ips[0]) return ips[0];
  }

  const rawIp = req.socket.remoteAddress || req.ip || "127.0.0.1";
  if (rawIp === "::1") return "127.0.0.1";
  if (rawIp.startsWith("::ffff:")) return rawIp.substring(7);
  return rawIp;
};

/**
 * Middleware to block requests from outside allowed countries (Toggleable via ENABLE_GEO_CHECK)
 */
export const geoCheckMiddleware = async (req, res, next) => {
  // Feature toggle: Disabled by default to prevent blocking legitimate users
  if (process.env.ENABLE_GEO_CHECK !== "true") {
    return next();
  }

  // Bypass if DB is not loaded (prevents app crash if file is missing)
  if (!geoReader) {
    logger.warn("⚠️ Skipping GeoIP check: Database not found");
    return next();
  }

  const ip = getClientIP(req);

  // Skip check for private IP ranges during development/testing
  if (
    ip === "127.0.0.1" || 
    ip.startsWith("192.168.") || 
    ip.startsWith("10.") || 
    ip.startsWith("172.16.") || 
    ip.startsWith("172.31.")
  ) {
    return next();
  }

  try {
    const lookup = geoReader.get(ip);
    const country = lookup?.country?.iso_code;

    // Allow India (IN) and United States (US)
    const allowedCountries = ["IN", "US"];

    if (!country || !allowedCountries.includes(country)) {
      logger.warn(`🚫 Access denied for IP ${ip} (Country: ${country || "Unknown"})`);
      return res.status(403).json({
        success: false,
        error: "REGION_BLOCKED",
        message: "SuviX is currently available in India and US only.",
      });
    }

    req.userCountry = country;
    next();
  } catch (error) {
    logger.error("GeoIP Lookup Error:", error.message);
    next();
  }
};
