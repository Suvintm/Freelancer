/**
 * Invoice Gateway Routes (Node.js Gateway Proxy)
 * All invoice history and PDF downloads are routed to Java Payment Microservice (Port 8080)
 */

import express from "express";
import protect from "../../shared/middleware/auth.middleware.js";
import { proxyToPaymentService, paymentServiceClient } from "../../infrastructure/gateway/javaPayment.client.js";
import { publicApiLimiter } from "../../shared/middleware/rate-limiter.middleware.js";

const router = express.Router();

// Require authentication for all invoice operations
router.use(protect);

/**
 * GET /api/v1/invoices -> Java Payment Service /api/v1/invoices
 */
router.get("/", publicApiLimiter, (req, res) =>
  proxyToPaymentService(req, res, "get", "/invoices")
);

/**
 * GET /api/v1/invoices/:id -> Java Payment Service /api/v1/invoices/:id
 */
router.get("/:id", publicApiLimiter, (req, res) =>
  proxyToPaymentService(req, res, "get", `/invoices/${req.params.id}`)
);

/**
 * GET /api/v1/invoices/:id/pdf -> Stream binary PDF from Java Payment Service
 */
router.get("/:id/pdf", publicApiLimiter, async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.user?._id || req.user?.id || 'anonymous';
    const invoiceId = req.params.id;

    const response = await paymentServiceClient.get(`/api/v1/invoices/${invoiceId}/pdf`, {
      responseType: 'stream',
      headers: {
        'X-User-Id': userId,
        'X-Request-Id': req.headers['x-request-id'] || `req_pdf_${Date.now()}`,
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoiceId}.pdf"`);
    if (response.headers?.['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    if (typeof response.data?.pipe === 'function') {
      response.data.pipe(res);
    } else {
      res.send(response.data);
    }
  } catch (err) {
    console.error('[InvoiceRoutes] Failed to stream invoice PDF:', err.message);
    const status = err.response?.status || 500;
    return res.status(status).json({
      success: false,
      error: 'INVOICE_PDF_ERROR',
      message: 'Unable to retrieve invoice PDF. Please try again later.',
    });
  }
});

export default router;
