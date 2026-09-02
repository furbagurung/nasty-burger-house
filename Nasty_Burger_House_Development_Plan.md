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

### Completed in the first working build

- New website project created from scratch
- Bold Nasty Burger House visual direction
- Responsive desktop and mobile layouts
- Current truck status and location banner
- Cinematic burger hero section
- Beast of the Month feature
- Dedicated Beast Boxes section
- Updated menu without a standalone Combo category
- Updated drinks: Coca-Cola, Coke Zero, Solo, Water, Lemon Lime Bitters and Ginger Beer
- Menu category and dietary filters
- Product-customization modal
- Extra patties, cheese, bacon and sauce modifiers
- Combo upgrades with adult and kids’ drink selection
- Slide-out shopping cart
- Beast Box cart upsell
- Mobile sticky Find Us / Order Now bar
- Drip Points sign-up modal with email and phone
- Persistent loyalty-member database with 500 starting points
- Pop-up frequency control to prevent overlay stacking
- Estimated preparation time display
- Social-media section and platform links
- Compressed WebP food imagery
- Production build validation completed successfully

### Integration work still required

- Real checkout and order submission
- Square or selected payment-provider connection
- Apple Pay and Google Pay merchant activation
- Real-time truck location and trading-hours management
- Dynamic preparation-time controls
- Drip Points earning from completed orders
- Reward redemption and POS synchronisation
- Live or curated Instagram feed connection
- Final verified dietary and allergen data

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

1. Attached Word file with final menu descriptions
2. Final menu prices and modifier prices
3. Confirmed kids’ drink choices
4. Logo files and original food photography
5. Payment-provider collaborator access
6. Square application ID and location details, if Square is retained
7. Apple Pay and Google Pay merchant setup status
8. Official Google Maps location link
9. Method for updating daily truck location and hours
10. Confirmed Halal, gluten-free and allergen information
11. Privacy policy, loyalty terms and customer-consent wording
12. Confirmed Facebook, Instagram and TikTok URLs

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
| Menu Word file is delayed | Incorrect descriptions may launch | Use current menu temporarily and mark content for approval |
| Dietary information is unverified | Customer-safety and trust risk | Do not publish dietary claims until confirmed |
| Truck status has no editing workflow | Location becomes outdated | Provide a simple admin or structured daily update method |
| Loyalty is not connected to completed orders | Points cannot accumulate correctly | Connect order webhooks before enabling earning and redemption |

## 7. Current Review-Build Note

The website completed its production build successfully. The first private publication attempt was stopped by a hosting-platform TLS certificate timeout. No application build error was reported. The saved website version remains intact for a controlled publication retry.
