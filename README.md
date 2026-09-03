# Nasty Burger House

Mobile-first ordering website for Nasty Burger House, built with Next.js 16, React 19 and TypeScript.

## Current functionality

- Category and dietary menu filters
- Product-specific extras and ingredient removal
- Combo upgrades with required drink selection
- Configurable Beast Boxes
- Persistent editable cart with AUD totals
- Drip Points signup experience
- Frequency-capped promotional modals
- Pickup location and preparation-time placeholders

Real checkout is intentionally disabled until the client confirms the payment/POS provider and supplies collaborator access.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm run build
```

## Main files

- `app/data/menu.ts` — menu, pricing and customisation rules
- `app/components/order-experience.tsx` — ordering, promotional and cart behaviour
- `app/globals.css` — responsive presentation
- `Nasty_Burger_House_Development_Plan.md` — scope, status and remaining client inputs
