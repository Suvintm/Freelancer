import axios from "axios";
import { getClientIP } from "./geoCheck.js";
import logger from "../utils/logger.js";
import redis from "../config/redisClient.js";

// Using centralized redis client from config/redisClient.js

const CACHE_TTL = 3600; // Cache IP results for 1 hour
const CACHE_PREFIX = "vpn_check:";

/**
 * Detect if an IP is a VPN, Proxy, or Datacenter IP
 */
const detectVPN = async (ip) => {
  const cacheKey = `${CACHE_PREFIX}${ip}`;

  try {
    // 1. Check Redis Cache
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    // 2. Call ip-api (Free: 45 requests per minute)
    logger.info(`🔍 Checking VPN status for IP: ${ip} via ip-api.com`);
    const url = `http://ip-api.com/json/${ip}?fields=status,message,countryCode,proxy,hosting,mobile,query`;
    const response = await axios.get(url, { timeout: 4000 });

    if (response.data.status !== "success") {
      logger.error(`❌ ip-api error for IP ${ip}: ${response.data.message}`);
      return { isVPN: false, error: true };
    }

    const { proxy, hosting, countryCode } = response.data;

    // Detect VPN if it's a proxy, datacenter (hosting), or NOT in Allowed Countries
    const allowedCountries = ["IN", "US"];
    const isVPN = proxy === true || hosting === true || !allowedCountries.includes(countryCode);

    const result = {
      ip,
      countryCode,
      isVPN,
      isAllowedCountry: allowedCountries.includes(countryCode),
      isHosting: hosting === true,
      timestamp: Date.now(),
    };

    // 3. Cache the result
    await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
    
    return result;
  } catch (error) {
    logger.error(`VPN Detection API Failed for IP ${ip}:`, error.message);
    return { isVPN: false, error: true }; // Allow access on failure (fail open)
  }
};

/**
 * Middleware to block VPN/Proxy users
 */
export const vpnCheckMiddleware = async (req, res, next) => {
  const ip = getClientIP(req);

  // Skip for local development (IPv4 and IPv6 localhost)
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return next();
  }

  const result = await detectVPN(ip);

  // If VPN/Proxy detected, block access
  if (result.isVPN) {
    logger.warn(`🚫 VPN/Restricted Access: Blocked IP ${ip} (Country: ${result.countryCode}, Hosting: ${result.isHosting})`);
    return res.status(403).json({
      success: false,
      error: "ACCESS_DENIED",
      message: "Access restricted. Please disable VPN or ensure you are in an allowed region.",
    });
  }

  next();
};
