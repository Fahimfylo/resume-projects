const crypto = require("crypto");
const axios = require("axios");

const FASTSPRING_ACCESS_KEY = process.env.FASTSPRING_ACCESS_KEY;
const FASTSPRING_API_USER = process.env.FASTSPRING_API_USER;
const FASTSPRING_API_URL = "https://api.fastspring.com";
const FASTSPRING_STOREFRONT = process.env.FASTSPRING_STOREFRONT;

// ── Startup config validation ──


const fastSpringService = {
  /**
   * Create a Fast Spring checkout session
   */
  createCheckoutSession: async (orderId, items, userEmail, returnUrl) => {
    try {
      // Prepare order data for Fast Spring
      const orderData = {
        id: orderId,
        language: "en",
        email: userEmail,
        items: items.map((item) => ({
          product: item.productId || `${FASTSPRING_STOREFRONT}_${item.name}`,
          quantity: item.quantity || 1,
          sku: item.sku || item.name,
        })),
        customerId: orderId,
        return: returnUrl || `${process.env.FRONTEND_URL}/billing/success`,
      };

      // Create authorization header
      const auth = Buffer.from(
        `${FASTSPRING_API_USER}:${FASTSPRING_ACCESS_KEY}`
      ).toString("base64");

      // Send request to Fast Spring API
      const response = await axios.post(
        `${FASTSPRING_API_URL}/order`,
        orderData,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.id) {
        // Return Fast Spring checkout URL
        const checkoutUrl = `https://fastspring.com/?product=${FASTSPRING_STOREFRONT}&order=${response.data.id}`;
        return {
          orderId: response.data.id,
          checkoutUrl,
        };
      }

      throw new Error("Failed to create Fast Spring order");
    } catch (error) {
      console.error("Fast Spring Create Session Error:", error.message);
      throw new Error(
        `Fast Spring checkout failed: ${error.response?.data?.message || error.message}`
      );
    }
  },

  /**
   * Validate Fast Spring webhook signature.
   * Returns false gracefully on missing config — NEVER throws.
   */
  validateWebhookSignature: (signature, body, secret = FASTSPRING_WEBHOOK_SECRET) => {
    try {
      // ── Fail-safe: missing secret ──
      if (!secret) {
        console.error(JSON.stringify({
          tag: "[PAYMENT_ERROR]",
          provider: "FastSpring",
          reason: "CRITICAL: MISSING CONFIG — FASTSPRING_WEBHOOK_SECRET is undefined",
          secretStatus: "NOT_LOADED",
          timestamp: new Date().toISOString(),
        }));
        return false;
      }

      // ── Fail-safe: missing or empty signature header ──
      if (!signature || typeof signature !== "string") {
        console.warn("[FastSpring] Webhook received without a signature header.");
        return false;
      }

      // ── Fail-safe: missing or empty body ──
      if (!body) {
        console.warn("[FastSpring] Webhook received with an empty body.");
        return false;
      }

      // Compute HMAC SHA256
      const computedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      // Timing-safe comparison to prevent timing attacks
      const sigBuf = Buffer.from(signature, 'utf8');
      const compBuf = Buffer.from(computedSignature, 'utf8');
      if (sigBuf.length !== compBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, compBuf);
    } catch (error) {
      console.error(JSON.stringify({
        tag: "[PAYMENT_ERROR]",
        provider: "FastSpring",
        reason: "Signature validation threw unexpectedly",
        error: error.message,
        timestamp: new Date().toISOString(),
      }));
      return false;
    }
  },

  /**
   * Process Fast Spring webhook events
   */
  processWebhookEvent: async (event) => {
    try {
      const eventType = event.type;
      const eventData = event.data;


      switch (eventType) {
        case "order.completed":
          return {
            status: "COMPLETED",
            transactionId: eventData.id,
            orderId: eventData.id,
            amount: eventData.total,
            email: eventData.email,
            currency: eventData.currency || "USD",
            metadata: eventData,
          };

        case "order.payment.succeeded":
          return {
            status: "COMPLETED",
            transactionId: eventData.orderId,
            orderId: eventData.orderId,
            amount: eventData.amount,
            email: eventData.email,
            currency: eventData.currency || "USD",
            metadata: eventData,
          };

        case "order.payment.failed":
          return {
            status: "FAILED",
            transactionId: eventData.orderId,
            orderId: eventData.orderId,
            amount: eventData.amount,
            email: eventData.email,
            currency: eventData.currency || "USD",
            metadata: eventData,
          };

        case "subscription.activated":
          return {
            status: "COMPLETED",
            transactionId: eventData.id,
            orderId: eventData.id,
            subscriptionId: eventData.id,
            type: "SUBSCRIPTION",
            email: eventData.email,
            metadata: eventData,
          };

        case "subscription.deactivated":
          return {
            status: "CANCELLED",
            transactionId: eventData.id,
            subscriptionId: eventData.id,
            type: "SUBSCRIPTION",
            metadata: eventData,
          };

        default:
          return null;
      }
    } catch (error) {
      console.error("[FastSpring Service] Error processing webhook event:", error);
      throw error;
    }
  },

  /**
   * Get order details from Fast Spring
   */
  getOrderDetails: async (orderId) => {
    try {
      const auth = Buffer.from(
        `${FASTSPRING_API_USER}:${FASTSPRING_ACCESS_KEY}`
      ).toString("base64");

      const response = await axios.get(`${FASTSPRING_API_URL}/order/${orderId}`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Failed to get order details:", error.message);
      throw error;
    }
  },

  /**
   * Refund an order
   */
  /**
   * Generate a secure payload (server-side) for FastSpring's SBL.
   * Encrypts the checkout payload with AES-256-CBC, then wraps the
   * AES key with the RSA private key so the browser never sees either.
   */
  generateSecurePayload: (items, email, firstName, lastName) => {
    let FASTSPRING_PRIVATE_KEY = process.env.FASTSPRING_PRIVATE_KEY;
    if (!FASTSPRING_PRIVATE_KEY) {
      throw new Error("FASTSPRING_PRIVATE_KEY is not configured");
    }

    // ── Key normalisation ──────────────────────────────────────────────────────
    // dotenv stores newlines as the literal two-character sequence \n.
    // Node's crypto module requires actual newline characters (\u000A).
    // Without this replacement, privateEncrypt throws "error:09091064" and
    // the resulting secureKey is empty — causing FastSpring to return 400.
    FASTSPRING_PRIVATE_KEY = FASTSPRING_PRIVATE_KEY.replace(/\\n/g, "\n");

    if (!FASTSPRING_PRIVATE_KEY.includes("BEGIN")) {
      throw new Error("FASTSPRING_PRIVATE_KEY appears malformed after normalisation");
    }

    // 1. Build the payload FastSpring SBL expects
    const payload = {
      contact: { email, firstName, lastName },
      items: items.map((item) => ({
        product: item.product,
        quantity: item.quantity || 1,
        pricing: { price: { USD: Number(item.price) } },
        display: { en: item.label || item.product },
      })),
    };


    // 2. Encrypt payload with AES-128-ECB (FastSpring requires ECB mode, not CBC)
    //    AES key -> RSA-encrypted with private key (PKCS#1 v1.5 bt=0x01)
    const aesKey = crypto.randomBytes(16); // 128-bit key (ECB)
    const cipher = crypto.createCipheriv("aes-128-ecb", aesKey, null);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(payload), "utf8"),
      cipher.final(),
    ]);
    // FastSpring expects: base64( ciphertext ) — NO IV for ECB
    const securePayload = encrypted.toString("base64");

    // 3. Sign/wrap the AES key with the RSA private key (PKCS1 v1.5)
    //    FastSpring decrypts this on their end using your registered public key.
    //    The key must be encrypted with RSA_PKCS1_PADDING (not OAEP) per FastSpring spec.
    let encryptedKey;
    try {
      encryptedKey = crypto.privateEncrypt(
        { key: FASTSPRING_PRIVATE_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
        aesKey
      );
    } catch (rsaError) {
      console.error("[FastSpring] RSA privateEncrypt failed — check that FASTSPRING_PRIVATE_KEY is a valid PEM:", rsaError.message);
      throw new Error("RSA encryption failed: " + rsaError.message);
    }
    const secureKey = encryptedKey.toString("base64");


    return { securePayload, secureKey };
  },

  /**
   * Refund an order
   */
  refundOrder: async (orderId, reason = "Customer Request") => {
    try {
      const auth = Buffer.from(
        `${FASTSPRING_API_USER}:${FASTSPRING_ACCESS_KEY}`
      ).toString("base64");

      const response = await axios.post(
        `${FASTSPRING_API_URL}/order/${orderId}/refund`,
        { reason },
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Fast Spring refund error:", error.message);
      throw error;
    }
  },
};

module.exports = fastSpringService;
