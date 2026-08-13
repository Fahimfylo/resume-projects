/**
 * testFastSpringWebhook.js
 * 
 * Automated test script for FastSpring webhook processing.
 * Usage: node server/scripts/testFastSpringWebhook.js
 * 
 * Prerequisites:
 *   - Server running on http://localhost:4000
 *   - FASTSPRING_WEBHOOK_SECRET set in environment
 */

const crypto = require("crypto");
const axios = require("axios");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:4000";
const WEBHOOK_SECRET = process.env.FASTSPRING_WEBHOOK_SECRET || "test-secret";
const ENDPOINT = `${BASE_URL}/api/payment/fastspring/webhook`;

// ── Helpers ────────────────────────────────────────────────────────────────

function sign(body) {
  return crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
}

async function sendWebhook(label, payload) {
  const body = JSON.stringify(payload);
  const signature = sign(body);

  try {
    const response = await axios.post(ENDPOINT, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-fs-signature": signature,
      },
    });
    return response;
  } catch (err) {
    const status = err.response?.status || "ERR";
    const data = err.response?.data || err.message;
    console.error(`❌  [${label}] ${status} →`, data);
    return null;
  }
}

// ── Test Payloads ──────────────────────────────────────────────────────────

const ORDER_ID = "TEST-ORD-001";
const EVENT_ID_COMPLETED = "fs-evt-order-completed";
const EVENT_ID_SUBSCRIPTION = "fs-evt-sub-activated";

const orderCompletedPayload = {
  events: [
    {
      id: EVENT_ID_COMPLETED,
      type: "order.completed",
      data: {
        id: ORDER_ID,
        total: 49.99,
        email: "test@example.com",
        currency: "USD",
      },
    },
  ],
};

const duplicateOrderCompletedPayload = {
  events: [
    {
      id: EVENT_ID_COMPLETED, // Same id — should be skipped by idempotency check
      type: "order.completed",
      data: {
        id: ORDER_ID,
        total: 49.99,
        email: "test@example.com",
        currency: "USD",
      },
    },
  ],
};

const subscriptionActivatedPayload = {
  events: [
    {
      id: EVENT_ID_SUBSCRIPTION,
      type: "subscription.activated",
      data: {
        id: "SUB-001",
        email: "test@example.com",
        state: "active",
      },
    },
  ],
};

const subscriptionDeactivatedPayload = {
  events: [
    {
      id: "fs-evt-sub-deactivated",
      type: "subscription.deactivated",
      data: {
        id: "SUB-001",
        state: "canceled",
      },
    },
  ],
};

const invalidSignaturePayload = {
  events: [{ id: "fs-evt-bad", type: "order.completed", data: {} }],
};

// ── Run Tests ──────────────────────────────────────────────────────────────

(async () => {

  // 1. Valid order.completed event
  await sendWebhook("order.completed", orderCompletedPayload);

  // 2. Duplicate event — idempotency guard should skip it
  await sendWebhook("order.completed DUPLICATE", duplicateOrderCompletedPayload);

  // 3. Subscription activated
  await sendWebhook("subscription.activated", subscriptionActivatedPayload);

  // 4. Subscription deactivated / cancelled
  await sendWebhook("subscription.deactivated", subscriptionDeactivatedPayload);

  // 5. Invalid signature — should return 400
  try {
    const body = JSON.stringify(invalidSignaturePayload);
    const badSig = "bad-signature-value";
    const r = await axios.post(ENDPOINT, invalidSignaturePayload, {
      headers: { "Content-Type": "application/json", "x-fs-signature": badSig },
    });
  } catch (err) {
    const status = err.response?.status;
    if (status === 400) {
    } else {
      console.error(`❌  [invalid signature] Unexpected status: ${status}`, err.response?.data);
    }
  }

})();
