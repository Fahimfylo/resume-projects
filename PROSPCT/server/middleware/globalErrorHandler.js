/**
 * globalErrorHandler.js
 *
 * Centralized, "Zero-Crash" error-handling middleware for Express.
 * Must be registered AFTER all routes with: app.use(globalErrorHandler);
 *
 * - Logs the full error with structured metadata.
 * - Returns a clean, non-leaking JSON response to the caller.
 * - NEVER calls process.exit().
 */
const globalErrorHandler = (err, req, res, next) => {
  // Determine a meaningful provider tag from the request path
  const provider = extractProvider(req.originalUrl);

  const statusCode = err.statusCode || 500;
  const message = err.exposedMessage || "Internal Server Error";

  // ── Structured log ───────────────────────────────────────────────────
  console.error(JSON.stringify({
    tag: "[PAYMENT_ERROR]",
    provider,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    reason: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    timestamp: new Date().toISOString(),
  }, null, 2));

  // ── Safe response (never leak stack to caller) ───────────────────────
  if (!res.headersSent) {
    res.status(statusCode).json({
      error: message,
      ...(process.env.NODE_ENV !== "production" && { detail: err.message }),
    });
  }
};

/**
 * Extracts a human-readable provider name from the URL path.
 * e.g. /api/payment/fastspring/webhook → "FastSpring"
 */
function extractProvider(url) {
  if (!url) return "Unknown";
  const lower = url.toLowerCase();
  if (lower.includes("fastspring")) return "FastSpring";
  if (lower.includes("heleket"))    return "Heleket";
  if (lower.includes("stripe"))     return "Stripe";
  if (lower.includes("coinpayments")) return "CoinPayments";
  if (lower.includes("payproglobal")) return "PayProGlobal";
  return "General";
}

module.exports = globalErrorHandler;
