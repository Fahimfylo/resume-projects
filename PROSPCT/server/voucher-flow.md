# Voucher Generation Flow

## Overview

When a user purchases a special deal, the Thank You page POSTs the payment payload to the backend. The backend matches the payload against available `SpecialDeal` records in MongoDB, generates a unique voucher code prefixed with the matched deal's code, and returns it.

```
User checks out → Thank You page → POST /admin/special-deals/requests → match deal → return voucher code
```

---

## 1. Endpoint

| Method | Path | Auth |
|--------|------|------|
| POST | `/admin/special-deals/requests` | Optional `X-Api-Key` header (set via `VOUCHER_API_KEY` env) |

**CORS:** The server must allow the preview origin. The backend already has:
```
allowedHeaders: ["Content-Type", "Authorization", "X-Api-Key"]
origin: [frontend URLs]
```

---

## 2. Request Payload

```json
{
  "buyer": {
    "name": "string",
    "email": "string"
  },
  "plan": {
    "name": "string",
    "codes": 5,
    "description": "string (optional)"
  },
  "pricing": {
    "amount": 245,
    "currency": "USD"
  },
  "promo": {},
  "payment": {
    "invoice_number": "INV-UNIQUE-001",
    "method": "stripe"
  },
  "source": "web",
  "metadata": {}
}
```

**`invoice_number` (in `payment`) is required** — used for idempotency. Calling the same invoice twice returns the same voucher.

---

## 3. Matching Logic

The backend looks up `SpecialDeal` records from the database (admin-managed deals like DEAL1K–DEAL10K):

1. **Primary match by `plan.codes`** — finds the active deal where `codes` matches
2. **Fallback by `pricing.amount`** — if codes don't match, tries to match by `priceUSD`
3. **If no match** — generates a generic `PROSPCT-XXXX` code with no deal association

**Available deals in DB:**

| Deal Code | Codes | Price USD | Description |
|-----------|-------|-----------|-------------|
| DEAL1K | 1 | $49 | 1 Code — 5K Contacts + 5K Verifications |
| DEAL2K | 2 | $98 | 2 Codes — 10K Contacts + 10K Verifications |
| DEAL3K | 3 | $147 | 3 Codes — 15K + 15K |
| DEAL4K | 4 | $196 | 4 Codes — 20K + 20K |
| DEAL5K | 5 | $245 | 5 Codes — 25K + 25K |
| DEAL6K | 6 | $294 | 6 Codes — 30K + 30K |
| DEAL7K | 7 | $475 | 7 Codes — 35K + 35K |
| DEAL8K | 8 | $392 | 8 Codes — 40K + 40K |
| DEAL9K | 9 | $441 | 9 Codes — 45K + 45K |
| DEAL10K | 10 | $490 | 10 Codes — 50K + 50K |

---

## 4. Response

**Success (200):**

```json
{
  "success": true,
  "code": "DEAL5K-E108CDBA",
  "deal_code": "DEAL5K",
  "voucher": {
    "code": "DEAL5K-E108CDBA",
    "deal_code": "DEAL5K",
    "plan_codes": 5,
    "redeem_url": "https://app.prospct.io/redeem?code=DEAL5K-E108CDBA",
    "expires_at": null
  },
  "order_id": "INV-UNIQUE-001",
  "message": "Voucher generated for deal DEAL5K"
}
```

**Minimal shape also accepted by frontend:**
```json
{ "code": "DEAL5K-E108CDBA" }
```

**Error (non-2xx):**
```json
{ "message": "invoice_number is required" }
```

---

## 5. Idempotency

Sending the same `invoice_number` twice returns the existing voucher with message `"Voucher generated successfully (idempotent)"`. No duplicate is created.

---

## 6. Frontend Integration

### API Client (`src/lib/voucherApi.ts`)

The frontend uses `submitVoucherRequest(payload)` which:

1. Reads the API URL from:
   - `localStorage` key `voucher_api_url` (highest priority)
   - `VITE_VOUCHER_API_URL` env var
   - Defaults to `http://localhost:4000/admin/special-deals/requests`
2. Reads the API key from:
   - `localStorage` key `voucher_api_key`
   - `VITE_VOUCHER_API_KEY` env var
   - Falls back to no key
3. POSTs the payload with `Content-Type: application/json` and optional `X-Api-Key` header
4. Returns the normalized response (handles both full and minimal shapes)

### Thank You Page (`/thank-you`)

- URL params: `?apiUrl=https://...&apiKey=...` — saved to localStorage for all future flows
- Reads payload from `sessionStorage` key `voucher_payload`
- Calls `submitVoucherRequest` and displays the voucher code
- Copy-to-clipboard and "Redeem Now" link

### Setup for Lovable Preview

The Lovable preview URL can't reach `localhost:4000`. Two options:

**Option A — ngrok tunnel:**
```bash
ngrok http 4000
# → https://xxx.ngrok-free.app
```
Then visit: `/thank-you?apiUrl=https://xxx.ngrok-free.app/admin/special-deals/requests`

**Option B — Deploy backend:**
Set `VITE_VOUCHER_API_URL` to your deployed backend URL.

**Option C — Update env vars (for local dev with Vite proxy):**
Add to `.env`:
```
VITE_VOUCHER_API_URL=https://your-backend.com/admin/special-deals/requests
VITE_VOUCHER_API_KEY=your-key
```

---

## 7. Admin Viewing

Admin sees all voucher requests at **Special Deals → Voucher Requests** (`/admin/special-deals/voucher-requests`). Columns: Voucher Code, Invoice, Buyer, Plan, Created timestamp. Expandable payload view.

---

## 8. Testing

```bash
# Generate a voucher that matches DEAL5K (codes=5, price=$245)
curl -X POST "http://localhost:4000/admin/special-deals/requests" \
  -H "Content-Type: application/json" \
  -d '{
    "buyer": {"name": "Test", "email": "test@test.com"},
    "plan": {"name": "5 Codes Deal", "codes": 5},
    "pricing": {"amount": 245, "currency": "USD"},
    "payment": {"invoice_number": "INV-TEST-001", "method": "stripe"},
    "source": "web",
    "metadata": {}
  }'

# Expected: {"code":"DEAL5K-XXXX","deal_code":"DEAL5K",...}
```
