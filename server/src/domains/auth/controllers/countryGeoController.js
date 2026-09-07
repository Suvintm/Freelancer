import { getClientIP, getCountryByIP } from "../../../shared/middleware/geo-check.middleware.js";
import logger from "../../../infrastructure/monitoring/logger.js";

// Comprehensive Country Metadata Lookup Map (ISO 2-letter -> details)
const COUNTRY_LOOKUP = {
  IN: { name: "India", dialCode: "+91", flag: "🇮🇳", currency: "INR" },
  US: { name: "United States", dialCode: "+1", flag: "🇺🇸", currency: "USD" },
  GB: { name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", currency: "USD" },
  CA: { name: "Canada", dialCode: "+1", flag: "🇨🇦", currency: "USD" },
  AU: { name: "Australia", dialCode: "+61", flag: "🇦🇺", currency: "USD" },
  AE: { name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪", currency: "USD" },
  SA: { name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦", currency: "USD" },
  SG: { name: "Singapore", dialCode: "+65", flag: "🇸🇬", currency: "USD" },
  DE: { name: "Germany", dialCode: "+49", flag: "🇩🇪", currency: "USD" },
  FR: { name: "France", dialCode: "+33", flag: "🇫🇷", currency: "USD" },
  NL: { name: "Netherlands", dialCode: "+31", flag: "🇳🇱", currency: "USD" },
  JP: { name: "Japan", dialCode: "+81", flag: "🇯🇵", currency: "USD" },
  KR: { name: "South Korea", dialCode: "+82", flag: "🇰🇷", currency: "USD" },
  BR: { name: "Brazil", dialCode: "+55", flag: "🇧🇷", currency: "USD" },
  MX: { name: "Mexico", dialCode: "+52", flag: "🇲🇽", currency: "USD" },
  ZA: { name: "South Africa", dialCode: "+27", flag: "🇿🇦", currency: "USD" },
  NG: { name: "Nigeria", dialCode: "+234", flag: "🇳🇬", currency: "USD" },
  KE: { name: "Kenya", dialCode: "+254", flag: "🇰🇪", currency: "USD" },
  PH: { name: "Philippines", dialCode: "+63", flag: "🇵🇭", currency: "USD" },
  ID: { name: "Indonesia", dialCode: "+62", flag: "🇮🇩", currency: "USD" },
  MY: { name: "Malaysia", dialCode: "+60", flag: "🇲🇾", currency: "USD" },
  NZ: { name: "New Zealand", dialCode: "+64", flag: "🇳🇿", currency: "USD" },
  IE: { name: "Ireland", dialCode: "+353", flag: "🇮🇪", currency: "USD" },
  ES: { name: "Spain", dialCode: "+34", flag: "🇪🇸", currency: "USD" },
  IT: { name: "Italy", dialCode: "+39", flag: "🇮🇹", currency: "USD" },
  SE: { name: "Sweden", dialCode: "+46", flag: "🇸🇪", currency: "USD" },
  CH: { name: "Switzerland", dialCode: "+41", flag: "🇨🇭", currency: "USD" },
  NO: { name: "Norway", dialCode: "+47", flag: "🇳🇴", currency: "USD" },
  DK: { name: "Denmark", dialCode: "+45", flag: "🇩🇰", currency: "USD" },
  PK: { name: "Pakistan", dialCode: "+92", flag: "🇵🇰", currency: "USD" },
  BD: { name: "Bangladesh", dialCode: "+880", flag: "🇧🇩", currency: "USD" },
  LK: { name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰", currency: "USD" },
  NP: { name: "Nepal", dialCode: "+977", flag: "NP", currency: "USD" },
  QA: { name: "Qatar", dialCode: "+974", flag: "🇶🇦", currency: "USD" },
  KW: { name: "Kuwait", dialCode: "+965", flag: "🇰🇼", currency: "USD" },
  OM: { name: "Oman", dialCode: "+968", flag: "🇴🇲", currency: "USD" },
  BH: { name: "Bahrain", dialCode: "+973", flag: "🇧🇭", currency: "USD" },
  VN: { name: "Vietnam", dialCode: "+84", flag: "🇻🇳", currency: "USD" },
  TH: { name: "Thailand", dialCode: "+66", flag: "🇹🇭", currency: "USD" },
  EG: { name: "Egypt", dialCode: "+20", flag: "🇪🇬", currency: "USD" },
  TR: { name: "Turkey", dialCode: "+90", flag: "🇹🇷", currency: "USD" },
  IL: { name: "Israel", dialCode: "+972", flag: "🇮🇱", currency: "USD" },
  PL: { name: "Poland", dialCode: "+48", flag: "🇵🇱", currency: "USD" },
  BE: { name: "Belgium", dialCode: "+32", flag: "🇧🇪", currency: "USD" },
  AT: { name: "Austria", dialCode: "+43", flag: "🇦🇹", currency: "USD" },
  PT: { name: "Portugal", dialCode: "+351", flag: "🇵🇹", currency: "USD" },
  GR: { name: "Greece", dialCode: "+30", flag: "🇬🇷", currency: "USD" },
  CZ: { name: "Czech Republic", dialCode: "+420", flag: "🇨🇿", currency: "USD" },
  HU: { name: "Hungary", dialCode: "+36", flag: "🇭🇺", currency: "USD" },
  RO: { name: "Romania", dialCode: "+40", flag: "🇷🇴", currency: "USD" },
  CO: { name: "Colombia", dialCode: "+57", flag: "🇨🇴", currency: "USD" },
  AR: { name: "Argentina", dialCode: "+54", flag: "🇦🇷", currency: "USD" },
  CL: { name: "Chile", dialCode: "+56", flag: "🇨🇱", currency: "USD" },
  PE: { name: "Peru", dialCode: "+51", flag: "🇵🇪", currency: "USD" },
};

/**
 * Generate Unicode Flag Emoji from 2-letter ISO country code
 */
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * GET /api/v1/auth/detect-country
 * Enterprise zero-cost auto country detection
 */
export const detectCountry = async (req, res) => {
  try {
    // 1. Check Cloudflare Edge header (100% free, 0ms latency overhead)
    let countryCode = (req.headers["cf-ipcountry"] || req.headers["x-country-code"] || "").toUpperCase().trim();
    let source = "cloudflare_edge";

    // Handle Cloudflare special codes: T1 (Tor), XX (Unknown)
    if (countryCode === "XX" || countryCode === "T1" || countryCode.length !== 2) {
      countryCode = null;
    }

    const clientIp = getClientIP(req);

    // 2. If Cloudflare header is missing, resolve client IP via MaxMind GeoLite2
    if (!countryCode && clientIp) {
      const geoIpCountry = getCountryByIP(clientIp);
      if (geoIpCountry) {
        countryCode = geoIpCountry;
        source = "maxmind_geolite2";
      }
    }

    // 3. Fallback if still unresolved (default to IN)
    if (!countryCode) {
      source = "fallback";
      countryCode = "IN";
    }

    // Lookup metadata or generate defaults
    const meta = COUNTRY_LOOKUP[countryCode] || {
      name: countryCode,
      dialCode: "+1",
      flag: getFlagEmoji(countryCode),
      currency: countryCode === "IN" ? "INR" : "USD",
    };

    return res.status(200).json({
      success: true,
      countryCode,
      countryName: meta.name,
      dialCode: meta.dialCode,
      flag: meta.flag || getFlagEmoji(countryCode),
      currency: meta.currency,
      clientIp: process.env.NODE_ENV === "development" ? clientIp : undefined,
      source,
    });
  } catch (error) {
    logger.error("Country detection error:", error);
    return res.status(200).json({
      success: true,
      countryCode: "IN",
      countryName: "India",
      dialCode: "+91",
      flag: "🇮🇳",
      currency: "INR",
      source: "error_fallback",
    });
  }
};
