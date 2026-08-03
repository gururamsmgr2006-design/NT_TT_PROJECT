// ============================================================
// middleware/errorHandler.js — Centralized Error Handler
// Catches all errors passed via next(error) in controllers
// Returns consistent JSON error responses
// ============================================================

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose CastError (invalid ObjectId) ─────────────────
  // e.g. GET /api/jobs/not-a-valid-id
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── Mongoose Duplicate Key (unique field violation) ────────
  // e.g. registering with an email already in use
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `An account with that ${field} already exists.`;
  }

  // ── Mongoose Validation Errors ────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('. ');
  }

  // ── JWT Errors ────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  // ── CORS Error ────────────────────────────────────────────
  if (err.message && err.message.startsWith('CORS blocked')) {
    statusCode = 403;
    message = err.message;
  }

  // Log full error in development only (never expose stack in production)
  if (process.env.NODE_ENV === 'development') {
    console.error('💥 Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
