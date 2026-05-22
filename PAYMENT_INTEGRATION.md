# 🇪🇹 BEKI Shop — Ethiopian Payment Integration Guide

## What's Integrated

| Payment Method | Provider | Currency | How it works |
|---|---|---|---|
| **Telebirr** | Chapa → Telebirr | ETB | Customer enters Telebirr PIN on Chapa page |
| **CBEBirr** | Chapa → CBEBirr | ETB | CBE mobile banking authentication |
| **M-Pesa** | Chapa → M-Pesa | ETB | Safaricom M-Pesa PIN |
| **Amole** | Chapa → Amole | ETB | Dashen Bank Amole wallet |
| **Visa/Mastercard** | Chapa → Card | ETB | International cards via Chapa |
| **Cash on Delivery** | Manual | ETB/USD | Admin marks paid on delivery |

All Ethiopian digital payments are handled through **Chapa** (`chapa.co`), which is the leading Ethiopian payment gateway.

---

## Setup Steps

### 1. Create a Chapa Account
- Go to: https://dashboard.chapa.co/register
- Register as a **Business** (not personal) for live payments
- Complete KYC (Ethiopian business license, bank details)
- For testing, use the **test environment** immediately (no KYC needed)

### 2. Get API Keys
In the Chapa Dashboard → **Settings → API Keys**:
- **Test secret key**: `sk-test-xxxxxxxx` (safe to use in development)
- **Live secret key**: `sk-live-xxxxxxxx` (use only in production)

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in:

```env
CHAPA_SECRET_KEY=sk-test-your_key_here
CHAPA_WEBHOOK_SECRET=your_webhook_secret   # Optional but recommended
SERVER_URL=https://yourdomain.com          # Must be public HTTPS for webhooks
ETB_PER_USD=130                            # Update with current rate
```

### 4. Set Up Webhook (Recommended)
In Chapa Dashboard → **Settings → Webhooks**:
- URL: `https://yourdomain.com/api/payment/chapa/webhook`
- Copy the webhook secret to `CHAPA_WEBHOOK_SECRET` in `.env`

> **Why webhooks?** Webhooks ensure orders get marked as paid even if the user closes the browser before being redirected back.

### 5. Database Migration
The app auto-migrates on startup (`sequelize.sync({ alter: true })`).
For existing databases, you can also run:
```bash
psql $DATABASE_URL -f server/db/migration_add_chapa.sql
```

### 6. Install Dependencies
```bash
cd server
npm install
```
(`axios` is now required instead of `stripe`)

---

## Payment Flow

```
Customer selects payment → Place Order (order created in DB) 
  → POST /api/payment/chapa/initiate 
  → Chapa returns checkout_url 
  → Customer redirected to Chapa hosted page 
  → Customer pays (Telebirr PIN / bank / card)
  → Chapa calls webhook → order marked paid (server-to-server, most reliable)
  → Chapa redirects customer to /order-success/:id?tx_ref=xxx
  → Frontend calls GET /api/payment/chapa/verify/:txRef (secondary verification)
  → Order confirmed to customer
```

---

## Test Cards / Accounts

For testing (use `sk-test-*` key):

| Method | Test credentials |
|---|---|
| Telebirr | Use any Ethiopian phone number in test mode |
| Card | `4200000000000000` · Any future date · Any CVV |
| CBEBirr | Any test account number |

See full test guide: https://developer.chapa.co/docs/test-credentials

---

## Exchange Rate

By default the app uses a hardcoded `ETB_PER_USD` env var.
For production, edit `server/utils/exchangeRate.js` to use a live FX API:
- **Open Exchange Rates**: https://openexchangerates.org (free tier: 1000 req/month)
- **Fixer.io**: https://fixer.io

---

## API Endpoints Added

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/payment/chapa/initiate` | Start Chapa payment, get checkout URL |
| `POST` | `/api/payment/chapa/webhook` | Chapa server-to-server callback |
| `GET`  | `/api/payment/chapa/verify/:txRef` | Frontend verifies after redirect |
| `PUT`  | `/api/payment/cod/verify/:orderId` | Admin marks COD as paid |
| `GET`  | `/api/orders/etb-rate` | Get current USD→ETB rate |

---

## Files Changed

### Server
- `server/routes/payment.js` ← **NEW** — all Chapa logic
- `server/routes/orders.js` ← Updated — removed Stripe, added ETB conversion
- `server/models/index.js` ← Added Chapa columns + payment method ENUMs
- `server/middleware/validate.js` ← Added new payment method values
- `server/utils/exchangeRate.js` ← **NEW** — USD→ETB conversion
- `server/index.js` ← Registered `/api/payment` route
- `server/package.json` ← Replaced `stripe` with `axios`
- `server/.env.example` ← Added Chapa vars

### Client
- `client/src/pages/Checkout.jsx` ← Full Ethiopian payment UI
- `client/src/pages/OrderSuccess.jsx` ← Handles Chapa redirect + verification

---

## Going Live Checklist

- [ ] Chapa account approved (KYC complete)
- [ ] Switch `CHAPA_SECRET_KEY` to `sk-live-*`
- [ ] Set `SERVER_URL` to your public domain (HTTPS required for webhooks)
- [ ] Configure webhook in Chapa dashboard
- [ ] Set `ETB_PER_USD` or connect live FX API
- [ ] Test a real Telebirr payment of 10 ETB
- [ ] Enable HTTPS on your server

---

## Support
- Chapa Docs: https://developer.chapa.co
- Chapa Support: support@chapa.co
- Chapa Dashboard: https://dashboard.chapa.co
