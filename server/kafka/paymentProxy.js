/**
 * Payment Service Proxy — core-api (Node.js)
 *
 * This module proxies payment requests from Node.js → Java Payment Service.
 * It forwards the authenticated user's identity via custom headers.
 * The Java service does NOT know about JWT — Node handles auth, Java handles logic.
 */

import axios from 'axios';

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:8080';
const SERVICE_SECRET      = process.env.SERVICE_SECRET;

/**
 * Create internal axios instance with service-to-service headers pre-configured.
 */
const paymentServiceClient = axios.create({
  baseURL: PAYMENT_SERVICE_URL,
  timeout: 15000,  // 15s timeout for payment operations
  headers: {
    'Content-Type':    'application/json',
    'X-Service-Secret': SERVICE_SECRET,
  },
});

/**
 * Forward a request to the Java Payment Service.
 *
 * @param {Request} req   - Express request (for user info and body)
 * @param {Response} res  - Express response
 * @param {string} method - HTTP method ('get', 'post', etc.)
 * @param {string} path   - Java service endpoint path
 */
export const proxyToPaymentService = async (req, res, method, path) => {
  try {
    const config = {
      method,
      url: `/api/v1${path}`,
      headers: {
        // Forward authenticated user info — Java uses these instead of JWT
        'X-User-Id':   req.user?.id   || req.admin?.id,
        'X-User-Role': req.user?.role || 'admin',
      },
    };

    if (['post', 'put', 'patch'].includes(method)) {
      config.data = req.body;
    }
    if (method === 'get' && Object.keys(req.query).length > 0) {
      config.params = req.query;
    }

    const response = await paymentServiceClient(config);
    res.status(response.status).json(response.data);

  } catch (err) {
    const status  = err.response?.status  || 500;
    const message = err.response?.data?.message || 'Payment service unavailable';
    console.error(`[PaymentProxy] Error ${status} from Java service:`, message);
    res.status(status).json({ success: false, message });
  }
};
