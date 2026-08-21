import client from 'prom-client';
import logger from '../../infrastructure/monitoring/logger.js';

// Enable default metrics collection (CPU, Memory, GC, etc.)
client.collectDefaultMetrics({ register: client.register });

// Custom metrics for HTTP request duration and count
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 3, 5]
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

/**
 * Middleware to track HTTP request metrics
 */
export const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;

    // Get matched route name, fallback to original path if not found
    const route = req.route ? req.route.path : req.path;

    // Skip tracking the /metrics endpoint itself to prevent data pollution
    if (req.originalUrl === '/metrics') return;

    httpRequestDurationMicroseconds.labels(req.method, route, res.statusCode).observe(durationInSeconds);
    httpRequestsTotal.labels(req.method, route, res.statusCode).inc();
  });

  next();
};
