import maxmind from "maxmind";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";

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
 * Get client IP address correctly, considering reverse proxies like Cloudflare
 */
export const getClientIP = (req) => {
  const ip =
    req.headers["cf-connecting-ip"] || // Cloudflare
    req.headers["x-forwarded-for"]?.split(",")[0].trim() || // Standard proxy
    req.socket.remoteAddress;

  // Handle local development IPv6 notation
  if (ip === "::1" || ip === "::ffff:127.0.0.1") return "127.0.0.1";
  return ip;
};

/**
 * Middleware to block requests from outside India
 */
export const geoCheckMiddleware = async (req, res, next) => {
  // Bypass if DB is not loaded (prevents app crash if file is missing)
  if (!geoReader) {
    logger.warn("⚠️ Skipping GeoIP check: Database not found");
    return next();
  }

  const ip = getClientIP(req);

  // Skip check for localhost during development
  if (ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return next();
  }

  try {
    const lookup = geoReader.get(ip);
    const country = lookup?.country?.iso_code;

    if (country !== "IN") {
      logger.warn(`🚫 Access denied for IP ${ip} (Country: ${country || "Unknown"})`);
      return res.status(403).json({
        success: false,
        error: "REGION_BLOCKED",
        message: "SuviX is currently available in India only.",
      });
    }

    req.userCountry = country;
    next();
  } catch (error) {
    logger.error("GeoIP Lookup Error:", error.message);
    next();
  }
};
