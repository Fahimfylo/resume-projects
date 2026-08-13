const crypto = require("crypto");
const axios = require("axios");

const createHeleketPayment = async ({
  amount,
  orderId,
  email,
  successUrl,
  failUrl,
  callbackUrl,
}) => {
  try {
    const API_KEY = process.env.HELEKET_API_KEY;
    const MERCHANT_ID = process.env.HELEKET_MERCHANT_ID;

    // ── Fail-safe: missing config ──
    if (!API_KEY || !MERCHANT_ID) {
      console.error(JSON.stringify({
        tag: "[PAYMENT_ERROR]",
        provider: "Heleket",
        reason: "CRITICAL: MISSING CONFIG",
        apiKeyStatus: API_KEY ? "LOADED" : "NOT_LOADED",
        merchantIdStatus: MERCHANT_ID ? "LOADED" : "NOT_LOADED",
        timestamp: new Date().toISOString(),
      }));
      throw new Error("Heleket payment configuration is missing");
    }

    // 1. Build the object exactly as required
    const payload = {
      merchant_id: MERCHANT_ID,
      order_id: String(orderId),
      amount: Number(amount).toFixed(2),
      currency: "USD",
      email: email || "no-reply@example.com",
      success_url: successUrl,
      fail_url: failUrl,
      callback_url: callbackUrl,
    };

    // 2. Serialize to JSON (must match what axios sends over the wire)
    const jsonString = JSON.stringify(payload);

    // 3. Base64 Encode
    const base64Data = Buffer.from(jsonString).toString("base64");

    // 4. Create MD5 Sign: MD5(base64 + API_KEY)
    const sign = crypto
      .createHash("md5")
      .update(base64Data + API_KEY)
      .digest("hex");


    // 5. Send the request with headers
    const response = await axios.post(
      "https://api.heleket.com/v1/payment",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "sign": sign,
          "merchant": MERCHANT_ID
        }
      }
    );

    const result = response.data?.result || response.data;
    const urlField = result?.url || result?.redirect_url || result?.checkout_url || result?.payment_url || result?.link;
    return typeof result === 'string' ? result : urlField;
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error(JSON.stringify({
      tag: "[PAYMENT_ERROR]",
      provider: "Heleket",
      reason: "Checkout creation failed",
      detail,
      timestamp: new Date().toISOString(),
    }));

    const errorMsg = typeof detail === 'object' ? (detail.error || detail.message || JSON.stringify(detail)) : detail;
    throw new Error(errorMsg || "Heleket payment creation failed");
  }
};

/**
 * Validate Heleket IPN signature.
 * 
 * @param {string} signature - The signature from the request header.
 * @param {string} rawBody   - The RAW request body string (NOT the parsed object).
 *                              Using the raw string preserves the exact byte sequence
 *                              that Heleket used to compute its hash.
 * Returns false gracefully on any error — NEVER throws.
 */
const validateHeleketSignature = (signature, rawBody) => {
  try {
    const API_KEY = process.env.HELEKET_API_KEY;

    // ── Fail-safe: missing config ──
    if (!API_KEY) {
      console.error(JSON.stringify({
        tag: "[PAYMENT_ERROR]",
        provider: "Heleket",
        reason: "CRITICAL: MISSING CONFIG — HELEKET_API_KEY is undefined",
        secretStatus: "NOT_LOADED",
        timestamp: new Date().toISOString(),
      }));
      return false;
    }

    // ── Fail-safe: missing signature ──
    if (!signature) {
      console.warn("[Heleket] IPN received without a signature header.");
      return false;
    }

    // ── Fail-safe: missing body ──
    if (!rawBody) {
      console.warn("[Heleket] IPN received with an empty body.");
      return false;
    }

    // Use the raw body string directly — do NOT re-stringify a parsed object
    const base64Payload = Buffer.from(rawBody).toString('base64');
    const expectedSignature = crypto
      .createHash('md5')
      .update(base64Payload + API_KEY)
      .digest('hex');

    return expectedSignature === signature;
  } catch (err) {
    console.error(JSON.stringify({
      tag: "[PAYMENT_ERROR]",
      provider: "Heleket",
      reason: "Signature validation threw unexpectedly",
      error: err.message,
      timestamp: new Date().toISOString(),
    }));
    return false;
  }
};

module.exports = {
  createHeleketPayment,
  validateHeleketSignature,
};
