# Nasty Burger House — Square Backend Setup

The custom Next.js frontend stays on Vercel. Square becomes the commerce backend for customer profiles, pickup orders and hosted card checkout.

## Current flow

1. Customer builds the cart on nastyburgerhouse.com.au.
2. The website validates prices and menu choices server-side.
3. The backend searches the Square Customer Directory by email/phone and creates a customer only when needed.
4. The backend creates a Square Order + Square-hosted payment link for ASAP pickup.
5. The customer completes payment on Square.
6. Square redirects back to `/checkout/complete`.
7. Square webhook events are accepted at `/api/square/webhooks` after HMAC signature validation.

Square is the commerce source of truth. The website never receives raw card details.

## 1. Create / select a Square Developer application

Use the Square Developer Console for the seller account that owns Nasty Burger House. Domain ownership in Square does not automatically provide API credentials; the website needs a Square Developer application connected to the seller account.

Start in Sandbox first.

Required values:

- Sandbox or Production Access Token — secret, server only.
- Location ID — the Square location that should receive Nasty Burger House orders.
- Webhook signature key — secret, server only, after creating the webhook subscription.

Never paste production access tokens into chat, GitHub, screenshots or frontend code.

## 2. Local environment

Create `.env.local` in the project root:

```env
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=YOUR_SANDBOX_ACCESS_TOKEN
SQUARE_LOCATION_ID=YOUR_SANDBOX_LOCATION_ID
SQUARE_API_VERSION=2026-08-19
NEXT_PUBLIC_SITE_URL=http://localhost:3001
SQUARE_MERCHANT_SUPPORT_EMAIL=
```

Then run:

```powershell
npm run dev
```

Open:

```text
http://localhost:3001/api/square/status
```

A successful response should show `configured: true`, `connected: true`, and the selected Square location metadata. The access token is never returned by this endpoint.

## 3. Test checkout in Sandbox

Use the website normally:

1. Add products to the cart.
2. Open Checkout.
3. Enter pickup name, email and mobile number.
4. Choose **Continue to secure payment**.
5. The site should redirect to a Square-hosted checkout page.
6. Complete the test payment using Square Sandbox test payment data.
7. Square should return to `/checkout/complete`.
8. Confirm the order appears in the Square Sandbox order flow and the customer appears in Customer Directory.

Do not switch to Production until this whole flow works reliably.

## 4. Production Vercel environment variables

When ready to go live, add these in the Vercel project Environment Variables settings:

```env
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN=YOUR_PRODUCTION_ACCESS_TOKEN
SQUARE_LOCATION_ID=YOUR_PRODUCTION_LOCATION_ID
SQUARE_API_VERSION=2026-08-19
NEXT_PUBLIC_SITE_URL=https://www.nastyburgerhouse.com.au
SQUARE_MERCHANT_SUPPORT_EMAIL=
```

Redeploy manually after changing environment variables.

## 5. Square webhooks

Production notification URL:

```text
https://www.nastyburgerhouse.com.au/api/square/webhooks
```

Configure this exact URL in the Square Developer Console. Copy the generated signature key to Vercel:

```env
SQUARE_WEBHOOK_SIGNATURE_KEY=YOUR_SIGNATURE_KEY
SQUARE_WEBHOOK_NOTIFICATION_URL=https://www.nastyburgerhouse.com.au/api/square/webhooks
```

The URL in `SQUARE_WEBHOOK_NOTIFICATION_URL` must exactly match Square's configured notification URL because it is included in webhook signature validation.

Recommended events for the first production version include payment/order updates relevant to checkout completion and refunds. The endpoint already rejects notifications that fail Square HMAC-SHA256 validation.

## 6. Supabase retirement

The order creation and payment path no longer depends on Supabase. However, the repository still contains the previous Supabase-based custom account/admin implementation while the replacement product decision is completed.

Square Customer Directory is CRM/customer-profile storage, not a password-based website authentication service. Therefore complete Supabase deletion requires choosing the Square-only product behavior:

- customer checkout can remain guest/contact-based and use Square Customer Directory;
- staff can manage commerce orders in Square Dashboard instead of the old custom Supabase admin dashboard;
- Drip Points can move to Square Loyalty only after the seller has an active Square Loyalty program/subscription;
- the old password login, custom account order history and custom review storage should be removed or replaced rather than exposing Square customer records based only on an email/phone entry.

Do not delete the Supabase npm packages until all remaining Supabase imports have been retired, otherwise the Next.js build will fail.

## 7. Production cutover checklist

Before the first real order:

- Square production location is correct.
- Currency is AUD.
- A real low-value checkout has been successfully completed and refunded if appropriate.
- Pickup location and trading hours are confirmed.
- `NEXT_PUBLIC_SITE_URL` uses the final canonical domain.
- Webhook endpoint is HTTPS and signature validation passes.
- No Sandbox token remains in Production.
- No production Square access token is committed to Git.
