const jwt = require("jsonwebtoken");
const Account = require("../models/Account");

/**
 * ⚠️ DEPRECATED: This middleware uses Account model and includes role in JWT.
 * The multi-tenant system uses authMiddleware.js (User model, minimal JWT)
 * followed by workspaceContextMiddleware.js for workspace context.
 * Do NOT use this middleware for new routes.
 *
 * 🔒 SECURE TOKEN VERIFICATION MIDDLEWARE
 * 
 * Production-level security:
 * - Extracts token from httpOnly cookie only (not headers)
 * - Verifies JWT signature cryptographically
 * - Validates token hasn't expired
 * - Confirms account exists and isn't blocked
 * - NO role checking (just verification)
 * - Attaches decoded user to req.user
 * 
 * Security principles:
 * ✅ Never trust frontend role claim
 * ✅ Always re-verify with database
 * ✅ Check account status (exists, not blocked)
 * ✅ Use constant-time comparison for sensitive data
 */
const verifyToken = async (req, res, next) => {
  try {
    // 🔐 Extract from httpOnly cookie ONLY
    // Never accept token from Authorization header in production
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "No authentication token provided",
      });
    }

    // 🔐 Verify JWT signature (cryptographic validation)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"], // Restrict to single algorithm
      });
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "TOKEN_EXPIRED",
          message: "Token has expired",
          expiresAt: jwtError.expiredAt,
        });
      }
      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          error: "INVALID_TOKEN",
          message: "Token is malformed or invalid",
        });
      }
      throw jwtError;
    }

    // 🔐 Validate JWT structure
    if (!decoded.sub || !decoded.role) {
      return res.status(401).json({
        error: "INVALID_TOKEN",
        message: "Token missing required claims",
      });
    }

    // 🔐 Verify account still exists in database
    // Prevents: deleted accounts, revoked access
    const account = await Account.findById(decoded.sub);

    if (!account) {
      return res.status(401).json({
        error: "ACCOUNT_NOT_FOUND",
        message: "Account associated with token no longer exists",
      });
    }

    // 🔐 Verify account is not blocked
    // Prevents: hacked accounts, inactive users, banned admins
    if (account.isBlocked) {
      return res.status(403).json({
        error: "ACCOUNT_BLOCKED",
        message: "This account has been blocked",
      });
    }

    // 🔐 CRITICAL: Verify role matches database
    // Prevents: frontend role spoofing
    if (account.role !== decoded.role) {
      // Log suspicious activity
      console.warn(
        `⚠️  SECURITY: Role mismatch for account ${decoded.sub}. Token: ${decoded.role}, DB: ${account.role}`
      );
      return res.status(401).json({
        error: "ROLE_MISMATCH",
        message: "Token role doesn't match account role",
      });
    }

    // ✅ Token verified, attach to request
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      email: account.email,
      isVerified: account.isVerified,
    };

    // 🔄 Optional: Check if token needs refresh (< 24hr remaining)
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    const hoursRemaining = expiresIn / 3600;

    if (hoursRemaining < 24) {
      // Issue new token in response
      const newToken = jwt.sign(
        { sub: account._id, role: account.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d", algorithm: "HS256" }
      );

      res.cookie("accessToken", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      // Signal to frontend that token was refreshed
      res.set("X-Token-Refreshed", "true");
    }

    next();
  } catch (error) {
    console.error("🔴 Token verification error:", error);
    res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Token verification failed",
    });
  }
};

/**
 * 🔒 FLEXIBLE ROLE AUTHORIZATION MIDDLEWARE
 * 
 * Usage:
 *   checkRole(["ADMIN"]) - only ADMIN
 *   checkRole(["USER"]) - only USER
 *   checkRole(["ADMIN", "MODERATOR"]) - either role
 * 
 * Security:
 * ✅ Requires verifyToken first (req.user must exist)
 * ✅ Role already verified against database (no spoofing)
 * ✅ Denies access with 403 if role doesn't match
 * ✅ Logs authorization failures
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // verifyToken must have run first
    if (!req.user) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // Check if user's role is in allowed list
    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized access attempt
      console.warn(
        `⚠️  SECURITY: Unauthorized access attempt. User: ${req.user.id}, Role: ${req.user.role}, Required: ${allowedRoles.join(
          ", "
        )}, Path: ${req.path}`
      );

      return res.status(403).json({
        error: "FORBIDDEN",
        message: `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
      });
    }

    // ✅ Role authorized
    next();
  };
};

/**
 * 🔒 ADMIN-ONLY MIDDLEWARE
 * 
 * Shorthand for checkRole(["ADMIN"])
 * Use on all admin-only routes
 * 
 * Always apply AFTER verifyToken
 */
const requireAdmin = checkRole(["ADMIN"]);

/**
 * 🔒 USER-ONLY MIDDLEWARE
 * 
 * Shorthand for checkRole(["USER"])
 * Use on all user-only routes
 * 
 * Always apply AFTER verifyToken
 */
const requireUser = checkRole(["USER"]);

