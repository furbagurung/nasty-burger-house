# Nasty Burger House

Mobile-first ordering website for Nasty Burger House, built with Next.js 16, React 19 and TypeScript.

## Current functionality

- Category and dietary menu filters
- Menu search with combined category and dietary filtering
- Accessible mobile navigation drawer with ordering status
- Multi-page category catalogue at `/menu/[category]`
- Product links that open the existing customisation and ordering flow
- Product-specific extras and ingredient removal
- Combo upgrades with required drink selection
- Configurable Beast Boxes
- Persistent editable cart with AUD totals
- Drip Points signup experience
- Frequency-capped promotional modals
- Pickup location and preparation-time placeholders
- Central service configuration with preview, open and closed modes
- Live service-status endpoint with automatic customer-page refresh
- Checkout availability enforced in both the interface and order endpoint
- Mobile checkout form with pickup, customer and order-review steps
- Server-side menu, modifier, combo, Beast Box and total validation
- Demo order references with clear payment and kitchen-delivery safeguards

The complete checkout path currently runs in demo mode. It validates orders but does not charge, persist or send them to the kitchen until the client confirms the payment/POS provider and supplies collaborator access.

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
- `app/data/service.ts` — truck status, location, hours and preparation settings
- `app/lib/order.ts` — shared pricing and order validation
- `app/lib/service.ts` — customer-facing service status and ordering rules
- `app/api/orders/route.ts` — server-side order submission endpoint
- `app/api/service-status/route.ts` — refreshable operating-status endpoint
- `app/components/order-experience.tsx` — ordering, promotional and cart behaviour
- `app/globals.css` — responsive presentation
- `Nasty_Burger_House_Development_Plan.md` — scope, status and remaining client inputs
