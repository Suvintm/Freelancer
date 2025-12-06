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
    let { statusCode, message } = err;

    // Default to 500 if no status code
    statusCode = statusCode || 500;

    // Log error details (but don't expose to client)
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user?.id || "anonymous",
    });

    // In production, don't leak error details
    if (process.env.NODE_ENV === "production" && !err.isOperational) {
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
