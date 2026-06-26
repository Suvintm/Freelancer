/**
 * shared/kernel/errors.js
 * Single source of truth for all application-level errors.
 * Replaces the scattered ApiError defined in middleware/errorHandler.js
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, meta = {}) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.meta = meta;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Not authorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

export class PaymentError extends AppError {
  constructor(message = 'Payment failed', meta = {}) {
    super(message, 402, true, meta);
  }
}

// Backward compat alias — existing code imports ApiError with (statusCode, message) signature
export class ApiError extends AppError {
  constructor(statusCode, message, isOperational = true, meta = {}) {
    super(message, statusCode, isOperational, meta);
  }
}

