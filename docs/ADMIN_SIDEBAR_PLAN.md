# Nasty Burger House — Admin Sidebar Plan

**Status:** Proposal only — navigation additions are **not implemented** until approved.

## Current pages

| Tab | Route | Current state |
| --- | --- | --- |
| Dashboard | `/admin` | Live protected route, intentionally blank for a future custom dashboard; currently accessible through the logo |
| Customers | `/admin/customers` | Live customer management directory |
| Reviews | `/admin/reviews` | Live review moderation |

**Important:** The Orders navigation tab was intentionally removed earlier. Do **not** reintroduce it without an explicit request. The existing order/backend APIs must remain untouched.

## Proposed sidebar structure

### Workspace (priority 1)

1. **Dashboard** — operational overview (currently a blank, protected page)
2. **Customers** — customer directory, account status and customer activity (existing)
3. **Reviews** — moderation and verification (existing)

### Business (priority 2, future)

4. **Menu** — manage burgers, sides, pricing, categories and availability
5. **Drip Points** — loyalty customer balances, earning/redemption rules and adjustments
6. **Promotions** — coupon campaigns, homepage offers and banners

### Insights & administration (priority 3, future)

7. **Reports** — customer, product and sales reporting (only after verified data wiring)
8. **Settings** — business hours, pickup availability, integrations, admin preferences
9. **Team & Access** — roles, invitations and audit history, if more operators require access

This is a **proposed information architecture**, not a claim that these management capabilities, routes or APIs already exist. Final order and labels require approval.

## UX implementation rules

- Reuse the installed macOS Sidebar and shadcn Sheet, Button, Avatar primitives.
- **Flat, non-Bento layout**; compact grouping, clear active item, no floating cards.
- Light and Dark follow `docs/DARK_THEME.md`; no pure black in dark.
- Desktop can collapse to icon-only with accessible names/tooltips. Mobile uses the current shadcn Sheet.
- Navigation items must link to working, permission-checked routes. Do not create dead links, fake metrics or empty public placeholder pages.
- Keep logo/home access, website link, logout, and administrator identity functional.
- Role-specific options are visible only to authorized operators once permission rules are implemented.
- The new admin-only page footer is separate from the public website footer.

## Implementation stages

1. **Approved foundation:** Dashboard / Customers / Reviews links and grouping (retain current routes).
2. **Operations:** Implement Menu / Drip Points / Promotions pages and secure APIs one feature at a time before adding navigation links.
3. **Management:** Implement Reports / Settings / Team only after data, permissions and audit requirements are defined.

**Release policy:** Review `docs/DARK_THEME.md` before design work; test Light/Dark, mobile, keyboard navigation and admin authentication; commit approved changes to `main`; never deploy without explicit user approval.
