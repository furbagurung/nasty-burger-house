# Nasty Burger House — Square Backend Setup

The custom Next.js frontend stays on Vercel. Square becomes the commerce backend for customer profiles, pickup orders and hosted card checkout.

## Current flow

1. Customer builds the cart on nastyburgerhouse.com.au.
2. The website validates prices and menu choices server-side.
3. The backend searches the Square Customer Directory by email/phone and creates a customer only when needed.
4. The backend creates a Square Order + Square-hosted payment link for ASAP pickup, pre-filling the buyer's email and phone from the validated checkout form.
5. The customer completes payment on Square.
6. Square redirects back to `/checkout/complete`.
7. Square webhook events are accepted at `/api/square/webhooks` after HMAC signature validation.
8. After Square verifies a completed, fully paid website pickup order, the restaurant receives its internal admin alert. The buyer receives a separate branded **Order confirmed & paid** email, with a hidden (BCC) copy to each configured restaurant notification address.

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
9. Check that Square pre-fills the email (and phone), while allowing the buyer to correct either. The customer confirmation must use the final email Square reports for the paid order.

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

Subscribe this exact webhook URL to **`payment.created`**, **`payment.updated`**, and **`order.updated`** in the Square Developer Console. The first two events are required for paid-order email alerts; `order.updated` is retained for existing Square Loyalty accrual. The application needs **`PAYMENTS_READ`** and **`ORDERS_READ`** permissions.

**Restaurant and customer order emails are sent only after Square confirms payment.** Checkout creation no longer sends a restaurant email or external order webhook. When a `payment.created` or `payment.updated` event reports `COMPLETED`, the server retrieves the payment and its order directly from Square, verifies a fully paid, website-created NBH pickup order at the configured location, then sends a restaurant-only alert to the configured admin addresses and a customer-friendly confirmation to the buyer email in Square's verified pickup fulfillment, BCC'ing a copy of that same confirmation to the configured admin addresses. Any configured `ORDER_WEBHOOK_URL` also receives the paid order. The customer email never includes an admin link, and the buyer cannot see the hidden admin recipients. The customer receipt intentionally includes `<meta name="color-scheme" content="light only">` so supported Gmail mobile clients with Google accounts preserve its paper color even when the app is dark. The email uses a full brand-red outer background (`#AC3342`), off-white paper (`#FFFCF7`), a generated lightweight crumpled-paper WebP texture (`public/images/email/receipt-paper-texture.webp`), a transparent cutout logo (`receipt-logo-cutout.webp`), separate torn-edge images, soft shadow and high-contrast condensed/monospaced system-font alternatives. The actual order information stays as HTML text and remains printable/selectable. Paper `bgcolor` fallbacks keep text legible when remote images are blocked. The publicly hosted assets are required in production before sending this email. The receipt uses the customer-supplied logo artwork as a light, transparent PNG (`receipt-source-logo.png`) and a prerendered condensed header PNG (`receipt-source-heading.png`) because email clients frequently replace custom display fonts. The narrow 344px customer-only layout keeps dates, item descriptions, totals, notes, website hyperlink, and Code 39 barcode as dynamic HTML. A textured repeating paper surface and CSS torn edges approximate the supplied crumpled-paper reference; the full reference photograph is not flattened into the message because order heights vary. Missing images fall back to readable near-white paper and live text. The existing admin notification template remains unchanged. Some email clients may suppress texture, cut-edge transparency or shadows; verify with a non-payment demo on Gmail Android in dark mode and another email client before rollout. The admin-only email has not been redesigned.

Resend uses **distinct**, stable Square order-based idempotency keys for the restaurant alert and buyer confirmation, so a retry of either channel cannot duplicate the other during normal webhook retries. **Resend retains idempotency keys for 24 hours**; longer-term deduplication would require a persistent delivery log. If Square fails to deliver a webhook, the email will not arrive: check the Square webhook delivery log and Vercel function logs. Ensure `RESEND_API_KEY`, `ORDER_NOTIFICATION_EMAIL` and `ORDER_NOTIFICATION_FROM` remain configured in Vercel. The buyer email uses the same verified sender (`ORDER_NOTIFICATION_FROM`), sends **To** the buyer email returned by Square and **BCC** to the comma-separated `ORDER_NOTIFICATION_EMAIL` admin recipients. It deduplicates admin addresses (case-insensitive), skips invalid admin addresses, and excludes the buyer's address from BCC. The internal restaurant-only alert is **never** sent to the buyer. Set `SQUARE_MERCHANT_SUPPORT_EMAIL` to a monitored restaurant inbox if buyers should reply there (otherwise replies go to the configured sender). No additional API key is required.

**After the next approved deployment, test in Sandbox first:**
1. Start checkout without paying: no restaurant order email should be sent.
2. Complete a test payment **using an email you own**: expect one **Paid Nasty order** internal admin alert, one customer **Order confirmed & paid** email in the buyer inbox, and a BCC copy of that confirmation at each configured admin address, with correct buyer, items and total.
3. Retry/replay the same payment event: no second internal alert, buyer confirmation, or admin BCC copy should arrive within the 24-hour idempotency window.
4. Send a failed, canceled, or partially paid event: no restaurant or customer confirmation should be sent.
5. Confirm existing `order.updated` loyalty handling still works.
6. Check Square's webhook delivery logs for 2xx responses and verify recipients in Resend. Never replay real customer payments when testing; Resend's 24-hour key retention does not prevent duplicates after the window.

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
