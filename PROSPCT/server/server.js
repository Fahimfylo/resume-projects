require("dotenv").config(); // ── MUST be Line 1 — before any module reads process.env ──

const { loadSettingsToCache } = require("./utils/systemSettings");
// const observeUserCredits = require("./services/userObserver");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { initSocket } = require("./utils/socket");
const http = require("http");
const bodyParser = require("body-parser");
const globalErrorHandler = require("./middleware/globalErrorHandler");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const searchRoutes = require("./routes/searchRoutes");
const savedRoutes = require("./routes/savedRoutes");
const savedCompaniesRoutes = require("./routes/savedCompaniesRoutes");
const creditRoutes = require("./routes/creditRoutes");
const listRoutes = require("./routes/listRoutes");
const folderRoutes = require("./routes/folderRoutes");
const savedSearchRoutes = require("./routes/savedSearchRoutes");
const emailVerificationRoute = require("./routes/emailVerificationRoute");
const planRoutes = require("./routes/planRoutes");
const customPlanRoutes = require("./routes/customPlanRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userRoutes = require("./routes/userRoutes");
const couponRoutes = require("./routes/couponRoutes");
const specialDealRoutes = require("./routes/specialDealRoutes");
const adminRoutes = require("./routes/adminRoutes");
const systemSettingRoutes = require("./routes/systemSettingRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const dataRoutes = require("./routes/dataRoutes");
const apiHealthRoutes = require("./routes/apiHealthRoutes");
const teamRoutes = require("./routes/teamRoutes");
const importRoutes = require("./routes/importRoutes");
const recentSearchRoutes = require("./routes/recentSearchRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const inviteRoutes = require("./routes/inviteRoutes");
const exampleRoutes = require("./routes/exampleRoutes");
const contactRoutes = require("./routes/contactRoutes");
const companyRoutes = require("./routes/companyRoutes");
const redemptionRoutes = require("./routes/redemptionRoutes");
const voucherRoutes = require("./routes/voucherRoutes");
const voucherRedeemRoutes = require("./routes/voucherRedeemRoutes");
const { startAutoRenewal } = require("./jobs/renewPackages");

const app = express();
const PORT = 4000;

// ADD THIS LINE HERE
app.set('trust proxy', 1);
/* -------------------- DB & System Settings -------------------- */
connectDB().then(() => {
  // observeUserCredits(); // Start observing user credit changes
  loadSettingsToCache()
    .catch((err) => console.error("Failed to load system settings:", err));

});

/* -------------------- Validate Critical Environment Variables -------------------- */
const { getKey } = require("./utils/encryption");
try {
  getKey(); // Validates INVITE_TOKEN_SECRET at startup
} catch (err) {
  console.error("⚠️  INVITE_TOKEN_SECRET validation failed:", err.message);
  console.error("Set INVITE_TOKEN_SECRET in your .env file (min 16 characters)");
}

/* -------------------- Middleware -------------------- */
// Stripe webhook needs the raw buffer — register BEFORE the JSON parser
app.use("/payment/stripe/webhook", express.raw({ type: "application/json" }));

// Global JSON parser with rawBody capture for signature validation
app.use(express.json({
  limit: "10mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString("utf8");
  },
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

/* -------------------- Server & Socket -------------------- */
const server = http.createServer(app);
initSocket(server);

/* -------------------- Security Headers -------------------- */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // needed for CORS + uploads
}));

/* -------------------- Global Rate Limiting (general) -------------------- */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 400, // Limit each IP to 400 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS", // Don't count CORS preflight requests
  message: { error: "Too many requests from this IP, please try again later." },
});
app.use(generalLimiter);

/* -------------------- Auth Rate Limiting -------------------- */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 login attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again later." },
});

/* -------------------- Password Reset Rate Limiting -------------------- */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Please try again later." },
});

/* -------------------- CORS -------------------- */
// Build CORS origins from environment — no hardcoded dev URLs in production
const corsOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "https://app.prospct.io",
      "https://get.prospct.io",
      "https://prospct.lovable.app",
      "https://id-preview--7ea92874-9be1-4cd4-aed0-658600e40235.lovable.app",
      "http://localhost:5173",
    ];

const corsOptions = {
  origin: corsOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Api-Key"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* -------------------- Routes -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/saved-companies", savedCompaniesRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/list", listRoutes);
app.use("/api/list/folder", folderRoutes);
app.use("/api/recent-searches", recentSearchRoutes);
app.use("/api/saved-searches", savedSearchRoutes);
app.use("/api/email-verify", emailVerificationRoute);
app.use("/api/plans", planRoutes);
app.use("/api/custom-plans", customPlanRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/special-deals", redemptionRoutes);
app.use("/api/special-deals", specialDealRoutes);
app.use("/admin/special-deals/requests", voucherRoutes);
app.use("/api/vouchers", voucherRedeemRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/settings", systemSettingRoutes);
app.use("/api/admin/api-health", apiHealthRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/import", importRoutes);
app.use("/settings/notifications", notificationRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/example", exampleRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/companies", companyRoutes);

/* -------------------- Root -------------------- */
app.get("/", (req, res) => res.send("Server is working fine."));

/* -------------------- Static Uploads -------------------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* -------------------- Start Server -------------------- */
server.listen(PORT, () => {
  startAutoRenewal();
});

/* -------------------- Global Error Handler (Zero-Crash) -------------------- */
// Must be registered AFTER all routes — 4-argument signature tells Express this is error middleware
app.use(globalErrorHandler);

/* -------------------- Initialize Queues (Workers) -------------------- */
require("./queues/fastSpringQueue");

/* -------------------- Process-Level Protections -------------------- */
// These prevent unhandled async errors and unexpected exceptions from killing the process.
process.on("unhandledRejection", (reason, promise) => {
  console.error(JSON.stringify({
    tag: "[PROCESS_ERROR]",
    type: "unhandledRejection",
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    timestamp: new Date().toISOString(),
  }, null, 2));
  // Do NOT call process.exit() — keep the server alive.
});

process.on("uncaughtException", (err) => {
  console.error(JSON.stringify({
    tag: "[PROCESS_ERROR]",
    type: "uncaughtException",
    reason: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  }, null, 2));
  // Do NOT call process.exit() — keep the server alive.
  // In extreme cases (e.g., out-of-memory), the OS will handle termination.
});
