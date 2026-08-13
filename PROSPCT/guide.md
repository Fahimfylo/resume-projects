# Voucher Generation API – Integration Guide

This guide explains how to call the **voucher generation endpoint** that was added to the Prospct backend.

---

## 1. Endpoint

- **Method:** `POST`
- **URL (dev):** `http://localhost:4000/admin/special-deals/requests`
- **Production URL:** `https://<your‑domain>/admin/special-deals/requests`
- **Base path:** `/admin/special-deals/requests`

The route is mounted in `server/routes/voucherRoutes.js` and handled by `server/controllers/voucherController.js`.

---

## 2. Authentication (optional)

If the environment variable `VOUCHER_API_KEY` is defined on the server, every request **must** include the header:

```
X-Api-Key: <your‑api‑key>
```

If the variable is not set, the endpoint is publicly callable. You can enable the key later without code changes.

---

## 3. Request payload

The API accepts the full payload described in `redeem-request.md`. Only the `payment.invoice_number` (or the flat `invoice_number`) is required for idempotency. All other fields are optional but are stored for audit purposes.

**Example (full payload):**
```json
{
  "buyer": {
    "name": "Fahim | Rahman",
    "email": "testmail@gmail.com",
    "phone": "+8801786132611"
  },
  "plan": {
    "codes": 1,
    "contacts": 5000,
    "verifications": 5000,
    "email_seats": 0,
    "label": "1 Code"
  },
  "pricing": {
    "price_per_code_usd": 49,
    "subtotal_usd": 49,
    "promo_discount_usd": 0,
    "final_price_usd": 49,
    "final_price_bdt": 4900,
    "currency": "USD",
    "bdt_rate": 100
  },
  "promo": {
    "applied": false,
    "code": null,
    "discount_percent": 0
  },
  "payment": {
    "method": "paytic",
    "status": "success",
    "transaction_id": "PP-2026XXXX",
    "invoice_number": "PROSPCT-1C-1717810800000",
    "paid_at": "2026-06-08T03:10:42.000Z"
  },
  "source": {
    "origin": "https://get.prospct.io",
    "language": "en",
    "user_agent": "Mozilla/5.0 ...",
    "referrer": "https://get.prospct.io/#pricing"
  },
  "metadata": {
    "client_request_id": "req_8f42b1c3-5d9e-4a7b-b2e1-9c3f4d5a6e7b",
    "timestamp": "2026-06-08T03:10:42.000Z"
  }
}
```

A minimal payload (as described in the spec) is also accepted:
```json
{
  "buyer_name": "Fahim | Rahman",
  "buyer_email": "testmail@gmail.com",
  "buyer_phone": "+8801786132611",
  "plan_codes": 1,
  "amount_usd": 49,
  "payment_method": "paytic",
  "transaction_id": "PP-2026XXXX",
  "invoice_number": "PROSPCT-1C-1717810800000"
}
```

---

## 4. Response

### Success (`200 OK`)
```json
{
  "success": true,
  "code": "PROSPCT-8A3F2C1D",
  "deal_code": null,
  "voucher": {
    "code": "PROSPCT-8A3F2C1D",
    "deal_code": null,
    "plan_codes": 1,
    "redeem_url": "https://app.prospct.io/redeem?code=PROSPCT-8A3F2C1D",
    "expires_at": null
  },
  "order_id": "PROSPCT-1C-1717810800000",
  "message": "Voucher generated successfully"
}
```
If the same `invoice_number` (or `metadata.client_request_id`) is sent again, the existing voucher is returned – **idempotent** behavior.

### Errors
| Status | Code | Message |
|---|---|---|
| `400` | `INVALID_PAYLOAD` | Missing required fields (e.g., `invoice_number`). |
| `401` | `UNAUTHORIZED` | Invalid or missing `X-Api-Key` when the server expects one. |
| `500` | `INTERNAL_ERROR` | Unexpected server error or failure to generate a unique code. |

---

## 5. Example usage

### cURL
```bash
curl -X POST http://localhost:4000/admin/special-deals/requests \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -d @payload.json
```
Replace `@payload.json` with a file containing the JSON payload.

### JavaScript (fetch)
```js
async function generateVoucher(payload) {
  const response = await fetch('https://your-backend-domain.com/admin/special-deals/requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include this header only if VOUCHER_API_KEY is set on the server
      'X-Api-Key': 'YOUR_API_KEY',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Voucher generation failed:', data);
    return null;
  }
  return data;
}

// Example call
const payload = { /* ... as shown above ... */ };
generateVoucher(payload).then(console.log);
```

### Node.js (axios)
```js
const axios = require('axios');

axios.post('https://your-backend-domain.com/admin/special-deals/requests', payload, {
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': process.env.VOUCHER_API_KEY, // optional
  },
})
.then(res => console.log(res.data))
.catch(err => console.error(err.response?.data || err.message));
```
---

## 6. Idempotency
- The server uses `payment.invoice_number` (or the flat `invoice_number`) as an idempotency key.
- Re‑sending the same request **will not create a new voucher**; the original voucher data is returned.
- This allows safe retries from the client side if a network error occurs.

---

## 7. Deployment notes
1. **Environment variables**
   - `VOUCHER_API_KEY` – (optional) secret required in the `X‑Api‑Key` header.
   - `FRONTEND_URL` – used to build the `redeem_url` in the response. Defaults to `https://app.prospct.io`.
2. Ensure the server is restarted after adding the new route.
3. The endpoint is mounted **outside** the `/api` namespace because the spec requested `/admin/...`. Adjust the base path in `server.js` if you prefer a `/api` prefix.

---

**That’s it.** Use the URL above from any external site, send the JSON payload, and handle the JSON response as documented. If you need further customisation (e.g., additional validation or expiry dates) extend `server/models/Voucher.js` and `server/controllers/voucherController.js` accordingly.
