import axios from "axios";
import redis, { redisAvailable } from "../config/redisClient.js";
import logger from "../utils/logger.js";

// Using centralized redis client from config/redisClient.js

const OTP_TTL = 300; // 5 minutes
const MAX_ATTEMPTS = 3;
const OTP_KEY = (phone) => `otp:sms:${phone}`;
const ATTEMPT_KEY = (phone) => `otp_attempts:sms:${phone}`;
const SEND_LIMIT_KEY = (phone) => `otp_send_limit:${phone}`;

/**
 * Validate Indian mobile number
 */
export const validateIndianMobile = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9]/g, "");
  // Handle 91 prefix or 10 digit number
  const num = cleaned.length === 12 && cleaned.startsWith("91") ? cleaned.slice(2) : cleaned;
  return /^[6-9][0-9]{9}$/.test(num) ? num : null;
};

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via Fast2SMS (Free Tier support)
 */
export const sendSMSOTP = async (phone, otp) => {
  const mobile = validateIndianMobile(phone);
  if (!mobile) throw new Error("INVALID_MOBILE");

  if (!process.env.FAST2SMS_API_KEY) {
    logger.warn("⚠️ FAST2SMS_API_KEY is missing. SMS not sent.");
    return false;
  }

  try {
    logger.info(`Sending SMS OTP to ${mobile} via Fast2SMS...`);
    
    // Fast2SMS Bulk V2 API (OTP Route)
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        variables_values: otp,
        route: "otp",
        numbers: mobile,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
        },
        timeout: 10000, // 10 second timeout to prevent hanging
      }
    );

    if (response.data.return === true) {
      logger.info(`✅ SMS OTP sent successfully to ${mobile}`);
      return true;
    } else {
      logger.error(`❌ Fast2SMS Error: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    const errorDetail = error.response 
      ? `${error.response.status} - ${JSON.stringify(error.response.data)}`
      : error.message;
    logger.error(`Fast2SMS API Failed: ${errorDetail}`);
    return false;
  }
};

/**
 * Store and Send OTP with Rate Limiting
 */
export const initiateSMSOTP = async (phone, customOTP = null) => {
  const mobile = validateIndianMobile(phone);
  if (!mobile) throw new Error("INVALID_MOBILE");

  // Rate limit: Max 3 OTPs per hour per number (Only if Redis is available)
  if (redisAvailable) {
    try {
      const sendAttempts = await redis.incr(SEND_LIMIT_KEY(mobile));
      if (sendAttempts === 1) await redis.expire(SEND_LIMIT_KEY(mobile), 3600);
      
      if (sendAttempts > 3) {
        throw new Error("OTP_LIMIT_EXCEEDED");
      }
    } catch (err) {
      logger.warn(`[Redis] Rate limit failed: ${err.message}. Proceeding without limit.`);
    }
  }

  const otp = customOTP || generateOTP();
  
  // Save to Redis (Fallback/Tracking) - Only if available
  if (redisAvailable) {
    try {
      await redis.set(OTP_KEY(mobile), otp, "EX", OTP_TTL);
      await redis.del(ATTEMPT_KEY(mobile)); // Reset verification attempts
    } catch (err) {
      logger.warn(`[Redis] OTP storage failed: ${err.message}`);
    }
  }

  const sent = await sendSMSOTP(mobile, otp);
  if (!sent) throw new Error("SMS_SEND_FAILED");

  return { mobile, expiresIn: OTP_TTL, otp }; // Return OTP for consistency
};

/**
 * Verify SMS OTP
 */
export const verifySMSOTP = async (phone, enteredOTP) => {
  const mobile = validateIndianMobile(phone);
  if (!mobile) throw new Error("INVALID_MOBILE");

  // Brute force protection (Only if Redis is available)
  if (redisAvailable) {
    try {
      const attempts = await redis.incr(ATTEMPT_KEY(mobile));
      if (attempts === 1) await redis.expire(ATTEMPT_KEY(mobile), OTP_TTL);

      if (attempts > MAX_ATTEMPTS) {
        throw new Error("TOO_MANY_ATTEMPTS");
      }
    } catch (err) {
      logger.warn(`[Redis] Brute force check failed: ${err.message}`);
    }
  }

  // If Redis is offline, we can't verify SMS OTPs stored there.
  // However, the system falls back to Email which uses MongoDB.
  if (!redisAvailable) throw new Error("OTP_EXPIRED");

  const storedOTP = await redis.get(OTP_KEY(mobile));
  
  if (!storedOTP) throw new Error("OTP_EXPIRED");
  if (storedOTP !== enteredOTP) throw new Error("INVALID_OTP");

  // Success: Clean up
  await redis.del(OTP_KEY(mobile));
  await redis.del(ATTEMPT_KEY(mobile));
  
  return { verified: true, mobile };
};
