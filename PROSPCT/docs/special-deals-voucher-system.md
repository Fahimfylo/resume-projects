# Special Deals & Voucher System — Architecture

## Overview

Two parallel flows: **Legacy Special Deal codes** (direct redeem + admin approval) and **Voucher System** (external purchase → API generation → user redeem).

---

## Files

### Routes (mounted in `server/server.js`)

| Mount Path | Route File |
|---|---|
| `/api/special-deals` | `routes/redemptionRoutes.js` |
| `/api/special-deals` | `routes/specialDealRoutes.js` |
| `/admin/special-deals/requests` | `routes/voucherRoutes.js` |
| `/api/vouchers` | `routes/voucherRedeemRoutes.js` |
| `/api/payment/fastspring/webhook` | `routes/paymentRoutes.js` |

### Controllers

- `controllers/specialDealController.js` — CRUD + direct redeem
- `controllers/redemptionController.js` — Admin approval flow
- `controllers/redemptionLogController.js` — Redemption logs
- `controllers/voucherController.js` — Voucher generation (external API)
- `controllers/voucherRedeemController.js` — Validate + redeem + register-and-redeem

### Models

- `models/SpecialDeal.js` — Deal definitions
- `models/SpecialDealRedemption.js` — User redemption requests
- `models/Voucher.js` — Generated vouchers
- `models/VoucherRedemptionLog.js` — Audit log
- `models/FastSpringEvent.js` — Webhook events (idempotency)

### Frontend

- `client/src/components/admin/specialDeal/AddSpecialDeal.jsx`
- `client/src/components/admin/specialDeal/UpdateSpecialDeal.jsx`
- `client/src/components/admin/specialDeal/ViewSpecialDeals.jsx`
- `client/src/components/admin/specialDeal/VoucherRequests.jsx`
- `client/src/pages/payment/RedeemPage.jsx` — Public voucher redeem
- `client/src/pages/payment/VoucherThankYouPage.jsx` — Post-purchase thank you
- `client/src/lib/voucherApi.ts` — API client for external voucher submission

---

## Endpoints & Authorization

### Special Deal CRUD (admin only — `adminMiddleware` = JWT + `role === "admin"`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/special-deals/` | List all deals |
| GET | `/api/special-deals/search` | Search deals |
| GET | `/api/special-deals/:id` | Get single deal |
| POST | `/api/special-deals/add` | Create deal |
| PUT | `/api/special-deals/update/:id` | Update deal |
| DELETE | `/api/special-deals/delete/:id` | Delete deal |

### Direct Redeem (authenticated user)

| Method | Path | Auth |
|---|---|---|
| POST | `/api/special-deals/redeem` | `authMiddleware` (any logged-in user) |

Validates deal, increments credits via `$inc`, increments `timesRedeemed`.

### Admin Approval Flow

| Method | Path | Auth |
|---|---|---|
| POST | `/api/special-deals/request-redeem` | `authMiddleware` (user) |
| GET | `/api/special-deals/requests/pending` | `adminMiddleware` |
| POST | `/api/special-deals/requests/approve/:id` | `adminMiddleware` |
| POST | `/api/special-deals/requests/reject/:id` | `adminMiddleware` |
| GET | `/api/special-deals/assigned` | `adminMiddleware` |
| POST | `/api/special-deals/assigned/suspend/:id` | `adminMiddleware` |
| POST | `/api/special-deals/assigned/unsuspend/:id` | `adminMiddleware` |
| DELETE | `/api/special-deals/assigned/delete/:id` | `adminMiddleware` |

### Voucher API (external → admin)

| Method | Path | Auth |
|---|---|---|
| POST | `/admin/special-deals/requests` | Optional `X-Api-Key` header matching `VOUCHER_API_KEY` env |
| GET | `/admin/special-deals/requests` | `adminMiddleware` |
| GET | `/admin/special-deals/requests/redemption-logs` | `adminMiddleware` |

### Voucher Redeem (public-facing)

