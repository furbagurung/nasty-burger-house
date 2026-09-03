# Nasty Burger House

Mobile-first ordering website for Nasty Burger House, built with Next.js 16, React 19 and TypeScript.

## Current functionality

- Full-screen homepage carousel for the signature burger, Beast of the Month and Beast Boxes
- Dark Nasty Burger House visual theme across the homepage and menu catalogue
- Accessible mobile navigation drawer with ordering status
- Multi-page category catalogue at `/menu/[category]`
- Product links that open the existing customisation and ordering flow
- Product-specific extras and ingredient removal
- Combo upgrades with required drink selection
- Configurable Beast Boxes
- Persistent editable cart with AUD totals
- Drip Points signup experience
- Frequency-capped promotional modals
- Fixed pickup location and preparation-time configuration
- Central ordering availability configuration with preview, open and closed modes
- Checkout availability enforced in both the interface and order endpoint
- Mobile checkout form with pickup, customer and order-review steps
- Server-side menu, modifier, combo, Beast Box and total validation
- Secure webhook dispatch for real pay-at-pickup orders
- Idempotency references to help the order receiver prevent duplicates

Checkout validates every price on the server and sends the complete pickup order
to the configured HTTPS webhook. No online payment is taken; customers pay when
they collect. Square can replace the temporary webhook after POS access arrives.

## Order delivery

Create `.env.local` for local development and configure the same values in
Vercel for production:

```bash
ORDER_WEBHOOK_URL=https://your-secure-order-receiver.example
ORDER_WEBHOOK_SECRET=optional-shared-bearer-token
```

The receiver must accept a JSON `POST` request and return a successful `2xx`
response. Without `ORDER_WEBHOOK_URL`, checkout stops safely instead of showing
a false order confirmation.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Validation

```bash
npm run lint
npm run build
```

## Main files

- `app/data/menu.ts` — menu, pricing and customisation rules
- `app/data/service.ts` — pickup availability, fixed address, hours and preparation settings
- `app/lib/order.ts` — shared pricing and order validation
- `app/lib/order-dispatch.ts` — secure pay-at-pickup order delivery adapter
- `app/lib/service.ts` — pickup availability and ordering rules
- `app/api/orders/route.ts` — server-side order submission endpoint
- `app/api/service-status/route.ts` — refreshable operating-status endpoint
- `app/components/order-experience.tsx` — ordering, promotional and cart behaviour
- `app/globals.css` — responsive presentation
- `Nasty_Burger_House_Development_Plan.md` — scope, status and remaining client inputs
