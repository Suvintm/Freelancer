/**
 * Razorpay Configuration
 * Initializes and exports the Razorpay SDK instance
 */
import Razorpay from "razorpay";
import crypto from "crypto";

// Validate required environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn(
    "⚠️  Razorpay keys not configured. Payment features will be disabled."
  );
}

// Initialize Razorpay instance
let razorpayInstance = null;

try {
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay initialized successfully");
  }
} catch (error) {
  console.error("❌ Failed to initialize Razorpay:", error.message);
}

/**
 * Verify Razorpay webhook signature
 * @param {string} body - Raw request body
 * @param {string} signature - Razorpay signature header
 * @returns {boolean}
 */
export const verifyWebhookSignature = (body, signature) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error("❌ Webhook secret not configured");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(JSON.stringify(body))
    .digest("hex");

  return expectedSignature === signature;
};

/**
 * Verify payment signature after checkout
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Payment signature
 * @returns {boolean}
 */
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!RAZORPAY_KEY_SECRET) return false;

  const generatedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
};

/**
 * Get Razorpay public key for frontend
 */
export const getRazorpayKeyId = () => RAZORPAY_KEY_ID;

/**
 * Check if Razorpay is configured
 */
export const isRazorpayConfigured = () => !!razorpayInstance;

export default razorpayInstance;
