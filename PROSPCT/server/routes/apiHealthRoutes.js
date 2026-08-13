const express = require("express");
const router = express.Router();
const axios = require("axios");

const { getSetting } = require("../utils/systemSettings");

// Helper function to test Stripe (or any API)
const checkStripe = async (secretKey) => {
  try {
    if (!secretKey) throw new Error("Stripe key missing");
    // Minimal Stripe request using Axios
    await axios.get("https://api.stripe.com/v1/charges", {
      headers: { Authorization: `Bearer ${secretKey}` },
      params: { limit: 1 },
    });
    return true;
  } catch (err) {
    return false;
  }
};

// Helper function to test CoinPayments (example)
const checkCoinPayments = async (publicKey, privateKey) => {
  if (!publicKey || !privateKey) return false;
  // You can do a dummy API call or just check keys exist
  return true;
};

// Helper function to test Google OAuth
const checkGoogle = async (clientId, clientSecret) => {
  if (!clientId || !clientSecret) return false;
  return true;
};

// Main health check endpoint
router.get("/", async (req, res) => {
  const failingApis = [];

  // Load from environment or DB
  const stripeKey =
    process.env.STRIPE_SECRET_KEY || (await getSetting("stripeSecretKey"));
  const stripePub =
    process.env.STRIPE_PUBLISHABLE_KEY ||
    (await getSetting("stripePublishableKey"));

  const coinPub =
    process.env.COINPAYMENTS_PUBLIC_KEY ||
    (await getSetting("coinPaymentsPublicKey"));
  const coinPriv =
    process.env.COINPAYMENTS_PRIVATE_KEY ||
    (await getSetting("coinPaymentsPrivateKey"));

  const googleId =
    process.env.GOOGLE_CLIENT_ID || (await getSetting("googleClientId"));
  const googleSecret =
    process.env.GOOGLE_CLIENT_SECRET ||
    (await getSetting("googleClientSecret"));

  // Check APIs
  const stripeOk = await checkStripe(stripeKey);
  if (!stripeOk) failingApis.push("Stripe");

  const coinOk = await checkCoinPayments(coinPub, coinPriv);
  if (!coinOk) failingApis.push("CoinPayments");

  const googleOk = await checkGoogle(googleId, googleSecret);
  if (!googleOk) failingApis.push("Google OAuth");

  res.json({ failingApis });
});

module.exports = router;
