/**
 * asyncHandler.js
 * 
 * Wraps Express route handler functions so that any unhandled
 * promise rejection is automatically forwarded to the Express
 * error-handling middleware instead of crashing the Node process.
 *
 * Usage:
 *   const asyncHandler = require('../utils/asyncHandler');
 *   router.post('/route', asyncHandler(myControllerFn));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
