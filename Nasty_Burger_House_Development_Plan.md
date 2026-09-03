# Nasty Burger House Website Development Plan

**Project owner:** Brahmanda Tech  
**Target launch:** September 10, 2026  
**Approach:** Ground-up, mobile-first website development

## 1. Project Goal

Create a high-converting food-truck ordering website that helps customers:

- See today’s truck location, opening status and estimated preparation time
- Browse and filter the menu quickly on mobile
- Customize items with one-tap modifiers
- Upgrade eligible items to combos with drink selection
- Add Beast Boxes and monthly specials
- Join the Drip Points loyalty programme
- Complete pickup orders using an express mobile checkout

## 2. Current Development Status

### Phase 1 — Ordering foundation (completed)

- New website project created from scratch
- Responsive desktop and mobile layouts
- Draft truck status and location banner
- Cinematic burger hero section
- Beast of the Month feature
- Updated menu without a standalone Combo category
- Slide-out shopping cart
- Mobile sticky Find Us / Order Now bar
- Drip Points sign-up modal with email and phone
- Compressed WebP food imagery

### Phase 2 — Frontend ordering engine (completed September 3)

- Full supplied burger, side, Little Beasts, dessert, drink and Beast Box menu
- Updated drinks: Coca-Cola, Coke Zero, Solo and Water
- Category and Halal/vegetarian filters
- Item-specific modifiers with quantity controls and calculated pricing
- Ingredient-removal options per eligible item
- Combo upgrade validation with required adult or kids' drink selection
- Configurable Solo, Duo and Family Beast Boxes with exact burger/drink quotas
- Persistent cart with accurate AUD subtotal calculations
- Edit, remove and quantity controls for every cart line
- Beast Box cart upsell
- Automated loyalty and Beast of the Month prompts with frequency capping
- Overlay sequencing that prevents simultaneous pop-ups
- Empty, validation and success states for the ordering flow
- Lint, TypeScript and production build validation passed

### Phase 3 — Checkout and order submission (completed September 3)

- Mobile checkout with pickup, customer contact and order-review steps
- Required customer fields, optional preparation notes and accessible error states
- Shared client/server pricing calculations
- Server validation against the canonical menu instead of browser-supplied prices
- Rejection of changed totals, invalid drinks, unavailable modifiers and incomplete Beast Boxes
- Request-size and quantity limits
- Loading, error and successful confirmation states
- Unique demo order reference generation
- Explicit safeguards: no payment, persistence or kitchen delivery in demo mode
- Development server moved to port 3001

### Provisional values isolated for client approval

- Combo upgrade: $7
- Modifier prices
- Kids' drinks: Water, Apple Juice and Orange Juice
- Franklin Woolworths Carpark location and 12 PM–10 PM trading hours
- 10–15 minute estimated preparation time
- BBQ Beast as the current Beast of the Month

### Integration work still required

- Persistent order creation and restaurant notification
- Square or selected payment-provider connection
- Apple Pay and Google Pay merchant activation
- Real-time truck location and trading-hours management
- Dynamic preparation-time controls
- Drip Points earning from completed orders
- Reward redemption and POS synchronisation
- Final verified dietary and allergen data
- Privacy, terms, refund and loyalty-policy pages
- Official logo, food imagery, social links, analytics and production domain

## 3. Development Schedule

| Date | Workstream | Deliverable |
|---|---|---|
| Aug 29–31 | Foundation and interface | Responsive site, menu, cart, pop-ups and loyalty signup |
| Sep 1–3 | Client content integration | Final descriptions, prices, food images, logo, location and dietary data |
| Sep 4–6 | Ordering and payments | Payment provider, live checkout, Apple Pay and Google Pay |
| Sep 7–8 | Operations and loyalty | Truck status, preparation time and Drip Points order synchronisation |
| Sep 9 | Quality assurance | Mobile testing, accessibility, speed, order-flow and content checks |
| Sep 10 | Production launch | Domain connection, final deployment and launch verification |

## 4. Required Client Inputs

These items should be collected as early as possible:

1. Approval or correction of combo and modifier prices
2. Confirmed kids’ drink choices
3. Logo files and original food photography
4. Payment-provider collaborator access
5. Square application ID and location details, if Square is retained
6. Apple Pay and Google Pay merchant setup status
7. Official Google Maps location link and regular trading schedule
8. Method for updating daily truck location, hours and preparation time
9. Confirmed gluten-free and allergen information
10. Privacy policy, terms, refund policy and loyalty consent wording
11. Confirmed Facebook, Instagram and TikTok URLs
12. Current Beast of the Month details and end date

Do not request passwords from the client. Use collaborator or developer access.

## 5. Recommended Launch Scope

### Must be live by September 10

- Mobile-first menu
- Product customization and combo flow
- Cart drawer
- Real pickup checkout
- Payment confirmation
- Current truck location and hours
- Preparation-time notice
- Loyalty signup
- Core SEO, analytics, security and performance checks

### Can follow after launch

- Full loyalty customer dashboard
- Automated points balance and reward redemption
- Live Instagram API feed
- Advanced sales reporting
- Push notifications
- Multi-location truck scheduling

## 6. Primary Risks

| Risk | Impact | Response |
|---|---|---|
| Payment access arrives late | Checkout cannot be activated | Request collaborator access by September 1 |
| Provisional prices remain unapproved | Incorrect totals may reach checkout | Keep values isolated and block live checkout until approved |
| Dietary information is unverified | Customer-safety and trust risk | Do not publish dietary claims until confirmed |
| Truck status has no editing workflow | Location becomes outdated | Provide a simple admin or structured daily update method |
| Loyalty is not connected to completed orders | Points cannot accumulate correctly | Connect order webhooks before enabling earning and redemption |

## 7. Current Source Note

The manually coded Next.js repository contains the Phase 1–3 work. The checkout interface and server-side submission validation are complete and testable in demo mode. Live payments, durable order storage and restaurant notifications remain intentionally disabled until the client selects a provider and supplies collaborator access.
