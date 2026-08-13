const express = require("express");
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");
const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");
const { requireOwnerOnly } = require("../middleware/permissionMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// ── STRIPE ────────────────────────────────────────────────────────────────────
router.post(
  "/stripe/create-checkout-session",
  authMiddleware,
  workspaceContextMiddleware,
  requireOwnerOnly, // Billing: workspace owner only (team members blocked)
  asyncHandler(paymentController.stripeCreateCheckoutSession),
);

// stripe webhook — needs express.raw for Stripe's own signature verification
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(paymentController.stripeWebhook),
);

// ── FASTSPRING ────────────────────────────────────────────────────────────────
router.post(
  "/fastspring/checkout",
  authMiddleware,
  workspaceContextMiddleware,
  requireOwnerOnly, // Billing: team owner only (admins and members blocked)
  asyncHandler(paymentController.fastSpringCheckout),
);

// fastspring webhook — uses req.rawBody from global express.json verify hook
router.post(
  "/fastspring/webhook",
  asyncHandler(paymentController.fastSpringWebhook),
);

// fastspring webhook alias (legacy frontend path)
router.post(
  "/webhook/fastspring",
  asyncHandler(paymentController.fastSpringWebhook),
);

// fastspring secure-payload (authenticated — generates server-signed checkout token)
router.post(
  "/fastspring/secure-payload",
  authMiddleware,
  workspaceContextMiddleware,
  requireOwnerOnly, // Billing: team owner only
  asyncHandler(paymentController.fastSpringSecurePayload),
);

// ── COINPAYMENTS ──────────────────────────────────────────────────────────────
router.post("/coinpayments", authMiddleware, workspaceContextMiddleware, requireOwnerOnly, asyncHandler(paymentController.createCoinPaymentsPayment));
router.post("/coinpayments/ipn", asyncHandler(paymentController.coinpaymentsIPN));

// ── PAYPROGLOBAL ──────────────────────────────────────────────────────────────
router.post(
  "/payproglobal/checkout",
  authMiddleware,
  workspaceContextMiddleware,
  requireOwnerOnly, // Billing: team owner only (admins and members blocked)
  asyncHandler(paymentController.payProGlobalCheckout),
);
router.post("/payproglobal/ipn", asyncHandler(paymentController.PayProGlobalIPN));

// ── HELEKET ───────────────────────────────────────────────────────────────────
router.post(
  "/heleket/checkout",
  authMiddleware,
  workspaceContextMiddleware,
  requireOwnerOnly, // Billing: team owner only (admins and members blocked)
  asyncHandler(paymentController.heleketCheckout),
);
// heleket IPN — uses req.rawBody from global express.json verify hook
router.post("/heleket/ipn", asyncHandler(paymentController.heleketIPN));

module.exports = router;