| Method | Path | Auth |
|---|---|---|
| GET | `/api/vouchers/validate/:code` | **Public** — no auth |
| POST | `/api/vouchers/redeem` | `authMiddleware` (logged-in user) |
| POST | `/api/vouchers/register-and-redeem` | **Public** — no auth |

### FastSpring Webhook (external)

| Method | Path | Auth |
|---|---|---|
| POST | `/api/payment/fastspring/webhook` | HMAC signature validation via `x-fs-signature` |
| POST | `/api/payment/fastspring/checkout` | `authMiddleware` + `workspaceContextMiddleware` + `requireOwnerOnly` |
| POST | `/api/payment/fastspring/secure-payload` | Same as above |

---

## Data Flows

### Flow A: Special Deal — Direct Code Redeem

```
Admin creates deal via POST /api/special-deals/add
  → Stored in SpecialDeal collection

User enters code → POST /api/special-deals/redeem (JWT)
  → Validates: isActive, not expired, maxRedeems not reached
  → User.findByIdAndUpdate with $inc on credits.{email,phone,verification,export}.{current,max}
  → SpecialDeal.findByIdAndUpdate with $inc timesRedeemed
  → Returns { success, granted }
```

### Flow B: Special Deal — Admin Approval

```
User requests → POST /api/special-deals/request-redeem
  → Creates SpecialDealRedemption { status: "pending" }

Admin approves → POST /api/special-deals/requests/approve/:id
  → Grants credits to User
  → Updates redemption: status="approved", approvedAt, approvedBy
  → Increments timesRedeemed

Admin rejects → POST /api/special-deals/requests/reject/:id
  → Sets status="rejected" with reason
```

### Flow C: Voucher System — External Purchase → Redeem

```
1. User purchases on external site (Stripe, FastSpring, etc.)

2. External site redirects to /thank-you?apiUrl=...&apiKey=...
   → VoucherThankYouPage.jsx reads payload from sessionStorage
   → Calls voucherApi.submitVoucherRequest(payload)

3. voucherApi.ts POSTs to /admin/special-deals/requests
   Headers: { X-Api-Key: <apiKey> }
   Body: { buyer, plan, pricing, promo, payment, source, metadata }
   API URL: localStorage > VITE_VOUCHER_API_URL env > API_CONFIG.API_ENDPOINT
   API Key: localStorage > VITE_VOUCHER_API_KEY env > empty string

4. voucherController.generateVoucher (server):
   - Validates X-Api-Key (if VOUCHER_API_KEY is set in .env)
   - Extracts invoice_number (required, for idempotency)
   - Checks duplicate invoice_number → returns existing voucher if found
   - Matches deal: tries payload.plan.codes first, then payload.pricing.amount
   - Generates unique code: "{deal.code}-{random hex}" or "PROSPCT-{random hex}"
   - Enforces maxRedeems across vouchers + direct redeems
   - Stores Voucher document
   - Returns { success, code, deal_code, voucher: { code, deal_code, plan_codes, redeem_url, expires_at }, order_id }

5. External site receives voucher code → shows to user or redirects
   redeem_url format: {FRONTEND_URL}/redeem?code={voucherCode}

6a. Existing user redeems:
   → GET /api/vouchers/validate/:code (public) — returns deal info
   → POST /api/vouchers/redeem (JWT) — grants credits, marks voucher redeemed

6b. New user redeems (register + redeem in one step):
   → GET /api/vouchers/validate/:code (public)
   → POST /api/vouchers/register-and-redeem (public)
       - Validates no duplicate email
       - Creates User + Subscription (100-year Free plan)
       - grantCreditsToUser() — increments credits
       - logCreditLedger() — records EMAIL, PHONE, VERIFICATION, EXPORT entries
       - Marks voucher as redeemed (redeemedBy, redeemedAt)
       - Increments SpecialDeal.timesRedeemed
       - Creates VoucherRedemptionLog { status: "success" }
       - Returns JWT token + user data + credits
```

### Flow D: FastSpring Webhook

