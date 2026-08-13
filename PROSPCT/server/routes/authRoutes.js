const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const planController = require("../controllers/planController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Login rate limiter (15 attempts per 15 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

// Registration rate limiter (5 per hour)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again later." },
});

// Password reset rate limiter (5 attempts per hour)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Please try again later." },
});

router.post("/register", registerLimiter, authController.registration);
router.post("/login", loginLimiter, authController.login);
router.post("/resend-otp", authController.resendOtp);
router.post("/verify-token", authController.verifyToken);
router.post("/logout", authController.logout);
router.post("/google-auth", authController.googleAuth);
router.post("/verify-otp", authController.verifyOtp);
router.post("/verify-registration", authController.verifyRegistrationOtp);
router.get("/me", authMiddleware, authController.getMe);
router.get("/telegram", authController.telegramAuth);
router.post("/telegram/callback", authController.telegramCallback);
router.get("/linkedin", authController.linkedinAuth);
router.get("/linkedin/login", authController.linkedinLogin);

// Password reset routes (rate limited)
router.post("/forgot-password", passwordResetLimiter, authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Set password (authenticated users only)
router.post("/set-password", authMiddleware, authController.setPassword);
router.post("/request-set-password-otp", authMiddleware, authController.requestSetPasswordOtp);

router.post("/adminLogin", authController.adminLogin);
router.post("/verify-admin-token", authController.verifyAdminToken);
router.post("/admin-logout", authController.adminLogout);


module.exports = router;
