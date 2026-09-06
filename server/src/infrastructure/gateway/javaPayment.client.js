import http from 'http';
import https from 'https';
import crypto from 'crypto';
import axios from 'axios';

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:8080';
const SERVICE_SECRET      = process.env.SERVICE_SECRET;

// High-performance connection pooling agents to eliminate TCP handshakes (<1ms hop)
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 10000,
  keepAliveMsecs: 1000,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 10000,
  keepAliveMsecs: 1000,
});

/**
 * Internal axios instance with keep-alive socket pooling and auth headers
 */
export const paymentServiceClient = axios.create({
  baseURL: PAYMENT_SERVICE_URL,
  timeout: 15000,  // 15s timeout for payment operations
  httpAgent,
  httpsAgent,
  headers: {
    'Content-Type':    'application/json',
    'X-Service-Secret': SERVICE_SECRET,
  },
});

/**
 * Low-level caller returning response data directly (usable by cache middleware & circuit breakers)
 */
export const callPaymentService = async ({ method, path, data, params, headers = {} }) => {
  const requestId = headers['x-request-id'] || headers['X-Request-Id'] || crypto.randomUUID();
  
  const config = {
    method,
    url: `/api/v1${path}`,
    headers: {
      ...headers,
      'X-Request-Id': requestId,
    },
  };

  if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
    config.data = data;
  }
  if (params && Object.keys(params).length > 0) {
    config.params = params;
  }

  const response = await paymentServiceClient(config);
  return response.data;
};

/**
 * Forward an Express HTTP request to the Java Payment Service.
 *
 * @param {Request} req   - Express request (for user info and body)
 * @param {Response} res  - Express response
 * @param {string} method - HTTP method ('get', 'post', etc.)
 * @param {string} path   - Java service endpoint path
 */
export const proxyToPaymentService = async (req, res, method, path) => {
  try {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    const idempotencyKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];

    const headers = {
      // Forward authenticated user info — Java uses these instead of JWT
      'X-User-Id':    req.headers['x-user-id'] || req.user?._id || req.user?.id || req.user?.userId || req.body?.userId || req.query?.userId || req.admin?._id || req.admin?.id || 'anonymous',
      'X-User-Role':  req.headers['x-user-role'] || req.user?.role || req.body?.targetRole || 'creator',
      'X-Request-Id': requestId,
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    };

    const data = await callPaymentService({
      method,
      path,
      data: req.body,
      params: req.query,
      headers,
    });

    res.setHeader('X-Request-Id', requestId);
    return res.status(200).json(data);

  } catch (err) {
    const status  = err.response?.status || (err.code === 'ECONNREFUSED' ? 503 : 500);
    const message = err.response?.data?.message || (err.code === 'ECONNREFUSED'
      ? 'Payment service is temporarily offline or undergoing maintenance. Please try again in a few moments.'
      : 'Failed to process payment request.');

    console.error(`[PaymentProxy] Error ${status} (${err.code || 'HTTP_ERR'}):`, message);
    return res.status(status).json({
      success: false,
      error: err.code === 'ECONNREFUSED' ? 'PAYMENT_SERVICE_UNAVAILABLE' : 'PAYMENT_GATEWAY_ERROR',
      message,
    });
  }
};