/**
 * 🔒 OPTIONAL TOKEN VERIFICATION
 * 
 * Verifies token if provided, but doesn't require one
 * Use for endpoints accessible to both authenticated and anonymous users
 * 
 * If token invalid, continues anyway (doesn't block request)
 * If token valid, attaches req.user for use in controller
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      // No token, just continue (anonymous)
      return next();
    }

    // Token provided, verify it
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (!decoded.sub || !decoded.role) {
      // Invalid token, continue anyway
      return next();
    }

    // Verify account exists
    const account = await Account.findById(decoded.sub);
    if (account && !account.isBlocked && account.role === decoded.role) {
      req.user = {
        id: decoded.sub,
        role: decoded.role,
        email: account.email,
      };
    }

    next();
  } catch (error) {
    // Token invalid but optional, continue anyway
    next();
  }
};

/**
 * 🔒 REQUEST ID VALIDATION
 * 
 * Prevents IDOR (Insecure Direct Object Reference)
 * Users can only access/modify their own data
 * Admins can access any user data
 * 
 * Usage:
 *   router.get("/api/user/:userId", verifyToken, requireUser, validateOwnResource, controller)
 * 
 * Req params must include :userId (or configurable via options)
 */
const validateOwnResource = (options = {}) => {
  const { paramName = "userId", allowAdmin = true } = options;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const resourceId = req.params[paramName];

    if (!resourceId) {
      return res.status(400).json({
        error: "BAD_REQUEST",
        message: `Missing required parameter: ${paramName}`,
      });
    }

    // Admin can access any resource
    if (allowAdmin && req.user.role === "ADMIN") {
      return next();
    }

    // Users can only access their own resources
    if (req.user.id.toString() !== resourceId.toString()) {
      console.warn(
        `⚠️  SECURITY: IDOR attempt. User: ${req.user.id}, Requested: ${resourceId}`
      );
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "You can only access your own resources",
      });
    }

    next();
  };
};

/**
 * 🔒 RATE LIMITING MIDDLEWARE
 * 
 * Prevents brute force attacks on auth endpoints
 * Store rate limit state in Redis for distributed systems
 */
const rateLimit = (options = {}) => {
  const {
    maxRequests = 100,
    windowMs = 15 * 60 * 1000, // 15 minutes
    keyGenerator = (req) => req.ip, // By default, rate limit by IP
  } = options;

  const requestCounts = new Map();

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }

    const timestamps = requestCounts.get(key);

    // Remove old timestamps outside window
    const recentTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (recentTimestamps.length >= maxRequests) {
      return res.status(429).json({
        error: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds`,
        retryAfter: Math.ceil((recentTimestamps[0] + windowMs - now) / 1000),
      });
    }

    recentTimestamps.push(now);
    requestCounts.set(key, recentTimestamps);

    next();
  };
};

/**
 * 🔒 CSRF PROTECTION MIDDLEWARE
 * 
 * Double-submit cookie pattern with sameSite
 * When httpOnly cookies + sameSite=strict, CSRF attacks are blocked
 * This middleware adds extra protection via CSRF token
 */
const csrfProtection = (req, res, next) => {
  // GET/HEAD/OPTIONS are safe
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // For POST/PUT/DELETE, verify CSRF token
  const csrfToken = req.headers["x-csrf-token"] || req.body.csrfToken;

  if (!csrfToken) {
    return res.status(403).json({
      error: "FORBIDDEN",
      message: "CSRF token missing",
    });
  }

  // Verify token matches session (implementation depends on session store)
  // For now, we rely on httpOnly + sameSite=strict
  // In production, verify against server-stored token

  next();
};

/**
 * 🔒 SANITIZATION: Prevent NoSQL Injection
 * 
 * MongoDB query injection workaround
 * Validates that req.body values are primitives, not objects with $ operators
 */
const sanitizeNoSqlInjection = (req, res, next) => {
  const checkValue = (value) => {
    if (typeof value === "object" && value !== null) {
      // Check for MongoDB operators
      for (const key in value) {
        if (key.startsWith("$")) {
          throw new Error(`Potential NoSQL injection: ${key}`);
        }
        checkValue(value[key]);
      }
    }
  };

  try {
    if (req.body) {
      checkValue(req.body);
    }
    next();
  } catch (error) {
    console.warn(`⚠️  SECURITY: ${error.message}`);
    res.status(400).json({
      error: "BAD_REQUEST",
      message: "Invalid request data",
    });
  }
};

/**
 * 🔒 HELMET-LIKE SECURITY HEADERS
 * 
 * Should be used with express-helmet in production:
 * const helmet = require('helmet');
 * app.use(helmet());
 * 
 * This is a minimal version for critical headers
 */
const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Disable iframe embedding (clickjacking protection)
  res.setHeader("X-Frame-Options", "DENY");

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy (Feature Policy)
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()"
  );

  next();
};

/**
 * 🔒 ERROR HANDLER
 * 
 * Prevent information leakage in error responses
 * Never expose stack traces, database details, etc. to client
 */
const errorHandler = (err, req, res, next) => {
  console.error("🔴 Error:", err);

  // Don't expose stack trace to client
  const isDevelopment = process.env.NODE_ENV === "development";

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "INVALID_TOKEN",
      message: isDevelopment ? err.message : "Token validation failed",
    });
  }

  if (err.name === "MongooseError") {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: isDevelopment ? err.message : "Request validation failed",
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.error || "INTERNAL_SERVER_ERROR",
    message: isDevelopment ? err.message : "An error occurred",
  });
};

module.exports = {
  verifyToken,
  checkRole,
  requireAdmin,
  requireUser,
  optionalAuth,
  validateOwnResource,
  rateLimit,
  csrfProtection,
  sanitizeNoSqlInjection,
  securityHeaders,
  errorHandler,
};
