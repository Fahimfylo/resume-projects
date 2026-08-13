const jwt = require("jsonwebtoken");

/**
 * ⚠️ DEPRECATED: This middleware uses Account model and includes role in JWT.
 * The multi-tenant system uses authMiddleware.js (User model, minimal JWT)
 * followed by workspaceContextMiddleware.js for workspace context.
 * Do NOT use this middleware for new routes.
 *
 * 🔒 UNIFIED AUTH MIDDLEWARE
 * Verifies JWT token from cookie or Authorization header
 * Does NOT check database - fully stateless JWT validation
 * Attaches decoded payload to req.user
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify JWT signature only (stateless)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach to request object
    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * 🔒 ADMIN-ONLY MIDDLEWARE
 * Extends authMiddleware
 * Verifies role === "ADMIN"
 * Blocks all non-admin roles including "USER"
 */
const adminMiddleware = (req, res, next) => {
  // First verify token
  authMiddleware(req, res, () => {
    // Then check role
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    next();
  });
};

/**
 * 🔒 USER-ONLY MIDDLEWARE
 * Verifies role === "USER"
 * Blocks ADMIN role (admin can't access user endpoints directly)
 */
const userMiddleware = (req, res, next) => {
  // First verify token
  authMiddleware(req, res, () => {
    // Then check role
    if (req.user.role !== "USER") {
      return res.status(403).json({
        message: "User access required",
      });
    }

    next();
  });
};

/**
 * 🔒 OPTIONAL AUTH MIDDLEWARE
 * Verifies token if provided, but doesn't require one
 * Used for endpoints that work for both logged-in and anonymous users
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.sub,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // Token invalid but optional, continue anyway
    next();
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  userMiddleware,
  optionalAuthMiddleware,
};
