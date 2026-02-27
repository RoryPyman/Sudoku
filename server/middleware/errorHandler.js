/**
 * Global Express error handler — must be registered last.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err);

  // Mongoose duplicate-key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      error: 'Conflict',
      message: `${field} is already taken`,
    });
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      error: 'ValidationError',
      message: Object.values(err.errors).map(e => e.message).join('; '),
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.name || 'InternalError',
    message: status < 500 ? err.message : 'Internal server error',
  });
}
