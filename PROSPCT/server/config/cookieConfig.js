/**
 * 🔒 SECURE COOKIE CONFIGURATION
 * 
 * Production-level HTTP cookie security settings
 * Implements defense against CSRF, XSS, and cookie theft
 */

const cookieConfig = {
  /**
   * 🔐 User/Admin Authentication Cookie
   * 
   * httpOnly: True
   *   - JavaScript cannot access cookie (prevents XSS token theft)
   *   - Sent automatically with every HTTP request
   *   - Browser handles all token management
   * 
   * secure: True (production only)
   *   - Only sent over HTTPS connections
   *   - Prevents man-in-the-middle interception
   * 
   * sameSite: 'strict'
   *   - Cookie NOT sent with cross-site requests
   *   - Prevents CSRF attacks
   *   - strictest setting, blocks even same-site form submissions
   * 
   * path: '/'
   *   - Cookie available to all routes
   * 
   * maxAge: 30 days (in milliseconds)
   *   - Token expires after 30 days
   *   - Browser automatically deletes expired cookies
   */
  accessToken: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },

  /**
   * 🔐 Session Cookie (optional, for additional tracking)
   * 
   * Used to track active sessions (more restrictive)
   * Shorter expiry for additional security
   */
  session: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },

  /**
   * 🔐 CSRF Token Cookie
   * 
   * If using double-submit cookie pattern for CSRF
   * (Not strictly needed with sameSite=strict + httpOnly)
   */
  csrfToken: {
    httpOnly: false, // Needed for JavaScript to read for form submission
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  },

  /**
   * 🧹 CLEAR COOKIE CONFIG
   * 
   * Used on logout - clears all cookies
   * Must match original cookie settings exactly
   */
  clear: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0, // Tells browser to delete
  },
};

/**
 * Helper function: Set authentication cookie
 * 
 * Usage in authController:
 *   setAuthCookie(res, jwtToken);
 */
const setAuthCookie = (res, token) => {
  res.cookie("accessToken", token, cookieConfig.accessToken);
};

/**
 * Helper function: Clear authentication cookie
 * 
 * Usage in logout endpoint:
 *   clearAuthCookie(res);
 */
const clearAuthCookie = (res) => {
  res.clearCookie("accessToken", {
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
};

/**
 * Helper function: Set session cookie (optional)
 * 
 * Usage for additional session tracking:
 *   setSessionCookie(res, sessionId);
 */
const setSessionCookie = (res, sessionId) => {
  res.cookie("sessionId", sessionId, cookieConfig.session);
};

/**
 * Helper function: Generate and set CSRF token
 * 
 * If using CSRF token pattern (additional protection)
 *   
 * Usage:
 *   const csrfToken = generateCsrfToken();
 *   setCsrfCookie(res, csrfToken);
 */
const crypto = require("crypto");

const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const setCsrfCookie = (res, token) => {
  res.cookie("_csrf", token, cookieConfig.csrfToken);
  // Also return in response for frontend to use in forms
  return token;
};

module.exports = {
  cookieConfig,
  setAuthCookie,
  clearAuthCookie,
  setSessionCookie,
  setCsrfCookie,
  generateCsrfToken,
};

/**
 * BROWSER COOKIE SECURITY FLOW
 * 
 * 1. LOGIN
 *    Backend: Set-Cookie: accessToken=<jwt>; HttpOnly; Secure; SameSite=Strict
 *    Browser: Stores cookie (JS can't access)
 * 
 * 2. API REQUEST
 *    Browser: Automatically sends Cookie header: accessToken=<jwt>
 *    Backend: Verifies JWT signature (never stolen by XSS)
 * 
 * 3. CSRF PROTECTION
 *    GET /page → Returns form with CSRF token in hidden field
 *    POST /action → Browser includes Cookie header + CSRF token
 *    Backend: Verifies CSRF token + checks SameSite cookie rules
 * 
 * 4. LOGOUT
 *    Backend: Set-Cookie: accessToken=; MaxAge=0
 *    Browser: Deletes cookie
 *    Future requests: No token sent
 * 
 * 5. TOKEN EXPIRY
 *    If token expires in backend (JWT exp claim):
 *    GET /api/data → 401 Unauthorized
 *    Frontend: Navigate to /login
 *    Browser: Cookie still present but invalid (rejected by backend)
 * 
 * ATTACK PREVENTION:
 * 
 * ✅ XSS (JavaScript steal token from localStorage)
 *    - localStorage: Vulnerable (JS can readItem)
 *    - httpOnly cookies: Protected (JS cannot access)
 * 
 * ✅ CSRF (Cross-Site Request Forgery)
 *    - sameSite=strict: Cookie not sent to other domains
 *    - Even if attacker tricks you to click link, cookie not sent
 * 
 * ✅ MITM (Man-In-The-Middle)
 *    - secure flag: Only sent over HTTPS
 *    - Attacker can't intercept token on http://
 * 
 * ✅ Cookie Theft (JavaScript eval, console.log)
 *    - httpOnly: Only sent to backend, frontend JS blind
 */
