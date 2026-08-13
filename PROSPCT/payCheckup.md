# Payment Checkout Flow Audit & Fixes

Audit date: 2026-05-24

## Scope

All 4 payment checkout flows: **Heleket**, **Credit/Debit Card (Stripe)**, **Pay Pro Global**, **Fast Spring**. (Perfect Money removed — market discontinued)

## Gateway Status Summary

| Gateway | Pre-Fix | Post-Fix |
|---------|---------|----------|
| **Heleket** | ✅ Functional | ✅ Functional |
| **Pay Pro Global** | ✅ Functional | ✅ Functional |
| **Fast Spring** | ❌ Queue disabled, no transaction created, benefits never applied | ✅ Inline processing, transaction created before SBL popup, webhook fulfills |
| **Credit/Debit Card (Stripe)** | ❌ No transaction created, webhook only logged | ✅ Transaction created, `transactionId` passed via metadata, webhook fulfills |

---

## Issues Found & Fixed

### 1. FastSpring — Bull Queue Disabled

**File:** `server/queues/fastSpringQueue.js`

**Root cause:** Bull queue was set to `null` due to Redis connection issues. All webhook events were idempotency-recorded but silently dropped — no `updateTransactionStatus` or `applyTransactionBenefits` ever ran.

**Fix:** Replaced the Bull queue with a simple inline processor object. The `add()` method now processes events synchronously. No Redis dependency required.

**Also added:** SBL flow email-based fallback. FastSpring SBL webhooks contain the FastSpring order ID (not our MongoDB ID) as `transactionId`. When `updateTransactionStatus` fails to find a matching document by that ID, the processor falls back to looking up the user by email and finding their most recent `PENDING` FastSpring transaction.

---

### 2. FastSpring SBL — No Transaction Created

**File:** `server/controllers/paymentController.js` — `fastSpringSecurePayload`

**Root cause:** The SBL flow (`fastspring/secure-payload`) only generated an encrypted payload for FastSpring's popup. It never created a `Transaction` document. When the webhook arrived, there was nothing to update or fulfill.

**Fix:** Now creates a `PENDING` Transaction before generating the secure payload. The transaction ID is returned in the response (for client-side tracking). The webhook processor uses the email-based fallback to match and fulfill the transaction.

**Client changes:**
- `client/src/hooks/useCheckout.js` — passes `productData` (with `planId`, `billingCycle`) to `pushToFastSpring`
- `client/src/payment/gateway/FastSpring.js` — forwards `productData` to the `secure-payload` endpoint so the transaction has proper plan/credit items

---

### 3. Stripe — Missing Fulfillment

**File:** `server/services/stripeService.js`

**Root cause:** The `handleWebhook` function only logged `checkout.session.completed` events. No `updateTransactionStatus` or `applyTransactionBenefits` was ever called.

**Fix:**
1. `createCheckoutSession` now accepts a `metadata` parameter (passed as Stripe session metadata)
2. `handleWebhook` extracts `transactionId` from `session.metadata`, updates the transaction to `COMPLETED`, and calls `applyTransactionBenefits`

**File:** `server/controllers/paymentController.js` — `stripeCreateCheckoutSession`

**Root cause:** No Transaction document was created before redirecting the user to Stripe.

**Fix:** Now creates a `PENDING` Transaction first, passes its `_id` as `transactionId` in Stripe session metadata, and saves the Stripe session ID on the transaction.

---

### 4. Heleket — Already Functional

- Creates Transaction in `heleketCheckout`
- Validates MD5 signature in `heleketIPN`
- Checks idempotency (skips if already `COMPLETED`)
- Amount integrity check
- Maps statuses (`paid`/`paid_over` → `COMPLETED`, `fail`/`cancel` → `FAILED`, `wrong_amount` → `PARTIAL_PAYMENT`)
- Atomic credit increment + `applyTransactionBenefits` for plan upgrades

No changes needed.

---

### 5. Pay Pro Global — Already Functional

- Creates Transaction in `payProGlobalCheckout`
- Passes `x-transaction-id` in encrypted product data
- `PayProGlobalIPN` extracts `transactionId` from `ORDER_CUSTOM_FIELDS` regex match
- Updates status to `COMPLETED` when `ORDER_STATUS === "Processed"`
- Calls `applyTransactionBenefits`

No changes needed.

---

## Files Modified

| # | File | Change |
|---|------|--------|
| 1 | `server/queues/fastSpringQueue.js` | Replaced Bull queue with inline processor + email fallback |
| 2 | `server/controllers/paymentController.js` | Fixed `stripeCreateCheckoutSession` (add txn), `fastSpringSecurePayload` (add txn) |
| 3 | `server/services/stripeService.js` | Added metadata support to `createCheckoutSession` + fulfillment in `handleWebhook` |
| 4 | `client/src/payment/gateway/FastSpring.js` | Forwards `productData` to `secure-payload` |

## Architecture Pattern (applied consistently)

Every gateway now follows this flow:

1. **Client** sends product data + amount to server
2. **Server** creates a `PENDING` Transaction (status, items, user, gateway, total)
3. **Server** returns the gateway-specific checkout URL/form/payload
4. **Client** redirects user to the gateway (or opens popup/modal)
5. **Gateway** sends webhook/IPN to server on success
6. **Server** validates signature, finds Transaction by ID, updates status to `COMPLETED`
7. **Server** calls `transactionService.applyTransactionBenefits(userId, transaction)` for plan upgrades + credit additions
