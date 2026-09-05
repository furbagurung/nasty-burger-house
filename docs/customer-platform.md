# Nasty Burger House customer platform

## What works in the development build

The frontend now has standalone Cart, Checkout, Account, Sign in, Account creation, Order history, Order detail, Drip Points and Reviews pages.

For the development branch, customer identity, order history, Drip ledger and reviews are stored on the current browser/device so the full UX can be tested without storing passwords or pretending browser storage is secure authentication.

Checkout posts validated orders to `/api/orders`. The server recalculates the order subtotal, calculates eligible Drip Points for signed-in members and sends the validated order payload to `ORDER_WEBHOOK_URL` when configured. The payload includes customer, fulfilment, payment, line items, loyalty earning and the notification email.

## Drip Points rules currently configured

- Signup bonus: 500 points once per customer.
- Earning: 10 points per A$1 of validated order subtotal.
- Reward target: 2,000 points for the free Beast Burger Meal target already referenced by the customer messaging.
- Order earning is idempotent by order ID in the development store and should remain unique per customer/order in production.
- Production redemption must happen server-side in a database transaction so the same points cannot be redeemed twice.

These constants live in `app/lib/loyalty.ts` so business rules can be changed centrally.

## Production data model

`database/customer-platform-schema.sql` contains the initial PostgreSQL model for:

- customers
- orders
- order lines
- Drip Points ledger
- reward redemptions
- reviews

Authentication credentials should be managed by a dedicated authentication provider. Raw passwords must never be stored in localStorage or in the application customer table.

## Admin order notifications

Environment variables:

- `ORDER_WEBHOOK_URL`: HTTPS endpoint that receives each validated order.
- `ORDER_WEBHOOK_SECRET`: optional bearer secret used to authenticate the webhook request.
- `ORDER_NOTIFICATION_EMAIL`: the admin/kitchen inbox included in the dispatch payload.

When the webhook is not configured, the development checkout uses the existing temporary fallback and records `adminNotification: not-configured` in local order history. When the webhook accepts the order, the API returns `adminNotification: sent`.

The production receiver should persist the order before acknowledging the webhook and then notify the configured admin channel (email, POS, kitchen display or another operational system).

## Next backend milestone

1. Provision a PostgreSQL database and authentication provider.
2. Apply `database/customer-platform-schema.sql`.
3. Replace the browser customer store with authenticated server APIs while retaining the same UI routes.
4. Persist orders server-side before returning checkout success.
5. Award Drip Points in the same server transaction as accepted orders.
6. Add admin order status updates (`received → preparing → ready → completed`).
7. Stream those status updates into `/account/orders/[orderId]`.
8. Allow reward redemption only through a server transaction that writes a negative Drip ledger entry and a unique reward redemption code.
9. Persist reviews and expose moderation controls to the admin side.
