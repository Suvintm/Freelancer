import axios from "axios";
import { getClientIP } from "./geo-check.middleware.js";
import logger from "../../infrastructure/monitoring/logger.js";
import redis from "../../infrastructure/cache/redis.client.js";

const CACHE_TTL = 3600; // Cache IP results for 1 hour
const CACHE_PREFIX = "vpn_check:";

/**
 * Detect if an IP is a malicious proxy
 */
const detectVPN = async (ip, req) => {
  // If Cloudflare already verified the country as India or US, allow immediately
  const cfCountry = req?.headers?.["cf-ipcountry"]?.toUpperCase();
  if (cfCountry === "IN" || cfCountry === "US") {
    return { isVPN: false, countryCode: cfCountry };
  }

  const cacheKey = `${CACHE_PREFIX}${ip}`;

  try {
    // 1. Check Redis Cache
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    // 2. Call ip-api (Free: 45 requests per minute)
    const url = `http://ip-api.com/json/${ip}?fields=status,message,countryCode,proxy,hosting,mobile,query`;
    const response = await axios.get(url, { timeout: 3000 });

    if (response.data.status !== "success") {
      return { isVPN: false, error: true };
    }

    const { proxy, countryCode } = response.data;

    // Only block if explicitly flagged as an active malicious proxy
    const isVPN = proxy === true;

    const result = {
      ip,
      countryCode: cfCountry || countryCode,
      isVPN,
      timestamp: Date.now(),
    };

    // 3. Cache the result
    await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
    
    return result;
  } catch (error) {
    logger.debug(`VPN Detection API bypassed for IP ${ip}: ${error.message}`);
    return { isVPN: false, error: true }; // Fail open: never block genuine users on lookup error
  }
};

/**
 * Middleware to protect authentication endpoints (Toggleable via ENABLE_VPN_CHECK)
 */
export const vpnCheckMiddleware = async (req, res, next) => {
  // Feature toggle: Disabled by default to prevent blocking legitimate users
  if (process.env.ENABLE_VPN_CHECK !== "true") {
    return next();
  }

  const ip = getClientIP(req);

  // Skip for local development (IPv4 and IPv6 localhost)
  if (
    !ip ||
    ip === "127.0.0.1" || 
    ip === "::1" || 
    ip.startsWith("192.168.") || 
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    return next();
  }

  const result = await detectVPN(ip, req);

  // If malicious proxy explicitly detected, block access
  if (result.isVPN) {
    logger.warn(`🚫 Malicious Proxy Blocked: IP ${ip} (Country: ${result.countryCode})`);
    return res.status(403).json({
      success: false,
      error: "ACCESS_DENIED",
      message: "Access restricted. Please disable VPN or proxy and try again.",
    });
  }

  next();
};
