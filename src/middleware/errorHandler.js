const AppError = require('../utils/AppError');

exports.notFound = (req, res, next) => next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));

// Single place where every error becomes a consistent JSON response
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err.name === 'ValidationError') {
    status = 400; message = 'Validation failed';
    details = Object.values(err.errors).map((e) => e.message);
  } else if (err.name === 'CastError') {
    status = 400; message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409; message = `Duplicate value for ${Object.keys(err.keyValue || {})[0] || 'field'}`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401; message = 'Invalid or expired token';
  } else if (err.type === 'entity.parse.failed') {
    status = 400; message = 'Malformed JSON in request body';
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, message, ...(details ? { errors: details } : {}) });
};
