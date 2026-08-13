/**
 * 🔒 PROTECTED ROUTE EXAMPLES - Production Security
 * 
 * This file shows how to protect all routes with proper authorization
 * Apply these patterns to all 18 route files in the codebase
 */

const express = require("express");
const {
  verifyToken,
  requireAdmin,
  requireUser,
  optionalAuth,
  validateOwnResource,
  rateLimit,
  securityHeaders,
  sanitizeNoSqlInjection,
} = require("../middleware/authorizationSecure");

const router = express.Router();

// ============================================
// 🔐 MIDDLEWARE STACK (Applied to all routes)
// ============================================
router.use(securityHeaders); // Security headers
router.use(sanitizeNoSqlInjection); // NoSQL injection prevention
router.use(express.json()); // Parse JSON

/**
 * MIDDLEWARE APPLICATION ORDER MATTERS:
 * 1. Security headers first (applies to all responses)
 * 2. Sanitization (validates request body)
 * 3. JWT verification (authenticates user)
 * 4. Role check (authorizes user)
 */

// ============================================
// 📝 EXAMPLE 1: PUBLIC ROUTES (No auth required)
// ============================================

/**
 * POST /api/auth/register
 * Register new user account
 * No authentication required
 */
router.post(
  "/auth/register",
  rateLimit({ maxRequests: 5, windowMs: 60 * 60 * 1000 }), // 5 per hour
  (req, res) => {
    // authController.registration
    res.json({ message: "Registration example" });
  }
);

/**
 * POST /api/auth/login
 * User login endpoint
 * Rate limited to prevent brute force
 */
router.post(
  "/auth/login",
  rateLimit({ maxRequests: 10, windowMs: 15 * 60 * 1000 }), // 10 per 15 minutes
  (req, res) => {
    // authController.login
    res.json({ message: "Login example" });
  }
);

/**
 * POST /api/auth/admin-login
 * Admin login endpoint
 * Stricter rate limiting (admin-specific spam)
 */
router.post(
  "/auth/admin-login",
  rateLimit({ maxRequests: 5, windowMs: 15 * 60 * 1000 }), // 5 per 15 minutes
  (req, res) => {
    // authController.adminLogin
    res.json({ message: "Admin login example" });
  }
);

// ============================================
// 👤 EXAMPLE 2: USER-ONLY ROUTES
// ============================================

/**
 * GET /api/user/profile
 * Get current user's profile
 * 🔐 Requires: USER role
 * ✅ verifyToken checks: token exists, valid, account exists, not blocked, role matches
 * ✅ requireUser checks: role === "USER" (admins cannot call this)
 */
router.get(
  "/user/profile",
  verifyToken, // Authenticate
  requireUser, // Authorize (USER role only)
  (req, res) => {
    // req.user is now safe to use
    // { id, role, email, isVerified }
    // Controller can assume role === "USER"
    res.json({
      message: "User profile",
      userId: req.user.id,
      role: req.user.role,
    });
  }
);

/**
 * PUT /api/user/profile
 * Update current user's profile
 * 🔐 Requires: USER role + owns the resource
 */
router.put(
  "/user/profile",
  verifyToken,
  requireUser,
  sanitizeNoSqlInjection, // Validate body again before update
  (req, res) => {
    // Controller receives validated req.user
    res.json({
      message: "Profile updated",
      userId: req.user.id,
    });
  }
);

/**
 * GET /api/user/:userId/profile
 * Get specific user's profile
 * 🔐 Requires: USER role + validates owns resource (IDOR prevention)
 * Users can only view their own profile
 * (Admins could modify this rule with validateOwnResource({ allowAdmin: true }))
 */
router.get(
  "/user/:userId/profile",
  verifyToken,
  requireUser,
  validateOwnResource({ paramName: "userId", allowAdmin: false }), // Users can ONLY access own
  (req, res) => {
    res.json({
      message: "User profile",
      userId: req.params.userId,
    });
  }
);

/**
 * GET /api/user/credits
 * Get current user's credits
 * 🔐 Requires: USER role only (ADMIN accounts don't have credits)
 */
router.get(
  "/user/credits",
  verifyToken,
  requireUser,
  (req, res) => {
    res.json({
      message: "User credits",
      emailCredits: 100,
      phoneCredits: 30,
    });
  }
);