```
FastSpring → POST /api/payment/fastspring/webhook
  → Validates HMAC-SHA256 signature via fastSpringService.validateWebhookSignature()
  → 400 if signature invalid
  → Creates FastSpringEvent (unique eventId prevents duplicate processing)
  → Enqueues to fastSpringQueue (Bull/Redis)

fastSpringQueue processes:
  → Maps event type: "order.completed" → COMPLETED, etc.
  → Updates Transaction status via transactionService.updateTransactionStatus()
  → SBL fallback: if transaction not found by ID, searches by email
  → If COMPLETED: transactionService.applyTransactionBenefits()
      (plan upgrades, credit purchases with ACID transaction via session)
  → If subscription: syncSubscriptionState()
```

---

## Models

| Collection | Key Fields | Purpose |
|---|---|---|
| `SpecialDeal` | `code`, `codes[]`, `description`, `priceUSD`, `emailCredits`, `phoneCredits`, `verificationCredits`, `exportCredits`, `isActive`, `maxRedeems`, `timesRedeemed`, `expiresAt` | Deal definitions |
| `SpecialDealRedemption` | `userId`, `dealId`, `status` (pending/approved/rejected/suspended), `approvedBy`, `approvedAt` | User redemption requests |
| `Voucher` | `voucherCode`, `dealCode`, `invoiceNumber`, `payload` (Mixed), `status` (active/redeemed/expired), `redeemedBy`, `redeemedAt`, `expiresAt` | Generated vouchers |
| `VoucherRedemptionLog` | `voucherCode`, `userId`, `email`, `status` (success/failed), `errorMessage`, `metadata` | Audit trail |
| `FastSpringEvent` | `eventId` (unique), `type`, `body` (raw), `processed` | Webhook idempotency |

---

## Environment Variables

| Variable | Used For |
|---|---|
| `VOUCHER_API_KEY` | Optional auth for voucher generation endpoint |
| `FASTSPRING_ACCESS_KEY` | FastSpring API access credential |
| `FASTSPRING_STOREFRONT` | Storefront ID for checkout URLs |
| `FASTSPRING_WEBHOOK_SECRET` | HMAC secret for webhook signature validation |
| `FASTSPRING_PRIVATE_KEY` | RSA key for SBL payload encryption |
| `FRONTEND_URL` | Base URL for voucher redeem links |
| `JWT_SECRET` | JWT signing (for user tokens in register-and-redeem) |

---

## Key Characteristics

1. **Idempotency** — Voucher generation uses `invoice_number` to prevent duplicates. FastSpring events use `eventId` unique index for the same purpose.

2. **No auth on validate endpoint** — `GET /api/vouchers/validate/:code` is fully public. Anyone can check if a code is valid.

3. **No auth on register-and-redeem** — Public endpoint that creates a user + redeems a voucher atomically.

4. **Optional API key** — `X-Api-Key` header is checked only if `VOUCHER_API_KEY` is set in `.env`. If not set, the voucher generation endpoint is open.

5. **Deal matching** — Vouchers match to a `SpecialDeal` by `payload.plan.codes` first, then by `payload.pricing.amount` as fallback.

6. **Credit granting** — Uses `$inc` on both `credits.{type}.current` and `credits.{type}.max`. Every grant is logged to `CreditLedger`.

7. **Queue-based processing** — FastSpring webhooks go through Bull/Redis queue for async processing with automatic retry.

8. **Local tunnel** — `server/scripts/tunnel.js` uses localtunnel (subdomain: `prospctvoucher`) to expose localhost:4000 publicly for webhook testing during development.

---

## External API Endpoints Called

| Service | Endpoint | Purpose |
|---|---|---|
| FastSpring | `POST https://api.fastspring.com/order` | Create checkout session |
| FastSpring | `GET https://api.fastspring.com/order/{orderId}` | Get order details |
| FastSpring | `POST https://api.fastspring.com/order/{orderId}/refund` | Refund an order |
| FastSpring | `https://fastspring.com/?product={storefront}&order={id}` | Checkout URL redirect |
