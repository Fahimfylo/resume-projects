const express = require("express");
const authController = require("../controllers/authControllerUnified");
const {
  verifyToken,
  requireAdmin,
  requireUser,
  rateLimit,
} = require("../middleware/authorizationSecure");

const router = express.Router();

/**
 * 📝 AUTHENTICATION ROUTES (Unified)
 * 
 * Single Account model with role-based access
 * JWT stored in httpOnly cookies
 * All endpoints validate role in controller + middleware
 */

// ====================================
// 🔀 PUBLIC ROUTES (No auth required)
// ====================================

/**
 * POST /api/auth/register
 * Register new USER account
 * 🔒 Rate limited: 5 attempts per hour
 * @body { email, password, firstName, lastName, company?, countryCode?, mobile? }
 */
router.post("/register", rateLimit({ maxRequests: 5, windowMs: 60 * 60 * 1000 }), authController.registration);

/**
 * POST /api/auth/verify-otp
 * Verify email with OTP
 * Bearer token: temporary verification token
 * @body { otp }
 */
router.post("/verify-otp", authController.verifyRegistrationOtp);

/**
 * POST /api/auth/resend-otp
 * Resend verification OTP
 * @body { email }
 */
router.post("/resend-otp", authController.resendOtp);

/**
 * POST /api/auth/login
 * Login as USER
 * 🔒 Role validation: role must be "USER"
 * 🔒 Rate limited: 10 attempts per 15 minutes
 * @body { email, password }
 * @response { accessToken, account { id, email, firstName, role } }
 */
router.post("/login", rateLimit({ maxRequests: 10, windowMs: 15 * 60 * 1000 }), authController.login);

/**
 * POST /api/auth/admin-login
 * Login as ADMIN
 * 🔒 Role validation: role must be "ADMIN"
 * 🔒 Rate limited: 5 attempts per 15 minutes
 * @body { email, password }
 * @response { accessToken, account { id, email, firstName, role } }
 */
router.post("/admin-login", rateLimit({ maxRequests: 5, windowMs: 15 * 60 * 1000 }), authController.adminLogin);

/**
 * POST /api/auth/google
 * Google OAuth authentication
 * 🔒 Creates USER account on first signin
 * @body { credential }
 */
router.post("/google", authController.googleAuth);

/**
 * POST /api/auth/linkedin
 * LinkedIn OAuth authentication
 * 🔒 Creates USER account on first signin
 * @body { code }
 */
router.post("/linkedin", authController.linkedinAuth);

/**
 * POST /api/auth/telegram
 * Telegram authentication
 * 🔒 User must already exist
 * @body { hash, data }
 */
router.post("/telegram", authController.telegramAuth);

// ====================================
// 🔐 PROTECTED ROUTES (Auth required)
// ====================================

/**
 * GET /api/auth/verify-token
 * Verify and refresh token if needed
 * 🔒 Requires: valid JWT token
 * @response { accessToken?, account { id, email, role } }
 */
router.get("/verify-token", verifyToken, authController.verifyToken);

/**
 * POST /api/auth/verify-otp (authenticated)
 * Verify OTP when already logged in
 * 🔒 Requires: valid JWT token
 * @body { otp }
 */
router.post("/verify-otp-authenticated", verifyToken, authController.verifyOtp);

/**
 * POST /api/auth/logout
 * Logout (clears token)
 * 🔒 Requires: valid JWT token
 */
router.post("/logout", verifyToken, authController.logout);

// ====================================
// 🔒 ADMIN-ONLY ROUTES
// ====================================

/**
 * GET /api/auth/admin/status
 * Check admin authentication status
 * 🔒 Requires: ADMIN role
 */
router.get("/admin/status", verifyToken, requireAdmin, (req, res) => {
  res.json({ message: "Admin authenticated", userId: req.user.id });
});

// ====================================
// 👤 USER-ONLY ROUTES
// ====================================

/**
 * GET /api/auth/user/status
 * Check user authentication status
 * 🔒 Requires: USER role
 */
router.get("/user/status", verifyToken, requireUser, (req, res) => {
  res.json({ message: "User authenticated", userId: req.user.id });
});

/**
 * POST /api/auth/user/verify-otp-inline
 * Verify OTP for email verification within user flow
 * 🔒 Requires: USER role
 */
router.post("/user/verify-otp-inline", verifyToken, requireUser, authController.verifyOtp);

module.exports = router;