/**
 * POST /api/user/verify-email
 * Verify user email with OTP
 * 🔐 Requires: USER role + email not verified
 */
router.post(
  "/user/verify-email",
  verifyToken,
  requireUser,
  rateLimit({ maxRequests: 5, windowMs: 60 * 1000 }), // 5 per minute (prevent OTP spam)
  sanitizeNoSqlInjection,
  (req, res) => {
    res.json({
      message: "Email verified",
      isVerified: true,
    });
  }
);

// ============================================
// 🔐 EXAMPLE 3: ADMIN-ONLY ROUTES
// ============================================

/**
 * GET /api/admin/users
 * List all user accounts
 * 🔐 Requires: ADMIN role only
 * Users cannot access this endpoint
 */
router.get(
  "/admin/users",
  verifyToken, // Authenticate
  requireAdmin, // Authorize (ADMIN role only)
  (req, res) => {
    // req.user is safe to use
    // { id, role, email, isVerified }
    // Controller can assume role === "ADMIN"
    res.json({
      message: "All users",
      users: [],
    });
  }
);

/**
 * GET /api/admin/users/:userId
 * Get specific user details (admin view)
 * 🔐 Requires: ADMIN role
 * Note: Admins can access any user (no IDOR protection)
 */
router.get(
  "/admin/users/:userId",
  verifyToken,
  requireAdmin,
  validateOwnResource({ paramName: "userId", allowAdmin: true }), // Admins can access all
  (req, res) => {
    res.json({
      message: "User details",
      userId: req.params.userId,
    });
  }
);

/**
 * PUT /api/admin/users/:userId/block
 * Block a user account
 * 🔐 Requires: ADMIN role
 * Prevents user from logging in
 */
router.put(
  "/admin/users/:userId/block",
  verifyToken,
  requireAdmin,
  sanitizeNoSqlInjection,
  (req, res) => {
    res.json({
      message: "User blocked",
      userId: req.params.userId,
      isBlocked: true,
    });
  }
);

/**
 * DELETE /api/admin/users/:userId
 * Delete user account (only admin can do this)
 * 🔐 Requires: ADMIN role
 * Dangerous operation - admins only
 */
router.delete(
  "/admin/users/:userId",
  verifyToken,
  requireAdmin,
  rateLimit({ maxRequests: 10, windowMs: 60 * 60 * 1000 }), // 10 per hour
  (req, res) => {
    res.json({
      message: "User deleted",
      userId: req.params.userId,
    });
  }
);

/**
 * GET /api/admin/audit-logs
 * View audit logs (admin only)
 * 🔐 Requires: ADMIN role
 * Security-sensitive operation
 */
router.get(
  "/admin/audit-logs",
  verifyToken,
  requireAdmin,
  (req, res) => {
    res.json({
      message: "Audit logs",
      logs: [],
    });
  }
);

/**
 * POST /api/admin/settings
 * Update system settings
 * 🔐 Requires: ADMIN role
 * Critical operation - log all changes
 */
router.post(
  "/admin/settings",
  verifyToken,
  requireAdmin,
  sanitizeNoSqlInjection,
  (req, res) => {
    res.json({
      message: "Settings updated",
      setting: req.body,
    });
  }
);

// ============================================
// 🔀 EXAMPLE 4: PUBLIC WITH OPTIONAL AUTH
// ============================================

/**
 * GET /api/public/posts
 * Get public posts (works for anonymous and authenticated users)
 * If user is logged in, can see personalized content
 * 🔐 Authentication optional - no verifyToken required
 */
router.get(
  "/public/posts",
  optionalAuth, // Token verified IF provided, but not required
  (req, res) => {
    if (req.user) {
      // Can personalize for logged-in user
    } else {
      // Generic content for anonymous user
    }

    res.json({
      message: "Public posts",
      posts: [],
      authenticated: !!req.user,
    });
  }
);

// ============================================
// 🛡️ EXAMPLE 5: IDOR PREVENTION PATTERNS
// ============================================

/**
 * GET /api/user/:userId/searches
 * Get user's saved searches
 * 🔐 Prevents IDOR: Users can only access own searches
 * Admins cannot see via /user/* endpoints
 */
router.get(
  "/user/:userId/searches",
  verifyToken,
  requireUser,
  validateOwnResource({
    paramName: "userId",
    allowAdmin: false, // Users stay in /user/* endpoints
  }),
  (req, res) => {
    res.json({
      message: "Saved searches",
      searches: [],
      userId: req.params.userId,
    });
  }
);

