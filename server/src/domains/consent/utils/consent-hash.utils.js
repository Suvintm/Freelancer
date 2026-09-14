import crypto from 'crypto';
import { getCountryByIP, getClientIP } from '../../../shared/middleware/geo-check.middleware.js';

/**
 * SHA-256 hashing utility
 * @param {string} val
 * @returns {string} 64-character hex string
 */
export const hashString = (val) => {
  if (!val || typeof val !== 'string') return '';
  return crypto.createHash('sha256').update(val.trim()).digest('hex');
};

/**
 * Extracts ISO-2 country code with zero latency via CDN headers,
 * falling back to local GeoIP database.
 * @param {import('express').Request} req
 * @returns {string} 2-letter country code or 'UNKNOWN'
 */
export const extractClientCountry = (req) => {
  // 1. Cloudflare CDN Country Header (free, 0ms latency)
  const cfCountry = req.headers['cf-ipcountry'];
  if (cfCountry && typeof cfCountry === 'string' && cfCountry.length === 2 && cfCountry !== 'XX') {
    return cfCountry.toUpperCase();
  }

  // 2. Standard X-Country-Code header from reverse proxies / Nginx
  const proxyCountry = req.headers['x-country-code'];
  if (proxyCountry && typeof proxyCountry === 'string' && proxyCountry.length === 2) {
    return proxyCountry.toUpperCase();
  }

  // 3. Fallback to local MaxMind GeoIP reader
  const clientIp = getClientIP(req);
  if (clientIp) {
    const geoCountry = getCountryByIP(clientIp);
    if (geoCountry) return geoCountry.toUpperCase();
  }

  return 'UNKNOWN';
};

/**
 * Generates partition key string: "YYYY-MM"
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export const getYearMonth = (date = new Date()) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

/**
 * Generates privacy-safe SHA-256 hash of client IP
 * @param {import('express').Request} req
 * @returns {string}
 */
export const hashClientIp = (req) => {
  const ip = getClientIP(req) || req.ip || '127.0.0.1';
  return hashString(ip);
};

/**
 * Generates privacy-safe SHA-256 hash of User-Agent string
 * @param {import('express').Request} req
 * @returns {string}
 */
export const hashDevice = (req) => {
  const ua = req.headers['user-agent'] || 'UNKNOWN_DEVICE';
  return hashString(ua);
};
