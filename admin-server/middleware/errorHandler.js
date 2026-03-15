import logger from "../utils/logger.js";

// Custom error class for API errors
export class ApiError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        Error.captureStackTrace(this, this.constructor);
    }
}

// 404 Not Found handler
export const notFoundHandler = (req, res, next) => {
    const error = new ApiError(404, `Route ${req.originalUrl} not found`);
    next(error);
};

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
    console.trace("ERROR_TRACE:", err);
    let { statusCode, message } = err;

    // Default to 500 if no status code
    statusCode = statusCode || 500;

    // ── MongoDB duplicate key error (e.g. email already exists) ──
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || "field";
        message = `An account with this ${field} already exists.`;
    }

    // ── Mongoose validation error ──
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors).map((e) => e.message).join(", ");
    }

    // ── JWT errors ──
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token. Please log in again.";
    }
    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Your session has expired. Please log in again.";
    }

    // Log error details (but don't expose to client)
    logger.error(`[ErrorHandler] Sending status ${statusCode} for error: ${message}`);
    
    logger.error({
        message: err.message,
        stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user?._id || req.user?.id || "anonymous",
    });

    // In production, don't leak internal error details for unhandled errors
    if (process.env.NODE_ENV === "production" && !err.isOperational && !err.code && err.name !== "ValidationError") {
        message = "Something went wrong. Please try again later.";
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

// Async handler wrapper to catch errors in async routes
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
