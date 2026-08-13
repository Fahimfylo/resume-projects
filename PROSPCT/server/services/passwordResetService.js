const crypto = require("crypto");
const { getSetting } = require("../utils/systemSettings");

/**
 * In-memory rate limiter for forgot password requests.
 * Stores { email: [{ timestamp }] }
 * Max 5 requests per email per hour.
 */
const rateLimitStore = new Map();

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5;

/**
 * Generates a secure random token and returns both the raw token and its SHA256 hash.
 * @returns {{ rawToken: string, hashedToken: string }}
 */
const generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  return { rawToken, hashedToken };
};

/**
 * Checks if the given email has exceeded the rate limit.
 * @param {string} email
 * @returns {boolean} true if rate limited, false otherwise
 */
const isRateLimited = (email) => {
  const now = Date.now();
  const normalizedEmail = email.toLowerCase().trim();

  if (!rateLimitStore.has(normalizedEmail)) {
    rateLimitStore.set(normalizedEmail, []);
  }

  const requests = rateLimitStore.get(normalizedEmail);

  // Remove expired timestamps
  const validRequests = requests.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS,
  );

  rateLimitStore.set(normalizedEmail, validRequests);

  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  // Add current request timestamp
  validRequests.push(now);
  return false;
};

/**
 * Sends a password reset email with a reset link.
 * @param {string} to - Recipient email address
 * @param {string} rawToken - The unhashed reset token
 * @param {string} firstName - Recipient's first name
 * @param {string} userType - 'user' or 'admin' (default: 'user')
 */
const sendPasswordResetEmail = async (to, rawToken, firstName, userType = "user") => {

  const { createTransporter } = require("../utils/emailService");

  const transporter = await createTransporter();

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password?token=${rawToken}&type=${userType}`;


  // Warn if using default localhost in production
  if (!process.env.CLIENT_URL && process.env.NODE_ENV === "production") {
    console.error("⚠️ WARNING: CLIENT_URL not set! Using localhost - email links will NOT work!");
  }

  const fromAddress =
    (await getSetting("smtpFrom")) ||
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER
      ? `"Prospct" <${process.env.SMTP_USER}>`
      : "noreply@prospct.com");


  // Verify token is in URL before embedding

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        body { margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .wrapper { max-width: 560px; margin: 48px auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .header { padding: 40px 40px 20px; text-align: left; }
        .header h1 { color: #111827; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
        .body { padding: 0 40px 40px; }
        .body p { color: #4b5563; font-size: 16px; line-height: 24px; margin: 16px 0; }
        .btn-container { margin: 32px 0; }
        .btn {
          display: inline-block;
          background-color: #3B82F6; /* Prospct Blue */
          color: #ffffff !important;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        .expiry-text {
          font-size: 14px;
          color: #6b7280;
          background-color: #eff6ff;
          padding: 12px 16px;
          border-left: 4px solid #3B82F6;
          border-radius: 4px;
          margin: 24px 0;
        }
        .divider { height: 1px; background-color: #e5e7eb; margin: 32px 0; }
        .footer { padding: 0 40px 40px; text-align: left; }
        .footer-text { font-size: 13px; color: #9ca3af; line-height: 20px; }
        .footer-link { color: #3B82F6; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>prospct</h1>
        </div>

        <div class="body">
          <p>Hi ${firstName || "there"},</p>
          <p>A request was made to reset your Prospct account password. Click the button below to choose a new one:</p>

          <div class="btn-container">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </div>

          <div class="expiry-text">
            <strong>Security note:</strong> This link is valid for the next <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.
          </div>

          <div class="divider"></div>

          <p style="font-size: 13px; color: #9ca3af;">
            If the button above doesn't work, copy and paste this link into your browser:
            <br />
            <span style="color: #3B82F6; word-break: break-all;">${resetUrl}</span>
          </p>
        </div>

        <div class="footer">
          <p class="footer-text">
            &copy; ${new Date().getFullYear()} Prospct Inc. <br />
            Rajshahi, Bangladesh.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: fromAddress,
    to,
    subject: "Reset your Prospct password",
    html: htmlContent,
  };


  // Extract and verify URLs in final HTML
  const hrefMatches = htmlContent.match(/href="([^"]+)"/g);
  hrefMatches?.forEach((match, i) => {
    const fullUrl = match.replace('href="', '').replace('"', '');
  });


  try {
    const info = await transporter.sendMail(mailOptions);
    
    
    return info;
  } catch (error) {
    console.error("\n❌ EMAIL SEND FAILED!");
    console.error("   ├─ Error Code:", error.code);
    console.error("   ├─ Error Response:", error.response);
    console.error("   └─ Error Message:", error.message);
    if (error.responseCode) {
      console.error("   └─ SMTP Response Code:", error.responseCode);
    }
    throw error;
  }
};

module.exports = {
  generateResetToken,
  isRateLimited,
  sendPasswordResetEmail,
};
