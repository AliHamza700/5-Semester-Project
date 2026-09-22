/**
 * Global error handler middleware.
 * - Logs errors server-side (with credential redaction)
 * - Never exposes stack traces, passwords, or API keys to the client
 */

const SENSITIVE_PATTERN = /(password|passwd|pwd|secret|api_?key|token)\s*[:=]\s*\S+/gi;

function redact(str) {
  if (typeof str !== 'string') return str;
  return str.replace(SENSITIVE_PATTERN, '[REDACTED]');
}

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  // Redact and log server-side only
  const safeMessage = redact(err.message || 'Unknown error');
  console.error(`[ERROR] ${req.method} ${req.path} — ${safeMessage}`);

  // Determine HTTP status
  const status = err.statusCode || err.status || 500;

  // Never expose internals to client
  const clientMessage =
    status < 500
      ? (err.message || 'Bad request.')  // Client errors can show message
      : 'An internal server error occurred.'; // Server errors — generic message only

  res.status(status).json({
    error: clientMessage,
    code: err.code || 'INTERNAL_ERROR',
  });
}

module.exports = errorMiddleware;
