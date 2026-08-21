import client from 'prom-client';
import { asyncHandler } from '../../shared/middleware/error-handler.middleware.js';

/**
 * Controller to expose collected metrics to Prometheus scraper
 */
export const getMetrics = asyncHandler(async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