/**
 * POST /api/user/:userId/searches
 * Create saved search
 * 🔐 Prevents IDOR: Users can only create for themselves
 */
router.post(
  "/user/:userId/searches",
  verifyToken,
  requireUser,
  validateOwnResource({ paramName: "userId", allowAdmin: false }),
  sanitizeNoSqlInjection,
  (req, res) => {
    res.json({
      message: "Search created",
      userId: req.params.userId,
    });
  }
);

/**
 * PUT /api/user/:userId/searches/:searchId
 * Update user's saved search
 * 🔐 Prevents IDOR on both user AND search
 * 
 * In controller, also verify searchId belongs to userId:
 * const search = await Search.findById(searchId);
 * if (!search || search.userId !== req.user.id) {
 *   return res.status(403).json({ error: "FORBIDDEN" });
 * }
 */
router.put(
  "/user/:userId/searches/:searchId",
  verifyToken,
  requireUser,
  validateOwnResource({ paramName: "userId", allowAdmin: false }),
  sanitizeNoSqlInjection,
  (req, res) => {
    // Controller MUST also verify searchId belongs to userId
    res.json({
      message: "Search updated",
      userId: req.params.userId,
      searchId: req.params.searchId,
    });
  }
);

// ============================================
// 📊 EXAMPLE 6: DATA ENDPOINT PATTERNS
// ============================================

/**
 * POST /api/admin/data/import
 * Import data (admin only, rate limited)
 * 🔐 Admin role + large file limit + rate limit
 */
router.post(
  "/admin/data/import",
  verifyToken,
  requireAdmin,
  rateLimit({
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 5 imports per hour
  }),
  sanitizeNoSqlInjection,
  (req, res) => {
    res.json({
      message: "Data import started",
      jobId: "job_123",
    });
  }
);

/**
 * GET /api/admin/data/exports
 * List data exports
 * 🔐 Admin only
 */
router.get(
  "/admin/data/exports",
  verifyToken,
  requireAdmin,
  (req, res) => {
    res.json({
      message: "Exports",
      exports: [],
    });
  }
);

// ============================================
// 💳 EXAMPLE 7: PAYMENT ENDPOINT PATTERNS
// ============================================

/**
 * GET /api/user/subscription
 * Get current subscription
 * 🔐 User only - billing is user-specific
 */
router.get(
  "/user/subscription",
  verifyToken,
  requireUser,
  (req, res) => {
    res.json({
      message: "Subscription",
      planId: "plan_123",
      status: "active",
    });
  }
);

/**
 * POST /api/user/subscription/upgrade
 * Upgrade subscription plan
 * 🔐 User only - requires payment info validation
 */
router.post(
  "/user/subscription/upgrade",
  verifyToken,
  requireUser,
  rateLimit({ maxRequests: 10, windowMs: 60 * 60 * 1000 }), // 10 per hour
  sanitizeNoSqlInjection,
  (req, res) => {
    res.json({
      message: "Upgrade initiated",
      planId: req.body.planId,
    });
  }
);

/**
 * GET /api/admin/payments
 * View all payments (admin only)
 * 🔐 Admin only - sensitive financial data
 */
router.get(
  "/admin/payments",
  verifyToken,
  requireAdmin,
  (req, res) => {
    res.json({
      message: "All payments",
      payments: [],
    });
  }
);

// ============================================
// 🏠 EXAMPLE 8: EXPORT FULL PATTERN
// ============================================

module.exports = router;

/**
 * USAGE IN app.js:
 * 
 * const app = require('express')();
 * const {
 *   verifyToken,
 *   requireAdmin,
 *   requireUser,
 *   securityHeaders,
 *   sanitizeNoSqlInjection,
 *   errorHandler
 * } = require('./middleware/authorizationSecure');
 * 
 * // Global middleware
 * app.use(securityHeaders);
 * 
 * // Routes
 * app.use('/api', require('./routes/publicRoutes'));
 * app.use('/api/user', require('./routes/userRoutes'));
 * app.use('/api/admin', require('./routes/adminRoutes'));
 * 
 * // Error handling
 * app.use(errorHandler);
 * 
 * app.listen(4000);
 */
